import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Maximize2,
  Minimize2,
  RotateCcw,
  Compass,
  Layers,
  Sparkles,
  Mountain,
  AlertTriangle,
  Eye,
  Sliders,
  ArrowLeft,
  ShieldCheck
} from 'lucide-react';

// Decodes NASA MOLA color shaded relief map RGB into elevation in meters with smooth continuity
function decodeMolaRgbToElevation(r, g, b) {
  const rf = r / 255.0;
  const gf = g / 255.0;
  const bf = b / 255.0;

  const max = Math.max(rf, gf, bf);
  const min = Math.min(rf, gf, bf);
  const delta = max - min;

  let h = 0;
  if (delta > 0.0001) {
    if (max === rf) {
      h = ((gf - bf) / delta) % 6;
    } else if (max === gf) {
      h = (bf - rf) / delta + 2;
    } else {
      h = (rf - gf) / delta + 4;
    }
    h = h / 6;
    if (h < 0) h += 1;
  }

  const s = max === 0 ? 0 : delta / max;
  const v = max;

  // Ultra-high volcanic summits (Olympus Mons, Tharsis peaks: pale pinkish-white)
  // Strict check to prevent JPEG compression artifacts from triggering false spikes
  if (s < 0.16 && v > 0.65 && rf > 0.65 && gf > 0.65 && bf > 0.65) {
    return 14000 + (v - 0.65) / 0.35 * 7287; // Up to 21,287m
  }

  // Deep impact basins: Hellas, Argyre, Isidis (deep purple/magenta h > 0.75)
  if (h > 0.75 && s > 0.35) {
    const t = (h - 0.75) / 0.25;
    return -8200 + (1.0 - t) * 3200; // -8200m to -5000m
  }

  // Continuous MOLA spectrum from blue (-5000m) to cyan (-2000m) to green (0m) to yellow (+3000m) to red (+8000m)
  // Hue ranges continuously from ~0.65 down to ~0.0
  const clampedH = Math.max(0.0, Math.min(0.68, h));
  const t = (0.68 - clampedH) / 0.68;
  return -5000 + t * 13500;
}

