import React from 'react';
import { X, Play, Volume2, ShieldCheck, Compass, Radio } from 'lucide-react';

export default function SimulationModal({ isOpen, onClose, location }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="simulation-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="simulation-media-wrap">
          <img
            src={location?.landscapeImg || '/assets/mars_base_site.jpg'}
            alt="Simulation Feed"
            className="simulation-backdrop-img"
          />
          <div className="simulation-hud-overlay">
            <div className="sim-hud-top">
              <div className="sim-badge-row">
                <span className="sim-live-indicator animate-live-pulse" />
                <span className="sim-hud-tag">SURFACE RECONNAISSANCE SIMULATION</span>
              </div>
              <button className="sim-close-btn" onClick={onClose}>
                <X size={18} />
              </button>
            </div>

            <div className="sim-hud-middle">
              <div className="sim-crosshair-reticle" />
            </div>

            <div className="sim-hud-bottom">
              <div className="sim-telemetry-col">
                <div className="sim-site-name">{location?.name || 'Proposed Base Site'}</div>
                <div className="sim-subdata">
                  <span>TELEMETRY LINK: STABLE 98.4%</span>
                  <span>LAT: 14.6° N</span>
                  <span>LON: 32.3° E</span>
                  <span>ATMOS: 610 Pa CO₂</span>
                </div>
              </div>

              <div className="sim-action-controls">
                <button className="sim-play-toggle">
                  <Play size={16} fill="white" />
                  <span>Stream Playback</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
