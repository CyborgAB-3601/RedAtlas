import React, { useRef } from 'react';
import { ChevronDown, ChevronRight, ArrowUpRight } from 'lucide-react';

export default function KeyLocations({ onSelectLocation, selectedLocationId }) {
  const scrollRef = useRef(null);

  const locations = [
    {
      id: 'olympus',
      name: 'Olympus Mons',
      coords: '18.7° N, 133.8° W',
      elev: '21,287 m',
      img: '/assets/olympus_mons.jpg',
      subtitle: 'The largest volcano in the Solar System, rising 21 km high.',
      insights: [
        { title: 'Extreme Altitude', desc: 'Above 90% of Mars atmosphere' },
        { title: 'Volcanic Caldera', desc: 'Complex multi-ring depression' },
        { title: 'Lava Tubes', desc: 'Natural shielding possibilities' },
        { title: 'Solar Insolation', desc: '4.2 kWh/m²/day' }
      ]
    },
    {
      id: 'valles',
      name: 'Valles Marineris',
      coords: '14.0° S, 59.3° W',
      elev: '-7,000 m',
      img: '/assets/valles_marineris.jpg',
      subtitle: 'A colossal canyon system stretching over 4,000 km across the equator.',
      insights: [
        { title: 'Atmospheric Pressure', desc: 'Highest on Martian surface' },
        { title: 'Exposed Stratigraphy', desc: 'Billions of years of geology' },
        { title: 'Morning Fog / Frost', desc: 'Transient water vapor observed' },
        { title: 'Thermal Moderation', desc: 'Shielded deep chasms' }
      ]
    },
    {
      id: 'gale',
      name: 'Gale Crater',
      coords: '5.4° S, 137.8° E',
      elev: '-4,500 m',
      img: '/assets/gale_crater.jpg',
      subtitle: 'Ancient lake basin investigated extensively by Curiosity rover.',
      insights: [
        { title: 'Mudstone Sediments', desc: 'Evidence of ancient fresh water' },
        { title: 'Mount Sharp', desc: '5 km tall central sediment mound' },
        { title: 'Organics Detected', desc: 'Preserved organic molecules' },
        { title: 'Habitability Windows', desc: 'Long-duration aqueous history' }
      ]
    },
    {
      id: 'jezero',
      name: 'Jezero Crater',
      coords: '18.4° N, 77.6° E',
      elev: '-2,500 m',
      img: '/assets/jezero_crater.jpg',
      subtitle: 'Site of Mars 2020 Perseverance exploration with prominent delta deposit.',
      insights: [
        { title: 'River Delta Fan', desc: 'Prime biosignature preservation' },
        { title: 'Carbonate Minerals', desc: 'Aqueous chemical indicators' },
        { title: 'Sample Depot', desc: 'Cached core samples stored' },
        { title: 'Subsurface Radar', desc: 'Stratified sedimentary beds' }
      ]
    }
  ];

  const handleScrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 240, behavior: 'smooth' });
    }
  };

  return (
    <div className="key-locations-container">
      {/* Header Row */}
      <div className="key-locations-header">
        <button className="locations-title-btn">
          <span className="title-text">Key Locations</span>
          <ChevronDown size={15} />
        </button>

        <button
          className="carousel-nav-btn"
          onClick={handleScrollRight}
          aria-label="Scroll right"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Cards List */}
      <div className="locations-cards-track" ref={scrollRef}>
        {locations.map((loc) => {
          const isSelected = selectedLocationId === loc.id;
          return (
            <div
              key={loc.id}
              className={`location-card-item ${isSelected ? 'active' : ''}`}
              onClick={() => onSelectLocation(loc)}
            >
              <div className="location-card-image-wrap">
                <img
                  src={loc.img || '/assets/mars_base_site.jpg'}
                  alt={loc.name}
                  className="location-card-img"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/assets/mars_base_site.jpg';
                  }}
                />
              </div>

              <div className="location-card-info">
                <div className="loc-text-col">
                  <h4 className="loc-card-name">{loc.name}</h4>
                  <span className="loc-card-coords">{loc.coords}</span>
                </div>

                <button
                  className="loc-card-arrow-btn"
                  aria-label={`View details of ${loc.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectLocation(loc);
                  }}
                >
                  <ArrowUpRight size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
