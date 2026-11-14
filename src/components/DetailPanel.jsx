import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Play,
  Droplet,
  Sun,
  Mountain,
  Wind,
  ArrowUpRight,
  MoreHorizontal,
  MapPinOff,
  MinusCircle,
  CheckCircle2,
  Activity,
  Camera,
  ExternalLink,
  Route,
  Navigation,
  Footprints,
  Truck,
  Compass
} from 'lucide-react';
import NasaImageGalleryModal from './NasaImageGalleryModal';
import { getFallbackLandscape, getFallbackSatellite } from '../services/nasaPlaceService';
import { MARS_LOCATIONS, getLocationById, parseLatLng } from '../data/marsLocations';

function getMarsTraverseDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 3389.5; // Mars mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  // 1.18x factor for NASA MOLA topographic low-slope contour routing
  return Math.round(R * c * 1.18);
}

function formatTraverseTime(hours, hoursPerSol) {
  if (hours < 1) {
    return `${Math.max(1, Math.round(hours * 60))} min`;
  }
  if (hours <= 24) {
    const sols = (hours / hoursPerSol).toFixed(1);
    return `${hours.toFixed(1)} hrs (${sols} Sols)`;
  }
  const sols = (hours / hoursPerSol).toFixed(1);
  return `${sols} Sols (${Math.round(hours)} hrs)`;
}

