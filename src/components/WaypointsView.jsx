import React, { useState } from 'react';
import {
  SCIENCE_WAYPOINTS,
  getLocationById
} from '../data/marsLocations';
import {
  MapPin,
  Mountain,
  Droplet,
  Compass,
  AlertTriangle,
  Radio,
  Plus,
  Check,
  Eye,
  Crosshair,
  ArrowRight,
  ShieldCheck,
  Layers,
  Sparkles
} from 'lucide-react';

export default function WaypointsView({
  onSelectWaypoint,
  onOpenHUD,
  selectedLocation
}) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedWp, setSelectedWp] = useState(SCIENCE_WAYPOINTS[0]);
  const [addedWpIds, setAddedWpIds] = useState(['wp_boxwork_01']);

  const categories = ['All', 'Boxwork', 'River Delta', 'Lava Tubes', 'Water Ice', 'Deep Strata'];

  const filteredWaypoints = activeCategory === 'All'
    ? SCIENCE_WAYPOINTS
    : SCIENCE_WAYPOINTS.filter((wp) => wp.category === activeCategory);

  const toggleAddToRoute = (wpId, e) => {
    e.stopPropagation();
    setAddedWpIds((prev) =>
      prev.includes(wpId) ? prev.filter((id) => id !== wpId) : [...prev, wpId]
    );
  };

  return (
    <div className="waypoints-view-container animate-fade-in">
      {/* Top Header Row with Category Filters */}
      <div className="view-header-strip">
        <div className="view-title-group">
          <div className="view-badge">
            <MapPin size={13} className="text-accent" />
            <span>FIELD SCIENCE CATALOG</span>
          </div>
          <h2 className="view-heading">Hyperlocalized Science Targets</h2>
          <p className="view-subtext">
            High-priority geological sampling sites surveyed by NASA rovers, tagged for astronaut surface excursion.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="filter-pills-row">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`filter-pill-btn ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Waypoint Cards */}
      <div className="waypoints-grid">
        {filteredWaypoints.map((wp) => {
          const isSelected = selectedWp.id === wp.id;
          const isAdded = addedWpIds.includes(wp.id);

          return (
            <div
              key={wp.id}
              className={`waypoint-card ${isSelected ? 'is-selected' : ''}`}
              onClick={() => {
                setSelectedWp(wp);
                if (onSelectWaypoint) onSelectWaypoint(wp);
              }}
            >
              <div className="wp-media-thumb">
                <img
                  src={wp.image || '/assets/mars_base_site.jpg'}
                  alt={wp.name}
                  className="wp-card-img"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/assets/mars_base_site.jpg';
                  }}
                />
                <div className="wp-tag-badge">{wp.category}</div>
                <div className="wp-priority-pill">{wp.priority} Priority</div>
              </div>

              <div className="wp-card-body">
                <div className="wp-card-header">
                  <h3 className="wp-card-title">{wp.name}</h3>
                  <span className="wp-card-loc">{wp.locationName}</span>
                </div>

                <div className="wp-metrics-row">
                  <div className="wp-metric-item">
                    <span className="metric-label">COORDINATES</span>
                    <span className="metric-val">{wp.coords}</span>
                  </div>
                  <div className="wp-metric-item">
                    <span className="metric-label">ELEVATION</span>
                    <span className="metric-val">{wp.elevation}</span>
                  </div>
                  <div className="wp-metric-item">
                    <span className="metric-label">SLOPE</span>
                    <span className="metric-val">{wp.slope}</span>
                  </div>
                </div>

                <p className="wp-goal-text">{wp.scienceGoal}</p>

                <div className="wp-minerals-list">
                  {wp.minerals.map((m, i) => (
                    <span key={i} className="mineral-chip">
                      {m}
                    </span>
                  ))}
                </div>

                <div className="wp-actions-row">
                  <button
                    className={`wp-route-toggle-btn ${isAdded ? 'is-added' : ''}`}
                    onClick={(e) => toggleAddToRoute(wp.id, e)}
                  >
                    {isAdded ? (
                      <>
                        <Check size={14} />
                        <span>Added to EVA Route</span>
                      </>
                    ) : (
                      <>
                        <Plus size={14} />
                        <span>Add to Route</span>
                      </>
                    )}
                  </button>

                  <button
                    className="wp-hud-btn"
                    title="View in Astronaut Visor HUD"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onOpenHUD) onOpenHUD();
                    }}
                  >
                    <Eye size={14} />
                    <span>Visor POV</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Target Ground-Truth POV Inspector Box */}
      {selectedWp && (
        <div className="ground-truth-inspector-card">
          <div className="inspector-left-media">
            <img
              src={selectedWp.povImg || '/assets/mars_expanded_terrain.jpg'}
              alt="Surface POV"
              className="inspector-pov-img"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/assets/mars_expanded_terrain.jpg';
              }}
            />
            <div className="inspector-pov-overlay">
              <span className="pov-tag">
                <Sparkles size={12} /> NASA ROVER GROUND TRUTH POV
              </span>
              <span className="pov-note">What astronaut will observe on arrival</span>
            </div>
          </div>

          <div className="inspector-right-content">
            <div className="inspector-title-row">
              <h3 className="inspector-title">{selectedWp.name}</h3>
              <span className="inspector-coords">{selectedWp.coords}</span>
            </div>

            <div className="inspector-specs-grid">
              <div className="spec-card">
                <span className="spec-label">REQUIRED FIELD INSTRUMENT</span>
                <span className="spec-value">{selectedWp.instrumentNeeded}</span>
              </div>
              <div className="spec-card">
                <span className="spec-label">AMBIENT RADIATION DOSE</span>
                <span className="spec-value">{selectedWp.radiationDose}</span>
              </div>
              <div className="spec-card">
                <span className="spec-label">SAMPLE STATUS</span>
                <span className="spec-value text-accent">{selectedWp.sampleStatus}</span>
              </div>
            </div>

            <p className="inspector-detail-desc">
              Curiosity and orbital CRISM data reveal dense vein networks filled with hydrated calcium sulfate. These boxwork structures represent late-stage subterranean hydrothermal activity on early Mars.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

