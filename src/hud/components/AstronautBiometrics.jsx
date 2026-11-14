import React, { useRef, useEffect, useState } from 'react';
import { Triangle } from 'lucide-react';

/**
 * AstronautBiometrics — Matches the Top-Right Region of the reference image:
 * - Header: `▲ CDR. ADAMS`.
 * - Two curved/slanted progress bar gauges: `O2` and `H2O`.
 * - Real-time animated cardiac ECG waveform in glowing amber phosphor.
 * - Readout: `63 bpm` on left/center, `120` scale on right.
 * - Underline accent bar.
 * - Interactive: Clicking opens full astronaut diagnostics drawer.
 */
export default function AstronautBiometrics({ telemetry, onOpenAstronautModal }) {
  const canvasRef = useRef(null);
  const [bpm, setBpm] = useState(63);
  const [o2Level, setO2Level] = useState(86);
  const [h2oLevel, setH2oLevel] = useState(74);

  // Subtle natural heart rate fluctuations around 63 bpm
  useEffect(() => {
    const interval = setInterval(() => {
      setBpm((prev) => {
        const delta = Math.random() > 0.6 ? (Math.random() > 0.5 ? 1 : -1) : 0;
        return Math.min(68, Math.max(59, prev + delta));
      });
      setO2Level((prev) => +(Math.max(20, prev - 0.001)).toFixed(0));
      setH2oLevel((prev) => +(Math.max(15, prev - 0.001)).toFixed(0));
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  // Real-time smooth oscilloscope ECG waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const width = (canvas.width = 180);
    const height = (canvas.height = 36);

    const buffer = new Array(width).fill(height / 2);
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Advance ECG heartbeat cycle
      phase = (phase + 2.2) % 100;
      let val = height / 2;

      if (phase >= 18 && phase < 26) {
        // P-wave
        val -= Math.sin(((phase - 18) / 8) * Math.PI) * 3;
      } else if (phase >= 32 && phase < 35) {
        // Q-dip
        val += 2;
      } else if (phase >= 35 && phase < 40) {
        // R-spike
        const prog = (phase - 35) / 5;
        val -= Math.sin(prog * Math.PI) * 15;
      } else if (phase >= 40 && phase < 43) {
        // S-dip
        val += 4;
      } else if (phase >= 54 && phase < 68) {
        // T-wave
        val -= Math.sin(((phase - 54) / 14) * Math.PI) * 4;
      }

      buffer.shift();
      buffer.push(val + (Math.random() * 0.5 - 0.25));

      // Draw ECG line in glowing amber phosphor
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.8;
      ctx.shadowColor = 'rgba(245, 158, 11, 0.7)';
      ctx.shadowBlur = 5;

      ctx.beginPath();
      buffer.forEach((pt, i) => {
        if (i === 0) ctx.moveTo(i, pt);
        else ctx.lineTo(i, pt);
      });
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Leading beam point
      ctx.fillStyle = '#ffedd5';
      ctx.beginPath();
      ctx.arc(width - 2, buffer[buffer.length - 1], 1.6, 0, Math.PI * 2);
      ctx.fill();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div
      className="hud-top-right-group"
      onClick={onOpenAstronautModal}
      title="Click to view detailed commander telemetry & biometrics"
    >
      {/* Commander Callout Header */}
      <div className="cdr-header-row">
        <span className="cdr-triangle">▲</span>
        <span className="cdr-name">CDR. NIVED</span>
      </div>

      {/* Two Curved / Slanted Progress Bar Gauges */}
      <div className="cdr-gauges-col">
        {/* Top: O2 */}
        <div className="cdr-gauge-item">
          <span className="cdr-gauge-label">O₂</span>
          <div className="cdr-gauge-track">
            <div
              className="cdr-gauge-fill fill-o2"
              style={{ width: `${o2Level}%` }}
            />
          </div>
        </div>

        {/* Bottom: H2O */}
        <div className="cdr-gauge-item">
          <span className="cdr-gauge-label">H₂O</span>
          <div className="cdr-gauge-track">
            <div
              className="cdr-gauge-fill fill-h2o"
              style={{ width: `${h2oLevel}%` }}
            />
          </div>
        </div>
      </div>

      {/* Real-time Oscilloscope ECG Waveform */}
      <div className="cdr-ecg-container">
        <canvas ref={canvasRef} className="cdr-ecg-canvas" />
      </div>

      {/* Heart Rate & Scale Readout */}
      <div className="cdr-heart-rate-row">
        <div className="bpm-group">
          <span className="bpm-value">{bpm}</span>
          <span className="bpm-unit">bpm</span>
        </div>
        <span className="bpm-scale">120</span>
      </div>

      {/* Bottom Amber Accent Line */}
      <div className="cdr-accent-underline" />
    </div>
  );
}
