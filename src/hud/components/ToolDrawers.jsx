import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Navigation,
  MapPin,
  Check,
  Bot,
  Activity,
  Heart,
  Shield,
  Ruler,
  Layers,
  Zap,
  Radio,
  Clock,
  Compass,
  ArrowRight,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { hudAudio } from '../services/audioService';

export default function ToolDrawers({
  activeTool,
  onClose,
  waypoints,
  onAddWaypoint,
  onDeleteWaypoint,
  routes,
  activeRoute,
  onSelectRoute,
  rovers,
  selectedRover,
  onSelectRover,
  astronautTelemetry,
  activeDestination,
  onSetDestination,
  layers,
  onToggleLayer,
  locations,
  onSelectLocation,
  onNotify
}) {
  // Waypoint form state
  const [newWpName, setNewWpName] = useState('');
  const [newWpType, setNewWpType] = useState('LANDMARK');

  // Measure form state
  const [measurePointA, setMeasurePointA] = useState('astronaut');
  const [measurePointB, setMeasurePointB] = useState('proposed_base');

  if (!activeTool || activeTool === 'Explore') return null;

  // Handle Add Waypoint
  const handleCreateWaypoint = (e) => {
    e.preventDefault();
    if (!newWpName.trim()) return;

    hudAudio.playWaypointPlaced();
    const newWp = {
      id: `wp-${Date.now()}`,
      name: newWpName.trim(),
      coords: `${(14.6 + (Math.random() * 0.1 - 0.05)).toFixed(2)}° N, ${(32.3 + (Math.random() * 0.1 - 0.05)).toFixed(2)}° E`,
      latNum: 14.6 + (Math.random() * 0.1 - 0.05),
      lngNum: 32.3 + (Math.random() * 0.1 - 0.05),
      elevation: -2450 + Math.floor(Math.random() * 80 - 40),
      type: newWpType,
      notes: 'User-placed HUD navigational mark'
    };

    onAddWaypoint(newWp);
    setNewWpName('');
    if (onNotify) onNotify(`Waypoint Created: ${newWp.name}`, 'info');
  };

  // Distance calculation helper for Measure tool
  const calculateDistance = () => {
    let posA = { name: 'Astronaut (CDR. Nived)', lat: 14.612, lng: 32.315, elev: -2450 };
    let posB = { name: 'Proposed Base Site', lat: 14.6, lng: 32.3, elev: -2450 };

    if (measurePointA !== 'astronaut' && locations[measurePointA]) {
      const loc = locations[measurePointA];
      posA = { name: loc.name, lat: loc.latNum, lng: loc.lngNum, elev: loc.elevationNum };
    }
    if (locations[measurePointB]) {
      const loc = locations[measurePointB];
      posB = { name: loc.name, lat: loc.latNum, lng: loc.lngNum, elev: loc.elevationNum };
    }

    // Martian surface spherical distance approximation (Mars radius ~3,389.5 km)
    const R = 3389.5;
    const dLat = ((posB.lat - posA.lat) * Math.PI) / 180;
    const dLng = ((posB.lng - posA.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((posA.lat * Math.PI) / 180) *
        Math.cos((posB.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distKm = R * c;

    const elevDiff = posB.elev - posA.elev;
    const estTimeMins = Math.round((distKm / 4.5) * 60);

    return {
      posA,
      posB,
      distKm: distKm < 1 ? `${Math.round(distKm * 1000)} m` : `${distKm.toFixed(2)} km`,
      elevDiff: `${elevDiff > 0 ? '+' : ''}${elevDiff} m`,
      estTime: estTimeMins > 60 ? `${Math.floor(estTimeMins / 60)}h ${estTimeMins % 60}m` : `${estTimeMins} min`,
      slope: `${(Math.atan2(Math.abs(elevDiff), Math.max(10, distKm * 1000)) * (180 / Math.PI)).toFixed(1)}°`
    };
  };

  const measureResult = calculateDistance();

  return (
    <div className="hud-tool-drawer-backdrop" onClick={onClose}>
      <div className="hud-tool-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-title-group">
            <span className="drawer-badge">HUD TOOL // ACTIVE</span>
            <h3 className="drawer-title">{activeTool.toUpperCase()} INTERFACE</h3>
          </div>
          <button className="drawer-close-btn" onClick={onClose} title="Close Panel (ESC)">
            <X size={16} />
          </button>
        </div>

        {/* Drawer Body by Tool */}
        <div className="drawer-content-scroll">
          {/* ================= 1. WAYPOINT TOOL ================= */}
          {activeTool === 'Waypoint' && (
            <div className="tool-view-waypoint">
              {/* Form to place new waypoint */}
              <form onSubmit={handleCreateWaypoint} className="wp-create-form">
                <span className="form-subtitle">PLACE RETICLE TARGET WAYPOINT</span>
                <div className="form-row">
                  <input
                    type="text"
                    placeholder="Enter waypoint title (e.g. Outcrop Survey Site)"
                    value={newWpName}
                    onChange={(e) => setNewWpName(e.target.value)}
                    className="hud-input"
                  />
                  <select
                    value={newWpType}
                    onChange={(e) => setNewWpType(e.target.value)}
                    className="hud-select"
                  >
                    <option value="HABITAT">Habitat / Hub</option>
                    <option value="POWER">Power / Solar</option>
                    <option value="RESOURCE">Resource / Ice</option>
                    <option value="COMMS">Comms Relay</option>
                    <option value="LANDMARK">Geological Mark</option>
                    <option value="HAZARD">Hazard Area</option>
                  </select>
                  <button type="submit" className="hud-submit-btn">
                    <Plus size={14} />
                    <span>ADD WP</span>
                  </button>
                </div>
              </form>

              {/* Waypoints List */}
              <div className="wp-list-section">
                <span className="section-label">SAVED NAVIGATION WAYPOINTS ({waypoints.length})</span>
                <div className="wp-items-grid">
                  {waypoints.map((wp) => (
                    <div key={wp.id} className="wp-card">
                      <div className="wp-card-main">
                        <div className="wp-icon-pill">
                          <MapPin size={14} className="text-amber-400" />
                          <span className="wp-type-tag">{wp.type}</span>
                        </div>
                        <h4 className="wp-name">{wp.name}</h4>
                        <div className="wp-coords-line">
                          <span>{wp.coords}</span>
                          <span className="text-cyan-400">{wp.elevation} m</span>
                        </div>
                        {wp.notes && <p className="wp-notes">{wp.notes}</p>}
                      </div>

                      <div className="wp-card-actions">
                        <button
                          className="wp-action-btn select-dest"
                          onClick={() => {
                            hudAudio.playDestinationSet();
                            onSetDestination({
                              id: wp.id,
                              name: wp.name,
                              latNum: wp.latNum,
                              lngNum: wp.lngNum,
                              elevationVal: `${wp.elevation} m`
                            });
                            if (onNotify) onNotify(`Navigating to Waypoint: ${wp.name}`, 'info');
                          }}
                          title="Set as Active Navigation Target"
                        >
                          <Navigation size={12} />
                          <span>NAV TO</span>
                        </button>
                        <button
                          className="wp-action-btn delete-wp"
                          onClick={() => {
                            hudAudio.playSelect();
                            onDeleteWaypoint(wp.id);
                          }}
                          title="Delete Waypoint"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= 2. ROUTE TOOL ================= */}
          {activeTool === 'Route' && (
            <div className="tool-view-route">
              <span className="section-label">ARES-IV OPTIMAL TRAVERSE PATHS</span>
              <div className="routes-list">
                {routes.map((rt) => {
                  const isSelected = activeRoute?.id === rt.id;

                  return (
                    <div key={rt.id} className={`route-card ${isSelected ? 'active-route-card' : ''}`}>
                      <div className="route-card-header">
                        <div className="route-title-group">
                          <span className="route-badge">ELEVATION OPTIMIZED</span>
                          <h4 className="route-name">{rt.name}</h4>
                        </div>
                        <button
                          className={`route-select-btn ${isSelected ? 'active' : ''}`}
                          onClick={() => {
                            hudAudio.playDestinationSet();
                            onSelectRoute(rt);
                            if (onNotify) onNotify(`Active Route: ${rt.name}`, 'info');
                          }}
                        >
                          {isSelected ? (
                            <>
                              <Check size={13} />
                              <span>ENGAGED</span>
                            </>
                          ) : (
                            <>
                              <Navigation size={13} />
                              <span>ENGAGE ROUTE</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="route-metrics-bar">
                        <div className="rt-metric">
                          <span className="rt-label">TOTAL DISTANCE</span>
                          <span className="rt-val text-amber-400">{rt.distanceKm} km</span>
                        </div>
                        <div className="rt-metric">
                          <span className="rt-label">EST. WALK TIME</span>
                          <span className="rt-val text-cyan-400">{rt.estimatedWalkTime}</span>
                        </div>
                        <div className="rt-metric">
                          <span className="rt-label">MAX SLOPE</span>
                          <span className="rt-val text-emerald-400">{rt.maxSlopeDeg}°</span>
                        </div>
                        <div className="rt-metric">
                          <span className="rt-label">SUIT ENERGY</span>
                          <span className="rt-val text-amber-300">{rt.suitEnergyConsumption}</span>
                        </div>
                      </div>

                      {/* Checkpoints Trajectory */}
                      <div className="route-checkpoints-flow">
                        <span className="cp-title">TRAVERSE CHECKPOINTS:</span>
                        <div className="cp-steps">
                          {rt.checkpoints.map((cp, idx) => (
                            <div key={idx} className="cp-step">
                              <span className="cp-idx">{idx + 1}</span>
                              <div className="cp-info">
                                <span className="cp-name">{cp.name}</span>
                                <span className="cp-dist">{cp.coords} • {cp.distance}</span>
                              </div>
                              {idx < rt.checkpoints.length - 1 && <ArrowRight size={12} className="cp-arrow" />}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= 3. ROVER TOOL ================= */}
          {activeTool === 'Rover' && (
            <div className="tool-view-rover">
              <span className="section-label">SURFACE ROVER FLEET TELEMETRY</span>
              <div className="rover-cards-grid">
                {rovers.map((rov) => {
                  const isSel = selectedRover?.id === rov.id;

                  return (
                    <div key={rov.id} className={`rover-card ${isSel ? 'selected' : ''}`} onClick={() => onSelectRover(rov)}>
                      <div className="rover-header">
                        <div className="rover-title-block">
                          <div className="rover-status-row">
                            <span className="rover-dot-active" />
                            <span className="rover-status-text">{rov.status}</span>
                            <span className="rover-dist-tag">{rov.distanceFromAstronaut} AWAY</span>
                          </div>
                          <h4 className="rover-name">{rov.name}</h4>
                          <span className="rover-type-label">{rov.type}</span>
                        </div>
                        <div className="rover-battery-pill">
                          <Zap size={13} className="text-amber-400" />
                          <span>{rov.battery}% PWR</span>
                        </div>
                      </div>

                      <div className="rover-specs-table">
                        <div className="spec-row">
                          <span>COORDINATES:</span>
                          <span className="text-amber-400">{rov.coords}</span>
                        </div>
                        <div className="spec-row">
                          <span>COMMUNICATIONS:</span>
                          <span className="text-emerald-400">{rov.commStatus} ({rov.commLatency})</span>
                        </div>
                        <div className="spec-row">
                          <span>OPERATIONAL MODE:</span>
                          <span>{rov.operationalMode}</span>
                        </div>
                        <div className="spec-row">
                          <span>CARGO CAPACITY:</span>
                          <span>{rov.cargoCapacity}</span>
                        </div>
                      </div>

                      {rov.instruments && (
                        <div className="rover-instruments-pills">
                          {rov.instruments.map((ins, i) => (
                            <span key={i} className="ins-pill">{ins}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= 4. ASTRONAUT TOOL ================= */}
          {activeTool === 'Astronaut' && (
            <div className="tool-view-astronaut">
              <div className="astronaut-profile-card">
                <div className="astro-id-header">
                  <div className="astro-avatar-box">
                    <User size={32} className="text-amber-400" />
                  </div>
                  <div className="astro-details">
                    <h3 className="astro-full-name">{astronautTelemetry.fullName}</h3>
                    <div className="astro-meta-line">
                      <span className="text-amber-400">{astronautTelemetry.role}</span>
                      <span>•</span>
                      <span>{astronautTelemetry.mission}</span>
                    </div>
                    <div className="astro-badge-line">
                      <span className="callsign-tag">{astronautTelemetry.callsign}</span>
                      <span className="eva-session-tag">{astronautTelemetry.evaSession}</span>
                    </div>
                  </div>
                </div>

                {/* Vitals Diagnostics Matrix */}
                <span className="section-label">FULL BIOMETRIC DIAGNOSTICS</span>
                <div className="biometrics-matrix">
                  <div className="bio-card">
                    <span className="bio-label">HEART RATE</span>
                    <span className="bio-val text-rose-400">{astronautTelemetry.vitals.heartRate} <small>BPM</small></span>
                    <span className="bio-sub">Lead-II Sinus Rhythm</span>
                  </div>
                  <div className="bio-card">
                    <span className="bio-label">BLOOD OXYGEN (SpO₂)</span>
                    <span className="bio-val text-cyan-400">{astronautTelemetry.vitals.spo2}%</span>
                    <span className="bio-sub">Arterial Saturation</span>
                  </div>
                  <div className="bio-card">
                    <span className="bio-label">RESPIRATION</span>
                    <span className="bio-val text-emerald-400">{astronautTelemetry.vitals.respirationRate} <small>BR/MIN</small></span>
                    <span className="bio-sub">Diaphragmatic Rhythm</span>
                  </div>
                  <div className="bio-card">
                    <span className="bio-label">CORE TEMPERATURE</span>
                    <span className="bio-val text-amber-400">{astronautTelemetry.vitals.coreTemp}°C</span>
                    <span className="bio-sub">Thermoregulated</span>
                  </div>
                  <div className="bio-card">
                    <span className="bio-label">STRESS INDEX</span>
                    <span className="bio-val text-emerald-400">{astronautTelemetry.vitals.stressIndex}% (LOW)</span>
                    <span className="bio-sub">HRV Biomarker</span>
                  </div>
                  <div className="bio-card">
                    <span className="bio-label">RADIATION DOSE</span>
                    <span className="bio-val text-amber-300">{astronautTelemetry.suit.radiationDoseRate} <small>mSv/hr</small></span>
                    <span className="bio-sub">Safe GCR Threshold</span>
                  </div>
                </div>

                {/* Suit Consumables Diagnostic */}
                <span className="section-label">xEMU SUIT CONSUMABLES & LIFE SUPPORT</span>
                <div className="consumables-grid">
                  <div className="cons-item">
                    <div className="cons-header">
                      <span>Primary Oxygen (O₂)</span>
                      <span className="text-emerald-400">{astronautTelemetry.suit.primaryO2}%</span>
                    </div>
                    <div className="hud-progress-track">
                      <div className="hud-progress-fill oxygen-fill" style={{ width: `${astronautTelemetry.suit.primaryO2}%` }} />
                    </div>
                  </div>
                  <div className="cons-item">
                    <div className="cons-header">
                      <span>Reserve Oxygen Tank</span>
                      <span className="text-cyan-400">{astronautTelemetry.suit.reserveO2}% (SEALED)</span>
                    </div>
                    <div className="hud-progress-track">
                      <div className="hud-progress-fill" style={{ width: '100%', background: '#00f0ff' }} />
                    </div>
                  </div>
                  <div className="cons-item">
                    <div className="cons-header">
                      <span>Battery Life ({astronautTelemetry.suit.batteryHoursRemaining})</span>
                      <span className="text-amber-400">{astronautTelemetry.suit.battery}%</span>
                    </div>
                    <div className="hud-progress-track">
                      <div className="hud-progress-fill battery-fill" style={{ width: `${astronautTelemetry.suit.battery}%` }} />
                    </div>
                  </div>
                  <div className="cons-item">
                    <div className="cons-header">
                      <span>CO₂ Scrubber Efficiency</span>
                      <span className="text-emerald-400">{astronautTelemetry.suit.co2Scrubbers}%</span>
                    </div>
                    <div className="hud-progress-track">
                      <div className="hud-progress-fill" style={{ width: '99.8%', background: '#22c55e' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= 5. MEASURE TOOL ================= */}
          {activeTool === 'Measure' && (
            <div className="tool-view-measure">
              <span className="section-label">TERRAIN DISTANCE & ELEVATION RANGEFINDER</span>
              <p className="measure-intro">
                Compute great-circle surface distance, elevation profile difference, and estimated walking traverse time between any two points on Mars.
              </p>

              <div className="measure-selectors-grid">
                <div className="measure-point-box">
                  <span className="pt-tag">POINT A (ORIGIN)</span>
                  <select
                    className="hud-select w-full"
                    value={measurePointA}
                    onChange={(e) => setMeasurePointA(e.target.value)}
                  >
                    <option value="astronaut">Astronaut Current Coordinates (Ares EVA)</option>
                    {Object.values(locations).map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>

                <div className="measure-point-box">
                  <span className="pt-tag">POINT B (TARGET)</span>
                  <select
                    className="hud-select w-full"
                    value={measurePointB}
                    onChange={(e) => setMeasurePointB(e.target.value)}
                  >
                    {Object.values(locations).map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Calculated Results */}
              <div className="measure-results-panel">
                <div className="result-metric-card">
                  <span className="m-label">SURFACE DISTANCE</span>
                  <span className="m-val text-amber-400">{measureResult.distKm}</span>
                </div>
                <div className="result-metric-card">
                  <span className="m-label">ELEVATION DELTA (Δh)</span>
                  <span className="m-val text-cyan-400">{measureResult.elevDiff}</span>
                </div>
                <div className="result-metric-card">
                  <span className="m-label">EST. WALK TRAVERSE</span>
                  <span className="m-val text-emerald-400">{measureResult.estTime}</span>
                </div>
                <div className="result-metric-card">
                  <span className="m-label">AVG SLOPE INCLINE</span>
                  <span className="m-val text-amber-300">{measureResult.slope}</span>
                </div>
              </div>

              <div className="measure-coords-summary">
                <div>
                  <span className="text-gray-400">Point A:</span> <strong>{measureResult.posA.name}</strong> ({measureResult.posA.lat.toFixed(2)}° N, {measureResult.posA.lng.toFixed(2)}° E, Elev: {measureResult.posA.elev}m)
                </div>
                <div>
                  <span className="text-gray-400">Point B:</span> <strong>{measureResult.posB.name}</strong> ({measureResult.posB.lat.toFixed(2)}° N, {measureResult.posB.lng.toFixed(2)}° E, Elev: {measureResult.posB.elev}m)
                </div>
              </div>
            </div>
          )}

          {/* ================= 6. LAYERS TOOL ================= */}
          {activeTool === 'Layers' && (
            <div className="tool-view-layers">
              <span className="section-label">CONFIGURABLE HUD & MAP INFORMATION LAYERS (FR-15)</span>
              <p className="layers-intro">
                Toggle all 10 independent geospatial and telemetry layers across the HUD visor and the Mars Global Map.
              </p>

              <div className="layers-grid">
                {layers.map((layer) => (
                  <div
                    key={layer.id}
                    className={`layer-item-card ${layer.enabled ? 'enabled' : 'disabled'}`}
                    onClick={() => {
                      hudAudio.playSelect();
                      onToggleLayer(layer.id);
                    }}
                  >
                    <div className="layer-checkbox">
                      {layer.enabled ? (
                        <div className="check-box-checked" style={{ background: layer.color }}>
                          <Check size={12} color="#000000" />
                        </div>
                      ) : (
                        <div className="check-box-empty" />
                      )}
                    </div>
                    <div className="layer-meta">
                      <div className="layer-title-line">
                        <span className="layer-dot" style={{ background: layer.color }} />
                        <h4 className="layer-name">{layer.name}</h4>
                      </div>
                      <p className="layer-desc">{layer.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
