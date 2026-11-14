import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MarsMap from './components/MarsMap';
import DetailPanel from './components/DetailPanel';
import SearchModal from './components/SearchModal';
import SimulationModal from './components/SimulationModal';
import MissionsModal from './components/MissionsModal';
import WaypointsView from './components/WaypointsView';
import LayersView from './components/LayersView';
import ConditionsView from './components/ConditionsView';
import TerrainView from './components/TerrainView';
import ResourcesView from './components/ResourcesView';
import {
  MARS_LOCATIONS,
  NASA_MISSIONS,
  getLocationById
} from './data/marsLocations';
import { enrichLocationWithOfficialData } from './services/nasaPlaceService';

// Lazy-load the RedAtlas Astronaut Helmet HUD for instant initial load and code-splitting
const HudApp = React.lazy(() => import('./hud/HudApp'));

export default function App() {
  const [activeNav, setActiveNav] = useState('Map');
  const [activeSection, setActiveSection] = useState('Overview');
  const [viewMode, setViewMode] = useState('Satellite');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSimOpen, setIsSimOpen] = useState(false);
  const [isMissionsOpen, setIsMissionsOpen] = useState(false);
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  // Astronaut Visor HUD mode (RedAtlas HUD)
  const [showHud, setShowHud] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.location.hash === '#hud' || window.location.pathname === '/hud';
    }
    return false;
  });

  const handleOpenHud = () => {
    setShowHud(true);
    if (typeof window !== 'undefined' && window.location.hash !== '#hud') {
      window.history.pushState({ view: 'hud' }, '', '#hud');
    }
  };

  const handleCloseHud = () => {
    setShowHud(false);
    if (typeof window !== 'undefined' && window.location.hash === '#hud') {
      window.history.pushState({ view: 'atlas' }, '', '#');
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setShowHud(window.location.hash === '#hud' || window.location.pathname === '/hud');
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  // Dynamic secondary objectives added to the active mission route
  const [routeObjectives, setRouteObjectives] = useState([]);

  // Active mission scenario and execution status ('Running' | 'Completed')
  const [activeMission, setActiveMission] = useState(NASA_MISSIONS[0]);
  const [missionStatus, setMissionStatus] = useState('Running');

  // Theme state: default to 'dark' or saved
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('red_atlas_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (e) { }
    return 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('red_atlas_theme', theme);
    } catch (e) { }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Default location: Proposed Base Site
  const [selectedLocation, setSelectedLocation] = useState(MARS_LOCATIONS.proposed_base);

  // Custom pinned exploration sites created from 3D Gaussian Splats (In-memory session only; no localStorage persistence)
  const [pinnedLocations, setPinnedLocations] = useState([]);
  // Currently active focused pin to temporarily display on the 2D satellite map
  const [activeSatellitePin, setActiveSatellitePin] = useState(null);

  const handleAddPinnedLocation = (newPin) => {
    setPinnedLocations((prev) => [newPin, ...prev.filter((p) => p.id !== newPin.id)]);
  };

  const handleRemovePinnedLocation = (pinId) => {
    setPinnedLocations((prev) => prev.filter((p) => p.id !== pinId));
    if (activeSatellitePin?.id === pinId) {
      setActiveSatellitePin(null);
    }
  };

  const handleToggleAddToRoute = (loc) => {
    if (!loc) return;
    setRouteObjectives((prev) => {
      const exists = prev.some((o) => o.id === loc.id);
      if (exists) {
        return prev.filter((o) => o.id !== loc.id);
      }
      return [...prev, loc];
    });
  };

  const isLocationInRoute = (locId) => {
    if (!locId) return false;
    if (activeMission && (
      activeMission.targetLocationId === locId ||
      (activeMission.id === 'gale_boxwork' && locId === 'gale') ||
      (activeMission.id === 'jezero_sample' && locId === 'jezero') ||
      (activeMission.id === 'olympus_shelter' && locId === 'olympus')
    )) {
      return true;
    }
    return routeObjectives.some((o) => o.id === locId);
  };

  const handleRemoveFromRoute = (loc) => {
    const targetId = loc?.id || selectedLocation?.id;
    if (!targetId) return;
    setRouteObjectives((prev) => prev.filter((o) => o.id !== targetId));
    if (activeMission && (
      activeMission.targetLocationId === targetId ||
      (activeMission.id === 'gale_boxwork' && targetId === 'gale') ||
      (activeMission.id === 'jezero_sample' && targetId === 'jezero') ||
      (activeMission.id === 'olympus_shelter' && targetId === 'olympus')
    )) {
      setActiveMission(null);
    }
  };

  const handleSelectLocation = (loc) => {
    if (!loc) return;
    let fullLoc;
    if (typeof loc === 'string') {
      fullLoc = getLocationById(loc);
    } else if (loc.id && MARS_LOCATIONS[loc.id]) {
      fullLoc = MARS_LOCATIONS[loc.id];
    } else {
      fullLoc = loc;
    }
    setSelectedLocation(fullLoc);
    setActiveNav('Map');
    setActiveSection('Overview');

    // Automatically fetch real official NASA / USGS images & data for the selected place
    enrichLocationWithOfficialData(fullLoc).then((enriched) => {
      if (enriched && enriched.id === fullLoc.id) {
        setSelectedLocation((prev) => (prev?.id === fullLoc.id ? { ...prev, ...enriched } : prev));
      }
    });
  };

  const handleSelectMission = (mission) => {
    setActiveMission(mission);
    setMissionStatus('Running');
    setRouteObjectives([]); // Fresh smart route starting from base to mission objective
    handleSelectLocation(mission.targetLocationId);
    setActiveNav('Map');
    setActiveSection('Overview');
  };

  const handleNavClick = (navItem) => {
    if (navItem === 'Missions') {
      setIsMissionsOpen(true);
      return;
    }
    setActiveNav(navItem);
    // If user clicked Map, return to current sidebar section
    if (navItem === 'Map' && !['Overview', 'Waypoints', 'Layers', 'Conditions', '3D Terrain'].includes(activeSection)) {
      setActiveSection('Overview');
    }
  };

  const handleSidebarClick = (sectionId) => {
    setActiveSection(sectionId);
    setActiveNav('Map');
    // If navigating to another sidebar module, collapse expanded map mode
    if (sectionId !== 'Overview') {
      setIsMapExpanded(false);
    }
  };

  // Determine which central content to render
  const renderCenterContent = () => {
    // If top header has a dedicated full-page selected (Data, Planning, Resources)
    if (activeNav === 'Data') {
      return (
        <div className="center-page-card custom-scrollbar">
          <DataView />
        </div>
      );
    }
    if (activeNav === 'Planning') {
      return (
        <div className="center-page-card custom-scrollbar">
          <PlanningView onOpenHUD={handleOpenHud} />
        </div>
      );
    }
    if (activeNav === 'Resources') {
      return (
        <div className="center-page-card custom-scrollbar">
          <ResourcesView />
        </div>
      );
    }

    // Otherwise, render based on active sidebar section
    switch (activeSection) {
      case 'Waypoints':
        return (
          <div className="center-page-card custom-scrollbar">
            <WaypointsView
              selectedLocation={selectedLocation}
              onSelectWaypoint={(wp) => handleSelectLocation(wp.locationId)}
              onOpenHUD={handleOpenHud}
            />
          </div>
        );
      case 'Layers':
        return (
          <div className="center-page-card custom-scrollbar">
            <LayersView selectedLocation={selectedLocation} />
          </div>
        );
      case 'Conditions':
        return (
          <div className="center-page-card custom-scrollbar">
            <ConditionsView />
          </div>
        );
      case '3D Terrain':
        return (
          <div className={`center-page-card custom-scrollbar ${isMapExpanded ? 'terrain-expanded-card' : ''}`}>
            <TerrainView
              selectedLocation={selectedLocation}
              onOpenHUD={handleOpenHud}
              isExpanded={isMapExpanded}
              onToggleExpand={setIsMapExpanded}
              pinnedLocations={pinnedLocations}
              onAddPin={handleAddPinnedLocation}
              onRemovePin={handleRemovePinnedLocation}
              onNavigateToMap={(loc) => {
                handleSelectLocation(loc);
                setActiveSatellitePin(loc);
                setActiveSection('Overview');
                setActiveNav('Map');
                setIsMapExpanded(false);
              }}
            />
          </div>
        );
      case 'Overview':
      default:
        return (
          <MarsMap
            selectedLocation={selectedLocation}
            onSelectLocation={(loc) => {
              handleSelectLocation(loc);
              // If user selects another landmark or location, clear temporary satellite pin
              if (activeSatellitePin && loc.id !== activeSatellitePin.id) {
                setActiveSatellitePin(null);
              }
            }}
            viewMode={viewMode}
            setViewMode={setViewMode}
            isExpanded={isMapExpanded}
            onToggleExpand={setIsMapExpanded}
            activeMission={activeMission}
            onOpenMissions={() => setIsMissionsOpen(true)}
            pinnedLocations={activeSatellitePin ? [activeSatellitePin] : []}
            onRemovePin={handleRemovePinnedLocation}
            routeObjectives={routeObjectives}
            missionStatus={missionStatus}
            onCompleteMission={() => setMissionStatus((prev) => (prev === 'Running' ? 'Completed' : 'Running'))}
          />
        );
    }
  };

  const isOverview = activeNav === 'Map' && activeSection === 'Overview' && !isMapExpanded;

  if (showHud) {
    return (
      <React.Suspense
        fallback={
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: '#040608',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f59e0b',
              fontFamily: "'Share Tech Mono', 'JetBrains Mono', monospace",
              zIndex: 99999
            }}
          >
            <div style={{ fontSize: '20px', letterSpacing: '0.15em', marginBottom: '12px' }}>
              INITIALIZING HUD VISOR...
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8', letterSpacing: '0.08em' }}>
              CALIBRATING AVIONICS & SENSORS
            </div>
          </div>
        }
      >
        <HudApp
          onExit={handleCloseHud}
          initialLocation={selectedLocation}
        />
      </React.Suspense>
    );
  }

  return (
    <div className={`mars-dashboard-root ${isMapExpanded ? 'is-map-expanded' : ''}`}>
      {/* Top Main Navigation Header */}
      <Header
        activeNav={activeNav}
        setActiveNav={handleNavClick}
        onSearchClick={() => setIsSearchOpen(true)}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Main Grid Content - Strict Single Viewport Layout */}
      <main className={`dashboard-main-layout ${isMapExpanded ? 'layout-expanded' : ''} ${!isOverview ? 'no-side-panel' : ''}`}>
        {/* Left Column: Sidebar - ALWAYS FIXED IN VIEWPORT */}
        <Sidebar
          activeSection={activeNav === 'Map' ? activeSection : activeNav}
          setActiveSection={handleSidebarClick}
          onExplorePromo={handleOpenHud}
        />

        {/* Center Column: Dynamic Content Page with Smooth Transition */}
        <section className={`viewport-center-section ${isMapExpanded || !isOverview ? 'center-expanded' : ''}`}>
          <div className="section-content-fade-wrapper" key={`${activeNav}-${activeSection}`}>
            {renderCenterContent()}
          </div>
        </section>

        {/* Right Column: Site Detail Panel - ONLY on Overview page */}
        {isOverview && (
          <aside className="panel-right-section">
            <DetailPanel
              locationData={selectedLocation}
              activeMission={activeMission}
              routeObjectives={routeObjectives}
              onPlayVideo={handleOpenHud}
              onAddToRoute={() => handleToggleAddToRoute(selectedLocation)}
              onRemoveFromRoute={handleRemoveFromRoute}
              isAddedToRoute={isLocationInRoute(selectedLocation?.id)}
              onUnmark={(loc) => {
                const targetId = loc?.id || selectedLocation?.id;
                if (targetId) {
                  handleRemovePinnedLocation(targetId);
                  setRouteObjectives((prev) => prev.filter((o) => o.id !== targetId));
                  if (activeMission && (
                    activeMission.targetLocationId === targetId ||
                    (activeMission.id === 'gale_boxwork' && targetId === 'gale') ||
                    (activeMission.id === 'jezero_sample' && targetId === 'jezero') ||
                    (activeMission.id === 'olympus_shelter' && targetId === 'olympus')
                  )) {
                    setActiveMission(null);
                  }
                }
                setSelectedLocation(null);
                setActiveSatellitePin(null);
              }}
            />
          </aside>
        )}
      </main>

      {/* Interactive Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectLocation={handleSelectLocation}
      />

      {/* NASA Missions Scenario Picker Modal */}
      <MissionsModal
        isOpen={isMissionsOpen}
        onClose={() => setIsMissionsOpen(false)}
        activeMissionId={activeMission?.id}
        onSelectMission={handleSelectMission}
        missionStatus={missionStatus}
        onToggleMissionStatus={() => setMissionStatus((prev) => (prev === 'Running' ? 'Completed' : 'Running'))}
      />

      {/* Spacesuit AR Helmet Visor HUD Simulation Modal */}
      <SimulationModal
        isOpen={isSimOpen}
        onClose={() => setIsSimOpen(false)}
        location={selectedLocation}
      />
    </div>
  );
}
