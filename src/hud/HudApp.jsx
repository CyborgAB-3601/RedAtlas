import React, { useState, useEffect, useRef, useCallback } from 'react';
import CameraBackground from './components/CameraBackground';
import VisorHelmetFrame from './components/VisorHelmetFrame';
import SuitTelemetryPanel from './components/SuitTelemetryPanel';
import MissionTimer from './components/MissionTimer';
import AstronautBiometrics from './components/AstronautBiometrics';
import LocationInfoPanel from './components/LocationInfoPanel';
import MarsGlobalMap from './components/MarsGlobalMap';
import NavigationDock, { DOCK_TOOLS } from './components/NavigationDock';
import TargetingReticle from './components/TargetingReticle';
import ToolDrawers from './components/ToolDrawers';
import CalibrationModal from './components/CalibrationModal';
import LocationDetailsModal from './components/LocationDetailsModal';
import CameraSetupModal from './components/CameraSetupModal';
import HUDAlerts from './components/HUDAlerts';
import HandTrackingManager from './components/HandTrackingManager';
import GestureCursor from './components/GestureCursor';
import GestureStatusIndicator from './components/GestureStatusIndicator';
import GestureSettings from './components/GestureSettings';
import GestureDebugOverlay from './components/GestureDebugOverlay';

import {
  ASTRONAUT_TELEMETRY,
  MARS_LOCATIONS,
  ROVERS_DATA,
  INITIAL_WAYPOINTS,
  DEFAULT_HUD_LAYERS,
  NAVIGATION_ROUTES
} from './data/marsHudData';
import { HeadTracker } from './services/headTracking';
import { hudAudio } from './services/audioService';
import { Sliders, Camera, Maximize2, Volume2, VolumeX, ArrowLeft } from 'lucide-react';
import './hud.css';

export function getCameraIndexFromLabel(label = '') {
  const l = (label || '').toLowerCase();
  if (l.includes('logi') || l.includes('c270') || l.includes('external')) {
    return 2; // DirectShow Index 2: Logi C270 HD WebCam
  }
  if (l.includes('integrated') || l.includes('built-in') || l.includes('internal') || l.includes('facetime')) {
    return 1; // DirectShow Index 1: Integrated Camera
  }
  if (l.includes('smart') || l.includes('connect')) {
    return 0; // DirectShow Index 0: Smart Connect Camera
  }
  return 2; // Default to external camera
}

export function syncCameraConfig(index, name, deviceId) {
  try {
    localStorage.setItem('redatlas_selected_camera_index', String(index));
    localStorage.setItem('redatlas_selected_camera_name', name);
    if (deviceId) localStorage.setItem('redatlas_selected_camera_id', deviceId);
  } catch (e) {}

  fetch('/api/camera-config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ index, name, deviceId, timestamp: Date.now() })
  }).catch(() => {});
}

