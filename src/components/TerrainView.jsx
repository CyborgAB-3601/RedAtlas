import React, { useState } from 'react';
import {
  Mountain,
  Eye,
  Layers,
  Radio,
  Compass,
  AlertTriangle,
  ShieldCheck,
  Maximize2
} from 'lucide-react';

export default function TerrainView({ selectedLocation, onOpenHUD }) {
  const [contourInterval, setContourInterval] = useState('50m');
  const [showSlopeHazards, setShowSlopeHazards] = useState(true);

  const loc = selectedLocation || {
    name: 'Proposed Base Site',
    coordsText: '14.6° N, 32.3° E',
    elevationVal: '-2,450 m'
  };

  return (
    <div className="terrain-view-container animate-fade-in">
      {/* Top Header */}
      <div className="view-header-strip">
        <div className="view-title-group">
          <div className="view-badge">
            <Mountain size={13} className="text-accent" />
            <span>MOLA / HiRISE 3D DIGITAL ELEVATION MODEL</span>
          </div>
          <h2 className="view-heading">3D Relief & Terrain Slopes</h2>
          <p className="view-subtext">
            High-fidelity topographic mesh rendering vertical relief, slope hazard overlays, and satellite line-of-sight relays.
          </p>
        </div>

        {/* Contour interval pill */}
        <div className="contour-pill-strip">
          <span className="contour-lbl">Contour Step:</span>
          {['25m', '50m', '100m'].map((step) => (
            <button
              key={step}
              className={`contour-step-btn ${contourInterval === step ? 'active' : ''}`}
              onClick={() => setContourInterval(step)}
            >
              {step}
            </button>
          ))}
        </div>
      </div>

      {/* Main 3D Terrain Canvas */}
      <div className="terrain-3d-canvas-wrap">
        <img
          src="/assets/mars_expanded_terrain.jpg"
          alt="3D Perspective Surface"
          className="terrain-3d-bg"
        />

        {/* Topographic Contour Overlay (SVG Grid) */}
        <div className="terrain-svg-grid-overlay">
          <svg className="contour-svg" viewBox="0 0 1000 500" preserveAspectRatio="none">
            <defs>
              <linearGradient id="slopeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(216, 77, 41, 0.4)" />
                <stop offset="60%" stopColor="rgba(216, 77, 41, 0.05)" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>

            {/* Simulated 3D Contour Wireframe Lines */}
            <path
              d="M 50 420 Q 250 350, 500 370 T 950 390"
              fill="none"
              stroke="rgba(255, 255, 255, 0.35)"
              strokeWidth="1.2"
              strokeDasharray="4 4"
            />
            <path
              d="M 80 340 Q 300 280, 550 300 T 920 310"
              fill="none"
              stroke="rgba(255, 255, 255, 0.4)"
              strokeWidth="1.4"
            />
            <path
              d="M 120 260 Q 360 210, 600 220 T 890 230"
              fill="none"
              stroke="rgba(255, 255, 255, 0.5)"
              strokeWidth="1.6"
            />
            <path
              d="M 160 180 Q 420 130, 680 140 T 860 150"
              fill="none"
              stroke="rgba(255, 255, 255, 0.6)"
              strokeWidth="1.8"
            />

            {/* Slope Hazard Area Overlay */}
            {showSlopeHazards && (
              <polygon
                points="180,240 280,180 380,210 320,290"
                fill="url(#slopeGrad)"
                stroke="#D84D29"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
            )}
          </svg>
        </div>

        {/* 3D Floating Terrain Pins */}
        <div className="terrain-pin pin-hub" style={{ left: '48%', top: '64%' }}>
          <div className="pin-marker">
            <span className="dot pulse" />
          </div>
          <div className="pin-card">
            <span className="pin-title">{loc.name}</span>
            <span className="pin-elev">{loc.elevationVal}</span>
          </div>
        </div>

        <div className="terrain-pin pin-ridge" style={{ left: '26%', top: '38%' }}>
          <div className="pin-marker hazard">
            <span className="dot" />
          </div>
          <div className="pin-card">
            <span className="pin-title">Escarpment Ridge</span>
            <span className="pin-elev">Slope: 18.4° (No-Go)</span>
          </div>
        </div>

        <div className="terrain-pin pin-boxwork" style={{ left: '68%', top: '42%' }}>
          <div className="pin-marker science">
            <span className="dot" />
          </div>
          <div className="pin-card">
            <span className="pin-title">Boxwork Ridge Target</span>
            <span className="pin-elev">-4,120 m • Slope: 8.4°</span>
          </div>
        </div>

        {/* Floating Controls */}
        <div className="terrain-canvas-controls">
          <button
            className={`terrain-toggle-hazard-btn ${showSlopeHazards ? 'active' : ''}`}
            onClick={() => setShowSlopeHazards(!showSlopeHazards)}
          >
            <AlertTriangle size={14} />
            <span>{showSlopeHazards ? 'Hide Slope Hazards' : 'Show Slope Hazards (>15°)'}</span>
          </button>

          <button className="terrain-hud-btn" onClick={onOpenHUD}>
            <Eye size={14} />
            <span>Open in Spacesuit HUD</span>
          </button>
        </div>
      </div>

      {/* Satellite Relay & Slope Profile Footer */}
      <div className="terrain-footer-grid">
        <div className="terrain-card-stat">
          <span className="stat-label">SATELLITE LINE-OF-SIGHT RELAY</span>
          <div className="stat-row">
            <Radio size={16} className="text-accent" />
            <span className="stat-main">MRO Orbiter (Elevation 42° N)</span>
          </div>
          <span className="stat-sub">Direct high-gain window open for next 38 minutes</span>
        </div>

        <div className="terrain-card-stat">
          <span className="stat-label">TERRAIN ROUGHNESS INDEX (TRI)</span>
          <div className="stat-row">
            <ShieldCheck size={16} className="text-success" />
            <span className="stat-main">Low Roughness (TRI 0.14)</span>
          </div>
          <span className="stat-sub">Optimal for pressurized rover mobility and EVA foot travel</span>
        </div>
      </div>
    </div>
  );
}

