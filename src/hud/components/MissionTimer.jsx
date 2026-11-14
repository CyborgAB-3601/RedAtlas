import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { hudAudio } from '../services/audioService';

/**
 * MissionTimer — Matches the Top-Center Region of the reference image:
 * - Large glowing amber digital timer `02:29:83`.
 * - Clean glowing label `EVA TIME` directly underneath.
 * - Framed by the canopy trapezoid.
 * - Interactive: Hover/click reveals pause/resume and reset controls.
 */
export default function MissionTimer({ onNotify }) {
  // Initialized to match the exact reference image timer: 02 hours, 29 mins, 83 (or ticking seconds/centi)
  const [totalSeconds, setTotalSeconds] = useState(8983); // 2h 29m 43s
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    let interval = null;
    if (isRunning) {
      interval = setInterval(() => {
        setTotalSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const toggleTimer = (e) => {
    e.stopPropagation();
    hudAudio.playSelect();
    setIsRunning(!isRunning);
    if (onNotify) {
      onNotify(isRunning ? 'EVA Mission Timer Paused' : 'EVA Mission Timer Resumed', 'info');
    }
  };

  const resetTimer = (e) => {
    e.stopPropagation();
    hudAudio.playSelect();
    setIsRunning(false);
    setTotalSeconds(0);
    if (onNotify) onNotify('EVA Session Timer Reset to 00:00:00', 'warning');
  };

  const formatDisplayTime = () => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  return (
    <div className="hud-mission-timer-center">
      {/* Central Canopy Framing Box */}
      <div className="eva-canopy-box">
        {/* Digital Glowing Timer Text */}
        <div className="eva-digital-timer-value">
          {formatDisplayTime()}
        </div>

        {/* Sub-label: EVA TIME */}
        <div className="eva-time-sublabel">
          EVA TIME
        </div>

        {/* Hover / Quick Timer Controls */}
        <div className="eva-timer-hover-controls">
          <button
            className="timer-control-pill"
            onClick={toggleTimer}
            title={isRunning ? 'Pause Timer' : 'Resume Timer'}
          >
            {isRunning ? <Pause size={10} /> : <Play size={10} />}
          </button>
          <button
            className="timer-control-pill"
            onClick={resetTimer}
            title="Reset EVA Timer"
          >
            <RotateCcw size={10} />
          </button>
        </div>
      </div>
    </div>
  );
}
