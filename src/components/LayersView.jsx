import React, { useState } from 'react';
import { NASA_DATA_LAYERS } from '../data/marsLocations';
import {
  Layers,
  Sliders,
  Check,
  Eye,
  EyeOff,
  Info,
  Radio,
  Sparkles,
  Mountain,
  Sun,
  Flame,
  ShieldAlert
} from 'lucide-react';

export default function LayersView({ selectedLocation }) {
  const [layersState, setLayersState] = useState(() =>
    NASA_DATA_LAYERS.map((l) => ({
      ...l,
      enabled: true,
      opacity: l.defaultOpacity
    }))
  );

  const [activeInspectorLayer, setActiveInspectorLayer] = useState(layersState[0]);

  const toggleLayer = (id) => {
    setLayersState((prev) =>
      prev.map((l) => (l.id === id ? { ...l, enabled: !l.enabled } : l))
    );
  };

  const updateOpacity = (id, newOp) => {
    setLayersState((prev) =>
      prev.map((l) => (l.id === id ? { ...l, opacity: Number(newOp) } : l))
    );
  };

  return (
    <div className="layers-view-container animate-fade-in">
      {/* Top Header */}
      <div className="view-header-strip">
        <div className="view-title-group">
          <div className="view-badge">
            <Layers size={13} className="text-accent" />
            <span>NASA SCIENCE MULTI-LAYER STACK</span>
          </div>
          <h2 className="view-heading">Integrated Planetary Science Data Layers</h2>
          <p className="view-subtext">
            Synthesized datasets from 5 NASA Mars missions layered together to guide human ground exploration.
          </p>
        </div>

        <div className="layer-count-badge">
          <span>{layersState.filter((l) => l.enabled).length} of {layersState.length} Layers Active</span>
        </div>
      </div>

      <div className="layers-main-layout">
        {/* Layer Stack Controls */}
        <div className="layers-controls-col">
          <div className="layer-cards-stack">
            {layersState.map((layer) => {
              const isSelected = activeInspectorLayer.id === layer.id;

              return (
                <div
                  key={layer.id}
                  className={`layer-control-card ${layer.enabled ? 'is-active' : 'is-disabled'} ${
                    isSelected ? 'is-inspecting' : ''
                  }`}
                  onClick={() => setActiveInspectorLayer(layer)}
                >
                  <div className="layer-card-left">
                    <button
                      className={`layer-toggle-btn ${layer.enabled ? 'checked' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLayer(layer.id);
                      }}
                      title={layer.enabled ? 'Hide Layer' : 'Show Layer'}
                    >
                      {layer.enabled ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>

                    <div className="layer-title-meta">
                      <div className="layer-name-row">
                        <span
                          className="layer-dot-indicator"
                          style={{ backgroundColor: layer.badgeColor }}
                        />
                        <h4 className="layer-name">{layer.name}</h4>
                        <span className="layer-type-chip">{layer.type}</span>
                      </div>
                      <span className="layer-mission-tag">Mission: {layer.mission}</span>
                    </div>
                  </div>

                  <div className="layer-card-right">
                    <div className="opacity-slider-wrap" onClick={(e) => e.stopPropagation()}>
                      <span className="opacity-val">{layer.opacity}%</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={layer.opacity}
                        disabled={!layer.enabled}
                        onChange={(e) => updateOpacity(layer.id, e.target.value)}
                        className="opacity-slider-input"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Layer Instrument Specs & Mission Metadata */}
        <div className="layer-inspector-col">
          <h3 className="section-subheading">NASA Instrument Telemetry</h3>

          <div className="layer-spec-card">
            <div className="spec-header-band" style={{ borderLeftColor: activeInspectorLayer.badgeColor }}>
              <span className="spec-band-mission">{activeInspectorLayer.mission}</span>
              <h3 className="spec-band-title">{activeInspectorLayer.name}</h3>
            </div>

            <p className="spec-desc-text">{activeInspectorLayer.description}</p>

            <div className="spec-attributes-grid">
              <div className="spec-attr-box">
                <span className="attr-label">SPATIAL RESOLUTION</span>
                <span className="attr-val">{activeInspectorLayer.resolution}</span>
              </div>
              <div className="spec-attr-box">
                <span className="attr-label">SPECTRAL BAND</span>
                <span className="attr-val">{activeInspectorLayer.spectralBand}</span>
              </div>
              <div className="spec-attr-box">
                <span className="attr-label">DATA TYPE</span>
                <span className="attr-val">{activeInspectorLayer.type}</span>
              </div>
              <div className="spec-attr-box">
                <span className="attr-label">MISSION STATUS</span>
                <span className="attr-val text-accent">Active Science Feed</span>
              </div>
            </div>

            <div className="astronaut-value-callout">
              <div className="callout-header">
                <Sparkles size={14} className="text-accent" />
                <span>WHY IT MATTERS TO AN ASTRONAUT</span>
              </div>
              <p className="callout-text">
                {activeInspectorLayer.type.includes('Topographic') &&
                  'Enables the suit computer to compute mechanical energy spend and dynamically plot a route that bypasses loose gravel and dangerous slopes over 15 degrees.'}
                {activeInspectorLayer.type.includes('Optical') &&
                  'Allows the crew to visually confirm meter-scale boulders, landing hazards, and surface texture before committing to a walking or rover traverse.'}
                {activeInspectorLayer.type.includes('Spectral') &&
                  'Instantly identifies where past water left hydrated clay and sulfate deposits, focusing the astronaut’s sample collection on the highest-value astrobiological rocks.'}
                {activeInspectorLayer.type.includes('Thermal') &&
                  'Alerts the crew to low thermal inertia zones (deep fine dust) where spacesuit boots or rover tires could sink and become entrapped.'}
                {activeInspectorLayer.type.includes('Radiation') &&
                  'Provides the cumulative Galactic Cosmic Ray dose rate and locates natural cliff walls or lava tubes where the crew can seek radiation shelter.'}
                {activeInspectorLayer.type.includes('Radar') &&
                  'Locates subsurface glacial ice shelves within 2 meters of the surface, crucial for in-situ life support water extraction.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

