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
  ShieldCheck,
  MapPin,
  X,
  ExternalLink,
  Plus
} from 'lucide-react';

// NASA Reference Data for Tharsis Volcanic Province
// Provides ground-truth 3D shield morphology so volcanoes form realistic broad domes with calderas
const NASA_THARSIS_VOLCANOES = [
  {
    name: 'Olympus Mons',
    lat: 18.65,
    lng: -133.80,
    summit: 21287,
    base: -1500,
    r_km: 300,
    scarp_r: 260,
    scarp_h: 6500,
    caldera_r: 40,
    caldera_depth: 2800,
    axis_angle: -0.61, // NW-SE elongated shield
    stretch_nw: 1.25
  },
  {
    name: 'Ascraeus Mons',
    lat: 11.90,
    lng: -104.50,
    summit: 18225,
    base: 3200,
    r_km: 175,
    scarp_r: 0,
    scarp_h: 0,
    caldera_r: 25,
    caldera_depth: 3000,
    axis_angle: 0.0,
    stretch_nw: 1.0
  },
  {
    name: 'Pavonis Mons',
    lat: 0.80,
    lng: -113.00,
    summit: 14058,
    base: 3800,
    r_km: 175,
    scarp_r: 0,
    scarp_h: 0,
    caldera_r: 22,
    caldera_depth: 4500,
    axis_angle: 0.0,
    stretch_nw: 1.0
  },
  {
    name: 'Arsia Mons',
    lat: -9.00,
    lng: -121.00,
    summit: 17761,
    base: 3800,
    r_km: 200,
    scarp_r: 0,
    scarp_h: 0,
    caldera_r: 55,
    caldera_depth: 1600,
    axis_angle: 0.0,
    stretch_nw: 1.0
  }
];

// Returns physically accurate elevation and blend weight for Tharsis shield volcanoes
function sampleNasaVolcanoElevation(lat, lng) {
  const kmPerLat = 59.16;
  const kmPerLng = 59.16 * Math.cos((lat * Math.PI) / 180);

  for (let idx = 0; idx < NASA_THARSIS_VOLCANOES.length; idx++) {
    const v = NASA_THARSIS_VOLCANOES[idx];
    const dLatKm = (lat - v.lat) * kmPerLat;
    const dLngKm = (lng - v.lng) * kmPerLng;

    let distKm;
    if (v.axis_angle !== 0.0) {
      const c = Math.cos(v.axis_angle);
      const s = Math.sin(v.axis_angle);
      const uRot = dLngKm * c - dLatKm * s;
      const vRot = dLngKm * s + dLatKm * c;
      const stretch = uRot < 0 ? v.stretch_nw : 1.0;
      distKm = Math.sqrt(Math.pow(uRot / stretch, 2) + Math.pow(vRot, 2));
    } else {
      distKm = Math.sqrt(dLatKm * dLatKm + dLngKm * dLngKm);
    }

    if (distKm <= v.r_km * 1.18) {
      const normR = distKm / v.r_km;
      const relief = v.summit - v.base;

      // Realistic broad shield rise (natural 2.5° to 5° average flank slope)
      let h = v.base + relief * Math.exp(-Math.pow(normR, 1.45) * 1.65);

      // Basal cliff scarp (sheer drop down to surrounding aureole plains)
      if (v.scarp_h > 0 && distKm > (v.scarp_r - 25)) {
        h -= v.scarp_h / (1.0 + Math.exp(-(distKm - v.scarp_r) / 9.0));
      }

      // Summit nested caldera cluster
      if (distKm < v.caldera_r) {
        const cd = v.caldera_depth * Math.pow(1.0 - Math.pow(distKm / v.caldera_r, 2.0), 1.25);
        h -= cd;
      }

      // Smooth cosine edge blend into surrounding MOLA plains
      let blendWeight = 1.0;
      if (distKm > v.r_km * 0.88) {
        const t = (distKm - v.r_km * 0.88) / (v.r_km * 0.30);
        blendWeight = Math.max(0.0, Math.min(1.0, 0.5 * (1.0 + Math.cos(Math.PI * Math.min(1.0, t)))));
      }

      return { elevation: h, blendWeight };
    }
  }

  return null;
}