export default function DetailPanel({
  locationData,
  activeMission,
  routeObjectives = [],
  onPlayVideo,
  onAddToRoute,
  onRemoveFromRoute,
  isAddedToRoute,
  onUnmark
}) {
  const [activeTab, setActiveTab] = useState('Overview');
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isReachedConfirming, setIsReachedConfirming] = useState(false);
  const reachedTimerRef = useRef(null);
  const moreMenuRef = useRef(null);

  useEffect(() => {
    setIsReachedConfirming(false);
    if (reachedTimerRef.current) {
      clearTimeout(reachedTimerRef.current);
    }
  }, [locationData?.id]);

  useEffect(() => {
    return () => {
      if (reachedTimerRef.current) {
        clearTimeout(reachedTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
        setIsMoreMenuOpen(false);
      }
    };
    if (isMoreMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isMoreMenuOpen]);

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

  // Base site coordinates (Chryse Planitia)
  const [bLat, bLng] = parseLatLng(
    MARS_LOCATIONS.proposed_base.coords.lat,
    MARS_LOCATIONS.proposed_base.coords.lng
  );

  // Build the complete list of ordered waypoints along the active path
  const allPathPoints = useMemo(() => {
    const points = [{ ...MARS_LOCATIONS.proposed_base, lat: bLat, lng: bLng }];

    // Add primary mission objective if mission is active
    if (activeMission) {
      const objLoc = getLocationById(activeMission.targetLocationId || activeMission.id) || MARS_LOCATIONS.gale;
      if (objLoc?.coords) {
        const [oLat, oLng] = parseLatLng(objLoc.coords.lat, objLoc.coords.lng);
        points.push({ ...objLoc, lat: oLat, lng: oLng });
      }
    }

    // Add dynamically added secondary route objectives
    (routeObjectives || []).forEach((obj) => {
      let lat = obj.lat;
      let lng = obj.lng;
      if (typeof lat !== 'number' || typeof lng !== 'number') {
        if (obj.coords) {
          [lat, lng] = parseLatLng(obj.coords.lat, obj.coords.lng);
        }
      }
      if (typeof lat === 'number' && typeof lng === 'number') {
        if (!points.some((p) => p.id === obj.id)) {
          points.push({ ...obj, lat, lng });
        }
      }
    });

    return points;
  }, [activeMission, routeObjectives, bLat, bLng]);

  // Is there any active path currently?
  // Is this specific place part of the active path?
  const isInPath = isAddedToRoute || allPathPoints.some((p) => p.id === activeLoc.id);

  // Compute total expedition distance across all stages
  const totalExpeditionKm = useMemo(() => {
    if (allPathPoints.length >= 2) {
      let dist = 0;
      for (let i = 0; i < allPathPoints.length - 1; i++) {
        dist += getMarsTraverseDistanceKm(
          allPathPoints[i].lat,
          allPathPoints[i].lng,
          allPathPoints[i + 1].lat,
          allPathPoints[i + 1].lng
        );
      }
      return dist;
    }
    return 0;
  }, [allPathPoints]);

  // Compute distance from start base to active location along the path
  const { distFromBaseKm, walkTimeStr, roverTimeStr } = useMemo(() => {
    let targetLat = bLat;
    let targetLng = bLng;
    if (activeLoc.coords) {
      [targetLat, targetLng] = parseLatLng(activeLoc.coords.lat, activeLoc.coords.lng);
    }

    // Distance directly from Chryse Planitia Base to this active marker
    const distDirectKm = (activeLoc.id === 'proposed_base')
      ? 0
      : getMarsTraverseDistanceKm(bLat, bLng, targetLat, targetLng);

    // If active location is in the path, calculate cumulative path distance to it
    const activeIdx = allPathPoints.findIndex((p) => p.id === activeLoc.id);
    let distKm = distDirectKm;
    if (activeIdx > 0) {
      distKm = 0;
      for (let i = 0; i < activeIdx; i++) {
        distKm += getMarsTraverseDistanceKm(
          allPathPoints[i].lat,
          allPathPoints[i].lng,
          allPathPoints[i + 1].lat,
          allPathPoints[i + 1].lng
        );
      }
    }

    if (distKm === 0) {
      return {
        distFromBaseKm: 0,
        walkTimeStr: '0 hrs (Habitat Outpost)',
        roverTimeStr: '0 hrs (Habitat Outpost)'
      };
    }

    // Astronaut EVA Walk: 3.8 km/h, 8h/Sol limit
    const walkHours = distKm / 3.8;
    const walkStr = formatTraverseTime(walkHours, 8);

    // Pressurized Rover: 14 km/h, 10h/Sol limit
    const roverHours = distKm / 14;
    const roverStr = formatTraverseTime(roverHours, 10);

    return {
      distFromBaseKm: distKm,
      walkTimeStr: walkStr,
      roverTimeStr: roverStr
    };
  }, [activeLoc, allPathPoints, bLat, bLng]);

  // Dynamic values for Tile 1 (Total Distance & Context)
  const { displayTotalKm, displayTotalDesc } = useMemo(() => {
    if (allPathPoints.length >= 2 && isInPath) {
      return {
        displayTotalKm: totalExpeditionKm,
        displayTotalDesc: `${allPathPoints.length - 1} waypoint stages`
      };
    }
    if (allPathPoints.length >= 2 && !isInPath) {
      return {
        displayTotalKm: totalExpeditionKm + distFromBaseKm,
        displayTotalDesc: 'With this place added'
      };
    }
    return {
      displayTotalKm: distFromBaseKm,
      displayTotalDesc: distFromBaseKm === 0 ? 'Habitat Outpost' : `Direct safe corridor`
    };
  }, [allPathPoints, isInPath, totalExpeditionKm, distFromBaseKm, activeLoc.name]);

  const tabs = ['Overview', 'Terrain', 'Resources', 'Hazards'];

  return (
    <div className="detail-panel-container">
      {/* Top Preview Card */}
      <div
        className="preview-media-card"
        onClick={() => setIsGalleryOpen(true)}
        title="Click to view all official NASA photos & observations"
      >
        <img
          src={activeLoc.landscapeImg || getFallbackLandscape(activeLoc.id)}
          alt={activeLoc.name}
          className="preview-media-img"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = activeLoc.landscapeImgFallback || getFallbackLandscape(activeLoc.id);
          }}
        />
        <div className="preview-gradient-scrim" />

        {/* Official NASA Photo Gallery Badge */}
        <div
          className="preview-nasa-photos-pill"
          onClick={(e) => {
            e.stopPropagation();
            setIsGalleryOpen(true);
          }}
          title="Browse all official NASA photos of this place"
        >
          <Camera size={12} />
          <span>Official NASA Photos</span>
        </div>

        <div className="preview-text-content">
          <h2 className="preview-title">{activeLoc.name}</h2>
          <p className="preview-subtitle">
            {activeMission?.targetLocationId === activeLoc.id
              ? activeMission.objective
              : (activeLoc.subtitle || 'A potential location for future exploration and research.')}
          </p>
        </div>

        <button
          className="preview-play-btn"
          aria-label="Play location simulation"
          title="Simulate AR HUD View"
          onClick={(e) => {
            e.stopPropagation();
            if (onPlayVideo) onPlayVideo();
          }}
        >
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
              <div
                className="satellite-thumb-wrap"
                onClick={() => setIsGalleryOpen(true)}
                style={{ cursor: 'pointer' }}
                title="Click to view official NASA satellite imagery"
              >
                <img
                  src={activeLoc.satelliteImg || getFallbackSatellite(activeLoc.id)}
                  alt="Satellite Crater Reconnaissance"
                  className="crater-recon-img"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = activeLoc.satelliteImgFallback || getFallbackSatellite(activeLoc.id);
                  }}
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

            {/* Expedition Traverse Distance & Travel Time (Dynamically updates for clicked marker) */}
            <div className="key-insights-section expedition-traverse-metrics">
              <h4 className="insights-header-title">Expedition Traverse & Travel Time</h4>
              <div className="insights-quad-grid">
                <div className="insight-tile">
                  <div className="insight-icon-circle">
                    <Route size={16} strokeWidth={1.8} style={{ color: '#FF7043' }} />
                  </div>
                  <div className="insight-text-group">
                    <span className="insight-title">{displayTotalKm.toLocaleString()} km Total</span>
                    <span className="insight-description">{displayTotalDesc}</span>
                  </div>
                </div>

                <div className="insight-tile">
                  <div className="insight-icon-circle">
                    <Navigation size={16} strokeWidth={1.8} style={{ color: '#00E5FF' }} />
                  </div>
                  <div className="insight-text-group">
                    <span className="insight-title">{distFromBaseKm.toLocaleString()} km</span>
                    <span className="insight-description">From Chryse Base Alpha</span>
                  </div>
                </div>

                <div className="insight-tile">
                  <div className="insight-icon-circle">
                    <Footprints size={16} strokeWidth={1.8} style={{ color: '#FFB74D' }} />
                  </div>
                  <div className="insight-text-group">
                    <span className="insight-title">{walkTimeStr}</span>
                    <span className="insight-description">Astronaut Walk (3.8 km/h)</span>
                  </div>
                </div>

                <div className="insight-tile">
                  <div className="insight-icon-circle">
                    <Truck size={16} strokeWidth={1.8} style={{ color: '#10B981' }} />
                  </div>
                  <div className="insight-text-group">
                    <span className="insight-title">{roverTimeStr}</span>
                    <span className="insight-description">Pressurized Rover (14 km/h)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Insights Section */}
            <div className="key-insights-section">
              <h4 className="insights-header-title">Key Insights</h4>

              <div className="insights-quad-grid">
                {activeLoc.insights?.map((item, idx) => {
                  const Icon = typeof item.icon === 'function' ? item.icon : Activity;
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

            {/* Official NASA Gallery Quick Trigger Bar */}
            <div
              className="official-photos-trigger-card"
              onClick={() => setIsGalleryOpen(true)}
              title="View all official NASA, Mars Trek, and USGS photos for this site"
            >
              <div className="opt-left">
                <Camera size={14} style={{ color: '#FF5E3A' }} />
                <span>NASA / USGS Place Imagery</span>
              </div>
              <div className="opt-right">
                <span>{activeLoc.officialImages?.length ? `${activeLoc.officialImages.length} Official Photos` : 'Browse Gallery'}</span>
                <ArrowUpRight size={13} />
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
            className={`add-to-route-btn ${
              isReachedConfirming
                ? 'place-reached-green'
                : isInPath
                ? 'mark-reached-black'
                : ''
            }`}
            onClick={() => {
              if (isReachedConfirming) return;

              if (isInPath) {
                // 1. Immediately turn green and show "Place Reached"
                setIsReachedConfirming(true);

                // 2. Then after 900ms, remove the path and revert button back to "Add to Route"
                reachedTimerRef.current = setTimeout(() => {
                  if (onRemoveFromRoute) {
                    onRemoveFromRoute(activeLoc);
                  } else if (onAddToRoute) {
                    onAddToRoute();
                  }
                  setIsReachedConfirming(false);
                }, 900);
              } else {
                onAddToRoute();
              }
            }}
            title={
              isReachedConfirming
                ? 'Place reached - completing segment'
                : isInPath
                ? 'Mark Reached - Click to complete place'
                : 'Add to expedition route'
            }
          >
            {isReachedConfirming ? (
              <>
                <CheckCircle2 size={16} />
                <span>Place Reached</span>
              </>
            ) : isInPath ? (
              <>
                <CheckCircle2 size={16} />
                <span>Mark Reached</span>
              </>
            ) : (
              <>
                <ArrowUpRight size={17} />
                <span>Add to Route</span>
              </>
            )}
          </button>

          <div className="more-options-container" ref={moreMenuRef}>
            <button
              className={`more-options-btn ${isMoreMenuOpen ? 'active' : ''}`}
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              aria-label="More options"
              title="More options"
            >
              <MoreHorizontal size={18} />
            </button>

            {isMoreMenuOpen && (
              <div className="more-options-dropdown animate-fade-in">
                {isInPath && (
                  <button
                    className="more-dropdown-item remove-route-item"
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      if (onRemoveFromRoute) {
                        onRemoveFromRoute(activeLoc);
                      }
                    }}
                    title="Remove from Route"
                  >
                    <MinusCircle size={15} className="remove-route-icon text-warning" />
                    <div className="unmark-item-text">
                      <span className="unmark-title">Remove from Route</span>
                      <span className="unmark-desc">Exclude from mission traverse</span>
                    </div>
                  </button>
                )}

                <button
                  className="more-dropdown-item unmark-item"
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    if (onUnmark) onUnmark(activeLoc);
                  }}
                  title="Unmark location & remove path"
                >
                  <MapPinOff size={15} className="unmark-icon" />
                  <div className="unmark-item-text">
                    <span className="unmark-title">Unmark Location</span>
                    <span className="unmark-desc">Clear marker & remove path</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Official NASA & USGS Image Gallery Lightbox Modal */}
      <NasaImageGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        location={activeLoc}
      />
    </div>
  );
}
