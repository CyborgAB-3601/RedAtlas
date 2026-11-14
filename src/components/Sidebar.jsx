import React from 'react';
import {
  SlidersHorizontal,
  MapPin,
  Route as RouteIcon,
  Layers,
  CloudSun,
  Mountain,
  ArrowUpRight
} from 'lucide-react';

export default function Sidebar({ activeSection, setActiveSection, onExplorePromo }) {
  const menuItems = [
    { id: 'Overview', label: 'Overview', icon: SlidersHorizontal },
    { id: 'Waypoints', label: 'Waypoints', icon: MapPin },
    { id: 'Routes', label: 'Routes', icon: RouteIcon },
    { id: 'Layers', label: 'Layers', icon: Layers },
    { id: 'Conditions', label: 'Conditions', icon: CloudSun },
    { id: '3D Terrain', label: '3D Terrain', icon: Mountain },
  ];

  return (
    <aside className="sidebar-container">
      {/* Navigation List */}
      <div className="sidebar-nav-list">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              title={item.label}
            >
              {isActive && <div className="active-accent-bar" />}
              <div className={`nav-icon-wrap ${isActive ? 'active-icon' : ''}`}>
                <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
              </div>
              <span className="nav-item-label">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Bottom Promo Card with Slanted Architectural Top */}
      <div className="sidebar-promo-wrapper" onClick={onExplorePromo}>
        <div className="sidebar-promo-card">
          <img
            src="/assets/mars_frontier_promo.jpg"
            alt="Martian Frontier"
            className="promo-bg-image"
          />
          <div className="promo-gradient-overlay" />
          <div className="promo-content">
            <h3 className="promo-title">
              A<br />New Frontier<br />Awaits.
            </h3>
            <button className="promo-action-btn" aria-label="Explore Mars frontier">
              <ArrowUpRight size={17} />
            </button>
          </div>
        </div>
      </div>

      {/* SVG ClipPath Definition for Exact Slanted Shape */}
      <svg width="0" height="0" className="clip-defs-svg" aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <clipPath id="slantedPromoClip" clipPathUnits="objectBoundingBox">
            <path d="M 0,0.14 C 0,0.085 0.045,0.058 0.13,0.052 L 0.87,0.008 C 0.945,0.001 1,0.024 1,0.065 L 1,0.935 C 1,0.975 0.945,1 0.87,1 L 0.13,1 C 0.055,1 0,0.975 0,0.935 Z" />
          </clipPath>
        </defs>
      </svg>
    </aside>
  );
}
