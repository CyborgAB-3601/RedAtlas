import React from 'react';

/**
 * VisorHelmetFrame — Matches the exact Reference Artifact:
 * - Curved astronaut helmet visor opening.
 * - Translucent greyish helmet structure and bezel framing.
 * - Subtle greyish translucent radial vignette.
 * - Specular silver-grey rim highlight tracing the visor curvature.
 * - Glowing amber HUD canopy linework.
 */
export default function VisorHelmetFrame() {
  return (
    <div className="hud-visor-helmet-overlay" pointerEvents="none">
      <svg
        className="helmet-bezel-svg"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* 1. Translucent Greyish Visor Depth Radial Vignette */}
          <radialGradient id="greyishVisorDepthGrad" cx="50%" cy="50%" r="70%" fx="50%" fy="50%">
            <stop offset="0%" stopColor="rgba(0, 0, 0, 0)" />
            <stop offset="55%" stopColor="rgba(0, 0, 0, 0)" />
            <stop offset="72%" stopColor="rgba(100, 116, 139, 0.06)" />
            <stop offset="85%" stopColor="rgba(71, 85, 105, 0.18)" />
            <stop offset="94%" stopColor="rgba(51, 65, 85, 0.38)" />
            <stop offset="100%" stopColor="rgba(30, 41, 59, 0.62)" />
          </radialGradient>

          {/* 2. Translucent Greyish Helmet Bezel Shell Structure */}
          <linearGradient id="greyishHelmetShellGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(75, 85, 100, 0.82)" />
            <stop offset="12%" stopColor="rgba(60, 70, 85, 0.72)" />
            <stop offset="50%" stopColor="rgba(45, 55, 68, 0.62)" />
            <stop offset="88%" stopColor="rgba(60, 70, 85, 0.72)" />
            <stop offset="100%" stopColor="rgba(75, 85, 100, 0.85)" />
          </linearGradient>

          {/* 3. Top Helmet Brow Greyish Gradient */}
          <linearGradient id="topBrowGreyGrad" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="rgba(75, 85, 100, 0.65)" />
            <stop offset="50%" stopColor="rgba(50, 60, 75, 0.22)" />
            <stop offset="100%" stopColor="rgba(50, 60, 75, 0)" />
          </linearGradient>

          {/* 4. Bottom Chin Bar Greyish Gradient */}
          <linearGradient id="bottomChinGreyGrad" x1="50%" y1="100%" x2="50%" y2="0%">
            <stop offset="0%" stopColor="rgba(75, 85, 100, 0.7)" />
            <stop offset="50%" stopColor="rgba(50, 60, 75, 0.22)" />
            <stop offset="100%" stopColor="rgba(50, 60, 75, 0)" />
          </linearGradient>

          {/* 5. Specular Silver-Grey Visor Rim Highlight */}
          <linearGradient id="greyishRimSpecularGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(148, 163, 184, 0.4)" />
            <stop offset="25%" stopColor="rgba(203, 213, 225, 0.75)" />
            <stop offset="50%" stopColor="rgba(241, 245, 249, 0.9)" />
            <stop offset="75%" stopColor="rgba(203, 213, 225, 0.75)" />
            <stop offset="100%" stopColor="rgba(148, 163, 184, 0.4)" />
          </linearGradient>

          {/* Top amber canopy glow filter */}
          <filter id="amberCanopyGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Subtle Visor Glow filter */}
          <filter id="greyishVisorGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ================= LAYER 1: TRANSLUCENT GREYISH DEPTH VIGNETTE ================= */}
        <rect
          x="0"
          y="0"
          width="1920"
          height="1080"
          fill="url(#greyishVisorDepthGrad)"
        />

        {/* ================= LAYER 2: CURVED GREYISH HELMET BEZEL ================= */}
        {/* Curving helmet bezel structure matching the reference image */}
        <path
          d="M 0 0 L 1920 0 L 1920 1080 L 0 1080 Z 
             M 115 132 
             C 450 36, 1470 36, 1805 132 
             C 1882 360, 1882 720, 1805 948 
             C 1470 1044, 450 1044, 115 948 
             C 38 720, 38 360, 115 132 Z"
          fill="url(#greyishHelmetShellGrad)"
          fillRule="evenodd"
        />

        {/* Top Brow Greyish Translucent Gradient */}
        <path
          d="M 115 132 
             C 450 36, 1470 36, 1805 132 
             L 1765 168 
             C 1450 80, 470 80, 155 168 Z"
          fill="url(#topBrowGreyGrad)"
          opacity="0.85"
        />

        {/* Bottom Chin Bar Greyish Translucent Gradient */}
        <path
          d="M 115 948 
             C 450 1044, 1470 1044, 1805 948 
             L 1765 912 
             C 1450 1000, 470 1000, 155 912 Z"
          fill="url(#bottomChinGreyGrad)"
          opacity="0.85"
        />

        {/* ================= LAYER 3: SPECULAR VISOR RIM HIGHLIGHT ================= */}
        <path
          d="M 115 132 
             C 450 36, 1470 36, 1805 132 
             C 1882 360, 1882 720, 1805 948 
             C 1470 1044, 450 1044, 115 948 
             C 38 720, 38 360, 115 132 Z"
          fill="none"
          stroke="url(#greyishRimSpecularGrad)"
          strokeWidth="3.2"
          filter="url(#greyishVisorGlow)"
        />

        {/* Secondary Inner Visor Glass Chamfer */}
        <path
          d="M 126 142 
             C 455 50, 1465 50, 1794 142 
             C 1868 365, 1868 715, 1794 938 
             C 1465 1030, 455 1030, 126 938 
             C 52 715, 52 365, 126 142 Z"
          fill="none"
          stroke="rgba(255, 255, 255, 0.35)"
          strokeWidth="1.2"
        />

        {/* ================= LAYER 4: TOP GLOWING AMBER VISOR CANOPY ================= */}
        {/* Main upper arch tracing the curved canopy */}
        <path
          d="M 230 115 
             C 480 50, 720 38, 770 38
             L 790 62 
             L 1130 62 
             L 1150 38
             C 1200 38, 1440 50, 1690 115"
          fill="none"
          stroke="#f59e0b"
          strokeWidth="2.4"
          filter="url(#amberCanopyGlow)"
          opacity="0.88"
        />

        {/* Upper canopy parallel accent line */}
        <path
          d="M 770 38 L 1150 38"
          fill="none"
          stroke="#fbbf24"
          strokeWidth="3.2"
          filter="url(#amberCanopyGlow)"
          opacity="0.95"
        />

        {/* Central EVA Timer Trapezoid Lower Bracket */}
        <path
          d="M 760 112 
             L 780 112 
             L 800 126 
             L 1120 126 
             L 1140 112 
             L 1160 112"
          fill="none"
          stroke="#f59e0b"
          strokeWidth="2"
          filter="url(#amberCanopyGlow)"
          opacity="0.75"
        />

        {/* Left Side Canopy Notches */}
        <path
          d="M 380 92 L 400 92 L 410 100 L 590 100"
          fill="none"
          stroke="#f59e0b"
          strokeWidth="1.6"
          opacity="0.5"
        />

        {/* Right Side Canopy Notches */}
        <path
          d="M 1330 100 L 1510 100 L 1520 92 L 1540 92"
          fill="none"
          stroke="#f59e0b"
          strokeWidth="1.6"
          opacity="0.5"
        />
      </svg>
    </div>
  );
}
