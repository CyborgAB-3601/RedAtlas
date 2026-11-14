import React, { useState, useEffect, useRef } from 'react';
import { Compass, Navigation } from 'lucide-react';
import { hudAudio } from '../services/audioService';

export default function TargetingReticle({
  headOrientation,
  worldMarkers = [],
  onSelectMarker,
  onNotify
}) {
  const [lockedTarget, setLockedTarget] = useState(null);
  const [dwellProgress, setDwellProgress] = useState(0);
  const dwellTimerRef = useRef(null);

  const heading = ((Math.round(headOrientation.yaw) % 360) + 360) % 360;
  const pitch = Math.round(headOrientation.pitch);

  const getCompassDirection = (deg) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return directions[Math.round(deg / 45) % 8];
  };

  // Check if center reticle is pointing near any world marker
  useEffect(() => {
    const centerYaw = headOrientation.yaw;
    const centerPitch = headOrientation.pitch;

    const hovered = worldMarkers.find((m) => {
      const dyaw = Math.abs(m.baseYaw - centerYaw);
      const dpitch = Math.abs(m.basePitch - centerPitch);
      return dyaw < 6 && dpitch < 5;
    });

    if (hovered) {
      if (lockedTarget?.id !== hovered.id) {
        setLockedTarget(hovered);
        hudAudio.playTargetLock();
        setDwellProgress(0);

        if (dwellTimerRef.current) clearInterval(dwellTimerRef.current);
        const startTime = Date.now();
        const duration = 1400; // 1.4s dwell

        dwellTimerRef.current = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const prog = Math.min(100, (elapsed / duration) * 100);
          setDwellProgress(prog);

          if (prog >= 100) {
            clearInterval(dwellTimerRef.current);
            hudAudio.playSelect();
            if (onSelectMarker) onSelectMarker(hovered);
            if (onNotify) onNotify(`Gaze Confirmed: ${hovered.name}`, 'info');
          }
        }, 30);
      }
    } else {
      if (lockedTarget) {
        setLockedTarget(null);
        setDwellProgress(0);
        if (dwellTimerRef.current) clearInterval(dwellTimerRef.current);
      }
    }

    return () => {
      if (dwellTimerRef.current) clearInterval(dwellTimerRef.current);
    };
  }, [headOrientation, worldMarkers, lockedTarget, onSelectMarker, onNotify]);

  // Spacebar confirm key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && lockedTarget) {
        e.preventDefault();
        hudAudio.playSelect();
        if (onSelectMarker) onSelectMarker(lockedTarget);
        if (onNotify) onNotify(`Target Confirmed: ${lockedTarget.name}`, 'info');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lockedTarget, onSelectMarker, onNotify]);

  return (
    <div className="hud-reticle-overlay">
      {/* 1. Minimal Compass Heading Tape Above Reticle */}
      <div className="reticle-heading-indicator">
        <span className="heading-degrees">{String(heading).padStart(3, '0')}°</span>
        <span className="heading-cardinal">{getCompassDirection(heading)}</span>
        <span className="heading-separator">/</span>
        <span className="heading-pitch">{pitch >= 0 ? `+${pitch}` : pitch}°</span>
      </div>

      {/* 2. World-Anchored AR HUD Markers (shift with head yaw/pitch) */}
      <div className="world-beacons-layer">
        {worldMarkers.map((marker) => {
          const screenX = window.innerWidth / 2 + (marker.baseYaw - headOrientation.yaw) * 32;
          const screenY = window.innerHeight / 2 - (marker.basePitch - headOrientation.pitch) * 32;

          const isVisible =
            screenX > 50 &&
            screenX < window.innerWidth - 50 &&
            screenY > 60 &&
            screenY < window.innerHeight - 80;

          if (!isVisible) return null;
          const isTargeted = lockedTarget?.id === marker.id;

          return (
            <div
              key={marker.id}
              className={`world-beacon ${isTargeted ? 'targeted' : ''}`}
              style={{ left: `${screenX}px`, top: `${screenY}px` }}
              onClick={() => {
                hudAudio.playSelect();
                if (onSelectMarker) onSelectMarker(marker);
              }}
            >
              <div className="beacon-dot" />
            </div>
          );
        })}
      </div>

      {/* 3. Small, Elegant Central Targeting Reticle */}
      <div className={`center-target-reticle ${lockedTarget ? 'target-locked' : ''}`}>
        {/* Central Point */}
        <div className="reticle-center-dot" />

        {/* Four Subtle Corner Brackets */}
        <div className="reticle-bracket tl" />
        <div className="reticle-bracket tr" />
        <div className="reticle-bracket bl" />
        <div className="reticle-bracket br" />

        {/* Circular Dwell Progress Arc when Locking */}
        {lockedTarget && (
          <svg className="reticle-dwell-circle" viewBox="0 0 60 60">
            <circle
              cx="30"
              cy="30"
              r="24"
              fill="none"
              stroke="rgba(0, 240, 255, 0.2)"
              strokeWidth="2"
            />
            <circle
              cx="30"
              cy="30"
              r="24"
              fill="none"
              stroke="#00f0ff"
              strokeWidth="2"
              strokeDasharray={150.8}
              strokeDashoffset={150.8 - (150.8 * dwellProgress) / 100}
              strokeLinecap="round"
            />
          </svg>
        )}
      </div>
    </div>
  );
}
