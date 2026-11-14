import React, { useState } from 'react';
import { SCIENCE_SAMPLES } from '../data/marsLocations';
import {
  BarChart2,
  Database,
  FlaskConical,
  Sparkles,
  Download,
  Search,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';

export default function DataView() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSamples = SCIENCE_SAMPLES.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.mineral.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="data-view-container animate-fade-in">
      {/* Top Header */}
      <div className="view-header-strip">
        <div className="view-title-group">
          <div className="view-badge">
            <Database size={13} className="text-accent" />
            <span>IN-SITU SCIENCE REGISTRY</span>
          </div>
          <h2 className="view-heading">Sample Collection & Instrument Telemetry</h2>
          <p className="view-subtext">
            Geological rock cores, volatile measurements, and ChemCam / SuperCam laser-induced breakdown spectra.
          </p>
        </div>

        <div className="search-box-pill">
          <Search size={14} className="text-muted" />
          <input
            type="text"
            placeholder="Search samples or minerals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-inner-input"
          />
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="data-kpi-grid">
        <div className="data-kpi-card">
          <span className="kpi-lbl">TOTAL CACHED CORES</span>
          <span className="kpi-num">3 Core Tubes</span>
          <span className="kpi-sub">Ready for Earth Ascent Vehicle</span>
        </div>
        <div className="data-kpi-card">
          <span className="kpi-lbl">SPECTRAL READINGS</span>
          <span className="kpi-num">1,482 Points</span>
          <span className="kpi-sub">CRISM + ChemCam LIBS</span>
        </div>
        <div className="data-kpi-card">
          <span className="kpi-lbl">VOLATILE CONTENT</span>
          <span className="kpi-num">4.8 wt% H₂O</span>
          <span className="kpi-sub">Bounded in sulfate minerals</span>
        </div>
        <div className="data-kpi-card">
          <span className="kpi-lbl">SAMPLE INTEGRITY</span>
          <span className="kpi-num text-success">100% Sealed</span>
          <span className="kpi-sub">Hermetic titanium seal nominal</span>
        </div>
      </div>

      {/* Samples Table */}
      <div className="samples-table-card">
        <div className="table-header-row">
          <h3 className="table-title">Martian Geological Core Inventory</h3>
          <span className="table-tag">PDS Archive Synchronized</span>
        </div>

        <div className="table-responsive">
          <table className="samples-table">
            <thead>
              <tr>
                <th>SAMPLE ID</th>
                <th>SAMPLE NAME</th>
                <th>DISCOVERY LOCATION</th>
                <th>MINERALOGICAL PROFILE</th>
                <th>MASS</th>
                <th>COLLECTION SOL</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filteredSamples.map((sample) => (
                <tr key={sample.id}>
                  <td className="font-mono text-accent">{sample.id}</td>
                  <td className="font-semibold">{sample.name}</td>
                  <td>{sample.location}</td>
                  <td>{sample.mineral}</td>
                  <td>{sample.mass}</td>
                  <td>{sample.solCollected}</td>
                  <td>
                    <span className="status-badge-chip">
                      <CheckCircle2 size={12} />
                      {sample.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

