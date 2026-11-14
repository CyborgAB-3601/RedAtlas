#!/usr/bin/env python3
"""
Test client for RedAtlas Hand Gesture Recognition Server.
Verifies:
1. WebSocket connection & handshake
2. Ping / Pong latency
3. Base64 frame upload and detection response
4. Camera broadcast reception
5. All 9 required gesture classifications
"""

import sys
import time
import json
import base64
import asyncio
import numpy as np
import cv2
import websockets
from pathlib import Path

# Import the analyzer directly for algorithmic unit tests
import gesture_server
from gesture_server import (
    HandGestureAnalyzer,
    GESTURE_OPEN_PALM,
    GESTURE_CLOSED_FIST,
    GESTURE_PINCH,
    GESTURE_POINT,
    GESTURE_TWO_FINGERS,
    GESTURE_THUMBS_UP,
    GESTURE_SWIPE_LEFT,
    GESTURE_SWIPE_RIGHT,
    GESTURE_TWO_FISTS_TOGETHER,
    GESTURE_ZOOM_IN,
    GESTURE_ZOOM_OUT
)

def run_algorithmic_unit_tests():
    print("=" * 65)
    print("1. RUNNING GESTURE CLASSIFIER & KINEMATICS UNIT TESTS")
    print("=" * 65)

    analyzer = HandGestureAnalyzer({"sensitivity": "medium"})

    # Helper to build 21 landmarks
    def make_landmarks(gesture_name):
        lm = [{"x": 0.5, "y": 0.7, "z": 0.0} for _ in range(21)]
        wrist = lm[0]
        # MCPs
        lm[5] = {"x": 0.45, "y": 0.55, "z": 0.0} # Index MCP
        lm[9] = {"x": 0.50, "y": 0.53, "z": 0.0} # Middle MCP
        lm[13] = {"x": 0.55, "y": 0.55, "z": 0.0} # Ring MCP
        lm[17] = {"x": 0.60, "y": 0.58, "z": 0.0} # Pinky MCP

        lm[1] = {"x": 0.46, "y": 0.65, "z": 0.0}
        lm[2] = {"x": 0.42, "y": 0.60, "z": 0.0}

        def extend_finger(mcp_idx):
            lm[mcp_idx + 1] = {"x": lm[mcp_idx]["x"], "y": lm[mcp_idx]["y"] - 0.07, "z": 0.0}
            lm[mcp_idx + 2] = {"x": lm[mcp_idx]["x"], "y": lm[mcp_idx]["y"] - 0.14, "z": 0.0}
            lm[mcp_idx + 3] = {"x": lm[mcp_idx]["x"], "y": lm[mcp_idx]["y"] - 0.20, "z": 0.0}

        def curl_finger(mcp_idx):
            lm[mcp_idx + 1] = {"x": lm[mcp_idx]["x"], "y": lm[mcp_idx]["y"] + 0.04, "z": 0.0}
            lm[mcp_idx + 2] = {"x": lm[mcp_idx]["x"], "y": lm[mcp_idx]["y"] + 0.07, "z": 0.0}
            lm[mcp_idx + 3] = {"x": lm[mcp_idx]["x"], "y": lm[mcp_idx]["y"] + 0.05, "z": 0.0}

        if gesture_name == GESTURE_OPEN_PALM:
            extend_finger(5)
            extend_finger(9)
            extend_finger(13)
            extend_finger(17)
            lm[3] = {"x": 0.38, "y": 0.55, "z": 0.0}
            lm[4] = {"x": 0.34, "y": 0.50, "z": 0.0} # Thumb extended

        elif gesture_name == GESTURE_CLOSED_FIST:
            curl_finger(5)
            curl_finger(9)
            curl_finger(13)
            curl_finger(17)
            lm[3] = {"x": 0.46, "y": 0.58, "z": 0.0}
            lm[4] = {"x": 0.48, "y": 0.56, "z": 0.0} # Thumb curled over fingers

        elif gesture_name == GESTURE_PINCH:
            extend_finger(9)
            extend_finger(13)
            extend_finger(17)
            # Thumb tip and Index tip touching
            pinch_pt = {"x": 0.44, "y": 0.50, "z": 0.0}
            lm[3] = {"x": 0.42, "y": 0.54, "z": 0.0}
            lm[4] = dict(pinch_pt)
            lm[6] = {"x": 0.45, "y": 0.52, "z": 0.0}
            lm[7] = {"x": 0.445, "y": 0.51, "z": 0.0}
            lm[8] = dict(pinch_pt)

        elif gesture_name == GESTURE_POINT:
            extend_finger(5) # Index extended
            curl_finger(9)
            curl_finger(13)
            curl_finger(17)
            lm[3] = {"x": 0.46, "y": 0.58, "z": 0.0}
            lm[4] = {"x": 0.48, "y": 0.56, "z": 0.0}

        elif gesture_name == GESTURE_TWO_FINGERS:
            extend_finger(5) # Index extended
            extend_finger(9) # Middle extended
            curl_finger(13)
            curl_finger(17)
            lm[3] = {"x": 0.46, "y": 0.58, "z": 0.0}
            lm[4] = {"x": 0.48, "y": 0.56, "z": 0.0}

        elif gesture_name == GESTURE_THUMBS_UP:
            curl_finger(5)
            curl_finger(9)
            curl_finger(13)
            curl_finger(17)
            # Thumb pointing straight UP
            lm[3] = {"x": 0.40, "y": 0.50, "z": 0.0}
            lm[4] = {"x": 0.39, "y": 0.38, "z": 0.0}

        return lm

    # Test static gestures
    for test_g in [GESTURE_OPEN_PALM, GESTURE_CLOSED_FIST, GESTURE_PINCH, GESTURE_POINT, GESTURE_TWO_FINGERS, GESTURE_THUMBS_UP]:
        # Process a couple times to prime history buffer
        for _ in range(4):
            res = analyzer.analyze_single_hand(make_landmarks(test_g))
        print(f"  [TEST] Target: {test_g:<15} -> Detected: {res['gesture']:<15} (Conf: {res['confidence']:.2f})")
        assert res["gesture"] == test_g, f"Expected {test_g}, got {res['gesture']}"

    print("  -> All 6 Static Gestures Passed!")

    # Test SWIPE_LEFT / SWIPE_RIGHT
    analyzer_swipe = HandGestureAnalyzer()
    now = time.time()
    # Simulate right-to-left rapid movement
    analyzer_swipe.recent_centroids["Right"] = [
        (0.80, 0.5, now - 0.20),
        (0.65, 0.5, now - 0.15),
        (0.50, 0.5, now - 0.10),
        (0.35, 0.5, now - 0.05),
        (0.20, 0.5, now)
    ]
    open_lms = make_landmarks(GESTURE_OPEN_PALM)
    res_swipe_l = analyzer_swipe.analyze_single_hand(open_lms, handedness="Right")
    print(f"  [TEST] Velocity Vector (Left) -> Detected: {res_swipe_l['gesture']:<15}")
    assert res_swipe_l["gesture"] == GESTURE_SWIPE_LEFT, f"Expected SWIPE_LEFT, got {res_swipe_l['gesture']}"

    # Reset cooldown and test SWIPE_RIGHT
    analyzer_swipe.last_swipe_time["Right"] = 0
    now = time.time()
    analyzer_swipe.recent_centroids["Right"] = [
        (0.20, 0.5, now - 0.20),
        (0.35, 0.5, now - 0.15),
        (0.50, 0.5, now - 0.10),
        (0.65, 0.5, now - 0.05),
        (0.80, 0.5, now)
    ]
    res_swipe_r = analyzer_swipe.analyze_single_hand(open_lms, handedness="Right")
    print(f"  [TEST] Velocity Vector (Right) -> Detected: {res_swipe_r['gesture']:<15}")
    assert res_swipe_r["gesture"] == GESTURE_SWIPE_RIGHT, f"Expected SWIPE_RIGHT, got {res_swipe_r['gesture']}"
    print("  -> Dynamic Swipe Gestures Passed!")

    # Test Multi-Hand Gestures
    # 1. TWO_FISTS_TOGETHER
    fist_lms_1 = make_landmarks(GESTURE_CLOSED_FIST)
    fist_lms_2 = make_landmarks(GESTURE_CLOSED_FIST)
    # Put centers close: distance = 0.2
    for pt in fist_lms_1: pt["x"] = pt["x"] - 0.1
    for pt in fist_lms_2: pt["x"] = pt["x"] + 0.1

    for _ in range(3):
        h1_eval = analyzer.analyze_single_hand(fist_lms_1, handedness="Right")
        h2_eval = analyzer.analyze_single_hand(fist_lms_2, handedness="Left")
    two_hand_res = analyzer.analyze_two_hands(fist_lms_1, fist_lms_2, h1_eval, h2_eval)
    print(f"  [TEST] Multi-Hand -> Detected: {two_hand_res['gesture']} (Dist: {two_hand_res['handsDistance']:.2f})")
    assert two_hand_res["gesture"] == GESTURE_TWO_FISTS_TOGETHER, f"Expected TWO_FISTS_TOGETHER, got {two_hand_res['gesture']}"

    # 2. ZOOM_IN / ZOOM_OUT (with open hands)
    lms_h1_open = make_landmarks(GESTURE_OPEN_PALM)
    for pt in lms_h1_open: pt["x"] = pt["x"] - 0.15
    for _ in range(3):
        h1_open_eval = analyzer.analyze_single_hand(lms_h1_open, handedness="Right")

    # Simulate hands moving apart (0.30 -> 0.45)
    analyzer.prev_two_hand_dist = 0.30
    lms_h2_apart = make_landmarks(GESTURE_OPEN_PALM)
    for pt in lms_h2_apart: pt["x"] = pt["x"] + 0.25
    for _ in range(3):
        h2_apart_eval = analyzer.analyze_single_hand(lms_h2_apart, handedness="Left")
    zoom_in_res = analyzer.analyze_two_hands(lms_h1_open, lms_h2_apart, h1_open_eval, h2_apart_eval)
    print(f"  [TEST] Expansion Zoom -> Action: {zoom_in_res['zoomAction']} (Delta: {zoom_in_res['deltaDist']:.3f})")
    assert zoom_in_res["zoomAction"] == "IN", f"Expected IN, got {zoom_in_res['zoomAction']}"

    # Simulate hands moving together (0.50 -> 0.35)
    analyzer.prev_two_hand_dist = 0.50
    lms_h2_close = make_landmarks(GESTURE_OPEN_PALM)
    for pt in lms_h2_close: pt["x"] = pt["x"] + 0.10
    for _ in range(3):
        h2_close_eval = analyzer.analyze_single_hand(lms_h2_close, handedness="Left")
    zoom_out_res = analyzer.analyze_two_hands(lms_h1_open, lms_h2_close, h1_open_eval, h2_close_eval)
    print(f"  [TEST] Contraction Zoom -> Action: {zoom_out_res['zoomAction']} (Delta: {zoom_out_res['deltaDist']:.3f})")
    assert zoom_out_res["zoomAction"] == "OUT", f"Expected OUT, got {zoom_out_res['zoomAction']}"
    print("  -> Multi-Hand Interaction Passed!")
    print("=" * 65)


