import React, { useState } from 'react';
import MarsAreaBoundingBoxSelector, { NASA_PRESET_REGIONS } from './MarsAreaBoundingBoxSelector';
import MarsGaussianTerrainCanvas from './MarsGaussianTerrainCanvas';
import {
  Crop,
  Sparkles
} from 'lucide-react';

export default function TerrainView({
  selectedLocation,
  onOpenHUD,
  isExpanded = false,
  onToggleExpand
}) {
  const [activeTab, setActiveTab] = useState('map');
  const [selectedBoundingBox, setSelectedBoundingBox] = useState(() => {
    if (selectedLocation?.id && NASA_PRESET_REGIONS.find((p) => p.id === selectedLocation.id)) {
      return NASA_PRESET_REGIONS.find((p) => p.id === selectedLocation.id);
    }
    return NASA_PRESET_REGIONS[0]; // Default: Olympus Mons
  });

  const [contourInterval, setContourInterval] = useState('50m');
  const [showSlopeHazards, setShowSlopeHazards] = useState(true);

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
              className={`pipeline-tab-btn ${activeTab === 'map' ? 'active' : ''}`}
              onClick={() => setActiveTab('map')}
            >
              <Crop size={14} />
              <span>1. Select / Draw Area on Satellite Map</span>
            </button>

            <button
              className={`pipeline-tab-btn ${activeTab === '3d' ? 'active' : ''}`}
              onClick={() => setActiveTab('3d')}
            >
              <Sparkles size={14} />
              <span>2. 3D Gaussian Splat Engine</span>
            </button>
          </div>

          <div className="pipeline-current-area-chip">
            <span className="chip-label">TARGET:</span>
            <span className="chip-name">{selectedBoundingBox?.name || 'Mars Reconnaissance'}</span>
          </div>
        </div>
      )}

      {/* Dynamic Content */}
      {activeTab === 'map' && !isExpanded ? (
        <MarsAreaBoundingBoxSelector
          activeBoundingBox={selectedBoundingBox}
          onSelectBoundingBox={(box) => setSelectedBoundingBox(box)}
          onGenerateGaussianSplat={handleGenerateGaussianSplat}
        />
      ) : (
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
      )}
    </div>
  );
}
