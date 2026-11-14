import React, { useState, useEffect, useRef } from 'react';
import { Search, X, MapPin, ArrowRight, Loader2, Compass } from 'lucide-react';
import { searchMarsLocations, CURATED_TREK_LOCATIONS } from '../services/marsTrekSearch';

export default function SearchModal({ isOpen, onClose, onSelectLocation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(CURATED_TREK_LOCATIONS.slice(0, 10));
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults(CURATED_TREK_LOCATIONS.slice(0, 10));
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);

    const timer = setTimeout(async () => {
      try {
        const found = await searchMarsLocations(query, controller.signal);
        setResults(found);
      } catch (e) {
        // Ignored if aborted
      } finally {
        setIsLoading(false);
      }
    }, query.length >= 2 ? 220 : 0);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, isOpen]);

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
          {isLoading ? (
            <Loader2 size={18} className="search-modal-icon animate-spin" />
          ) : (
            <Search size={18} className="search-modal-icon" />
          )}
          <input
            type="text"
            className="search-modal-input"
            placeholder="Search Curiosity rover, Jezero, craters, NASA landmarks..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button
              className="search-clear-input-btn"
              onClick={() => setQuery('')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                marginRight: '8px'
              }}
            >
              <X size={14} />
            </button>
          )}
          <button className="search-modal-close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="search-modal-results custom-scrollbar">
          {results.length === 0 && !isLoading ? (
            <div className="no-results-msg">
              No Mars Trek locations or features matching "{query}"
            </div>
          ) : (
            results.map((item) => {
              const coordsDisplay = item.coordsText || (item.coords ? `${item.coords.lat}, ${item.coords.lng}` : '');
              const isRover = item.category?.toLowerCase().includes('rover') || item.name.toLowerCase().includes('rover');

              return (
                <div
                  key={item.id || item.name}
                  className="search-result-row"
                  onClick={() => {
                    onSelectLocation(item);
                    onClose();
                  }}
                >
                  <div className="result-icon-col">
                    {isRover ? (
                      <Compass size={16} style={{ color: '#FF5E3A' }} />
                    ) : (
                      <MapPin size={16} />
                    )}
                  </div>
                  <div className="result-details">
                    <div className="result-name">
                      {item.name}
                      {item.elevationVal && (
                        <span style={{ fontSize: '11px', opacity: 0.6, marginLeft: '8px', fontWeight: 400 }}>
                          {item.elevationVal}
                        </span>
                      )}
                    </div>
                    <div className="result-sub">
                      <span>{coordsDisplay}</span>
                      {item.category && (
                        <>
                          <span className="dot-sep">·</span>
                          <span className="cat-badge">{item.category}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <ArrowRight size={14} className="result-arrow" />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