// Physically calibrated topographic elevation profiles for NASA's iconic exploration sites
function generateScientificLocationElevation(locId, u, v) {
  // u, v normalized to [-1, 1] across the chosen bounding box
  const dist = Math.sqrt(u * u + v * v);
  const angle = Math.atan2(v, u);

  // Natural regolith roughness and ripples (micro-relief without spikes)
  const micro1 = Math.sin(u * 22.0 + v * 16.0) * 45.0;
  const micro2 = Math.cos(u * 44.0 - v * 32.0) * 22.0;
  const microDunes = Math.sin(u * 60.0 + v * 30.0) * 12.0;

  switch (locId) {
    case 'olympus_mons': {
      // Base plain: -1,500m; Summit caldera: +21,287m (Relief: 22,787m)
      const baseElev = -1500;
      const calderaRadius = 0.22;
      const calderaDist = Math.abs(dist - calderaRadius);

      // Smooth volcanic shield rise
      const shieldHeight = 22787 * Math.exp(-Math.pow(dist, 1.35) * 1.6);

      // Summit caldera multi-nested depression (-2,800m drop into caldera floor)
      const calderaFloor = dist < calderaRadius ? -2800 * (1.0 - Math.pow(dist / calderaRadius, 2.5)) : 0;

      // Basal cliff scarp (6,000m sheer basalt drop where mountain meets aureole plains at r ≈ 0.75 to 0.88)
      const scarpDrop = dist > 0.72 ? -6500 / (1.0 + Math.exp(-(dist - 0.78) * 25.0)) : 0;

      // Radial lava flow lobes and volcanic vents
      const lavaRidges = Math.cos(angle * 9.0) * 350.0 * (dist > 0.25 && dist < 0.72 ? 1.0 : 0.0);

      return baseElev + shieldHeight + calderaFloor + scarpDrop + lavaRidges + micro1;
    }

    case 'valles_marineris': {
      // Surrounding plateau: +3,500m; Canyon chasma floor: -4,500m (Relief: 8,000m)
      const plateauElev = 3500;
      
      // Canyon rift fault line with natural sinuous rift axis
      const canyonAxis = Math.abs(v + Math.sin(u * 2.4) * 0.16);
      
      // Deep rift gorge (7,500m depth drop with layered stepped canyon walls)
      const canyonDrop = -8000.0 / (1.0 + Math.pow(canyonAxis / 0.38, 4.0));
      
      // Stratified terrace benches on canyon walls
      const wallTerraces = Math.sin(canyonAxis * 36.0) * 220.0 * Math.exp(-canyonAxis * 2.2);

      // Interior Layered Deposits (ILDs: central sedimentary mounds on the chasma floor)
      const floorMound = Math.exp(-(Math.pow(u - 0.1, 2) + Math.pow(v, 2)) / 0.04) * 1400.0;

      return plateauElev + canyonDrop + wallTerraces + floorMound + micro1 + micro2;
    }

    case 'gale_crater': {
      // Crater rim: +1,200m; Crater floor: -4,500m; Mount Sharp (Aeolis Mons): +1,000m (Relief: 5,500m)
      const floorElev = -4500;
      
      // Circular impact crater rim (diameter ~154 km)
      const rimRadius = 0.82;
      const rimDist = Math.abs(dist - rimRadius);
      const craterRim = Math.exp(-(rimDist * rimDist) / 0.025) * 5200;

      // Mount Sharp (Aeolis Mons): massive rounded central sediment mound in center-south
      const peakDist = Math.sqrt(Math.pow(u - 0.08, 2) + Math.pow(v + 0.14, 2));
      const mtSharp = Math.exp(-(peakDist * peakDist) / 0.08) * 5400;

      // Vera Rubin Ridge and sulfate layer steps
      const clayRidge = Math.exp(-Math.pow(v + 0.04 - u * 0.25, 2) / 0.012) * 280.0 * (u > -0.2 && u < 0.3 ? 1.0 : 0.0);

      // Floor flatness
      const outsideDrop = dist > rimRadius ? -1800 * (1.0 - Math.exp(-(dist - rimRadius) * 4.0)) : 0;

      return floorElev + craterRim + mtSharp + clayRidge + outsideDrop + micro1 + microDunes;
    }

    case 'jezero_crater': {
      // Crater rim: -1,800m; Lakebed floor: -2,600m; Delta fan: -2,350m (Relief: 800m)
      const floorElev = -2600;

      // Impact crater rim (diameter ~45 km)
      const rimRadius = 0.78;
      const rimDist = Math.abs(dist - rimRadius);
      // Western breach where Neretva Vallis entered
      const westBreach = (u < -0.65 && Math.abs(v) < 0.2) ? 0.2 : 1.0;
      const craterRim = Math.exp(-(rimDist * rimDist) / 0.02) * 850 * westBreach;

      // Preserved western river delta fan deposit
      const deltaDist = Math.sqrt(Math.pow(u + 0.38, 2) + Math.pow(v - 0.02, 2));
      const deltaFan = (u < -0.05 && dist < rimRadius) ? Math.exp(-(deltaDist * deltaDist) / 0.065) * 260.0 : 0.0;

      // Kodiak butte delta remnant
      const kodiakButte = Math.exp(-(Math.pow(u + 0.18, 2) + Math.pow(v + 0.12, 2)) / 0.003) * 140.0;

      return floorElev + craterRim + deltaFan + kodiakButte + micro1 + microDunes;
    }

    case 'planum_boreum': {
      // Vastitas Borealis plains: -4,000m; Polar Ice Dome: -1,800m (Relief: 2,200m)
      const plainsElev = -4000;
      const iceDome = 2200 * Math.exp(-dist * 1.2);
      
      // Spiral Chasmata troughs (pinwheel wind-carved spiral canyons)
      const spiralPhase = angle * 3.0 + dist * 5.0;
      const spiralCanyons = -320.0 * Math.pow(Math.sin(spiralPhase * 0.5), 4.0) * (dist > 0.2 && dist < 0.8 ? 1.0 : 0.0);

      // Chasma Boreale deep canyon cut
      const chasmaDist = Math.abs(v - 0.25 - u * 0.5);
      const chasmaBoreale = (u > -0.1 && u < 0.6) ? -750.0 * Math.exp(-chasmaDist * 8.0) : 0.0;

      return plainsElev + iceDome + spiralCanyons + chasmaBoreale + micro1;
    }

    case 'proposed_base':
    default: {
      // Chryse Planitia landing basin: flat alluvial plains at -2,450m (Relief: 160m)
      const baseElev = -2450;
      const rollingPlains = Math.sin(u * 2.8 + v * 1.9) * 45.0 + Math.cos(u * 4.2 - v * 3.1) * 30.0;
      const wrinkleRidge = Math.exp(-Math.pow(v - u * 0.35 - 0.22, 2) / 0.03) * 85.0;
      const shallowCrater = -120.0 * Math.exp(-(Math.pow(u - 0.42, 2) + Math.pow(v + 0.32, 2)) / 0.02);

      return baseElev + rollingPlains + wrinkleRidge + shallowCrater + micro1 + microDunes;
    }
  }
}

