import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MarsMap from './components/MarsMap';
import DetailPanel from './components/DetailPanel';
import KeyLocations from './components/KeyLocations';
import TerrainElevation from './components/TerrainElevation';
import SearchModal from './components/SearchModal';
import SimulationModal from './components/SimulationModal';
import { MARS_LOCATIONS, getLocationById } from './data/marsLocations';

export default function App() {
  const [activeNav, setActiveNav] = useState('Map');
  const [activeSection, setActiveSection] = useState('Overview');
  const [viewMode, setViewMode] = useState('Satellite');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSimOpen, setIsSimOpen] = useState(false);
  const [isAddedToRoute, setIsAddedToRoute] = useState(false);
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  // Theme state: dark (matches the screenshot) or light
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('red_atlas_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (e) {}
    return 'dark'; // default to dark mode as in the user screenshot
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('red_atlas_theme', theme);
    } catch (e) {}
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Default location: Proposed Base Site
  const [selectedLocation, setSelectedLocation] = useState(MARS_LOCATIONS.proposed_base);

  const handleSelectLocation = (loc) => {
    if (!loc) return;
    const locId = typeof loc === 'string' ? loc : loc.id;
    const fullLoc = getLocationById(locId);
    setSelectedLocation(fullLoc);
    setIsAddedToRoute(false);
  };

  return (
    <div className={`mars-dashboard-root ${isMapExpanded ? 'is-map-expanded' : ''}`}>
      {/* Top Main Navigation Header */}
      <Header
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        onSearchClick={() => setIsSearchOpen(true)}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Main Grid Content */}
      <main className={`dashboard-main-layout ${isMapExpanded ? 'layout-expanded' : ''}`}>
        {/* Left Column: Sidebar */}
        <Sidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          onExplorePromo={() => setIsSimOpen(true)}
        />

        {/* Center Column: Mars Orbital Viewport */}
        <section className={`viewport-center-section ${isMapExpanded ? 'center-expanded' : ''}`}>
          <MarsMap
            selectedLocation={selectedLocation}
            onSelectLocation={handleSelectLocation}
            viewMode={viewMode}
            setViewMode={setViewMode}
            isExpanded={isMapExpanded}
            onToggleExpand={setIsMapExpanded}
          />
        </section>

        {/* Right Column: Site Detail Panel */}
        <aside className="panel-right-section">
          <DetailPanel
            locationData={selectedLocation}
            onPlayVideo={() => setIsSimOpen(true)}
            onAddToRoute={() => setIsAddedToRoute(!isAddedToRoute)}
            isAddedToRoute={isAddedToRoute}
          />
        </aside>
      </main>

      {/* Bottom Section: Key Locations + Terrain Elevation */}
      <section className={`dashboard-bottom-grid ${isMapExpanded ? 'bottom-hidden' : ''}`}>
        <KeyLocations
          onSelectLocation={handleSelectLocation}
          selectedLocationId={selectedLocation?.id}
        />
        <TerrainElevation selectedLocation={selectedLocation} />
      </section>

      {/* Interactive Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectLocation={handleSelectLocation}
      />

      {/* Interactive Simulation / Video Modal */}
      <SimulationModal
        isOpen={isSimOpen}
        onClose={() => setIsSimOpen(false)}
        location={selectedLocation}
      />
    </div>
  );
}