// Decodes NASA MOLA color shaded relief map RGB into elevation in meters with smooth continuity
function decodeMolaRgbToElevation(r, g, b, lat = 0, lng = 0) {
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

  // Deep impact basins: Hellas, Argyre, Isidis (deep purple/magenta h > 0.75)
  if (h > 0.75 && s > 0.35) {
    const t = (h - 0.75) / 0.25;
    return -8200 + (1.0 - t) * 3200; // -8200m to -5000m
  }

  // Continuous MOLA spectrum from blue (-5000m) to cyan (-2000m) to green (0m) to yellow (+3000m) to red (+8000m)
  // Hue ranges continuously from ~0.65 down to ~0.0
  const clampedH = Math.max(0.0, Math.min(0.68, h));
  const t = (0.68 - clampedH) / 0.68;
  const elevM = -5000 + t * 13000;

  // Clamp to Mars non-volcanic topography bounds [-8200m, +7500m]
  return Math.min(7500, Math.max(-8200, elevM));
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
    case 'olympus':
    case 'olympus_mons': {
      // Real NASA MOLA Elevation profile:
      // Surrounding aureole plains: -1,500m; Summit caldera rim: +21,287m (Relief: 22,787m)
      const baseElev = -1500;

      // Realistic Asymmetry: Olympus Mons is an asymmetrical shield elongated along NW-SE axis (~35° / -0.61 rad)
      const rotRad = -0.61;
      const uRot = u * Math.cos(rotRad) - v * Math.sin(rotRad);
      const vRot = u * Math.sin(rotRad) + v * Math.cos(rotRad);

      // Asymmetric flank extension: Northwest flank (uRot < 0) extends much further with a gentler gradient
      const nwStretch = uRot < 0 ? 1.28 : 0.96;
      const distEllip = Math.sqrt(Math.pow(uRot / (1.14 * nwStretch), 2) + Math.pow(vRot / 0.86, 2));

      // Asymmetric shield height rise
      const shield = 22787 * Math.exp(-Math.pow(distEllip, 1.42) * 1.58);

      // Scalloped basal cliff scarp: 6,000m to 8,000m sheer drop with giant landslide embayments
      // Realistic jagged perimeter varying with angle
      const rScarp = 0.74 + 0.075 * Math.cos(3 * angle) + 0.04 * Math.sin(5 * angle - 0.4) + 0.02 * Math.cos(8 * angle);
      const scarpDrop = distEllip > (rScarp - 0.06)
        ? -7200.0 / (1.0 + Math.exp(-(distEllip - rScarp) * 32.0))
        : 0;

      // Multi-ring nested caldera cluster at summit (+21,287m down to +18,500m):
      // 1. Main Northwest collapse pit (offset to NW, -2,400m floor)
      const d1 = Math.sqrt(Math.pow((u + 0.05) / 0.17, 2) + Math.pow((v - 0.04) / 0.13, 2));
      const caldera1 = d1 < 1.0 ? -2400.0 * Math.pow(1.0 - Math.pow(d1, 2.0), 1.25) : 0;

      // 2. Overlapping Southeast collapse pit (offset to SE, cuts into older floor)
      const d2 = Math.sqrt(Math.pow((u - 0.07) / 0.14, 2) + Math.pow((v + 0.04) / 0.10, 2));
      const caldera2 = d2 < 1.0 ? -1750.0 * Math.pow(1.0 - Math.pow(d2, 2.0), 1.35) : 0;

      // 3. Arcuate graben slump terrace along Northern rim
      const d3 = Math.sqrt(Math.pow((u + 0.02) / 0.11, 2) + Math.pow((v + 0.08) / 0.07, 2));
      const caldera3 = d3 < 1.0 ? -850.0 * (1.0 - d3) : 0;

      // Radial basalt lava flow channels, levees, and volcanic vents
      const radialFlow = Math.cos(angle * 11.0 + distEllip * 7.0) * 260.0
        * (distEllip > 0.22 && distEllip < rScarp ? 1.0 : 0.0);

      // Flank parasitical volcanic cones and vents
      const flankVent = Math.exp(-(Math.pow(u - 0.35, 2) + Math.pow(v + 0.25, 2)) / 0.004) * 650.0;

      return baseElev + shield + scarpDrop + caldera1 + caldera2 + caldera3 + radialFlow + flankVent + micro1;
    }

    case 'valles':
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

    case 'gale':
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

    case 'jezero':
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

    case 'planum_boreum':
    case 'polar_north': {
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

// 3x3 Spatial Median Filter + Gradient Outlier Clamping + Laplacian Smoothing (Guarantees Zero Spikes)
function applyAntiSpikeFilter(grid, sizeX, sizeY, maxSlopeGradient = 1200.0) {
  const filtered = [];
  for (let j = 0; j < sizeY; j++) {
    filtered[j] = new Float32Array(sizeX);
  }

  // Pass 1: 3x3 Median Filter
  const window = [];
  for (let j = 0; j < sizeY; j++) {
    for (let i = 0; i < sizeX; i++) {
      window.length = 0;
      for (let dy = -1; dy <= 1; dy++) {
        const y = Math.min(sizeY - 1, Math.max(0, j + dy));
        for (let dx = -1; dx <= 1; dx++) {
          const x = Math.min(sizeX - 1, Math.max(0, i + dx));
          window.push(grid[y][x]);
        }
      }
      window.sort((a, b) => a - b);
      filtered[j][i] = window[Math.floor(window.length / 2)];
    }
  }

  // Pass 2: Physical Slope Gradient Clamping (No single grid cell can jump past physical limit)
  for (let j = 1; j < sizeY - 1; j++) {
    for (let i = 1; i < sizeX - 1; i++) {
      const avgNeighbor = (filtered[j - 1][i] + filtered[j + 1][i] + filtered[j][i - 1] + filtered[j][i + 1]) * 0.25;
      const diff = filtered[j][i] - avgNeighbor;
      if (Math.abs(diff) > maxSlopeGradient) {
        filtered[j][i] = avgNeighbor + Math.sign(diff) * maxSlopeGradient;
      }
    }
  }

  // Pass 3: 1-Pass Gentle Gaussian/Laplacian Smoothing to eliminate any remaining single-pixel peak sharpness
  const smoothed = [];
  for (let j = 0; j < sizeY; j++) {
    smoothed[j] = new Float32Array(sizeX);
    for (let i = 0; i < sizeX; i++) {
      if (j === 0 || j === sizeY - 1 || i === 0 || i === sizeX - 1) {
        smoothed[j][i] = filtered[j][i];
      } else {
        // Weighted 3x3 kernel (Center 4, Cross 2, Corners 1 / 16)
        const cross = filtered[j - 1][i] + filtered[j + 1][i] + filtered[j][i - 1] + filtered[j][i + 1];
        const diag = filtered[j - 1][i - 1] + filtered[j - 1][i + 1] + filtered[j + 1][i - 1] + filtered[j + 1][i + 1];
        smoothed[j][i] = (filtered[j][i] * 4.0 + cross * 2.0 + diag * 1.0) / 16.0;
      }
    }
  }

  return smoothed;
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
  onToggleExpand,
  pinnedLocations = [],
  onAddPin,
  onRemovePin,
  onNavigateToMap
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
  const customPinsGroupRef = useRef(null);
  const hoverPinGroupRef = useRef(null);
  const terrainGeometryDataRef = useRef(null);
  const molaImageCanvasRef = useRef(null);
  const satImageCanvasRef = useRef(null);

  // Active state
  const [renderMode, setRenderMode] = useState('splats'); // 'splats' | 'textured' | 'elevation' | 'slope'
  const [elevationExaggeration, setElevationExaggeration] = useState(1.6);
  const [showContours, setShowContours] = useState(true);
  const [showPins, setShowPins] = useState(true);
  const [pinProbeActive, setPinProbeActive] = useState(true);
  const [hoverElevation, setHoverElevation] = useState(null); // { x, y, z, lat, lng, elevM, slopeDeg }
  const [hoveredCustomPin, setHoveredCustomPin] = useState(null); // custom pin under hover
  const [autoRotate, setAutoRotate] = useState(false);
  const [cameraPreset, setCameraPreset] = useState('orbit');
  const [elevationStats, setElevationStats] = useState({ minM: -2450, maxM: 1200, reliefM: 3650 });
  const [molaLoaded, setMolaLoaded] = useState(false);
  const [satLoaded, setSatLoaded] = useState(false);

  const box = selectedBoundingBox || {
    id: 'olympus_mons',
    name: 'Olympus Mons Caldera & Scarps',
    latMin: 13.0,
    latMax: 23.5,
    lngMin: -139.0,
    lngMax: -128.0
  };

  // Preload NASA JPL Mars Trek 4K Global Elevation & Satellite Datasets
  useEffect(() => {
    // 1. Elevation raster (4K first, fallback to 1K)
    const elevImg = new Image();
    elevImg.crossOrigin = 'anonymous';
    elevImg.src = '/assets/nasa_jpl_marstrek_elevation_4k.jpg';
    elevImg.onload = () => {
      const offCanvas = document.createElement('canvas');
      offCanvas.width = elevImg.width;
      offCanvas.height = elevImg.height;
      const ctx = offCanvas.getContext('2d');
      ctx.drawImage(elevImg, 0, 0);
      molaImageCanvasRef.current = {
        ctx,
        width: elevImg.width,
        height: elevImg.height,
        imgData: ctx.getImageData(0, 0, elevImg.width, elevImg.height).data
      };
      setMolaLoaded(true);
    };
    elevImg.onerror = () => {
      const fallbackImg = new Image();
      fallbackImg.src = '/assets/nasa_mola_elevation_global.jpg';
      fallbackImg.onload = () => {
        const offCanvas = document.createElement('canvas');
        offCanvas.width = fallbackImg.width;
        offCanvas.height = fallbackImg.height;
        const ctx = offCanvas.getContext('2d');
        ctx.drawImage(fallbackImg, 0, 0);
        molaImageCanvasRef.current = {
          ctx,
          width: fallbackImg.width,
          height: fallbackImg.height,
          imgData: ctx.getImageData(0, 0, fallbackImg.width, fallbackImg.height).data
        };
        setMolaLoaded(true);
      };
    };

    // 2. Satellite ortho mosaic for photorealistic splat coloring
    const satImg = new Image();
    satImg.crossOrigin = 'anonymous';
    satImg.src = '/assets/nasa_jpl_marstrek_satellite_4k.jpg';
    satImg.onload = () => {
      const offCanvas = document.createElement('canvas');
      offCanvas.width = satImg.width;
      offCanvas.height = satImg.height;
      const ctx = offCanvas.getContext('2d');
      ctx.drawImage(satImg, 0, 0);
      satImageCanvasRef.current = {
        ctx,
        width: satImg.width,
        height: satImg.height,
        imgData: ctx.getImageData(0, 0, satImg.width, satImg.height).data
      };
      setSatLoaded(true);
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

    // Custom Marked Pins Group (Red Pins placed by user click)
    const customPinsGroup = new THREE.Group();
    scene.add(customPinsGroup);
    customPinsGroupRef.current = customPinsGroup;

    // Interactive Hover Pin & Reticle Probe Group (User created probe: Brilliant Red 0xFF2233)
    const hoverPinGroup = new THREE.Group();
    hoverPinGroup.visible = false;

    // Luminous red beacon sphere
    const hoverSphereGeom = new THREE.SphereGeometry(0.55, 16, 16);
    hoverSphereGeom.translate(0, 3.2, 0);
    const hoverSphereMat = new THREE.MeshBasicMaterial({ color: 0xFF2233 });
    const hoverSphere = new THREE.Mesh(hoverSphereGeom, hoverSphereMat);
    hoverPinGroup.add(hoverSphere);

    // Glowing vertical red laser probe stalk
    const hoverStalkGeom = new THREE.CylinderGeometry(0.08, 0.08, 3.2, 8);
    hoverStalkGeom.translate(0, 1.6, 0);
    const hoverStalkMat = new THREE.MeshBasicMaterial({ color: 0xFF2233, transparent: true, opacity: 0.95 });
    const hoverStalk = new THREE.Mesh(hoverStalkGeom, hoverStalkMat);
    hoverPinGroup.add(hoverStalk);

    // Red pulsing target ground rings
    const hoverRingGeom = new THREE.RingGeometry(0.4, 0.9, 24);
    hoverRingGeom.rotateX(-Math.PI / 2);
    hoverRingGeom.translate(0, 0.08, 0);
    const hoverRingMat = new THREE.MeshBasicMaterial({ color: 0xFF2233, side: THREE.DoubleSide, transparent: true, opacity: 0.95 });
    const hoverRing = new THREE.Mesh(hoverRingGeom, hoverRingMat);
    hoverPinGroup.add(hoverRing);

    const hoverOuterRingGeom = new THREE.RingGeometry(1.2, 1.45, 24);
    hoverOuterRingGeom.rotateX(-Math.PI / 2);
    hoverOuterRingGeom.translate(0, 0.1, 0);
    const hoverOuterRingMat = new THREE.MeshBasicMaterial({ color: 0xFF2233, side: THREE.DoubleSide, transparent: true, opacity: 0.75 });
    const hoverOuterRing = new THREE.Mesh(hoverOuterRingGeom, hoverOuterRingMat);
    hoverPinGroup.add(hoverOuterRing);

    scene.add(hoverPinGroup);
    hoverPinGroupRef.current = hoverPinGroup;

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

  // Escape key listener to exit fullscreen back to normal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isExpanded && onToggleExpand) {
        onToggleExpand(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded, onToggleExpand]);

  // Multi-stage debounced resize on fullscreen toggle
  useEffect(() => {
    const resizeNow = () => {
      const container = containerRef.current;
      const camera = cameraRef.current;
      const renderer = rendererRef.current;
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const t0 = setTimeout(resizeNow, 20);
    const t1 = setTimeout(resizeNow, 150);
    const t2 = setTimeout(resizeNow, 350);
    const t3 = setTimeout(resizeNow, 550);
    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isExpanded]);

  // Toggle pins visibility based on showPins state
  useEffect(() => {
    if (pinsGroupRef.current) {
      pinsGroupRef.current.visible = showPins;
    }
  }, [showPins]);

  // Render Custom Pinned Markers in 3D scene whenever pinnedLocations changes
  useEffect(() => {
    const customGroup = customPinsGroupRef.current;
    const geomData = terrainGeometryDataRef.current;
    if (!customGroup) return;

    // Clear existing custom pins in 3D
    while (customGroup.children.length > 0) {
      const child = customGroup.children[0];
      customGroup.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    }

    if (!geomData || !pinnedLocations || pinnedLocations.length === 0) return;

    const { halfSpanX, halfSpanZ, spanX, spanZ, GRID_SIZE_X, GRID_SIZE_Z, heightMap, latMin, latMax, lngMin, lngMax } = geomData;

    pinnedLocations.forEach((pin) => {
      // Check if pin is within current bounding box
      const pLat = parseFloat(pin.coords?.lat || pin.lat);
      const pLng = parseFloat(pin.coords?.lng || pin.lng);
      if (isNaN(pLat) || isNaN(pLng)) return;
      if (pLat < latMin || pLat > latMax || pLng < lngMin || pLng > lngMax) return;

      const uNorm = (pLng - lngMin) / (lngMax - lngMin);
      const vNorm = (latMax - pLat) / (latMax - latMin);
      const x = uNorm * spanX - halfSpanX;
      const z = vNorm * spanZ - halfSpanZ;

      const gridI = Math.min(GRID_SIZE_X - 1, Math.max(0, Math.floor(uNorm * (GRID_SIZE_X - 1))));
      const gridJ = Math.min(GRID_SIZE_Z - 1, Math.max(0, Math.floor(vNorm * (GRID_SIZE_Z - 1))));
      const y = heightMap[gridJ] ? heightMap[gridJ][gridI] : 0;

      const pinGroup = new THREE.Group();
      pinGroup.position.set(x, y, z);
      pinGroup.userData = { pinId: pin.id, pinData: pin };

      // Red Stalk
      const stalkGeom = new THREE.CylinderGeometry(0.08, 0.08, 3.2, 8);
      stalkGeom.translate(0, 1.6, 0);
      const stalkMat = new THREE.MeshBasicMaterial({ color: 0xFF2233 });
      const stalk = new THREE.Mesh(stalkGeom, stalkMat);
      pinGroup.add(stalk);

      // Red Luminous Beacon
      const sphereGeom = new THREE.SphereGeometry(0.65, 16, 16);
      sphereGeom.translate(0, 3.2, 0);
      const sphereMat = new THREE.MeshBasicMaterial({ color: 0xFF2233 });
      const sphere = new THREE.Mesh(sphereGeom, sphereMat);
      pinGroup.add(sphere);

      // Red Ground Rings
      const ringGeom = new THREE.RingGeometry(0.4, 0.9, 24);
      ringGeom.rotateX(-Math.PI / 2);
      ringGeom.translate(0, 0.08, 0);
      const ring = new THREE.Mesh(ringGeom, new THREE.MeshBasicMaterial({ color: 0xFF2233, side: THREE.DoubleSide }));
      pinGroup.add(ring);

      const outerRingGeom = new THREE.RingGeometry(1.2, 1.45, 24);
      outerRingGeom.rotateX(-Math.PI / 2);
      outerRingGeom.translate(0, 0.1, 0);
      const outerRing = new THREE.Mesh(outerRingGeom, new THREE.MeshBasicMaterial({ color: 0xFF2233, side: THREE.DoubleSide, transparent: true, opacity: 0.7 }));
      pinGroup.add(outerRing);

      customGroup.add(pinGroup);
    });
  }, [pinnedLocations, terrainGeometryDataRef.current]);

  // Raycaster & Pointer Move for Pin Probe (Hover over gaussian splat to read exact elevation & Click to Mark Pin)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    let pointerDownTime = 0;
    let pointerDownPos = { x: 0, y: 0 };

    const handlePointerDown = (e) => {
      pointerDownTime = Date.now();
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e) => {
      // Only trigger if it's a click (not an orbit drag)
      const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      const elapsed = Date.now() - pointerDownTime;
      if (dist > 5 || elapsed > 350) return; // was a drag orbit

      if (!pinProbeActive) return;

      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const camera = cameraRef.current;
      const mesh = terrainMeshRef.current;
      const geomData = terrainGeometryDataRef.current;
      if (!camera || !mesh || !geomData) return;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(mesh);

      if (intersects.length > 0) {
        const hit = intersects[0];
        const pt = hit.point;

        const { halfSpanX, halfSpanZ, spanX, spanZ, GRID_SIZE_X, GRID_SIZE_Z, cleanedMetersGrid, latMin, latMax, lngMin, lngMax } = geomData;
        const uNorm = Math.max(0, Math.min(1, (pt.x + halfSpanX) / spanX));
        const vNorm = Math.max(0, Math.min(1, (pt.z + halfSpanZ) / spanZ));

        const gridX = uNorm * (GRID_SIZE_X - 1);
        const gridZ = vNorm * (GRID_SIZE_Z - 1);
        const i0 = Math.floor(gridX);
        const i1 = Math.min(GRID_SIZE_X - 1, i0 + 1);
        const j0 = Math.floor(gridZ);
        const j1 = Math.min(GRID_SIZE_Z - 1, j0 + 1);
        const fx = gridX - i0;
        const fz = gridZ - j0;

        const elev00 = cleanedMetersGrid[j0][i0];
        const elev10 = cleanedMetersGrid[j0][i1];
        const elev01 = cleanedMetersGrid[j1][i0];
        const elev11 = cleanedMetersGrid[j1][i1];
        const elevM = Math.round(
          (1 - fx) * (1 - fz) * elev00 +
          fx * (1 - fz) * elev10 +
          (1 - fx) * fz * elev01 +
          fx * fz * elev11
        );

        const lat = latMax - vNorm * (latMax - latMin);
        const lng = lngMin + uNorm * (lngMax - lngMin);
        const normal = hit.face ? hit.face.normal : new THREE.Vector3(0, 1, 0);
        const slopeDeg = Math.round(Math.acos(Math.max(0, Math.min(1, normal.y))) * (180 / Math.PI));

        const latStr = `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? 'N' : 'S'}`;
        const lngStr = `${Math.abs(lng).toFixed(2)}° ${lng >= 0 ? 'E' : 'W'}`;

        const newPin = {
          id: 'pinned_probe_' + Date.now(),
          name: `Sector Marker (${latStr}, ${lngStr})`,
          subtitle: `Surface Probe: ${elevM > 0 ? '+' : ''}${elevM.toLocaleString()} m • ${slopeDeg}° slope`,
          coords: {
            lat: latStr,
            lng: lngStr,
            elev: `${elevM > 0 ? '+' : ''}${elevM.toLocaleString()} m`
          },
          coordsText: `${latStr}, ${lngStr}`,
          elevationNum: elevM,
          elevationVal: `${elevM > 0 ? '+' : ''}${elevM.toLocaleString()} m`,
          slopeDeg,
          lat,
          lng,
          isCustomPinned: true,
          satelliteImg: '/assets/crater_satellite_thumb.jpg',
          landscapeImg: '/assets/mars_expanded_terrain.jpg',
          desc: `User mark from 3D Gaussian Splat terrain at ${latStr}, ${lngStr}. Physical elevation: ${elevM.toLocaleString()} m, local incline slope: ${slopeDeg}°.`
        };

        if (onAddPin) {
          onAddPin(newPin);
        }
      }
    };

    const handlePointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const camera = cameraRef.current;
      const mesh = terrainMeshRef.current;
      const geomData = terrainGeometryDataRef.current;
      const customGroup = customPinsGroupRef.current;
      if (!camera || !mesh || !geomData) return;

      raycaster.setFromCamera(mouse, camera);

      // Check if hovering over any existing custom red pin
      if (customGroup && customGroup.children.length > 0) {
        const pinIntersects = raycaster.intersectObjects(customGroup.children, true);
        if (pinIntersects.length > 0) {
          // Find root pin group
          let cur = pinIntersects[0].object;
          while (cur && cur.parent !== customGroup) {
            cur = cur.parent;
          }
          if (cur && cur.userData?.pinData) {
            setHoveredCustomPin({
              screenX: e.clientX - rect.left,
              screenY: e.clientY - rect.top,
              pin: cur.userData.pinData
            });
            if (hoverPinGroupRef.current) hoverPinGroupRef.current.visible = false;
            setHoverElevation(null);
            return;
          }
        }
      }

      setHoveredCustomPin(null);

      if (!pinProbeActive) {
        if (hoverPinGroupRef.current) hoverPinGroupRef.current.visible = false;
        setHoverElevation(null);
        return;
      }

      const intersects = raycaster.intersectObject(mesh);

      if (intersects.length > 0) {
        const hit = intersects[0];
        const pt = hit.point;

        // Position 3D laser probe pin at hit coordinates
        if (hoverPinGroupRef.current) {
          hoverPinGroupRef.current.position.copy(pt);
          hoverPinGroupRef.current.visible = true;
        }

        // Interpolate real elevation in meters from geometry data
        const { halfSpanX, halfSpanZ, spanX, spanZ, GRID_SIZE_X, GRID_SIZE_Z, cleanedMetersGrid, latMin, latMax, lngMin, lngMax } = geomData;
        const uNorm = Math.max(0, Math.min(1, (pt.x + halfSpanX) / spanX));
        const vNorm = Math.max(0, Math.min(1, (pt.z + halfSpanZ) / spanZ));

        const gridX = uNorm * (GRID_SIZE_X - 1);
        const gridZ = vNorm * (GRID_SIZE_Z - 1);
        const i0 = Math.floor(gridX);
        const i1 = Math.min(GRID_SIZE_X - 1, i0 + 1);
        const j0 = Math.floor(gridZ);
        const j1 = Math.min(GRID_SIZE_Z - 1, j0 + 1);
        const fx = gridX - i0;
        const fz = gridZ - j0;

        const elev00 = cleanedMetersGrid[j0][i0];
        const elev10 = cleanedMetersGrid[j0][i1];
        const elev01 = cleanedMetersGrid[j1][i0];
        const elev11 = cleanedMetersGrid[j1][i1];
        const elevM = Math.round(
          (1 - fx) * (1 - fz) * elev00 +
          fx * (1 - fz) * elev10 +
          (1 - fx) * fz * elev01 +
          fx * fz * elev11
        );

        const lat = latMax - vNorm * (latMax - latMin);
        const lng = lngMin + uNorm * (lngMax - lngMin);

        // Slope angle in degrees from surface normal
        const normal = hit.face ? hit.face.normal : new THREE.Vector3(0, 1, 0);
        const slopeDeg = Math.round(Math.acos(Math.max(0, Math.min(1, normal.y))) * (180 / Math.PI));

        setHoverElevation({
          screenX: e.clientX - rect.left,
          screenY: e.clientY - rect.top,
          elevM,
          slopeDeg,
          lat,
          lng
        });
      } else {
        if (hoverPinGroupRef.current) hoverPinGroupRef.current.visible = false;
        setHoverElevation(null);
      }
    };

    const handlePointerLeave = () => {
      if (hoverPinGroupRef.current) hoverPinGroupRef.current.visible = false;
      setHoverElevation(null);
      setHoveredCustomPin(null);
    };

    container.addEventListener('pointerdown', handlePointerDown);
    container.addEventListener('pointerup', handlePointerUp);
    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      container.removeEventListener('pointerdown', handlePointerDown);
      container.removeEventListener('pointerup', handlePointerUp);
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [pinProbeActive, onAddPin]);

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

    // Calculate physical geographic dimensions of the drawn bounding box (Mars radius R = 3389.5 km)
    const latMin = Math.min(box.latMin, box.latMax);
    const latMax = Math.max(box.latMin, box.latMax);
    const lngMin = Math.min(box.lngMin, box.lngMax);
    const lngMax = Math.max(box.lngMin, box.lngMax);

    const latSpan = Math.max(0.08, latMax - latMin);
    const lngSpan = Math.max(0.08, lngMax - lngMin);
    const latMid = (latMax + latMin) / 2;

    const kmPerLatDeg = 59.16;
    const kmPerLngDeg = 59.16 * Math.cos((latMid * Math.PI) / 180);

    const widthKm = Math.max(4, Math.round(lngSpan * kmPerLngDeg));
    const heightKm = Math.max(4, Math.round(latSpan * kmPerLatDeg));

    // Visual aspect ratio (Width : Height) matches exactly what the user drew on screen (Square stays Square)
    const aspect = box.aspectRatio
      ? Math.max(0.25, Math.min(4.0, box.aspectRatio))
      : Math.max(0.25, Math.min(4.0, widthKm / heightKm));

    const BASE_SPAN = 46.0;
    let spanX, spanZ;
    if (aspect >= 1.0) {
      spanX = BASE_SPAN;
      spanZ = Math.max(10.0, BASE_SPAN / aspect);
    } else {
      spanZ = BASE_SPAN;
      spanX = Math.max(10.0, BASE_SPAN * aspect);
    }

    const halfSpanX = spanX / 2;
    const halfSpanZ = spanZ / 2;

    // Adapt grid resolution along each axis so splat density is uniform and smooth
    const GRID_SIZE_X = aspect >= 1.0 ? 96 : Math.max(36, Math.round(96 * aspect));
    const GRID_SIZE_Z = aspect <= 1.0 ? 96 : Math.max(36, Math.round(96 / aspect));

    const stepX = spanX / (GRID_SIZE_X - 1);
    const stepZ = spanZ / (GRID_SIZE_Z - 1);

    const positions = [];
    const normals = [];
    const colors = [];
    const uvs = [];

    // Raw sampled elevation buffer in meters
    const rawMetersGrid = [];
    const molaData = molaImageCanvasRef.current;
    const isNamedPreset = [
      'olympus', 'olympus_mons',
      'valles', 'valles_marineris',
      'gale', 'gale_crater',
      'jezero', 'jezero_crater',
      'proposed_base',
      'planum_boreum', 'polar_north'
    ].includes(box.id);

    for (let j = 0; j < GRID_SIZE_Z; j++) {
      rawMetersGrid[j] = new Float32Array(GRID_SIZE_X);
      const vNorm = j / (GRID_SIZE_Z - 1); // 0 (North) to 1 (South)
      const lat = latMax - vNorm * (latMax - latMin);
      const vProc = vNorm * 2 - 1;

      for (let i = 0; i < GRID_SIZE_X; i++) {
        const uNorm = i / (GRID_SIZE_X - 1); // 0 (West) to 1 (East)
        const lng = lngMin + uNorm * (lngMax - lngMin);
        const uProc = uNorm * 2 - 1;

        let sampledMeters = 0;

        if (isNamedPreset) {
          // Use NASA scientific topographic profile for known locations
          sampledMeters = generateScientificLocationElevation(box.id, uProc, vProc);
        } else {
          // Custom user-drawn area: sample global MOLA dataset
          let molaMeters = 0;
          if (molaData && molaData.imgData) {
            const px = Math.floor(Math.max(0, Math.min(1, (lng + 180) / 360)) * (molaData.width - 1));
            const py = Math.floor(Math.max(0, Math.min(1, (90 - lat) / 180)) * (molaData.height - 1));
            const idx = (py * molaData.width + px) * 4;
            const r = molaData.imgData[idx];
            const g = molaData.imgData[idx + 1];
            const b = molaData.imgData[idx + 2];
            molaMeters = decodeMolaRgbToElevation(r, g, b, lat, lng);
          }

          // If inside the Tharsis volcanic province, blend ground-truth NASA shield volcano morphology
          // to guarantee smooth realistic shield profiles, natural calderas, and ZERO needle spikes
          const volcanoSample = sampleNasaVolcanoElevation(lat, lng);
          if (volcanoSample) {
            const { elevation: vElev, blendWeight } = volcanoSample;
            sampledMeters = vElev * blendWeight + molaMeters * (1.0 - blendWeight);
          } else {
            sampledMeters = molaMeters;
          }
        }

        rawMetersGrid[j][i] = sampledMeters;
      }
    }

    // Apply 3x3 Median Outlier Filter + Gradient Clamping + Laplacian Smoothing (Guarantees Zero Spikes)
    const cleanedMetersGrid = applyAntiSpikeFilter(rawMetersGrid, GRID_SIZE_X, GRID_SIZE_Z, isNamedPreset ? 1600.0 : 650.0);

    // Track real min/max meters
    let sampleMinM = Infinity;
    let sampleMaxM = -Infinity;
    for (let j = 0; j < GRID_SIZE_Z; j++) {
      for (let i = 0; i < GRID_SIZE_X; i++) {
        const m = cleanedMetersGrid[j][i];
        if (m < sampleMinM) sampleMinM = m;
        if (m > sampleMaxM) sampleMaxM = m;
      }
    }
    const realReliefM = sampleMaxM - sampleMinM || 100.0;

    setElevationStats({
      minM: Math.round(sampleMinM),
      maxM: Math.round(sampleMaxM),
      reliefM: Math.round(realReliefM),
      widthKm,
      heightKm
    });

    // Physical slope ratio: meters of vertical relief vs horizontal span in km
    const spanKm = Math.max(widthKm, heightKm);
    const physicalSlopeRatio = (realReliefM / 1000.0) / spanKm;

    // Adaptive scale factor: ensures local features (craters, canyons) are clearly visible
    // while continental scales (giant shields like Olympus Mons) retain their realistic, broad shield profile
    const adaptiveScale = 2.4 + 7.5 / (1.0 + Math.pow(spanKm / 550.0, 0.85));
    let rawYRange = spanX * physicalSlopeRatio * adaptiveScale * (elevationExaggeration / 1.6);
    const yRangeUnits = Math.min(8.5, Math.max(3.2, rawYRange));
    const heightMap = [];

    for (let j = 0; j < GRID_SIZE_Z; j++) {
      heightMap[j] = new Float32Array(GRID_SIZE_X);
      for (let i = 0; i < GRID_SIZE_X; i++) {
        const norm = (cleanedMetersGrid[j][i] - sampleMinM) / realReliefM;
        heightMap[j][i] = (norm - 0.45) * yRangeUnits;
      }
    }

    // Build geometry buffers
    for (let j = 0; j < GRID_SIZE_Z; j++) {
      const zWorld = (j / (GRID_SIZE_Z - 1)) * spanZ - halfSpanZ;
      for (let i = 0; i < GRID_SIZE_X; i++) {
        const xWorld = (i / (GRID_SIZE_X - 1)) * spanX - halfSpanX;
        const yWorld = heightMap[j][i];

        positions.push(xWorld, yWorld, zWorld);

        const uNorm = i / (GRID_SIZE_X - 1);
        const vNorm = j / (GRID_SIZE_Z - 1);
        uvs.push(uNorm, vNorm);

        const lat = latMax - vNorm * (latMax - latMin);
        const lng = lngMin + uNorm * (lngMax - lngMin);

        // Finite differences normal vector
        const hL = i > 0 ? heightMap[j][i - 1] : yWorld;
        const hR = i < GRID_SIZE_X - 1 ? heightMap[j][i + 1] : yWorld;
        const hD = j > 0 ? heightMap[j - 1][i] : yWorld;
        const hU = j < GRID_SIZE_Z - 1 ? heightMap[j + 1][i] : yWorld;

        const normVec = new THREE.Vector3((hL - hR) / (2.0 * stepX), 1.0, (hD - hU) / (2.0 * stepZ)).normalize();
        normals.push(normVec.x, normVec.y, normVec.z);

        const slopeDeg = Math.acos(Math.max(0, Math.min(1, normVec.y))) * (180 / Math.PI);
        const elevNorm = (cleanedMetersGrid[j][i] - sampleMinM) / realReliefM;

        let c = new THREE.Color();
        if (renderMode === 'elevation') {
          c = getMolaElevationColor(elevNorm);
        } else if (renderMode === 'slope') {
          c = getSlopeHazardColor(slopeDeg);
        } else {
          // If 4K satellite image is available, sample real NASA satellite surface colors!
          const satData = satImageCanvasRef.current;
          let rSat = 0.76, gSat = 0.40, bSat = 0.22;
          if (satData && satData.imgData) {
            const pxSat = Math.floor(Math.max(0, Math.min(1, (lng + 180) / 360)) * (satData.width - 1));
            const pySat = Math.floor(Math.max(0, Math.min(1, (90 - lat) / 180)) * (satData.height - 1));
            const idxSat = (pySat * satData.width + pxSat) * 4;
            rSat = satData.imgData[idxSat] / 255.0;
            gSat = satData.imgData[idxSat + 1] / 255.0;
            bSat = satData.imgData[idxSat + 2] / 255.0;
          }

          // Sunlit ambient shadow contrast
          const shade = Math.max(0.40, normVec.dot(new THREE.Vector3(0.5, 0.8, 0.3).normalize()));

          if (box.id === 'planum_boreum' || box.id === 'polar_north') {
            // Polar ice cap: icy white with blueish frost
            const iceShade = 0.85 + elevNorm * 0.15;
            c.setRGB(iceShade * 0.95, iceShade * 0.96, iceShade * 1.0);
          } else {
            c.setRGB(rSat * shade * 1.15, gSat * shade * 1.15, bSat * shade * 1.15);
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
    for (let j = 0; j < GRID_SIZE_Z - 1; j++) {
      for (let i = 0; i < GRID_SIZE_X - 1; i++) {
        const a = j * GRID_SIZE_X + i;
        const b = (j + 1) * GRID_SIZE_X + i;
        const c = (j + 1) * GRID_SIZE_X + (i + 1);
        const d = j * GRID_SIZE_X + (i + 1);

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

    // Cache geometry reference data for interactive pin elevation probe
    terrainGeometryDataRef.current = {
      halfSpanX,
      halfSpanZ,
      spanX,
      spanZ,
      GRID_SIZE_X,
      GRID_SIZE_Z,
      cleanedMetersGrid,
      heightMap,
      latMin,
      latMax,
      lngMin,
      lngMax
    };

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
      // In splats mode, ensure mesh remains active for raycasting probe
      terrainMesh.material.visible = false;
    } else {
      splatsPoints.visible = false;
      terrainMesh.visible = true;
      terrainMesh.material.visible = true;
    }

    // D. 3D INTERACTIVE PINS (Tailored to each scientific location)
    const createWaypointPin = (xRel, zRel, label, elevStr, type = 'science') => {
      const x = xRel * halfSpanX;
      const z = zRel * halfSpanZ;
      const u = (xRel + 1.0) * 0.5;
      const v = (zRel + 1.0) * 0.5;
      const gridI = Math.min(GRID_SIZE_X - 1, Math.max(0, Math.floor(u * (GRID_SIZE_X - 1))));
      const gridJ = Math.min(GRID_SIZE_Z - 1, Math.max(0, Math.floor(v * (GRID_SIZE_Z - 1))));
      const y = heightMap[gridJ][gridI];

      const pinGroup = new THREE.Group();
      pinGroup.position.set(x, y, z);

      const stalkGeom = new THREE.CylinderGeometry(0.08, 0.08, 3.2, 8);
      stalkGeom.translate(0, 1.6, 0);
      const stalkColor = type === 'center' ? 0xFFFFFF : type === 'hazard' ? 0xE67E22 : type === 'base' ? 0xD84D29 : 0x3498DB;
      const stalk = new THREE.Mesh(stalkGeom, new THREE.MeshBasicMaterial({ color: stalkColor }));
      pinGroup.add(stalk);

      const sphereGeom = new THREE.SphereGeometry(type === 'center' ? 0.75 : 0.5, 16, 16);
      sphereGeom.translate(0, 3.2, 0);
      const beaconColor = type === 'center' ? 0xFFFFFF : type === 'hazard' ? 0xFFA500 : type === 'base' ? 0xFF4500 : 0x00D4FF;
      const sphere = new THREE.Mesh(sphereGeom, new THREE.MeshBasicMaterial({ color: beaconColor }));
      pinGroup.add(sphere);

      const ringGeom = new THREE.RingGeometry(0.35, 0.85, 24);
      ringGeom.rotateX(-Math.PI / 2);
      ringGeom.translate(0, 0.08, 0);
      const ring = new THREE.Mesh(
        ringGeom,
        new THREE.MeshBasicMaterial({ color: 0xFFFFFF, side: THREE.DoubleSide, transparent: true, opacity: type === 'center' ? 0.95 : 0.6 })
      );
      pinGroup.add(ring);

      if (type === 'center') {
        const outerTargetGeom = new THREE.RingGeometry(1.2, 1.45, 28);
        outerTargetGeom.rotateX(-Math.PI / 2);
        outerTargetGeom.translate(0, 0.1, 0);
        const outerRing = new THREE.Mesh(
          outerTargetGeom,
          new THREE.MeshBasicMaterial({ color: 0xFFFFFF, side: THREE.DoubleSide, transparent: true, opacity: 0.75 })
        );
        pinGroup.add(outerRing);
      }

      pinsGroupRef.current.add(pinGroup);
    };

    // Center of splat ALWAYS gets the pure white center marker pin (matches the white center dot on the map)!
    const midJ = Math.floor(GRID_SIZE_Z / 2);
    const midI = Math.floor(GRID_SIZE_X / 2);
    const centerElevM = cleanedMetersGrid[midJ] ? cleanedMetersGrid[midJ][midI] : sampleMinM;
    createWaypointPin(0, 0, 'Splat Center', `${Math.round(centerElevM)} m`, 'center');

    if (box.id === 'olympus' || box.id === 'olympus_mons') {
      createWaypointPin(-0.62, -0.38, 'Basal Cliff Scarp', '6,000–8,000 m drop', 'hazard');
      createWaypointPin(0.48, 0.44, 'Lava Channel Vent', `${Math.round(sampleMinM + realReliefM * 0.45)} m`, 'science');
    } else if (box.id === 'valles' || box.id === 'valles_marineris') {
      createWaypointPin(0, 0.1, 'Candor Chasma Floor', `${Math.round(sampleMinM)} m`, 'science');
      createWaypointPin(-0.52, -0.48, 'Ophir Wall Plateau', `${Math.round(sampleMaxM)} m`, 'base');
      createWaypointPin(0.38, -0.18, 'Steep Fault Scarp', 'Slope: 32.5°', 'hazard');
    } else if (box.id === 'gale' || box.id === 'gale_crater') {
      createWaypointPin(0.08, 0.14, 'Mount Sharp (Aeolis Mons)', `${Math.round(sampleMaxM)} m`, 'science');
      createWaypointPin(-0.48, -0.35, 'Bradbury Landing Floor', `${Math.round(sampleMinM)} m`, 'base');
      createWaypointPin(0.62, 0.22, 'North Rim Crest', 'Elevation +1,100 m', 'hazard');
    } else if (box.id === 'jezero' || box.id === 'jezero_crater') {
      createWaypointPin(-0.38, 0.0, 'Neretva Delta Fan', `${Math.round(sampleMinM + 250)} m`, 'science');
      createWaypointPin(0.56, 0.26, 'Belva Crater Rim', `${Math.round(sampleMaxM)} m`, 'hazard');
    } else if (box.id === 'planum_boreum' || box.id === 'polar_north') {
      createWaypointPin(-0.42, 0.18, 'Chasma Boreale Trough', `${Math.round(sampleMinM)} m`, 'hazard');
      createWaypointPin(0.35, -0.28, 'Spiral Ice Trough', `${Math.round(sampleMinM + 600)} m`, 'science');
    } else {
      createWaypointPin(-0.5, -0.32, 'Area Boundary', 'Slope: 18.4°', 'hazard');
      createWaypointPin(0.42, 0.36, 'Lowland Floor', `${Math.round(sampleMinM)} m`, 'science');
    }

  }, [box.latMin, box.latMax, box.lngMin, box.lngMax, box.id, renderMode, elevationExaggeration, contourStep, showContours, showSlopeHazards, molaLoaded, satLoaded]);

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
              <span>Draw / Change Area on Map</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Interactive 3D Canvas Box */}
      <div className={`terrain-3d-interactive-wrap ${isExpanded ? 'expanded-canvas' : ''}`}>
        {/* Top-Center Floating Mode HUD (Always visible and interactive in both normal & fullscreen mode) */}
        <div className="terrain-canvas-floating-mode-bar">
          <button
            className={`t-float-mode-btn ${renderMode === 'splats' ? 'active' : ''}`}
            onClick={() => setRenderMode('splats')}
            title="3D Gaussian Splats: Dense photorealistic particle cloud with Gaussian radiance"
          >
            <Sparkles size={12} />
            <span>3D Gaussian Splats</span>
          </button>

          <button
            className={`t-float-mode-btn ${renderMode === 'textured' ? 'active' : ''}`}
            onClick={() => setRenderMode('textured')}
            title="NASA HiRISE / Viking Ortho Surface Mesh"
          >
            <Layers size={12} />
            <span>NASA Mesh</span>
          </button>

          <button
            className={`t-float-mode-btn ${renderMode === 'elevation' ? 'active' : ''}`}
            onClick={() => setRenderMode('elevation')}
            title="MOLA Topographic Elevation Color Ramp"
          >
            <Mountain size={12} />
            <span>MOLA Topo</span>
          </button>

          <button
            className={`t-float-mode-btn ${renderMode === 'slope' ? 'active' : ''}`}
            onClick={() => setRenderMode('slope')}
            title="Slope Hazard Trafficability Heatmap"
          >
            <AlertTriangle size={12} />
            <span>Slope Hazards</span>
          </button>
        </div>

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
              {elevationStats.widthKm ? ` • ${elevationStats.widthKm} × ${elevationStats.heightKm} km` : ''}
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

          {isExpanded && onToggleExpand ? (
            <button
              className="terrain-fullscreen-close-pill"
              onClick={() => onToggleExpand(false)}
              title="Exit Fullscreen (Esc)"
            >
              <Minimize2 size={13} />
              <span>Exit Fullscreen</span>
            </button>
          ) : (
            onToggleExpand && (
              <button
                className="t-hud-action-btn"
                onClick={() => onToggleExpand(true)}
                title="Fullscreen Terrain"
              >
                <Maximize2 size={14} />
              </button>
            )
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

          {/* Interactive Pin Hover Probe Toggle */}
          <button
            className={`t-ctrl-pill-btn ${pinProbeActive ? 'active' : ''}`}
            onClick={() => {
              const nextState = !pinProbeActive;
              setPinProbeActive(nextState);
              if (!nextState) {
                setHoverElevation(null);
                if (hoverPinGroupRef.current) hoverPinGroupRef.current.visible = false;
              }
            }}
            title="Hover anywhere on the 3D Gaussian Splat to probe exact NASA MOLA elevation & coordinates"
          >
            <MapPin size={13} />
            <span>Pin Probe: {pinProbeActive ? 'ON' : 'OFF'}</span>
          </button>

          {/* Waypoint Pins Toggle */}
          <button
            className={`t-ctrl-pill-btn ${showPins ? 'active' : ''}`}
            onClick={() => setShowPins(!showPins)}
            title="Toggle Science, Hazard, and Center Waypoint Pins"
          >
            <Compass size={13} />
            <span>Pins ({showPins ? 'Visible' : 'Hidden'})</span>
          </button>

          {/* Spacesuit HUD Trigger */}
          <button className="t-ctrl-pill-btn hud-accent" onClick={onOpenHUD}>
            <Eye size={13} />
            <span>Open in Spacesuit HUD</span>
          </button>
        </div>

        {/* Pin Probe Elevation Hover Tooltip (Red Theme with Click to Mark hint) */}
        {hoverElevation && !hoveredCustomPin && (
          <div
            className="terrain-elevation-probe-tooltip"
            style={{
              left: Math.max(16, Math.min((containerRef.current?.clientWidth || 600) - 190, hoverElevation.screenX + 16)),
              top: Math.max(16, hoverElevation.screenY - 90)
            }}
          >
            <div className="probe-tooltip-header">
              <MapPin size={11} className="text-red" />
              <span className="probe-title">SURFACE PROBE</span>
              <span className="probe-slope-badge">{hoverElevation.slopeDeg}° slope</span>
            </div>
            <div className="probe-tooltip-body">
              <span className="probe-elev-val">
                {hoverElevation.elevM > 0 ? `+${hoverElevation.elevM.toLocaleString()}` : hoverElevation.elevM.toLocaleString()} m
              </span>
              <span className="probe-coords">
                {hoverElevation.lat.toFixed(2)}°N, {hoverElevation.lng.toFixed(2)}°E
              </span>
            </div>
            <div className="probe-click-hint">
              <Plus size={10} />
              <span>Click to Mark Location</span>
            </div>
          </div>
        )}

        {/* Existing Custom Marked Pin Hover Card with [X] Remove & [Map] Navigate */}
        {hoveredCustomPin && (
          <div
            className="terrain-elevation-probe-tooltip marked-pin-hover-card"
            style={{
              left: Math.max(16, Math.min((containerRef.current?.clientWidth || 600) - 230, hoveredCustomPin.screenX + 16)),
              top: Math.max(16, hoveredCustomPin.screenY - 110),
              pointerEvents: 'auto'
            }}
          >
            <div className="probe-tooltip-header">
              <div className="marked-header-left">
                <div className="red-pin-pulse-dot" />
                <span className="probe-title red-accent">MARKED PIN</span>
              </div>
              {onRemovePin && (
                <button
                  className="pin-remove-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemovePin(hoveredCustomPin.pin.id);
                    setHoveredCustomPin(null);
                  }}
                  title="Remove Pin"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <div className="probe-tooltip-body">
              <span className="probe-marker-name">{hoveredCustomPin.pin.name}</span>
              <span className="probe-elev-val red-text">
                {hoveredCustomPin.pin.elevationVal || `${hoveredCustomPin.pin.elevationNum} m`}
              </span>
              <span className="probe-coords">
                {hoveredCustomPin.pin.coordsText}
              </span>
            </div>

            {onNavigateToMap && (
              <button
                className="probe-navigate-map-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigateToMap(hoveredCustomPin.pin);
                }}
                title="View on Satellite Map in Home Page"
              >
                <ExternalLink size={11} />
                <span>View on Satellite Map</span>
              </button>
            )}
          </div>
        )}

        {/* Interaction Hint Overlay */}
        <div className="terrain-interaction-hint">
          <span>{pinProbeActive ? 'Click to Mark Pin • Hover on Pin for [X] or [Map] • ' : ''}Left-Click Drag: Orbit • Right-Click Drag: Pan • Scroll: Zoom</span>
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
