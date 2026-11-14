#!/usr/bin/env python3
"""
=============================================================================
 RedAtlas HUD — Aerospace Avionics Hand Gesture Recognition Server
 Real-time MediaPipe Hand Landmarks + Kazuhito00 Takahashi Keypoint Classifier
 WebSocket server on ws://localhost:8765
=============================================================================
"""

import sys
import os
import time
import math
import json
import base64
import asyncio
import logging
import argparse
import threading
import urllib.request
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple

import cv2
import numpy as np
import websockets

# MediaPipe Tasks Vision
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

# ---------------------------------------------------------------------------
# Configuration & Constants
# ---------------------------------------------------------------------------
DEFAULT_HOST = "0.0.0.0"
DEFAULT_PORT = 8765
MODEL_ASSET_FILENAME = "hand_landmarker.task"
WEIGHTS_FILENAME = "gesture_classifier_weights.npz"
MODEL_DOWNLOAD_URL = (
    "https://storage.googleapis.com/mediapipe-models/hand_landmarker/"
    "hand_landmarker/float16/1/hand_landmarker.task"
)

# Landmark Indices
LM_WRIST = 0
LM_THUMB_CMC = 1
LM_THUMB_MCP = 2
LM_THUMB_IP = 3
LM_THUMB_TIP = 4

LM_INDEX_MCP = 5
LM_INDEX_PIP = 6
LM_INDEX_DIP = 7
LM_INDEX_TIP = 8

LM_MIDDLE_MCP = 9
LM_MIDDLE_PIP = 10
LM_MIDDLE_DIP = 11
LM_MIDDLE_TIP = 12

LM_RING_MCP = 13
LM_RING_PIP = 14
LM_RING_DIP = 15
LM_RING_TIP = 16

LM_PINKY_MCP = 17
LM_PINKY_PIP = 18
LM_PINKY_DIP = 19
LM_PINKY_TIP = 20

# Gesture Names
GESTURE_OPEN_PALM = "OPEN_PALM"
GESTURE_CLOSED_FIST = "CLOSED_FIST"
GESTURE_PINCH = "PINCH"
GESTURE_POINT = "POINT"
GESTURE_TWO_FINGERS = "TWO_FINGERS"
GESTURE_THUMBS_UP = "THUMBS_UP"
GESTURE_SWIPE_LEFT = "SWIPE_LEFT"
GESTURE_SWIPE_RIGHT = "SWIPE_RIGHT"
GESTURE_TWO_FISTS_TOGETHER = "TWO_FISTS_TOGETHER"
GESTURE_ZOOM_IN = "ZOOM_IN"
GESTURE_ZOOM_OUT = "ZOOM_OUT"
GESTURE_NONE = "NONE"

STATIC_CLASSES = [
    GESTURE_OPEN_PALM,
    GESTURE_CLOSED_FIST,
    GESTURE_PINCH,
    GESTURE_POINT,
    GESTURE_TWO_FINGERS,
    GESTURE_THUMBS_UP
]

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger("RedAtlasGestureServer")


# ---------------------------------------------------------------------------
# Utility & Euclidean Distance
# ---------------------------------------------------------------------------
def get_distance(p1: Dict[str, float], p2: Dict[str, float]) -> float:
    """Euclidean distance in 2D space."""
    return math.hypot(p1["x"] - p2["x"], p1["y"] - p2["y"])


def ensure_model_asset(target_path: Path) -> Path:
    """Ensure hand_landmarker.task model is present locally, downloading if necessary."""
    if target_path.exists() and target_path.stat().st_size > 1000000:
        return target_path

    # Check current directory or script parent
    script_dir = Path(__file__).resolve().parent
    local_path = script_dir / MODEL_ASSET_FILENAME
    if local_path.exists() and local_path.stat().st_size > 1000000:
        return local_path

    logger.info(f"Downloading MediaPipe HandLandmarker asset from {MODEL_DOWNLOAD_URL}...")
    try:
        urllib.request.urlretrieve(MODEL_DOWNLOAD_URL, str(target_path))
        logger.info(f"Successfully downloaded model to {target_path}")
        return target_path
    except Exception as e:
        logger.error(f"Failed to download model asset: {e}")
        raise


# ---------------------------------------------------------------------------
# Kazuhito00 Takahashi Keypoint Preprocessing & Normalization
# ---------------------------------------------------------------------------
def pre_process_landmark(landmark_list: List[Tuple[float, float]]) -> List[float]:
    """
    Implements Kazuhito00 Takahashi's acclaimed landmark preprocessing:
    1. Translates all landmarks relative to the wrist (landmark 0).
    2. Flattens coordinates into a 1D list [dx0, dy0, dx1, dy1, ... dx20, dy20].
    3. Normalizes by dividing each value by the maximum absolute coordinate value.
    Resulting vector is completely position- and scale-invariant in [-1.0, 1.0].
    """
    base_x, base_y = landmark_list[0][0], landmark_list[0][1]
    temp_list = []
    for x, y in landmark_list:
        temp_list.append(x - base_x)
        temp_list.append(y - base_y)

    max_value = max(map(abs, temp_list)) if temp_list else 1.0
    if max_value == 0.0:
        return [0.0] * len(temp_list)

    return [v / max_value for v in temp_list]


