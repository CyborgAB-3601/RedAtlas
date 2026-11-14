import React from 'react';
import { EVA_TIMELINE } from '../data/marsLocations';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Hourglass,
  Radio,
  UserCheck,
  AlertTriangle,
  Play
} from 'lucide-react';

export default function PlanningView({ onOpenHUD }) {
  return (
    <div className="planning-view-container animate-fade-in">
      {/* Top Header */}
      <div className="view-header-strip">
        <div className="view-title-group">
          <div className="view-badge">
            <Calendar size={13} className="text-accent" />
            <span>EVA SURFACE TIMELINE</span>
          </div>
          <h2 className="view-heading">Sol Schedule & Crew Duty Cycle</h2>
          <p className="view-subtext">
            Choreographed surface activity timeline synchronized with orbiter passes and daylight thermal windows.
          </p>
        </div>

        <button className="timeline-hud-btn" onClick={onOpenHUD}>
          <Play size={14} fill="white" />
          <span>Launch Visor HUD Telemetry</span>
        </button>
      </div>

      {/* Timeline Gantt / Sequential Cards */}
      <div className="timeline-main-grid">
        <div className="timeline-list-col">
          <div className="timeline-track">
            {EVA_TIMELINE.map((step, idx) => {
              const isDone = step.status === 'completed';
              const isCurrent = step.status === 'in-progress';

              return (
                <div
                  key={idx}
                  className={`timeline-step-row ${isDone ? 'is-done' : ''} ${
                    isCurrent ? 'is-current' : ''
                  }`}
                >
                  <div className="step-time-col">
                    <span className="step-clock">{step.time}</span>
                    <span className="step-dur">{step.duration}</span>
                  </div>

                  <div className="step-indicator-col">
                    <div className="step-node-dot">
                      {isDone ? <CheckCircle2 size={14} /> : <span className="inner-dot" />}
                    </div>
                    {idx < EVA_TIMELINE.length - 1 && <div className="step-connector-line" />}
                  </div>

                  <div className="step-content-card">
                    <div className="step-top-line">
                      <h4 className="step-task-name">{step.task}</h4>
                      <span className={`status-pill ${step.status}`}>
                        {step.status.toUpperCase()}
                      </span>
                    </div>
                    {isCurrent && (
                      <p className="step-active-callout">
                        Crew is currently conducting traverse leg 1. Telemetry and bio-monitoring link stable at 99.4%.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Info Sidebar for Planning */}
        <div className="timeline-info-col">
          <div className="planning-card">
            <h3 className="p-card-title">Astronaut Pairing & Responsibilities</h3>
            <div className="p-crew-item">
              <div className="p-crew-header">
                <span className="p-callsign">EVA-1 (Lead Geologist)</span>
                <span className="p-tag">Dr. Sarah Vance</span>
              </div>
              <p className="p-desc">
                Primary task: Precision coring of boxwork sulfate ridges and high-resolution macroscopic imaging.
              </p>
            </div>

            <div className="p-crew-item">
              <div className="p-crew-header">
                <span className="p-callsign">EVA-2 (Safety / Nav)</span>
                <span className="p-tag">Cmdr. Marcus Rivera</span>
              </div>
              <p className="p-desc">
                Primary task: Consumables margin monitoring, rover tether management, and comms relay oversight.
              </p>
            </div>
          </div>

          <div className="planning-card">
            <h3 className="p-card-title">Critical Satellite Comms Passes</h3>
            <div className="comms-pass-item">
              <span className="pass-satellite">Mars Reconnaissance Orbiter (MRO)</span>
              <span className="pass-window text-accent">11:53 - 12:18 LMST</span>
              <span className="pass-rate">High-Gain Bandwidth: 6.0 Mbps</span>
            </div>
            <div className="comms-pass-item">
              <span className="pass-satellite">2001 Mars Odyssey</span>
              <span className="pass-window">14:10 - 14:32 LMST</span>
              <span className="pass-rate">UHF Proximity Link: 256 kbps</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

