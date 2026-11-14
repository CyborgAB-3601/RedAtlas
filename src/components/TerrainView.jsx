import React, { useState } from 'react';
import MarsAreaBoundingBoxSelector, { NASA_PRESET_REGIONS } from './MarsAreaBoundingBoxSelector';
import MarsGaussianTerrainCanvas from './MarsGaussianTerrainCanvas';
import {
  Map,
  Sparkles,
  Layers,
  Crop,
  Sliders,
  Maximize2
} from 'lucide-react';

export default function TerrainView({ selectedLocation, onOpenHUD }) {
  // Tab view: 'map' (draw/select area) or '3d' (explore 3D Gaussian splat)
  const [activeTab, setActiveTab] = useState('map');
  const [selectedBoundingBox, setSelectedBoundingBox] = useState(() => {
    // If selectedLocation matches an iconic region, pre-select it
    if (selectedLocation?.id && NASA_PRESET_REGIONS.find((p) => p.id === selectedLocation.id)) {
      return NASA_PRESET_REGIONS.find((p) => p.id === selectedLocation.id);
    }
    return NASA_PRESET_REGIONS[0]; // Default: Olympus Mons
  });

  const [contourInterval, setContourInterval] = useState('50m');
  const [showSlopeHazards, setShowSlopeHazards] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  // When user clicks "Generate 3D Gaussian Splat" from the map selector
  const handleGenerateGaussianSplat = (box) => {
    setSelectedBoundingBox(box);
    setActiveTab('3d');
  };

  return (
    <div className="terrain-main-pipeline-view animate-fade-in">
      {/* Top Pipeline Navigation Bar */}
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

        {/* Quick Area Indicator Chip */}
        <div className="pipeline-current-area-chip">
          <span className="chip-label">TARGET:</span>
          <span className="chip-name">{selectedBoundingBox?.name || 'Mars Reconnaissance'}</span>
        </div>
      </div>

      {/* Dynamic Content: Satellite Bounding Box Selector vs 3D Gaussian Splat */}
      {activeTab === 'map' ? (
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
          onBackToMap={() => setActiveTab('map')}
          isExpanded={isExpanded}
          onToggleExpand={setIsExpanded}
        />
      )}
    </div>
  );
}
