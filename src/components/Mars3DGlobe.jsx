import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MARS_LOCATIONS } from '../data/marsLocations';

const TREK_3D_LAYERS = {
  Satellite: {
    layerId: 'Mars_Viking_MDIM21_ClrMosaic_global_232m',
    ext: 'jpg',
    baseTexture: '/assets/nasa_jpl_marstrek_satellite_4k.jpg',
    maxZoom: 5
  },
  Elevation: {
    layerId: 'Mars_MGS_MOLA_ClrShade_merge_global_463m',
    ext: 'jpg',
    baseTexture: '/assets/nasa_jpl_marstrek_elevation_4k.jpg',
    maxZoom: 5
  },
  Thermal: {
    layerId: 'THEMIS_DayIR_ControlledMosaics_100m_v2_oct2018',
    ext: 'png',
    baseTexture: '/assets/nasa_themis_thermal_4k.jpg',
    maxZoom: 5
  }
};

function latLngToPosition(lat, lng, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

function parseLatLng(latStr, lngStr) {
  const latVal = parseFloat(latStr) * (latStr.includes('S') ? -1 : 1);
  const lngVal = parseFloat(lngStr) * (lngStr.includes('W') ? -1 : 1);
  return { lat: latVal, lng: lngVal };
}

// Builds curved spherical tile patch matching planetary curvature
function createTilePatchGeometry(latNorth, latSouth, lngWest, lngEast, radius, segments = 6) {
  const geom = new THREE.BufferGeometry();
  const positions = [];
  const uvs = [];
  const indices = [];

  for (let j = 0; j <= segments; j++) {
    const v = j / segments;
    const lat = latSouth + v * (latNorth - latSouth);
    const phi = (90 - lat) * (Math.PI / 180);

    for (let i = 0; i <= segments; i++) {
      const u = i / segments;
      const lng = lngWest + u * (lngEast - lngWest);
      const theta = (lng + 180) * (Math.PI / 180);

      const x = -(radius * Math.sin(phi) * Math.cos(theta));
      const z = radius * Math.sin(phi) * Math.sin(theta);
      const y = radius * Math.cos(phi);

      positions.push(x, y, z);
      uvs.push(u, v);
    }
  }

  for (let j = 0; j < segments; j++) {
    for (let i = 0; i < segments; i++) {
      const a = j * (segments + 1) + i;
      const b = (j + 1) * (segments + 1) + i;
      const c = (j + 1) * (segments + 1) + (i + 1);
      const d = j * (segments + 1) + (i + 1);

      indices.push(a, d, b);
      indices.push(b, d, c);
    }
  }

  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

export default function Mars3DGlobe({
  selectedLocation,
  onSelectLocation,
  globalView = 'Mars Global View',
  viewMode = 'Satellite',
  zoomLevel = 1.0,
  isExpanded = false
}) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const globeMeshRef = useRef(null);
  const tilesGroupRef = useRef(null);
  const tilesCacheRef = useRef(new Map());
  const activeTileKeysRef = useRef(new Set());
  const textureLoaderRef = useRef(new THREE.TextureLoader());
  const markerMeshesRef = useRef([]);
  const markersGroupRef = useRef(null);
  const selectedLocationRef = useRef(selectedLocation);
  useEffect(() => {
    selectedLocationRef.current = selectedLocation;
  }, [selectedLocation]);

  // Handle smooth resize on fullscreen expansion / collapse
  useEffect(() => {
    const resizeHandler = () => {
      const container = containerRef.current;
      const camera = cameraRef.current;
      const renderer = rendererRef.current;
      if (!container || !camera || !renderer) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      if (newWidth === 0 || newHeight === 0) return;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    const t0 = setTimeout(resizeHandler, 20);
    const t1 = setTimeout(resizeHandler, 150);
    const t2 = setTimeout(resizeHandler, 350);
    const t3 = setTimeout(resizeHandler, 550);
    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isExpanded]);

  // Smooth fly-to camera animation refs
  const isFlyingRef = useRef(false);
  const flyProgressRef = useRef(0);
  const startQuatRef = useRef(new THREE.Quaternion());
  const endQuatRef = useRef(new THREE.Quaternion());
  const startDistRef = useRef(4.8);
  const endDistRef = useRef(4.8);

  const [hoveredLocation, setHoveredLocation] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const activeLayerConfig = TREK_3D_LAYERS[viewMode] || TREK_3D_LAYERS.Satellite;

  // Trigger smooth geodesic fly-to to target coordinates
  const flyToLatLng = useCallback((lat, lng, targetDist = 3.2) => {
    if (!cameraRef.current) return;
    const camera = cameraRef.current;

    const currentPos = camera.position.clone();
    const currentDist = currentPos.length();
    const currentDir = currentPos.normalize();

    const targetPos = latLngToPosition(lat, lng, 1.0);
    const targetDir = targetPos.normalize();

    const zAxis = new THREE.Vector3(0, 0, 1);
    startQuatRef.current.setFromUnitVectors(zAxis, currentDir);
    endQuatRef.current.setFromUnitVectors(zAxis, targetDir);

    startDistRef.current = currentDist;
    endDistRef.current = targetDist;
    flyProgressRef.current = 0;
    isFlyingRef.current = true;
  }, []);

  // Handle region dropdown selection fly-to
  useEffect(() => {
    switch (globalView) {
      case 'Equatorial Basin':
        flyToLatLng(-14.0, -59.3, 3.0 / Math.max(0.7, zoomLevel));
        break;
      case 'Polar Ice Caps':
        flyToLatLng(82.0, 15.0, 2.9 / Math.max(0.7, zoomLevel));
        break;
      case 'Tharsis Rise':
        flyToLatLng(18.7, -133.8, 2.8 / Math.max(0.7, zoomLevel));
        break;
      case 'Mars Global View':
      default:
        flyToLatLng(12.0, -35.0, 4.8 / Math.max(0.7, zoomLevel));
        break;
    }
  }, [globalView, flyToLatLng]);

  // Adjust camera distance when zoomLevel prop changes from UI buttons
  useEffect(() => {
    if (cameraRef.current && controlsRef.current && !isFlyingRef.current) {
      const currentPos = cameraRef.current.position.clone();
      const currentDir = currentPos.normalize();
      const baseDist = globalView === 'Mars Global View' ? 4.8 : 3.0;
      const targetDist = Math.max(2.28, Math.min(6.5, baseDist / Math.max(0.6, zoomLevel)));
      cameraRef.current.position.copy(currentDir.multiplyScalar(targetDist));
      controlsRef.current.update();
    }
  }, [zoomLevel, globalView]);

  // Update selected location marker visual state, dynamically spawn pin if new, and smoothly fly to it
  useEffect(() => {
    if (!selectedLocation?.id) return;

    // Check if marker mesh already exists in globe scene
    let existingMesh = markerMeshesRef.current.find(
      (m) => m.userData.location?.id === selectedLocation.id
    );

    // If it's a newly searched location not yet in the globe scene, spawn it dynamically!
    if (!existingMesh && markersGroupRef.current && selectedLocation.coords?.lat && selectedLocation.coords?.lng) {
      const { lat, lng } = parseLatLng(selectedLocation.coords.lat, selectedLocation.coords.lng);
      const markerPos = latLngToPosition(lat, lng, 2.0 * 1.008);

      const pinGeom = new THREE.SphereGeometry(0.020, 16, 16);
      const pinMat = new THREE.MeshBasicMaterial({ color: 0xFF3B30 });
      const pinMesh = new THREE.Mesh(pinGeom, pinMat);
      pinMesh.position.copy(markerPos);
      pinMesh.userData = { location: selectedLocation };
      markersGroupRef.current.add(pinMesh);

      const ringGeom = new THREE.RingGeometry(0.028, 0.038, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xFF3B30,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.95
      });
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      ringMesh.position.copy(markerPos);
      ringMesh.lookAt(new THREE.Vector3(0, 0, 0));
      markersGroupRef.current.add(ringMesh);
      pinMesh.userData.ring = ringMesh;

      markerMeshesRef.current.push(pinMesh);
    }

    markerMeshesRef.current.forEach((mesh) => {
      const isSelected = selectedLocation.id === mesh.userData.location?.id;
      if (mesh.material) {
        mesh.material.color.setHex(isSelected ? 0xFF3B30 : 0xFFFFFF);
      }
    });

    if (selectedLocation.coords?.lat && selectedLocation.coords?.lng) {
      const { lat, lng } = parseLatLng(selectedLocation.coords.lat, selectedLocation.coords.lng);
      flyToLatLng(lat, lng, 2.8);
    }
  }, [selectedLocation?.id, selectedLocation?.coords?.lat, selectedLocation?.coords?.lng, flyToLatLng]);

  // Dynamic Mars Trek Tile LOD Manager
  const updateDynamicLODTiles = useCallback(() => {
    const camera = cameraRef.current;
    const tilesGroup = tilesGroupRef.current;
    if (!camera || !tilesGroup) return;

    const camPos = camera.position;
    const camDist = camPos.length();
    const R = 2.0;

    // Determine required WMTS tile zoom level based on camera proximity
    let targetZ = 0;
    if (camDist <= 2.65) {
      targetZ = 4;
    } else if (camDist <= 3.5) {
      targetZ = 3;
    }

    if (targetZ === 0) {
      // Hide all dynamic tile patches at high orbit; 4K base sphere provides full coverage
      tilesCacheRef.current.forEach((tileMesh) => {
        tileMesh.visible = false;
      });
      activeTileKeysRef.current.clear();
      return;
    }

    const numRows = Math.pow(2, targetZ);
    const numCols = Math.pow(2, targetZ + 1);
    const latRange = 180 / numRows;
    const lngRange = 360 / numCols;

    const camDir = camPos.clone().normalize();
    const horizonAngle = Math.acos(R / Math.max(R + 0.01, camDist));
    const maxVisibleAngle = horizonAngle + 0.35;

    const activeTileKeys = new Set();
    activeTileKeysRef.current = activeTileKeys;
    const radiusPatch = R * 1.001;

    for (let r = 0; r < numRows; r++) {
      const latNorth = 90 - r * latRange;
      const latSouth = 90 - (r + 1) * latRange;
      const latMid = (latNorth + latSouth) / 2;

      for (let c = 0; c < numCols; c++) {
        const lngWest = -180 + c * lngRange;
        const lngEast = -180 + (c + 1) * lngRange;
        const lngMid = (lngWest + lngEast) / 2;

        const tileDir = latLngToPosition(latMid, lngMid, 1.0).normalize();
        const angle = camDir.angleTo(tileDir);

        if (angle <= maxVisibleAngle) {
          const key = `${activeLayerConfig.layerId}_${targetZ}_${r}_${c}`;
          activeTileKeys.add(key);

          let tileMesh = tilesCacheRef.current.get(key);
          if (!tileMesh) {
            const tileGeom = createTilePatchGeometry(latNorth, latSouth, lngWest, lngEast, radiusPatch, 6);
            const tileUrl = `https://trek.nasa.gov/tiles/Mars/EQ/${activeLayerConfig.layerId}/1.0.0/default/default028mm/${targetZ}/${r}/${c}.${activeLayerConfig.ext}`;

            const tileMat = new THREE.MeshStandardMaterial({
              roughness: 0.86,
              metalness: 0.04,
              polygonOffset: true,
              polygonOffsetFactor: -1,
              polygonOffsetUnits: -1
            });

            tileMesh = new THREE.Mesh(tileGeom, tileMat);
            tileMesh.userData = { key, z: targetZ, loaded: false };
            tileMesh.visible = false; // NEVER VISIBLE BEFORE IMAGE IS READY TO PREVENT BLACK RECTANGLES
            tilesGroup.add(tileMesh);
            tilesCacheRef.current.set(key, tileMesh);

            textureLoaderRef.current.load(
              tileUrl,
              (tileTex) => {
                tileTex.colorSpace = THREE.SRGBColorSpace;
                tileMat.map = tileTex;
                tileMat.needsUpdate = true;
                tileMesh.userData.loaded = true;
                // Only make visible if this tile is still in the active visible set
                if (activeTileKeysRef.current.has(key)) {
                  tileMesh.visible = true;
                }
              },
              undefined,
              () => {
                // If tile request fails or is aborted, keep hidden so base globe remains visible
                tileMesh.visible = false;
              }
            );
          } else if (tileMesh.userData.loaded) {
            tileMesh.visible = true;
          }
        }
      }
    }

    // Hide any cached tiles not in the current visible set
    tilesCacheRef.current.forEach((tileMesh, key) => {
      if (!activeTileKeys.has(key)) {
        tileMesh.visible = false;
      }
    });
  }, [activeLayerConfig]);

  // Main Three.js Scene Setup
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera with small near plane to eliminate near clipping artifacts
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.02, 100);
    const initialPos = latLngToPosition(12.0, -35.0, 4.8);
    camera.position.copy(initialPos);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. OrbitControls - Natural, Proportional Planetary Orbiting
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.rotateSpeed = 0.65;
    controls.minDistance = 2.26; // Safe altitude above 2.0 surface and atmosphere
    controls.maxDistance = 6.8;
    controls.enablePan = false;
    controlsRef.current = controls;

    controls.addEventListener('start', () => {
      isFlyingRef.current = false;
    });

    // 5. Lighting - Martian Sun & Ambient Rayleigh Scatter
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.65);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xFFF4EC, 2.0);
    sunLight.position.set(6, 4, 5);
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x7799CC, 0.45);
    rimLight.position.set(-6, -2, -4);
    scene.add(rimLight);

    // Deep Space Starfield Background
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 500;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      const radius = 25 + Math.random() * 20;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      starPositions[i] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[i + 2] = radius * Math.cos(phi);
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({
      color: 0xCCCCCC,
      size: 0.12,
      transparent: true,
      opacity: 0.6
    });
    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);

    // 6. Base Mars Globe Sphere with 4K Texture & Topographical Relief
    const sphereRadius = 2.0;
    const geometry = new THREE.SphereGeometry(sphereRadius, 64, 64);

    const marsTexture = textureLoaderRef.current.load(activeLayerConfig.baseTexture);
    marsTexture.colorSpace = THREE.SRGBColorSpace;

    const bumpTexture = textureLoaderRef.current.load('/assets/nasa_jpl_marstrek_elevation_4k.jpg');

    const material = new THREE.MeshStandardMaterial({
      map: marsTexture,
      bumpMap: bumpTexture,
      bumpScale: 0.038,
      roughness: 0.86,
      metalness: 0.04
    });

    const globe = new THREE.Mesh(geometry, material);
    scene.add(globe);
    globeMeshRef.current = globe;

    // 7. Dynamic High-Resolution Mars Trek Tile Overlay Group
    const tilesGroup = new THREE.Group();
    scene.add(tilesGroup);
    tilesGroupRef.current = tilesGroup;

    // Atmospheric Glow Halo (depthWrite: false ensures no occlusion artifacts)
    const atmosphereGeometry = new THREE.SphereGeometry(sphereRadius * 1.018, 48, 48);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: 0xEE6633,
      transparent: true,
      opacity: 0.16,
      side: THREE.BackSide,
      depthWrite: false
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphere);

    const outerAtmoGeometry = new THREE.SphereGeometry(sphereRadius * 1.036, 48, 48);
    const outerAtmoMaterial = new THREE.MeshBasicMaterial({
      color: 0x88AADD,
      transparent: true,
      opacity: 0.07,
      side: THREE.BackSide,
      depthWrite: false
    });
    const outerAtmosphere = new THREE.Mesh(outerAtmoGeometry, outerAtmoMaterial);
    scene.add(outerAtmosphere);

    // 8. Exploration Waypoint Pins with Dynamic Perspective Scaling
    const markersGroup = new THREE.Group();
    scene.add(markersGroup);
    markersGroupRef.current = markersGroup;

    const locationList = Object.values(MARS_LOCATIONS);
    const markerMeshes = [];

    locationList.forEach((loc) => {
      const { lat, lng } = parseLatLng(loc.coords.lat, loc.coords.lng);
      const markerPos = latLngToPosition(lat, lng, sphereRadius * 1.008);

      const isSelected = selectedLocation?.id === loc.id;
      // Base pin geometry (compact radius 0.020 so it never obstructs terrain when zoomed in)
      const pinGeom = new THREE.SphereGeometry(0.020, 16, 16);
      const pinMat = new THREE.MeshBasicMaterial({
        color: isSelected ? 0xFF3B30 : 0xFFFFFF
      });
      const pinMesh = new THREE.Mesh(pinGeom, pinMat);
      pinMesh.position.copy(markerPos);
      pinMesh.userData = { location: loc };
      markersGroup.add(pinMesh);
      markerMeshes.push(pinMesh);

      // Sleek waypoint ring target reticle
      const ringGeom = new THREE.RingGeometry(0.028, 0.038, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: loc.id === 'proposed_base' ? 0xFF4522 : (isSelected ? 0xFF3B30 : 0xEEEEEE),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: loc.id === 'proposed_base' || isSelected ? 0.9 : 0.65
      });
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      ringMesh.position.copy(markerPos);
      ringMesh.lookAt(new THREE.Vector3(0, 0, 0));
      markersGroup.add(ringMesh);
      pinMesh.userData.ring = ringMesh;
    });

    markerMeshesRef.current = markerMeshes;

    // 9. Raycasting & Screen-Space Proximity for effortless marker clicks and hover
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const getIntersectedPin = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      // Direct raycast intersection
      const intersects = raycaster.intersectObjects(markerMeshes);
      if (intersects.length > 0) return intersects[0].object;

      // Screen-space proximity fallback (24px radius) so pins remain easy to click even when scaled small
      let closestPin = null;
      let minScreenDist = 24;
      const screenPos = new THREE.Vector3();

      markerMeshes.forEach((mesh) => {
        screenPos.copy(mesh.position).project(camera);
        if (screenPos.z > 1.0) return; // behind camera view plane

        // Front-facing check: ensure marker is on the visible front hemisphere of Mars
        const toCam = camera.position.clone().sub(mesh.position);
        if (toCam.dot(mesh.position) < 0) return;

        const px = ((screenPos.x + 1) / 2) * rect.width;
        const py = ((-screenPos.y + 1) / 2) * rect.height;
        const clientX = e.clientX - rect.left;
        const clientY = e.clientY - rect.top;
        const dist = Math.hypot(px - clientX, py - clientY);
        if (dist < minScreenDist) {
          minScreenDist = dist;
          closestPin = mesh;
        }
      });

      return closestPin;
    };

    const handleCanvasClick = (e) => {
      const hit = getIntersectedPin(e);
      if (hit && hit.userData.location && onSelectLocation) {
        onSelectLocation(hit.userData.location);
      }
    };

    const onMouseMove = (e) => {
      const hit = getIntersectedPin(e);
      if (hit && hit.userData.location) {
        setHoveredLocation(hit.userData.location);
        const rect = container.getBoundingClientRect();
        setTooltipPos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
        renderer.domElement.style.cursor = 'pointer';
      } else {
        setHoveredLocation(null);
        renderer.domElement.style.cursor = 'grab';
      }
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('click', handleCanvasClick);
    domElement.addEventListener('mousemove', onMouseMove);

    // 10. Animation Loop
    let animationFrameId;
    let lastLODCheck = 0;

    const animate = (time) => {
      animationFrameId = requestAnimationFrame(animate);

      // Smooth geodesic fly-to camera interpolation
      if (isFlyingRef.current) {
        flyProgressRef.current += 0.024;
        if (flyProgressRef.current >= 1.0) {
          flyProgressRef.current = 1.0;
          isFlyingRef.current = false;
        }

        const t = flyProgressRef.current;
        const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

        const qCurrent = startQuatRef.current.clone().slerp(endQuatRef.current, ease);
        const dir = new THREE.Vector3(0, 0, 1).applyQuaternion(qCurrent);
        const dist = THREE.MathUtils.lerp(startDistRef.current, endDistRef.current, ease);

        camera.position.copy(dir.multiplyScalar(dist));
      }

      // DYNAMIC PROPORTIONAL ROTATION SPEED:
      // When zoomed out (high orbit, dist ~ 5.5): rotateSpeed is ~0.70 (fast, responsive planet spin)
      // When zoomed in (close to surface, dist ~ 2.3): rotateSpeed scales down to ~0.13 (slow, gentle, precise inspection)
      const camDist = camera.position.length();
      const distRatio = Math.max(0, Math.min(1, (camDist - 2.25) / (5.5 - 2.25)));
      controls.rotateSpeed = 0.13 + 0.57 * Math.pow(distRatio, 1.3);

      controls.update();

      // DYNAMIC PERSPECTIVE SCALING FOR WAYPOINT PINS:
      // When far away (high orbit ~ 5.5), scale is 1.0 (crisp, visible dots).
      // When zoomed in close to the surface (~ 2.26 - 2.8), scale smoothly shrinks down to 0.12 - 0.18,
      // keeping points small, sharp, and never covering craters or canyon features.
      const currentCamPos = camera.position;
      const currentSelectedId = selectedLocationRef.current?.id;

      markerMeshesRef.current.forEach((mesh) => {
        const distToCam = currentCamPos.distanceTo(mesh.position);
        const dynamicScale = Math.max(0.12, Math.min(1.0, (distToCam - 0.12) / 3.0));
        const isSelected = currentSelectedId === mesh.userData.location?.id;
        const finalScale = dynamicScale * (isSelected ? 1.35 : 1.0);

        mesh.scale.setScalar(finalScale);

        if (mesh.userData.ring) {
          const ringPulse = (isSelected || mesh.userData.location?.id === 'proposed_base')
            ? 1.0 + 0.12 * Math.sin(time * 0.006)
            : 1.0;
          mesh.userData.ring.scale.setScalar(finalScale * ringPulse);
        }

        if (mesh.material) {
          mesh.material.color.setHex(isSelected ? 0xFF3B30 : 0xFFFFFF);
        }
      });

      // Throttled dynamic tile LOD check every ~150ms
      if (time - lastLODCheck > 150) {
        lastLODCheck = time;
        updateDynamicLODTiles();
      }

      renderer.render(scene, camera);
    };
    animate(0);

    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      if (newWidth === 0 || newHeight === 0) return;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);
    const ro = new ResizeObserver(handleResize);
    ro.observe(container);

    return () => {
      ro.disconnect();
      cancelAnimationFrame(animationFrameId);
      controls.dispose();
      domElement.removeEventListener('click', handleCanvasClick);
      domElement.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', handleResize);
      if (domElement && domElement.parentNode) {
        domElement.parentNode.removeChild(domElement);
      }
      geometry.dispose();
      material.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
      renderer.dispose();
      markersGroupRef.current = null;
    };
  }, [viewMode, updateDynamicLODTiles, activeLayerConfig]);

  return (
    <div
      ref={containerRef}
      className="mars-3d-globe-canvas-wrap"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        cursor: 'grab'
      }}
    >
      {/* Floating Hover Badge on 3D Marker */}
      {hoveredLocation && (
        <div
          className="globe-3d-hover-badge"
          style={{
            position: 'absolute',
            left: `${tooltipPos.x + 12}px`,
            top: `${tooltipPos.y - 32}px`,
            pointerEvents: 'none',
            zIndex: 30,
            background: 'rgba(12, 14, 18, 0.90)',
            border: '1px solid rgba(255, 255, 255, 0.22)',
            backdropFilter: 'blur(8px)',
            borderRadius: '6px',
            padding: '4px 10px',
            color: '#FFFFFF',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.04em',
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
            whiteSpace: 'nowrap'
          }}
        >
          <span>{hoveredLocation.name}</span>
          {hoveredLocation.coords?.elev && (
            <span style={{ opacity: 0.65, marginLeft: '6px', fontWeight: 400 }}>
              {hoveredLocation.coords.elev}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
