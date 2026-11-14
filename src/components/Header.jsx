import React, { useState, useEffect } from 'react';
import { Search, Map, Rocket, Layers, Sun, Moon } from 'lucide-react';

export default function Header({ activeNav, setActiveNav, onSearchClick, theme, toggleTheme }) {
  const [marsTime, setMarsTime] = useState({ hours: 14, minutes: 32, seconds: 11 });

  useEffect(() => {
    const timer = setInterval(() => {
      setMarsTime((prev) => {
        let sec = prev.seconds + 1;
        let min = prev.minutes;
        let hr = prev.hours;
        if (sec >= 60) {
          sec = 0;
          min += 1;
        }
        if (min >= 60) {
          min = 0;
          hr = (hr + 1) % 24;
        }
        return { hours: hr, minutes: min, seconds: sec };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (h, m, s) => {
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(h)} : ${pad(m)} : ${pad(s)}`;
  };

  const navItems = [
    { name: 'Map', icon: Map },
    { name: 'Missions', icon: Rocket },
    { name: 'Resources', icon: Layers }
  ];

  return (
    <header className="header-container">
      {/* Brand Logo */}
      <div className="brand-box">
        <div className="brand-title-row">
          <span className="brand-name">RED ATLAS</span>
          <img
            src="/assets/mars_globe_icon.jpg"
            alt="Red Atlas Icon"
            className="brand-icon-globe"
          />
        </div>
        <div className="brand-subtitle">EXPLORE · PLAN · SURVIVE</div>
      </div>

      {/* Center Nav Pills */}
      <nav className="center-nav-pill">
        {navItems.map((item) => {
          const isActive = activeNav === item.name;
          const Icon = item.icon;
          return (
            <button
              key={item.name}
              className={`nav-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => setActiveNav(item.name)}
            >
              <Icon size={14} className="nav-tab-icon" />
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* Right Controls */}
      <div className="header-right-group">
        {/* Search Bar */}
        <div className="search-pill-container" onClick={onSearchClick}>
          <Search size={15} className="search-icon" />
          <input
            type="text"
            placeholder="Search locations, craters..."
            className="search-input"
            readOnly
          />
          <div className="search-kbd-badge">
            <span className="cmd-symbol">⌘</span> K
          </div>
        </div>

        {/* Theme Mode Switcher */}
        <button
          type="button"
          className="theme-toggle-switch"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          <div className="theme-toggle-pill">
            <span className={`theme-toggle-option ${theme === 'light' ? 'active' : ''}`}>
              <Sun size={12} className="theme-opt-icon" />
            </span>
            <span className={`theme-toggle-option ${theme === 'dark' ? 'active' : ''}`}>
              <Moon size={12} className="theme-opt-icon" />
            </span>
            <div className={`theme-toggle-slider ${theme === 'dark' ? 'is-dark' : 'is-light'}`}>
              {theme === 'dark' ? (
                <Moon size={11} className="slider-icon active-moon" />
              ) : (
                <Sun size={11} className="slider-icon active-sun" />
              )}
            </div>
          </div>
        </button>

        {/* Live Data Badge */}
        <div className="live-data-card">
          <div className="live-data-status-col">
            <div className="live-header">
              <span className="live-indicator-dot animate-live-pulse" />
              <span className="live-label">Live Data</span>
            </div>
            <div className="live-metrics">
              <span className="sol-badge">SOL 689</span>
              <span className="time-badge">{formatTime(marsTime.hours, marsTime.minutes, marsTime.seconds)}</span>
            </div>
          </div>
          <div className="live-avatar-wrap">
            <img
              src="/assets/mars_globe_icon.jpg"
              alt="Live Feed Thumbnail"
              className="live-avatar-img"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