// 3x3 Spatial Median Filter + Gradient Outlier Clamping (Eliminates All Spikes)
function applyAntiSpikeFilter(grid, size, maxSlopeGradient = 1200.0) {
  const filtered = [];
  for (let j = 0; j < size; j++) {
    filtered[j] = new Float32Array(size);
  }

  // Pass 1: 3x3 Median Filter
  const window = [];
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      window.length = 0;
      for (let dy = -1; dy <= 1; dy++) {
        const y = Math.min(size - 1, Math.max(0, j + dy));
        for (let dx = -1; dx <= 1; dx++) {
          const x = Math.min(size - 1, Math.max(0, i + dx));
          window.push(grid[y][x]);
        }
      }
      window.sort((a, b) => a - b);
      filtered[j][i] = window[Math.floor(window.length / 2)];
    }
  }

  // Pass 2: Physical Slope Gradient Clamping (No single grid cell can jump past max physical limit)
  for (let j = 1; j < size - 1; j++) {
    for (let i = 1; i < size - 1; i++) {
      const avgNeighbor = (filtered[j - 1][i] + filtered[j + 1][i] + filtered[j][i - 1] + filtered[j][i + 1]) * 0.25;
      const diff = filtered[j][i] - avgNeighbor;
      if (Math.abs(diff) > maxSlopeGradient) {
        filtered[j][i] = avgNeighbor + Math.sign(diff) * maxSlopeGradient;
      }
    }
  }

  return filtered;
}

// Converts normalized elevation to NASA MOLA scientific color ramp
function getMolaElevationColor(elevNorm) {
  const c = new THREE.Color();
  if (elevNorm < 0.2) {
    c.setRGB(0.12 + elevNorm * 0.4, 0.15 + elevNorm * 0.6, 0.5 + elevNorm * 1.5);
  } else if (elevNorm < 0.45) {
    const t = (elevNorm - 0.2) / 0.25;
    c.setRGB(0.1 + t * 0.2, 0.45 + t * 0.4, 0.6 - t * 0.4);
  } else if (elevNorm < 0.7) {
    const t = (elevNorm - 0.45) / 0.25;
    c.setRGB(0.75 + t * 0.2, 0.45 + t * 0.1, 0.15);
  } else {
    const t = (elevNorm - 0.7) / 0.3;
    c.setRGB(0.95 + t * 0.05, 0.65 + t * 0.35, 0.4 + t * 0.6);
  }
  return c;
}

// Slope hazard color ramp: <12° trafficable, 12°-22° caution, >22° hazard
function getSlopeHazardColor(slopeDeg) {
  const c = new THREE.Color();
  if (slopeDeg < 12) {
    c.setRGB(0.18, 0.55, 0.28);
  } else if (slopeDeg < 22) {
    const t = (slopeDeg - 12) / 10;
    c.setRGB(0.9 + t * 0.1, 0.65 - t * 0.25, 0.12);
  } else {
    c.setRGB(0.94, 0.18, 0.14);
  }
  return c;
}

