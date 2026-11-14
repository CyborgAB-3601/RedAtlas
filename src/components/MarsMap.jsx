import React, { useState, useRef } from 'react';
import Mars3DGlobe from './Mars3DGlobe';
import MarsTrekTiledLayer from './MarsTrekTiledLayer';
import MarsTrekLeafletMap from './MarsTrekLeafletMap';
import {
  Compass,
  Plus,
  Minus,
  Layers,
  Maximize2,
  Minimize2,
  Flag,
  Grid,
  ChevronDown,
  Mountain,
  Bookmark,
  ArrowRight,
  AlertTriangle,
  Navigation,
  MapPin,
  GitBranch,
  Radio,
  User,
  Ruler,
  Crosshair,
  Check,
  Droplet,
  Sun,
  CircleDot
} from 'lucide-react';

// Smooth Catmull-Rom spline to cubic bezier path generator
function getSmoothCurvePath(pts, scaleX = 10, scaleY = 6) {
  if (!pts || pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x * scaleX} ${pts[0].y * scaleY}`;

  const coords = pts.map((p) => ({ x: p.x * scaleX, y: p.y * scaleY }));
  let d = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;

  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[Math.max(i - 1, 0)];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[Math.min(i + 2, coords.length - 1)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }

  return d;
}

// Regional configuration profiles for official NASA perspectives
export const REGIONAL_CONFIGS = {
  'Mars Global View': {
    title: 'Mars',
    subtitle: 'EXPLORE THE SURFACE, PLAN YOUR MISSIONS, AND IDENTIFY THE BEST LOCATIONS FOR FUTURE EXPLORATION.',
    scaleTicks: ['0', '100', '200', '300 KM'],
    defaultZoom: 1.0,
    defaultPan: { x: 0, y: 0 }
  },
  'Equatorial Basin': {
    title: 'Equatorial Basin',
    subtitle: 'EQUATORIAL CANYON & DELTA LOWLANDS: VALLES MARINERIS CHASMATA & JEZERO PALEOLAKE BASIN.',
    scaleTicks: ['0', '25', '50', '100 KM'],
    defaultZoom: 1.65,
    defaultPan: { x: -80, y: -25 }
  },
  'Polar Ice Caps': {
    title: 'Polar Ice Caps',
    subtitle: 'POLAR LAYERED DEPOSITS: PLANUM BOREUM WATER-ICE SHEETS, KOROLEV ICE LAKE & CRYOGENIC CO2.',
    scaleTicks: ['0', '50', '100', '150 KM'],
    defaultZoom: 1.75,
    defaultPan: { x: -10, y: 150 }
  },
  'Tharsis Rise': {
    title: 'Tharsis Rise',
    subtitle: 'THARSIS VOLCANIC PROVINCE: OLYMPUS MONS (21.3 KM), CALDERA RIM & SHIELDED LAVA TUBES.',
    scaleTicks: ['0', '50', '100', '200 KM'],
    defaultZoom: 1.75,
    defaultPan: { x: 190, y: -20 }
  }
};

function parseCoords(coordsStr) {
  if (!coordsStr || typeof coordsStr !== 'string') return null;
  const parts = coordsStr.split(',');
  if (parts.length < 2) return null;
  const latStr = parts[0].trim();
  const lngStr = parts[1].trim();
  const lat = parseFloat(latStr) * (latStr.includes('S') ? -1 : 1);
  const lng = parseFloat(lngStr) * (lngStr.includes('W') ? -1 : 1);
  if (isNaN(lat) || isNaN(lng)) return null;
  return { lat, lng };
}

function normalizeLng(lng) {
  let val = lng;
  while (val > 180) val -= 360;
  while (val < -180) val += 360;
  return val;
}

export default function MarsMap({
  selectedLocation,
  onSelectLocation,
  viewMode,
  setViewMode,
  isExpanded = false,
  onToggleExpand,
  activeMission,
  onOpenMissions,
  pinnedLocations = [],
  onRemovePin
}) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isGlobalDropdownOpen, setIsGlobalDropdownOpen] = useState(false);
  const [globalView, setGlobalView] = useState('Mars Global View');
  const currentRegion = REGIONAL_CONFIGS[globalView] || REGIONAL_CONFIGS['Mars Global View'];
  const [activeTool, setActiveTool] = useState('Explore');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isDestinationSet, setIsDestinationSet] = useState(false);

  // Real-time map viewport bounds tracking for the dynamic Minimap camera box
  const [mapViewportState, setMapViewportState] = useState({
    north: 50,
    south: -50,
    west: -115,
    east: 45,
    centerLat: 0,
    centerLng: -35,
    zoom: 1
  });

  // Calculate dynamic bounding box rectangle on the Mars Global minimap
  const minimapRectStyle = React.useMemo(() => {
    let cLat = mapViewportState.centerLat;
    let cLng = mapViewportState.centerLng;
    let zoom = mapViewportState.zoom || 1;

    if (selectedLocation?.coords?.lat && selectedLocation?.coords?.lng && zoom > 1.4) {
      const latVal = parseFloat(selectedLocation.coords.lat) * (selectedLocation.coords.lat.includes('S') ? -1 : 1);
      const lngVal = parseFloat(selectedLocation.coords.lng) * (selectedLocation.coords.lng.includes('W') ? -1 : 1);
      if (!isNaN(latVal) && !isNaN(lngVal)) {
        cLat = latVal;
        cLng = lngVal;
      }
    }

    const latPercent = ((90 - cLat) / 180) * 100;
    const lngPercent = ((normalizeLng(cLng) + 180) / 360) * 100;

    const widthPct = Math.max(12, Math.min(85, 80 / Math.pow(1.85, Math.max(0, zoom - 1))));
    const heightPct = Math.max(10, Math.min(75, 60 / Math.pow(1.85, Math.max(0, zoom - 1))));

    const leftClamped = Math.max(widthPct / 2, Math.min(100 - widthPct / 2, lngPercent));
    const topClamped = Math.max(heightPct / 2, Math.min(100 - heightPct / 2, latPercent));

    return {
      left: `${leftClamped}%`,
      top: `${topClamped}%`,
      width: `${widthPct}%`,
      height: `${heightPct}%`,
      transform: 'translate(-50%, -50%)',
      position: 'absolute'
    };
  }, [mapViewportState, selectedLocation?.coords, zoomLevel]);

  // Click on minimap flies to that region on Mars
  const handleMinimapClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / rect.width;
    const clickY = (e.clientY - rect.top) / rect.height;

    const targetLng = (clickX * 360) - 180;
    const targetLat = 90 - (clickY * 180);

    if (viewMode === '3D') {
      const latStr = `${Math.abs(targetLat).toFixed(1)}° ${targetLat >= 0 ? 'N' : 'S'}`;
      const lngStr = `${Math.abs(targetLng).toFixed(1)}° ${targetLng >= 0 ? 'E' : 'W'}`;
      onSelectLocation({
        id: 'minimap_target',
        name: `Mars (${latStr}, ${lngStr})`,
        coords: { lat: latStr, lng: lngStr }
      });
    } else if (leafletRef.current?.flyToLocation) {
      leafletRef.current.flyToLocation(targetLat, targetLng, Math.max(2, zoomLevel));
    }
  };

  // Leaflet official Mars Trek slippy map ref
  const leafletRef = useRef(null);

  // Swipeable & draggable tags track refs and event handlers
  const tagsTrackRef = useRef(null);
  const isDraggingTags = useRef(false);
  const startXTags = useRef(0);
  const scrollLeftTags = useRef(0);

  // Viewport container measurement ref for high-res WMTS tiling
  const mapViewportRef = useRef(null);
  const [viewportDims, setViewportDims] = useState({ width: 1000, height: 600 });

  // Top Title vs 3D Satellite Bubble collision detection
  const titleOverlayRef = useRef(null);
  const titleTextRef = useRef(null);
  const bubbleOverlayRef = useRef(null);
  const [isTextPushedDown, setIsTextPushedDown] = useState(false);

  React.useEffect(() => {
    const checkCollision = () => {
      if (!mapViewportRef.current) return;
      const viewportWidth = mapViewportRef.current.clientWidth || 1000;
      const bubbleWidth = bubbleOverlayRef.current?.offsetWidth || 340;
      const textWidth = titleTextRef.current?.scrollWidth || 200;

      // Available width at top between left margin (28px) and bubble (right margin 28px + safety gap 24px)
      const collisionThreshold = viewportWidth - bubbleWidth - 80;

      if (textWidth > collisionThreshold) {
        setIsTextPushedDown(true);
      } else {
        setIsTextPushedDown(false);
      }
    };

    checkCollision();
    const rafId = requestAnimationFrame(checkCollision);
    window.addEventListener('resize', checkCollision);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', checkCollision);
    };
  }, [selectedLocation?.name, currentRegion?.title, isExpanded, viewMode]);

  React.useEffect(() => {
    const updateDims = () => {
      if (mapViewportRef.current) {
        setViewportDims({
          width: mapViewportRef.current.clientWidth || 1000,
          height: mapViewportRef.current.clientHeight || 600
        });
      }
    };
    updateDims();
    window.addEventListener('resize', updateDims);
    return () => window.removeEventListener('resize', updateDims);
  }, []);

  // Smooth wheel zoom with non-passive event listener
  React.useEffect(() => {
    const el = mapViewportRef.current;
    if (!el) return;
    const onWheelHandler = (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.25 : -0.25;
      setZoomLevel((prev) => Math.min(Math.max(parseFloat((prev + delta).toFixed(2)), 0.8), 5.0));
    };
    el.addEventListener('wheel', onWheelHandler, { passive: false });
    return () => el.removeEventListener('wheel', onWheelHandler);
  }, []);

  const handleTagsMouseDown = (e) => {
    isDraggingTags.current = true;
    if (tagsTrackRef.current) {
      startXTags.current = e.pageX - tagsTrackRef.current.offsetLeft;
      scrollLeftTags.current = tagsTrackRef.current.scrollLeft;
    }
  };

  const handleTagsMouseMove = (e) => {
    if (!isDraggingTags.current || !tagsTrackRef.current) return;
    e.preventDefault();
    const x = e.pageX - tagsTrackRef.current.offsetLeft;
    const walk = (x - startXTags.current) * 1.5;
    tagsTrackRef.current.scrollLeft = scrollLeftTags.current - walk;
  };

  const handleTagsMouseUpOrLeave = () => {
    isDraggingTags.current = false;
  };

  const handleTagsWheel = (e) => {
    if (tagsTrackRef.current && Math.abs(e.deltaY) > 0) {
      tagsTrackRef.current.scrollLeft += e.deltaY;
    }
  };

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isExpanded && onToggleExpand) {
        onToggleExpand(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded, onToggleExpand]);

  // Normal view waypoints
  const normalWaypoints = [
    {
      id: 'olympus',
      name: 'Olympus Mons',
      coords: '18.7° N, 133.8° W',
      elev: '21,287 m',
      x: 23.5,
      y: 37.0,
      type: 'waypoint',
      tag: 'Volcano'
    },
    {
      id: 'valles',
      name: 'Valles Marineris',
      coords: '14.0° S, 59.3° W',
      elev: '-7,000 m',
      x: 29.3,
      y: 49.5,
      type: 'waypoint',
      tag: 'Canyon'
    },
    {
      id: 'proposed_base',
      name: 'Proposed Base Site',
      coords: '14.6° N, 32.3° E',
      elev: '-2,450 m',
      x: 45.6,
      y: 37.8,
      type: 'base',
      isBase: true,
      tag: 'Primary Objective'
    },
    {
      id: 'jezero',
      name: 'Jezero Crater',
      coords: '18.4° N, 77.6° E',
      elev: '-2,500 m',
      x: 59.8,
      y: 53.2,
      type: 'waypoint',
      tag: 'Crater'
    },
    {
      id: 'gale',
      name: 'Gale Crater',
      coords: '5.4° S, 137.8° E',
      elev: '-4,500 m',
      x: 52.8,
      y: 63.4,
      type: 'waypoint',
      tag: 'Crater'
    }
  ];

  // Expanded 3D landscape waypoints matching user screenshot
  const expandedWaypoints = [
    {
      id: 'olympus',
      name: 'Olympus Mons',
      sub: '22.5 km',
      x: 12,
      y: 20,
      dotX: 13.5,
      dotY: 25,
      icon: Mountain,
      hasArrow: true
    },
    {
      id: 'waypoint_2',
      name: 'Waypoint 2',
      sub: '38.6 km',
      x: 33,
      y: 29,
      dotX: 34.5,
      dotY: 33,
      icon: Flag,
      hasArrow: false
    },
    {
      id: 'valles',
      name: 'Valles Marineris',
      sub: '4.2 km deep',
      x: 25,
      y: 44,
      dotX: 27,
      dotY: 48,
      icon: Mountain,
      hasArrow: false
    },
    {
      id: 'rover_01',
      name: 'Rover 01',
      sub: 'Exploring',
      x: 35,
      y: 56,
      dotX: 36.5,
      dotY: 60,
      icon: Radio,
      hasArrow: false
    },
    {
      id: 'proposed_base',
      name: 'Proposed Base Site',
      coords: '14.6° N, 32.3° E',
      x: 55,
      y: 39,
      dotX: 54.2,
      dotY: 44,
      isBase: true
    },
    {
      id: 'drone_02',
      name: 'Drone 02',
      sub: 'Mapping',
      x: 77,
      y: 29,
      dotX: 76.5,
      dotY: 35,
      icon: Navigation,
      hasArrow: false
    },
    {
      id: 'jezero',
      name: 'Jezero Crater',
      sub: '861 m',
      x: 84,
      y: 53,
      dotX: 85,
      dotY: 57,
      icon: CircleDot,
      hasArrow: false
    },
    {
      id: 'gale',
      name: 'Gale Crater',
      sub: '5.4 km',
      x: 74,
      y: 64,
      dotX: 75,
      dotY: 67,
      icon: CircleDot,
      hasArrow: false
    }
  ];

  // Route path coordinates for normal map
  const routePoints = [
    { x: 23.5, y: 37.0, isNamed: true, id: 'olympus' },
    { x: 37.2, y: 36.8 },
    { x: 42.8, y: 40.8 },
    { x: 45.6, y: 37.8, isNamed: true, id: 'proposed_base' },
    { x: 51.5, y: 44.0 },
    { x: 54.0, y: 47.5 },
    { x: 56.8, y: 46.8 },
    { x: 61.2, y: 48.8 },
    { x: 59.8, y: 53.2, isNamed: true, id: 'jezero' },
    { x: 52.8, y: 63.4, isNamed: true, id: 'gale' }
  ];

  const svgPathData = getSmoothCurvePath(routePoints, 10, 6);

  // Expanded route path SVG curve connecting all sites
  const expandedRouteSvgPath = `
    M 135 150
    C 210 175, 275 190, 345 198
    C 300 230, 270 270, 270 288
    C 270 310, 330 340, 365 360
    C 410 330, 480 275, 542 264
    C 620 280, 710 240, 765 210
    C 770 250, 830 300, 850 342
    C 810 375, 775 390, 750 402
  `;

  // Regional configuration profiles for official NASA perspectives (defined at module level)

  const regionalWaypointsMap = {
    'Mars Global View': normalWaypoints,
    'Equatorial Basin': [
      {
        id: 'valles',
        name: 'Valles Marineris',
        coords: '14.0° S, 59.3° W',
        elev: '-7,000 m',
        x: 31.0,
        y: 48.0,
        type: 'waypoint',
        tag: 'Canyon Chasm'
      },
      {
        id: 'proposed_base',
        name: 'Proposed Base Site',
        coords: '14.6° N, 32.3° E',
        elev: '-2,450 m',
        x: 47.0,
        y: 38.5,
        type: 'base',
        isBase: true,
        tag: 'Primary Habitat'
      },
      {
        id: 'jezero',
        name: 'Jezero Crater (Delta)',
        coords: '18.4° N, 77.6° E',
        elev: '-2,500 m',
        x: 62.0,
        y: 50.0,
        type: 'waypoint',
        tag: 'River Delta'
      },
      {
        id: 'gale',
        name: 'Gale Crater (Mount Sharp)',
        coords: '5.4° S, 137.8° E',
        elev: '-4,500 m',
        x: 54.0,
        y: 62.0,
        type: 'waypoint',
        tag: 'Boxwork Ridge'
      }
    ],
    'Polar Ice Caps': [
      {
        id: 'planum_boreum',
        name: 'Planum Boreum',
        coords: '85.0° N, 0.0° E',
        elev: '-2,100 m',
        x: 48.0,
        y: 22.0,
        type: 'base',
        isBase: true,
        tag: 'North Polar Cap'
      },
      {
        id: 'korolev',
        name: 'Korolev Ice Crater',
        coords: '73.0° N, 165.0° E',
        elev: '-3,900 m',
        x: 64.0,
        y: 32.0,
        type: 'waypoint',
        tag: '1.8km Ice Dome'
      },
      {
        id: 'proposed_base',
        name: 'Chryse Sub-Polar Post',
        coords: '14.6° N, 32.3° E',
        elev: '-2,450 m',
        x: 36.0,
        y: 46.0,
        type: 'waypoint',
        tag: 'Relay Link'
      }
    ],
    'Tharsis Rise': [
      {
        id: 'olympus',
        name: 'Olympus Mons',
        coords: '18.7° N, 133.8° W',
        elev: '21,287 m',
        x: 26.0,
        y: 34.0,
        type: 'base',
        isBase: true,
        tag: 'Shield Volcano'
      },
      {
        id: 'ascraeus',
        name: 'Ascraeus Mons',
        coords: '11.9° N, 104.5° W',
        elev: '18,225 m',
        x: 44.0,
        y: 45.0,
        type: 'waypoint',
        tag: 'Tharsis Triad'
      },
      {
        id: 'tharsis_tubes',
        name: 'Lava Tube Skylights',
        coords: '14.2° N, 112.8° W',
        elev: '6,400 m',
        x: 36.0,
        y: 54.0,
        type: 'waypoint',
        tag: 'Subsurface Vault'
      }
    ]
  };

  const activeWaypoints = regionalWaypointsMap[globalView] || normalWaypoints;

  const getMapImageSrc = () => {
    if (viewMode === 'Elevation') return '/assets/nasa_jpl_marstrek_elevation.jpg';
    if (viewMode === 'Thermal') return '/assets/nasa_themis_thermal_global.jpg';
    // Official NASA JPL Mars Trek Viking MDIM 2.1 Color Satellite Mosaic (2048x1024)
    return '/assets/nasa_jpl_marstrek_satellite.jpg';
  };

  const getNasaAttribution = () => {
    if (viewMode === 'Elevation') return 'NASA MGS MOLA LASER ALTIMETER (463m/px DEM)';
    if (viewMode === 'Thermal') return 'NASA 2001 MARS ODYSSEY THEMIS IR MOSAIC (100m/px)';
    if (viewMode === '3D') return 'NASA JPL MARS TREK 3D SPHERICAL GLOBE (VIKING / MOLA / THEMIS)';
    return 'NASA VIKING MDIM 2.1 / HiRISE GLOBAL MOSAIC (232m/px)';
  };

  const handleSelectRegion = (viewName) => {
    setGlobalView(viewName);
    setIsGlobalDropdownOpen(false);
    const cfg = REGIONAL_CONFIGS[viewName];
    if (cfg) {
      setZoomLevel(cfg.defaultZoom);
      setPan(cfg.defaultPan);
    }
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleZoom = (delta) => {
    if (viewMode === '3D') {
      setZoomLevel((prev) => Math.min(Math.max(parseFloat((prev + delta).toFixed(2)), 0.8), 5.0));
    } else {
      if (delta > 0) {
        leafletRef.current?.zoomIn();
      } else {
        leafletRef.current?.zoomOut();
      }
    }
  };

  const dynamicScaleTicks = React.useMemo(() => {
    if (zoomLevel >= 4.0) return ['0', '5', '10', '15 KM'];
    if (zoomLevel >= 3.0) return ['0', '10', '20', '30 KM'];
    if (zoomLevel >= 2.0) return ['0', '25', '50', '75 KM'];
    if (zoomLevel >= 1.4) return ['0', '50', '100', '150 KM'];
    return currentRegion.scaleTicks;
  }, [zoomLevel, currentRegion.scaleTicks]);

  const resetView = () => {
    if (viewMode === '3D') {
      const cfg = REGIONAL_CONFIGS[globalView] || REGIONAL_CONFIGS['Mars Global View'];
      setZoomLevel(cfg.defaultZoom);
      setPan(cfg.defaultPan);
    } else {
      leafletRef.current?.resetView();
    }
  };

  const dockTools = [
    { name: 'Explore', icon: Navigation },
    { name: 'Waypoint', icon: MapPin },
    { name: 'Route', icon: GitBranch },
    { name: 'Rover', icon: Radio },
    { name: 'Astronaut', icon: User },
    { name: 'Measure', icon: Ruler },
    { name: 'Layers', icon: Layers }
  ];

  return (
    <div className={`mars-map-card ${isExpanded ? 'is-expanded-view' : ''}`}>
      {/* ---------------- LIVE INTERACTIVE MARS MAP (2D LEAFLET / 3D GLOBE) ---------------- */}
      {/* The authentic map is always preserved and active in full resolution across both normal & expanded views */}
      <div className={`mars-map-viewport ${isExpanded ? 'expanded-viewport' : ''}`}>
        {viewMode === '3D' ? (
          <div className="nasa-3d-frame-container animate-fade-in" style={{ width: '100%', height: '100%' }}>
            <Mars3DGlobe
              selectedLocation={selectedLocation}
              onSelectLocation={onSelectLocation}
              globalView={globalView}
              viewMode={viewMode}
              zoomLevel={zoomLevel}
              isExpanded={isExpanded}
            />
          </div>
        ) : (
          <MarsTrekLeafletMap
            ref={leafletRef}
            viewMode={viewMode}
            globalView={globalView}
            selectedLocation={selectedLocation}
            onSelectLocation={onSelectLocation}
            onZoomChange={(newZoom) => setZoomLevel(newZoom)}
            onViewportChange={(vp) => setMapViewportState(vp)}
            activeWaypoints={activeWaypoints}
            isExpanded={isExpanded}
            pinnedLocations={pinnedLocations}
            onRemovePin={onRemovePin}
          />
        )}
      </div>

      {/* ---------------- NORMAL ORBITAL MAP VIEW OVERLAYS ---------------- */}
      {!isExpanded && (
        <>
          {/* Top Left Title Overlay with Dynamic Collision-Adaptive Position */}
          <div
            ref={titleOverlayRef}
            className={`map-top-left-overlay ${isTextPushedDown ? 'pushed-down' : ''}`}
          >
            <span className="map-index-badge">04</span>
            <h1 ref={titleTextRef} className="map-main-title">{selectedLocation?.name || currentRegion.title}</h1>
            <p className="map-description">
              {selectedLocation?.subtitle || currentRegion.subtitle}
            </p>
          </div>

          {/* Top Right Mode Switcher Pill */}
          <div ref={bubbleOverlayRef} className="map-top-right-overlay">
            <div className="view-mode-pill-group">
              {['3D', 'Satellite', 'Elevation', 'Thermal'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`view-mode-btn ${viewMode === mode ? 'active' : ''}`}
                >
                  {mode}
                </button>
              ))}
            </div>
            <button
              className="fullscreen-btn"
              onClick={() => onToggleExpand && onToggleExpand(true)}
              title="Expand Fullscreen Map"
            >
              <Maximize2 size={16} />
            </button>
          </div>

          {/* Bottom Left Controls */}
          <div className="map-bottom-left-overlay">
            <div className="global-view-dropdown-wrap">
              <button
                className="global-view-btn"
                onClick={() => setIsGlobalDropdownOpen(!isGlobalDropdownOpen)}
              >
                <Grid size={15} />
                <span>{globalView}</span>
                <ChevronDown size={14} />
              </button>

              {isGlobalDropdownOpen && (
                <div className="global-dropdown-menu">
                  {['Mars Global View', 'Equatorial Basin', 'Polar Ice Caps', 'Tharsis Rise'].map((view) => (
                    <div
                      key={view}
                      className={`dropdown-item ${globalView === view ? 'selected' : ''}`}
                      onClick={() => handleSelectRegion(view)}
                    >
                      {view}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="map-scale-bar-container">
              <div className="scale-ticks">
                {dynamicScaleTicks.map((tick, idx) => (
                  <span key={idx} className="tick-label">{tick}</span>
                ))}
              </div>
              <div className="scale-line">
                <div className="tick-mark" style={{ left: '0%' }} />
                <div className="tick-mark" style={{ left: '33.3%' }} />
                <div className="tick-mark" style={{ left: '66.6%' }} />
                <div className="tick-mark" style={{ left: '100%' }} />
              </div>
            </div>
          </div>

          {/* Right Map Overlay Controls (Compass & Zoom) */}
          <div className="map-right-controls-overlay">
            <div className="compass-dial" onClick={resetView} title="Reset North Alignment & Perspective" role="button" tabIndex={0}>
              <Compass size={22} className="compass-icon" />
              <span className="compass-north-letter">N</span>
            </div>

            <div className="zoom-controls-pill">
              <button
                className="zoom-btn"
                onClick={() => handleZoom(0.25)}
                title="Zoom In"
              >
                <Plus size={16} />
              </button>
              <div className="zoom-divider" />
              <button
                className="zoom-btn"
                onClick={() => handleZoom(-0.25)}
                title="Zoom Out"
              >
                <Minus size={16} />
              </button>
              <div className="zoom-divider" />
              <button
                className="zoom-btn"
                onClick={() => {
                  const modes = ['Satellite', 'Thermal', 'Elevation', '3D'];
                  const next = modes[(modes.indexOf(viewMode) + 1) % modes.length];
                  setViewMode(next);
                }}
                title="Toggle Map Layer"
              >
                <Layers size={16} />
              </button>
            </div>
          </div>

          {/* Bottom Right Expand Button */}
          <button
            className="map-bottom-expand-btn"
            onClick={() => onToggleExpand && onToggleExpand(true)}
            title="Expand Full Map View"
          >
            <Maximize2 size={15} />
            <span className="expand-btn-text">Expand Map</span>
          </button>
        </>
      )}

      {/* ---------------- EXPANDED TACTICAL FULL VIEW OVERLAYS ---------------- */}
      {/* Overlays float on top of the live map with interactive destination card and dynamic minimap */}
      {isExpanded && (
        <div className="expanded-map-canvas-container" style={{ pointerEvents: 'none' }}>
          {/* Top Left Title Overlay in Expanded Mode */}
          <div
            className="map-top-left-overlay pushed-down"
            style={{ pointerEvents: 'auto', zIndex: 30 }}
          >
            <span className="map-index-badge">04 EXPANDED</span>
            <h1 className="map-main-title">{selectedLocation?.name || currentRegion.title}</h1>
            <p className="map-description">
              {selectedLocation?.subtitle || currentRegion.subtitle}
            </p>
          </div>

          {/* Top Right Controls (Layer Mode Switcher + Compass + Zoom + Collapse) */}
          <div className="expanded-top-right-bar" style={{ pointerEvents: 'auto', zIndex: 35 }}>
            {/* View Mode Switcher */}
            <div className="view-mode-pill-group">
              {['3D', 'Satellite', 'Elevation', 'Thermal'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`view-mode-btn ${viewMode === mode ? 'active' : ''}`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Compass */}
            <div className="expanded-compass-btn" onClick={resetView} title="North Orientation (Reset)">
              <span className="exp-compass-needle" />
              <span className="exp-compass-n">N</span>
            </div>

            {/* Zoom Controls */}
            <div className="expanded-zoom-pill">
              <button className="exp-zoom-btn" onClick={() => handleZoom(0.25)} title="Zoom In">
                <Plus size={16} />
              </button>
              <div className="exp-zoom-divider" />
              <button className="exp-zoom-btn" onClick={() => handleZoom(-0.25)} title="Zoom Out">
                <Minus size={16} />
              </button>
              <div className="exp-zoom-divider" />
              <button className="exp-zoom-btn" onClick={resetView} title="Recenter Target">
                <Crosshair size={15} />
              </button>
              <div className="exp-zoom-divider" />
              <button
                className="exp-zoom-btn exp-collapse-action-btn"
                onClick={() => onToggleExpand && onToggleExpand(false)}
                title="Collapse to Dashboard"
              >
                <Minimize2 size={16} />
              </button>
            </div>
          </div>

          {/* Bottom Left Floating Destination Card (White Glassmorphic) */}
          <div className="expanded-destination-card" style={{ pointerEvents: 'auto', zIndex: 30 }}>
            {/* Top Row: Thumbnail + Info */}
            <div className="dest-card-top-row">
              {/* Landscape Preview Image */}
              <div className="dest-thumb-box">
                <img
                  src={selectedLocation?.landscapeImg || "/assets/mars_base_site.jpg"}
                  alt={selectedLocation?.name || "Mars Destination"}
                  className="dest-thumb-img"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/assets/mars_base_site.jpg";
                  }}
                />
              </div>

              {/* Middle Description */}
              <div className="dest-info-box">
                <div className="dest-title-row">
                  <h3 className="dest-title">{selectedLocation?.name || 'Proposed Base Site'}</h3>
                  <button
                    className={`dest-bookmark-btn ${isBookmarked ? 'active' : ''}`}
                    onClick={() => setIsBookmarked(!isBookmarked)}
                    title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Site'}
                  >
                    <Bookmark size={15} fill={isBookmarked ? 'currentColor' : 'none'} />
                  </button>
                </div>
                <div className="dest-coords-line">
                  {selectedLocation?.coordsText || (selectedLocation?.coords ? `${selectedLocation.coords.lat}, ${selectedLocation.coords.lng}` : '14.6° N, 32.3° E')}
                </div>
                <p className="dest-desc-text">
                  {selectedLocation?.desc || selectedLocation?.subtitle || 'A potential location for future exploration and research, selected for its favorable terrain, resource availability, and scientific value.'}
                </p>

                <button
                  className={`dest-action-btn ${isDestinationSet ? 'set' : ''}`}
                  onClick={() => setIsDestinationSet(!isDestinationSet)}
                >
                  {isDestinationSet ? (
                    <>
                      <span>Destination Set</span>
                      <Check size={14} />
                    </>
                  ) : (
                    <>
                      <span>Set as Destination</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Bottom Row: Horizontally Swipeable/Scrollable Telemetry Tags */}
            <div
              ref={tagsTrackRef}
              className="dest-tags-horizontal-track"
              onMouseDown={handleTagsMouseDown}
              onMouseMove={handleTagsMouseMove}
              onMouseUp={handleTagsMouseUpOrLeave}
              onMouseLeave={handleTagsMouseUpOrLeave}
              onWheel={handleTagsWheel}
            >
              <div className="dest-metric-pill">
                <Mountain size={14} className="metric-icon" />
                <div className="metric-text-group">
                  <span className="metric-main">{selectedLocation?.coords?.elev || selectedLocation?.elevationVal || '-2,450 m'}</span>
                  <span className="metric-sub">Elevation</span>
                </div>
              </div>

              <div className="dest-metric-pill">
                <CircleDot size={14} className="metric-icon" />
                <div className="metric-text-group">
                  <span className="metric-main">{selectedLocation?.rockType || 'Basaltic'}</span>
                  <span className="metric-sub">Rock Type</span>
                </div>
              </div>

              <div className="dest-metric-pill">
                <Sun size={14} className="metric-icon" />
                <div className="metric-text-group">
                  <span className="metric-main">{selectedLocation?.solarExposure || 'High'}</span>
                  <span className="metric-sub">Solar Exposure</span>
                </div>
              </div>

              <div className="dest-metric-pill">
                <Droplet size={14} className="metric-icon" />
                <div className="metric-text-group">
                  <span className="metric-main">{selectedLocation?.waterIce || 'High probability'}</span>
                  <span className="metric-sub">Water Ice</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Right Floating Minimap with Dynamic Camera Zoom Bounding Box */}
          <div className="expanded-minimap-card" style={{ pointerEvents: 'auto', zIndex: 30 }}>
            <div className="minimap-header">
              <div className="minimap-title-group">
                <Grid size={13} className="minimap-globe-icon" />
                <span className="minimap-title-text">{globalView || 'Mars Global View'}</span>
              </div>
              <button
                className="minimap-expand-btn"
                onClick={() => onToggleExpand && onToggleExpand(false)}
                title="Collapse View"
              >
                <Minimize2 size={12} />
              </button>
            </div>

            {/* Interactive Mars Global View with Live Camera Bounding Box */}
            <div
              className="minimap-globe-wrap"
              onClick={handleMinimapClick}
              title="Click on Mars to re-center map"
            >
              <img
                src="/assets/nasa_jpl_marstrek_satellite.jpg"
                alt="Mars Global Overview"
                className="minimap-globe-img"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/assets/mars_orbital_map.jpg";
                }}
              />

              {/* Dynamic Camera Bounding Box tracking live map zoom & coordinates */}
              <div
                className="minimap-camera-rect"
                style={minimapRectStyle}
                title={`Viewing: Lat ${mapViewportState.centerLat.toFixed(1)}°, Lng ${mapViewportState.centerLng.toFixed(1)}° (Zoom ${mapViewportState.zoom})`}
              >
                <div className="rect-center-crosshair" />
              </div>

              {/* Waypoint dots */}
              {activeWaypoints.map((wp) => {
                const wpCoords = parseCoords(wp.coords);
                if (!wpCoords) return null;
                const wpX = ((normalizeLng(wpCoords.lng) + 180) / 360) * 100;
                const wpY = ((90 - wpCoords.lat) / 180) * 100;
                const isSelected = selectedLocation?.id === wp.id;
                return (
                  <div
                    key={wp.id}
                    className={`minimap-dot ${isSelected ? 'active-selected' : ''}`}
                    style={{ left: `${wpX}%`, top: `${wpY}%` }}
                    title={`${wp.name} (${wp.coords})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectLocation(wp);
                    }}
                  />
                );
              })}
            </div>

            {/* Scale Bar */}
            <div className="minimap-scale-strip">
              <div className="scale-nums">
                <span>0</span>
                <span>{currentRegion.scaleTicks?.[1] || '50'}</span>
                <span>{currentRegion.scaleTicks?.[2] || '100'}</span>
                <span>{currentRegion.scaleTicks?.[3] || '200 KM'}</span>
              </div>
              <div className="scale-bar-line">
                <div className="scale-notch" style={{ left: '0%' }} />
                <div className="scale-notch" style={{ left: '25%' }} />
                <div className="scale-notch" style={{ left: '50%' }} />
                <div className="scale-notch" style={{ left: '100%' }} />
              </div>
            </div>
          </div>

          {/* Bottom Floating Dock / Toolbar */}
          <div className="expanded-floating-dock-wrap" style={{ pointerEvents: 'auto', zIndex: 30 }}>
            <div className="expanded-floating-dock">
              {dockTools.map((tool) => {
                const isActive = activeTool === tool.name;
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.name}
                    className={`dock-tool-btn ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveTool(tool.name)}
                  >
                    <Icon size={17} className="dock-icon" />
                    <span className="dock-label">{tool.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
