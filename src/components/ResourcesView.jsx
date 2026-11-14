import React from 'react';
import {
  Layers,
  Database,
  ExternalLink,
  Droplet,
  Sun,
  ShieldCheck,
  Sparkles,
  BookOpen,
  Cpu
} from 'lucide-react';

export default function ResourcesView() {
  const predictedResources = [
    {
      title: 'NASA Planetary Data System (PDS) Geosciences Node',
      category: 'Orbital & Surface Archive',
      description: 'The definitive repository for MGS MOLA, MRO HiRISE DTMs, CRISM spectral cubes, and Curiosity/Perseverance instrument archives.',
      url: 'https://pds-geosciences.wustl.edu',
      relevance: 'Primary source for sub-meter surface topography, elevation models, and laser spectral breakdowns.'
    },
    {
      title: 'JPL Mars Trek (NASA Solar System Treks)',
      category: 'GIS & Planetary Mapping',
      description: 'NASA/JPL browser-based portal providing layered global and regional mosaics with bookmarks of rover traverses.',
      url: 'https://trek.nasa.gov/mars',
      relevance: 'Benchmark regional mapping tool cited in the NASA challenge statement.'
    },
    {
      title: 'USGS Astrogeology Planetary Geologic Mapping',
      category: 'Stratigraphy & Geological Maps',
      description: 'Peer-reviewed USGS scientific investigation maps detailing chronostratigraphy, volcanic units, and crater ages.',
      url: 'https://astrogeology.usgs.gov/maps/mars',
      relevance: 'Essential for understanding regional stratigraphy and deep crustal formation.'
    },
    {
      title: 'NASA CCMC / DONKI (Space Weather Database)',
      category: 'Radiation & Solar Events',
      description: 'Community Coordinated Modeling Center tracking Coronal Mass Ejections (CMEs) and Solar Energetic Particle events.',
      url: 'https://ccmc.gsfc.nasa.gov',
      relevance: 'Direct inputs for real-time astronaut radiation safety warnings.'
    },
    {
      title: 'NASA Mars 2020 Perseverance & MSL Curiosity Raw Feeds',
      category: 'Rover Surface Imagery (POV)',
      description: 'Public feeds of Mastcam-Z, Navcam, and SuperCam Remote Micro-Imager (RMI) high-resolution panoramas.',
      url: 'https://mars.nasa.gov/mars2020/multimedia/raw-images',
      relevance: 'Provides ground-truth Point-of-View perspectives for astronauts approaching sampling targets.'
    }
  ];

  return (
    <div className="resources-view-container animate-fade-in">
      {/* Top Header */}
      <div className="view-header-strip">
        <div className="view-title-group">
          <div className="view-badge">
            <BookOpen size={13} className="text-accent" />
            <span>HACKATHON SCIENCE & DATA ARCHIVE</span>
          </div>
          <h2 className="view-heading">NASA Mission Resources & ISRU Viability</h2>
          <p className="view-subtext">
            Curated and predicted NASA science datasets, planetary GIS endpoints, and In-Situ Resource Utilization metrics.
          </p>
        </div>
      </div>

      {/* ISRU Metrics Strip */}
      <div className="isru-metrics-grid">
        <div className="isru-card">
          <div className="isru-icon-wrap text-info">
            <Droplet size={20} />
          </div>
          <div className="isru-info">
            <span className="isru-lbl">WATER EXTRACTION VIABILITY</span>
            <span className="isru-val">84 L / m³ Regolith</span>
            <span className="isru-desc">Hydrated sulfate & subsurface permafrost extraction at Chryse & Jezero</span>
          </div>
        </div>

        <div className="isru-card">
          <div className="isru-icon-wrap text-accent">
            <Sun size={20} />
          </div>
          <div className="isru-info">
            <span className="isru-lbl">PHOTOVOLTAIC INSOLATION</span>
            <span className="isru-val">5.8 kWh / m² / Sol</span>
            <span className="isru-desc">Optimal equatorial panel efficiency during non-storm seasons</span>
          </div>
        </div>

        <div className="isru-card">
          <div className="isru-icon-wrap text-warning">
            <Cpu size={20} />
          </div>
          <div className="isru-info">
            <span className="isru-lbl">REGOLITH SINTERING INTEGRITY</span>
            <span className="isru-val">42 MPa Compressive</span>
            <span className="isru-desc">Basaltic regolith microwaving for landing pad and habitat wall radiation blocks</span>
          </div>
        </div>
      </div>

      {/* NASA Science Datasets Directory */}
      <div className="resources-list-card">
        <h3 className="section-subheading">Predicted NASA Hackathon Databases & APIs</h3>

        <div className="resources-stack">
          {predictedResources.map((res, idx) => (
            <div key={idx} className="resource-item-row">
              <div className="resource-meta-col">
                <div className="res-top-line">
                  <h4 className="res-title">{res.title}</h4>
                  <span className="res-cat-tag">{res.category}</span>
                </div>
                <p className="res-desc">{res.description}</p>
                <div className="res-rel-box">
                  <span className="rel-lbl">Hackathon Integration:</span>
                  <span className="rel-val">{res.relevance}</span>
                </div>
              </div>

              <div className="resource-action-col">
                <a
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="resource-external-link"
                >
                  <span>Access Archive</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