# ---------------------------------------------------------------------------
# Neural Keypoint Classifier (Takahashi Architecture)
# ---------------------------------------------------------------------------
class KazuhitoKeypointClassifier:
    """
    Trained Multi-Layer Perceptron (MLP) for 21-landmark Hand Gesture Classification.
    Input: 42 normalized features (Kazuhito00 Takahashi normalization).
    Hidden Layer 1: 64 neurons (ReLU)
    Hidden Layer 2: 32 neurons (ReLU)
    Output Layer: 6 gesture classes (Softmax)
    """

    def __init__(self, weights_path: Optional[Path] = None):
        self.weights_path = weights_path or (Path(__file__).resolve().parent / WEIGHTS_FILENAME)
        self.classes = STATIC_CLASSES
        self.W1, self.b1 = None, None
        self.W2, self.b2 = None, None
        self.W3, self.b3 = None, None
        self._load_or_train_weights()

    def _load_or_train_weights(self):
        """Loads weights from .npz or trains on-the-fly if not found."""
        if self.weights_path.exists():
            try:
                data = np.load(str(self.weights_path), allow_pickle=True)
                self.W1 = data["W1"]
                self.b1 = data["b1"]
                self.W2 = data["W2"]
                self.b2 = data["b2"]
                self.W3 = data["W3"]
                self.b3 = data["b3"]
                if "classes" in data:
                    self.classes = list(data["classes"])
                logger.info(f"Loaded neural keypoint classifier weights from {self.weights_path.name}")
                return
            except Exception as e:
                logger.warning(f"Error loading existing weights file ({e}). Retraining...")

        self._train_and_save_weights()

    def _train_and_save_weights(self):
        """Trains the Takahashi keypoint MLP on synthetic hand geometry dataset and saves weights."""
        logger.info("Training Kazuhito00 Takahashi Keypoint Classifier MLP...")

        def rotate_landmarks(landmarks, angle_deg):
            theta = math.radians(angle_deg)
            c, s = math.cos(theta), math.sin(theta)
            R = np.array([[c, -s], [s, c]])
            return landmarks @ R.T

        def generate_sample(gesture_idx):
            lm = np.zeros((21, 2), dtype=np.float32)
            lm[0] = [0.0, 0.0]
            lm[5] = [-0.15, -0.45]
            lm[9] = [0.0, -0.50]
            lm[13] = [0.13, -0.45]
            lm[17] = [0.23, -0.38]
            lm[1] = [-0.10, -0.15]
            lm[2] = [-0.20, -0.28]

            def make_finger(mcp_idx, is_extended, length_scale=1.0):
                l1, l2, l3 = 0.16 * length_scale, 0.12 * length_scale, 0.10 * length_scale
                base_pt = lm[mcp_idx]
                pip_idx = mcp_idx + 1
                dip_idx = mcp_idx + 2
                tip_idx = mcp_idx + 3
                if is_extended:
                    ray = base_pt - lm[0]
                    norm_ray = ray / (np.linalg.norm(ray) + 1e-6)
                    lm[pip_idx] = base_pt + norm_ray * l1
                    lm[dip_idx] = lm[pip_idx] + norm_ray * l2
                    lm[tip_idx] = lm[dip_idx] + norm_ray * l3
                else:
                    curl_dir = np.array([0.0, 0.8], dtype=np.float32) + np.random.uniform(-0.12, 0.12, 2)
                    curl_dir = curl_dir / (np.linalg.norm(curl_dir) + 1e-6)
                    lm[pip_idx] = base_pt + curl_dir * (l1 * 0.7)
                    lm[dip_idx] = lm[pip_idx] + curl_dir * (l2 * 0.6)
                    lm[tip_idx] = lm[dip_idx] + curl_dir * (l3 * 0.5)

            if gesture_idx == 0:  # OPEN_PALM
                make_finger(5, True, 1.0)
                make_finger(9, True, 1.05)
                make_finger(13, True, 0.98)
                make_finger(17, True, 0.85)
                lm[3] = [-0.30, -0.40]
                lm[4] = [-0.38, -0.52]
            elif gesture_idx == 1:  # CLOSED_FIST
                make_finger(5, False, 1.0)
                make_finger(9, False, 1.05)
                make_finger(13, False, 0.98)
                make_finger(17, False, 0.85)
                lm[3] = [-0.15, -0.32]
                lm[4] = [-0.02, -0.35]
            elif gesture_idx == 2:  # PINCH
                pinch_target = np.array([-0.18, -0.45], dtype=np.float32)
                lm[4] = pinch_target + np.random.uniform(-0.012, 0.012, 2)
                lm[3] = [-0.22, -0.35]
                lm[6] = [-0.16, -0.48]
                lm[7] = [-0.18, -0.46]
                lm[8] = pinch_target + np.random.uniform(-0.012, 0.012, 2)
                ext_others = np.random.rand() > 0.5
                make_finger(9, ext_others, 1.0)
                make_finger(13, ext_others, 0.98)
                make_finger(17, ext_others, 0.85)
            elif gesture_idx == 3:  # POINT
                make_finger(5, True, 1.0)
                make_finger(9, False, 1.05)
                make_finger(13, False, 0.98)
                make_finger(17, False, 0.85)
                lm[3] = [-0.14, -0.28]
                lm[4] = [-0.05, -0.32]
            elif gesture_idx == 4:  # TWO_FINGERS
                make_finger(5, True, 1.0)
                make_finger(9, True, 1.05)
                make_finger(13, False, 0.98)
                make_finger(17, False, 0.85)
                lm[3] = [-0.14, -0.28]
                lm[4] = [-0.05, -0.32]
            elif gesture_idx == 5:  # THUMBS_UP
                make_finger(5, False, 1.0)
                make_finger(9, False, 1.05)
                make_finger(13, False, 0.98)
                make_finger(17, False, 0.85)
                lm[3] = [-0.22, -0.46]
                lm[4] = [-0.25, -0.66]

            lm += np.random.normal(0, 0.015, lm.shape)
            lm = rotate_landmarks(lm, np.random.uniform(-30.0, 30.0))
            lm *= np.random.uniform(0.65, 1.35)

            temp = []
            base_x, base_y = lm[0][0], lm[0][1]
            for pt in lm:
                temp.append(pt[0] - base_x)
                temp.append(pt[1] - base_y)
            max_val = max(map(abs, temp))
            return [v / max_val if max_val != 0 else 0.0 for v in temp]

        X_list, y_list = [], []
        N_per_class = 2500
        for c in range(6):
            for _ in range(N_per_class):
                X_list.append(generate_sample(c))
                y_list.append(c)

        X = np.array(X_list, dtype=np.float32)
        y = np.array(y_list, dtype=np.int64)
        indices = np.random.permutation(len(X))
        X, y = X[indices], y[indices]

        W1 = np.random.randn(42, 64).astype(np.float32) * np.sqrt(2.0 / 42.0)
        b1 = np.zeros(64, dtype=np.float32)
        W2 = np.random.randn(64, 32).astype(np.float32) * np.sqrt(2.0 / 64.0)
        b2 = np.zeros(32, dtype=np.float32)
        W3 = np.random.randn(32, 6).astype(np.float32) * np.sqrt(2.0 / 32.0)
        b3 = np.zeros(6, dtype=np.float32)

        def relu(z): return np.maximum(0, z)
        def softmax(z):
            e = np.exp(z - np.max(z, axis=-1, keepdims=True))
            return e / np.sum(e, axis=-1, keepdims=True)

        lr, batch_size, epochs = 0.003, 64, 25
        mW1, vW1 = np.zeros_like(W1), np.zeros_like(W1)
        mb1, vb1 = np.zeros_like(b1), np.zeros_like(b1)
        mW2, vW2 = np.zeros_like(W2), np.zeros_like(W2)
        mb2, vb2 = np.zeros_like(b2), np.zeros_like(b2)
        mW3, vW3 = np.zeros_like(W3), np.zeros_like(W3)
        mb3, vb3 = np.zeros_like(b3), np.zeros_like(b3)
        beta1, beta2, eps = 0.9, 0.999, 1e-8
        step = 0

        for epoch in range(epochs):
            perm = np.random.permutation(len(X))
            for i in range(0, len(X), batch_size):
                step += 1
                xb = X[perm[i:i + batch_size]]
                yb = y[perm[i:i + batch_size]]
                bs = len(xb)

                z1 = xb @ W1 + b1
                a1 = relu(z1)
                z2 = a1 @ W2 + b2
                a2 = relu(z2)
                logits = a2 @ W3 + b3
                probs = softmax(logits)

                one_hot = np.zeros((bs, 6), dtype=np.float32)
                one_hot[np.arange(bs), yb] = 1.0
                dlogits = (probs - one_hot) / bs

                dW3 = a2.T @ dlogits
                db3 = np.sum(dlogits, axis=0)
                da2 = dlogits @ W3.T
                dz2 = da2 * (z2 > 0)

                dW2 = a1.T @ dz2
                db2 = np.sum(dz2, axis=0)
                da1 = dz2 @ W2.T
                dz1 = da1 * (z1 > 0)

                dW1 = xb.T @ dz1
                db1 = np.sum(dz1, axis=0)

                def update(w, dw, mw, vw):
                    mw = beta1 * mw + (1 - beta1) * dw
                    vw = beta2 * vw + (1 - beta2) * (dw ** 2)
                    m_hat = mw / (1 - beta1 ** step)
                    v_hat = vw / (1 - beta2 ** step)
                    w -= lr * m_hat / (np.sqrt(v_hat) + eps)
                    return w, mw, vw

                W3, mW3, vW3 = update(W3, dW3, mW3, vW3)
                b3, mb3, vb3 = update(b3, db3, mb3, vb3)
                W2, mW2, vW2 = update(W2, dW2, mW2, vW2)
                b2, mb2, vb2 = update(b2, db2, mb2, vb2)
                W1, mW1, vW1 = update(W1, dW1, mW1, vW1)
                b1, mb1, vb1 = update(b1, db1, mb1, vb1)

        self.W1, self.b1 = W1, b1
        self.W2, self.b2 = W2, b2
        self.W3, self.b3 = W3, b3
        np.savez(
            str(self.weights_path),
            W1=W1, b1=b1, W2=W2, b2=b2, W3=W3, b3=b3,
            classes=np.array(STATIC_CLASSES)
        )
        logger.info(f"Keypoint classifier trained and saved to {self.weights_path.name}")

    def predict(self, normalized_landmarks: List[float]) -> Tuple[str, float]:
        """Runs forward pass on 42-length normalized vector."""
        if len(normalized_landmarks) != 42:
            return GESTURE_NONE, 0.0

        x = np.array(normalized_landmarks, dtype=np.float32)
        z1 = np.maximum(0, x @ self.W1 + self.b1)
        z2 = np.maximum(0, z1 @ self.W2 + self.b2)
        logits = z2 @ self.W3 + self.b3
        e = np.exp(logits - np.max(logits))
        probs = e / np.sum(e)

        best_idx = int(np.argmax(probs))
        confidence = float(probs[best_idx])
        return self.classes[best_idx], confidence


