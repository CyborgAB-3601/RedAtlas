import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  Compass,
  Radio,
  Activity,
  ShieldCheck,
  Target,
  Wind,
  Maximize2,
  Volume2,
  VolumeX,
  Eye,
  Sparkles,
  AlertTriangle
} from 'lucide-react';

export default function SimulationModal({ isOpen, onClose, location }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [targetLocked, setTargetLocked] = useState(true);
  const [hudPitch, setHudPitch] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setHudPitch((prev) => (prev > 5 ? -5 : prev + 0.5));
    }, 400);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const loc = location || {
    name: 'Gale Crater (Mount Sharp)',
    coordsText: '5.4° S, 137.8° E',
    elevationVal: '-4,500 m',
    landscapeImg: '/assets/gale_crater.jpg'
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="simulation-modal-card animate-scale-up" onClick={(e) => e.stopPropagation()}>
        <div className="simulation-media-wrap">
          <img
            src={loc.landscapeImg || '/assets/mars_expanded_terrain.jpg'}
            alt="Simulation Feed"
            className="simulation-backdrop-img"
          />

          {/* Spacesuit Helmet Visor Curved Edge & Grid */}
          <div className="visor-helmet-glass-overlay">
            {/* Top Visor Status Bar */}
            <div className="visor-top-bar">
              <div className="visor-badge-group">
                <span className="visor-live-blip animate-pulse" />
                <span className="visor-hud-title">SPACESUIT AR HELMET VISOR HUD • EVA-1 DIRECT FEED</span>
              </div>

              {/* 360° Compass Tape */}
              <div className="visor-compass-tape">
                <Compass size={14} className="text-accent" />
                <span className="compass-bearing">HDG 048° NE</span>
                <span className="compass-target-lead">➔ TARGET: BOXWORK RIDGE ALPHA (340 M)</span>
              </div>

              <button className="visor-close-btn" onClick={onClose} aria-label="Exit Visor HUD">
                <X size={18} />
              </button>
            </div>

            {/* Synthetic Horizon & Artificial Pitch Ladder */}
            <div className="visor-pitch-ladder-center">
              <div
                className="pitch-ladder-lines"
                style={{ transform: `translateY(${hudPitch * 2}px)` }}
              >
                <div className="pitch-line p-pos"><span>+10</span><div className="bar" /><span>+10</span></div>
                <div className="pitch-line p-zero"><div className="bar-center" /></div>
                <div className="pitch-line p-neg"><span>-10</span><div className="bar" /><span>-10</span></div>
              </div>

              {/* Augmented Reality Target Lock Reticle */}
              <div className={`ar-target-reticle ${targetLocked ? 'locked' : ''}`}>
                <div className="reticle-corner top-left" />
                <div className="reticle-corner top-right" />
                <div className="reticle-corner bottom-left" />
                <div className="reticle-corner bottom-right" />
                <Target size={22} className="reticle-center-crosshair" />

                <div className="reticle-floating-tag">
                  <span className="tag-mineral">HYDROTHERMAL BOXWORK VEIN</span>
                  <span className="tag-confidence">LIBS CONFIDENCE: 94.2%</span>
                  <span className="tag-comp">CaSO₄ • MgSO₄ • Hydrated Gypsum</span>
                </div>
              </div>
            </div>

            {/* In-Visor Telemetry Corners */}
            <div className="visor-hud-bottom">
              {/* Left Life Support Box */}
              <div className="visor-telemetry-cluster left">
                <div className="telemetry-row">
                  <Activity size={15} className="text-success" />
                  <span className="t-label">SUIT PRESSURE:</span>
                  <span className="t-val">29.6 kPa (100% O₂)</span>
                </div>
                <div className="telemetry-row">
                  <Wind size={15} className="text-info" />
                  <span className="t-label">O₂ FLOW RATE:</span>
                  <span className="t-val">0.34 L/min (Nominal)</span>
                </div>
                <div className="telemetry-row">
                  <ShieldCheck size={15} className="text-accent" />
                  <span className="t-label">RAD DOSE RATE:</span>
                  <span className="t-val">0.19 mSv/hr</span>
                </div>
              </div>

              {/* Center Location & Sol info */}
              <div className="visor-center-nav-cluster">
                <span className="visor-loc-name">{loc.name}</span>
                <span className="visor-loc-coords">{loc.coordsText} • ELEV: {loc.elevationVal}</span>
                <span className="visor-walkback-ok">POINT OF SAFE RETURN: 1.8 KM REMAINING</span>
              </div>

              {/* Right Suit Controls & Audio */}
              <div className="visor-telemetry-cluster right">
                <div className="telemetry-row">
                  <span className="t-label">HEART RATE:</span>
                  <span className="t-val text-success">84 BPM</span>
                </div>
                <div className="telemetry-row">
                  <span className="t-label">CORE TEMP:</span>
                  <span className="t-val">36.8°C</span>
                </div>
                <div className="visor-controls-row">
                  <button
                    className="visor-action-pill"
                    onClick={() => setIsMuted(!isMuted)}
                  >
                    {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                    <span>{isMuted ? 'Muted' : 'Comm Net 1'}</span>
                  </button>

                  <button
                    className="visor-action-pill"
                    onClick={() => setTargetLocked(!targetLocked)}
                  >
                    <Target size={14} />
                    <span>{targetLocked ? 'Target Locked' : 'Free Scan'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
