import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MARS_LOCATIONS, getSmartMissionRoute, parseLatLng } from '../data/marsLocations';

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

const MarsTrekLeafletMap = forwardRef(function MarsTrekLeafletMap(
  {
    viewMode = 'Satellite',
    globalView = 'Mars Global View',
    selectedLocation,
    onSelectLocation,
    onZoomChange,
    onViewportChange,
    activeWaypoints = [],
    isExpanded = false,
    pinnedLocations = [],
    onRemovePin,
    activeMission = null,
    routeObjectives = [],
    missionStatus = 'Running',
    onCompleteMission,
    onOpenMissions
  },
  ref
) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersLayerRef = useRef(null);
  const routeLayerRef = useRef(null);

  const onViewportChangeRef = useRef(onViewportChange);
  useEffect(() => {
    onViewportChangeRef.current = onViewportChange;
  }, [onViewportChange]);

  const onZoomChangeRef = useRef(onZoomChange);
  useEffect(() => {
    onZoomChangeRef.current = onZoomChange;
  }, [onZoomChange]);

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
    invalidateSize: () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    },
    getZoom: () => mapInstanceRef.current?.getZoom() || 1
  }));

  // Automatic resize handling when expanded or container dims change
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const t0 = setTimeout(() => mapInstanceRef.current?.invalidateSize(), 10);
    const t1 = setTimeout(() => mapInstanceRef.current?.invalidateSize(), 150);
    const t2 = setTimeout(() => mapInstanceRef.current?.invalidateSize(), 350);
    const t3 = setTimeout(() => mapInstanceRef.current?.invalidateSize(), 550);
    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
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

  // 1. Initialize Leaflet Map once on mount with authentic Mars Trek Equirectangular CRS (EPSG:4326)
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

    // Track viewport for live camera bounding box on minimap
    const notifyViewport = () => {
      try {
        const bounds = map.getBounds();
        const center = map.getCenter();
        const zoom = map.getZoom();

        if (onViewportChangeRef.current) {
          onViewportChangeRef.current({
            north: bounds.getNorth(),
            south: bounds.getSouth(),
            west: bounds.getWest(),
            east: bounds.getEast(),
            centerLat: center.lat,
            centerLng: center.lng,
            zoom
          });
        }
      } catch (e) { }
    };

    map.on('move', notifyViewport);
    map.on('moveend', notifyViewport);
    map.on('zoomend', notifyViewport);

    // Initial trigger
    setTimeout(notifyViewport, 200);

    return () => {
      map.off('move', notifyViewport);
      map.off('moveend', notifyViewport);
      map.off('zoomend', notifyViewport);
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

    // 1. RENDER MAIN ATTRACTIONS & LANDMARKS AS DISTINCT POINTS (NO DEFAULT CONNECTING LINE!)
    locationsToRender.forEach((loc) => {
      if (!loc.coords?.lat || !loc.coords?.lng) return;
      const [lat, lng] = parseLatLng(loc.coords.lat, loc.coords.lng);
      const isSelected = selectedLocation?.id === loc.id;
      const isBase = loc.id === 'proposed_base';
      const isMissionObjective = activeMission && (
        activeMission.targetLocationId === loc.id ||
        (activeMission.id === 'gale_boxwork' && loc.id === 'gale') ||
        (activeMission.id === 'jezero_sample' && loc.id === 'jezero') ||
        (activeMission.id === 'olympus_shelter' && loc.id === 'olympus')
      );

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
          <div class="waypoint-marker standard-marker leaflet-custom-marker ${isSelected ? 'selected' : ''} ${isMissionObjective ? 'mission-target-marker' : ''}">
            <div class="waypoint-dot-outer ${isMissionObjective && missionStatus === 'Completed' ? 'completed' : ''}">
              <div class="waypoint-dot-inner"></div>
              ${isMissionObjective ? `
                <button class="mission-dot-x-btn" title="${missionStatus === 'Completed' ? 'Mission Finished' : 'Complete / Cancel Mission'}" data-mission-cancel="true">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              ` : ''}
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
        // Check if user clicked the X cancel / complete button on the mission objective pin
        const isCancelClick = e.originalEvent?.target?.closest('[data-mission-cancel="true"]');
        if (isCancelClick) {
          if (onCompleteMission) {
            onCompleteMission();
          }
          return;
        }

        if (onSelectLocation) {
          onSelectLocation(loc);
        }

        // Clicking the mission objective pin takes user to the Missions page showing status
        if (isMissionObjective && onOpenMissions) {
          onOpenMissions();
        }
      });

      markersGroup.addLayer(marker);
    });

    // 2. RENDER MISSION ROUTE FROM BASE TO OBJECTIVE (ONLY WHEN A MISSION IS ACTIVE)
    if (activeMission) {
      const smartRoute = getSmartMissionRoute(activeMission, routeObjectives);
      if (smartRoute && smartRoute.polylineCoords.length >= 2) {
        // Deep contrast path shadow
        const routeShadow = L.polyline(smartRoute.polylineCoords, {
          color: 'rgba(0, 0, 0, 0.65)',
          weight: 5,
          lineCap: 'round',
          lineJoin: 'round'
        });
        routeGroup.addLayer(routeShadow);

        // Authentic white animated dashed route line (just like before!)
        const routeLine = L.polyline(smartRoute.polylineCoords, {
          color: '#FFFFFF',
          weight: 2.5,
          dashArray: '4, 8',
          lineCap: 'round',
          lineJoin: 'round',
          className: 'leaflet-route-animated'
        });
        routeGroup.addLayer(routeLine);
      }
    }

    // 3. RENDER CUSTOM PINNED MARKERS FROM 3D GAUSSIAN SPLATTING
    if (pinnedLocations && pinnedLocations.length > 0) {
      pinnedLocations.forEach((pin) => {
        if (!pin.coords?.lat || !pin.coords?.lng) return;
        const [lat, lng] = parseLatLng(pin.coords.lat, pin.coords.lng);
        const isSelected = selectedLocation?.id === pin.id;

        const html = `
          <div class="custom-marked-pin-leaflet leaflet-custom-marker ${isSelected ? 'selected' : ''}">
            <div class="pin-beacon-pulse"></div>
            <div class="pin-beacon-core"></div>
            <div class="pin-tag-badge">
              <span class="pin-name-text">${pin.name}</span>
              <span class="pin-elev-text">${pin.elevationVal || ''}</span>
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          className: 'leaflet-custom-red-pin-wrapper',
          html,
          iconSize: [160, 40],
          iconAnchor: [12, 20]
        });

        const pinMarker = L.marker([lat, lng], { icon: customIcon });

        pinMarker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          if (onSelectLocation) {
            onSelectLocation(pin);
          }
        });

        markersGroup.addLayer(pinMarker);
      });
    }
  }, [activeWaypoints, selectedLocation?.id, onSelectLocation, activeMission, routeObjectives, pinnedLocations, missionStatus, onCompleteMission, onOpenMissions]);

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