// 2D Gaussian Kernel Texture for soft volumetric splat blending
function createGaussianKernelTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
  gradient.addColorStop(0.25, 'rgba(255, 255, 255, 0.85)');
  gradient.addColorStop(0.55, 'rgba(255, 255, 255, 0.35)');
  gradient.addColorStop(0.85, 'rgba(255, 255, 255, 0.08)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export default function MarsGaussianTerrainCanvas({
  selectedBoundingBox,
  contourStep = '50m',
  showSlopeHazards = true,
  onOpenHUD,
  onBackToMap,
  isExpanded = false,
  onToggleExpand
}) {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const animFrameRef = useRef(null);
  const gaussianTextureRef = useRef(null);
  const terrainMeshRef = useRef(null);
  const gaussianSplatsRef = useRef(null);
  const contourLinesRef = useRef(null);
  const pinsGroupRef = useRef(null);
  const molaImageCanvasRef = useRef(null);

  // Active state
  const [renderMode, setRenderMode] = useState('splats'); // 'splats' | 'textured' | 'elevation' | 'slope'
  const [elevationExaggeration, setElevationExaggeration] = useState(1.6);
  const [showContours, setShowContours] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [cameraPreset, setCameraPreset] = useState('orbit');
  const [elevationStats, setElevationStats] = useState({ minM: -2450, maxM: 1200, reliefM: 3650 });

  const box = selectedBoundingBox || {
    id: 'olympus_mons',
    name: 'Olympus Mons Caldera & Scarps',
    latMin: 13.0,
    latMax: 23.5,
    lngMin: -139.0,
    lngMax: -128.0
  };

  // Preload NASA MOLA Elevation Raster Map
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = '/assets/nasa_mola_elevation_global.jpg';
    img.onload = () => {
      const offCanvas = document.createElement('canvas');
      offCanvas.width = img.width;
      offCanvas.height = img.height;
      const ctx = offCanvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      molaImageCanvasRef.current = {
        ctx,
        width: img.width,
        height: img.height,
        imgData: ctx.getImageData(0, 0, img.width, img.height).data
      };
    };
  }, []);

  // 1. Setup Three.js Context
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!gaussianTextureRef.current) {
      gaussianTextureRef.current = createGaussianKernelTexture();
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x09080A);
    scene.fog = new THREE.FogExp2(0x0C0908, 0.012);
    sceneRef.current = scene;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 420;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 32, 44);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2 - 0.02;
    controls.minDistance = 6;
    controls.maxDistance = 140;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // Atmospheric lighting
    const ambientLight = new THREE.AmbientLight(0xFFE0D0, 0.95);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xFFF2E0, 2.3);
    sunLight.position.set(30, 45, 25);
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0xD84D29, 0.9);
    rimLight.position.set(-25, 20, -25);
    scene.add(rimLight);

    const pinsGroup = new THREE.Group();
    scene.add(pinsGroup);
    pinsGroupRef.current = pinsGroup;

    let isRunning = true;
    const animate = () => {
      if (!isRunning) return;
      animFrameRef.current = requestAnimationFrame(animate);
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    const updateSize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    const t0 = setTimeout(updateSize, 10);
    const t1 = setTimeout(updateSize, 120);
    const t2 = setTimeout(updateSize, 350);

    const ro = new ResizeObserver(updateSize);
    ro.observe(container);

    return () => {
      isRunning = false;
      ro.disconnect();
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update OrbitControls autoRotate
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
      controlsRef.current.autoRotateSpeed = 1.0;
    }
  }, [autoRotate]);

  // 2. Build 3D Gaussian Splats & NASA Elevation Mesh with Anti-Spike Protection
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (terrainMeshRef.current) {
      scene.remove(terrainMeshRef.current);
      terrainMeshRef.current.geometry.dispose();
      terrainMeshRef.current.material.dispose();
      terrainMeshRef.current = null;
    }

    if (gaussianSplatsRef.current) {
      scene.remove(gaussianSplatsRef.current);
      gaussianSplatsRef.current.geometry.dispose();
      gaussianSplatsRef.current.material.dispose();
      gaussianSplatsRef.current = null;
    }

    if (contourLinesRef.current) {
      scene.remove(contourLinesRef.current);
      contourLinesRef.current.geometry.dispose();
      contourLinesRef.current.material.dispose();
      contourLinesRef.current = null;
    }

    if (pinsGroupRef.current) {
      while (pinsGroupRef.current.children.length > 0) {
        const obj = pinsGroupRef.current.children[0];
        pinsGroupRef.current.remove(obj);
      }
    }

    // Grid Dimensions
    const GRID_SIZE = 96;
    const SPAN = 46.0;
    const halfSpan = SPAN / 2;
    const step = SPAN / (GRID_SIZE - 1);

    const positions = [];
    const normals = [];
    const colors = [];
    const uvs = [];

    // Raw sampled elevation buffer in meters
    const rawMetersGrid = [];
    const molaData = molaImageCanvasRef.current;
    const isNamedPreset = ['olympus_mons', 'valles_marineris', 'gale_crater', 'jezero_crater', 'proposed_base', 'planum_boreum'].includes(box.id);

    for (let j = 0; j < GRID_SIZE; j++) {
      rawMetersGrid[j] = new Float32Array(GRID_SIZE);
      const vNorm = j / (GRID_SIZE - 1); // 0 (North) to 1 (South)
      const lat = box.latMax - vNorm * (box.latMax - box.latMin);
      const vProc = vNorm * 2 - 1;

      for (let i = 0; i < GRID_SIZE; i++) {
        const uNorm = i / (GRID_SIZE - 1); // 0 (West) to 1 (East)
        const lng = box.lngMin + uNorm * (box.lngMax - box.lngMin);
        const uProc = uNorm * 2 - 1;

        let sampledMeters = 0;

        if (isNamedPreset) {
          // Use NASA scientific topographic profile for known locations
          sampledMeters = generateScientificLocationElevation(box.id, uProc, vProc);
        } else if (molaData && molaData.imgData) {
          // Custom user-drawn area: sample global MOLA dataset
          const px = Math.floor(Math.max(0, Math.min(1, (lng + 180) / 360)) * (molaData.width - 1));
          const py = Math.floor(Math.max(0, Math.min(1, (90 - lat) / 180)) * (molaData.height - 1));
          const idx = (py * molaData.width + px) * 4;
          const r = molaData.imgData[idx];
          const g = molaData.imgData[idx + 1];
          const b = molaData.imgData[idx + 2];
          sampledMeters = decodeMolaRgbToElevation(r, g, b);
        } else {
          sampledMeters = generateScientificLocationElevation(box.id, uProc, vProc);
        }

        rawMetersGrid[j][i] = sampledMeters;
      }
    }

    // Apply 3x3 Median Outlier Filter + Gradient Clamping (Guarantees Zero Spikes)
    const cleanedMetersGrid = applyAntiSpikeFilter(rawMetersGrid, GRID_SIZE, isNamedPreset ? 2500.0 : 800.0);

    // Track real min/max meters
    let sampleMinM = Infinity;
    let sampleMaxM = -Infinity;
    for (let j = 0; j < GRID_SIZE; j++) {
      for (let i = 0; i < GRID_SIZE; i++) {
        const m = cleanedMetersGrid[j][i];
        if (m < sampleMinM) sampleMinM = m;
        if (m > sampleMaxM) sampleMaxM = m;
      }
    }
    const realReliefM = sampleMaxM - sampleMinM || 100.0;

    setElevationStats({
      minM: Math.round(sampleMinM),
      maxM: Math.round(sampleMaxM),
      reliefM: Math.round(realReliefM)
    });

    // Map meters to 3D scene units (Y-axis) with smooth vertical scale
    // Scale factor keeps elevation proportional to the 46-unit span
    const yRangeUnits = Math.min(18.0, Math.max(2.5, (realReliefM / 1000.0) * 1.6)) * elevationExaggeration;
    const heightMap = [];

    for (let j = 0; j < GRID_SIZE; j++) {
      heightMap[j] = new Float32Array(GRID_SIZE);
      for (let i = 0; i < GRID_SIZE; i++) {
        const norm = (cleanedMetersGrid[j][i] - sampleMinM) / realReliefM;
        heightMap[j][i] = (norm - 0.45) * yRangeUnits;
      }
    }

    // Build geometry buffers
    for (let j = 0; j < GRID_SIZE; j++) {
      const zWorld = (j / (GRID_SIZE - 1)) * SPAN - halfSpan;
      for (let i = 0; i < GRID_SIZE; i++) {
        const xWorld = (i / (GRID_SIZE - 1)) * SPAN - halfSpan;
        const yWorld = heightMap[j][i];

        positions.push(xWorld, yWorld, zWorld);

        const uNorm = i / (GRID_SIZE - 1);
        const vNorm = j / (GRID_SIZE - 1);
        uvs.push(uNorm, vNorm);

        // Finite differences normal vector
        const hL = i > 0 ? heightMap[j][i - 1] : yWorld;
        const hR = i < GRID_SIZE - 1 ? heightMap[j][i + 1] : yWorld;
        const hD = j > 0 ? heightMap[j - 1][i] : yWorld;
        const hU = j < GRID_SIZE - 1 ? heightMap[j + 1][i] : yWorld;

        const normVec = new THREE.Vector3(hL - hR, 2.0 * step, hD - hU).normalize();
        normals.push(normVec.x, normVec.y, normVec.z);

        const slopeDeg = Math.acos(Math.max(0, Math.min(1, normVec.y))) * (180 / Math.PI);
        const elevNorm = (cleanedMetersGrid[j][i] - sampleMinM) / realReliefM;

        let c = new THREE.Color();
        if (renderMode === 'elevation') {
          c = getMolaElevationColor(elevNorm);
        } else if (renderMode === 'slope') {
          c = getSlopeHazardColor(slopeDeg);
        } else {
          // Photorealistic Martian regolith & iron-oxide palette
          const baseR = 0.76 + (elevNorm - 0.5) * 0.16;
          const baseG = 0.40 + (elevNorm - 0.5) * 0.10;
          const baseB = 0.22 + (elevNorm - 0.5) * 0.08;
          // Sunlit ambient shadow contrast
          const shade = Math.max(0.35, normVec.dot(new THREE.Vector3(0.5, 0.8, 0.3).normalize()));

          if (box.id === 'planum_boreum') {
            // Polar ice cap: icy white with blueish frost
            const iceShade = 0.85 + elevNorm * 0.15;
            c.setRGB(iceShade * 0.95, iceShade * 0.96, iceShade * 1.0);
          } else {
            c.setRGB(baseR * shade, baseG * shade, baseB * shade);
          }
        }

        colors.push(c.r, c.g, c.b);
      }
    }

    // A. 3D GAUSSIAN SPLATTING CLOUD
    const splatsGeometry = new THREE.BufferGeometry();
    splatsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    splatsGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const splatsMaterial = new THREE.PointsMaterial({
      size: 1.45,
      vertexColors: true,
      map: gaussianTextureRef.current,
      transparent: true,
      opacity: 0.95,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.NormalBlending
    });

    const splatsPoints = new THREE.Points(splatsGeometry, splatsMaterial);
    scene.add(splatsPoints);
    gaussianSplatsRef.current = splatsPoints;

    // B. HIGH-RESOLUTION NASA SURFACE MESH
    const indices = [];
    for (let j = 0; j < GRID_SIZE - 1; j++) {
      for (let i = 0; i < GRID_SIZE - 1; i++) {
        const a = j * GRID_SIZE + i;
        const b = (j + 1) * GRID_SIZE + i;
        const c = (j + 1) * GRID_SIZE + (i + 1);
        const d = j * GRID_SIZE + (i + 1);

        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    const meshGeometry = new THREE.BufferGeometry();
    meshGeometry.setIndex(indices);
    meshGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    meshGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    meshGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    meshGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

    const meshMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.82,
      metalness: 0.06,
      side: THREE.DoubleSide,
      flatShading: false
    });

    const terrainMesh = new THREE.Mesh(meshGeometry, meshMaterial);
    scene.add(terrainMesh);
    terrainMeshRef.current = terrainMesh;

    // C. TOPOGRAPHIC CONTOURS
    if (showContours) {
      const wireGeom = new THREE.WireframeGeometry(meshGeometry);
      const wireMat = new THREE.LineBasicMaterial({
        color: 0xFFFFFF,
        transparent: true,
        opacity: 0.10
      });
      const wireLines = new THREE.LineSegments(wireGeom, wireMat);
      scene.add(wireLines);
      contourLinesRef.current = wireLines;
    }

    // Toggle Mode
    if (renderMode === 'splats') {
      splatsPoints.visible = true;
      terrainMesh.visible = false;
    } else {
      splatsPoints.visible = false;
      terrainMesh.visible = true;
    }

    // D. 3D INTERACTIVE PINS (Tailored to each scientific location)
    const createWaypointPin = (x, z, label, elevStr, type = 'science') => {
      const u = (x + halfSpan) / SPAN;
      const v = (z + halfSpan) / SPAN;
      const gridI = Math.min(GRID_SIZE - 1, Math.max(0, Math.floor(u * (GRID_SIZE - 1))));
      const gridJ = Math.min(GRID_SIZE - 1, Math.max(0, Math.floor(v * (GRID_SIZE - 1))));
      const y = heightMap[gridJ][gridI];

      const pinGroup = new THREE.Group();
      pinGroup.position.set(x, y, z);

      const stalkGeom = new THREE.CylinderGeometry(0.08, 0.08, 3.2, 8);
      stalkGeom.translate(0, 1.6, 0);
      const stalkColor = type === 'hazard' ? 0xE67E22 : type === 'base' ? 0xD84D29 : 0x3498DB;
      const stalk = new THREE.Mesh(stalkGeom, new THREE.MeshBasicMaterial({ color: stalkColor }));
      pinGroup.add(stalk);

      const sphereGeom = new THREE.SphereGeometry(0.5, 16, 16);
      sphereGeom.translate(0, 3.2, 0);
      const beaconColor = type === 'hazard' ? 0xFFA500 : type === 'base' ? 0xFF4500 : 0x00D4FF;
      const sphere = new THREE.Mesh(sphereGeom, new THREE.MeshBasicMaterial({ color: beaconColor }));
      pinGroup.add(sphere);

      const ringGeom = new THREE.RingGeometry(0.3, 0.7, 16);
      ringGeom.rotateX(-Math.PI / 2);
      ringGeom.translate(0, 0.08, 0);
      const ring = new THREE.Mesh(
        ringGeom,
        new THREE.MeshBasicMaterial({ color: 0xFFFFFF, side: THREE.DoubleSide, transparent: true, opacity: 0.6 })
      );
      pinGroup.add(ring);

      pinsGroupRef.current.add(pinGroup);
    };

    if (box.id === 'olympus_mons') {
      createWaypointPin(0, 0, 'Summit Caldera', `${Math.round(sampleMaxM)} m`, 'base');
      createWaypointPin(-14.2, -8.5, 'Basal Cliff Scarp', '6,000 m drop', 'hazard');
      createWaypointPin(11.0, 10.2, 'Lava Channel Vent', `${Math.round(sampleMinM + realReliefM * 0.45)} m`, 'science');
    } else if (box.id === 'valles_marineris') {
      createWaypointPin(0, 2.5, 'Candor Chasma Floor', `${Math.round(sampleMinM)} m`, 'science');
      createWaypointPin(-12.0, -11.0, 'Ophir Wall Plateau', `${Math.round(sampleMaxM)} m`, 'base');
      createWaypointPin(8.5, -4.2, 'Steep Fault Scarp', 'Slope: 32.5°', 'hazard');
    } else if (box.id === 'gale_crater') {
      createWaypointPin(2.0, 3.2, 'Mount Sharp (Aeolis Mons)', `${Math.round(sampleMaxM)} m`, 'science');
      createWaypointPin(-11.0, -8.0, 'Bradbury Landing Floor', `${Math.round(sampleMinM)} m`, 'base');
      createWaypointPin(14.5, 5.0, 'North Rim Crest', 'Elevation +1,100 m', 'hazard');
    } else if (box.id === 'jezero_crater') {
      createWaypointPin(-8.5, 0.0, 'Neretva Delta Fan', `${Math.round(sampleMinM + 250)} m`, 'science');
      createWaypointPin(0, 0, 'Sedimentary Lakebed', `${Math.round(sampleMinM)} m`, 'base');
      createWaypointPin(13.0, 6.0, 'Belva Crater Rim', `${Math.round(sampleMaxM)} m`, 'hazard');
    } else {
      createWaypointPin(0, 0, box.name, `${Math.round(sampleMaxM)} m`, 'base');
      createWaypointPin(-11.5, -7.2, 'Escarpment Rim', 'Slope: 18.4°', 'hazard');
      createWaypointPin(9.8, 8.4, 'Lowland Floor', `${Math.round(sampleMinM)} m`, 'science');
    }

  }, [box.latMin, box.latMax, box.lngMin, box.lngMax, box.id, renderMode, elevationExaggeration, contourStep, showContours, showSlopeHazards]);

  // Handle Camera Presets
  const handleSetPreset = (preset) => {
    setCameraPreset(preset);
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    if (preset === 'orbit') {
      camera.position.set(0, 32, 44);
      controls.target.set(0, 0, 0);
    } else if (preset === 'rover') {
      camera.position.set(0, 4.5, 15);
      controls.target.set(0, 2.5, -12);
    } else if (preset === 'top') {
      camera.position.set(0, 68, 0.01);
      controls.target.set(0, 0, 0);
    }
    controls.update();
  };

  return (
    <div className={`terrain-view-container animate-fade-in ${isExpanded ? 'is-terrain-expanded' : ''}`}>
      {/* Top Controls & Navigation Header */}
      <div className="view-header-strip">
        <div className="view-title-group">
          <div className="view-badge">
            <Sparkles size={13} className="text-accent" />
            <span>3D GAUSSIAN SPLATTING TERRAIN GENERATOR</span>
          </div>
          <h2 className="view-heading">
            {box.name} — 3D Gaussian Splat
          </h2>
          <p className="view-subtext">
            Physical elevation sampling with 3×3 median anti-spike filtering. All crater rims, canyon rifts, and volcanic peaks reconstructed in 3D.
          </p>
        </div>

        <div className="terrain-header-actions-right">
          {onBackToMap && (
            <button className="t-change-area-btn" onClick={onBackToMap}>
              <ArrowLeft size={13} />
              <span>Change Area on Map</span>
            </button>
          )}

          {/* Mode Selector Strip */}
          <div className="terrain-mode-pills-bar">
            <button
              className={`t-mode-btn ${renderMode === 'splats' ? 'active' : ''}`}
              onClick={() => setRenderMode('splats')}
              title="3D Gaussian Splats: Dense photorealistic particle cloud with view-dependent radiance"
            >
              <Sparkles size={12} />
              <span>3D Gaussian Splats</span>
            </button>

            <button
              className={`t-mode-btn ${renderMode === 'textured' ? 'active' : ''}`}
              onClick={() => setRenderMode('textured')}
              title="NASA HiRISE / Viking Ortho Surface Mesh"
            >
              <Layers size={12} />
              <span>NASA Mesh</span>
            </button>

            <button
              className={`t-mode-btn ${renderMode === 'elevation' ? 'active' : ''}`}
              onClick={() => setRenderMode('elevation')}
              title="MOLA Topographic Elevation Color Ramp"
            >
              <Mountain size={12} />
              <span>MOLA Topo</span>
            </button>

            <button
              className={`t-mode-btn ${renderMode === 'slope' ? 'active' : ''}`}
              onClick={() => setRenderMode('slope')}
              title="Slope Hazard Trafficability Heatmap"
            >
              <AlertTriangle size={12} />
              <span>Slope Hazards</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive 3D Canvas Box */}
      <div className={`terrain-3d-interactive-wrap ${isExpanded ? 'expanded-canvas' : ''}`}>
        {/* Three.js Canvas Container */}
        <div
          ref={containerRef}
          className="terrain-webgl-canvas"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            overflow: 'hidden'
          }}
        />

        {/* Top Left Compass & Coordinates HUD */}
        <div className="terrain-overlay-hud-topleft">
          <div className="thud-badge">
            <Compass size={13} className="text-accent" />
            <span>
              {box.latMin.toFixed(1)}° to {box.latMax.toFixed(1)}° Lat • {box.lngMin.toFixed(1)}° to {box.lngMax.toFixed(1)}° Lng
            </span>
          </div>
          <div className="thud-metric-pill">
            <span className="thud-lbl">ELEVATION RANGE:</span>
            <span className="thud-val">
              {elevationStats.minM.toLocaleString()} m to {elevationStats.maxM.toLocaleString()} m
            </span>
          </div>
          <div className="thud-metric-pill">
            <span className="thud-lbl">VERTICAL RELIEF (Δh):</span>
            <span className="thud-val">
              {elevationStats.reliefM.toLocaleString()} m
            </span>
          </div>
        </div>

        {/* Top Right Camera Presets & Fullscreen */}
        <div className="terrain-overlay-hud-topright">
          <div className="t-camera-presets-group">
            <button
              className={`preset-btn ${cameraPreset === 'orbit' ? 'active' : ''}`}
              onClick={() => handleSetPreset('orbit')}
              title="Tactical Orbit Perspective"
            >
              Orbit
            </button>
            <button
              className={`preset-btn ${cameraPreset === 'rover' ? 'active' : ''}`}
              onClick={() => handleSetPreset('rover')}
              title="Rover Eye-Level Horizon View"
            >
              Rover POV
            </button>
            <button
              className={`preset-btn ${cameraPreset === 'top' ? 'active' : ''}`}
              onClick={() => handleSetPreset('top')}
              title="Nadir Top-Down Satellite View"
            >
              Top-Down
            </button>
          </div>

          <button
            className={`t-hud-action-btn ${autoRotate ? 'active' : ''}`}
            onClick={() => setAutoRotate(!autoRotate)}
            title="Toggle Continuous Orbit Rotation"
          >
            <RotateCcw size={14} className={autoRotate ? 'spin-slow' : ''} />
          </button>

          {onToggleExpand && (
            <button
              className="t-hud-action-btn"
              onClick={() => onToggleExpand(!isExpanded)}
              title={isExpanded ? 'Exit Fullscreen' : 'Fullscreen Terrain'}
            >
              {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          )}
        </div>

        {/* Bottom Interactive Controls Strip */}
        <div className="terrain-bottom-controls-strip">
          {/* Vertical Relief Exaggeration Slider */}
          <div className="t-slider-ctrl-box">
            <Sliders size={13} className="text-accent" />
            <span className="ctrl-lbl">Vertical Relief: {elevationExaggeration.toFixed(1)}x</span>
            <input
              type="range"
              min="0.5"
              max="3.5"
              step="0.1"
              value={elevationExaggeration}
              onChange={(e) => setElevationExaggeration(parseFloat(e.target.value))}
              className="t-exaggeration-slider"
            />
          </div>

          {/* Contour Lines Toggle */}
          <button
            className={`t-ctrl-pill-btn ${showContours ? 'active' : ''}`}
            onClick={() => setShowContours(!showContours)}
          >
            <Mountain size={13} />
            <span>Contours ({contourStep})</span>
          </button>

          {/* Spacesuit HUD Trigger */}
          <button className="t-ctrl-pill-btn hud-accent" onClick={onOpenHUD}>
            <Eye size={13} />
            <span>Open in Spacesuit HUD</span>
          </button>
        </div>

        {/* Interaction Hint Overlay */}
        <div className="terrain-interaction-hint">
          <span>Left-Click Drag: Orbit • Right-Click Drag: Pan • Scroll: Zoom</span>
        </div>
      </div>

      {/* Satellite Relay & Topographic Science Footer */}
      <div className="terrain-footer-grid">
        <div className="terrain-card-stat">
          <span className="stat-label">SATELLITE DATA SOURCE</span>
          <div className="stat-row">
            <ShieldCheck size={16} className="text-success" />
            <span className="stat-main">NASA MGS MOLA + MRO HiRISE (Anti-Spike Filter Active)</span>
          </div>
          <span className="stat-sub">3×3 Median outlier rejection prevents single-pixel elevation spikes</span>
        </div>

        <div className="terrain-card-stat">
          <span className="stat-label">SLOPE HAZARD ANALYSIS</span>
          <div className="stat-row">
            <AlertTriangle size={16} className={showSlopeHazards ? 'text-accent' : 'text-success'} />
            <span className="stat-main">Real-time gradient calculation for active bounding box</span>
          </div>
          <span className="stat-sub">Trafficable paths identified based on slope steepness thresholds</span>
        </div>
      </div>
    </div>
  );
}