export default function HudApp({ onExit, initialLocation }) {
  // 1. Head Orientation State
  const [headOrientation, setHeadOrientation] = useState({ yaw: 0, pitch: 0, roll: 0, heading: 42 });
  const headTrackerRef = useRef(null);

  // 2. Telemetry and Mars Locations State
  const [telemetry, setTelemetry] = useState(ASTRONAUT_TELEMETRY);
  const [locations, setLocations] = useState(MARS_LOCATIONS);
  const [selectedLocation, setSelectedLocation] = useState(() => {
    if (initialLocation) {
      const match = Object.values(MARS_LOCATIONS).find(
        (l) => l.name?.toLowerCase() === initialLocation.name?.toLowerCase() || l.id === initialLocation.id
      );
      if (match) return match;
      if (initialLocation.latNum !== undefined && initialLocation.lngNum !== undefined) {
        return {
          id: initialLocation.id || 'current-loc',
          name: initialLocation.name || 'Selected Site',
          type: initialLocation.type || 'LANDMARK',
          coordsText: initialLocation.coordsText || `${initialLocation.latNum}° N, ${initialLocation.lngNum}° E`,
          latNum: initialLocation.latNum,
          lngNum: initialLocation.lngNum,
          elevationNum: initialLocation.elevationNum || -2450,
          elevationText: initialLocation.elevationText || '-2,450 m',
          notes: initialLocation.notes || initialLocation.description || 'Target designated from RedAtlas Map',
          landscapeImg: initialLocation.landscapeImg || '/assets/mars_eva_first_person.jpg'
        };
      }
    }
    return MARS_LOCATIONS.proposed_base;
  });
  const [activeDestination, setActiveDestination] = useState(() => {
    if (initialLocation) {
      const match = Object.values(MARS_LOCATIONS).find(
        (l) => l.name?.toLowerCase() === initialLocation.name?.toLowerCase() || l.id === initialLocation.id
      );
      if (match) return match;
      if (initialLocation.latNum !== undefined && initialLocation.lngNum !== undefined) {
        return {
          id: initialLocation.id || 'current-loc',
          name: initialLocation.name || 'Selected Site',
          type: initialLocation.type || 'LANDMARK',
          coordsText: initialLocation.coordsText || `${initialLocation.latNum}° N, ${initialLocation.lngNum}° E`,
          latNum: initialLocation.latNum,
          lngNum: initialLocation.lngNum,
          elevationNum: initialLocation.elevationNum || -2450,
          elevationText: initialLocation.elevationText || '-2,450 m',
          notes: initialLocation.notes || initialLocation.description || 'Target designated from RedAtlas Map',
          landscapeImg: initialLocation.landscapeImg || '/assets/mars_eva_first_person.jpg'
        };
      }
    }
    return MARS_LOCATIONS.proposed_base;
  });

  // 3. Navigation Data State
  const [rovers, setRovers] = useState(ROVERS_DATA);
  const [selectedRover, setSelectedRover] = useState(ROVERS_DATA[0]);
  const [waypoints, setWaypoints] = useState(INITIAL_WAYPOINTS);
  const [routes, setRoutes] = useState(NAVIGATION_ROUTES);
  const [activeRoute, setActiveRoute] = useState(NAVIGATION_ROUTES[0]);
  const [layers, setLayers] = useState(DEFAULT_HUD_LAYERS);

  // 4. Navigation Tool Selection: 'Explore' | 'Waypoint' | 'Route' | 'Rover' | 'Astronaut' | 'Measure' | 'Layers'
  const [activeTool, setActiveTool] = useState('Explore');

  // 5. Modals State
  const [isCalibOpen, setIsCalibOpen] = useState(false);
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [dossierLocation, setDossierLocation] = useState(MARS_LOCATIONS.proposed_base);

  // 6. Camera Selection & Hardware Configuration State
  const [isCameraSetupOpen, setIsCameraSetupOpen] = useState(() => {
    return !localStorage.getItem('redatlas_camera_configured');
  });

  const [activeDeviceId, setActiveDeviceId] = useState(() => {
    return localStorage.getItem('redatlas_selected_camera_id') || '';
  });

  const [activeDeviceName, setActiveDeviceName] = useState(() => {
    return localStorage.getItem('redatlas_selected_camera_name') || 'External Camera';
  });

  const [cameraMode, setCameraMode] = useState(() => {
    return localStorage.getItem('redatlas_camera_mode') || 'mars_sim';
  });

  const [cameraSettings, setCameraSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('redatlas_camera_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      resolution: '1080p',
      frameRate: 30,
      flipHorizontal: false,
      flipVertical: false,
      brightness: 100,
      contrast: 100,
      saturation: 100
    };
  });

  // 7. System Avionics Visual Customization State
  const [filterMode, setFilterMode] = useState('normal'); // 'normal' | 'amber_enhancer' | 'night_vision' | 'thermal'
  const [hudOpacity, setHudOpacity] = useState(0.88);
  const [uiScale, setUiScale] = useState(1.0);
  const [colorTheme, setColorTheme] = useState('amber');
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  // 8. System Notifications
  const [alerts, setAlerts] = useState([]);

  // 9. Hand Gesture Avionics Control System State
  const cameraVideoRef = useRef(null);
  const marsMapRef = useRef(null);
  const [mapZoom, setMapZoom] = useState(1.0);
  const [mapRotation, setMapRotation] = useState(0.4);
  const [isMapFullScreen, setIsMapFullScreen] = useState(false);
  const [isGestureControlActive, setIsGestureControlActive] = useState(() => {
    return localStorage.getItem('redatlas_gesture_active') === 'true';
  });
  const [isPythonBackendConnected, setIsPythonBackendConnected] = useState(false);
  const [isGestureSettingsOpen, setIsGestureSettingsOpen] = useState(false);
  const [isGestureDebugOpen, setIsGestureDebugOpen] = useState(false);
  const [gestureSettings, setGestureSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('redatlas_gesture_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      cursorSmoothing: 0.65,
      sensitivity: 'medium',
      activationHoldMs: 700,
      cancelHoldMs: 800,
      actionCooldownMs: 400,
      handPreference: 'Right',
      invertX: false,
      enabledGestures: {
        openPalm: true,
        closedFist: true,
        point: true,
        pinchSelect: true,
        twoFingers: true,
        thumbsUp: true,
        swipe: true,
        mapZoom: true,
        mapPan: true
      }
    };
  });

  // World Markers for AR HUD (anchored in world space relative to yaw/pitch)
  const worldMarkers = [
    {
      id: 'wm-hab',
      name: 'Proposed Base Site',
      type: 'BASE HAB',
      distance: '324 m',
      elev: '-2,450 m',
      baseYaw: 0,
      basePitch: -4,
      targetLocation: MARS_LOCATIONS.proposed_base
    },
    {
      id: 'wm-rover',
      name: 'Rover Alpha (Escort)',
      type: 'AUTONOMOUS ROVER',
      distance: '420 m',
      elev: '-2,448 m',
      baseYaw: 14,
      basePitch: -8,
      roverData: ROVERS_DATA[0]
    },
    {
      id: 'wm-solar',
      name: 'Solar Array Field',
      type: 'POWER GRID',
      distance: '510 m',
      elev: '-2,442 m',
      baseYaw: -18,
      basePitch: -5
    },
    {
      id: 'wm-ice',
      name: 'Subsurface Ice Borehole',
      type: 'ISRU RESOURCE',
      distance: '1.2 km',
      elev: '-2,465 m',
      baseYaw: 36,
      basePitch: -10
    },
    {
      id: 'wm-ridge',
      name: 'North Ridge Comms Mast',
      type: 'HIGH GAIN COMMS',
      distance: '6.8 km',
      elev: '-2,380 m',
      baseYaw: -42,
      basePitch: 6
    }
  ];

  const pushNotification = useCallback((message, type = 'info') => {
    // Disabled all frontend modal notifications per user requirement:
    // "DONT SHOW ANY MODAL NOTIFICATION IN FRONTEND FOR ANYTHING AFTER GESSTURES OR ANYTHING"
    return;
  }, []);

  const dismissAlert = (id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  // Update Camera Settings
  const handleUpdateCameraSettings = (newSettings) => {
    setCameraSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem('redatlas_camera_settings', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Activate Selected Camera
  const handleSelectAndActivateCamera = (deviceId, deviceName) => {
    setActiveDeviceId(deviceId);
    setActiveDeviceName(deviceName);
    setCameraMode('webcam');
    localStorage.setItem('redatlas_camera_mode', 'webcam');
    localStorage.setItem('redatlas_camera_configured', 'true');
    const idx = getCameraIndexFromLabel(deviceName);
    syncCameraConfig(idx, deviceName, deviceId);
  };

  const handleFallbackToSimulation = () => {
    setCameraMode('mars_sim');
    localStorage.setItem('redatlas_camera_mode', 'mars_sim');
    localStorage.setItem('redatlas_camera_configured', 'true');
  };

  // Auto-detect and select external visible webcam on startup if not set or pointing to IR camera
  useEffect(() => {
    async function autoDetectWebcam() {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      try {
        const allDevs = await navigator.mediaDevices.enumerateDevices();
        const videoDevs = allDevs.filter((d) => d.kind === 'videoinput');
        if (videoDevs.length === 0) return;

        // Check if current activeDeviceId is already a valid non-IR camera
        const currentDev = videoDevs.find((d) => d.deviceId === activeDeviceId);
        const currentIsIr = currentDev && (
          (currentDev.label || '').toLowerCase().includes('ir ') ||
          (currentDev.label || '').toLowerCase().includes('infrared')
        );

        if (!activeDeviceId || currentIsIr || !currentDev) {
          const externalDev = videoDevs.find((d) => {
            const l = (d.label || '').toLowerCase();
            return (
              (l.includes('logi') || l.includes('c270') || l.includes('usb') || l.includes('webcam') || l.includes('external')) &&
              !l.includes('integrated') && !l.includes('built-in') && !l.includes('ir') && !l.includes('infrared')
            );
          });
          const nonIrDev = videoDevs.find((d) => {
            const l = (d.label || '').toLowerCase();
            return !l.includes('integrated') && !l.includes('built-in') && !l.includes('ir') && !l.includes('infrared');
          });
          const chosen = externalDev || nonIrDev || videoDevs[0];
          if (chosen) {
            setActiveDeviceId(chosen.deviceId);
            setActiveDeviceName(chosen.label || 'Logitech HD Webcam');
            const idx = getCameraIndexFromLabel(chosen.label || 'Logitech HD Webcam');
            try {
              localStorage.setItem('redatlas_selected_camera_id', chosen.deviceId);
              localStorage.setItem('redatlas_selected_camera_name', chosen.label || 'Logitech HD Webcam');
            } catch (e) {}
            syncCameraConfig(idx, chosen.label || 'Logitech HD Webcam', chosen.deviceId);
          }
        }
      } catch (err) {
        console.warn('Auto detect webcam error:', err);
      }
    }
    autoDetectWebcam();
  }, [activeDeviceId]);

  // Initialize Head Tracker
  useEffect(() => {
    const tracker = new HeadTracker((orientation) => {
      setHeadOrientation(orientation);
    });
    tracker.start();
    headTrackerRef.current = tracker;

    return () => {
      tracker.stop();
    };
  }, []);

  const handleRecenterHead = useCallback(() => {
    if (headTrackerRef.current) {
      headTrackerRef.current.recenter();
    }
    setHeadOrientation({ yaw: 0, pitch: 0, roll: 0, heading: 0 });
    pushNotification('Viewing direction recentered to 000° [C]', 'info');
  }, [pushNotification]);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.key >= '1' && e.key <= '7') {
        const toolIndex = parseInt(e.key, 10) - 1;
        if (DOCK_TOOLS[toolIndex]) {
          hudAudio.playSelect();
          const targetTool = DOCK_TOOLS[toolIndex].id;
          setActiveTool((prev) => (prev === targetTool && targetTool !== 'Explore' ? 'Explore' : targetTool));
        }
      } else if (e.key === 'c' || e.key === 'C') {
        handleRecenterHead();
      } else if (e.key === 'k' || e.key === 'K') {
        hudAudio.playSelect();
        setIsCameraSetupOpen(true);
      } else if (e.key === 'v' || e.key === 'V') {
        hudAudio.playSelect();
        setCameraMode((prev) => {
          const next = prev === 'webcam' ? 'mars_sim' : 'webcam';
          localStorage.setItem('redatlas_camera_mode', next);
          return next;
        });
        pushNotification(
          cameraMode === 'webcam' ? 'Switched to Mars Surface Simulation' : 'Switched to Selected External Camera',
          'info'
        );
      } else if (e.key === 'f' || e.key === 'F') {
        handleToggleFullscreen();
      } else if (e.key === 'm' || e.key === 'M') {
        const muted = hudAudio.toggleMute();
        setIsAudioMuted(muted);
        pushNotification(muted ? 'Avionics Audio Muted' : 'Avionics Audio Enabled', 'info');
      } else if (e.key === 'Escape') {
        if (isCalibOpen || isDossierOpen || isCameraSetupOpen || isMapFullScreen || isGestureSettingsOpen) {
          setIsCalibOpen(false);
          setIsDossierOpen(false);
          setIsCameraSetupOpen(false);
          setIsMapFullScreen(false);
          setIsGestureSettingsOpen(false);
        } else if (activeTool !== 'Explore') {
          setActiveTool('Explore');
        } else if (onExit) {
          onExit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cameraMode, activeTool, handleRecenterHead, pushNotification, onExit, isCalibOpen, isDossierOpen, isCameraSetupOpen, isMapFullScreen, isGestureSettingsOpen]);

  // Marker Gaze Target Selection
  const handleSelectWorldMarker = (marker) => {
    if (marker.targetLocation) {
      setSelectedLocation(marker.targetLocation);
      pushNotification(`Target Acquired: ${marker.name}`, 'info');
    } else if (marker.roverData) {
      setSelectedRover(marker.roverData);
      setActiveTool('Rover');
      pushNotification(`Targeted Escort: ${marker.name}`, 'info');
    }
  };

  const handleSetDestination = (loc) => {
    setActiveDestination(loc);
    pushNotification(`Destination Locked: ${loc.name}`, 'info');
  };

  const handleAddWaypoint = (newWp) => {
    setWaypoints((prev) => [newWp, ...prev]);
  };

  const handleDeleteWaypoint = (wpId) => {
    setWaypoints((prev) => prev.filter((w) => w.id !== wpId));
    pushNotification('Waypoint Removed', 'info');
  };

  const handleToggleLayer = (layerId) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, enabled: !l.enabled } : l))
    );
  };

  const handleOpenDossier = (loc) => {
    setDossierLocation(loc || selectedLocation);
    setIsDossierOpen(true);
  };

  // Mars Global & Tactical Map Zoom Handlers (Camera feed remains strictly 1:1 natural optical view)
  const handleZoomIn = useCallback((step = 0.2) => {
    hudAudio.playSelect();
    if (marsMapRef.current) {
      marsMapRef.current.zoom(step);
    }
    setMapZoom((prev) => +(Math.min(2.5, prev + step)).toFixed(2));
    pushNotification('Map Magnification Increased', 'info');
  }, []);

  const handleZoomOut = useCallback((step = 0.2) => {
    hudAudio.playSelect();
    if (marsMapRef.current) {
      marsMapRef.current.zoom(-step);
    }
    setMapZoom((prev) => +(Math.max(0.6, prev - step)).toFixed(2));
    pushNotification('Map Magnification Decreased', 'info');
  }, []);

  const handleResetZoom = useCallback(() => {
    hudAudio.playSelect();
    if (marsMapRef.current) {
      marsMapRef.current.zoom(0);
    }
    setMapZoom(1.0);
    pushNotification('Map Magnification Reset (1.0x)', 'info');
  }, []);

  const handleMapPan = useCallback((dragDelta) => {
    if (marsMapRef.current) {
      marsMapRef.current.pan(dragDelta);
    } else {
      setMapRotation((prev) => prev - dragDelta.x * 3.8);
    }
  }, []);

  // Keyboard shortcut listener for Zoom ([+], [-], [0])
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.key === '+' || e.key === '=') {
        handleZoomIn(0.25);
      } else if (e.key === '-' || e.key === '_') {
        handleZoomOut(0.25);
      } else if (e.key === '0') {
        handleResetZoom();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleZoomIn, handleZoomOut, handleResetZoom]);

  return (
    <div
      className="hud-root-viewport"
      style={{
        transform: `scale(${uiScale})`,
        transformOrigin: 'center center'
      }}
    >
      {/* 1. PRIMARY BACKGROUND: Selected External Camera or Mars EVA Simulation */}
      <CameraBackground
        videoRef={cameraVideoRef}
        headOrientation={headOrientation}
        cameraMode={cameraMode}
        onToggleCameraMode={(mode) => {
          hudAudio.playSelect();
          setCameraMode(mode);
          localStorage.setItem('redatlas_camera_mode', mode);
          pushNotification(
            mode === 'webcam' ? 'Live Headcam Stream Online' : 'Mars Surface Simulation Activated',
            'info'
          );
        }}
        activeDeviceId={activeDeviceId}
        activeDeviceName={activeDeviceName}
        cameraSettings={cameraSettings}
        onOpenDeviceSettings={() => setIsCameraSetupOpen(true)}
        filterMode={filterMode}
        onNotify={pushNotification}
      />

      {/* 2. Curved Astronaut Visor Bezel & Glowing Amber Canopy */}
      <VisorHelmetFrame />

      {/* Hand Gesture Avionics Control System */}
      <HandTrackingManager
        videoRef={cameraVideoRef}
        isActive={isGestureControlActive}
        isMapFullScreen={isMapFullScreen}
        activeDeviceName={activeDeviceName}
        isAnyOverlayOpen={Boolean(
          isCalibOpen ||
          isCameraSetupOpen ||
          isDossierOpen ||
          isGestureSettingsOpen ||
          isMapFullScreen ||
          (activeTool && activeTool !== 'Explore')
        )}
        onToggleActive={(nextState) => {
          setIsGestureControlActive(nextState);
          try {
            localStorage.setItem('redatlas_gesture_active', String(nextState));
          } catch (e) {}
        }}
        activeTool={activeTool}
        onSelectTool={(tool) => setActiveTool(tool)}
        activeDestination={activeDestination}
        onConfirmDestination={handleSetDestination}
        onAddWaypoint={handleAddWaypoint}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onMapPan={handleMapPan}
        onMapZoom={(delta) => {
          if (marsMapRef.current) {
            marsMapRef.current.zoom(delta);
          }
          setMapZoom((prev) => +(Math.min(2.5, Math.max(0.6, prev + delta))).toFixed(2));
        }}
        onOpenMapFullScreen={() => {
          hudAudio.playSelect();
          setIsMapFullScreen(true);
        }}
        onCloseMapFullScreen={() => {
          hudAudio.playSelect();
          setIsMapFullScreen(false);
        }}
        onToggleMapFullScreen={() => {
          hudAudio.playSelect();
          setIsMapFullScreen((prev) => !prev);
        }}
        onCloseModals={() => {
          setIsCalibOpen(false);
          setIsCameraSetupOpen(false);
          setIsDossierOpen(false);
          setIsGestureSettingsOpen(false);
          setIsMapFullScreen(false);
          if (activeTool !== 'Explore') setActiveTool('Explore');
          setCameraMode('webcam');
          try {
            localStorage.setItem('redatlas_camera_mode', 'webcam');
          } catch (e) {}
        }}
        settings={gestureSettings}
        onNotify={pushNotification}
        onPythonBackendStatusChange={setIsPythonBackendConnected}
      >
        {({
          landmarkerReady,
          handDetected,
          currentGesture,
          confidence,
          cursorPos,
          isPinching,
          activationProgress,
          cancelProgress,
          landmarksData,
          isPythonBackendConnected: pyConnected
        }) => (
          <>
            {/* Virtual Aerospace Hand Cursor */}
            <GestureCursor
              cursorPos={cursorPos}
              isActive={isGestureControlActive}
              isPinching={isPinching}
              currentGesture={currentGesture}
              activationProgress={activationProgress}
              cancelProgress={cancelProgress}
              handDetected={handDetected}
              isAnyOverlayOpen={Boolean(
                isCalibOpen ||
                isCameraSetupOpen ||
                isDossierOpen ||
                isGestureSettingsOpen ||
                isMapFullScreen ||
                (activeTool && activeTool !== 'Explore')
              )}
            />

            {/* Optional 21-Landmark Skeleton Canvas */}
            <GestureDebugOverlay
              landmarksData={landmarksData}
              enabled={isGestureDebugOpen}
              invertX={gestureSettings.invertX ?? false}
            />

            {/* Top Right Status Indicators Cluster */}
            <div className="hud-top-status-pills">
              <GestureStatusIndicator
                isActive={isGestureControlActive}
                handDetected={handDetected}
                currentGesture={currentGesture}
                confidence={confidence}
                isPythonBackendConnected={pyConnected ?? isPythonBackendConnected}
                onToggleActive={(nextState) => {
                  setIsGestureControlActive(nextState);
                  try {
                    localStorage.setItem('redatlas_gesture_active', String(nextState));
                  } catch (e) {}
                }}
                onOpenSettings={() => setIsGestureSettingsOpen(true)}
              />

              <button
                className={`unobtrusive-cam-pill ${cameraMode === 'webcam' ? 'online' : ''}`}
                onClick={() => {
                  hudAudio.playSelect();
                  setIsCameraSetupOpen(true);
                }}
                title="Click to configure external headcam hardware [Key: K]"
              >
                <Camera size={12} className="pill-cam-icon" />
                <span className="cam-status-dot" />
                <span className="cam-name-label">
                  {cameraMode === 'webcam' ? (activeDeviceName || 'HEADCAM') : 'MARS SIMULATION'}
                </span>
                <Sliders size={11} className="pill-settings-icon" />
              </button>
            </div>
          </>
        )}
      </HandTrackingManager>

      {/* 3. Top-Left Quick System Shortcuts (Calibration & Settings) */}
      <div className="hud-top-left-shortcuts">
        {onExit && (
          <button
            className="quick-hud-pill hud-exit-pill"
            onClick={() => {
              hudAudio.playSelect();
              onExit();
            }}
            title="Exit HUD and return to RedAtlas Dashboard [ESC]"
            style={{
              borderColor: 'rgba(239, 68, 68, 0.6)',
              background: 'rgba(239, 68, 68, 0.18)',
              color: '#fca5a5',
              fontWeight: 600
            }}
          >
            <ArrowLeft size={12} />
            <span>EXIT TO ATLAS</span>
          </button>
        )}

        <button
          className="quick-hud-pill"
          onClick={() => {
            hudAudio.playSelect();
            setIsCalibOpen(true);
          }}
          title="Open Avionics Calibration & System Settings [ESC]"
        >
          <Sliders size={12} className="text-accent-amber" />
          <span>CALIBRATION</span>
        </button>

        <button
          className="quick-hud-pill"
          onClick={() => {
            hudAudio.playSelect();
            setIsCameraSetupOpen(true);
          }}
          title="Select Primary External Camera [Key: K]"
        >
          <Camera size={12} className="text-accent-cyan" />
          <span>SELECT CAMERA [K]</span>
        </button>
      </div>

      {/* 3. System Alerts & Notifications (FR-16) */}
      <HUDAlerts alerts={alerts} onDismiss={dismissAlert} />

      {/* 4. Small, Elegant Center Targeting Reticle (Unobstructed View) */}
      <TargetingReticle
        headOrientation={headOrientation}
        worldMarkers={worldMarkers}
        onSelectMarker={handleSelectWorldMarker}
        onNotify={pushNotification}
      />

      {/* 5. Main Heads-Up Display Interface Overlay (5 Main Regions) */}
      <div className="hud-interface-overlay" style={{ opacity: hudOpacity }}>
        {/* Top Region: Suit Telemetry (Left), Mission Timer (Center), Biometrics (Right) */}
        <div className="hud-top-bar">
          {/* REGION A: Top-Left Suit Status */}
          <SuitTelemetryPanel
            telemetry={telemetry}
            onOpenAstronautModal={() => setActiveTool('Astronaut')}
          />

          {/* REGION B: Top-Center Mission Status & Timer */}
          <MissionTimer onNotify={pushNotification} />

          {/* REGION C: Top-Right Astronaut Biometrics */}
          <AstronautBiometrics
            telemetry={telemetry}
            onOpenAstronautModal={() => setActiveTool('Astronaut')}
          />
        </div>

        {/* Bottom Region: Contextual Location Info (Left) & Mars Global Map (Right) */}
        <div className="hud-bottom-row">
          {/* REGION D: Lower-Left Contextual Location Information */}
          <LocationInfoPanel
            selectedLocation={selectedLocation}
            activeDestination={activeDestination}
            onSetDestination={handleSetDestination}
            onSaveWaypoint={(loc) => {
              const newWp = {
                id: `wp-${Date.now()}`,
                name: loc.name,
                coords: loc.coordsText,
                latNum: loc.latNum,
                lngNum: loc.lngNum,
                elevation: loc.elevationNum,
                type: 'LANDMARK',
                notes: 'Saved from HUD reconnaissance panel'
              };
              handleAddWaypoint(newWp);
            }}
            onStartMeasure={() => setActiveTool('Measure')}
            onOpenDetails={handleOpenDossier}
            onNotify={pushNotification}
          />

          {/* REGION E: Right-Side Mars Global Map */}
          <MarsGlobalMap
            ref={marsMapRef}
            astronautLocation={telemetry.location}
            selectedLocation={selectedLocation}
            onSelectLocation={(loc) => setSelectedLocation(loc)}
            activeDestination={activeDestination}
            rovers={rovers}
            waypoints={waypoints}
            activeLayers={layers}
            onToggleLayerModal={() => setActiveTool('Layers')}
            onNotify={pushNotification}
            zoomLevel={mapZoom}
            onZoomChange={setMapZoom}
            rotation={mapRotation}
            onRotate={setMapRotation}
            isFullScreen={isMapFullScreen}
            onToggleFullScreen={() => {
              hudAudio.playSelect();
              setIsMapFullScreen((prev) => !prev);
            }}
          />
        </div>

        {/* Floating Mars Map Zoom Controller */}
        <div className="hud-floating-zoom-control">
          <button
            type="button"
            className="zoom-btn"
            onClick={() => handleZoomOut(0.25)}
            title="Map Zoom Out [Key: -]"
          >
            -
          </button>
          <span className="zoom-label">MAP {mapZoom.toFixed(1)}x</span>
          <button
            type="button"
            className="zoom-btn"
            onClick={() => handleZoomIn(0.25)}
            title="Map Zoom In [Key: +]"
          >
            +
          </button>
          {mapZoom !== 1.0 && (
            <button
              type="button"
              className="zoom-reset-btn"
              onClick={handleResetZoom}
              title="Reset Map Zoom to 1.0x [Key: 0]"
            >
              1.0x
            </button>
          )}
        </div>

        {/* REGION 5: Floating Bottom Navigation Dock (7 Core Tools) */}
        <NavigationDock
          activeTool={activeTool}
          onSelectTool={(tool) => setActiveTool(tool)}
        />
      </div>

      {/* 6. Interactive Tool Drawers (Waypoint, Route, Rover, Astronaut, Measure, Layers) */}
      <ToolDrawers
        activeTool={activeTool}
        onClose={() => setActiveTool('Explore')}
        waypoints={waypoints}
        onAddWaypoint={handleAddWaypoint}
        onDeleteWaypoint={handleDeleteWaypoint}
        routes={routes}
        activeRoute={activeRoute}
        onSelectRoute={(rt) => {
          setActiveRoute(rt);
          if (locations[rt.to]) setActiveDestination(locations[rt.to]);
        }}
        rovers={rovers}
        selectedRover={selectedRover}
        onSelectRover={(r) => setSelectedRover(r)}
        astronautTelemetry={telemetry}
        activeDestination={activeDestination}
        onSetDestination={handleSetDestination}
        layers={layers}
        onToggleLayer={handleToggleLayer}
        locations={locations}
        onSelectLocation={(loc) => setSelectedLocation(loc)}
        onNotify={pushNotification}
      />

      {/* 7. Dedicated External Camera Selection Modal */}
      <CameraSetupModal
        isOpen={isCameraSetupOpen}
        onClose={() => setIsCameraSetupOpen(false)}
        activeDeviceId={activeDeviceId}
        onSelectAndActivateCamera={handleSelectAndActivateCamera}
        onFallbackToSimulation={handleFallbackToSimulation}
        cameraSettings={cameraSettings}
        onUpdateCameraSettings={handleUpdateCameraSettings}
        onNotify={pushNotification}
      />

      {/* 8. Geological Reconnaissance Dossier Modal */}
      <LocationDetailsModal
        location={dossierLocation}
        isOpen={isDossierOpen}
        onClose={() => setIsDossierOpen(false)}
        activeDestination={activeDestination}
        onSetDestination={handleSetDestination}
        onSaveWaypoint={(loc) => {
          const newWp = {
            id: `wp-${Date.now()}`,
            name: loc.name,
            coords: loc.coordsText,
            latNum: loc.latNum,
            lngNum: loc.lngNum,
            elevation: loc.elevationNum,
            type: 'LANDMARK',
            notes: 'Saved from reconnaissance dossier'
          };
          handleAddWaypoint(newWp);
        }}
        onNotify={pushNotification}
      />

      {/* 9. Calibration & Avionics Settings Modal */}
      <CalibrationModal
        isOpen={isCalibOpen}
        onClose={() => setIsCalibOpen(false)}
        hudOpacity={hudOpacity}
        onChangeOpacity={setHudOpacity}
        uiScale={uiScale}
        onChangeUiScale={setUiScale}
        colorTheme={colorTheme}
        onChangeColorTheme={setColorTheme}
        filterMode={filterMode}
        onChangeFilterMode={setFilterMode}
        isAudioMuted={isAudioMuted}
        onToggleAudio={() => {
          const muted = hudAudio.toggleMute();
          setIsAudioMuted(muted);
          pushNotification(muted ? 'Avionics Audio Muted' : 'Avionics Audio Enabled', 'info');
        }}
        onRecenterHead={handleRecenterHead}
        onToggleFullscreen={handleToggleFullscreen}
        onOpenCameraSetup={() => {
          setIsCalibOpen(false);
          setIsCameraSetupOpen(true);
        }}
        activeDeviceName={activeDeviceName}
        cameraMode={cameraMode}
        onNotify={pushNotification}
        onExit={onExit}
      />

      {/* 10. Hand Gesture Control Settings & Reference Modal */}
      <GestureSettings
        isOpen={isGestureSettingsOpen}
        onClose={() => setIsGestureSettingsOpen(false)}
        isActive={isGestureControlActive}
        onToggleActive={(nextState) => {
          setIsGestureControlActive(nextState);
          try {
            localStorage.setItem('redatlas_gesture_active', String(nextState));
          } catch (e) {}
        }}
        settings={gestureSettings}
        onUpdateSettings={(newSettings) => {
          setGestureSettings(newSettings);
          try {
            localStorage.setItem('redatlas_gesture_settings', JSON.stringify(newSettings));
          } catch (e) {}
        }}
        debugOverlayEnabled={isGestureDebugOpen}
        onToggleDebugOverlay={setIsGestureDebugOpen}
        onOpenDeviceSettings={() => {
          setIsGestureSettingsOpen(false);
          setIsCameraSetupOpen(true);
        }}
        onNotify={pushNotification}
        isPythonBackendConnected={isPythonBackendConnected}
      />
    </div>
  );
}
