import React from 'react';
import {
  X,
  MapPin,
  Navigation,
  Mountain,
  Sun,
  Droplet,
  ShieldAlert,
  Pickaxe,
  Radio,
  Bookmark,
  CheckCircle2
} from 'lucide-react';
import { hudAudio } from '../services/audioService';

export default function LocationDetailsModal({
  location,
  isOpen,
  onClose,
  activeDestination,
  onSetDestination,
  onSaveWaypoint,
  onNotify
}) {
  if (!isOpen || !location) return null;

  const isCurrentDestination = activeDestination?.id === location.id;

  return (
    <div className="hud-modal-backdrop" onClick={onClose}>
      <div className="hud-modal-panel location-details-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <MapPin size={16} className="text-amber-400" />
            <h3 className="modal-title">GEOLOGICAL & RECONNAISSANCE DOSSIER</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body-scroll">
          {/* Hero Banner with Landscape Photo */}
          <div className="dossier-hero">
            <img
              src={location.landscapeImg || location.satelliteImg || '/assets/mars_base_site.jpg'}
              alt={location.name}
              className="dossier-hero-img"
              onError={(e) => {
                e.target.src = '/assets/mars_base_site.jpg';
              }}
            />
            <div className="dossier-hero-scrim" />
            <div className="dossier-hero-caption">
              <span className="dossier-cat-badge">OFFICIAL NASA / MRO HiRISE DATASET</span>
              <h2 className="dossier-title">{location.name}</h2>
              <p className="dossier-subtitle">{location.subtitle}</p>
            </div>
          </div>

          {/* Core Geographical Coordinates */}
          <div className="dossier-specs-row">
            <div className="spec-box">
              <span className="sb-label">COORDINATES</span>
              <span className="sb-val text-amber-400">{location.coordsText || `${location.coords?.lat}, ${location.coords?.lng}`}</span>
            </div>
            <div className="spec-box">
              <span className="sb-label">ELEVATION</span>
              <span className="sb-val text-cyan-400">{location.elevationVal || location.coords?.elev}</span>
            </div>
            <div className="spec-box">
              <span className="sb-label">PRIMARY MINERAL</span>
              <span className="sb-val">{location.rockType}</span>
            </div>
            <div className="spec-box">
              <span className="sb-label">SOLAR INSOLATION</span>
              <span className="sb-val text-amber-300">{location.solarExposure}</span>
            </div>
          </div>

          {/* Detailed Terrain Morphology Section */}
          {location.terrain && (
            <div className="dossier-section">
              <div className="sec-header-line">
                <Mountain size={14} className="text-amber-400" />
                <h4>TERRAIN & TRAVERSE MORPHOLOGY</h4>
              </div>
              <p className="sec-desc-text">{location.terrain.summary}</p>
              <div className="sec-grid">
                <div className="sec-pill"><strong>Roughness:</strong> {location.terrain.roughness}</div>
                <div className="sec-pill"><strong>Max Incline Slope:</strong> {location.terrain.maxSlope}</div>
                <div className="sec-pill"><strong>Traverse Limit:</strong> {location.terrain.traverseLimit}</div>
                <div className="sec-pill"><strong>Elevation Range:</strong> {location.terrain.elevationRange}</div>
              </div>
            </div>
          )}

          {/* Resources & ISRU Section */}
          {location.resources && (
            <div className="dossier-section">
              <div className="sec-header-line">
                <Droplet size={14} className="text-sky-400" />
                <h4>RESOURCES & IN-SITU UTILIZATION (ISRU)</h4>
              </div>
              <p className="sec-desc-text">{location.resources.summary}</p>
              <div className="sec-grid">
                <div className="sec-pill"><strong>Water Hydration:</strong> {location.resources.waterHydration}</div>
                <div className="sec-pill"><strong>Lead Instrument:</strong> {location.resources.leadInstrument}</div>
                <div className="sec-pill"><strong>ISRU Potential:</strong> {location.resources.isruPotential}</div>
              </div>
            </div>
          )}

          {/* Environmental Hazards Section */}
          {location.hazards && (
            <div className="dossier-section">
              <div className="sec-header-line">
                <ShieldAlert size={14} className="text-rose-400" />
                <h4>ENVIRONMENTAL HAZARDS & RISK ASSESSMENT</h4>
              </div>
              <p className="sec-desc-text">{location.hazards.summary}</p>
              <div className="sec-grid">
                <div className="sec-pill"><strong>Radiation Level:</strong> {location.hazards.radiationLevel}</div>
                <div className="sec-pill"><strong>Thermal Swing:</strong> {location.hazards.thermalSwings}</div>
                <div className="sec-pill"><strong>Atmospheric Pressure:</strong> {location.hazards.atmosphericPressure}</div>
                <div className="sec-pill"><strong>Risk Rating:</strong> {location.hazards.riskLevel}</div>
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="dossier-actions-bar">
            <button
              className={`hud-action-btn ${isCurrentDestination ? 'btn-active-dest' : 'btn-primary-dest'}`}
              onClick={() => {
                hudAudio.playDestinationSet();
                onSetDestination(location);
                onClose();
                if (onNotify) onNotify(`Destination Locked: ${location.name}`, 'info');
              }}
            >
              {isCurrentDestination ? (
                <>
                  <CheckCircle2 size={13} />
                  <span>CURRENT DESTINATION</span>
                </>
              ) : (
                <>
                  <Navigation size={13} />
                  <span>SET AS MISSION DESTINATION</span>
                </>
              )}
            </button>

            <button
              className="hud-action-btn btn-secondary"
              onClick={() => {
                hudAudio.playWaypointPlaced();
                onSaveWaypoint(location);
                if (onNotify) onNotify(`Waypoint Saved: ${location.name}`, 'info');
              }}
            >
              <Bookmark size={13} />
              <span>SAVE AS WAYPOINT</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
