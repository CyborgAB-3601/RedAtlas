import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
  Compass,
  Maximize2,
  Minimize2,
  ChevronDown,
  Layers,
  MapPin,
  ZoomIn,
  ZoomOut,
  X,
  Crosshair,
  Radio
} from 'lucide-react';
import { hudAudio } from '../services/audioService';
import MarsTrekLeafletMap from './MarsTrekLeafletMap';

/**
 * MarsGlobalMap
 * Authentic NASA Mars Reconnaissance Interface:
 * - 4 Selectable Layers: '3D Map', 'Satellite', 'Elevation', 'Thermal'
 * - '3D Map': 3D Canvas Mars Sphere with atmospheric glow, rotation, illuminated landing sites
 * - 'Satellite': NASA JPL Viking MDIM21 Color Mosaic WMTS (232m)
 * - 'Elevation': NASA JPL MGS MOLA Color Shaded Relief WMTS (463m)
 * - 'Thermal': NASA THEMIS Day IR Global Mosaic WMTS (100m)
 * - Chryse Planitia Proposed Base Site (14.6° N, 32.3° E) with animated radar beacon rings and route lines
 * - Maximizes to Full-Screen Tactical HUD View via expand button or Two Fists Closed gesture
 * - Supports gesture-based Pan (Pinch + Drag) and Zoom (Two-Hand Pinch or Pinch + Drag V)
 */
