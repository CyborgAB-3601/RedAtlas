import React, { useState } from 'react';
import { EVA_ROUTE_LEGS } from '../data/marsLocations';
import {
  GitBranch,
  ShieldAlert,
  ShieldCheck,
  BatteryCharging,
  Wind,
  Footprints,
  Radio,
  CheckCircle2,
  Clock,
  Navigation,
  Compass,
  AlertTriangle,
  Play,
  UserCheck
} from 'lucide-react';

export default function RoutesView({ onOpenHUD }) {
  const [transportMode, setTransportMode] = useState('assisted'); // 'assisted' (Rover) or 'foot' (EVA Suit Only)
  const [selectedLeg, setSelectedLeg] = useState(EVA_ROUTE_LEGS[2]);

  // Dynamic consumables math based on mode
  const totalDist = 4.2; // km
  const paceKmh = transportMode === 'assisted' ? 4.5 : 1.4;
  const totalHours = (totalDist / paceKmh).toFixed(1);
  const o2BurnTotal = transportMode === 'assisted' ? '38%' : '65%';
  const batteryBurnTotal = transportMode === 'assisted' ? '42%' : '74%';

  return (
    <div className="routes-view-container animate-fade-in">
      {/* Top Header */}
      <div className="view-header-strip">
        <div className="view-title-group">
          <div className="view-badge">
            <GitBranch size={13} className="text-accent" />
            <span>EVA MARSWALK LOGISTICS</span>
          </div>
          <h2 className="view-heading">Traverse Planner & Safety Envelope</h2>
          <p className="view-subtext">
            Calculated route legs incorporating HiRISE slope gradients, astronaut metabolic rate, and Point of Safe Return.
          </p>
        </div>

        {/* Transport Mode Switcher */}
        <div className="transport-mode-pill">
          <button
            className={`mode-btn ${transportMode === 'assisted' ? 'active' : ''}`}
            onClick={() => setTransportMode('assisted')}
          >
            <Radio size={14} />
            <span>Rover-Assisted Pair</span>
          </button>
          <button
            className={`mode-btn ${transportMode === 'foot' ? 'active' : ''}`}
            onClick={() => setTransportMode('foot')}
          >
            <Footprints size={14} />
            <span>On Foot (Suit Only)</span>
          </button>
        </div>
      </div>

      {/* Real-Time Consumables & Walkback HUD Bar */}
      <div className="consumables-hud-bar">
        <div className="consumable-card">
          <div className="c-icon-wrap text-accent">
            <Clock size={18} />
          </div>
          <div className="c-data">
            <span className="c-label">TOTAL ESTIMATED TIME</span>
            <span className="c-value">{totalHours} Hours</span>
            <span className="c-sub">Pace: {paceKmh} km/h</span>
          </div>
        </div>

        <div className="consumable-card">
          <div className="c-icon-wrap text-info">
            <Wind size={18} />
          </div>
          <div className="c-data">
            <span className="c-label">OXYGEN EXPENDITURE</span>
            <span className="c-value">{o2BurnTotal} Total</span>
            <span className="c-sub">Safety reserve: 35% safe</span>
          </div>
        </div>

        <div className="consumable-card">
          <div className="c-icon-wrap text-warning">
            <BatteryCharging size={18} />
          </div>
          <div className="c-data">
            <span className="c-label">SUIT BATTERY MARGIN</span>
            <span className="c-value">{batteryBurnTotal} Utilized</span>
            <span className="c-sub">Thermal sublimators active</span>
          </div>
        </div>

        <div className="consumable-card highlight-border">
          <div className="c-icon-wrap text-accent">
            <ShieldCheck size={18} />
          </div>
          <div className="c-data">
            <span className="c-label">WALKBACK LIMIT (BUMP)</span>
            <span className="c-value">KM 3.1 Marker</span>
            <span className="c-sub">Point of Safe Return</span>
          </div>
        </div>
      </div>

      {/* Route Legs Sequence */}
      <div className="route-legs-layout">
        <div className="legs-list-col">
          <h3 className="section-subheading">Turn-by-Turn Traverse Legs</h3>

          <div className="legs-stack">
            {EVA_ROUTE_LEGS.map((leg, idx) => {
              const isSelected = selectedLeg.id === leg.id;
              const isCaution = leg.slopeStatus === 'caution';

              return (
                <div
                  key={leg.id}
                  className={`leg-row-item ${isSelected ? 'active' : ''}`}
                  onClick={() => setSelectedLeg(leg)}
                >
                  <div className="leg-idx-pill">{idx + 1}</div>

                  <div className="leg-info-col">
                    <div className="leg-title-row">
                      <h4 className="leg-name">{leg.name}</h4>
                      {isCaution && (
                        <span className="caution-tag">
                          <AlertTriangle size={11} /> Slope Caution
                        </span>
                      )}
                    </div>
                    <p className="leg-desc">{leg.desc}</p>
                  </div>

                  <div className="leg-stats-col">
                    <span className="stat-pill dist">{leg.distance}</span>
                    <span className="stat-pill slope">{leg.slope}</span>
                    <span className="stat-pill time">{leg.timeEst}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Leg Detail & Terrain Cross-Section */}
        <div className="leg-detail-col">
          <h3 className="section-subheading">Active Leg Inspection</h3>

          <div className="leg-inspector-card">
            <div className="leg-inspector-top">
              <span className="inspector-badge">LEG #{EVA_ROUTE_LEGS.indexOf(selectedLeg) + 1}</span>
              <h4 className="inspector-leg-title">{selectedLeg.name}</h4>
            </div>

            <div className="inspector-metrics-grid">
              <div className="ins-metric">
                <span className="lbl">DISTANCE</span>
                <span className="val">{selectedLeg.distance}</span>
              </div>
              <div className="ins-metric">
                <span className="lbl">SURFACE INCLINE</span>
                <span className="val">{selectedLeg.slope}</span>
              </div>
              <div className="ins-metric">
                <span className="lbl">EST. TRAVERSE DURATION</span>
                <span className="val">{selectedLeg.timeEst}</span>
              </div>
              <div className="ins-metric">
                <span className="lbl">OXYGEN DRAW</span>
                <span className="val">{selectedLeg.o2Used}</span>
              </div>
            </div>

            <div className="crew-pairing-box">
              <div className="crew-header">
                <UserCheck size={14} className="text-accent" />
                <span>ASSIGNED CREW & ASSETS</span>
              </div>
              <div className="crew-roster">
                <div className="crew-member">
                  <span className="crew-callsign">EVA-1 (Lead)</span>
                  <span className="crew-task">Core Drilling & Sample Tube Sealing</span>
                </div>
                <div className="crew-member">
                  <span className="crew-callsign">EVA-2 (Safety)</span>
                  <span className="crew-task">Telemetry Monitor & Traverse Nav</span>
                </div>
                <div className="crew-member">
                  <span className="crew-callsign">Rover 01</span>
                  <span className="crew-task">Autonomous Staging & Tool Platform</span>
                </div>
              </div>
            </div>

            <button className="sim-hud-launch-btn" onClick={onOpenHUD}>
              <Play size={15} fill="white" />
              <span>Simulate Leg in Helmet HUD</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

