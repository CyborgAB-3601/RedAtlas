import React, { useState, useEffect } from 'react';

/**
 * SuitTelemetryPanel — Matches the Top-Left Region of the reference image:
 * - Rounded glowing amber outline card.
 * - Left: Glowing golden-amber holographic/wireframe standing astronaut suit.
 * - Right: Large numerals `76°F` (suit internal) and `-112°F` (ambient external).
 * - Beside the card: Two curved/slanted bar meters for `O2` and `CO2`.
 * - Interactive: Clicking opens full astronaut telemetry & diagnostics drawer.
 */
export default function SuitTelemetryPanel({ telemetry, onOpenAstronautModal }) {
  // Telemetry state with authentic micro-fluctuations
  const [internalTempF, setInternalTempF] = useState(76);
  const [ambientTempF, setAmbientTempF] = useState(-112);
  const [o2Level, setO2Level] = useState(88);
  const [co2Level, setCo2Level] = useState(14);

  useEffect(() => {
    const timer = setInterval(() => {
      // Subtle authentic fluctuations
      setInternalTempF((prev) => (Math.random() > 0.8 ? (prev === 76 ? 77 : 76) : prev));
      setAmbientTempF((prev) => (Math.random() > 0.7 ? (prev === -112 ? -111 : -112) : prev));
      setO2Level((prev) => +(Math.max(20, prev - 0.002)).toFixed(0));
      setCo2Level((prev) => (Math.random() > 0.8 ? (prev === 14 ? 15 : 14) : prev));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="hud-top-left-group"
      onClick={onOpenAstronautModal}
      title="Click to inspect detailed suit diagnostics & biometrics"
    >
      {/* Registration Marks above card */}
      <div className="suit-panel-reg-marks">
        <span className="reg-bracket">[</span>
        <span className="reg-code">No1 E0</span>
        <span className="reg-bracket">]</span>
      </div>

      <div className="suit-hud-card-row">
        {/* Rounded Amber-Bordered Suit Card */}
        <div className="suit-telemetry-glass-card">
          {/* Holographic Glowing 3D Astronaut EVA Suit Figure */}
          <div className="hologram-astronaut-container">
            <svg
              className="hologram-astronaut-svg"
              viewBox="0 0 100 160"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <filter id="astroGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <linearGradient id="astroGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffc04d" />
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
              </defs>

              {/* Holographic scanlines effect */}
              <g filter="url(#astroGlow)" opacity="0.95">
                {/* Helmet / Visor */}
                <ellipse cx="50" cy="24" rx="14" ry="13" fill="none" stroke="url(#astroGrad)" strokeWidth="2" />
                <ellipse cx="50" cy="23" rx="10" ry="8" fill="rgba(255, 180, 50, 0.35)" stroke="#fbbf24" strokeWidth="1.2" />

                {/* Neck Ring */}
                <path d="M 40 37 L 60 37" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />

                {/* Torso & Chest Pack */}
                <path
                  d="M 37 38 L 63 38 L 67 85 L 33 85 Z"
                  fill="rgba(245, 158, 11, 0.15)"
                  stroke="url(#astroGrad)"
                  strokeWidth="2"
                />
                <rect x="42" y="46" width="16" height="22" rx="3" fill="none" stroke="#fbbf24" strokeWidth="1.5" />
                <line x1="45" y1="52" x2="55" y2="52" stroke="#ffedd5" strokeWidth="1" />
                <line x1="45" y1="58" x2="55" y2="58" stroke="#ffedd5" strokeWidth="1" />

                {/* Left Arm & Glove */}
                <path
                  d="M 36 40 L 22 62 L 20 88"
                  fill="none"
                  stroke="url(#astroGrad)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="20" cy="92" r="3.5" fill="#f59e0b" />

                {/* Right Arm & Glove */}
                <path
                  d="M 64 40 L 78 62 L 80 88"
                  fill="none"
                  stroke="url(#astroGrad)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="80" cy="92" r="3.5" fill="#f59e0b" />

                {/* Waist & Utility Belt */}
                <rect x="33" y="85" width="34" height="6" rx="2" fill="none" stroke="#fbbf24" strokeWidth="1.5" />

                {/* Left Leg & Boot */}
                <path
                  d="M 41 91 L 37 122 L 35 146"
                  fill="none"
                  stroke="url(#astroGrad)"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                <path
                  d="M 30 146 L 41 146 L 41 152 L 28 152 Z"
                  fill="#f59e0b"
                />

                {/* Right Leg & Boot */}
                <path
                  d="M 59 91 L 63 122 L 65 146"
                  fill="none"
                  stroke="url(#astroGrad)"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                <path
                  d="M 59 146 L 70 146 L 72 152 L 59 152 Z"
                  fill="#f59e0b"
                />

                {/* PLSS Backpack contours */}
                <rect x="30" y="42" width="6" height="34" rx="2" fill="none" stroke="#d97706" strokeWidth="1.5" />
                <rect x="64" y="42" width="6" height="34" rx="2" fill="none" stroke="#d97706" strokeWidth="1.5" />
              </g>
            </svg>
          </div>

          {/* Right Side Temperatures */}
          <div className="suit-temperatures-col">
            <div className="suit-temp-row internal">
              <span className="temp-numeric">{internalTempF}</span>
              <span className="temp-unit">°F</span>
            </div>
            <div className="suit-temp-row ambient">
              <span className="temp-numeric">{ambientTempF}</span>
              <span className="temp-unit">°F</span>
            </div>
          </div>
        </div>

        {/* Two Curved / Slanted Progress Bar Meters beside card */}
        <div className="suit-gauges-col">
          {/* Top Bar: O2 */}
          <div className="curved-gauge-item">
            <div className="curved-gauge-track">
              <div
                className="curved-gauge-fill fill-o2"
                style={{ width: `${o2Level}%` }}
              />
            </div>
            <span className="curved-gauge-label">O₂</span>
          </div>

          {/* Bottom Bar: CO2 */}
          <div className="curved-gauge-item">
            <div className="curved-gauge-track">
              <div
                className="curved-gauge-fill fill-co2"
                style={{ width: `${co2Level}%` }}
              />
            </div>
            <span className="curved-gauge-label">CO₂</span>
          </div>
        </div>
      </div>
    </div>
  );
}
