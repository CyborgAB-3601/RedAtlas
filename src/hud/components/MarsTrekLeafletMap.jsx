import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MARS_LOCATIONS } from '../data/marsHudData';

const TREK_LAYERS = {
  Satellite: {
    url: 'https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg',
    maxZoom: 7
  },
  Elevation: {
    url: 'https://trek.nasa.gov/tiles/Mars/EQ/Mars_MGS_MOLA_ClrShade_merge_global_463m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg',
    maxZoom: 7
  },
  Thermal: {
    url: 'https://trek.nasa.gov/tiles/Mars/EQ/THEMIS_DayIR_ControlledMosaics_100m_v2_oct2018/1.0.0/default/default028mm/{z}/{y}/{x}.png',
    maxZoom: 9
  }
};

function parseLatLng(latStr, lngStr) {
  if (typeof latStr === 'number' && typeof lngStr === 'number') {
    return [latStr, lngStr];
  }
  const latVal = parseFloat(String(latStr || '0')) * (String(latStr || '').includes('S') ? -1 : 1);
  const lngVal = parseFloat(String(lngStr || '0')) * (String(lngStr || '').includes('W') ? -1 : 1);
  return [latVal, lngVal];
}

const MarsTrekLeafletMap = forwardRef(function MarsTrekLeafletMap(
  {
    viewMode = 'Satellite',
    selectedLocation,
    onSelectLocation,
    onZoomChange,
    isExpanded = false
  },
  ref
) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersLayerRef = useRef(null);
  const routeLayerRef = useRef(null);

  const onZoomChangeRef = useRef(onZoomChange);
  useEffect(() => {
    onZoomChangeRef.current = onZoomChange;
  }, [onZoomChange]);

  // Expose map control methods to parent
  useImperativeHandle(ref, () => ({
    zoomIn: () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.zoomIn();
      }
    },
    zoomOut: () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.zoomOut();
      }
    },
    panBy: (dx, dy) => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.panBy([dx, dy], { animate: false });
      }
    },
    resetView: () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([0, -35], 1, { duration: 1.0 });
      }
    },
    flyToLocation: (lat, lng, zoom = 3) => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([lat, lng], zoom, { duration: 1.2 });
      }
    },
    invalidateSize: () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    },
    getZoom: () => mapInstanceRef.current?.getZoom() || 1
  }));

  // Handle ResizeObserver & expansion animation
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const t0 = setTimeout(() => mapInstanceRef.current?.invalidateSize(), 20);
    const t1 = setTimeout(() => mapInstanceRef.current?.invalidateSize(), 150);
    const t2 = setTimeout(() => mapInstanceRef.current?.invalidateSize(), 350);
    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isExpanded]);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    const ro = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });
    ro.observe(mapContainerRef.current);
    return () => ro.disconnect();
  }, []);

  // 1. Initialize Leaflet Map once with NASA Mars Trek Equirectangular CRS (EPSG:4326)
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialCfg = TREK_LAYERS[viewMode] || TREK_LAYERS.Satellite;

    const map = L.map(mapContainerRef.current, {
      crs: L.CRS.EPSG4326,
      center: [14.6, 32.3], // Centered at Proposed Base Site
      zoom: 2,
      minZoom: 0,
      maxZoom: initialCfg.maxZoom,
      zoomControl: false,
      attributionControl: false,
      maxBounds: [[-90, -180], [90, 180]],
      maxBoundsViscosity: 0.9,
      bounceAtZoomLimits: false,
      fadeAnimation: true
    });

    mapInstanceRef.current = map;

    map.on('zoomend', () => {
      if (onZoomChangeRef.current) {
        onZoomChangeRef.current(map.getZoom());
      }
    });

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;

    const routeGroup = L.layerGroup().addTo(map);
    routeLayerRef.current = routeGroup;

    setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      tileLayerRef.current = null;
    };
  }, []);

  // 2. Direct NASA JPL Mars Trek WMTS Tile Layer Streaming
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const cfg = TREK_LAYERS[viewMode] || TREK_LAYERS.Satellite;

    map.setMaxZoom(cfg.maxZoom);
    if (map.getZoom() > cfg.maxZoom) {
      map.setZoom(cfg.maxZoom);
    }

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const newTileLayer = L.tileLayer(cfg.url, {
      tileSize: 256,
      minZoom: 0,
      maxZoom: cfg.maxZoom,
      noWrap: true,
      bounds: [[-90, -180], [90, 180]],
      className: 'mars-trek-official-tile'
    });

    newTileLayer.addTo(map);
    tileLayerRef.current = newTileLayer;
  }, [viewMode]);

  // 3. Render Landmark Markers and Exploration Routes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    const routeGroup = routeLayerRef.current;
    if (!map || !markersGroup || !routeGroup) return;

    markersGroup.clearLayers();
    routeGroup.clearLayers();

    // Key Mars landmarks
    const landmarks = [
      {
        id: 'proposed_base',
        name: 'Proposed Base Site',
        coords: { lat: 14.6, lng: 32.3 },
        coordsText: '14.6° N, 32.3° E'
      },
      {
        id: 'olympus_mons',
        name: 'Olympus Mons',
        coords: { lat: 18.65, lng: -133.8 },
        coordsText: '18.7° N, 133.8° W'
      },
      {
        id: 'valles_marineris',
        name: 'Valles Marineris',
        coords: { lat: -13.9, lng: -59.2 },
        coordsText: '13.9° S, 59.2° W'
      },
      {
        id: 'jezero_crater',
        name: 'Jezero Crater',
        coords: { lat: 18.38, lng: 77.58 },
        coordsText: '18.4° N, 77.6° E'
      },
      {
        id: 'gale_crater',
        name: 'Gale Crater (Mount Sharp)',
        coords: { lat: -5.37, lng: 137.81 },
        coordsText: '5.4° S, 137.8° E'
      }
    ];

    const routeCoords = [];

    landmarks.forEach((loc) => {
      const [lat, lng] = parseLatLng(loc.coords.lat, loc.coords.lng);
      const isSelected = selectedLocation?.id === loc.id;
      const isBase = loc.id === 'proposed_base';

      routeCoords.push([lat, lng]);

      let html = '';
      let iconSize = [32, 32];
      let iconAnchor = [16, 16];

      if (isBase) {
        html = `
          <div class="base-site-marker leaflet-custom-marker ${isSelected ? 'selected' : ''}">
            <div class="base-static-ring inner"></div>
            <div class="base-static-ring outer"></div>
            <div class="base-pulse-ring"></div>
            <div class="base-core-dot"></div>
            <div class="base-callout-bubble">
              <div class="base-flag-circle">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
              </div>
              <div class="base-info-text">
                <span class="base-title-text">${loc.name}</span>
                <span class="base-coords-text">${loc.coordsText}</span>
              </div>
            </div>
          </div>
        `;
        iconSize = [180, 50];
        iconAnchor = [20, 25];
      } else {
        html = `
          <div class="waypoint-marker standard-marker leaflet-custom-marker ${isSelected ? 'selected' : ''}">
            <div class="waypoint-dot-outer">
              <div class="waypoint-dot-inner"></div>
            </div>
            <span class="waypoint-label">${loc.name}</span>
          </div>
        `;
        iconSize = [140, 32];
        iconAnchor = [10, 16];
      }

      const customIcon = L.divIcon({
        className: 'leaflet-marker-wrapper',
        html,
        iconSize,
        iconAnchor
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        if (onSelectLocation) {
          onSelectLocation(loc);
        }
      });

      markersGroup.addLayer(marker);
    });

    // Draw route connecting Chryse Chryse Chryse to Jezero and Gale
    if (routeCoords.length >= 2) {
      const routeLine = L.polyline(routeCoords, {
        color: '#00f0ff',
        weight: 2,
        dashArray: '4, 8',
        lineCap: 'round',
        lineJoin: 'round',
        className: 'leaflet-route-animated'
      });
      routeGroup.addLayer(routeLine);
    }
  }, [selectedLocation?.id, onSelectLocation]);

  return (
    <div
      ref={mapContainerRef}
      className="mars-trek-leaflet-viewport"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        background: '#09080A',
        overflow: 'hidden'
      }}
    />
  );
});

export default MarsTrekLeafletMap;
