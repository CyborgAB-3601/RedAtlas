import React, { useState, useEffect } from 'react';
import { Search, X, MapPin, Compass, ArrowRight } from 'lucide-react';

export default function SearchModal({ isOpen, onClose, onSelectLocation }) {
  const [query, setQuery] = useState('');

  const searchResults = [
    { name: 'Proposed Base Site', coords: '14.6° N, 32.3° E', category: 'Planned Mission', id: 'proposed_base' },
    { name: 'Olympus Mons', coords: '18.7° N, 133.8° W', category: 'Shield Volcano', id: 'olympus' },
    { name: 'Valles Marineris', coords: '14.0° S, 59.3° W', category: 'Chasma System', id: 'valles' },
    { name: 'Gale Crater', coords: '5.4° S, 137.8° E', category: 'Impact Crater', id: 'gale' },
    { name: 'Jezero Crater', coords: '18.4° N, 77.6° E', category: 'Paleolake Basin', id: 'jezero' },
    { name: 'Elysium Planitia', coords: '3.0° N, 154.7° E', category: 'Volcanic Plain', id: 'elysium' },
    { name: 'Hellas Planitia', coords: '42.7° S, 70.0° E', category: 'Impact Basin', id: 'hellas' }
  ];

  const filtered = searchResults.filter(
    (item) =>
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase()) ||
      item.coords.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="search-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="search-modal-header">
          <Search size={18} className="search-modal-icon" />
          <input
            type="text"
            className="search-modal-input"
            placeholder="Search craters, canyons, landing coordinates..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button className="search-modal-close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="search-modal-results">
          {filtered.length === 0 ? (
            <div className="no-results-msg">No locations matching "{query}"</div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.name}
                className="search-result-row"
                onClick={() => {
                  onSelectLocation(item);
                  onClose();
                }}
              >
                <div className="result-icon-col">
                  <MapPin size={16} />
                </div>
                <div className="result-details">
                  <div className="result-name">{item.name}</div>
                  <div className="result-sub">
                    <span>{item.coords}</span>
                    <span className="dot-sep">·</span>
                    <span className="cat-badge">{item.category}</span>
                  </div>
                </div>
                <ArrowRight size={14} className="result-arrow" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
