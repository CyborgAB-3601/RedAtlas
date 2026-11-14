import React, { useState } from 'react';
import { NASA_MISSIONS, getLocationById } from '../data/marsLocations';
import {
  Rocket,
  X,
  Check,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Compass,
  Sparkles,
  Mountain,
  Droplet,
  Users,
  Target,
  FileCheck2,
  Activity
} from 'lucide-react';

export default function MissionsModal({
  isOpen,
  onClose,
  activeMissionId,
  onSelectMission
}) {
  const [inspectedMission, setInspectedMission] = useState(null);

  if (!isOpen) return null;

  const handleSelectCard = (mission) => {
    // Open the comprehensive Mission Briefing Overlay
    setInspectedMission(mission);
  };

  const handleConfirmMission = () => {
    if (inspectedMission) {
      onSelectMission(inspectedMission);
      setInspectedMission(null);
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="missions-modal-card animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================= STAGE 1: MISSIONS LIST ================= */}
        {!inspectedMission && (
          <>
            <div className="modal-header-strip">
              <div className="modal-title-wrap">
                <div className="modal-badge">
                  <Rocket size={14} className="text-accent" />
                  <span>NASA SURFACE SCIENCE EXPEDITIONS</span>
                </div>
                <h2 className="modal-title">Select Martian Human Mission</h2>
                <p className="modal-desc">
                  Choose a high-priority exploration scenario synthesized from NASA rover and orbital mission data.
                </p>
              </div>

              <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
                <X size={18} />
              </button>
            </div>

            <div className="missions-grid">
              {NASA_MISSIONS.map((mission) => {
                const isCurrent = activeMissionId === mission.id;
                const loc = getLocationById(mission.targetLocationId);

                return (
                  <div
                    key={mission.id}
                    className={`mission-item-card ${isCurrent ? 'is-active' : ''}`}
                    onClick={() => handleSelectCard(mission)}
                  >
                    <div className="mission-card-media">
                      <img src={loc.landscapeImg} alt={mission.name} className="mission-img" />
                      <span className="mission-badge-chip">{mission.badge}</span>
                      <span className="mission-sol-chip">{mission.sol}</span>
                    </div>

                    <div className="mission-card-content">
                      <h3 className="mission-name">{mission.name}</h3>
                      <p className="mission-obj-text">{mission.objective}</p>

                      <div className="mission-specs-row">
                        <div className="spec-item">
                          <span className="s-label">EVA DURATION</span>
                          <span className="s-val">{mission.evaDuration}</span>
                        </div>
                        <div className="spec-item">
                          <span className="s-label">TRAVERSE DISTANCE</span>
                          <span className="s-val">{mission.distanceTraverse}</span>
                        </div>
                        <div className="spec-item">
                          <span className="s-label">PRIMARY MINERAL</span>
                          <span className="s-val">{mission.primaryMineral}</span>
                        </div>
                      </div>

                      <div className="mission-footer-action">
                        <span className="risk-tag">Safety Risk: {mission.riskLevel}</span>
                        <button className="select-mission-btn">
                          <span>Inspect Briefing</span>
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ================= STAGE 2: MISSION BRIEFING & OBJECTIVES OVERLAY ================= */}
        {inspectedMission && (
          <div className="mission-briefing-overlay animate-fade-in">
            {/* Overlay Top Bar */}
            <div className="briefing-top-bar">
              <button
                className="briefing-back-btn"
                onClick={() => setInspectedMission(null)}
              >
                <ArrowLeft size={15} />
                <span>Choose Another Mission</span>
              </button>

              <div className="briefing-sol-tag">
                <span className="pulse-blip" />
                <span>{inspectedMission.badge} • {inspectedMission.sol}</span>
              </div>

              <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
                <X size={18} />
              </button>
            </div>

            {/* Hero Landscape Card with Targeting Reticle */}
            <div className="briefing-hero-card">
              <img
                src={getLocationById(inspectedMission.targetLocationId).landscapeImg}
                alt={inspectedMission.name}
                className="briefing-hero-img"
              />
              <div className="briefing-hero-scrim" />

              <div className="briefing-hero-content">
                <div className="briefing-site-chip">
                  <Compass size={13} />
                  <span>TARGET: {getLocationById(inspectedMission.targetLocationId).name} ({getLocationById(inspectedMission.targetLocationId).coordsText})</span>
                </div>
                <h2 className="briefing-hero-title">{inspectedMission.name}</h2>
                <p className="briefing-hero-obj">{inspectedMission.objective}</p>
              </div>
            </div>

            {/* Structured Mission Objectives & Specifications Grid */}
            <div className="briefing-details-grid">
              {/* Left Column: All Detailed Objectives Checklist */}
              <div className="briefing-objectives-card">
                <div className="b-section-header">
                  <Target size={16} className="text-accent" />
                  <h3 className="b-section-title">Field Operational Objectives</h3>
                </div>

                <div className="objectives-checklist">
                  {inspectedMission.detailedObjectives?.map((obj, i) => (
                    <div key={i} className="objective-item">
                      <div className="obj-check-circle">
                        <Check size={12} />
                      </div>
                      <span className="obj-text">{obj}</span>
                    </div>
                  ))}
                </div>

                <div className="key-insights-box">
                  <span className="k-ins-title">SCIENTIFIC SIGNIFICANCE</span>
                  <ul className="k-ins-list">
                    {inspectedMission.keyInsights?.map((k, i) => (
                      <li key={i}>{k}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Right Column: Mission Logistics, Crew, and Safety Envelope */}
              <div className="briefing-logistics-card">
                <div className="b-section-header">
                  <ShieldCheck size={16} className="text-success" />
                  <h3 className="b-section-title">Mission Logistics & Safety Envelope</h3>
                </div>

                <div className="briefing-specs-list">
                  <div className="b-spec-row">
                    <span className="b-lbl">TOTAL TRAVERSE DISTANCE</span>
                    <span className="b-val">{inspectedMission.distanceTraverse}</span>
                  </div>
                  <div className="b-spec-row">
                    <span className="b-lbl">MAX EVA DURATION</span>
                    <span className="b-val">{inspectedMission.evaDuration}</span>
                  </div>
                  <div className="b-spec-row">
                    <span className="b-lbl">MAXIMUM TERRAIN INCLINE</span>
                    <span className="b-val">{inspectedMission.maxSlope}</span>
                  </div>
                  <div className="b-spec-row">
                    <span className="b-lbl">GCR RADIATION ENVIRONMENT</span>
                    <span className="b-val">{inspectedMission.radiationEnv}</span>
                  </div>
                  <div className="b-spec-row">
                    <span className="b-lbl">ASSIGNED CREW</span>
                    <span className="b-val">{inspectedMission.assignedCrew}</span>
                  </div>
                  <div className="b-spec-row">
                    <span className="b-lbl">SUPPORT ROBOTIC ASSETS</span>
                    <span className="b-val">{inspectedMission.supportAssets}</span>
                  </div>
                  <div className="b-spec-row">
                    <span className="b-lbl">SCIENTIFIC PAYLOAD</span>
                    <span className="b-val">{inspectedMission.payload}</span>
                  </div>
                  <div className="b-spec-row">
                    <span className="b-lbl">PRIMARY MINERALOGY</span>
                    <span className="b-val text-accent">{inspectedMission.primaryMineral}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Action Confirmation Strip */}
            <div className="briefing-action-footer">
              <button
                className="briefing-cancel-btn"
                onClick={() => setInspectedMission(null)}
              >
                Back to Missions
              </button>

              <button
                className="briefing-confirm-ok-btn"
                onClick={handleConfirmMission}
              >
                <Check size={16} />
                <span>Confirm & Load Mission to Overview [OK]</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
