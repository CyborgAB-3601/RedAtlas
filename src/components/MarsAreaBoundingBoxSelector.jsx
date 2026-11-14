import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Crop,
  MapPin,
  Move,
  Maximize2,
  Sparkles,
  Mountain,
  AlertTriangle,
  Compass,
  Check,
  RefreshCw
} from 'lucide-react';

// Iconic NASA Exploration Sites Preset Bounding Boxes [latMin, latMax, lngMin, lngMax]
export const NASA_PRESET_REGIONS = [
  {
    id: 'olympus_mons',
    name: 'Olympus Mons Caldera & Scarps',
    desc: 'Tallest volcano in the solar system (+21.2 km summit, 6 km cliff scarps)',
    latMin: 13.0,
    latMax: 23.5,
    lngMin: -139.0,
    lngMax: -128.0,
    icon: '🌋',
    feature: 'Volcanic Shield & Caldera'
  },
  {
    id: 'valles_marineris',
    name: 'Valles Marineris (Candor Chasma)',
    desc: '4,000 km tectonic grand canyon rift with 7 km sheer layered walls',
    latMin: -18.5,
    latMax: -9.5,
    lngMin: -78.0,
    lngMax: -64.0,
    icon: '🏜️',
    feature: 'Canyon Rift & Stratified Walls'
  },
  {
    id: 'gale_crater',
    name: 'Gale Crater (Mount Sharp)',
    desc: 'Curiosity Rover landing site with 5.5 km central sediment mound Aeolis Mons',
    latMin: -7.0,
    latMax: -2.5,
    lngMin: 135.5,
    lngMax: 140.0,
    icon: '🚀',
    feature: 'Crater Floor & Central Mound'
  },
  {
    id: 'jezero_crater',
    name: 'Jezero Crater Delta',
    desc: 'Perseverance Rover site with preserved ancient river fan and crater rim',
    latMin: 16.5,
    latMax: 20.5,
    lngMin: 75.0,
    lngMax: 79.5,
    icon: '💧',
    feature: 'Ancient River Delta & Lakebed'
  },
  {
    id: 'proposed_base',
    name: 'Chryse Planitia (Proposed Base)',
    desc: 'Smooth alluvial lowlands with shallow subsurface water ice detected by SHARAD',
    latMin: 12.0,
    latMax: 17.0,
    lngMin: 30.0,
    lngMax: 35.0,
    icon: '🏗️',
    feature: 'Alluvial Plain & Wrinkle Dunes'
  },
  {
    id: 'planum_boreum',
    name: 'Planum Boreum (North Polar Cap)',
    desc: 'Perennial water & CO2 ice cap with spiral chasmata troughs and polar scarps',
    latMin: 76.0,
    latMax: 87.0,
    lngMin: -45.0,
    lngMax: 45.0,
    icon: '❄️',
    feature: 'Polar Ice Sheets & Spiral Scarps'
  }
];