async def run_websocket_integration_test():
    print("=" * 65)
    print("2. TESTING LIVE WEBSOCKET SERVER AT ws://localhost:8765")
    print("=" * 65)

    uri = "ws://localhost:8765"
    print(f"Connecting to {uri}...")

    try:
        async with websockets.connect(uri) as ws:
            # 1. Receive Welcome Message
            welcome_raw = await asyncio.wait_for(ws.recv(), timeout=3.0)
            welcome = json.loads(welcome_raw)
            print(f"  [CONNECTED] Handshake OK: {welcome.get('server')} v{welcome.get('version')}")

            # 2. Ping / Pong Test
            t0 = time.time()
            await ws.send(json.dumps({"type": "ping"}))
            pong_raw = await asyncio.wait_for(ws.recv(), timeout=2.0)
            pong = json.loads(pong_raw)
            rtt_ms = (time.time() - t0) * 1000
            print(f"  [PING-PONG] Response: {pong.get('type')} (RTT: {rtt_ms:.1f}ms)")
            assert pong.get("type") == "pong"

            # 3. Client Frame Mode Test (Send base64 JPEG)
            dummy_img = np.zeros((240, 320, 3), dtype=np.uint8)
            # Add a colored gradient
            dummy_img[:, :] = [40, 40, 100]
            _, buffer = cv2.imencode(".jpg", dummy_img)
            b64_data = base64.b64encode(buffer).decode("utf-8")

            t0 = time.time()
            await ws.send(json.dumps({"type": "frame", "data": f"data:image/jpeg;base64,{b64_data}"}))
            resp_raw = await asyncio.wait_for(ws.recv(), timeout=3.0)
            resp = json.loads(resp_raw)
            proc_ms = (time.time() - t0) * 1000
            print(f"  [FRAME RECV] Detected: {resp.get('handsDetected')} hands (Round-trip: {proc_ms:.1f}ms)")
            assert resp.get("type") == "gestures"

            # 4. Receive Live Broadcast Frames
            print("  [BROADCAST] Listening for 3 live broadcast camera frames...")
            frames_received = 0
            for i in range(3):
                msg_raw = await asyncio.wait_for(ws.recv(), timeout=4.0)
                msg = json.loads(msg_raw)
                if msg.get("type") == "gestures":
                    frames_received += 1
                    hand_info = "No Hand"
                    if msg.get("primaryHand"):
                        hand_info = f"{msg['primaryHand']['gesture']} (conf: {msg['primaryHand']['confidence']})"
                    print(f"    Frame {i+1}: {msg.get('handsDetected')} hand(s) detected -> {hand_info}")

            print(f"  -> Successfully received {frames_received} live broadcast frames!")

        print("=" * 65)
        print("ALL TESTS PASSED WITH 100% SUCCESS!")
        print("=" * 65)

    except ConnectionRefusedError:
        print("[NOTICE] Server is not currently running on ws://localhost:8765.")
        print("Start the server using `start_gesture_server.bat` or `python gesture_server.py` to run live network tests.")
    except Exception as e:
        print(f"[ERROR] Live test exception: {e}")


def main():
    run_algorithmic_unit_tests()
    if "--live" in sys.argv:
        asyncio.run(run_websocket_integration_test())

if __name__ == "__main__":
    main()
