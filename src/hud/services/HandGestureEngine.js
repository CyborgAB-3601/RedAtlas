/**
 * HandGestureEngine.js — Aerospace Avionics Hand Gesture Recognition Engine
 * Real-time 21-landmark classification, scale normalization, smoothing, and zoom controls.
 */

export const GESTURE_TYPES = {
  NONE: 'NONE',
  OPEN_PALM: 'OPEN_PALM',
  CLOSED_FIST: 'CLOSED_FIST',
  PINCH: 'PINCH',
  POINT: 'POINT',
  TWO_FINGERS: 'TWO_FINGERS',
  THUMBS_UP: 'THUMBS_UP',
  SWIPE_LEFT: 'SWIPE_LEFT',
  SWIPE_RIGHT: 'SWIPE_RIGHT',
  TWO_HAND_PINCH: 'TWO_HAND_PINCH',
  PINCH_DRAG: 'PINCH_DRAG',
  TWO_FISTS_TOGETHER: 'TWO_FISTS_TOGETHER'
};

// Landmarks Indices Reference
const LM = {
  WRIST: 0,
  THUMB_CMC: 1, THUMB_MCP: 2, THUMB_IP: 3, THUMB_TIP: 4,
  INDEX_MCP: 5, INDEX_PIP: 6, INDEX_DIP: 7, INDEX_TIP: 8,
  MIDDLE_MCP: 9, MIDDLE_PIP: 10, MIDDLE_DIP: 11, MIDDLE_TIP: 12,
  RING_MCP: 13, RING_PIP: 14, RING_DIP: 15, RING_TIP: 16,
  PINKY_MCP: 17, PINKY_PIP: 18, PINKY_DIP: 19, PINKY_TIP: 20
};

