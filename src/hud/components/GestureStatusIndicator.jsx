import React from 'react';
import { Hand, Sliders, Zap, Cpu } from 'lucide-react';
import { hudAudio } from '../services/audioService';

/**
 * GestureStatusIndicator — Aerospace HUD Status Indicator for Hand Control
 * Shows active/standby state, detected gesture tag, confidence level, settings access,
 * and distinctive AI engine indicator badge:
 *   - When isPythonBackendConnected: 'PYTHON OPENCV + AI ACCELERATED (60 FPS)' with pulsing green dot
 *   - When false: 'BROWSER MEDIAPIPE ENGINE'
 */
export default function GestureStatusIndicator({
  isActive = false,
  handDetected = false,
  currentGesture = 'NONE',
  confidence = 0,
  isPythonBackendConnected = false,
  onToggleActive,
  onOpenSettings
}) {
  const handleToggle = (e) => {
    e.stopPropagation();
    hudAudio.playSelect();
    onToggleActive(!isActive);
  };

  const handleOpenSettingsClick = (e) => {
    e.stopPropagation();
    hudAudio.playSelect();
    if (onOpenSettings) onOpenSettings();
  };

  return (
    <div className="hud-gesture-status-cluster">
      {/* Distinctive Acceleration Engine Status Badge */}
      <button
        type="button"
        className={`gesture-engine-badge ${
          isPythonBackendConnected ? 'engine-python-badge' : 'engine-browser-badge'
        }`}
        onClick={handleOpenSettingsClick}
        title={
          isPythonBackendConnected
            ? 'Python OpenCV + MediaPipe Engine Active (ws://localhost:8765) — 60 FPS Accelerated'
            : 'Browser MediaPipe Engine Active. Start start_gesture_server.bat for 60 FPS Python acceleration.'
        }
      >
        <span
          className={`engine-indicator-dot ${
            isPythonBackendConnected ? 'dot-pulse-green' : 'dot-browser-amber'
          }`}
        />
        <span className="engine-badge-text">
          {isPythonBackendConnected
            ? 'PYTHON OPENCV + AI ACCELERATED (60 FPS)'
            : 'BROWSER MEDIAPIPE ENGINE'}
        </span>
      </button>

      {/* Main Hand Control & Gesture Status Pill */}
      <div className={`hud-gesture-status-pill ${isActive ? 'active' : 'standby'}`}>
        <button
          className="gesture-status-main-btn"
          onClick={handleToggle}
          title="Toggle Hand Control [Key: G] (Or hold Open Palm for 0.7s)"
        >
          <Hand
            size={14}
            className={`gesture-hand-icon ${isActive ? 'text-accent-cyan' : 'text-text-muted'}`}
          />
          <span className="gesture-status-dot" />
          <span className="gesture-status-text">
            {isActive ? 'HAND CONTROL' : 'GESTURE STANDBY'}
          </span>

          {/* Current Gesture Callout when detected */}
          {handDetected && currentGesture !== 'NONE' && (
            <span className="gesture-active-tag">
              {currentGesture.replace('_', ' ')}
            </span>
          )}

          {/* Confidence metric */}
          {handDetected && confidence > 0 && (
            <span className="gesture-confidence-pct">{confidence}%</span>
          )}
        </button>

        <button
          className="gesture-settings-btn"
          onClick={handleOpenSettingsClick}
          title="Open Hand Gesture Settings & Guide"
        >
          <Sliders size={12} />
        </button>
      </div>
    </div>
  );
}
