import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, VideoOff, RefreshCw, Sparkles, Settings } from 'lucide-react';
import { hudAudio } from '../services/audioService';

export default function CameraBackground({
  headOrientation = { yaw: 0, pitch: 0, roll: 0 },
  cameraMode, // 'webcam' | 'mars_sim'
  onToggleCameraMode,
  activeDeviceId,
  activeDeviceName,
  cameraSettings = {},
  onOpenDeviceSettings,
  filterMode = 'normal',
  onNotify,
  videoRef: externalVideoRef,
  onVideoReady
}) {
  const internalVideoRef = useRef(null);
  const videoRef = externalVideoRef || internalVideoRef;
  const simCanvasRef = useRef(null);
  const streamRef = useRef(null);
  const [streamActive, setStreamActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  // Stop active stream helper
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStreamActive(false);
  }, []);

  // Request & Start Selected Camera Stream
  const startCamera = useCallback(
    async (deviceId) => {
      stopStream();
      setCameraError(null);

      let targetId = deviceId;

      // 1. Proactively auto-detect and prefer external visible camera (e.g. Logi C270)
      if (navigator.mediaDevices?.enumerateDevices) {
        try {
          const allDevs = await navigator.mediaDevices.enumerateDevices();
          const videoDevs = allDevs.filter((d) => d.kind === 'videoinput');

          // If targetId is missing or points to an IR camera, find the best visible camera
          const currentIsIr = targetId && videoDevs.some((d) => {
            if (d.deviceId !== targetId) return false;
            const l = (d.label || '').toLowerCase();
            return l.includes('ir ') || l.includes('infrared');
          });

          if (!targetId || currentIsIr) {
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
              targetId = chosen.deviceId;
            }
          }
        } catch (e) {
          console.warn('Auto camera probe error:', e);
        }
      }

      const resolutionMap = {
        '4K': { width: { ideal: 3840, max: 3840 }, height: { ideal: 2160, max: 2160 } },
        '1080p': { width: { ideal: 1920, max: 1920 }, height: { ideal: 1080, max: 1080 } },
        '720p': { width: { ideal: 1280, max: 1920 }, height: { ideal: 720, max: 1080 } },
        '480p': { width: { ideal: 640 }, height: { ideal: 480 } }
      };

      // Native 720p/1080p ideal resolution for external webcams
      const targetRes = resolutionMap[cameraSettings.resolution] || resolutionMap['720p'];

      const constraints = {
        video: {
          ...(targetId ? { deviceId: { exact: targetId } } : {}),
          ...targetRes,
          frameRate: { ideal: cameraSettings.frameRate || 30 }
        },
        audio: false
      };

      try {
        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (errExact) {
          console.warn('Exact deviceId constraint failed, retrying with ideal constraints:', errExact);
          // Wait 200ms in case the USB device handle was just released from preview
          await new Promise((r) => setTimeout(r, 200));
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              ...(targetId ? { deviceId: { ideal: targetId } } : {}),
              width: { ideal: 1280 },
              height: { ideal: 720 },
              frameRate: { ideal: 30 }
            },
            audio: false
          });
        }

        streamRef.current = stream;

        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.onended = () => {
            setStreamActive(false);
            setCameraError('Camera connection lost (Hardware link interrupted)');
            hudAudio.playWarning();
            if (onNotify) onNotify('Headcam Hardware Disconnected', 'critical');
          };
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.muted = true;
          videoRef.current.playsInline = true;
          videoRef.current.setAttribute('playsinline', '');
          videoRef.current.setAttribute('muted', '');

          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch((err) => console.warn('Autoplay error on metadata:', err));
          };
          await videoRef.current.play().catch((err) => console.warn('Direct play error:', err));
        }

        setStreamActive(true);
        setCameraError(null);
        if (onVideoReady && videoRef.current) onVideoReady(videoRef.current);
        if (onNotify) onNotify(`Headcam Active: ${activeDeviceName || 'External Camera'}`, 'success');
      } catch (err) {
        console.warn('Failed to start camera device:', targetId, err);
        let errorMsg = 'Selected camera is unavailable or in use by another app.';
        if (err.name === 'NotAllowedError') errorMsg = 'Camera permission was denied in browser. Please allow camera access.';
        if (err.name === 'NotFoundError') errorMsg = 'Selected camera hardware was not found.';
        if (err.name === 'NotReadableError') errorMsg = 'Hardware device is occupied by another application.';

        setCameraError(errorMsg);
        setStreamActive(false);
        if (onNotify) onNotify(errorMsg, 'warning');
      }
    },
    [cameraSettings.resolution, cameraSettings.frameRate, activeDeviceName, stopStream, onNotify, onVideoReady, videoRef]
  );

  useEffect(() => {
    if (cameraMode === 'webcam') {
      startCamera(activeDeviceId);
    } else {
      stopStream();
    }

    return () => {
      stopStream();
    };
  }, [cameraMode, activeDeviceId, cameraSettings.resolution, cameraSettings.frameRate, startCamera, stopStream]);

  // Handle hardware devicechange events
  useEffect(() => {
    const handleDeviceChange = async () => {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevs = devices.filter((d) => d.kind === 'videoinput');

        if (activeDeviceId && cameraMode === 'webcam') {
          const stillConnected = videoDevs.some((d) => d.deviceId === activeDeviceId);
          if (!stillConnected) {
            setStreamActive(false);
            setCameraError('Active headcam device was disconnected.');
            hudAudio.playWarning();
            if (onNotify) onNotify('Camera Disconnected. Click to reconnect or switch.', 'critical');
          }
        }
      } catch (e) {
        console.warn('Device change error:', e);
      }
    };

    navigator.mediaDevices?.addEventListener('devicechange', handleDeviceChange);
    return () => {
      navigator.mediaDevices?.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [activeDeviceId, cameraMode, onNotify]);

  // Mars Simulation Canvas (First-Person Mars EVA Scene with Head Parallax)
  useEffect(() => {
    if (cameraMode !== 'mars_sim') return;

    const canvas = simCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Primary High-Definition Mars EVA First-Person Asset
    const firstPersonImg = new Image();
    firstPersonImg.src = '/assets/mars_eva_first_person.jpg';

    // Fallback Mars Base Image
    const baseImg = new Image();
    baseImg.src = '/assets/mars_base_site.jpg';

    // Dust particles
    const dustParticles = [];
    for (let i = 0; i < 40; i++) {
      dustParticles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        speedX: Math.random() * 0.8 + 0.3,
        speedY: (Math.random() - 0.5) * 0.2,
        size: Math.random() * 2 + 0.8,
        alpha: Math.random() * 0.3 + 0.1
      });
    }

    let tick = 0;

    const render = () => {
      tick += 0.015;
      ctx.clearRect(0, 0, width, height);

      const yawOffset = (headOrientation.yaw || 0) * 14;
      const pitchOffset = (headOrientation.pitch || 0) * 10;

      if (firstPersonImg.complete && firstPersonImg.naturalWidth > 0) {
        // Draw the exact Mars EVA First-Person scene with smooth head-tracking parallax (unscaled 1:1 camera feed)
        const scale = Math.max(width / firstPersonImg.naturalWidth, height / firstPersonImg.naturalHeight) * 1.08;
        const drawW = firstPersonImg.naturalWidth * scale;
        const drawH = firstPersonImg.naturalHeight * scale;
        const drawX = (width - drawW) / 2 - yawOffset;
        const drawY = (height - drawH) / 2 + pitchOffset;

        ctx.drawImage(firstPersonImg, drawX, drawY, drawW, drawH);
      } else {
        // Procedural atmospheric Mars fallback while image loads
        const skyGradient = ctx.createLinearGradient(0, 0, 0, height * 0.65 + pitchOffset);
        skyGradient.addColorStop(0, '#150906');
        skyGradient.addColorStop(0.4, '#38160e');
        skyGradient.addColorStop(0.75, '#692a18');
        skyGradient.addColorStop(1, '#964225');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, width, height);

        const groundGrad = ctx.createLinearGradient(0, height * 0.55 + pitchOffset, 0, height);
        groundGrad.addColorStop(0, '#6d2a17');
        groundGrad.addColorStop(0.3, '#86341d');
        groundGrad.addColorStop(1, '#36130a');
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, height * 0.55 + pitchOffset, width, height);
      }

      // Atmospheric Mars dust drift
      ctx.fillStyle = 'rgba(235, 160, 110, 0.5)';
      dustParticles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.x > width) p.x = 0;
        if (p.y > height) p.y = 0;
        if (p.y < 0) p.y = height;

        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y + pitchOffset * 0.3, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [cameraMode, headOrientation]);

  // Video orientation transform & color tuning (Camera feed remains strictly 1:1 natural optical view)
  const getVideoTransformAndFilter = () => {
    let transform = '';
    if (cameraSettings.flipHorizontal) transform += 'scaleX(-1) ';
    if (cameraSettings.flipVertical) transform += 'scaleY(-1) ';

    const brightness = cameraSettings.brightness || 100;
    const contrast = cameraSettings.contrast || 100;
    const saturation = cameraSettings.saturation || 100;

    let filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;

    switch (filterMode) {
      case 'night_vision':
        filter += ' brightness(1.2) contrast(1.4) hue-rotate(60deg) saturate(1.8)';
        break;
      case 'thermal':
        filter += ' invert(0.9) hue-rotate(190deg) saturate(2.5) contrast(1.6)';
        break;
      case 'amber_enhancer':
        filter += ' sepia(0.5) hue-rotate(345deg) saturate(1.8) contrast(1.15)';
        break;
      default:
        break;
    }

    return { transform, filter };
  };

  return (
    <div className="hud-camera-container">
      {/* 1. Fullscreen Camera Stream or Natural Mars Simulation */}
      {cameraMode === 'webcam' ? (
        <div className="camera-feed-wrapper">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="hud-video-stream"
            style={getVideoTransformAndFilter()}
          />
          {cameraError && (
            <div className="camera-unavailable-card">
              <VideoOff size={30} className="text-accent-amber animate-pulse" />
              <div className="unavailable-text-group">
                <span className="unavailable-title">CAMERA INPUT UNAVAILABLE</span>
                <span className="unavailable-desc">{cameraError}</span>
              </div>
              <div className="unavailable-actions">
                <button
                  className="hud-btn btn-primary-action"
                  onClick={() => onOpenDeviceSettings && onOpenDeviceSettings()}
                >
                  <RefreshCw size={12} />
                  <span>RECONNECT / SELECT CAMERA</span>
                </button>
                <button
                  className="hud-btn btn-secondary-action"
                  onClick={() => onToggleCameraMode('mars_sim')}
                >
                  <Sparkles size={12} />
                  <span>USE MARS SIMULATION</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <canvas
          ref={simCanvasRef}
          className="hud-sim-canvas"
          style={getVideoTransformAndFilter()}
        />
      )}

      {/* 2. Soft, ultra-subtle helmet visor perimeter vignette */}
      <div className="hud-visor-perimeter" />
    </div>
  );
}