export default function MarsAreaBoundingBoxSelector({
  activeBoundingBox,
  onSelectBoundingBox,
  onGenerateGaussianSplat
}) {
  const mapContainerRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [dragStart, setDragStart] = useState(null); // { x, y } in normalized [0, 1]
  const [tempBox, setTempBox] = useState(null); // { xMin, xMax, yMin, yMax }

  // Default active box if none provided
  const currentBox = activeBoundingBox || NASA_PRESET_REGIONS[0];

  // Map normalized (0..1, 0..1) to Geographic (Lng: -180..180, Lat: 90..-90)
  const normToGeo = useCallback((nx, ny) => {
    const lng = nx * 360 - 180;
    const lat = 90 - ny * 180;
    return { lat, lng };
  }, []);

  // Map Geographic to normalized (0..1, 0..1)
  const geoToNorm = useCallback((lat, lng) => {
    const nx = (lng + 180) / 360;
    const ny = (90 - lat) / 180;
    return { nx: Math.max(0, Math.min(1, nx)), ny: Math.max(0, Math.min(1, ny)) };
  }, []);

  // Compute bounding box normalized box coords from active box
  const activeNorm = geoToNorm(
    currentBox.latMax,
    currentBox.lngMin
  );
  const activeNormBottomRight = geoToNorm(
    currentBox.latMin,
    currentBox.lngMax
  );

  const displayBox = tempBox || {
    xMin: Math.min(activeNorm.nx, activeNormBottomRight.nx),
    xMax: Math.max(activeNorm.nx, activeNormBottomRight.nx),
    yMin: Math.min(activeNorm.ny, activeNormBottomRight.ny),
    yMax: Math.max(activeNorm.ny, activeNormBottomRight.ny)
  };

  // Calculate real-world kilometers based on Mars Radius 3389.5 km
  const latSpan = Math.abs(currentBox.latMax - currentBox.latMin);
  const lngSpan = Math.abs(currentBox.lngMax - currentBox.lngMin);
  const midLatRad = (((currentBox.latMax + currentBox.latMin) / 2) * Math.PI) / 180;
  const kmHeight = Math.round((latSpan / 180) * Math.PI * 3389.5);
  const kmWidth = Math.round((lngSpan / 360) * 2 * Math.PI * 3389.5 * Math.cos(midLatRad));

  // Pointer Down: Start drawing bounding box
  const handlePointerDown = (e) => {
    if (!mapContainerRef.current) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const ny = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    setIsDrawing(true);
    setDragStart({ x: nx, y: ny });
    setTempBox({ xMin: nx, xMax: nx, yMin: ny, yMax: ny });
  };

  // Pointer Move: Update drawing box dimensions
  const handlePointerMove = (e) => {
    if (!isDrawing || !dragStart || !mapContainerRef.current) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const ny = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    const xMin = Math.min(dragStart.x, nx);
    const xMax = Math.max(dragStart.x, nx);
    const yMin = Math.min(dragStart.y, ny);
    const yMax = Math.max(dragStart.y, ny);

    setTempBox({ xMin, xMax, yMin, yMax });
  };

  // Pointer Up: Finalize drawn bounding box
  const handlePointerUp = () => {
    if (!isDrawing || !tempBox) {
      setIsDrawing(false);
      setDragStart(null);
      return;
    }

    setIsDrawing(false);
    setDragStart(null);

    // If box has meaningful area (at least 0.5% span)
    if (tempBox.xMax - tempBox.xMin > 0.005 && tempBox.yMax - tempBox.yMin > 0.005) {
      const minX = Math.min(tempBox.xMin, tempBox.xMax);
      const maxX = Math.max(tempBox.xMin, tempBox.xMax);
      const minY = Math.min(tempBox.yMin, tempBox.yMax);
      const maxY = Math.max(tempBox.yMin, tempBox.yMax);

      const nw = normToGeo(minX, minY);
      const se = normToGeo(maxX, maxY);

      const latMin = Math.min(nw.lat, se.lat);
      const latMax = Math.max(nw.lat, se.lat);
      const lngMin = Math.min(nw.lng, se.lng);
      const lngMax = Math.max(nw.lng, se.lng);

      const midLat = (latMin + latMax) / 2;
      const kmHeight = Math.max(2, Math.round(((latMax - latMin) / 180) * Math.PI * 3389.5));
      const kmWidth = Math.max(2, Math.round(((lngMax - lngMin) / 360) * 2 * Math.PI * 3389.5 * Math.cos((midLat * Math.PI) / 180)));

      const customBox = {
        id: 'custom_selection_' + Date.now(),
        name: `Drawn Sector (${kmWidth} × ${kmHeight} km)`,
        desc: `Target Sector: ${latMin.toFixed(1)}° to ${latMax.toFixed(1)}° Lat, ${lngMin.toFixed(1)}° to ${lngMax.toFixed(1)}° Lng`,
        latMin,
        latMax,
        lngMin,
        lngMax,
        icon: '📐',
        feature: `${kmWidth} × ${kmHeight} km Area`
      };

      if (onSelectBoundingBox) {
        onSelectBoundingBox(customBox);
      }
      if (onGenerateGaussianSplat) {
        onGenerateGaussianSplat(customBox);
      }
    }
    setTempBox(null);
  };

  return (
    <div className="mars-bbox-selector-container">
      {/* Top Instructions Bar */}
      <div className="bbox-header-bar">
        <div className="bbox-header-left">
          <Crop size={15} className="text-accent" />
          <span className="bbox-header-title">STEP 1: SELECT OR DRAW RECONNAISSANCE AREA ON SATELLITE MAP</span>
        </div>
        <div className="bbox-action-hint">
          <span>Click & drag on map to draw a custom box, or choose a preset region below</span>
        </div>
      </div>

      {/* Main Interactive Map Canvas */}
      <div
        ref={mapContainerRef}
        className="bbox-satellite-map-wrap"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* NASA Viking / MDIM 2.1 Satellite Texture */}
        <img
          src="/assets/nasa_jpl_marstrek_satellite_4k.jpg"
          alt="NASA Mars Viking Satellite Global Mosaic"
          className="bbox-satellite-img"
          draggable={false}
          onError={(e) => {
            e.currentTarget.src = '/assets/nasa_viking_satellite_global.jpg';
          }}
        />

        {/* Latitude / Longitude Grid Overlay Lines */}
        <div className="bbox-latlng-grid-overlay">
          {/* Equator */}
          <div className="lat-line equator" style={{ top: '50%' }}>
            <span className="grid-label">0° Equator</span>
          </div>
          {/* 30° N / S */}
          <div className="lat-line" style={{ top: '33.3%' }}>
            <span className="grid-label">30° N</span>
          </div>
          <div className="lat-line" style={{ top: '66.6%' }}>
            <span className="grid-label">30° S</span>
          </div>
          {/* Prime Meridian */}
          <div className="lng-line prime" style={{ left: '50%' }}>
            <span className="grid-label-lng">0° Longitude</span>
          </div>
          <div className="lng-line" style={{ left: '25%' }}>
            <span className="grid-label-lng">-90° W</span>
          </div>
          <div className="lng-line" style={{ left: '75%' }}>
            <span className="grid-label-lng">+90° E</span>
          </div>
        </div>

        {/* Render Preset Site Markers on Map */}
        {NASA_PRESET_REGIONS.map((preset) => {
          const pt = geoToNorm(
            (preset.latMin + preset.latMax) / 2,
            (preset.lngMin + preset.lngMax) / 2
          );
          const isSelected = currentBox.id === preset.id;
          return (
            <div
              key={preset.id}
              className={`bbox-landmark-marker ${isSelected ? 'selected' : ''}`}
              style={{ left: `${pt.nx * 100}%`, top: `${pt.ny * 100}%` }}
              onClick={(e) => {
                e.stopPropagation();
                if (onSelectBoundingBox) onSelectBoundingBox(preset);
              }}
              title={preset.name}
            >
              <div className="marker-dot" />
              <span className="marker-tag">{preset.name.split(' (')[0]}</span>
            </div>
          );
        })}

        {/* Selected Bounding Box Rectangle Overlay */}
        <div
          className={`bbox-selection-rect ${isDrawing ? 'drawing' : ''}`}
          style={{
            left: `${displayBox.xMin * 100}%`,
            top: `${displayBox.yMin * 100}%`,
            width: `${Math.max(1, (displayBox.xMax - displayBox.xMin) * 100)}%`,
            height: `${Math.max(1, (displayBox.yMax - displayBox.yMin) * 100)}%`
          }}
        >
          {/* Corner Handles */}
          <div className="bbox-corner tl" />
          <div className="bbox-corner tr" />
          <div className="bbox-corner bl" />
          <div className="bbox-corner br" />

          {/* Center Crosshair */}
          <div className="bbox-crosshair" />

          {/* Dimension Tag */}
          <div className="bbox-size-tag">
            <span>
              {kmWidth} km × {kmHeight} km
            </span>
          </div>
        </div>

        {/* Drawing Active Banner */}
        {isDrawing && (
          <div className="bbox-drawing-status-badge">
            <Crop size={12} className="text-accent animate-pulse" />
            <span>Dragging Selection Rectangle...</span>
          </div>
        )}
      </div>

      {/* Selected Box Telemetry & Launch Splat Button */}
      <div className="bbox-telemetry-action-strip">
        <div className="bbox-telemetry-group">
          <div className="bbox-selected-chip">
            <span className="chip-icon">{currentBox.icon || '📍'}</span>
            <div className="chip-info">
              <span className="chip-name">{currentBox.name}</span>
              <span className="chip-sub">{currentBox.feature || 'Selected Region'}</span>
            </div>
          </div>

          <div className="bbox-coords-badges">
            <div className="b-badge">
              <span className="b-lbl">LAT RANGE:</span>
              <span className="b-val">
                {currentBox.latMin.toFixed(1)}° to {currentBox.latMax.toFixed(1)}°
              </span>
            </div>
            <div className="b-badge">
              <span className="b-lbl">LNG RANGE:</span>
              <span className="b-val">
                {currentBox.lngMin.toFixed(1)}° to {currentBox.lngMax.toFixed(1)}°
              </span>
            </div>
            <div className="b-badge">
              <span className="b-lbl">SURFACE AREA:</span>
              <span className="b-val">
                {kmWidth} × {kmHeight} km ({(kmWidth * kmHeight).toLocaleString()} km²)
              </span>
            </div>
          </div>
        </div>

        <button
          className="bbox-generate-splat-btn"
          onClick={() => {
            if (onGenerateGaussianSplat) {
              onGenerateGaussianSplat(currentBox);
            }
          }}
        >
          <Sparkles size={16} />
          <span>Generate 3D Gaussian Splat</span>
        </button>
      </div>

      {/* Preset Region Quick Picker Chips */}
      <div className="bbox-preset-cards-tray">
        <span className="tray-label">NASA SCIENTIFIC PRESETS:</span>
        <div className="tray-chips-scroll custom-scrollbar">
          {NASA_PRESET_REGIONS.map((preset) => {
            const isSelected = currentBox.id === preset.id;
            return (
              <button
                key={preset.id}
                className={`preset-card-chip ${isSelected ? 'active' : ''}`}
                onClick={() => {
                  if (onSelectBoundingBox) onSelectBoundingBox(preset);
                  if (onGenerateGaussianSplat) onGenerateGaussianSplat(preset);
                }}
              >
                <span className="p-icon">{preset.icon}</span>
                <div className="p-text">
                  <span className="p-name">{preset.name}</span>
                  <span className="p-desc">{preset.desc.slice(0, 48)}...</span>
                </div>
                {isSelected && <Check size={14} className="text-accent" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

