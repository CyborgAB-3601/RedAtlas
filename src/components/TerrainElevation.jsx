import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function TerrainElevation({ selectedLocation }) {
  const [hoverPoint, setHoverPoint] = useState(null);

  // SVG Coordinates for the elevation profile
  // Width: 460, Height: 150
  // Y-Scale: 0 = +2.5km, 40 = 0km, 90 = -2km, 130 = -4km
  // Dynamic target coordinates from selectedLocation
  const loc = selectedLocation || {};
  const targetX = loc.chartX ?? 390;
  const targetY = loc.chartY ?? 119;
  const targetElev = loc.coords?.elev || loc.elevationVal || "-2,450 m";
  const defaultDistance = loc.distanceKm || "324 km";

  const pathD = "M 0 105 " +
    "C 20 100, 35 70, 50 48 " +
    "C 65 32, 75 42, 90 68 " +
    "C 105 90, 130 92, 160 88 " +
    "C 190 84, 215 95, 245 98 " +
    "C 285 102, 330 110, 370 118 " +
    "C 382 120, 395 120, 410 115 " +
    "C 430 110, 445 116, 460 120";

  const areaD = `${pathD} L 460 150 L 0 150 Z`;

  const currentDistance = hoverPoint ? `${Math.round((hoverPoint.x / 460) * 380)} km` : defaultDistance;
  const currentElev = hoverPoint ? `${Math.round(2000 - (hoverPoint.y / 150) * 6000)} m` : targetElev;

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(460, ((e.clientX - rect.left) / rect.width) * 460));
    // Approximate y along curve
    const normalizedY = 105 - Math.sin((x / 460) * Math.PI * 1.5) * 55 + (x > 250 ? (x - 250) * 0.12 : 0);
    setHoverPoint({ x, y: Math.max(25, Math.min(135, normalizedY)) });
  };

  const handleMouseLeave = () => {
    setHoverPoint(null);
  };

  return (
    <div className="terrain-elevation-container">
      {/* Header with Title and Metrics */}
      <div className="elevation-header">
        <button className="elevation-title-btn">
          <span className="title-text">Terrain Elevation</span>
          <ChevronDown size={15} />
        </button>

        <div className="elevation-metrics-group">
          <div className="metric-item">
            <span className="metric-label">Distance:</span>
            <span className="metric-val">{currentDistance}</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Elev:</span>
            <span className="metric-val">{currentElev}</span>
          </div>
        </div>
      </div>

      {/* SVG Elevation Profile Chart */}
      <div
        className="elevation-chart-wrapper"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Y-Axis Labels */}
        <div className="y-axis-labels">
          <span className="axis-mark" style={{ top: '8%' }}>2 km</span>
          <span className="axis-mark" style={{ top: '38%' }}>0</span>
          <span className="axis-mark" style={{ top: '65%' }}>-2 km</span>
          <span className="axis-mark" style={{ top: '88%' }}>-4 km</span>
        </div>

        {/* SVG Drawing Canvas */}
        <div className="chart-svg-box">
          <svg
            viewBox="0 0 460 150"
            className="elevation-svg"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="terrainFillGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C84C27" stopOpacity="0.38" />
                <stop offset="45%" stopColor="#D9532F" stopOpacity="0.22" />
                <stop offset="85%" stopColor="#E5A486" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.01" />
              </linearGradient>

              <filter id="badgeShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.12)" />
              </filter>
            </defs>

            {/* Horizontal Grid Guidelines */}
            <line x1="0" y1="20" x2="460" y2="20" className="chart-grid-line" strokeWidth="1" />
            <line x1="0" y1="62" x2="460" y2="62" className="chart-grid-line" strokeWidth="1" />
            <line x1="0" y1="105" x2="460" y2="105" className="chart-grid-line" strokeWidth="1" />

            {/* Gradient Filled Terrain Area */}
            <path
              d={areaD}
              fill="url(#terrainFillGradient)"
            />

            {/* Solid Stroke Ridge Line */}
            <path
              d={pathD}
              fill="none"
              stroke="#B54A28"
              strokeWidth="2.2"
              strokeLinecap="round"
            />

            {/* Vertical Marker Guide Line at Base Location */}
            <line
              x1={targetX}
              y1={Math.max(15, targetY - 45)}
              x2={targetX}
              y2={targetY}
              stroke="#C84C27"
              strokeWidth="1.2"
              strokeDasharray="2 3"
              opacity="0.8"
            />

            {/* Base Target Dot */}
            <circle
              cx={targetX}
              cy={targetY}
              r="4.5"
              fill="#D84D29"
              stroke="#FFFFFF"
              strokeWidth="2.5"
            />
          </svg>

          {/* Floating Elevation Value Badge */}
          <div
            className="floating-elevation-badge"
            style={{
              left: `${(targetX / 460) * 100}%`,
              top: `${Math.max(10, Math.min(75, ((targetY - 30) / 150) * 100))}%`
            }}
          >
            <span>{targetElev}</span>
          </div>

          {/* Interactive Hover Pin */}
          {hoverPoint && (
            <div
              className="chart-hover-indicator"
              style={{
                left: `${(hoverPoint.x / 460) * 100}%`,
                top: `${(hoverPoint.y / 150) * 100}%`
              }}
            >
              <div className="hover-dot" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