# ---------------------------------------------------------------------------
# Hand Gesture Analyzer & Kinematics Engine
# ---------------------------------------------------------------------------
class HandGestureAnalyzer:
    """
    Comprehensive Hand Gesture Recognition Engine:
    - Combines Takahashi normalized neural classification with geometric invariants.
    - Pinch hysteresis & adaptive knuckle-proximity check.
    - Kinematic velocity vector tracking for SWIPE_LEFT / SWIPE_RIGHT.
    - Two-hand spatial interaction (TWO_FISTS_TOGETHER, ZOOM_IN, ZOOM_OUT).
    - Exponential Moving Average (EMA) cursor smoothing.
    """

    def __init__(self, options: Optional[Dict[str, Any]] = None):
        opts = options or {}
        self.sensitivity = opts.get("sensitivity", "medium")
        self.cursor_smoothing = opts.get("cursorSmoothing", 0.65)
        self.pinch_thresh_scale = opts.get("pinchThresholdScale", 0.36)
        self.swipe_velocity_thresh = opts.get("swipeVelocityThreshold", 0.70)
        self.invert_x = opts.get("invertX", False)

        # Classifier
        self.classifier = KazuhitoKeypointClassifier()

        # Per-Hand Tracking State (keyed by handedness: 'Right' and 'Left')
        self.smoothed_cursor = {
            "Right": {"x": 0.5, "y": 0.5},
            "Left": {"x": 0.5, "y": 0.5}
        }
        self.recent_centroids = {
            "Right": [],
            "Left": []
        }
        self.last_swipe_time = {
            "Right": 0.0,
            "Left": 0.0
        }
        self.swipe_cooldown_sec = 0.40
        self.was_pinching = {
            "Right": False,
            "Left": False
        }
        self.last_pinch_pos = {
            "Right": None,
            "Left": None
        }
        self.gesture_history = {
            "Right": [],
            "Left": []
        }
        self.max_history_len = 4

        # Two-Hand Zoom State
        self.prev_two_hand_dist = 0.0

    def update_options(self, opts: Dict[str, Any]):
        if "sensitivity" in opts:
            self.sensitivity = opts["sensitivity"]
        if "cursorSmoothing" in opts:
            self.cursor_smoothing = float(opts["cursorSmoothing"])
        if "pinchThresholdScale" in opts:
            self.pinch_thresh_scale = float(opts["pinchThresholdScale"])
        if "swipeVelocityThreshold" in opts:
            self.swipe_velocity_thresh = float(opts["swipeVelocityThreshold"])
        if "invertX" in opts:
            self.invert_x = bool(opts["invertX"])

    def analyze_single_hand(self, raw_landmarks: List[Dict[str, float]], handedness: str = "Right") -> Dict[str, Any]:
        """
        Processes 21 landmarks for a single hand:
        1. MediaPipe normalized coordinates -> Kazuhito00 Takahashi features.
        2. Neural keypoint classification.
        3. Geometric invariant validation (finger curls, pinch hysteresis).
        4. Kinematic velocity calculation (SWIPE_LEFT / SWIPE_RIGHT).
        5. Virtual cursor smoothing.
        """
        if not raw_landmarks or len(raw_landmarks) < 21:
            return {"gesture": GESTURE_NONE, "confidence": 0.0}

        wrist = raw_landmarks[LM_WRIST]
        middle_mcp = raw_landmarks[LM_MIDDLE_MCP]
        index_mcp = raw_landmarks[LM_INDEX_MCP]
        pinky_mcp = raw_landmarks[LM_PINKY_MCP]
        thumb_tip = raw_landmarks[LM_THUMB_TIP]
        index_tip = raw_landmarks[LM_INDEX_TIP]
        middle_tip = raw_landmarks[LM_MIDDLE_TIP]
        ring_tip = raw_landmarks[LM_RING_TIP]
        pinky_tip = raw_landmarks[LM_PINKY_TIP]
        index_dip = raw_landmarks[LM_INDEX_DIP]

        # 0. Strict Anatomical Hand Invariants (Rejects false detections on face/nose/clutter)
        # Optimized to reliably capture hands even on bad, noisy, or distant cameras
        xs = [p["x"] for p in raw_landmarks]
        ys = [p["y"] for p in raw_landmarks]
        bbox_w = max(xs) - min(xs)
        bbox_h = max(ys) - min(ys)
        palm_len = get_distance(wrist, middle_mcp)
        palm_breadth = get_distance(index_mcp, pinky_mcp)

        if bbox_w < 0.040 or bbox_h < 0.044 or palm_len < 0.028 or palm_breadth < 0.020:
            return {"gesture": GESTURE_NONE, "confidence": 0.0}

        # Verify fingertip dispersion (nose false positive points all collapse into a microscopic <0.025 dot)
        tips = [thumb_tip, index_tip, middle_tip, ring_tip, pinky_tip]
        tip_xs = [t["x"] for t in tips]
        tip_ys = [t["y"] for t in tips]
        tip_span = max(max(tip_xs) - min(tip_xs), max(tip_ys) - min(tip_ys))
        if tip_span < 0.025:
            return {"gesture": GESTURE_NONE, "confidence": 0.0}

        # 1. Palm Scale & Proportions
        palm_scale = max(0.02, (palm_len + palm_breadth * 1.1) / 2.0)

        # 2. Geometric Extension and Curl Detection (tolerant to noise on bad cameras)
        def is_finger_extended(tip_idx, pip_idx, mcp_idx):
            tip_to_wrist = get_distance(raw_landmarks[tip_idx], wrist)
            pip_to_wrist = get_distance(raw_landmarks[pip_idx], wrist)
            tip_to_mcp = get_distance(raw_landmarks[tip_idx], raw_landmarks[mcp_idx])
            return (tip_to_wrist > pip_to_wrist * 1.02) and (tip_to_mcp > palm_scale * 0.48)

        def is_finger_curled(tip_idx, pip_idx, mcp_idx):
            tip_to_wrist = get_distance(raw_landmarks[tip_idx], wrist)
            pip_to_wrist = get_distance(raw_landmarks[pip_idx], wrist)
            tip_to_mcp = get_distance(raw_landmarks[tip_idx], raw_landmarks[mcp_idx])
            return (tip_to_mcp < palm_scale * 0.70) or (tip_to_wrist < pip_to_wrist * 1.06)

        is_idx_ext = is_finger_extended(LM_INDEX_TIP, LM_INDEX_PIP, LM_INDEX_MCP)
        is_mid_ext = is_finger_extended(LM_MIDDLE_TIP, LM_MIDDLE_PIP, LM_MIDDLE_MCP)
        is_rng_ext = is_finger_extended(LM_RING_TIP, LM_RING_PIP, LM_RING_MCP)
        is_pnk_ext = is_finger_extended(LM_PINKY_TIP, LM_PINKY_PIP, LM_PINKY_MCP)

        is_idx_curl = is_finger_curled(LM_INDEX_TIP, LM_INDEX_PIP, LM_INDEX_MCP)
        is_mid_curl = is_finger_curled(LM_MIDDLE_TIP, LM_MIDDLE_PIP, LM_MIDDLE_MCP)
        is_rng_curl = is_finger_curled(LM_RING_TIP, LM_RING_PIP, LM_RING_MCP)
        is_pnk_curl = is_finger_curled(LM_PINKY_TIP, LM_PINKY_PIP, LM_PINKY_MCP)

        # Thumb extension/curl
        is_thumb_ext = (
            get_distance(thumb_tip, pinky_mcp) > palm_scale * 0.70
            and get_distance(thumb_tip, index_mcp) > palm_scale * 0.42
        )
        is_thumb_curl = get_distance(thumb_tip, index_mcp) < palm_scale * 0.45

        # 3. Pinch Detection with Hysteresis
        sens_mult = 1.25 if self.sensitivity == "high" else (0.85 if self.sensitivity == "low" else 1.0)
        pinch_enter_thresh = palm_scale * self.pinch_thresh_scale * sens_mult
        pinch_exit_thresh = pinch_enter_thresh * 1.35

        hand_key = handedness if handedness in ["Right", "Left"] else "Right"

        raw_pinch_dist = get_distance(thumb_tip, index_tip)
        dip_pinch_dist = get_distance(thumb_tip, index_dip)
        pinch_dist = min(raw_pinch_dist, dip_pinch_dist)

        if self.was_pinching[hand_key]:
            is_pinching = pinch_dist <= pinch_exit_thresh
        else:
            is_pinching = pinch_dist <= pinch_enter_thresh
        self.was_pinching[hand_key] = is_pinching

        # Palm Centroid
        palm_center = {
            "x": (wrist["x"] + middle_mcp["x"] + index_mcp["x"] + pinky_mcp["x"]) / 4.0,
            "y": (wrist["y"] + middle_mcp["y"] + index_mcp["y"] + pinky_mcp["y"]) / 4.0
        }

        # Virtual Cursor Target (blends into pinch midpoint during pinch to eliminate jumps)
        if is_pinching:
            target_x = (index_tip["x"] + thumb_tip["x"]) / 2.0
            target_y = (index_tip["y"] + thumb_tip["y"]) / 2.0
        else:
            target_x = index_tip["x"]
            target_y = index_tip["y"]

        # Horizontal Inversion & EMA Smoothing
        raw_cur_x = (1.0 - target_x) if self.invert_x else target_x
        raw_cur_y = target_y

        alpha = 1.0 - min(0.92, max(0.10, self.cursor_smoothing))
        cur = self.smoothed_cursor[hand_key]
        cur["x"] = cur["x"] * (1.0 - alpha) + raw_cur_x * alpha
        cur["y"] = cur["y"] * (1.0 - alpha) + raw_cur_y * alpha
        cur["x"] = max(0.01, min(0.99, cur["x"]))
        cur["y"] = max(0.01, min(0.99, cur["y"]))

        # 4. Kazuhito00 Takahashi Keypoint Normalization + Neural Classification
        landmark_pts = [(lm["x"], lm["y"]) for lm in raw_landmarks]
        norm_features = pre_process_landmark(landmark_pts)
        ml_gesture, ml_confidence = self.classifier.predict(norm_features)

        # 5. Geometric Rule Verification & Hybrid Consensus
        curled_count = sum([is_idx_curl, is_mid_curl, is_rng_curl, is_pnk_curl])
        extended_count = sum([is_idx_ext, is_mid_ext, is_rng_ext, is_pnk_ext, is_thumb_ext])

        is_thumb_pointing_up = (
            thumb_tip["y"] < raw_landmarks[LM_THUMB_MCP]["y"] - palm_scale * 0.22
            and abs(thumb_tip["x"] - raw_landmarks[LM_THUMB_MCP]["x"]) < palm_scale * 0.85
        )

        detected_gesture = ml_gesture
        confidence = ml_confidence

        # High-certainty geometric rules to validate or override ML
        # Fist / Thumbs Up takes priority over pinch when all 4 fingers are tightly curled
        if curled_count >= 3 and not is_idx_ext:
            if is_thumb_pointing_up and not is_thumb_curl:
                detected_gesture = GESTURE_THUMBS_UP
                confidence = 0.96
            else:
                detected_gesture = GESTURE_CLOSED_FIST
                confidence = 0.95
        elif is_pinching:
            detected_gesture = GESTURE_PINCH
            confidence = max(0.90, 1.0 - (pinch_dist / pinch_exit_thresh) * 0.20)
        elif extended_count >= 4:
            detected_gesture = GESTURE_OPEN_PALM
            confidence = 0.96
        elif is_idx_ext and is_mid_ext and not is_rng_ext and not is_pnk_ext:
            detected_gesture = GESTURE_TWO_FINGERS
            confidence = 0.95
        elif is_idx_ext and not is_mid_ext and not is_rng_ext and not is_pnk_ext:
            detected_gesture = GESTURE_POINT
            confidence = 0.95

        # 6. Kinematic Velocity & Swipe Detection
        now = time.time()
        centroids = self.recent_centroids[hand_key]
        centroids.append((raw_cur_x, raw_cur_y, now))
        if len(centroids) > 8:
            centroids.pop(0)

        if len(centroids) >= 4 and (now - self.last_swipe_time[hand_key]) > self.swipe_cooldown_sec:
            old_x, old_y, old_t = centroids[0]
            new_x, new_y, new_t = centroids[-1]
            dt = new_t - old_t
            dx = new_x - old_x

            if 0.05 < dt < 0.35:
                vx = dx / dt
                if (is_idx_ext or is_mid_ext or detected_gesture == GESTURE_OPEN_PALM):
                    if vx < -self.swipe_velocity_thresh:
                        detected_gesture = GESTURE_SWIPE_LEFT
                        self.last_swipe_time[hand_key] = now
                        confidence = 0.98
                    elif vx > self.swipe_velocity_thresh:
                        detected_gesture = GESTURE_SWIPE_RIGHT
                        self.last_swipe_time[hand_key] = now
                        confidence = 0.98

        # 7. Debounce & Majority Vote Smoothing
        history = self.gesture_history[hand_key]
        history.append(detected_gesture)
        if len(history) > self.max_history_len:
            history.pop(0)

        final_gesture = detected_gesture
        if detected_gesture not in [GESTURE_SWIPE_LEFT, GESTURE_SWIPE_RIGHT]:
            counts = {}
            for g in history:
                counts[g] = counts.get(g, 0) + 1
            majority = max(counts, key=counts.get)
            if counts[majority] >= 2:
                final_gesture = majority

        # Drag Delta (when pinching)
        drag_delta = {"x": 0.0, "y": 0.0}
        if final_gesture == GESTURE_PINCH:
            last_p = self.last_pinch_pos[hand_key]
            if last_p:
                drag_delta = {
                    "x": cur["x"] - last_p["x"],
                    "y": cur["y"] - last_p["y"]
                }
            self.last_pinch_pos[hand_key] = dict(cur)
        else:
            self.last_pinch_pos[hand_key] = None

        return {
            "handedness": handedness,
            "gesture": final_gesture,
            "rawGesture": detected_gesture,
            "confidence": round(confidence, 3),
            "cursor": dict(cur),
            "palmCenter": palm_center,
            "palmScale": round(palm_scale, 4),
            "isPinching": is_pinching,
            "pinchDistance": round(pinch_dist, 4),
            "dragDelta": drag_delta,
            "curledCount": int(curled_count),
            "extendedCount": int(extended_count),
            "fingerStates": {
                "thumb": bool(is_thumb_ext),
                "index": bool(is_idx_ext),
                "middle": bool(is_mid_ext),
                "ring": bool(is_rng_ext),
                "pinky": bool(is_pnk_ext)
            }
        }

    def analyze_two_hands(
        self,
        hand1_landmarks: List[Dict[str, float]],
        hand2_landmarks: List[Dict[str, float]],
        hand1_analysis: Dict[str, Any],
        hand2_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Processes two simultaneous hands for:
        - TWO_FISTS_TOGETHER: Both hands forming CLOSED_FIST and distance < 0.65.
        - ZOOM_IN / ZOOM_OUT: Distance expansion/contraction tracking.
        """
        p1 = hand1_analysis.get("palmCenter") or hand1_landmarks[LM_MIDDLE_MCP]
        p2 = hand2_analysis.get("palmCenter") or hand2_landmarks[LM_MIDDLE_MCP]
        current_distance = get_distance(p1, p2)

        def is_fist_posture(analysis):
            g = analysis.get("gesture")
            raw_g = analysis.get("rawGesture")
            if g == GESTURE_CLOSED_FIST or raw_g == GESTURE_CLOSED_FIST:
                return True
            f_states = analysis.get("fingerStates", {})
            non_thumb_ext = sum([1 for f in ["index", "middle", "ring", "pinky"] if f_states.get(f, False)])
            curled = analysis.get("curledCount", 4 - non_thumb_ext)
            extended = analysis.get("extendedCount", non_thumb_ext)
            return non_thumb_ext <= 1 and (curled >= 3 or extended <= 1)

        is_h1_fist = is_fist_posture(hand1_analysis)
        is_h2_fist = is_fist_posture(hand2_analysis)

        # Natural distance threshold for two fists together (< 0.65)
        if is_h1_fist and is_h2_fist and current_distance < 0.65:
            return {
                "gesture": GESTURE_TWO_FISTS_TOGETHER,
                "handsDistance": round(current_distance, 4),
                "deltaDist": 0.0,
                "zoomAction": "NONE"
            }

        delta_dist = 0.0
        if self.prev_two_hand_dist > 0.0:
            delta_dist = current_distance - self.prev_two_hand_dist
        self.prev_two_hand_dist = current_distance

        zoom_action = "NONE"
        multi_gesture = GESTURE_NONE

        # Responsive delta distance threshold (0.005 per frame)
        if delta_dist > 0.005:
            zoom_action = "IN"
            multi_gesture = GESTURE_ZOOM_IN
        elif delta_dist < -0.005:
            zoom_action = "OUT"
            multi_gesture = GESTURE_ZOOM_OUT
        else:
            is_h1_palm = hand1_analysis.get("gesture") == GESTURE_OPEN_PALM
            is_h2_palm = hand2_analysis.get("gesture") == GESTURE_OPEN_PALM
            if is_h1_palm and is_h2_palm:
                multi_gesture = GESTURE_OPEN_PALM

        return {
            "gesture": multi_gesture,
            "handsDistance": round(current_distance, 4),
            "deltaDist": round(delta_dist, 4),
            "zoomAction": zoom_action
        }


# ---------------------------------------------------------------------------
# MediaPipe Hand Detector Wrapper
# ---------------------------------------------------------------------------
class HandDetectorEngine:
    """Wraps MediaPipe HandLandmarker Tasks API with BGR frame processing."""

    def __init__(self, model_path: Path):
        self.model_path = model_path
        self._init_detector()

    def _init_detector(self):
        base_options = python.BaseOptions(model_asset_path=str(self.model_path))
        options = vision.HandLandmarkerOptions(
            base_options=base_options,
            running_mode=vision.RunningMode.IMAGE,
            num_hands=2,
            min_hand_detection_confidence=0.45,
            min_hand_presence_confidence=0.45,
            min_tracking_confidence=0.45
        )
        self.detector = vision.HandLandmarker.create_from_options(options)

    def process_bgr_frame(self, bgr_image: np.ndarray) -> List[List[Dict[str, float]]]:
        """
        Detects hand landmarks with automatic image enhancement for bad cameras,
        low-light shadow lifting, and resolution scaling for low latency.
        """
        if bgr_image is None or bgr_image.size == 0:
            return []

        h, w = bgr_image.shape[:2]

        # 1. Scale down very high-res external cameras (e.g. 1440p / 4K) to 960 width
        # Eliminates frame lag while preserving normalized landmark precision
        if w > 1280 or h > 720:
            scale = 960.0 / w
            target_w = 960
            target_h = int(h * scale)
            proc_bgr = cv2.resize(bgr_image, (target_w, target_h), interpolation=cv2.INTER_AREA)
        else:
            proc_bgr = bgr_image

        # 2. Dynamic adaptive enhancement for bad/grainy/dark webcams
        mean_lum = float(proc_bgr.mean())
        if mean_lum < 55.0:
            # Underexposed / dim room: lift shadows and boost contrast
            proc_bgr = cv2.convertScaleAbs(proc_bgr, alpha=1.35, beta=18)
        elif mean_lum < 75.0:
            # Subtle boost for moderate indoor lighting
            proc_bgr = cv2.convertScaleAbs(proc_bgr, alpha=1.18, beta=8)

        rgb_image = cv2.cvtColor(proc_bgr, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_image)
        detection_result = self.detector.detect(mp_image)

        hands_landmarks: List[List[Dict[str, float]]] = []
        if detection_result and detection_result.hand_landmarks:
            for idx, hand_lms in enumerate(detection_result.hand_landmarks):
                # Soft handedness gate (bad cameras have slightly lower handedness score ~0.45)
                if detection_result.handedness and idx < len(detection_result.handedness):
                    categories = detection_result.handedness[idx]
                    if categories and len(categories) > 0:
                        if categories[0].score < 0.40:
                            continue
                pts = [{"x": lm.x, "y": lm.y, "z": lm.z} for lm in hand_lms]
                hands_landmarks.append(pts)
        return hands_landmarks


# ---------------------------------------------------------------------------
# Camera Hardware Resolver
# ---------------------------------------------------------------------------
def resolve_camera_index_by_name(target_name: Optional[str] = None) -> Optional[int]:
    """
    Dynamically maps a camera name/label from the frontend (or camera_config.json)
    to its actual OpenCV DirectShow hardware index on this machine.
    """
    if not target_name:
        return None
    try:
        from pygrabber.dshow_graph import FilterGraph
        devices = FilterGraph().get_input_devices()
        t_low = target_name.lower()
        # 1. Exact or substring match (e.g. "Logi C270 HD WebCam" vs "Logi C270")
        for idx, dev_name in enumerate(devices):
            d_low = dev_name.lower()
            if t_low in d_low or d_low in t_low:
                logger.info(f"[CAMERA RESOLVER] Matched '{target_name}' -> DirectShow Index {idx} ({dev_name})")
                return idx

        # 2. Key hardware model token match (e.g. "c270", "046d", "logi", "integrated")
        clean_name = t_low.replace("(", " ").replace(")", " ").replace("-", " ").replace(":", " ")
        tokens = [tok for tok in clean_name.split() if len(tok) >= 3 and tok not in ("camera", "webcam", "device", "video")]
        for idx, dev_name in enumerate(devices):
            d_low = dev_name.lower()
            if any(tok in d_low for tok in tokens):
                logger.info(f"[CAMERA RESOLVER] Token-matched '{target_name}' -> DirectShow Index {idx} ({dev_name})")
                return idx
    except Exception as e:
        logger.warning(f"[CAMERA RESOLVER] DirectShow enumeration note: {e}")

    # Fallback heuristics if DirectShow query is unavailable
    t_low = target_name.lower()
    if "logi" in t_low or "c270" in t_low or "external" in t_low:
        return 2
    if "integrated" in t_low or "internal" in t_low or "built-in" in t_low:
        return 1
    if "smart" in t_low or "connect" in t_low:
        return 0
    return None


# ---------------------------------------------------------------------------
# Gesture Server Core
# ---------------------------------------------------------------------------
class GestureServer:
    """
    Asynchronous WebSocket server that accepts incoming client video frames
    OR directly captures from local OpenCV webcam, publishing detection results.
    """

    def __init__(self, host: str = DEFAULT_HOST, port: int = DEFAULT_PORT, camera_index: Optional[int] = None, target_fps: int = 30):
        self.host = host
        self.port = port
        self.camera_index = camera_index  # None triggers auto-detection (probes 1, 0, 2)
        self.target_fps = target_fps
        self.frame_interval = 1.0 / max(10, min(60, target_fps))

        # Core Components
        model_path = ensure_model_asset(Path(__file__).resolve().parent / MODEL_ASSET_FILENAME)
        self.detector = HandDetectorEngine(model_path)
        self.analyzer = HandGestureAnalyzer()

        # WebSocket Client Management
        self.connected_clients = set()
        self.running = False
        self.server = None

        # Camera state & thread synchronization
        self.camera_enabled = True
        self.camera_thread = None
        self.cap = None
        self.cap_lock = threading.Lock()

        # Performance Metrics
        self.last_fps_time = time.time()
        self.frame_counter = 0
        self.current_fps = 0.0

    async def broadcast_payload(self, payload: Dict[str, Any]):
        """Broadcasts JSON payload to all connected clients."""
        if not self.connected_clients:
            return

        message = json.dumps(payload)
        stale_clients = []
        for ws in list(self.connected_clients):
            try:
                await ws.send(message)
            except (websockets.ConnectionClosed, Exception):
                stale_clients.append(ws)

        for ws in stale_clients:
            self.connected_clients.discard(ws)

    def process_frame_landmarks(self, hands_lms: List[List[Dict[str, float]]]) -> Dict[str, Any]:
        """Runs single and multi-hand analysis on landmarks and creates response payload."""
        timestamp = time.time()

        # Strict anatomical pre-filter: discard any face/nose false positive landmark set
        valid_hands = []
        for lms in hands_lms:
            if not lms or len(lms) < 21:
                continue
            xs = [p["x"] for p in lms]
            ys = [p["y"] for p in lms]
            bbox_w = max(xs) - min(xs)
            bbox_h = max(ys) - min(ys)
            w = lms[LM_WRIST]
            m_mcp = lms[LM_MIDDLE_MCP]
            i_mcp = lms[LM_INDEX_MCP]
            p_mcp = lms[LM_PINKY_MCP]
            pl = get_distance(w, m_mcp)
            pb = get_distance(i_mcp, p_mcp)
            if bbox_w >= 0.040 and bbox_h >= 0.044 and pl >= 0.028 and pb >= 0.020:
                valid_hands.append(lms)

        hands_lms = valid_hands
        num_hands = len(hands_lms)

        if num_hands == 0:
            return {
                "type": "gestures",
                "timestamp": timestamp,
                "handsDetected": 0,
                "landmarks": [],
                "primaryHand": None,
                "multiHand": None
            }

        primary_analysis = self.analyzer.analyze_single_hand(hands_lms[0], handedness="Right")
        multi_analysis = None

        if num_hands >= 2:
            secondary_analysis = self.analyzer.analyze_single_hand(hands_lms[1], handedness="Left")
            multi_analysis = self.analyzer.analyze_two_hands(
                hands_lms[0], hands_lms[1], primary_analysis, secondary_analysis
            )

        top_gesture = primary_analysis["gesture"]
        if multi_analysis and multi_analysis.get("gesture") and multi_analysis["gesture"] != GESTURE_NONE:
            top_gesture = multi_analysis["gesture"]
        elif num_hands >= 2 and secondary_analysis and secondary_analysis.get("gesture") == GESTURE_CLOSED_FIST:
            top_gesture = GESTURE_CLOSED_FIST

        return {
            "type": "gestures",
            "timestamp": timestamp,
            "handsDetected": num_hands,
            "gesture": top_gesture,
            "landmarks": hands_lms,
            "primaryHand": primary_analysis,
            "secondaryHand": secondary_analysis if num_hands >= 2 else None,
            "multiHand": multi_analysis
        }

    async def handle_client_message(self, websocket, raw_message: str):
        """Handles incoming WebSocket message from client."""
        try:
            data = json.loads(raw_message)
            msg_type = data.get("type")

            if msg_type == "ping":
                await websocket.send(json.dumps({"type": "pong", "timestamp": time.time()}))

            elif msg_type == "config":
                self.analyzer.update_options(data)
                logger.info(f"Updated analyzer config: {data}")
                await websocket.send(json.dumps({"type": "config_ack", "status": "ok"}))

            elif msg_type == "set_camera":
                self.camera_enabled = bool(data.get("enabled", True))
                logger.info(f"Camera streaming set to: {self.camera_enabled}")
                await websocket.send(json.dumps({"type": "camera_ack", "enabled": self.camera_enabled}))

            elif msg_type in ("select_camera", "set_camera_index"):
                cam_name = data.get("name")
                raw_idx = data.get("index")
                resolved_idx = resolve_camera_index_by_name(cam_name) if cam_name else None
                chosen_idx = resolved_idx if resolved_idx is not None else (int(raw_idx) if raw_idx is not None else 2)
                display_label = cam_name or f"Index {chosen_idx}"
                logger.info(f"[CAMERA WORKER] Client requested camera '{display_label}' -> DirectShow Index {chosen_idx}...")

                with self.cap_lock:
                    already_active = (
                        self.camera_index == chosen_idx
                        and self.cap is not None
                        and self.cap.isOpened()
                    )
                if already_active:
                    logger.info(f"[CAMERA WORKER] Camera index {chosen_idx} ({display_label}) is already locked, active and streaming.")
                    await websocket.send(json.dumps({
                        "type": "camera_selected",
                        "index": self.camera_index,
                        "name": display_label,
                        "success": True,
                        "already_active": True
                    }))
                else:
                    success = self._open_camera(chosen_idx, target_name=cam_name)
                    await websocket.send(json.dumps({
                        "type": "camera_selected",
                        "index": self.camera_index,
                        "name": display_label,
                        "success": success
                    }))

            elif msg_type == "frame":
                # Decode client JPEG / Base64 frame
                img_data_str = data.get("data", "")
                if "," in img_data_str:
                    img_data_str = img_data_str.split(",", 1)[1]

                img_bytes = base64.b64decode(img_data_str)
                np_arr = np.frombuffer(img_bytes, np.uint8)
                frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

                if frame is not None:
                    hands_lms = self.detector.process_bgr_frame(frame)
                    result_payload = self.process_frame_landmarks(hands_lms)
                    await websocket.send(json.dumps(result_payload))
                else:
                    logger.warning("Received invalid or corrupted image frame from client.")

        except Exception as e:
            logger.error(f"Error handling client message: {e}")

    async def websocket_handler(self, websocket):
        """WebSocket connection lifecycle handler."""
        client_addr = websocket.remote_address
        self.connected_clients.add(websocket)
        logger.info(f"[CLIENT CONNECTED] {client_addr} (Active Clients: {len(self.connected_clients)})")

        # Welcome handshake
        try:
            welcome_msg = {
                "type": "connected",
                "server": "RedAtlas Gesture Server",
                "version": "1.0.0",
                "fps": self.target_fps,
                "supportedGestures": [
                    GESTURE_OPEN_PALM, GESTURE_CLOSED_FIST, GESTURE_PINCH,
                    GESTURE_POINT, GESTURE_TWO_FINGERS, GESTURE_THUMBS_UP,
                    GESTURE_SWIPE_LEFT, GESTURE_SWIPE_RIGHT,
                    GESTURE_TWO_FISTS_TOGETHER, GESTURE_ZOOM_IN, GESTURE_ZOOM_OUT
                ]
            }
            await websocket.send(json.dumps(welcome_msg))

            async for message in websocket:
                await self.handle_client_message(websocket, message)

        except websockets.ConnectionClosed:
            pass
        except Exception as e:
            logger.error(f"WebSocket client error: {e}")
        finally:
            self.connected_clients.discard(websocket)
            logger.info(f"[CLIENT DISCONNECTED] {client_addr} (Active Clients: {len(self.connected_clients)})")

    def _open_camera(self, target_index: Optional[int] = None, target_name: Optional[str] = None) -> bool:
        """Attempts to open specified or frontend-synced camera index safely without race conditions."""
        if target_name:
            resolved = resolve_camera_index_by_name(target_name)
            if resolved is not None:
                target_index = resolved

        if target_index is None:
            # Check if camera_config.json has a saved selection from frontend
            cfg_file = Path(__file__).resolve().parent / "camera_config.json"
            if cfg_file.exists():
                try:
                    with open(cfg_file, "r", encoding="utf-8") as f:
                        saved = json.load(f)
                        saved_name = saved.get("name")
                        if saved_name:
                            resolved = resolve_camera_index_by_name(saved_name)
                            if resolved is not None:
                                target_index = resolved
                        if target_index is None and "index" in saved:
                            target_index = int(saved["index"])
                except Exception:
                    pass

        if target_index is not None and target_index >= 0:
            indices_to_try = [target_index]
        else:
            indices_to_try = [2, 1, 0]

        for idx in indices_to_try:
            logger.info(f"[CAMERA WORKER] Opening camera device index {idx}...")
            new_cap = None
            backends = [cv2.CAP_DSHOW, cv2.CAP_MSMF] if sys.platform == "win32" else [cv2.CAP_ANY]
            for backend in backends:
                try:
                    temp = cv2.VideoCapture(idx, backend)
                    if temp and temp.isOpened():
                        ret, test_frame = temp.read()
                        if ret and test_frame is not None:
                            new_cap = temp
                            break
                        temp.release()
                except Exception:
                    pass

            if new_cap and new_cap.isOpened():
                ret, frame = new_cap.read()
                if ret and frame is not None:
                    h, w = frame.shape[:2]
                    mean_lum = float(frame.mean())
                    is_ext = (idx == 2) or ("c270" in (target_name or "").lower()) or ("logi" in (target_name or "").lower())
                    cam_type = "External Camera" if is_ext else "Integrated Camera"
                    logger.info(f"[CAMERA WORKER] Camera index {idx} ({cam_type}) locked & online! Res: {w}x{h}, Lum: {mean_lum:.1f}")

                    # Atomically swap active camera under cap_lock
                    with self.cap_lock:
                        old_cap = self.cap
                        self.cap = new_cap
                        self.camera_index = idx
                        try:
                            self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
                        except Exception:
                            pass

                    # Release former camera handle outside lock
                    if old_cap is not None:
                        try:
                            old_cap.release()
                        except Exception:
                            pass
                    return True
                else:
                    try:
                        new_cap.release()
                    except Exception:
                        pass

        logger.warning(f"[CAMERA WORKER] Direct capture for index {target_index} not available directly.")
        return False

    def _camera_worker(self, loop: asyncio.AbstractEventLoop):
        """Dedicated background thread for direct OpenCV camera capture and broadcast."""
        logger.info("[CAMERA WORKER] Initializing camera worker...")
        success = self._open_camera(self.camera_index)
        if not success:
            logger.warning("[CAMERA WORKER] Direct camera capture not ready at startup. Waiting for camera selection or client frames.")
        else:
            logger.info(f"[CAMERA WORKER] Camera {self.camera_index} online! Broadcasting at {self.target_fps} FPS.")

        last_log_time = time.time()
        frames_since_log = 0

        while self.running:
            try:
                start_time = time.time()

                if not self.camera_enabled or not self.connected_clients:
                    # If no clients connected or camera disabled, yield CPU
                    time.sleep(0.05)
                    continue

                frame = None
                with self.cap_lock:
                    cap = self.cap
                    if cap is not None and cap.isOpened():
                        ret, frame = cap.read()
                        if not ret:
                            frame = None

                if frame is None:
                    time.sleep(0.04)
                    continue

                # Downscale high-resolution frames (e.g., 2560x1440 or 1920x1080) for real-time responsiveness (<30ms)
                h, w = frame.shape[:2]
                if w > 1280:
                    scale = 960.0 / w
                    frame = cv2.resize(frame, (960, int(h * scale)), interpolation=cv2.INTER_LINEAR)

                # Low-light contrast auto-boost if frame is dark (<60 mean brightness)
                mean_lum = float(frame.mean())
                if mean_lum < 60.0:
                    alpha = min(2.0, 60.0 / max(10.0, mean_lum))
                    frame = cv2.convertScaleAbs(frame, alpha=alpha, beta=10)

                # Process frame with MediaPipe
                hands_lms = self.detector.process_bgr_frame(frame)
                payload = self.process_frame_landmarks(hands_lms)

                # Broadcast to clients via event loop
                asyncio.run_coroutine_threadsafe(self.broadcast_payload(payload), loop)

                # Metrics
                frames_since_log += 1
                now = time.time()
                if now - last_log_time >= 2.0:
                    fps = frames_since_log / max(0.001, now - last_log_time)
                    gesture_status = "No Hand"
                    num_h = payload.get("handsDetected", 0)
                    if num_h > 0:
                        top_g = payload.get("gesture", GESTURE_NONE)
                        if num_h >= 2:
                            h1_g = payload["primaryHand"]["gesture"]
                            gesture_status = f"{top_g} [2 Hands detected, H1={h1_g}]"
                        else:
                            gesture_status = top_g
                    logger.info(f"[STATUS] Camera: {fps:.1f} FPS | Active Clients: {len(self.connected_clients)} | Detected: {gesture_status}")
                    frames_since_log = 0
                    last_log_time = now

                # Sleep to match target FPS
                elapsed = time.time() - start_time
                sleep_time = max(0.0, self.frame_interval - elapsed)
                if sleep_time > 0:
                    time.sleep(sleep_time)

            except Exception as e:
                logger.warning(f"[CAMERA WORKER] Loop cycle warning: {e}")
                time.sleep(0.05)

        with self.cap_lock:
            if self.cap and self.cap.isOpened():
                try:
                    self.cap.release()
                except Exception:
                    pass
                self.cap = None
                logger.info("[CAMERA WORKER] Camera released.")

    async def start(self):
        """Starts WebSocket server and background camera thread."""
        self.running = True
        loop = asyncio.get_running_loop()

        # Start Camera thread
        self.camera_thread = threading.Thread(
            target=self._camera_worker,
            args=(loop,),
            name="OpenCVCameraWorker",
            daemon=True
        )
        self.camera_thread.start()

        # Start WebSocket server
        logger.info("=" * 65)
        logger.info("  REDATLAS HUD — AEROSPACE GESTURE RECOGNITION SERVER")
        logger.info("=" * 65)
        logger.info(f"  Listening on: ws://{self.host}:{self.port} (or ws://localhost:{self.port})")
        logger.info(f"  Target FPS:   {self.target_fps}")
        logger.info(f"  Camera Index: {self.camera_index}")
        logger.info("=" * 65)

        try:
            self.server = await websockets.serve(
                self.websocket_handler,
                self.host,
                self.port,
                ping_interval=20,
                ping_timeout=20,
                max_size=10 * 1024 * 1024  # 10 MB for base64 frames
            )
            logger.info(f"[SERVER READY] WebSocket engine active on port {self.port}!")
            await asyncio.Future()  # Keep running indefinitely
        except OSError as e:
            logger.error(f"[PORT BINDING ERROR] Port {self.port} could not be bound ({e}).")
            logger.error("Please verify that another process is not using port 8765, or pass --port <number>.")
            raise
        except asyncio.CancelledError:
            pass
        finally:
            self.stop()

    def stop(self):
        """Clean shutdown."""
        self.running = False
        if self.server:
            self.server.close()
        with self.cap_lock:
            if self.cap and self.cap.isOpened():
                try:
                    self.cap.release()
                except Exception:
                    pass
                self.cap = None
        logger.info("[SERVER SHUTDOWN] Gesture recognition server stopped.")


# ---------------------------------------------------------------------------
# Camera Discovery & Interactive Selection Utilities
# ---------------------------------------------------------------------------
def probe_available_cameras(max_probe: int = 4) -> List[Dict[str, Any]]:
    """Probes connected camera devices and detects native resolution, luminance, and type using DirectShow names."""
    devices = []
    dshow_names = []
    try:
        from pygrabber.dshow_graph import FilterGraph
        dshow_names = FilterGraph().get_input_devices()
    except Exception:
        pass

    probe_count = len(dshow_names) if dshow_names else max_probe
    for idx in range(min(max_probe, probe_count)):
        dev_name = dshow_names[idx] if idx < len(dshow_names) else f"Camera Index {idx}"
        cap = None
        try:
            cap = cv2.VideoCapture(idx, cv2.CAP_DSHOW if sys.platform == "win32" else cv2.CAP_ANY)
        except Exception:
            cap = None

        if cap and cap.isOpened():
            ret, frame = cap.read()
            if ret and frame is not None:
                h, w = frame.shape[:2]
                lum = float(frame.mean())
                is_ext = ("c270" in dev_name.lower() or "usb" in dev_name.lower() or "logi" in dev_name.lower() or idx == 2)
                devices.append({
                    "index": idx,
                    "name": dev_name,
                    "resolution": f"{w}x{h}",
                    "brightness": round(lum, 1),
                    "is_external": is_ext
                })
            cap.release()

    return devices


def prompt_camera_selection(devices: List[Dict[str, Any]], timeout_sec: int = 5) -> int:
    """Displays available cameras and prompts user with an interactive countdown."""
    print("\n" + "=" * 67)
    print("  REDATLAS HUD — VIDEO INPUT DEVICE SELECTION")
    print("=" * 67)

    recommended_idx = None
    for d in devices:
        if d["is_external"] and recommended_idx is None:
            recommended_idx = d["index"]

    if recommended_idx is None and devices:
        recommended_idx = devices[0]["index"]

    for d in devices:
        rec_tag = " <-- RECOMMENDED (External Camera)" if d["index"] == recommended_idx else ""
        print(f"  [{d['index']}] {d['name']} — {d['resolution']} (Brightness: {d['brightness']:.1f}){rec_tag}")
    print("=" * 67)

    prompt = f"  Select Camera Index [0-{len(devices)-1}] (Enter for [{recommended_idx}], auto-selects in {timeout_sec}s): "
    print(prompt, end="", flush=True)

    if sys.platform == "win32" and sys.stdin.isatty():
        import msvcrt
        start_t = time.time()
        buf = []
        while time.time() - start_t < timeout_sec:
            if msvcrt.kbhit():
                ch = msvcrt.getwche()
                if ch in ("\r", "\n"):
                    break
                buf.append(ch)
            time.sleep(0.05)
        print()
        entered = "".join(buf).strip()
        if entered.isdigit():
            chosen = int(entered)
            if any(d["index"] == chosen for d in devices):
                print(f"  -> Selected Camera {chosen}.")
                return chosen
        print(f"  -> Using Recommended Camera {recommended_idx} (External Camera).")
        return recommended_idx
    else:
        print()
        print(f"  -> Auto-selected Camera {recommended_idx} (External Camera).")
        return recommended_idx


# ---------------------------------------------------------------------------
# CLI Argument Parser & Entry Point
# ---------------------------------------------------------------------------
def main():
    os.environ["OPENCV_LOG_LEVEL"] = "ERROR"
    parser = argparse.ArgumentParser(description="RedAtlas HUD Aerospace Hand Gesture Recognition Server")
    parser.add_argument("--host", default=DEFAULT_HOST, help=f"WebSocket host binding (default: {DEFAULT_HOST})")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help=f"WebSocket port (default: {DEFAULT_PORT})")
    parser.add_argument("--camera", type=int, default=None, help="Camera device index (e.g. 2 for external Logi C270, 1 for integrated)")
    parser.add_argument("--fps", type=int, default=30, help="Target broadcast frame rate (default: 30)")
    parser.add_argument("--no-camera", action="store_true", help="Disable server-side camera stream")
    parser.add_argument("--invert-x", action="store_true", help="Invert X axis for mirror view")

    args = parser.parse_args()

    chosen_camera_idx = args.camera
    if chosen_camera_idx is None and not args.no_camera:
        # 1. First priority: Check if frontend selected a camera via camera_config.json
        cfg_file = Path(__file__).resolve().parent / "camera_config.json"
        if cfg_file.exists():
            try:
                with open(cfg_file, "r", encoding="utf-8") as f:
                    cfg_data = json.load(f)
                    saved_name = cfg_data.get("name", "")
                    if saved_name:
                        resolved = resolve_camera_index_by_name(saved_name)
                        if resolved is not None:
                            chosen_camera_idx = resolved
                    if chosen_camera_idx is None and "index" in cfg_data:
                        chosen_camera_idx = int(cfg_data["index"])

                    if chosen_camera_idx is not None:
                        display_name = saved_name or f"Camera Index {chosen_camera_idx}"
                        print("\n" + "=" * 67)
                        print("  REDATLAS HUD — SYNCED WITH FRONTEND CAMERA SELECTION")
                        print("=" * 67)
                        print(f"  Frontend Active Camera: {display_name} [Index {chosen_camera_idx}]")
                        print(f"  Automatically locking onto Camera Index {chosen_camera_idx}...")
                        print("=" * 67 + "\n")
            except Exception as e:
                logger.warning(f"Error reading camera_config.json: {e}")

        # 2. If no config was saved, probe devices
        if chosen_camera_idx is None:
            devices = probe_available_cameras(max_probe=4)
            if devices:
                ext_dev = next((d for d in devices if d.get("is_external")), None)
                if ext_dev:
                    chosen_camera_idx = ext_dev["index"]
                else:
                    chosen_camera_idx = devices[0]["index"]
                print(f"  Camera auto-selected: Index {chosen_camera_idx} ({devices[0]['name']}).")
            else:
                chosen_camera_idx = 2  # Default to external index 2

    server = GestureServer(
        host=args.host,
        port=args.port,
        camera_index=chosen_camera_idx,
        target_fps=args.fps
    )
    if args.no_camera:
        server.camera_enabled = False
    if args.invert_x:
        server.analyzer.invert_x = True

    try:
        asyncio.run(server.start())
    except KeyboardInterrupt:
        logger.info("\nReceived keyboard interrupt (Ctrl+C). Terminating...")
    except Exception as e:
        logger.critical(f"Fatal error during execution: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
