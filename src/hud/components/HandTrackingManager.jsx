import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { HandGestureEngine, GESTURE_TYPES } from '../services/HandGestureEngine';
import { hudAudio } from '../services/audioService';

/**
 * HandTrackingManager
 * Orchestrates MediaPipe Hand Landmarker detection and connects to the
 * high-performance Python OpenCV + MediaPipe WebSocket server (ws://localhost:8765).
 * Prioritizes 60 FPS Python engine data when online, with automatic seamless fallback
 * to the in-browser MediaPipe client engine when offline.
 */
export default function HandTrackingManager({
  videoRef,
  isActive = false,
  isMapFullScreen = false,
  isAnyOverlayOpen = false,
  activeDeviceName = '',
  onToggleActive,
  onGestureAction,
  onCursorUpdate,
  activeTool,
  onSelectTool,
  activeDestination,
  onConfirmDestination,
  onAddWaypoint,
  onMapPan,
  onMapZoom,
  onZoomIn,
  onZoomOut,
  onOpenMapFullScreen,
  onCloseMapFullScreen,
  onToggleMapFullScreen,
  onCloseModals,
  settings = {},
  onNotify,
  onPythonBackendStatusChange,
  children
}) {
  const [landmarkerReady, setLandmarkerReady] = useState(false);
  const [handDetected, setHandDetected] = useState(false);
  const [currentGesture, setCurrentGesture] = useState(GESTURE_TYPES.NONE);
  const [confidence, setConfidence] = useState(0);
  const [cursorPos, setCursorPos] = useState({ x: 0.5, y: 0.5 });
  const [isPinching, setIsPinching] = useState(false);
  const [activationProgress, setActivationProgress] = useState(0);
  const [cancelProgress, setCancelProgress] = useState(0);
  const [landmarksData, setLandmarksData] = useState(null);
  const [isPythonBackendConnected, setIsPythonBackendConnected] = useState(false);

  const landmarkerRef = useRef(null);
  const engineRef = useRef(new HandGestureEngine(settings));
  const animFrameRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);

  // WebSocket & Python Backend refs
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const lastPythonMsgTimeRef = useRef(0);
  const offscreenCanvasRef = useRef(null);

  // Cursor smoothing & drag tracking
  const smoothedCursorRef = useRef({ x: 0.5, y: 0.5 });

  // Timers for hold detection with grace periods
  const palmHoldStartRef = useRef(0);
  const lastPalmSeenRef = useRef(0);
  const thumbsUpHoldStartRef = useRef(0);
  const lastThumbsUpSeenRef = useRef(0);
  const lastActionTimeRef = useRef(0);
  const lastZoomActionTimeRef = useRef(0);
  const lastTwoFistsToggleRef = useRef(0);

  // Update engine settings when props change
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setOptions({
        sensitivity: settings.sensitivity ?? 'medium',
        cursorSmoothing: settings.cursorSmoothing ?? 0.65,
        pinchThresholdScale: settings.pinchThresholdScale ?? 0.36,
        swipeVelocityThreshold: settings.swipeVelocityThreshold ?? 0.08,
        invertX: settings.invertX ?? false
      });
    }
  }, [settings]);

  // Navigate tools cycle helper
  const navigateTool = useCallback((dir) => {
    const tools = ['Explore', 'Waypoint', 'Route', 'Rover', 'Astronaut', 'Measure', 'Layers'];
    const idx = tools.indexOf(activeTool);
    if (idx !== -1 && onSelectTool) {
      const nextIdx = (idx + dir + tools.length) % tools.length;
      onSelectTool(tools[nextIdx]);
    }
  }, [activeTool, onSelectTool]);

  // --------------------------------------------------------------------------
  // Core Unified Gesture Dispatcher (Handles both Python & Browser events)
  // --------------------------------------------------------------------------
  const dispatchGestureCycle = useCallback(({
    gesture = GESTURE_TYPES.NONE,
    cursor = null,
    confidence = 0,
    isPinching: isPinchActive = false,
    landmarks = null,
    handDetected: isDetected = false,
    multiGesture = null,
    zoomAction = null,
    dragDelta: directDragDelta = null,
    isFromPython = false
  }) => {
    const now = performance.now();

    if (!isDetected) {
      setHandDetected(false);
      setCurrentGesture(GESTURE_TYPES.NONE);
      setActivationProgress(0);
      setCancelProgress(0);
      setLandmarksData(null);
      setIsPinching(false);
      palmHoldStartRef.current = 0;
      thumbsUpHoldStartRef.current = 0;
      return;
    }

    setHandDetected(true);
    if (landmarks) {
      setLandmarksData(landmarks);
    }
    setConfidence(confidence || 90);
    const activeDisplayGesture = (multiGesture && multiGesture !== 'NONE') ? multiGesture : gesture;
    setCurrentGesture(activeDisplayGesture);

    // 1. Process Virtual Cursor with InvertX & Exponential Smoothing
    let targetX = smoothedCursorRef.current.x;
    let targetY = smoothedCursorRef.current.y;

    if (cursor && typeof cursor.x === 'number' && typeof cursor.y === 'number') {
      const rawX = cursor.x;
      const rawY = cursor.y;
      const adjustedX = settings.invertX ? (1 - rawX) : rawX;
      const adjustedY = rawY;

      const smoothing = settings.cursorSmoothing ?? 0.65;
      const alpha = 1 - smoothing;
      targetX = smoothedCursorRef.current.x + alpha * (adjustedX - smoothedCursorRef.current.x);
      targetY = smoothedCursorRef.current.y + alpha * (adjustedY - smoothedCursorRef.current.y);

      targetX = Math.max(0, Math.min(1, targetX));
      targetY = Math.max(0, Math.min(1, targetY));
    }

    const calculatedDragDelta = directDragDelta || {
      x: targetX - smoothedCursorRef.current.x,
      y: targetY - smoothedCursorRef.current.y
    };
    smoothedCursorRef.current = { x: targetX, y: targetY };

    setCursorPos({ x: targetX, y: targetY });
    if (onCursorUpdate) {
      onCursorUpdate({ x: targetX, y: targetY });
    }

    // 2. TWO_FISTS_TOGETHER: OPENS MAP FULL VIEW ONLY!
    // (Never closes map; closing map is done by ONE FIST CLOSED)
    // Strictly blocked if an overlay/modal is already open
    if (gesture === 'TWO_FISTS_TOGETHER' || multiGesture === 'TWO_FISTS_TOGETHER' || gesture === GESTURE_TYPES.TWO_FISTS_TOGETHER) {
      if (!isMapFullScreen && !isAnyOverlayOpen) {
        if (now - lastTwoFistsToggleRef.current > 1000) {
          lastTwoFistsToggleRef.current = now;
          hudAudio.playSelect();
          if (!isActive && onToggleActive) {
            onToggleActive(true);
          }
          if (onOpenMapFullScreen) {
            onOpenMapFullScreen();
          } else if (onToggleMapFullScreen) {
            onToggleMapFullScreen();
          }
          if (onNotify) {
            onNotify('Gesture: Two Fists Closed -> Tactical Map Full Screen Opened', 'success');
          }
        }
      }
    }

    // 3. GLOBAL GESTURE: THUMBS UP (Hold ~0.45s)
    // "change CLOSED_FIST (Single Hold) to THUMBS_UP ... and ensure one closed fist does nothing"
    // Closes any open window, modal, drawer, or full-screen map and immediately returns to camera feed
    const isThumbsUp = gesture === GESTURE_TYPES.THUMBS_UP || gesture === 'THUMBS_UP';
    const cancelTarget = settings.cancelHoldMs ?? 450;

    if (isThumbsUp) {
      lastThumbsUpSeenRef.current = now;
      if (!thumbsUpHoldStartRef.current) {
        thumbsUpHoldStartRef.current = now;
      }
      const holdDuration = now - thumbsUpHoldStartRef.current;
      const progress = Math.min(100, Math.round((holdDuration / cancelTarget) * 100));
      setCancelProgress(progress);

      if (holdDuration >= cancelTarget) {
        hudAudio.playSelect();
        thumbsUpHoldStartRef.current = 0;
        setCancelProgress(0);
        if (onCloseModals) {
          onCloseModals();
        } else if (onCloseMapFullScreen) {
          onCloseMapFullScreen();
        } else if (onToggleMapFullScreen) {
          onToggleMapFullScreen();
        }
        if (onNotify) {
          onNotify('Thumbs Up: Returned to Camera Feed — All Windows & Overlays Closed', 'warning');
        }
      }
    } else {
      if (now - lastThumbsUpSeenRef.current > 200) {
        thumbsUpHoldStartRef.current = 0;
        setCancelProgress(0);
      }
    }

    // 4. ONE CLOSED FIST DOES NOTHING (Explicit User Requirement):
    // "and ensure one closed fist does nothing"
    const isTwoFists = gesture === 'TWO_FISTS_TOGETHER' || multiGesture === 'TWO_FISTS_TOGETHER' || gesture === GESTURE_TYPES.TWO_FISTS_TOGETHER;
    const isSingleFist = !isTwoFists && (gesture === GESTURE_TYPES.CLOSED_FIST || gesture === 'CLOSED_FIST');
    if (isSingleFist) {
      // Single closed fist performs strictly no operation
      return;
    }

    // =========================================================================
    // BRANCH A: TACTICAL MAP FULL SCREEN MODE (isMapFullScreen === true)
    // ONLY SPECIFIC GESTURES WORK; ALL OTHER HUD COMMANDS ARE STRICTLY FORGOTTEN:
    // 1. Thumbs Up (handled above) -> CLOSES / EXITS Full Screen Map
    // 2. Two-Hand Spread / Contract -> Map Zoom In / Out (camera feed stays 1:1)
    // 3. Pinch + Drag Across -> Pan Map / Rotate Globe
    // 4. Pinch + Drag Up / Down -> Fine Zoom Map
    // Note: Single closed fist does nothing.
    // =========================================================================
    if (isMapFullScreen) {
      if (isThumbsUp) {
        // Thumbs Up hold in progress; skip map panning/zooming
        return;
      }

      // 2. Two-Hand Spread / Contract -> Map Zoom In / Out
      if (gesture === 'ZOOM_IN' || gesture === 'ZOOM_OUT' || (zoomAction && zoomAction !== 'NONE')) {
        if (now - lastZoomActionTimeRef.current > 80) {
          if (gesture === 'ZOOM_IN' || zoomAction === 'IN') {
            if (onMapZoom) onMapZoom(0.08);
            lastZoomActionTimeRef.current = now;
          } else if (gesture === 'ZOOM_OUT' || zoomAction === 'OUT') {
            if (onMapZoom) onMapZoom(-0.08);
            lastZoomActionTimeRef.current = now;
          }
        }
      }

      // 3 & 4. Pinch + Drag (Pan Map) & Pinch + Drag Up / Down (Fine Zoom Map)
      const isCurrentlyPinching = isPinchActive || gesture === GESTURE_TYPES.PINCH || gesture === 'PINCH';
      setIsPinching(isCurrentlyPinching);

      if (isCurrentlyPinching && calculatedDragDelta) {
        const dx = calculatedDragDelta.x || 0;
        const dy = calculatedDragDelta.y || 0;
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);

        // 4. Fine Zoom Map (Pinch + Drag Up / Down)
        // Upward drag (dy < -0.012) zooms in; downward drag (dy > 0.012) zooms out
        if (absY > 0.012 && absY > absX * 0.75) {
          if (now - lastZoomActionTimeRef.current > 90) {
            if (dy < -0.012) {
              if (onMapZoom) onMapZoom(0.06);
              lastZoomActionTimeRef.current = now;
            } else if (dy > 0.012) {
              if (onMapZoom) onMapZoom(-0.06);
              lastZoomActionTimeRef.current = now;
            }
          }
        }
        // 3. Pan Map / Rotate Globe (Pinch + Drag Across)
        else if (absX > 0.004 || absY > 0.004) {
          if (onMapPan) {
            onMapPan(calculatedDragDelta);
          }
        }
      }

      // STRICTLY FORGET ALL OTHER HUD COMMANDS IN FULL SCREEN MAP:
      // No button clicks, tool navigation, waypoint placement, or confirmation
      return;
    }

    // =========================================================================
    // BRANCH B: NORMAL CAMERA / HUD MODE (isMapFullScreen === false)
    // Map Panning and Map Zooming are strictly NOT CHECKED OR EXECUTED against camera.
    // Standard HUD interactions are fully supported.
    // =========================================================================

    const actTarget = settings.activationHoldMs ?? 550;

    // 1. ACTIVATION LOGIC: Hold Open Palm (Snappy with 200ms grace window)
    if (gesture === GESTURE_TYPES.OPEN_PALM || gesture === 'OPEN_PALM') {
      lastPalmSeenRef.current = now;
      if (!palmHoldStartRef.current) {
        palmHoldStartRef.current = now;
      }
      const holdDuration = now - palmHoldStartRef.current;
      const progress = Math.min(100, Math.round((holdDuration / actTarget) * 100));
      setActivationProgress(progress);

      if (holdDuration >= actTarget && !isActive) {
        hudAudio.playSelect();
        if (onToggleActive) onToggleActive(true);
        palmHoldStartRef.current = 0;
        setActivationProgress(0);
        if (onNotify) {
          onNotify(
            isFromPython
              ? 'Hand Gesture Control: ACTIVE (Python 60 FPS Accelerated)'
              : 'Hand Gesture Control: ACTIVE (Browser Engine)',
            'success'
          );
        }
      }
    } else {
      if (now - lastPalmSeenRef.current > 200) {
        palmHoldStartRef.current = 0;
        setActivationProgress(0);
      }
    }

    // 2. ACTIVE GESTURE ACTIONS DISPATCH (Pure Hand Gestures Only — No Floating Pointer)
    if (isActive) {
      // B. SWIPE NAVIGATION (Swipe Left / Swipe Right) -> Cycle navigation tools (BLOCKED if overlay open)
      if (!isAnyOverlayOpen && (gesture === GESTURE_TYPES.SWIPE_LEFT || gesture === 'SWIPE_LEFT') && now - lastActionTimeRef.current > 350) {
        hudAudio.playSelect();
        navigateTool(-1);
        lastActionTimeRef.current = now + 150;
      } else if (!isAnyOverlayOpen && (gesture === GESTURE_TYPES.SWIPE_RIGHT || gesture === 'SWIPE_RIGHT') && now - lastActionTimeRef.current > 350) {
        hudAudio.playSelect();
        navigateTool(1);
        lastActionTimeRef.current = now + 150;
      }
      // C. TWO FINGERS (V) -> Activate Waypoint tool (BLOCKED if overlay open)
      else if (!isAnyOverlayOpen && (gesture === GESTURE_TYPES.TWO_FINGERS || gesture === 'TWO_FINGERS') && activeTool !== 'Waypoint' && now - lastActionTimeRef.current > 400) {
        hudAudio.playWaypointPlaced();
        if (onSelectTool) onSelectTool('Waypoint');
        lastActionTimeRef.current = now + 300;
      }

    } else {
      setIsPinching(false);
    }
  }, [
    isActive,
    isMapFullScreen,
    isAnyOverlayOpen,
    activeTool,
    activeDestination,
    settings.activationHoldMs,
    settings.cancelHoldMs,
    settings.invertX,
    settings.cursorSmoothing,
    onToggleActive,
    onCursorUpdate,
    onSelectTool,
    onConfirmDestination,
    onMapPan,
    onMapZoom,
    onOpenMapFullScreen,
    onCloseMapFullScreen,
    onToggleMapFullScreen,
    onCloseModals,
    onNotify,
    navigateTool
  ]);

  // --------------------------------------------------------------------------
  // WebSocket Handler for Python OpenCV + MediaPipe Server (ws://localhost:8765)
  // --------------------------------------------------------------------------
  const handleWebSocketMessage = useCallback((event) => {
    try {
      const raw = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      if (!raw) return;

      lastPythonMsgTimeRef.current = performance.now();

      // Support client camera frame transfer if requested (mode 4b)
      if (raw.type === 'request_frame' && videoRef?.current && wsRef.current?.readyState === WebSocket.OPEN) {
        try {
          if (!offscreenCanvasRef.current) {
            offscreenCanvasRef.current = document.createElement('canvas');
            offscreenCanvasRef.current.width = 320;
            offscreenCanvasRef.current.height = 240;
          }
          const cvs = offscreenCanvasRef.current;
          const ctx = cvs.getContext('2d');
          ctx.drawImage(videoRef.current, 0, 0, cvs.width, cvs.height);
          const b64 = cvs.toDataURL('image/jpeg', 0.65).split(',')[1];
          wsRef.current.send(JSON.stringify({ type: 'frame', data: b64 }));
        } catch (e) {}
        return;
      }

      const primary = raw.primaryHand || {};
      const multi = raw.multiHand || {};

      // Flexible extraction across single/multi hand and flat/nested schemas
      const gesture = raw.gesture || primary.gesture || raw.event || raw.action || GESTURE_TYPES.NONE;
      const multiGesture = multi.gesture || (gesture === 'TWO_FISTS_TOGETHER' ? 'TWO_FISTS_TOGETHER' : null);
      const zoomAction = raw.zoomAction || multi.zoomAction || (gesture === 'ZOOM_IN' ? 'IN' : gesture === 'ZOOM_OUT' ? 'OUT' : null);

      let cursor = raw.cursor || primary.cursor;
      if (!cursor && raw.x !== undefined && raw.y !== undefined) {
        cursor = { x: raw.x, y: raw.y };
      }

      let conf = raw.confidence !== undefined ? raw.confidence : primary.confidence;
      if (conf === undefined || conf === null) conf = 95;
      if (conf <= 1) conf = Math.round(conf * 100);

      const isPinch = raw.isPinching !== undefined
        ? raw.isPinching
        : (primary.isPinching !== undefined ? primary.isPinching : gesture === 'PINCH');

      const landmarks = raw.landmarks || (primary.landmarks ? [primary.landmarks] : null);

      const detected = raw.handsDetected !== undefined
        ? raw.handsDetected > 0
        : (raw.handDetected !== undefined
          ? Boolean(raw.handDetected)
          : (raw.hands_detected !== undefined ? raw.hands_detected > 0 : (gesture !== GESTURE_TYPES.NONE || Boolean(cursor))));

      // Dispatch with priority from Python server
      dispatchGestureCycle({
        gesture,
        cursor,
        confidence: conf,
        isPinching: isPinch,
        landmarks,
        handDetected: detected,
        multiGesture,
        zoomAction,
        dragDelta: raw.dragDelta || primary.dragDelta || null,
        isFromPython: true
      });
    } catch (err) {
      console.warn('[HandTrackingManager] Error parsing Python WebSocket packet:', err);
    }
  }, [videoRef, dispatchGestureCycle]);

  // Keep latest callback references in refs to decouple WebSocket lifecycle from React re-renders
  const handleWebSocketMessageRef = useRef(handleWebSocketMessage);
  useEffect(() => {
    handleWebSocketMessageRef.current = handleWebSocketMessage;
  }, [handleWebSocketMessage]);

  const onPythonBackendStatusChangeRef = useRef(onPythonBackendStatusChange);
  useEffect(() => {
    onPythonBackendStatusChangeRef.current = onPythonBackendStatusChange;
  }, [onPythonBackendStatusChange]);

  const onNotifyRef = useRef(onNotify);
  useEffect(() => {
    onNotifyRef.current = onNotify;
  }, [onNotify]);

  // Connect & maintain persistent WebSocket connection to ws://localhost:8765
  useEffect(() => {
    let isMounted = true;

    function connect() {
      if (!isMounted) return;
      try {
        const ws = new WebSocket('ws://localhost:8765');
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          console.log('[HandTrackingManager] Python OpenCV + MediaPipe Engine CONNECTED: ws://localhost:8765');
          setIsPythonBackendConnected(true);
          onPythonBackendStatusChangeRef.current?.(true);

          // Synchronize currently active camera to Python server immediately
          const curName = activeDeviceName || localStorage.getItem('redatlas_selected_camera_name') || 'Logi C270 HD WebCam';
          const l = curName.toLowerCase();
          let targetIdx = 2; // Default to external Logi C270
          if (l.includes('integrated') || l.includes('built-in') || l.includes('internal') || l.includes('facetime')) {
            targetIdx = 1;
          } else if (l.includes('smart') || l.includes('connect')) {
            targetIdx = 0;
          }
          try {
            ws.send(JSON.stringify({ type: 'select_camera', index: targetIdx, name: curName }));
          } catch (e) {}
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          handleWebSocketMessageRef.current?.(event);
        };

        ws.onerror = () => {
          // Normal when server is offline or restarting
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setIsPythonBackendConnected((prev) => {
            if (prev) {
              onPythonBackendStatusChangeRef.current?.(false);
              onNotifyRef.current?.('Python Engine Offline — Reverted to Browser MediaPipe', 'warning');
            }
            return false;
          });
          wsRef.current = null;
          // Retry connection every 3 seconds only if mounted
          if (isMounted) {
            reconnectTimeoutRef.current = setTimeout(connect, 3000);
          }
        };
      } catch (err) {
        if (!isMounted) return;
        setIsPythonBackendConnected(false);
        onPythonBackendStatusChangeRef.current?.(false);
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      }
    }

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch (e) {}
        wsRef.current = null;
      }
    };
  }, []); // Run ONCE on mount, cleanup on unmount only

  // Sync camera device selection with Python server
  useEffect(() => {
    if (activeDeviceName && wsRef.current?.readyState === WebSocket.OPEN) {
      const l = activeDeviceName.toLowerCase();
      let targetIdx = 2;
      if (l.includes('integrated') || l.includes('built-in') || l.includes('internal') || l.includes('facetime')) {
        targetIdx = 1;
      } else if (l.includes('smart') || l.includes('connect')) {
        targetIdx = 0;
      }
      try {
        wsRef.current.send(JSON.stringify({ type: 'select_camera', index: targetIdx, name: activeDeviceName }));
      } catch (e) {}
    }
  }, [activeDeviceName]);

  // --------------------------------------------------------------------------
  // In-Browser MediaPipe HandLandmarker Fallback Engine
  // --------------------------------------------------------------------------
  useEffect(() => {
    let isCancelled = false;

    async function initHandLandmarker() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        if (isCancelled) return;

        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numHands: 2,
          minHandDetectionConfidence: 0.45,
          minHandPresenceConfidence: 0.45,
          minTrackingConfidence: 0.45
        });

        if (!isCancelled) {
          landmarkerRef.current = landmarker;
          setLandmarkerReady(true);
        }
      } catch (err) {
        console.warn('MediaPipe HandLandmarker GPU fallback to CPU:', err);
        try {
          const vision = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
          );
          const landmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
              delegate: 'CPU'
            },
            runningMode: 'VIDEO',
            numHands: 2,
            minHandDetectionConfidence: 0.45,
            minHandPresenceConfidence: 0.45,
            minTrackingConfidence: 0.45
          });
          landmarkerRef.current = landmarker;
          setLandmarkerReady(true);
        } catch (e2) {
          console.warn('In-browser hand tracking hardware offline:', e2);
        }
      }
    }

    initHandLandmarker();

    return () => {
      isCancelled = true;
      if (landmarkerRef.current) {
        try {
          landmarkerRef.current.close();
        } catch (e) {}
      }
    };
  }, []);

  // --------------------------------------------------------------------------
  // Frame Processing Loop
  // Skips in-browser inference if Python OpenCV server is actively streaming!
  // --------------------------------------------------------------------------
  const processFrame = useCallback(() => {
    const now = performance.now();
    const isPythonStreaming = isPythonBackendConnected && (now - lastPythonMsgTimeRef.current < 1200);

    // Only run in-browser MediaPipe if Python backend is offline or stopped streaming
    if (!isPythonStreaming) {
      const video = videoRef?.current;
      const landmarker = landmarkerRef.current;

      if (video && video.readyState >= 2 && landmarker) {
        if (video.currentTime !== lastVideoTimeRef.current) {
          lastVideoTimeRef.current = video.currentTime;
          const timestamp = performance.now();

          try {
            const results = landmarker.detectForVideo(video, timestamp);

            if (results && results.landmarks && results.landmarks.length > 0) {
              // Strictly validate hand anatomy to reject false face/nose detections
              const validLandmarks = results.landmarks.filter((lms) => {
                if (!lms || lms.length < 21) return false;
                let minX = 1, maxX = 0, minY = 1, maxY = 0;
                for (let i = 0; i < 21; i++) {
                  if (lms[i].x < minX) minX = lms[i].x;
                  if (lms[i].x > maxX) maxX = lms[i].x;
                  if (lms[i].y < minY) minY = lms[i].y;
                  if (lms[i].y > maxY) maxY = lms[i].y;
                }
                const bboxW = maxX - minX;
                const bboxH = maxY - minY;
                const palmLen = Math.hypot(lms[9].x - lms[0].x, lms[9].y - lms[0].y);
                const palmBreadth = Math.hypot(lms[17].x - lms[5].x, lms[17].y - lms[5].y);
                return bboxW >= 0.040 && bboxH >= 0.044 && palmLen >= 0.028 && palmBreadth >= 0.020;
              });

              if (validLandmarks.length > 0) {
                let multiGesture = null;
                let zoomAction = null;

                if (validLandmarks.length >= 2) {
                  const multiAnalysis = engineRef.current.analyzeTwoHands(validLandmarks);
                  if (multiAnalysis) {
                    multiGesture = multiAnalysis.gesture;
                    zoomAction = multiAnalysis.zoomAction;
                  }
                }

                const primaryLandmarks = validLandmarks[0];
                const analysis = engineRef.current.analyzeSingleHand(primaryLandmarks, 'Right');

                if (analysis.gesture && analysis.gesture !== GESTURE_TYPES.NONE) {
                  dispatchGestureCycle({
                    gesture: analysis.gesture,
                    cursor: analysis.cursor,
                    confidence: Math.round(analysis.confidence * 100),
                    isPinching: analysis.isPinching,
                    landmarks: validLandmarks,
                    handDetected: true,
                    multiGesture,
                    zoomAction,
                    isFromPython: false
                  });
                } else {
                  dispatchGestureCycle({
                    gesture: GESTURE_TYPES.NONE,
                    cursor: null,
                    confidence: 0,
                    isPinching: false,
                    landmarks: null,
                    handDetected: false,
                    multiGesture: null,
                    zoomAction: null,
                    isFromPython: false
                  });
                }
              } else {
                dispatchGestureCycle({
                  gesture: GESTURE_TYPES.NONE,
                  cursor: null,
                  confidence: 0,
                  isPinching: false,
                  landmarks: null,
                  handDetected: false,
                  multiGesture: null,
                  zoomAction: null,
                  isFromPython: false
                });
              }
            } else {
              dispatchGestureCycle({
                gesture: GESTURE_TYPES.NONE,
                cursor: null,
                confidence: 0,
                isPinching: false,
                landmarks: null,
                handDetected: false,
                multiGesture: null,
                zoomAction: null,
                isFromPython: false
              });
            }
          } catch (e) {
            // Frame skip handling
          }
        }
      }
    }

    animFrameRef.current = requestAnimationFrame(processFrame);
  }, [
    isPythonBackendConnected,
    videoRef,
    dispatchGestureCycle
  ]);

  useEffect(() => {
    if (landmarkerReady) {
      animFrameRef.current = requestAnimationFrame(processFrame);
    }
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [landmarkerReady, processFrame]);

  // Keyboard shortcut fallback [G] to toggle hand gesture control
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.key === 'g' || e.key === 'G') {
        const nextState = !isActive;
        hudAudio.playSelect();
        onToggleActive(nextState);
        if (onNotify) {
          onNotify(nextState ? 'Hand Gesture Control: ENGAGED [G]' : 'Hand Gesture Control: STANDBY [G]', 'info');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, onToggleActive, onNotify]);

  return (
    <>
      {typeof children === 'function'
        ? children({
            landmarkerReady,
            handDetected,
            currentGesture,
            confidence,
            cursorPos,
            isPinching,
            activationProgress,
            cancelProgress,
            landmarksData,
            isPythonBackendConnected
          })
        : children}
    </>
  );
}
