import React, { useState } from 'react';
import {
  Play,
  Droplet,
  Sun,
  Mountain,
  Wind,
  ArrowUpRight,
  MoreHorizontal,
  CheckCircle2
} from 'lucide-react';

export default function DetailPanel({
  locationData,
  activeMission,
  onPlayVideo,
  onAddToRoute,
  isAddedToRoute
}) {
  const [activeTab, setActiveTab] = useState('Overview');

  // Default to Proposed Base Site if none selected
  const activeLoc = locationData || {
    id: 'proposed_base',
    name: 'Proposed Base Site',
    subtitle: 'A potential location for future exploration and research.',
    coords: { lat: '14.6° N', lng: '32.3° E', elev: '-2,450 m' },
    satelliteImg: '/assets/crater_satellite_thumb.jpg',
    landscapeImg: '/assets/mars_base_site.jpg',
    insights: [
      {
        icon: Droplet,
        title: 'Water Ice (Subsurface)',
        desc: 'High probability'
      },
      {
        icon: Sun,
        title: 'Solar Exposure',
        desc: 'Good (5.8 kWh/m²/day)'
      },
      {
        icon: Mountain,
        title: 'Favorable Terrain',
        desc: 'Relatively flat, low roughness'
      },
      {
        icon: Wind,
        title: 'Low Dust Activity',
        desc: 'Compared to surrounding regions'
      }
    ]
  };

  const tabs = ['Overview', 'Terrain', 'Resources', 'Hazards'];

  return (
    <div className="detail-panel-container">
      {/* Top Preview Card */}
      <div className="preview-media-card" onClick={onPlayVideo}>
        <img
          src={activeLoc.landscapeImg || '/assets/mars_base_site.jpg'}
          alt={activeLoc.name}
          className="preview-media-img"
        />
        <div className="preview-gradient-scrim" />

        <div className="preview-text-content">
          <h2 className="preview-title">{activeLoc.name}</h2>
          <p className="preview-subtitle">
            {activeMission?.targetLocationId === activeLoc.id
              ? activeMission.objective
              : (activeLoc.subtitle || 'A potential location for future exploration and research.')}
          </p>
        </div>

        <button className="preview-play-btn" aria-label="Play location simulation">
          <Play size={16} fill="white" className="play-triangle-icon" />
        </button>
      </div>

      {/* Main Detail Specifications Card */}
      <div className="location-detail-card">
        {/* Navigation Tabs */}
        <div className="detail-tab-strip">
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                className={`detail-tab-item ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                <span>{tab}</span>
                {isActive && <div className="tab-indicator-bar" />}
              </button>
            );
          })}
        </div>

        {/* Content for Overview Tab */}
        {activeTab === 'Overview' && (
          <div className="tab-content-area">
            {/* Crater Satellite Thumbnail + Coordinates */}
            <div className="geodetic-profile-row">
              <div className="satellite-thumb-wrap">
                <img
                  src={activeLoc.satelliteImg || '/assets/crater_satellite_thumb.jpg'}
                  alt="Satellite Crater Reconnaissance"
                  className="crater-recon-img"
                />
                {/* Targeting Crosshair Reticle */}
                <div className="target-reticle">
                  <div className="reticle-circle" />
                  <div className="reticle-center-dot" />
                </div>
              </div>

              {/* Coordinates & Elevation Stats */}
              <div className="coordinates-column">
                <div className="coord-data-row">
                  <span className="coord-value">{activeLoc.coords?.lat || '14.6° N'}</span>
                  <span className="coord-label">LATITUDE</span>
                </div>
                <div className="coord-data-row">
                  <span className="coord-value">{activeLoc.coords?.lng || '32.3° E'}</span>
                  <span className="coord-label">LONGITUDE</span>
                </div>
                <div className="coord-data-row">
                  <span className="coord-value">{activeLoc.coords?.elev || '-2,450 m'}</span>
                  <span className="coord-label">ELEVATION</span>
                </div>
              </div>
            </div>

            {/* Key Insights Section */}
            <div className="key-insights-section">
              <h4 className="insights-header-title">Key Insights</h4>

              <div className="insights-quad-grid">
                {activeLoc.insights?.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="insight-tile">
                      <div className="insight-icon-circle">
                        <Icon size={16} strokeWidth={1.8} />
                      </div>
                      <div className="insight-text-group">
                        <span className="insight-title">{item.title}</span>
                        <span className="insight-description">{item.desc}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Content for Terrain Tab */}
        {activeTab === 'Terrain' && (
          <div className="tab-content-area">
            <div className="tab-text-info">
              <p className="tab-paragraph">
                {activeLoc.terrain?.summary || (activeMission?.targetLocationId === activeLoc.id
                  ? `Terrain mobility envelope calculated for ${activeMission.name}. Slope max ${activeMission.maxSlope} with pre-cleared rover wheel tracks.`
                  : activeLoc.desc)}
              </p>
              <div className="terrain-metrics-list">
                <div className="metric-row">
                  <span>Surface Roughness</span>
                  <strong>{activeLoc.terrain?.roughness || '0.18 (Smooth)'}</strong>
                </div>
                <div className="metric-row">
                  <span>Max Incline Grade</span>
                  <strong>{activeLoc.terrain?.maxSlope || (activeMission?.targetLocationId === activeLoc.id ? activeMission.maxSlope : '< 3.5°')}</strong>
                </div>
                <div className="metric-row">
                  <span>Traverse Limit</span>
                  <strong>{activeLoc.terrain?.traverseLimit || (activeMission?.targetLocationId === activeLoc.id ? activeMission.distanceTraverse : '4.5 km')}</strong>
                </div>
                <div className="metric-row">
                  <span>Elevation Datum</span>
                  <strong>{activeLoc.coords?.elev || activeLoc.elevationVal || '-2,450 m'}</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content for Resources Tab */}
        {activeTab === 'Resources' && (
          <div className="tab-content-area">
            <div className="tab-text-info">
              <p className="tab-paragraph">
                {activeLoc.resources?.summary || (activeMission?.targetLocationId === activeLoc.id
                  ? `Primary geological targets identified by ${activeMission.leadInstrument}: ${activeMission.primaryMineral}.`
                  : activeLoc.desc)}
              </p>
              <div className="terrain-metrics-list">
                <div className="metric-row">
                  <span>Primary Mineral</span>
                  <strong>{activeLoc.resources?.primaryMineral || (activeMission?.targetLocationId === activeLoc.id ? activeMission.primaryMineral : (activeLoc.rockType || 'Basaltic Regolith'))}</strong>
                </div>
                <div className="metric-row">
                  <span>Lead Instrument</span>
                  <strong>{activeLoc.resources?.leadInstrument || (activeMission?.targetLocationId === activeLoc.id ? activeMission.leadInstrument : 'CRISM & ChemCam')}</strong>
                </div>
                <div className="metric-row">
                  <span>Water Hydration</span>
                  <strong>{activeLoc.resources?.waterHydration || activeLoc.waterIce || 'High probability'}</strong>
                </div>
                <div className="metric-row">
                  <span>ISRU Potential</span>
                  <strong>{activeLoc.resources?.isruPotential || 'High (Base Feed)'}</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content for Hazards Tab */}
        {activeTab === 'Hazards' && (
          <div className="tab-content-area">
            <div className="tab-text-info">
              <p className="tab-paragraph">
                {activeLoc.hazards?.summary || (activeMission?.targetLocationId === activeLoc.id
                  ? `Environmental hazard analysis: ${activeMission.radiationEnv}. Overall mission safety risk level is ${activeMission.riskLevel}.`
                  : 'Surface radiation and atmospheric parameters monitored in real time.')}
              </p>
              <div className="terrain-metrics-list">
                <div className="metric-row">
                  <span>Radiation Ambient</span>
                  <strong>{activeLoc.hazards?.radiationLevel || (activeMission?.targetLocationId === activeLoc.id ? activeMission.radiationEnv.slice(0, 14) : '0.21 mSv/day')}</strong>
                </div>
                <div className="metric-row">
                  <span>Safety Risk Level</span>
                  <strong>{activeLoc.hazards?.riskLevel || (activeMission?.targetLocationId === activeLoc.id ? activeMission.riskLevel : 'Low (Sheltered)')}</strong>
                </div>
                <div className="metric-row">
                  <span>Thermal Swings</span>
                  <strong>{activeLoc.hazards?.thermalSwings || '-84°C to -15°C'}</strong>
                </div>
                <div className="metric-row">
                  <span>Atmospheric Pressure</span>
                  <strong>{activeLoc.hazards?.atmosphericPressure || '620 Pa (Nominal)'}</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Button Strip */}
        <div className="detail-action-strip">
          <button
            className={`add-to-route-btn ${isAddedToRoute ? 'added' : ''}`}
            onClick={onAddToRoute}
          >
            {isAddedToRoute ? (
              <>
                <CheckCircle2 size={16} />
                <span>Added to Route</span>
              </>
            ) : (
              <>
                <ArrowUpRight size={17} />
                <span>Add to Route</span>
              </>
            )}
          </button>

          <button className="more-options-btn" aria-label="More options">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
