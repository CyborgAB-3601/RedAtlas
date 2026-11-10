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
            {activeLoc.subtitle || 'A potential location for future exploration and research.'}
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
                The rim slope is approximately 14° with loose regolith and basaltic basaltic scree. Center floor is dominated by fine sand dunes with a thickness of 0.4 - 1.2 meters.
              </p>
              <div className="terrain-metrics-list">
                <div className="metric-row">
                  <span>Surface Roughness</span>
                  <strong>0.18 (Smooth)</strong>
                </div>
                <div className="metric-row">
                  <span>Slope Variance</span>
                  <strong>&lt; 3.2 degrees</strong>
                </div>
                <div className="metric-row">
                  <span>Bedrock Stability</span>
                  <strong>High (Compact Basalt)</strong>
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
                Gamma ray spectrometer indicates high hydrogen concentration, pointing to rich buried water ice deposits within 1.5m depth.
              </p>
              <div className="terrain-metrics-list">
                <div className="metric-row">
                  <span>Water Ice Est.</span>
                  <strong>14.2% by volume</strong>
                </div>
                <div className="metric-row">
                  <span>Silicon Oxides</span>
                  <strong>44.8%</strong>
                </div>
                <div className="metric-row">
                  <span>Iron Oxides</span>
                  <strong>18.4%</strong>
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
                Radiation levels measured at 240 µSv/day under direct exposure. Crater ridge provides 34% shielding against cosmic radiation.
              </p>
              <div className="terrain-metrics-list">
                <div className="metric-row">
                  <span>Thermal Swings</span>
                  <strong>-88°C to -12°C</strong>
                </div>
                <div className="metric-row">
                  <span>Dust Storm Risk</span>
                  <strong>Low (Sheltered Basin)</strong>
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
