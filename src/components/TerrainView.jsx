import React, { useState } from 'react';
import MarsGaussianTerrainCanvas from './MarsGaussianTerrainCanvas';
import {
  Mountain,
  Layers,
  Radio,
  Compass,
  AlertTriangle,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

export default function TerrainView({ selectedLocation, onOpenHUD }) {
  const [contourInterval, setContourInterval] = useState('50m');
  const [showSlopeHazards, setShowSlopeHazards] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  const loc = selectedLocation || {
    id: 'proposed_base',
    name: 'Proposed Base Site',
    coordsText: '14.6° N, 32.3° E',
    elevationVal: '-2,450 m',
    elevationNum: -2450
  };

  return (
    <MarsGaussianTerrainCanvas
      selectedLocation={loc}
      contourStep={contourInterval}
      showSlopeHazards={showSlopeHazards}
      onOpenHUD={onOpenHUD}
      isExpanded={isExpanded}
      onToggleExpand={setIsExpanded}
    />
  );
}
