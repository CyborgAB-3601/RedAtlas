import React from 'react';
import {
  X,
  Sliders,
  Compass,
  Camera,
  Sun,
  Eye,
  Volume2,
  VolumeX,
  RotateCcw,
  Palette,
  Maximize2,
  Settings,
  ArrowLeft
} from 'lucide-react';
import { hudAudio } from '../services/audioService';

export default function CalibrationModal({
  isOpen,
  onClose,
  hudOpacity,
  onChangeOpacity,
  uiScale,
  onChangeUiScale,
  colorTheme,
  onChangeColorTheme,
  filterMode,
  onChangeFilterMode,
  isAudioMuted,
  onToggleAudio,
  onRecenterHead,
  onToggleFullscreen,
  onOpenCameraSetup,
  activeDeviceName,
  cameraMode,
  onNotify,
  onExit
}) {
  if (!isOpen) return null;

  return (
    <div className="hud-modal-backdrop" onClick={onClose}>
      <div className="hud-modal-panel calibration-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <Sliders size={16} className="text-amber-400" />
            <h3 className="modal-title">HUD SYSTEM CALIBRATION & AVIONICS (FR-17)</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body-content">
          {/* Section 1: External Camera Selection & Hardware */}
          <div className="calib-section">
            <span className="calib-sec-title">PRIMARY CAMERA INPUT & HARDWARE</span>
            <div className="calib-row">
              <div className="calib-desc">
                <strong>Current Video Source:</strong>{' '}
                <span className="text-amber-400">
                  {cameraMode === 'webcam' ? (activeDeviceName || 'Selected External Camera') : 'Mars Surface Simulation (3D Canvas)'}
                </span>
                <p className="sub-text">Switch external USB headcam, HDMI capture device, or configure resolution and orientation.</p>
              </div>
              <button
                className="hud-action-btn btn-primary-dest"
                onClick={() => {
                  hudAudio.playSelect();
                  if (onOpenCameraSetup) onOpenCameraSetup();
                }}
              >
                <Camera size={13} />
                <span>CAMERA SETTINGS</span>
              </button>
            </div>
          </div>

          {/* Section 2: Head Tracking & Alignment */}
          <div className="calib-section">
            <span className="calib-sec-title">HEAD TRACKING & ORIENTATION</span>
            <div className="calib-row">
              <div className="calib-desc">
                <strong>Recenter View Direction:</strong> Calibrate azimuth and elevation to current physical head position (or press key 'C').
              </div>
              <button
                className="hud-action-btn btn-primary-dest"
                onClick={() => {
                  hudAudio.playSelect();
                  onRecenterHead();
                  if (onNotify) onNotify('Head Orientation Recentered to 000° [C]', 'info');
                }}
              >
                <RotateCcw size={13} />
                <span>RECENTER (KEY C)</span>
              </button>
            </div>
          </div>

          {/* Section 3: Visor Glass & HUD Opacity */}
          <div className="calib-section">
            <span className="calib-sec-title">HUD OPACITY & INTERFACE SCALING</span>
            <div className="slider-row">
              <label>HUD Glass Opacity: {Math.round(hudOpacity * 100)}%</label>
              <input
                type="range"
                min="0.3"
                max="1.0"
                step="0.05"
                value={hudOpacity}
                onChange={(e) => onChangeOpacity(parseFloat(e.target.value))}
                className="hud-range-slider"
              />
            </div>

            <div className="slider-row">
              <label>Interface Scaling: {Math.round(uiScale * 100)}%</label>
              <div className="scale-btn-group">
                {[0.85, 1.0, 1.15].map((scale) => (
                  <button
                    key={scale}
                    className={`scale-tab ${uiScale === scale ? 'active' : ''}`}
                    onClick={() => {
                      hudAudio.playSelect();
                      onChangeUiScale(scale);
                    }}
                  >
                    {Math.round(scale * 100)}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 4: Camera Filter Modes */}
          <div className="calib-section">
            <span className="calib-sec-title">CAMERA VISOR FILTER / NIGHT VISION</span>
            <div className="filter-options-grid">
              {[
                { id: 'normal', label: 'Standard RGB', desc: 'Direct camera sensor feed' },
                { id: 'amber_enhancer', label: 'Mars Contrast', desc: 'Regolith dust penetration' },
                { id: 'night_vision', label: 'Night-Vision HUD', desc: 'High-gain phosphor amplification' },
                { id: 'thermal', label: 'Thermal Infrared', desc: 'Subsurface thermal gradient' }
              ].map((flt) => (
                <button
                  key={flt.id}
                  className={`filter-btn ${filterMode === flt.id ? 'active' : ''}`}
                  onClick={() => {
                    hudAudio.playSelect();
                    onChangeFilterMode(flt.id);
                  }}
                >
                  <span className="filter-name">{flt.label}</span>
                  <span className="filter-sub">{flt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section 5: HUD Theme & Avionics Sound */}
          <div className="calib-section">
            <span className="calib-sec-title">HUD COLOR SCHEME & SOUND</span>
            <div className="theme-sound-row">
              <div className="theme-swatches">
                {[
                  { id: 'amber', name: 'Mars Amber', hex: '#f59e0b' },
                  { id: 'cyan', name: 'Orbital Cyan', hex: '#00f0ff' },
                  { id: 'emerald', name: 'Tactical Green', hex: '#10b981' }
                ].map((th) => (
                  <button
                    key={th.id}
                    className={`theme-badge ${colorTheme === th.id ? 'selected' : ''}`}
                    onClick={() => {
                      hudAudio.playSelect();
                      onChangeColorTheme(th.id);
                    }}
                  >
                    <span className="theme-dot" style={{ background: th.hex }} />
                    <span>{th.name}</span>
                  </button>
                ))}
              </div>

              <div className="sound-toggle-box">
                <button
                  className={`hud-action-btn ${isAudioMuted ? 'btn-secondary' : 'btn-active-dest'}`}
                  onClick={() => {
                    onToggleAudio();
                  }}
                >
                  {isAudioMuted ? (
                    <>
                      <VolumeX size={14} />
                      <span>AUDIO MUTED</span>
                    </>
                  ) : (
                    <>
                      <Volume2 size={14} />
                      <span>AVIONICS AUDIO ON</span>
                    </>
                  )}
                </button>

                <button
                  className="hud-action-btn btn-secondary"
                  onClick={() => {
                    hudAudio.playSelect();
                    onToggleFullscreen();
                  }}
                  title="Toggle Immersive Fullscreen Mode"
                >
                  <Maximize2 size={14} />
                  <span>FULLSCREEN [F]</span>
                </button>

                {onExit && (
                  <button
                    className="hud-action-btn btn-secondary"
                    onClick={() => {
                      hudAudio.playSelect();
                      onClose();
                      onExit();
                    }}
                    style={{ borderColor: 'rgba(239, 68, 68, 0.6)', color: '#fca5a5' }}
                    title="Return to RedAtlas Dashboard"
                  >
                    <ArrowLeft size={14} />
                    <span>RETURN TO ATLAS</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
