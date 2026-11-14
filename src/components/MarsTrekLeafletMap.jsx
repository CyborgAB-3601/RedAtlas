import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MARS_LOCATIONS } from '../data/marsLocations';

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
  const latVal = parseFloat(latStr) * (latStr.includes('S') ? -1 : 1);
  const lngVal = parseFloat(lngStr) * (lngStr.includes('W') ? -1 : 1);
  return [latVal, lngVal];
}

const MarsTrekLeafletMap = forwardRef(function MarsTrekLeafletMap(
  {
    viewMode = 'Satellite',
    globalView = 'Mars Global View',
    selectedLocation,
    onSelectLocation,
    onZoomChange,
    activeWaypoints = []
  },
  ref
) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersLayerRef = useRef(null);
  const routeLayerRef = useRef(null);

  // Expose map control methods to parent (MarsMap controls)
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
    getZoom: () => mapInstanceRef.current?.getZoom() || 1
  }));

  // 1. Initialize Leaflet Map with authentic Mars Trek Equirectangular CRS (EPSG:4326)
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialCfg = TREK_LAYERS[viewMode] || TREK_LAYERS.Satellite;

    const map = L.map(mapContainerRef.current, {
      crs: L.CRS.EPSG4326,
      center: [0, -35],
      zoom: 1,
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
      if (onZoomChange) {
        onZoomChange(map.getZoom());
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

  // 2. Direct NASA JPL Mars Trek WMTS Tile Layer: live tiles streaming without obstruction
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const cfg = TREK_LAYERS[viewMode] || TREK_LAYERS.Satellite;

    // Dynamically update map maxZoom limit based on active layer
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

  // 3. Handle Regional Views / Fly-to Presets
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    switch (globalView) {
      case 'Equatorial Basin':
        map.flyTo([-14.0, -59.3], 3, { duration: 1.2, easeLinearity: 0.25 });
        break;
      case 'Polar Ice Caps':
        map.flyTo([78.0, 45.0], 3, { duration: 1.2, easeLinearity: 0.25 });
        break;
      case 'Tharsis Rise':
        map.flyTo([18.7, -133.8], 3, { duration: 1.2, easeLinearity: 0.25 });
        break;
      case 'Mars Global View':
      default:
        map.flyTo([0, -35], 1, { duration: 1.2, easeLinearity: 0.25 });
        break;
    }
  }, [globalView]);

  // 4. Update Markers & Route Overlay
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    const routeGroup = routeLayerRef.current;
    if (!map || !markersGroup || !routeGroup) return;

    markersGroup.clearLayers();
    routeGroup.clearLayers();

    const baseLocations = (activeWaypoints && activeWaypoints.length > 0)
      ? activeWaypoints.map((wp) => MARS_LOCATIONS[wp.id] || wp).filter(Boolean)
      : Object.values(MARS_LOCATIONS);

    // Ensure selected location (including from search) is always rendered and visible on map
    const locationsToRender = [...baseLocations];
    if (selectedLocation?.id && !locationsToRender.some((l) => l.id === selectedLocation.id)) {
      locationsToRender.push(selectedLocation);
    }

    const routeCoords = [];

    locationsToRender.forEach((loc) => {
      if (!loc.coords?.lat || !loc.coords?.lng) return;
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
                <span class="base-coords-text">${loc.coordsText || ''}</span>
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

    // Draw route connecting exploration sites
    if (routeCoords.length >= 2) {
      const routeShadow = L.polyline(routeCoords, {
        color: 'rgba(0, 0, 0, 0.65)',
        weight: 5,
        lineCap: 'round',
        lineJoin: 'round'
      });
      routeGroup.addLayer(routeShadow);

      const routeLine = L.polyline(routeCoords, {
        color: '#FFFFFF',
        weight: 2.5,
        dashArray: '4, 8',
        lineCap: 'round',
        lineJoin: 'round',
        className: 'leaflet-route-animated'
      });
      routeGroup.addLayer(routeLine);
    }
  }, [activeWaypoints, selectedLocation?.id, onSelectLocation]);

  // 5. Smoothly fly to selected location on map when selectedLocation changes (from search or clicks)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedLocation?.coords?.lat || !selectedLocation?.coords?.lng) return;

    const [lat, lng] = parseLatLng(selectedLocation.coords.lat, selectedLocation.coords.lng);
    const targetZoom = Math.min(map.getMaxZoom(), Math.max(map.getZoom(), 4));
    map.flyTo([lat, lng], targetZoom, {
      duration: 1.5,
      easeLinearity: 0.25
    });
  }, [selectedLocation?.id, selectedLocation?.coords?.lat, selectedLocation?.coords?.lng]);

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
