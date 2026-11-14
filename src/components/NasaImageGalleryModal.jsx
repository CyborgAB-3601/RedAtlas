import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ExternalLink, Camera, Calendar, Building2, Tag, Loader2 } from 'lucide-react';
import { fetchNasaPlaceOfficialImages } from '../services/nasaPlaceService';

export default function NasaImageGalleryModal({
  isOpen,
  onClose,
  location
}) {
  const [images, setImages] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const placeName = location?.name || 'Mars Exploration Site';

  useEffect(() => {
    if (!isOpen || !location) return;

    let isMounted = true;
    setIsLoading(true);

    // If location already has cached official images, use them immediately
    if (location.officialImages && location.officialImages.length > 0) {
      setImages(location.officialImages);
      setSelectedIndex(0);
      setIsLoading(false);
      return;
    }

    // Otherwise fetch live from NASA Image & Video Library
    fetchNasaPlaceOfficialImages(placeName)
      .then((fetched) => {
        if (!isMounted) return;
        if (fetched && fetched.length > 0) {
          setImages(fetched);
        } else {
          // Fallback to local high-res assets
          const fallbacks = [
            {
              id: 'local_1',
              title: `${placeName} - Mars Trek Reconnaissance`,
              description: location.desc || 'High-resolution surface observation from NASA JPL Mars Trek.',
              nasaId: 'NASA-JPL-TREK',
              date: '2024-Archive',
              center: 'JPL',
              thumbUrl: location.landscapeImg || location.satelliteImg || '/assets/mars_expanded_terrain.jpg',
              largeUrl: location.landscapeImg || location.satelliteImg || '/assets/mars_expanded_terrain.jpg',
              origUrl: location.landscapeImg || location.satelliteImg || '/assets/mars_expanded_terrain.jpg',
              source: 'NASA JPL Mars Trek'
            },
            {
              id: 'local_2',
              title: `${placeName} - Topographical Relief`,
              description: 'MOLA color shaded elevation terrain map cataloged by USGS Astrogeology.',
              nasaId: 'MGS-MOLA-USGS',
              date: '2023-Archive',
              center: 'USGS Astrogeology',
              thumbUrl: '/assets/nasa_jpl_marstrek_elevation_4k.jpg',
              largeUrl: '/assets/nasa_jpl_marstrek_elevation_4k.jpg',
              origUrl: '/assets/nasa_jpl_marstrek_elevation_4k.jpg',
              source: 'USGS / NASA Mars Trek'
            },
            {
              id: 'local_3',
              title: `${placeName} - Viking MDIM 2.1 Satellite Mosaic`,
              description: 'Global 232m color mosaic processed by the United States Geological Survey.',
              nasaId: 'Viking-MDIM21',
              date: 'USGS-Catalog',
              center: 'USGS',
              thumbUrl: '/assets/nasa_jpl_marstrek_satellite_4k.jpg',
              largeUrl: '/assets/nasa_jpl_marstrek_satellite_4k.jpg',
              origUrl: '/assets/nasa_jpl_marstrek_satellite_4k.jpg',
              source: 'USGS / NASA JPL'
            }
          ];
          setImages(fallbacks);
        }
        setSelectedIndex(0);
        setIsLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, location, placeName]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') {
        setSelectedIndex((prev) => (images.length > 0 ? (prev + 1) % images.length : 0));
      }
      if (e.key === 'ArrowLeft') {
        setSelectedIndex((prev) => (images.length > 0 ? (prev - 1 + images.length) % images.length : 0));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, images.length, onClose]);

  if (!isOpen) return null;

  const currentImage = images[selectedIndex] || {};

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 120 }}>
      <div
        className="nasa-gallery-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '92vw',
          maxWidth: '1100px',
          height: '88vh',
          maxHeight: '820px',
          background: 'rgba(12, 14, 18, 0.96)',
          border: '1px solid rgba(255, 255, 255, 0.16)',
          backdropFilter: 'blur(24px)',
          borderRadius: '16px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.85)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Top Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.10)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.02)'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                style={{
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono, monospace)',
                  letterSpacing: '0.12em',
                  color: '#FF5E3A',
                  background: 'rgba(255, 94, 58, 0.14)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  textTransform: 'uppercase',
                  fontWeight: 600
                }}
              >
                Official NASA / USGS / Mars Trek Archive
              </span>
              <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.45)' }}>•</span>
              <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.70)' }}>
                {images.length} Imagery Assets
              </span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#FFFFFF', margin: 0, letterSpacing: '-0.01em' }}>
              {placeName}
            </h2>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              padding: '8px',
              color: '#FFFFFF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Main Content Area */}
        {isLoading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
            <Loader2 size={36} className="animate-spin" style={{ color: '#FF5E3A' }} />
            <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.65)', letterSpacing: '0.04em' }}>
              Fetching official imagery from NASA Image and Video Library & Mars Trek...
            </span>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {/* Hero Main Viewer */}
            <div
              style={{
                flex: 1,
                position: 'relative',
                background: '#050608',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}
            >
              <img
                key={currentImage.id || selectedIndex}
                src={currentImage.largeUrl || currentImage.thumbUrl || location?.landscapeImg || '/assets/mars_expanded_terrain.jpg'}
                alt={currentImage.title || placeName}
                onError={(e) => {
                  // Graceful fallback waterfall: try thumb, then location image, then local high-res asset
                  if (currentImage.thumbUrl && e.currentTarget.src !== currentImage.thumbUrl) {
                    e.currentTarget.src = currentImage.thumbUrl;
                  } else if (location?.landscapeImg && e.currentTarget.src !== location.landscapeImg) {
                    e.currentTarget.src = location.landscapeImg;
                  } else {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/assets/mars_expanded_terrain.jpg';
                  }
                }}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  transition: 'opacity 0.25s ease-in-out'
                }}
              />

              {/* Prev / Next Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedIndex((prev) => (prev - 1 + images.length) % images.length)}
                    style={{
                      position: 'absolute',
                      left: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'rgba(12, 14, 18, 0.75)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '50%',
                      width: '42px',
                      height: '42px',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      backdropFilter: 'blur(8px)',
                      zIndex: 10
                    }}
                    title="Previous photo (Left Arrow)"
                  >
                    <ChevronLeft size={22} />
                  </button>

                  <button
                    onClick={() => setSelectedIndex((prev) => (prev + 1) % images.length)}
                    style={{
                      position: 'absolute',
                      right: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'rgba(12, 14, 18, 0.75)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '50%',
                      width: '42px',
                      height: '42px',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      backdropFilter: 'blur(8px)',
                      zIndex: 10
                    }}
                    title="Next photo (Right Arrow)"
                  >
                    <ChevronRight size={22} />
                  </button>
                </>
              )}

              {/* Bottom Image Metadata Overlay */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(to top, rgba(8, 10, 14, 0.95) 0%, rgba(8, 10, 14, 0.75) 60%, transparent 100%)',
                  padding: '24px 28px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  gap: '20px'
                }}
              >
                <div style={{ maxWidth: '78%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    {currentImage.nasaId && (
                      <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono, monospace)', background: 'rgba(255,255,255,0.12)', padding: '2px 8px', borderRadius: '4px', color: '#FFFFFF', fontWeight: 600 }}>
                        {currentImage.nasaId}
                      </span>
                    )}
                    {currentImage.date && (
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} /> {currentImage.date}
                      </span>
                    )}
                    {currentImage.center && (
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Building2 size={12} /> {currentImage.center}
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#FFFFFF', margin: '0 0 6px 0', lineHeight: 1.3 }}>
                    {currentImage.title}
                  </h3>

                  <p
                    style={{
                      fontSize: '12px',
                      color: 'rgba(255, 255, 255, 0.75)',
                      margin: 0,
                      lineHeight: 1.45,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                    title={currentImage.description}
                  >
                    {currentImage.description}
                  </p>
                </div>

                <a
                  href={currentImage.origUrl || currentImage.largeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: 'rgba(255, 94, 58, 0.90)',
                    color: '#FFFFFF',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 4px 12px rgba(255, 94, 58, 0.35)'
                  }}
                >
                  <span>Full Resolution</span>
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>

            {/* Bottom Horizontal Thumbnail Strip */}
            <div
              className="custom-scrollbar"
              style={{
                height: '92px',
                padding: '10px 16px',
                background: 'rgba(16, 18, 24, 0.95)',
                borderTop: '1px solid rgba(255, 255, 255, 0.10)',
                display: 'flex',
                gap: '10px',
                overflowX: 'auto',
                alignItems: 'center'
              }}
            >
              {images.map((img, idx) => {
                const isSelected = selectedIndex === idx;
                return (
                  <button
                    key={img.id || idx}
                    onClick={() => setSelectedIndex(idx)}
                    style={{
                      flex: '0 0 100px',
                      height: '68px',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      position: 'relative',
                      border: isSelected ? '2px solid #FF5E3A' : '1px solid rgba(255, 255, 255, 0.12)',
                      background: '#090A0E',
                      cursor: 'pointer',
                      padding: 0,
                      opacity: isSelected ? 1 : 0.65,
                      transition: 'all 0.2s',
                      transform: isSelected ? 'scale(1.04)' : 'none'
                    }}
                  >
                    <img
                      src={img.thumbUrl || img.largeUrl || '/assets/mars_base_site.jpg'}
                      alt={img.title}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/assets/mars_base_site.jpg';
                      }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: 'rgba(0,0,0,0.7)',
                        fontSize: '9px',
                        color: '#FFF',
                        padding: '2px 4px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {idx + 1}. {img.title}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

