import React, { useState } from 'react';
import { Bookmark, ArrowRight, Mountain, Disc, Sun, Check } from 'lucide-react';
import { hudAudio } from '../services/audioService';

/**
 * LocationInfoPanel — Matches the Bottom-Left Region of the reference image:
 * - Frosted translucent glass card with warm peach/terracotta gradient wash along the bottom edge.
 * - Top-left: Square rounded thumbnail image of Mars landscape.
 * - Top-right: Bookmark button, bold title, coordinates, description, black `Set as Destination →` pill.
 * - Bottom row: 3 white frosted pill capsules:
 *   1. [ ⛰ -2,450 m | Elevation ]
 *   2. [ ◎ Basaltic Regolith | Rock Type ]
 *   3. [ ☼ High (5.8 kWh/m²) | Solar Exposure ]
 * - Interactive: Clicking destination, bookmark, or thumbnail works seamlessly!
 */
export default function LocationInfoPanel({
  selectedLocation,
  activeDestination,
  onSetDestination,
  onSaveWaypoint,
  onStartMeasure,
  onOpenDetails,
  onNotify
}) {
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Fallback location if none selected
  const location = selectedLocation || {
    id: 'proposed_base',
    name: 'Proposed Base Site',
    coordsText: '14.6° N, 32.3° E',
    description: 'Selected for the favorable flat terrain, shallow subsurface ice sheets confirmed by SHARAD...',
    image: '/assets/mars_base_site.jpg',
    elevationVal: '-2,450 m',
    rockType: 'Basaltic Regolith',
    solarVal: 'High (5.8 kWh/m²)'
  };

  const isCurrentDestination = activeDestination?.id === location.id;

  const handleDestinationClick = (e) => {
    e.stopPropagation();
    hudAudio.playDestinationSet();
    onSetDestination(location);
    if (onNotify) onNotify(`Destination Locked: ${location.name}`, 'success');
  };

  const handleBookmarkClick = (e) => {
    e.stopPropagation();
    const nextState = !isBookmarked;
    setIsBookmarked(nextState);
    if (nextState) {
      hudAudio.playWaypointPlaced();
      onSaveWaypoint(location);
      if (onNotify) onNotify(`Saved to Mission Waypoints: ${location.name}`, 'info');
    } else {
      hudAudio.playSelect();
      if (onNotify) onNotify(`Removed Bookmark: ${location.name}`, 'info');
    }
  };

  return (
    <div
      className="hud-location-card-container"
      onClick={() => onOpenDetails && onOpenDetails(location)}
      title="Click to view full geological reconnaissance dossier"
    >
      <div className="location-glass-card">
        {/* Top Section */}
        <div className="location-card-top-row">
          {/* Square Thumbnail with Rounded Corners */}
          <div className="location-thumb-box">
            <img
              src={location.image || '/assets/mars_base_site.jpg'}
              alt={location.name}
              className="location-thumb-img"
              onError={(e) => {
                e.target.src = '/assets/crater_satellite_thumb.jpg';
              }}
            />
          </div>

          {/* Details & Action Column */}
          <div className="location-info-content">
            {/* Title & Bookmark Row */}
            <div className="location-title-row">
              <h2 className="location-card-title">{location.name}</h2>
              <button
                className={`location-bookmark-btn ${isBookmarked ? 'active' : ''}`}
                onClick={handleBookmarkClick}
                title={isBookmarked ? 'Bookmarked' : 'Bookmark Location'}
              >
                <Bookmark
                  size={15}
                  className="bookmark-icon"
                  fill={isBookmarked ? '#111111' : 'none'}
                  stroke="#111111"
                  strokeWidth={2}
                />
              </button>
            </div>

            {/* Coordinates */}
            <div className="location-coords-line">
              {location.coordsText || '14.6° N, 32.3° E'}
            </div>

            {/* Description Snippet */}
            <p className="location-desc-snippet">
              {location.description ||
                'Selected for the favorable flat terrain, shallow subsurface ice sheets confirmed by SHARAD...'}
            </p>

            {/* Black Pill Button: Set as Destination → */}
            <button
              className={`location-destination-pill ${isCurrentDestination ? 'destination-locked' : ''}`}
              onClick={handleDestinationClick}
              title="Set as active navigation destination"
            >
              <span>{isCurrentDestination ? 'Destination Locked' : 'Set as Destination'}</span>
              {isCurrentDestination ? <Check size={13} /> : <ArrowRight size={13} />}
            </button>
          </div>
        </div>

        {/* Bottom Section: 3 White Frosted Capsules */}
        <div className="location-capsules-row">
          {/* 1. Elevation Badge */}
          <div className="location-spec-capsule">
            <div className="capsule-val-row">
              <Mountain size={13} className="capsule-icon" />
              <span className="capsule-val">{location.elevationVal || '-2,450 m'}</span>
            </div>
            <span className="capsule-lbl">Elevation</span>
          </div>

          {/* 2. Rock Type Badge */}
          <div className="location-spec-capsule">
            <div className="capsule-val-row">
              <Disc size={13} className="capsule-icon" />
              <span className="capsule-val">{location.rockType || 'Basaltic Regolith'}</span>
            </div>
            <span className="capsule-lbl">Rock Type</span>
          </div>

          {/* 3. Solar Exposure Badge */}
          <div className="location-spec-capsule">
            <div className="capsule-val-row">
              <Sun size={13} className="capsule-icon" />
              <span className="capsule-val">{location.solarVal || 'High (5.8 kWh/m²)'}</span>
            </div>
            <span className="capsule-lbl">Solar Exposure</span>
          </div>
        </div>
      </div>
    </div>
  );
}
