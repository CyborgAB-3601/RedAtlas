import React, { useState, useEffect } from 'react';
import MarsAreaBoundingBoxSelector, { NASA_PRESET_REGIONS } from './MarsAreaBoundingBoxSelector';
import MarsGaussianTerrainCanvas from './MarsGaussianTerrainCanvas';
import {
  Crop,
  Sparkles,
  MapPin
} from 'lucide-react';

function parseLatLng(latStr, lngStr) {
  if (!latStr || !lngStr) return [0, 0];
  const latVal = parseFloat(latStr) * (latStr.includes('S') ? -1 : 1);
  const lngVal = parseFloat(lngStr) * (lngStr.includes('W') ? -1 : 1);
  return [isNaN(latVal) ? 0 : latVal, isNaN(lngVal) ? 0 : lngVal];
}

export function findPresetForLocation(loc) {
  if (!loc) return NASA_PRESET_REGIONS[0];
  const locId = (loc.id || '').toLowerCase();
  const locName = (loc.name || '').toLowerCase();

  const found = NASA_PRESET_REGIONS.find((p) => {
    const pId = p.id.toLowerCase();
    const pName = p.name.toLowerCase();
    return (
      pId === locId ||
      locId.startsWith(pId.split('_')[0]) ||
      pId.startsWith(locId.split('_')[0]) ||
      (locName && pName.includes(locName)) ||
      (locName && locName.includes(pName)) ||
      (p.feature && locName.includes(p.feature.toLowerCase()))
    );
  });

  if (found) return found;

  if (loc.coords) {
    const [latVal, lngVal] = parseLatLng(loc.coords.lat, loc.coords.lng);
    return {
      id: loc.id || 'custom_' + Date.now(),
      name: loc.name || 'Exploration Site',
      desc: loc.subtitle || loc.desc || 'Exploration Site',
      latMin: latVal - 2.5,
      latMax: latVal + 2.5,
      lngMin: lngVal - 3.0,
      lngMax: lngVal + 3.0,
      icon: '📍',
      feature: loc.name || 'Exploration Site'
    };
  }

  return NASA_PRESET_REGIONS[0];
}

export default function TerrainView({
  selectedLocation,
  onOpenHUD,
  isExpanded = false,
  onToggleExpand
}) {
  // Default to 3D Gaussian Splat view directly so user doesn't see a static map first
  const [activeTab, setActiveTab] = useState('3d');
  
  // Active Bounding Box state - immediately initialized to user's selected location
  const [selectedBoundingBox, setSelectedBoundingBox] = useState(() => {
    return findPresetForLocation(selectedLocation);
  });

  const [contourInterval, setContourInterval] = useState('50m');
  const [showSlopeHazards, setShowSlopeHazards] = useState(true);

  // Automatically synchronize with selectedLocation whenever user picks a location in search or map
  useEffect(() => {
    if (!selectedLocation) return;
    const targetBox = findPresetForLocation(selectedLocation);
    if (targetBox) {
      setSelectedBoundingBox(targetBox);
    }
  }, [selectedLocation?.id, selectedLocation?.name, selectedLocation?.coords?.lat, selectedLocation?.coords?.lng]);

  // When user clicks "Generate 3D Gaussian Splat" from the map selector
  const handleGenerateGaussianSplat = (box) => {
    setSelectedBoundingBox(box);
    setActiveTab('3d');
  };

  return (
    <div className={`terrain-main-pipeline-view animate-fade-in ${isExpanded ? 'pipeline-expanded' : ''}`}>
      {/* Top Pipeline Navigation Bar (hidden in fullscreen) */}
      {!isExpanded && (
        <div className="terrain-pipeline-tabs-header">
          <div className="pipeline-tab-group">
            <button
              className={`pipeline-tab-btn ${activeTab === '3d' ? 'active' : ''}`}
              onClick={() => setActiveTab('3d')}
            >
              <Sparkles size={14} />
              <span>3D Gaussian Splat Engine</span>
            </button>

            <button
              className={`pipeline-tab-btn ${activeTab === 'map' ? 'active' : ''}`}
              onClick={() => setActiveTab('map')}
            >
              <Crop size={14} />
              <span>Draw / Select Area on Satellite Map</span>
            </button>
          </div>

          <div className="pipeline-current-area-chip">
            <span className="chip-label">TARGET:</span>
            <span className="chip-name">{selectedBoundingBox?.name || 'Mars Reconnaissance'}</span>
          </div>
        </div>
      )}

      {/* Dynamic Content: 3D Gaussian Splat vs Satellite Bounding Box Selector */}
      {activeTab === '3d' || isExpanded ? (
        <MarsGaussianTerrainCanvas
          selectedBoundingBox={selectedBoundingBox}
          contourStep={contourInterval}
          showSlopeHazards={showSlopeHazards}
          onOpenHUD={onOpenHUD}
          onBackToMap={() => {
            if (isExpanded && onToggleExpand) {
              onToggleExpand(false);
            }
            setActiveTab('map');
          }}
          isExpanded={isExpanded}
          onToggleExpand={onToggleExpand}
        />
      ) : (
        <MarsAreaBoundingBoxSelector
          activeBoundingBox={selectedBoundingBox}
          onSelectBoundingBox={(box) => setSelectedBoundingBox(box)}
          onGenerateGaussianSplat={handleGenerateGaussianSplat}
        />
      )}
    </div>
  );
}
