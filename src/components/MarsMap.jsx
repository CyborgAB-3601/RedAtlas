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

export default function MarsMap({
  selectedLocation,
  onSelectLocation,
  viewMode,
  setViewMode,
  isExpanded = false,
  onToggleExpand,
  activeMission,
  onOpenMissions
}) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isGlobalDropdownOpen, setIsGlobalDropdownOpen] = useState(false);
  const [globalView, setGlobalView] = useState('Mars Global View');
  const [activeTool, setActiveTool] = useState('Explore');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isDestinationSet, setIsDestinationSet] = useState(false);

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

  // Regional configuration profiles for official NASA perspectives
  const REGIONAL_CONFIGS = {
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
  const currentRegion = REGIONAL_CONFIGS[globalView] || REGIONAL_CONFIGS['Mars Global View'];

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
      {/* ---------------- NORMAL ORBITAL MAP VIEW ---------------- */}
      {!isExpanded && (
        <>
          {/* 3D Interactive View Mode: NASA JPL Mars Trek 3D Globe */}
          {viewMode === '3D' ? (
            <div className="nasa-3d-frame-container animate-fade-in">
              <Mars3DGlobe
                selectedLocation={selectedLocation}
                onSelectLocation={onSelectLocation}
                globalView={globalView}
                viewMode={viewMode}
                zoomLevel={zoomLevel}
              />
            </div>
          ) : (
            <div className="mars-map-viewport">
              <MarsTrekLeafletMap
                ref={leafletRef}
                viewMode={viewMode}
                globalView={globalView}
                selectedLocation={selectedLocation}
                onSelectLocation={onSelectLocation}
                onZoomChange={(newZoom) => setZoomLevel(newZoom)}
                activeWaypoints={activeWaypoints}
              />
            </div>
          )}

          {/* Top Left Title Overlay with Dynamic Region & NASA Subtitle */}
          <div className="map-top-left-overlay">
            <span className="map-index-badge">04</span>
            <h1 className="map-main-title">{currentRegion.title}</h1>
            <p className="map-description">
              {currentRegion.subtitle}
            </p>
          </div>

          {/* Top Right Mode Switcher Pill */}
          <div className="map-top-right-overlay">
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

      {/* ---------------- EXPANDED 3D CANYON MAP VIEW ---------------- */}
      {isExpanded && (
        <div className="expanded-map-canvas-container">
          {/* Main 3D Perspective Canyon Terrain Image */}
          <div className="expanded-terrain-viewport">
            <img
              src="/assets/mars_expanded_terrain.jpg"
              alt="Mars Perspective Surface Canyon"
              className="expanded-terrain-img"
              draggable={false}
            />

            {/* Cinematic atmospheric depth and horizon haze */}
            <div className="expanded-atmosphere-scrim" />

            {/* Glowing Trajectory SVG Overlay */}
            <svg
              className="expanded-svg-route-overlay"
              viewBox="0 0 1000 600"
              preserveAspectRatio="none"
            >
              <defs>
                <filter id="expandedRouteGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <linearGradient id="expGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
                  <stop offset="50%" stopColor="#FFFFFF" stopOpacity="1" />
                  <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.8" />
                </linearGradient>
              </defs>

              {/* Underlying dark shadow path */}
              <path
                d={expandedRouteSvgPath}
                fill="none"
                stroke="rgba(10, 8, 6, 0.5)"
                strokeWidth="4"
                strokeLinecap="round"
              />
              {/* Animated glowing dotted route */}
              <path
                d={expandedRouteSvgPath}
                fill="none"
                stroke="url(#expGrad)"
                strokeWidth="2.5"
                strokeDasharray="4 6"
                strokeLinecap="round"
                className="expanded-route-dash-animated"
                filter="url(#expandedRouteGlow)"
              />

              {/* Dotted branch to Drone 02 and Hazard Area */}
              <path
                d="M 542 264 L 765 210 M 765 210 L 860 246"
                fill="none"
                stroke="rgba(255, 255, 255, 0.7)"
                strokeWidth="2"
                strokeDasharray="3 5"
              />
            </svg>

            {/* Pulsating Hazard Zone */}
            <div className="hazard-zone-wrapper" style={{ left: '86%', top: '41%' }}>
              <div className="hazard-pulsing-circle" />
              <div className="hazard-pulsing-circle delay" />
              <div className="hazard-center-badge">
                <AlertTriangle size={15} className="hazard-alert-icon" />
              </div>
            </div>

            {/* Waypoints rendered on the 3D surface */}
            {expandedWaypoints.map((wp) => {
              const isSelected = selectedLocation?.id === wp.id;
              if (wp.isBase) {
                return (
                  <div
                    key={wp.id}
                    className={`expanded-base-callout-marker ${isSelected ? 'selected' : ''}`}
                    style={{ left: `${wp.x}%`, top: `${wp.y}%` }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectLocation({ id: 'proposed_base', name: 'Proposed Base Site' });
                    }}
                  >
                    {/* Concentric ground pulse */}
                    <div className="base-radar-rings-wrap" style={{ left: '-8px', top: '24px' }}>
                      <div className="radar-ring r1" />
                      <div className="radar-ring r2" />
                      <div className="radar-ring r3" />
                      <div className="radar-dot" />
                    </div>

                    {/* Prominent White Glass Callout Pill */}
                    <div className="base-prominent-pill">
                      <div className="base-pill-flag-box">
                        <Flag size={14} className="base-pill-flag-icon" />
                      </div>
                      <div className="base-pill-text-col">
                        <span className="base-pill-title">{wp.name}</span>
                        <span className="base-pill-coords">{wp.coords}</span>
                      </div>
                    </div>
                  </div>
                );
              }

              const Icon = wp.icon || CircleDot;
              return (
                <div
                  key={wp.id}
                  className={`expanded-tactical-marker ${isSelected ? 'selected' : ''}`}
                  style={{ left: `${wp.x}%`, top: `${wp.y}%` }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectLocation({ id: wp.id, name: wp.name });
                  }}
                >
                  {/* Waypoint Pill */}
                  <div className="tactical-marker-pill">
                    <div className="tactical-marker-icon-box">
                      <Icon size={13} />
                    </div>
                    <div className="tactical-marker-text-col">
                      <span className="tactical-name">{wp.name}</span>
                      <span className="tactical-sub">{wp.sub}</span>
                    </div>
                    {wp.hasArrow && <ArrowRight size={13} className="tactical-arrow" />}
                  </div>

                  {/* Ground anchor circle dot */}
                  <div className="tactical-ground-dot" />
                </div>
              );
            })}
          </div>

          {/* Top Right Controls (Compass + Zoom + Collapse) */}
          <div className="expanded-top-right-bar">
            {/* Compass */}
            <div className="expanded-compass-btn" title="North Orientation">
              <span className="exp-compass-needle" />
              <span className="exp-compass-n">N</span>
            </div>

            {/* Zoom Controls */}
            <div className="expanded-zoom-pill">
              <button className="exp-zoom-btn" onClick={() => handleZoom(0.2)} title="Zoom In">
                <Plus size={16} />
              </button>
              <div className="exp-zoom-divider" />
              <button className="exp-zoom-btn" onClick={() => handleZoom(-0.2)} title="Zoom Out">
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
          <div className="expanded-destination-card">
            {/* Top Row: Thumbnail + Info */}
            <div className="dest-card-top-row">
              {/* Landscape Preview Image */}
              <div className="dest-thumb-box">
                <img
                  src={selectedLocation?.landscapeImg || "/assets/mars_base_site.jpg"}
                  alt={selectedLocation?.name || "Mars Destination"}
                  className="dest-thumb-img"
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

          {/* Bottom Right Floating Minimap */}
          <div className="expanded-minimap-card">
            <div className="minimap-header">
              <div className="minimap-title-group">
                <Grid size={13} className="minimap-globe-icon" />
                <span className="minimap-title-text">Mars Global View</span>
                <ChevronDown size={13} />
              </div>
              <button
                className="minimap-expand-btn"
                onClick={() => onToggleExpand && onToggleExpand(false)}
                title="Collapse View"
              >
                <Minimize2 size={12} />
              </button>
            </div>

            {/* 3D Global Mars View Thumbnail */}
            <div className="minimap-globe-wrap">
              <img
                src="/assets/mars_orbital_map.jpg"
                alt="Mars Globe Overview"
                className="minimap-globe-img"
              />
              {/* Highlighted Bounding Camera Rect */}
              <div className="minimap-camera-rect" />
              {/* Waypoint dots */}
              <div className="minimap-dot" style={{ left: '42%', top: '48%' }} />
              <div className="minimap-dot" style={{ left: '48%', top: '51%' }} />
              <div className="minimap-dot" style={{ left: '55%', top: '46%' }} />
              <div className="minimap-dot" style={{ left: '62%', top: '54%' }} />
            </div>

            {/* Scale Bar */}
            <div className="minimap-scale-strip">
              <div className="scale-nums">
                <span>0</span>
                <span>50</span>
                <span>100</span>
                <span>200 KM</span>
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
          <div className="expanded-floating-dock-wrap">
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