// Euclidean distance in 2D
function getDistance(p1, p2) {
  if (!p1 || !p2) return 999;
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

export class HandGestureEngine {
  constructor(options = {}) {
    this.options = {
      sensitivity: options.sensitivity || 'medium', // low | medium | high
      cursorSmoothing: options.cursorSmoothing ?? 0.65,
      pinchThresholdScale: options.pinchThresholdScale ?? 0.36,
      swipeVelocityThreshold: options.swipeVelocityThreshold ?? 0.08,
      invertX: options.invertX ?? false,
      ...options
    };

    // Tracking state history
    this.prevCursor = { x: 0.5, y: 0.5 };
    this.smoothedCursor = { x: 0.5, y: 0.5 };
    this.recentCentroids = [];
    this.lastSwipeTime = 0;
    this.swipeCooldownMs = 400;

    // Gesture debounce buffer
    this.gestureHistory = [];
    this.maxHistoryLen = 4;

    // Pinch hysteresis state
    this.wasPinching = false;
    this.lastPinchPos = null;

    // Multi-hand zoom tracking
    this.prevTwoHandDist = 0;
    this.twoHandStabilityCount = 0;
  }

  setOptions(newOpts = {}) {
    this.options = { ...this.options, ...newOpts };
  }

  /**
   * Process a single hand's 21 landmarks
   * @param {Array} landmarks - 21 normalized landmarks from MediaPipe
   * @param {String} handedness - 'Left' | 'Right'
   * @returns {Object} Extracted hand features and primary gesture
   */
  analyzeSingleHand(landmarks, handedness = 'Right') {
    if (!landmarks || landmarks.length < 21) {
      return { gesture: GESTURE_TYPES.NONE, confidence: 0 };
    }

    const wrist = landmarks[LM.WRIST];
    const middleMcp = landmarks[LM.MIDDLE_MCP];
    const indexMcp = landmarks[LM.INDEX_MCP];
    const pinkyMcp = landmarks[LM.PINKY_MCP];

    // 0. Anatomical Hand Validation (Reject Face / Nose / Ambient noise)
    let minX = 1, maxX = 0, minY = 1, maxY = 0;
    for (let i = 0; i < 21; i++) {
      const pt = landmarks[i];
      if (pt.x < minX) minX = pt.x;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.y > maxY) maxY = pt.y;
    }
    const bboxW = maxX - minX;
    const bboxH = maxY - minY;
    const palmLength = getDistance(wrist, middleMcp);
    const palmBreadth = getDistance(indexMcp, pinkyMcp);

    if (bboxW < 0.040 || bboxH < 0.044 || palmLength < 0.028 || palmBreadth < 0.020) {
      return { gesture: GESTURE_TYPES.NONE, confidence: 0 };
    }

    // Reference scale: distance between wrist and middle MCP, reinforced with palm breadth
    const palmScale = Math.max(0.02, (palmLength + palmBreadth * 1.1) / 2);

    // Dynamic pinch threshold based on user sensitivity
    const sensMultiplier =
      this.options.sensitivity === 'high' ? 1.25 :
      this.options.sensitivity === 'low' ? 0.85 : 1.0;

    const pinchEnterThresh = palmScale * (this.options.pinchThresholdScale || 0.36) * sensMultiplier;
    const pinchExitThresh = pinchEnterThresh * 1.35; // Hysteresis prevents flickering

    // Robust Finger Extension Check (tolerant to noise on bad cameras)
    const isFingerExtended = (tipIdx, pipIdx, mcpIdx) => {
      const tipToWrist = getDistance(landmarks[tipIdx], wrist);
      const pipToWrist = getDistance(landmarks[pipIdx], wrist);
      const tipToMcp = getDistance(landmarks[tipIdx], landmarks[mcpIdx]);
      return (tipToWrist > pipToWrist * 1.02) && (tipToMcp > palmScale * 0.48);
    };

    const isFingerCurled = (tipIdx, pipIdx, mcpIdx) => {
      const tipToWrist = getDistance(landmarks[tipIdx], wrist);
      const pipToWrist = getDistance(landmarks[pipIdx], wrist);
      const tipToMcp = getDistance(landmarks[tipIdx], landmarks[mcpIdx]);
      return (tipToMcp < palmScale * 0.65) || (tipToWrist < pipToWrist * 1.06);
    };

    const isIndexExtended = isFingerExtended(LM.INDEX_TIP, LM.INDEX_PIP, LM.INDEX_MCP);
    const isMiddleExtended = isFingerExtended(LM.MIDDLE_TIP, LM.MIDDLE_PIP, LM.MIDDLE_MCP);
    const isRingExtended = isFingerExtended(LM.RING_TIP, LM.RING_PIP, LM.RING_MCP);
    const isPinkyExtended = isFingerExtended(LM.PINKY_TIP, LM.PINKY_PIP, LM.PINKY_MCP);

    const isIndexCurled = isFingerCurled(LM.INDEX_TIP, LM.INDEX_PIP, LM.INDEX_MCP);
    const isMiddleCurled = isFingerCurled(LM.MIDDLE_TIP, LM.MIDDLE_PIP, LM.MIDDLE_MCP);
    const isRingCurled = isFingerCurled(LM.RING_TIP, LM.RING_PIP, LM.RING_MCP);
    const isPinkyCurled = isFingerCurled(LM.PINKY_TIP, LM.PINKY_PIP, LM.PINKY_MCP);

    // Thumb extension check
    const thumbTip = landmarks[LM.THUMB_TIP];
    const isThumbExtended =
      getDistance(thumbTip, pinkyMcp) > palmScale * 0.72 &&
      getDistance(thumbTip, indexMcp) > palmScale * 0.42;

    const isThumbCurled = getDistance(thumbTip, indexMcp) < palmScale * 0.46;

    // Pinch distance check (with hysteresis + knuckle proximity)
    const rawPinchDist = getDistance(thumbTip, landmarks[LM.INDEX_TIP]);
    const dipPinchDist = getDistance(thumbTip, landmarks[LM.INDEX_DIP]);
    const thumbIndexDist = Math.min(rawPinchDist, dipPinchDist);

    let isPinching = false;
    if (this.wasPinching) {
      isPinching = thumbIndexDist <= pinchExitThresh;
    } else {
      isPinching = thumbIndexDist <= pinchEnterThresh;
    }
    this.wasPinching = isPinching;

    // Hand Center / Palm Centroid
    const palmCenter = {
      x: (wrist.x + middleMcp.x + indexMcp.x + pinkyMcp.x) / 4,
      y: (wrist.y + middleMcp.y + indexMcp.y + pinkyMcp.y) / 4
    };

    // Stabilized Cursor Target:
    // When pinching, blend towards the pinch contact midpoint to eliminate cursor jump
    let targetX, targetY;
    if (isPinching) {
      targetX = (landmarks[LM.INDEX_TIP].x + thumbTip.x) / 2;
      targetY = (landmarks[LM.INDEX_TIP].y + thumbTip.y) / 2;
    } else {
      targetX = landmarks[LM.INDEX_TIP].x;
      targetY = landmarks[LM.INDEX_TIP].y;
    }

    // Horizontal axis mapping (Direct vs Inverted)
    const rawCursorX = this.options.invertX ? (1 - targetX) : targetX;
    const rawCursorY = targetY;

    // Exponential Moving Average smoothing
    const alpha = 1 - Math.min(0.92, Math.max(0.1, this.options.cursorSmoothing));
    this.smoothedCursor.x = this.smoothedCursor.x * (1 - alpha) + rawCursorX * alpha;
    this.smoothedCursor.y = this.smoothedCursor.y * (1 - alpha) + rawCursorY * alpha;

    // Clamp cursor to valid 0-1 range
    this.smoothedCursor.x = Math.max(0.01, Math.min(0.99, this.smoothedCursor.x));
    this.smoothedCursor.y = Math.max(0.01, Math.min(0.99, this.smoothedCursor.y));

    // -------------------------------------------------------------
    // Intelligent Tolerant Gesture Classification
    // -------------------------------------------------------------
    let detectedGesture = GESTURE_TYPES.NONE;
    let confidence = 0.8;

    const extendedCount = (isIndexExtended ? 1 : 0) +
                          (isMiddleExtended ? 1 : 0) +
                          (isRingExtended ? 1 : 0) +
                          (isPinkyExtended ? 1 : 0) +
                          (isThumbExtended ? 1 : 0);

    const curledCount = (isIndexCurled ? 1 : 0) +
                        (isMiddleCurled ? 1 : 0) +
                        (isRingCurled ? 1 : 0) +
                        (isPinkyCurled ? 1 : 0);

    // 1. PINCH (Thumb + Index Pinch)
    if (isPinching) {
      detectedGesture = GESTURE_TYPES.PINCH;
      confidence = Math.max(0.85, 1 - (thumbIndexDist / pinchExitThresh) * 0.25);
    }
    // 2. OPEN PALM (At least 4 fingers extended)
    else if (extendedCount >= 4) {
      detectedGesture = GESTURE_TYPES.OPEN_PALM;
      confidence = 0.95;
    }
    // 3. THUMBS UP vs CLOSED FIST
    else if (curledCount >= 3 && !isIndexExtended) {
      const isThumbPointingUp = thumbTip.y < landmarks[LM.THUMB_MCP].y - palmScale * 0.2;
      if (isThumbPointingUp && !isThumbCurled) {
        detectedGesture = GESTURE_TYPES.THUMBS_UP;
        confidence = 0.93;
      } else {
        detectedGesture = GESTURE_TYPES.CLOSED_FIST;
        confidence = 0.9;
      }
    }
    // 4. TWO FINGERS (V / Victory - Waypoint mode)
    else if (isIndexExtended && isMiddleExtended && !isRingExtended && !isPinkyExtended) {
      detectedGesture = GESTURE_TYPES.TWO_FINGERS;
      confidence = 0.9;
    }
    // 5. POINT (Index extended, others relaxed or curled)
    else if (isIndexExtended && !isMiddleExtended && !isRingExtended) {
      detectedGesture = GESTURE_TYPES.POINT;
      confidence = 0.91;
    }

    // -------------------------------------------------------------
    // Velocity & Swipe Detection
    // -------------------------------------------------------------
    const now = performance.now();
    this.recentCentroids.push({ x: rawCursorX, y: rawCursorY, time: now });
    if (this.recentCentroids.length > 7) this.recentCentroids.shift();

    if (this.recentCentroids.length >= 4 && now - this.lastSwipeTime > this.swipeCooldownMs) {
      const oldest = this.recentCentroids[0];
      const newest = this.recentCentroids[this.recentCentroids.length - 1];
      const dt = (newest.time - oldest.time) / 1000;
      const dx = newest.x - oldest.x;

      if (dt > 0.05 && dt < 0.38) {
        const vx = dx / dt;
        if (vx < -0.8 && (isIndexExtended || isMiddleExtended || detectedGesture === GESTURE_TYPES.OPEN_PALM)) {
          detectedGesture = GESTURE_TYPES.SWIPE_LEFT;
          this.lastSwipeTime = now;
        } else if (vx > 0.8 && (isIndexExtended || isMiddleExtended || detectedGesture === GESTURE_TYPES.OPEN_PALM)) {
          detectedGesture = GESTURE_TYPES.SWIPE_RIGHT;
          this.lastSwipeTime = now;
        }
      }
    }

    // Debounce vote
    this.gestureHistory.push(detectedGesture);
    if (this.gestureHistory.length > this.maxHistoryLen) {
      this.gestureHistory.shift();
    }

    let finalGesture = detectedGesture;
    if (detectedGesture !== GESTURE_TYPES.SWIPE_LEFT && detectedGesture !== GESTURE_TYPES.SWIPE_RIGHT) {
      const counts = {};
      this.gestureHistory.forEach((g) => (counts[g] = (counts[g] || 0) + 1));
      const majority = Object.keys(counts).reduce((a, b) => (counts[a] > counts[b] ? a : b));
      if (counts[majority] >= 2) {
        finalGesture = majority;
      }
    }

    // Drag delta calculation when pinching (supports Map Pan & Vertical Pinch Zoom)
    let dragDelta = { x: 0, y: 0 };
    if (finalGesture === GESTURE_TYPES.PINCH) {
      if (this.lastPinchPos) {
        dragDelta = {
          x: this.smoothedCursor.x - this.lastPinchPos.x,
          y: this.smoothedCursor.y - this.lastPinchPos.y
        };
      }
      this.lastPinchPos = { ...this.smoothedCursor };
    } else {
      this.lastPinchPos = null;
    }

    return {
      gesture: finalGesture,
      rawGesture: detectedGesture,
      confidence,
      cursor: { ...this.smoothedCursor },
      palmCenter,
      palmScale,
      isPinching,
      pinchDistance: thumbIndexDist,
      dragDelta,
      curledCount,
      extendedCount,
      fingerStates: {
        thumb: isThumbExtended,
        index: isIndexExtended,
        middle: isMiddleExtended,
        ring: isRingExtended,
        pinky: isPinkyExtended
      }
    };
  }

  /**
   * Process Two Hands for Multi-Hand Interactions (e.g. Distance Zoom & Two Fists Closed)
   * @param {Array} multiHandLandmarks - Array of hands landmarks
   * @returns {Object} Combined multi-hand gesture details
   */
  analyzeTwoHands(multiHandLandmarks) {
    if (!multiHandLandmarks || multiHandLandmarks.length < 2) {
      this.prevTwoHandDist = 0;
      return null;
    }

    const hand1 = this.analyzeSingleHand(multiHandLandmarks[0], 'Right');
    const hand2 = this.analyzeSingleHand(multiHandLandmarks[1], 'Left');

    // Distance between palm centers of both hands
    const p1 = hand1.palmCenter || multiHandLandmarks[0][LM.MIDDLE_MCP];
    const p2 = hand2.palmCenter || multiHandLandmarks[1][LM.MIDDLE_MCP];
    const currentDistance = getDistance(p1, p2);

    // Check for Two Fists Closed Together (Tactical Map Full Screen Activation)
    const isFist = (h) => {
      if (h.gesture === GESTURE_TYPES.CLOSED_FIST || h.rawGesture === GESTURE_TYPES.CLOSED_FIST) return true;
      const f = h.fingerStates || {};
      const nonThumbExt = (f.index ? 1 : 0) + (f.middle ? 1 : 0) + (f.ring ? 1 : 0) + (f.pinky ? 1 : 0);
      return nonThumbExt <= 1 && (h.curledCount >= 3 || h.extendedCount <= 1);
    };

    const isHand1Fist = isFist(hand1);
    const isHand2Fist = isFist(hand2);

    if (isHand1Fist && isHand2Fist && currentDistance < 0.65) {
      return {
        gesture: GESTURE_TYPES.TWO_FISTS_TOGETHER,
        hand1,
        hand2,
        handsDistance: currentDistance
      };
    }

    let deltaDist = 0;
    if (this.prevTwoHandDist > 0) {
      deltaDist = currentDistance - this.prevTwoHandDist;
    }
    this.prevTwoHandDist = currentDistance;

    let zoomAction = 'NONE';
    let multiGesture = GESTURE_TYPES.NONE;

    if (deltaDist > 0.005) {
      zoomAction = 'IN';
      multiGesture = GESTURE_TYPES.ZOOM_IN;
    } else if (deltaDist < -0.005) {
      zoomAction = 'OUT';
      multiGesture = GESTURE_TYPES.ZOOM_OUT;
    } else if (hand1.gesture === GESTURE_TYPES.OPEN_PALM && hand2.gesture === GESTURE_TYPES.OPEN_PALM) {
      multiGesture = GESTURE_TYPES.OPEN_PALM;
    }

    return {
      gesture: multiGesture,
      hand1,
      hand2,
      handsDistance: currentDistance,
      deltaDist,
      zoomAction
    };
  }
}