const MarsGlobalMap = forwardRef(function MarsGlobalMap(
  {
    astronautLocation,
    selectedLocation,
    onSelectLocation,
    activeDestination,
    rovers = [],
    waypoints = [],
    activeLayers = [],
    onToggleLayerModal,
    onNotify,
    zoomLevel = 1.0,
    onZoomChange,
    rotation: externalRotation,
    onRotate,
    isFullScreen = false,
    onToggleFullScreen
  },
  ref
) {
  const canvasRef = useRef(null);
  const leafletRef = useRef(null);
  const [internalRotation, setInternalRotation] = useState(0.4);
  const rotation = externalRotation !== undefined ? externalRotation : internalRotation;
  const setRotation = onRotate || setInternalRotation;
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartY, setDragStartY] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // 4 Map Layers: '3D Map' | 'Satellite' | 'Elevation' | 'Thermal'
  const [mapMode, setMapMode] = useState('Satellite');
  const [showModeDropdown, setShowModeDropdown] = useState(false);

  const textureImgRef = useRef(new Image());
  const [textureLoaded, setTextureLoaded] = useState(false);

  // Expose control methods via ref for gesture engine
  useImperativeHandle(ref, () => ({
    pan: (dragDelta) => {
      if (mapMode === '3D Map') {
        setRotation((prev) => prev - (dragDelta.x || 0) * 3.8);
      } else {
        if (leafletRef.current) {
          leafletRef.current.panBy(-(dragDelta.x || 0) * 350, -(dragDelta.y || 0) * 350);
        }
      }
    },
    zoom: (delta) => {
      if (mapMode === '3D Map') {
        if (onZoomChange) {
          onZoomChange(Math.min(2.5, Math.max(0.6, (zoomLevel || 1.0) + delta)));
        }
      } else {
        if (leafletRef.current) {
          if (delta > 0) leafletRef.current.zoomIn();
          else if (delta < 0) leafletRef.current.zoomOut();
        }
      }
    },
    zoomIn: () => {
      if (mapMode === '3D Map') {
        if (onZoomChange) onZoomChange(Math.min(2.5, (zoomLevel || 1.0) + 0.2));
      } else {
        leafletRef.current?.zoomIn();
      }
    },
    zoomOut: () => {
      if (mapMode === '3D Map') {
        if (onZoomChange) onZoomChange(Math.max(0.6, (zoomLevel || 1.0) - 0.2));
      } else {
        leafletRef.current?.zoomOut();
      }
    },
    setMode: (mode) => {
      setMapMode(mode);
    },
    getMode: () => mapMode
  }));

  // Texture loading for 3D Globe fallback
  useEffect(() => {
    let src = '/assets/nasa_jpl_marstrek_satellite.jpg';
    if (mapMode === 'Elevation') src = '/assets/nasa_jpl_marstrek_elevation.jpg';
    if (mapMode === 'Thermal') src = '/assets/nasa_themis_thermal_global.jpg';

    const img = textureImgRef.current;
    img.src = src;
    img.onload = () => setTextureLoaded(true);
  }, [mapMode]);

  // Subtle auto-rotation for 3D Map when not dragging
  useEffect(() => {
    if (mapMode !== '3D Map') return;
    const timer = setInterval(() => {
      if (!isDragging) {
        setRotation((prev) => (prev + 0.002) % (Math.PI * 2));
      }
    }, 50);
    return () => clearInterval(timer);
  }, [isDragging, mapMode, setRotation]);

  // Mouse drag handlers for 3D canvas
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragStartY(e.clientY);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartX;
    setRotation((prev) => prev + deltaX * 0.008);
    setDragStartX(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Render 3D Mars Globe on Canvas (when mode === '3D Map')
  useEffect(() => {
    if (mapMode !== '3D Map') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const width = (canvas.width = isFullScreen ? canvas.clientWidth || 800 : isExpanded ? 400 : 230);
    const height = (canvas.height = isFullScreen ? canvas.clientHeight || 550 : isExpanded ? 240 : 125);

    ctx.clearRect(0, 0, width, height);

    const currentScale = zoomLevel || 1.0;
    const radius = Math.min(width, height) * (isFullScreen ? 0.45 : 0.95) * currentScale;
    const centerX = width / 2;
    const centerY = isFullScreen ? height / 2 : height * 0.95;

    // Atmospheric blue/amber outer rim glow
    const atmoGlow = ctx.createRadialGradient(
      centerX,
      centerY,
      radius * 0.82,
      centerX,
      centerY,
      radius * 1.15
    );
    atmoGlow.addColorStop(0, 'rgba(0, 220, 255, 0.45)');
    atmoGlow.addColorStop(0.35, 'rgba(235, 120, 60, 0.25)');
    atmoGlow.addColorStop(0.7, 'rgba(100, 160, 255, 0.1)');
    atmoGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = atmoGlow;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 1.15, 0, Math.PI * 2);
    ctx.fill();

    // Clip to Mars sphere circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.clip();

    // Mars surface background
    const surfaceGrad = ctx.createRadialGradient(
      centerX - radius * 0.25,
      centerY - radius * 0.35,
      10,
      centerX,
      centerY,
      radius
    );
    surfaceGrad.addColorStop(0, '#be5733');
    surfaceGrad.addColorStop(0.45, '#8c3519');
    surfaceGrad.addColorStop(0.85, '#4a190b');
    surfaceGrad.addColorStop(1, '#1b0804');
    ctx.fillStyle = surfaceGrad;
    ctx.fillRect(0, 0, width, height);

    // Draw textured surface if loaded
    const img = textureImgRef.current;
    if (textureLoaded && img.complete && img.naturalWidth > 0) {
      ctx.save();
      ctx.globalAlpha = 0.55;
      const texW = radius * 3.6;
      const texH = radius * 1.8;
      const offsetX = ((rotation * 150) % texW) - texW;
      for (let x = offsetX; x < width + texW; x += texW) {
        ctx.drawImage(img, x, centerY - radius * 0.9, texW, texH);
      }
      ctx.restore();
    }

    // Atmospheric shadow / Terminator curve
    const termGrad = ctx.createLinearGradient(0, 0, width, height * 0.8);
    termGrad.addColorStop(0, 'rgba(255, 230, 200, 0.15)');
    termGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.2)');
    termGrad.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
    ctx.fillStyle = termGrad;
    ctx.fillRect(0, 0, width, height);

    // Draw illuminated landing site beacons
    const beacons = [
      { name: 'Proposed Base', x: centerX - radius * 0.12, y: centerY - radius * 0.55, active: true },
      { name: 'Rover Alpha', x: centerX + radius * 0.08, y: centerY - radius * 0.52, rover: true },
      { name: 'Gale Outpost', x: centerX + radius * 0.22, y: centerY - radius * 0.44 },
      { name: 'Jezero Depot', x: centerX - radius * 0.32, y: centerY - radius * 0.48 }
    ];

    beacons.forEach((b) => {
      ctx.fillStyle = b.active ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 220, 150, 0.8)';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.active ? 4.5 : 3, 0, Math.PI * 2);
      ctx.fill();

      const beamGrad = ctx.createRadialGradient(b.x, b.y, 1, b.x, b.y, 18);
      beamGrad.addColorStop(0, b.active ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 180, 50, 0.6)');
      beamGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.arc(b.x, b.y, 18, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }, [rotation, textureLoaded, isExpanded, isFullScreen, mapMode, zoomLevel]);

  const toggleExpand = (e) => {
    e.stopPropagation();
    hudAudio.playSelect();
    if (onToggleFullScreen) {
      onToggleFullScreen();
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  const handleModeSelect = (mode, e) => {
    e.stopPropagation();
    hudAudio.playSelect();
    setMapMode(mode);
    setShowModeDropdown(false);
    if (onNotify) onNotify(`Tactical Map Layer: ${mode}`, 'info');
  };

  const handleZoomInClick = (e) => {
    e.stopPropagation();
    hudAudio.playSelect();
    if (mapMode === '3D Map') {
      if (onZoomChange) onZoomChange(Math.min(2.5, (zoomLevel || 1.0) + 0.2));
    } else {
      leafletRef.current?.zoomIn();
    }
  };

  const handleZoomOutClick = (e) => {
    e.stopPropagation();
    hudAudio.playSelect();
    if (mapMode === '3D Map') {
      if (onZoomChange) onZoomChange(Math.max(0.6, (zoomLevel || 1.0) - 0.2));
    } else {
      leafletRef.current?.zoomOut();
    }
  };

  // 4 Map Layer definitions
  const LAYER_MODES = [
    { id: '3D Map', label: '3D Globe Map (Canvas Sphere)' },
    { id: 'Satellite', label: 'Satellite Layer (NASA Viking MDIM21)' },
    { id: 'Elevation', label: 'Elevation Layer (NASA MGS MOLA)' },
    { id: 'Thermal', label: 'Thermal Layer (NASA THEMIS Day IR)' }
  ];

  return (
    <div
      className={`hud-mars-global-card ${isFullScreen ? 'full-screen' : isExpanded ? 'expanded' : ''}`}
    >
      {/* Top Header Bar */}
      <div className="mars-global-header">
        <div
          className="mars-global-title-btn"
          onClick={() => setShowModeDropdown(!showModeDropdown)}
          title="Click to Switch Map Layer (3D Map, Satellite, Elevation, Thermal)"
        >
          <span className="atlas-icon-box">🌐</span>
          <span className="mars-global-title-text">
            {isFullScreen
              ? `Tactical Mars Reconnaissance // ${mapMode}`
              : `Mars Global View [${mapMode}]`}
          </span>
          <ChevronDown size={13} className="header-chevron" />
        </div>

        {isFullScreen && (
          <div className="mars-tactical-header-badge">
            <Radio size={12} className="pulse-cyan" />
            <span>NASA JPL MARS TREK // EQUATORIAL MOSAIC // EPSG:4326</span>
          </div>
        )}

        <div className="mars-header-actions">
          <button
            type="button"
            className="mars-zoom-btn"
            onClick={handleZoomOutClick}
            title="Zoom Out Map View [-]"
          >
            <ZoomOut size={12} />
          </button>

          <button
            type="button"
            className="mars-zoom-btn"
            onClick={handleZoomInClick}
            title="Zoom In Map View [+]"
          >
            <ZoomIn size={12} />
          </button>

          <button
            type="button"
            className="mars-expand-btn"
            onClick={toggleExpand}
            title={
              isFullScreen
                ? 'Exit Full Screen [Closed Fist / Key: F]'
                : isExpanded
                ? 'Minimize View'
                : 'Expand to Full Screen HUD [Two Fists Together / Key: F]'
            }
          >
            {isFullScreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>

          {isFullScreen && (
            <button
              type="button"
              className="mars-close-fullscreen-btn"
              onClick={toggleExpand}
              title="Close Full Screen [Thumbs Up]"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Layer Selection Dropdown (4 Layers: 3D map, satellite, elevation, thermal) */}
      {showModeDropdown && (
        <div className="mars-mode-dropdown">
          {LAYER_MODES.map((item) => (
            <div
              key={item.id}
              className={`dropdown-item ${mapMode === item.id ? 'active' : ''}`}
              onClick={(e) => handleModeSelect(item.id, e)}
            >
              <span>{item.label}</span>
              {mapMode === item.id && <span className="active-dot" />}
            </div>
          ))}
        </div>
      )}

      {/* Main Map Viewport: Renders 3D Globe Canvas OR Leaflet NASA Mars Trek Map */}
      <div className="mars-viewport-container">
        {mapMode === '3D Map' ? (
          <div
            className="mars-canvas-viewport"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={(e) => {
              e.preventDefault();
              const delta = e.deltaY < 0 ? 0.15 : -0.15;
              if (onZoomChange) {
                onZoomChange(Math.min(2.5, Math.max(0.6, (zoomLevel || 1.0) + delta)));
              }
            }}
          >
            <canvas ref={canvasRef} className="mars-3d-canvas" />
          </div>
        ) : (
          <div className="mars-leaflet-outer-container">
            <MarsTrekLeafletMap
              ref={leafletRef}
              viewMode={mapMode}
              selectedLocation={selectedLocation}
              onSelectLocation={onSelectLocation}
              isExpanded={isExpanded || isFullScreen}
            />
          </div>
        )}

        {/* Full-screen Crosshairs HUD Overlay */}
        {isFullScreen && (
          <div className="mars-fullscreen-tactical-overlay">
            <div className="crosshair-center">
              <Crosshair size={24} className="tactical-reticle" />
            </div>
            <div className="tactical-hud-corner top-left">
              <span>LAT: 14.6° N</span>
              <span>LON: 32.3° E</span>
              <span>ELEV: -3,650 M</span>
            </div>
            <div className="tactical-hud-corner top-right">
              <span>RESOLUTION: 232M/PX</span>
              <span>GRID: EPSG:4326</span>
              <span>DATUM: AREOID</span>
            </div>
            <div className="tactical-hud-corner bottom-left">
              <span className="gesture-hint-badge">
                GESTURES: [TWO FISTS: TOGGLE] [PINCH & DRAG: PAN] [2-HAND PINCH: ZOOM] [CLOSED FIST: EXIT]
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Horizontal Scale Ruler Bar */}
      {(() => {
        const curZ = zoomLevel || 1.0;
        const maxKm = Math.round(220 / curZ);
        return (
          <div className="mars-scale-bar-footer">
            <div className="scale-track-line">
              {/* Scale Ticks */}
              <div className="scale-tick" style={{ left: '0%' }}>
                <span className="tick-mark" />
                <span className="tick-label">0</span>
              </div>
              <div className="scale-tick" style={{ left: '25%' }}>
                <span className="tick-mark" />
                <span className="tick-label">{Math.round(maxKm * 0.25)}</span>
              </div>
              <div className="scale-tick" style={{ left: '50%' }}>
                <span className="tick-mark" />
                <span className="tick-label">{Math.round(maxKm * 0.5)}</span>
              </div>
              <div className="scale-tick" style={{ left: '75%' }}>
                <span className="tick-mark" />
                <span className="tick-label">{Math.round(maxKm * 0.75)}</span>
              </div>
              <div className="scale-tick" style={{ left: '100%' }}>
                <span className="tick-mark" />
                <span className="tick-label">{maxKm} km</span>
              </div>

              {/* Diamond Indicator Cursor */}
              <div className="scale-diamond-cursor" style={{ left: '88%' }}>
                <span className="diamond-symbol">◆</span>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
});

export default MarsGlobalMap;
