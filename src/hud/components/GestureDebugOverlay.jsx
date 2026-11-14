import React, { useRef, useEffect } from 'react';

/**
 * GestureDebugOverlay — Optional Aerospace Developer Tracking Visualization
 * Renders 21 landmarks and skeletal bone connections in glowing phosphor.
 */
export default function GestureDebugOverlay({
  landmarksData,
  enabled = false,
  invertX = false,
  width = window.innerWidth,
  height = window.innerHeight
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, width, height);

    if (!landmarksData || landmarksData.length === 0) return;

    // Bone connection topology (21 MediaPipe hand landmarks)
    const BONES = [
      // Thumb
      [0, 1], [1, 2], [2, 3], [3, 4],
      // Index
      [0, 5], [5, 6], [6, 7], [7, 8],
      // Middle
      [0, 9], [9, 10], [10, 11], [11, 12],
      // Ring
      [0, 13], [13, 14], [14, 15], [15, 16],
      // Pinky
      [0, 17], [17, 18], [18, 19], [19, 20],
      // Palm Knuckle Arch
      [5, 9], [9, 13], [13, 17]
    ];

    const getX = (val) => (invertX ? 1 - val : val) * width;

    landmarksData.forEach((hand) => {
      // 1. Draw Bones
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.65)';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 6;

      BONES.forEach(([i, j]) => {
        const p1 = hand[i];
        const p2 = hand[j];
        if (p1 && p2) {
          ctx.beginPath();
          ctx.moveTo(getX(p1.x), p1.y * height);
          ctx.lineTo(getX(p2.x), p2.y * height);
          ctx.stroke();
        }
      });
      ctx.shadowBlur = 0;

      // 2. Draw Landmark Joints
      hand.forEach((lm, idx) => {
        const x = getX(lm.x);
        const y = lm.y * height;

        // Fingertip points are larger and cyan
        const isTip = [4, 8, 12, 16, 20].includes(idx);
        ctx.fillStyle = isTip ? '#00f0ff' : '#ffffff';
        ctx.shadowColor = isTip ? '#00f0ff' : '#f59e0b';
        ctx.shadowBlur = isTip ? 8 : 4;

        ctx.beginPath();
        ctx.arc(x, y, isTip ? 5 : 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });
    });
  }, [landmarksData, enabled, invertX, width, height]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="hud-gesture-debug-canvas"
    />
  );
}
