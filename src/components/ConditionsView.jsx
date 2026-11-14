import React from 'react';
import { MARTIAN_CONDITIONS } from '../data/marsLocations';
import {
  CloudSun,
  Thermometer,
  Wind,
  Gauge,
  Sun,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Radio,
  Clock,
  Sparkles
} from 'lucide-react';

export default function ConditionsView() {
  const c = MARTIAN_CONDITIONS;

  return (
    <div className="conditions-view-container animate-fade-in">
      {/* Header */}
      <div className="view-header-strip">
        <div className="view-title-group">
          <div className="view-badge">
            <CloudSun size={13} className="text-accent" />
            <span>METEOROLOGY & SPACE WEATHER</span>
          </div>
          <h2 className="view-heading">Surface Conditions & Environmental Safety</h2>
          <p className="view-subtext">
            Live atmospheric telemetry and solar particle event monitoring from Curiosity REMS & Perseverance MEDA.
          </p>
        </div>

        <div className="sol-clock-badge">
          <Clock size={14} className="text-accent" />
          <span>SOL {c.sol} • {c.localSolarTime.slice(0, 11)}</span>
        </div>
      </div>

      {/* Atmospheric Metrics Grid */}
      <div className="conditions-metrics-grid">
        {/* Surface Pressure */}
        <div className="condition-card">
          <div className="card-top-row">
            <span className="card-lbl">ATMOSPHERIC PRESSURE</span>
            <Gauge size={16} className="text-accent" />
          </div>
          <div className="card-big-stat">
            <span className="num">{c.surfacePressure.current}</span>
            <span className="unit">{c.surfacePressure.unit}</span>
          </div>
          <div className="card-sub-info">
            <span className="trend">{c.surfacePressure.trend}</span>
            <span className="eq">{c.surfacePressure.earthEquivalent}</span>
          </div>
        </div>

        {/* Ambient Temperature */}
        <div className="condition-card">
          <div className="card-top-row">
            <span className="card-lbl">SURFACE / AIR TEMPERATURE</span>
            <Thermometer size={16} className="text-accent" />
          </div>
          <div className="card-big-stat">
            <span className="num">{c.temperature.groundCurrent}°</span>
            <span className="unit">Ground / {c.temperature.airCurrent}° Air</span>
          </div>
          <div className="card-sub-info">
            <span>Diurnal Range: {c.temperature.min}°C to {c.temperature.max}°C</span>
          </div>
        </div>

        {/* Wind Speed & Direction */}
        <div className="condition-card">
          <div className="card-top-row">
            <span className="card-lbl">SURFACE WIND & GUSTS</span>
            <Wind size={16} className="text-accent" />
          </div>
          <div className="card-big-stat">
            <span className="num">{c.wind.speed}</span>
            <span className="unit">{c.wind.unit} ({c.wind.direction})</span>
          </div>
          <div className="card-sub-info">
            <span>Peak Gust: {c.wind.gustPeak} m/s • Low dynamic drag</span>
          </div>
        </div>

        {/* Atmospheric Dust Opacity */}
        <div className="condition-card">
          <div className="card-top-row">
            <span className="card-lbl">DUST OPTICAL DEPTH (TAU)</span>
            <Sun size={16} className="text-accent" />
          </div>
          <div className="card-big-stat">
            <span className="num">τ {c.dustTau.value}</span>
            <span className="unit">Nominal</span>
          </div>
          <div className="card-sub-info">
            <span className="text-success">{c.dustTau.status}</span>
          </div>
        </div>
      </div>

      {/* Radiation & Space Weather Critical Alert Banner */}
      <div className="radiation-safety-banner">
        <div className="banner-left">
          <div className="safety-icon-box text-accent">
            <ShieldCheck size={28} />
          </div>
          <div className="banner-info">
            <div className="banner-status-tag">
              <span className="dot animate-pulse" />
              <span>SPACE WEATHER MONITOR: {c.radiation.speAlert}</span>
            </div>
            <h3 className="banner-title">Galactic Cosmic Ray (GCR) Surface Flux: {c.radiation.doseRate}</h3>
            <p className="banner-desc">
              Curiosity MSL RAD sensor reports quiet heliospheric conditions. No coronal mass ejection transit detected. Cumulative EVA dose remains well below the NASA 100 mSv career limit ({c.radiation.cumulativeMission}).
            </p>
          </div>
        </div>

        <div className="banner-right">
          <div className="dose-gauge-box">
            <span className="gauge-label">EVA DOSE ACCUMULATION</span>
            <div className="gauge-track">
              <div className="gauge-fill" style={{ width: '15%' }} />
            </div>
            <span className="gauge-val">14.8% of Safe Threshold</span>
          </div>
        </div>
      </div>

      {/* Diurnal Thermal & Daylight Curve */}
      <div className="diurnal-curve-card">
        <div className="curve-header">
          <h3 className="curve-title">Diurnal Temperature & Solar Insolation Profile</h3>
          <span className="daylight-pill">Daylight Remaining: {c.solarInsolation.daylightRemaining}</span>
        </div>

        <div className="solar-timeline-row">
          <div className="time-node past">
            <span className="t-hour">06:00</span>
            <span className="t-event">Sunrise (-82°C)</span>
          </div>
          <div className="time-node past">
            <span className="t-hour">10:00</span>
            <span className="t-event">Airlock Egress (-35°C)</span>
          </div>
          <div className="time-node current">
            <span className="t-hour">14:38</span>
            <span className="t-event">Peak Insolation (-12°C)</span>
          </div>
          <div className="time-node future">
            <span className="t-hour">18:50</span>
            <span className="t-event">Sunset (-55°C)</span>
          </div>
          <div className="time-node future">
            <span className="t-hour">22:00</span>
            <span className="t-event">Night Minimum (-84°C)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

