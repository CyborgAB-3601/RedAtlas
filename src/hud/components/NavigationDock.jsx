import React from 'react';
import {
  Navigation,
  MapPin,
  Route,
  Radio,
  User,
  Ruler,
  Layers
} from 'lucide-react';
import { hudAudio } from '../services/audioService';

export const DOCK_TOOLS = [
  { id: 'Explore', label: 'Explore', icon: Navigation, key: '1' },
  { id: 'Waypoint', label: 'Waypoint', icon: MapPin, key: '2' },
  { id: 'Route', label: 'Route', icon: Route, key: '3' },
  { id: 'Rover', label: 'Rover', icon: Radio, key: '4' },
  { id: 'Astronaut', label: 'Astronaut', icon: User, key: '5' },
  { id: 'Measure', label: 'Measure', icon: Ruler, key: '6' },
  { id: 'Layers', label: 'Layers', icon: Layers, key: '7' }
];

/**
 * NavigationDock — Matches the Bottom Floating Pill Dock in the reference image:
 * - Floating rounded white/frosted glass pill container.
 * - 7 tools: Explore, Waypoint, Route, Rover, Astronaut, Measure, Layers.
 * - Active state highlighted with warm amber/peach tint.
 * - Clean title-case typography and aerospace icon styling.
 */
export default function NavigationDock({ activeTool, onSelectTool }) {
  const handleClick = (toolId) => {
    hudAudio.playSelect();
    if (activeTool === toolId && toolId !== 'Explore') {
      onSelectTool('Explore');
    } else {
      onSelectTool(toolId);
    }
  };

  return (
    <nav className="hud-floating-dock-container" aria-label="Mars Navigation Dock">
      <div className="hud-white-pill-dock">
        {DOCK_TOOLS.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;

          return (
            <button
              key={tool.id}
              className={`dock-pill-btn ${isActive ? 'active' : ''}`}
              onClick={() => handleClick(tool.id)}
              title={`${tool.label} [Key: ${tool.key}]`}
            >
              <Icon size={15} className="dock-pill-icon" />
              <span className="dock-pill-label">{tool.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
