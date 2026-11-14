import React, { useState } from 'react';
import {
  Hand,
  Sliders,
  CheckCircle2,
  X,
  Eye,
  Shield,
  HelpCircle,
  Sparkles,
  Zap,
  MousePointer,
  Compass,
  MapPin,
  ThumbsUp,
  Move,
  Maximize2,
  Terminal,
  Activity
} from 'lucide-react';
import { hudAudio } from '../services/audioService';

/**
 * GestureSettingsModal
 * Complete aerospace glassmorphic configuration and quick-reference guide
 * for the Mars EVA Astronaut Hand Gesture Control System.
 */
export default function GestureSettings({
  isOpen,
  onClose,
  isActive = false,
  onToggleActive,
  settings = {},
  onUpdateSettings,
  debugOverlayEnabled = false,
  onToggleDebugOverlay,
  onOpenDeviceSettings,
  onNotify,
  isPythonBackendConnected = false
}) {
  const [activeTab, setActiveTab] = useState('config'); // 'config' | 'gestures' | 'guide'

  if (!isOpen) return null;

  const currentSettings = {
    cursorSmoothing: settings.cursorSmoothing ?? 0.65,
    sensitivity: settings.sensitivity ?? 'medium',
    activationHoldMs: settings.activationHoldMs ?? 700,
    cancelHoldMs: settings.cancelHoldMs ?? 800,
    actionCooldownMs: settings.actionCooldownMs ?? 400,
    handPreference: settings.handPreference ?? 'Right',
    invertX: settings.invertX ?? false,
    enabledGestures: {
      openPalm: true,
      closedFist: true,
      point: true,
      pinchSelect: true,
      twoFingers: true,
      thumbsUp: true,
      swipe: true,
      mapZoom: true,
      mapPan: true,
      ...(settings.enabledGestures || {})
    }
  };

  const handleUpdate = (updates) => {
    onUpdateSettings({ ...currentSettings, ...updates });
  };

  const handleToggleGesture = (gestureKey) => {
    hudAudio.playSelect();
    const updated = {
      ...currentSettings.enabledGestures,
      [gestureKey]: !currentSettings.enabledGestures[gestureKey]
    };
    handleUpdate({ enabledGestures: updated });
    if (onNotify) {
      onNotify(`Gesture ${gestureKey}: ${updated[gestureKey] ? 'ENABLED' : 'DISABLED'}`, 'info');
    }
  };

  const gestureGuideList = [
    {
      name: 'Two Fists Closed Together',
      action: 'Open Full-Screen Tactical Map',
      rule: 'Hold both closed fists forward within camera frame to open full-screen map view',
      icon: Maximize2,
      key: 'twoFistsMap'
    },
    {
      name: 'Thumbs Up (Hold ~0.45s)',
      action: 'Close Any Window / Return to Camera Feed',
      rule: 'Hold thumb upright toward camera to close any open window, modal, drawer, or full-screen map and immediately return to the live camera feed',
      icon: ThumbsUp,
      key: 'thumbsUp'
    },
    {
      name: 'One Closed Fist',
      action: 'No Operation (Ignored)',
      rule: 'Single closed fist performs no action and is ignored (only Two Fists Together opens map)',
      icon: Shield,
      key: 'closedFist'
    },
    {
      name: 'Two-Hand Spread / Contract',
      action: 'Map Zoom In / Out [Map View Only]',
      rule: 'In Map View: Raise two open hands; spread apart to zoom in, contract together to zoom out (camera feed stays 1:1)',
      icon: Maximize2,
      key: 'twoHandSpread'
    },
    {
      name: 'Pinch + Drag Across',
      action: 'Pan Map / Rotate Globe [Map View Only]',
      rule: 'In Map View: Pinch thumb & index, move hand across camera frame to pan Mars Leaflet map or rotate 3D globe',
      icon: Move,
      key: 'mapPan'
    },
    {
      name: 'Pinch + Drag Up / Down',
      action: 'Fine Zoom Map [Map View Only]',
      rule: 'In Map View: Pinch thumb & index, drag vertically up to zoom into map, drag down to zoom out (camera feed stays 1:1)',
      icon: Sliders,
      key: 'mapFineZoom'
    },
    {
      name: 'Open Palm Hold (550ms)',
      action: 'Activate Hand Control [HUD]',
      rule: 'Hold open palm steady toward camera to engage hand gesture control avionics',
      icon: Hand,
      key: 'openPalm'
    },
    {
      name: 'Index Point',
      action: 'Move Virtual Cursor [HUD]',
      rule: 'Extend index finger; cursor tracks fingertip across the visor with smoothing',
      icon: MousePointer,
      key: 'point'
    },
    {
      name: 'Thumb-Index Pinch (Tap)',
      action: 'Select Button / Click [HUD]',
      rule: 'Bring index fingertip and thumb tip together to click highlighted UI buttons or cards',
      icon: Zap,
      key: 'pinchSelect'
    },
    {
      name: 'Two Fingers (V / Victory)',
      action: 'Waypoint Creation Mode [HUD]',
      rule: 'Raise index and middle fingers together to engage Waypoint tool at cursor position',
      icon: MapPin,
      key: 'twoFingers'
    },

    {
      name: 'Swipe Left / Right',
      action: 'Cycle Navigation Tools [HUD]',
      rule: 'Quick horizontal hand flick across camera to cycle between HUD dock tools',
      icon: Compass,
      key: 'swipe'
    }
  ];

  return (
    <div className="hud-modal-overlay">
      <div className="hud-modal-container gesture-settings-modal-container">
        {/* Modal Glass Header */}
        <div className="hud-modal-header">
          <div className="modal-title-group">
            <Hand className="modal-title-icon text-accent-cyan" size={18} />
            <div>
              <h2 className="modal-title">HAND GESTURE AVIONICS CONTROL SYSTEM</h2>
              <p className="modal-subtitle">
                MediaPipe Vision-driven hands-free telemetry & HUD interaction
              </p>
            </div>
          </div>

          <div className="modal-header-actions">
            <div className="gesture-tab-pill-group">
              <button
                type="button"
                className={`tab-pill-btn ${activeTab === 'config' ? 'active' : ''}`}
                onClick={() => setActiveTab('config')}
              >
                <Sliders size={13} />
                <span>Configuration</span>
              </button>
              <button
                type="button"
                className={`tab-pill-btn ${activeTab === 'gestures' ? 'active' : ''}`}
                onClick={() => setActiveTab('gestures')}
              >
                <Shield size={13} />
                <span>Gesture Rules</span>
              </button>
              <button
                type="button"
                className={`tab-pill-btn ${activeTab === 'guide' ? 'active' : ''}`}
                onClick={() => setActiveTab('guide')}
              >
                <HelpCircle size={13} />
                <span>Field Reference</span>
              </button>
            </div>

            <button
              type="button"
              className="hud-close-btn"
              onClick={() => {
                hudAudio.playSelect();
                onClose();
              }}
              title="Close Gesture Settings"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="hud-modal-body">
          {activeTab === 'config' && (
            <div className="gesture-config-grid">
              {/* Python OpenCV + AI Hardware Engine Status Card */}
              <div className={`gesture-config-section glass-panel ${isPythonBackendConnected ? 'border-accent-green' : 'border-accent-amber'}`}>
                <div className="section-title-row">
                  <Zap size={15} className={isPythonBackendConnected ? 'text-accent-green' : 'text-accent-amber'} />
                  <span className="section-title">PYTHON OPENCV + AI HARDWARE ENGINE</span>
                  <span className={`status-badge ${isPythonBackendConnected ? 'badge-python-connected' : 'badge-python-offline'}`}>
                    <span className={`engine-mini-dot ${isPythonBackendConnected ? 'dot-pulse-green' : 'dot-offline-red'}`} />
                    {isPythonBackendConnected ? 'CONNECTED' : 'OFFLINE'}
                  </span>
                </div>

                <div className="python-server-info-card">
                  <div className="server-detail-row">
                    <span className="detail-label">Python OpenCV Engine:</span>
                    <span className={`detail-val ${isPythonBackendConnected ? 'val-connected' : 'val-offline'}`}>
                      {isPythonBackendConnected ? 'CONNECTED (60 FPS HARDWARE ACCELERATED)' : 'OFFLINE (FALLBACK TO BROWSER MEDIAPIPE)'}
                    </span>
                  </div>

                  <div className="server-detail-row">
                    <span className="detail-label">WebSocket:</span>
                    <span className="detail-val font-mono text-accent-cyan">ws://localhost:8765</span>
                  </div>

                  {!isPythonBackendConnected ? (
                    <div className="server-offline-instructions">
                      <div className="instruction-header">
                        <Terminal size={14} className="instruction-icon" />
                        <span>LAUNCH PYTHON OPENCV GESTURE SERVER</span>
                      </div>
                      <p className="instruction-desc">
                        To enable dedicated 60 FPS hardware acceleration and ultra-low latency gesture AI inference, run the background launcher script:
                      </p>
                      <div className="code-run-command-box">
                        <code>start_gesture_server.bat</code>
                      </div>
                      <p className="instruction-fallback-note">
                        When offline, the HUD seamlessly uses the client-side Browser MediaPipe engine.
                        Once the server starts, the HUD will automatically connect to <code>ws://localhost:8765</code> without refreshing.
                      </p>
                    </div>
                  ) : (
                    <div className="server-connected-banner">
                      <CheckCircle2 size={15} className="text-accent-green" />
                      <span>Dedicated Python OpenCV 60 FPS stream active. Low latency neural keypoint classification running.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Master Control Card */}
              <div className="gesture-config-section glass-panel">
                <div className="section-title-row">
                  <Hand size={15} className="text-accent-cyan" />
                  <span className="section-title">MASTER GESTURE ENGINE</span>
                  <span className={`status-badge ${isActive ? 'badge-active' : 'badge-standby'}`}>
                    {isActive ? 'SYSTEM ENGAGED' : 'STANDBY MODE'}
                  </span>
                </div>
                <div className="section-desc">
                  When enabled, hand gestures are tracked to control the Mars EVA HUD. Hold open palm for 0.7s or press [G] anytime.
                </div>

                <div className="master-toggle-row">
                  <button
                    type="button"
                    className={`hud-action-btn ${isActive ? 'btn-danger' : 'btn-primary-dest'}`}
                    onClick={() => {
                      hudAudio.playSelect();
                      onToggleActive(!isActive);
                      if (onNotify) {
                        onNotify(
                          !isActive ? 'Hand Gesture Control Engaged' : 'Hand Gesture Control Standby',
                          'info'
                        );
                      }
                    }}
                  >
                    <Hand size={16} />
                    <span>{isActive ? 'DISENGAGE HAND CONTROL' : 'ENGAGE HAND CONTROL NOW [KEY: G]'}</span>
                  </button>

                  <button
                    type="button"
                    className={`hud-action-btn ${debugOverlayEnabled ? 'btn-debug-active' : 'btn-secondary'}`}
                    onClick={() => {
                      hudAudio.playSelect();
                      onToggleDebugOverlay(!debugOverlayEnabled);
                    }}
                    title="Render 21-landmark skeleton on screen"
                  >
                    <Eye size={15} />
                    <span>{debugOverlayEnabled ? 'HIDE SKELETON DEBUG' : 'SHOW 21-LANDMARK SKELETON'}</span>
                  </button>
                </div>
              </div>

              {/* Hand Preference & Sensitivity Settings */}
              <div className="gesture-config-section glass-panel">
                <div className="section-title-row">
                  <Sliders size={15} className="text-accent-amber" />
                  <span className="section-title">CONTROL SENSITIVITY & PREFERENCES</span>
                </div>

                <div className="settings-row-pair">
                  <div className="form-group flex-1">
                    <label className="input-label">PRIMARY HAND PREFERENCE</label>
                    <select
                      className="hud-select w-full"
                      value={currentSettings.handPreference}
                      onChange={(e) => handleUpdate({ handPreference: e.target.value })}
                    >
                      <option value="Right">Right Hand (Commander Default)</option>
                      <option value="Left">Left Hand (Mission Specialist)</option>
                    </select>
                  </div>

                  <div className="form-group flex-1">
                    <label className="input-label">GESTURE SENSITIVITY</label>
                    <select
                      className="hud-select w-full"
                      value={currentSettings.sensitivity}
                      onChange={(e) => {
                        const sens = e.target.value;
                        const pinchScale = sens === 'high' ? 0.28 : sens === 'low' ? 0.17 : 0.22;
                        handleUpdate({ sensitivity: sens, pinchThresholdScale: pinchScale });
                      }}
                    >
                      <option value="high">High Sensitivity (Thick Suit Gloves)</option>
                      <option value="medium">Medium Sensitivity (Standard EVA)</option>
                      <option value="low">Low Sensitivity (High Vibration)</option>
                    </select>
                  </div>

                  <div className="form-group flex-1">
                    <label className="input-label">HORIZONTAL TRACKING AXIS (X)</label>
                    <select
                      className="hud-select w-full"
                      value={currentSettings.invertX ? 'inverted' : 'direct'}
                      onChange={(e) => {
                        const inv = e.target.value === 'inverted';
                        handleUpdate({ invertX: inv });
                        if (onNotify) {
                          onNotify(
                            inv
                              ? 'Horizontal Axis: Inverted (Mirror)'
                              : 'Horizontal Axis: Direct (Left=Left, Right=Right)',
                            'info'
                          );
                        }
                      }}
                    >
                      <option value="direct">Direct Sync (Left = Left, Right = Right)</option>
                      <option value="inverted">Inverted (Mirror View)</option>
                    </select>
                  </div>
                </div>

                {/* Range Sliders for Fine-Tuning */}
                <div className="sliders-subgrid">
                  <div className="slider-item">
                    <div className="slider-labels">
                      <span>Cursor Smoothing (Exponential EMA)</span>
                      <span>{Math.round(currentSettings.cursorSmoothing * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="90"
                      value={Math.round(currentSettings.cursorSmoothing * 100)}
                      onChange={(e) =>
                        handleUpdate({ cursorSmoothing: parseInt(e.target.value, 10) / 100 })
                      }
                      className="hud-range-slider"
                    />
                  </div>

                  <div className="slider-item">
                    <div className="slider-labels">
                      <span>Activation Hold Duration (Open Palm)</span>
                      <span>{currentSettings.activationHoldMs} ms</span>
                    </div>
                    <input
                      type="range"
                      min="400"
                      max="1500"
                      step="50"
                      value={currentSettings.activationHoldMs}
                      onChange={(e) =>
                        handleUpdate({ activationHoldMs: parseInt(e.target.value, 10) })
                      }
                      className="hud-range-slider"
                    />
                  </div>

                  <div className="slider-item">
                    <div className="slider-labels">
                      <span>Dismiss / Return Hold Duration (Thumbs Up)</span>
                      <span>{currentSettings.cancelHoldMs} ms</span>
                    </div>
                    <input
                      type="range"
                      min="500"
                      max="1500"
                      step="50"
                      value={currentSettings.cancelHoldMs}
                      onChange={(e) =>
                        handleUpdate({ cancelHoldMs: parseInt(e.target.value, 10) })
                      }
                      className="hud-range-slider"
                    />
                  </div>

                  <div className="slider-item">
                    <div className="slider-labels">
                      <span>Gesture Cooldown Interval</span>
                      <span>{currentSettings.actionCooldownMs} ms</span>
                    </div>
                    <input
                      type="range"
                      min="200"
                      max="1000"
                      step="50"
                      value={currentSettings.actionCooldownMs}
                      onChange={(e) =>
                        handleUpdate({ actionCooldownMs: parseInt(e.target.value, 10) })
                      }
                      className="hud-range-slider"
                    />
                  </div>
                </div>
              </div>

              {/* Hardware Camera Linking */}
              <div className="gesture-config-section glass-panel">
                <div className="section-title-row">
                  <Sparkles size={15} className="text-accent-cyan" />
                  <span className="section-title">CAMERA HARDWARE STREAM LINK</span>
                </div>
                <div className="section-desc">
                  Hand tracking runs seamlessly over the existing helmet camera feed without creating redundant video hardware streams.
                </div>
                <button
                  type="button"
                  className="hud-action-btn btn-secondary w-full"
                  onClick={() => {
                    hudAudio.playSelect();
                    onClose();
                    if (onOpenDeviceSettings) onOpenDeviceSettings();
                  }}
                >
                  <span>CONFIGURE HEADCAM HARDWARE RESOLUTION & MOUNT</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'gestures' && (
            <div className="gesture-toggles-list">
              <div className="list-instructions">
                Toggle individual aerospace gestures on or off according to operational requirements:
              </div>

              <div className="gesture-cards-grid">
                {gestureGuideList.map((item) => {
                  const Icon = item.icon;
                  const isEnabled = !!currentSettings.enabledGestures[item.key];

                  return (
                    <div
                      key={item.key}
                      className={`gesture-toggle-card ${isEnabled ? 'enabled' : 'disabled'}`}
                      onClick={() => handleToggleGesture(item.key)}
                    >
                      <div className="card-top-row">
                        <div className="icon-box">
                          <Icon size={18} />
                        </div>
                        <span className="gesture-card-title">{item.name}</span>
                        <div className={`status-switch ${isEnabled ? 'switch-on' : 'switch-off'}`}>
                          <div className="switch-knob" />
                        </div>
                      </div>
                      <div className="card-action-tag">{item.action}</div>
                      <div className="card-rule-desc">{item.rule}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="gesture-guide-view">
              <table className="gesture-guide-table">
                <thead>
                  <tr>
                    <th>HUD Function / Action</th>
                    <th>Hand Gesture</th>
                    <th>Recognition Rule</th>
                    <th>Cooldown / Hold</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Activate Hand Control</strong></td>
                    <td><span className="guide-pill">Open Palm</span></td>
                    <td>Extend fingers facing helmet camera</td>
                    <td>550 ms hold</td>
                  </tr>
                  <tr>
                    <td><strong>Move Virtual Cursor</strong></td>
                    <td><span className="guide-pill">Index Finger Point</span></td>
                    <td>Extend index finger; cursor tracks fingertip</td>
                    <td>Real-time continuous</td>
                  </tr>
                  <tr>
                    <td><strong>Select Button / Click</strong></td>
                    <td><span className="guide-pill">Thumb + Index Pinch</span></td>
                    <td>Pinch index tip and thumb tip to click buttons</td>
                    <td>380 ms cooldown</td>
                  </tr>
                  <tr>
                    <td><strong>Close / Return to Camera Feed</strong></td>
                    <td><span className="guide-pill">Thumbs Up</span></td>
                    <td>Hold thumb upright toward camera to dismiss any window, modal, or map and return to camera feed</td>
                    <td>450 ms hold</td>
                  </tr>
                  <tr>
                    <td><strong>One Closed Fist</strong></td>
                    <td><span className="guide-pill">Closed Fist</span></td>
                    <td>Single closed fist performs no action (No Operation)</td>
                    <td>Ignored</td>
                  </tr>
                  <tr>
                    <td><strong>Switch Navigation Tools</strong></td>
                    <td><span className="guide-pill">Swipe Left / Right</span></td>
                    <td>Fast horizontal hand transit across camera FOV</td>
                    <td>350 ms cooldown</td>
                  </tr>
                  <tr>
                    <td><strong>Optical & Map Zoom</strong></td>
                    <td><span className="guide-pill">Two Hands / Pinch Drag</span></td>
                    <td>Spread two hands apart to Zoom In, together to Zoom Out. Or Pinch and drag vertically.</td>
                    <td>Continuous [+, -, 0]</td>
                  </tr>
                  <tr>
                    <td><strong>Map Pan & Rotate</strong></td>
                    <td><span className="guide-pill">Pinch + Horizontal Drag</span></td>
                    <td>Maintain thumb-index pinch while moving hand horizontally</td>
                    <td>Continuous drag</td>
                  </tr>
                  <tr>
                    <td><strong>Emergency Disengage</strong></td>
                    <td><span className="guide-pill">[G] Keyboard Key</span></td>
                    <td>Physical keyboard fallback toggle anytime</td>
                    <td>Instant toggle</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="hud-modal-footer">
          <div className="footer-left-status">
            <span className="footer-key-hint">Keyboard Shortcut: Press <strong>[G]</strong> to toggle Gesture Control</span>
          </div>

          <button
            type="button"
            className="hud-action-btn btn-primary-dest"
            onClick={() => {
              hudAudio.playSelect();
              onClose();
            }}
          >
            <CheckCircle2 size={16} />
            <span>SAVE & RETURN TO VISOR HUD</span>
          </button>
        </div>
      </div>
    </div>
  );
}
