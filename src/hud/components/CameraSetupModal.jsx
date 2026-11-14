import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Video,
  Sliders,
  Sparkles,
  X,
  FlipHorizontal,
  Monitor,
  Eye
} from 'lucide-react';
import { hudAudio } from '../services/audioService';

export default function CameraSetupModal({
  isOpen,
  onClose,
  activeDeviceId,
  onSelectAndActivateCamera,
  onFallbackToSimulation,
  cameraSettings,
  onUpdateCameraSettings,
  onNotify
}) {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(activeDeviceId || '');
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  const [previewActive, setPreviewActive] = useState(false);
  const previewVideoRef = useRef(null);
  const previewStreamRef = useRef(null);

  // Stop preview stream helper
  const stopPreviewStream = useCallback(() => {
    if (previewStreamRef.current) {
      previewStreamRef.current.getTracks().forEach((track) => track.stop());
      previewStreamRef.current = null;
    }
    if (previewVideoRef.current) {
      previewVideoRef.current.srcObject = null;
    }
    setPreviewActive(false);
  }, []);

  // Enumerate video devices
  const refreshDevices = useCallback(async () => {
    setIsLoadingDevices(true);
    setPermissionError(null);
    try {
      // 1. Probe devices
      let allDevices = await navigator.mediaDevices.enumerateDevices();
      let videoDevices = allDevices.filter((d) => d.kind === 'videoinput');

      // If device labels are hidden (no permission yet), probe briefly
      const hasLabels = videoDevices.some((d) => d.label && d.label.length > 0);
      if (!hasLabels && navigator.mediaDevices.getUserMedia) {
        try {
          const initialStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          initialStream.getTracks().forEach((t) => t.stop());
          allDevices = await navigator.mediaDevices.enumerateDevices();
          videoDevices = allDevices.filter((d) => d.kind === 'videoinput');
        } catch (permErr) {
          console.warn('Initial camera probe note:', permErr);
        }
      }

      setDevices(videoDevices);

      if (videoDevices.length > 0) {
        setSelectedDevice((current) => {
          // A. If the user already has a valid selection and it is NOT an IR camera, KEEP IT!
          if (current && videoDevices.some((d) => d.deviceId === current)) {
            const curDev = videoDevices.find((d) => d.deviceId === current);
            const curLabel = (curDev?.label || '').toLowerCase();
            if (!curLabel.includes('ir ') && !curLabel.includes('infrared')) {
              return current;
            }
          }
          // B. If parent activeDeviceId is valid and not IR, use it
          if (activeDeviceId && videoDevices.some((d) => d.deviceId === activeDeviceId)) {
            const parentDev = videoDevices.find((d) => d.deviceId === activeDeviceId);
            const parentLabel = (parentDev?.label || '').toLowerCase();
            if (!parentLabel.includes('ir ') && !parentLabel.includes('infrared')) {
              return activeDeviceId;
            }
          }
          // C. If a camera was saved previously and not IR, use it
          const savedId = localStorage.getItem('redatlas_selected_camera_id');
          if (savedId && videoDevices.some((d) => d.deviceId === savedId)) {
            const savedDev = videoDevices.find((d) => d.deviceId === savedId);
            const savedLabel = (savedDev?.label || '').toLowerCase();
            if (!savedLabel.includes('ir ') && !savedLabel.includes('infrared')) {
              return savedId;
            }
          }
          // D. Explicitly prioritize external USB webcams (Logi C270, USB Video, etc.)
          const externalDev = videoDevices.find((d) => {
            const l = (d.label || '').toLowerCase();
            return (
              (l.includes('logi') || l.includes('c270') || l.includes('usb') || l.includes('webcam') || l.includes('external')) &&
              !l.includes('integrated') && !l.includes('built-in') && !l.includes('ir') && !l.includes('infrared')
            );
          });
          const nonIrDev = videoDevices.find((d) => {
            const l = (d.label || '').toLowerCase();
            return !l.includes('integrated') && !l.includes('built-in') && !l.includes('ir') && !l.includes('infrared');
          });
          return externalDev ? externalDev.deviceId : (nonIrDev ? nonIrDev.deviceId : videoDevices[0].deviceId);
        });
      } else {
        setPermissionError('No video camera devices detected. Ensure your USB headcam is plugged in.');
      }
    } catch (err) {
      console.error('Error enumerating cameras:', err);
      setPermissionError(err.message || 'Permission denied or cameras unavailable.');
    } finally {
      setIsLoadingDevices(false);
    }
  }, [activeDeviceId]);

  // Start preview of selected device
  const startPreview = useCallback(async (deviceId) => {
    if (!deviceId) return;
    stopPreviewStream();

    try {
      const constraints = {
        video: {
          deviceId: { exact: deviceId },
          width: cameraSettings.resolution === '4K' ? { ideal: 3840 } :
                 cameraSettings.resolution === '1080p' ? { ideal: 1920 } :
                 cameraSettings.resolution === '720p' ? { ideal: 1280 } : { ideal: 640 },
          frameRate: { ideal: cameraSettings.frameRate || 30 }
        },
        audio: false
      };

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (errExact) {
        console.warn('Exact deviceId constraint failed in preview, retrying with ideal constraints:', errExact);
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: { ideal: deviceId },
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 }
          },
          audio: false
        });
      }

      previewStreamRef.current = stream;

      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = stream;
        await previewVideoRef.current.play().catch(() => {});
      }
      setPreviewActive(true);
      setPermissionError(null);
    } catch (err) {
      console.warn('Preview error for device:', deviceId, err);
      setPermissionError(`Failed to open preview: ${err.message || 'Device in use or inaccessible'}`);
      setPreviewActive(false);
    }
  }, [cameraSettings, stopPreviewStream]);

  // Initial load when modal opens
  useEffect(() => {
    if (isOpen) {
      refreshDevices();
    } else {
      stopPreviewStream();
    }
    return () => {
      stopPreviewStream();
    };
  }, [isOpen]);

  // Update preview when device or resolution changes while modal is open
  useEffect(() => {
    if (isOpen && selectedDevice) {
      startPreview(selectedDevice);
    }
  }, [isOpen, selectedDevice, cameraSettings.resolution, cameraSettings.frameRate, startPreview]);

  // Confirm and Activate Camera
  const handleConfirmActivation = async () => {
    hudAudio.playDestinationSet();
    stopPreviewStream();

    // Give Windows USB driver 180ms to release the hardware handle cleanly
    await new Promise((resolve) => setTimeout(resolve, 180));

    let devId = selectedDevice;
    let devName = 'External Camera';

    if (devId) {
      const match = devices.find((d) => d.deviceId === devId);
      if (match && match.label) devName = match.label;
    } else if (devices.length > 0) {
      devId = devices[0].deviceId;
      devName = devices[0].label || 'External Camera';
    }

    if (devId) {
      localStorage.setItem('redatlas_selected_camera_id', devId);
      localStorage.setItem('redatlas_selected_camera_name', devName);
      localStorage.setItem('redatlas_camera_configured', 'true');
      localStorage.setItem('redatlas_camera_mode', 'webcam');

      if (onSelectAndActivateCamera) {
        onSelectAndActivateCamera(devId, devName);
      }
      if (onNotify) onNotify(`Activated Primary Headcam: ${devName}`, 'success');
      onClose();
      return;
    }

    // Graceful fallback to simulation
    if (onNotify) onNotify('No camera hardware found. Switched to Mars Simulation.', 'warning');
    handleUseSimulation();
  };

  const handleUseSimulation = () => {
    hudAudio.playSelect();
    stopPreviewStream();
    localStorage.setItem('redatlas_camera_mode', 'mars_sim');
    localStorage.setItem('redatlas_camera_configured', 'true');
    if (onFallbackToSimulation) onFallbackToSimulation();
    if (onNotify) onNotify('Operating in Mars Surface Simulation Mode', 'info');
    onClose();
  };

  if (!isOpen) return null;

  const getDeviceBadge = (label = '') => {
    const l = label.toLowerCase();
    if (l.includes('integrated') || l.includes('built-in') || l.includes('internal') || l.includes('facetime')) return 'INTEGRATED';
    if (l.includes('obs') || l.includes('virtual')) return 'VIRTUAL CAM';
    if (l.includes('hdmi') || l.includes('capture') || l.includes('elgato') || l.includes('avermedia')) return 'HDMI CAPTURE';
    if (l.includes('c270') || l.includes('logi') || l.includes('usb') || l.includes('webcam') || l.includes('head') || l.includes('cam')) return 'EXTERNAL USB';
    return 'VIDEO DEVICE';
  };

  const getPreviewFilter = () => {
    let transform = '';
    if (cameraSettings.flipHorizontal) transform += 'scaleX(-1) ';
    if (cameraSettings.flipVertical) transform += 'scaleY(-1) ';

    const brightness = cameraSettings.brightness || 100;
    const contrast = cameraSettings.contrast || 100;
    const saturation = cameraSettings.saturation || 100;

    return {
      transform,
      filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`
    };
  };

  return (
    <div className="hud-modal-backdrop camera-setup-backdrop" onClick={onClose}>
      <div className="hud-modal-panel camera-setup-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <Camera size={18} className="text-accent-amber" />
            <h3 className="modal-title">PRIMARY CAMERA INPUT & HARDWARE AVIONICS</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close Setup (ESC)">
            <X size={16} />
          </button>
        </div>

        <div className="modal-body-scroll camera-setup-body">
          {/* Instructions Banner */}
          <div className="camera-setup-intro">
            <p>
              Select your <strong>external head-mounted camera</strong>, <strong>USB webcam</strong>, or <strong>HDMI capture device</strong>. The astronaut helmet HUD renders directly over this live visual perspective.
            </p>
          </div>

          {/* Error / Alert banner */}
          {permissionError && (
            <div className="camera-alert-box">
              <AlertCircle size={16} className="text-accent-amber shrink-0" />
              <span>{permissionError}</span>
            </div>
          )}

          <div className="camera-setup-layout">
            {/* Left: Device Selection & Settings */}
            <div className="camera-config-col">
              {/* Device Selector */}
              <div className="form-group">
                <div className="label-with-refresh">
                  <label className="input-label">DETECTED CAMERA DEVICES ({devices.length})</label>
                  <button
                    type="button"
                    className="refresh-dev-btn"
                    onClick={() => refreshDevices(false)}
                    disabled={isLoadingDevices}
                    title="Scan for newly connected USB or HDMI cameras"
                  >
                    <RefreshCw size={12} className={isLoadingDevices ? 'animate-spin' : ''} />
                    <span>Refresh List</span>
                  </button>
                </div>

                <div className="devices-selector-list">
                  {devices.length === 0 ? (
                    <div className="no-devices-msg">
                      <span>No camera hardware detected. Plug in your USB headcam and click Refresh List, or click "USE MARS SURFACE SIMULATION" below.</span>
                    </div>
                  ) : (
                    devices.map((device, index) => {
                      const isSelected = selectedDevice === device.deviceId;
                      const badge = getDeviceBadge(device.label);

                      return (
                        <div
                          key={device.deviceId || index}
                          className={`device-radio-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => {
                            hudAudio.playSelect();
                            setSelectedDevice(device.deviceId);
                          }}
                        >
                          <div className="device-card-left">
                            <div className="device-radio-circle">
                              {isSelected && <div className="device-radio-dot" />}
                            </div>
                            <div className="device-meta">
                              <span className="device-name">{device.label || `Video Input Device #${index + 1}`}</span>
                              <span className="device-id-code">ID: {device.deviceId ? device.deviceId.substring(0, 16) + '...' : 'Default'}</span>
                            </div>
                          </div>
                          <span className={`device-badge ${badge.toLowerCase().replace(' ', '-')}`}>
                            {badge}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Hardware Resolution & Frame Rate */}
              <div className="settings-row-pair">
                <div className="form-group flex-1">
                  <label className="input-label">TARGET RESOLUTION</label>
                  <select
                    className="hud-select w-full"
                    value={cameraSettings.resolution}
                    onChange={(e) => onUpdateCameraSettings({ resolution: e.target.value })}
                  >
                    <option value="4K">4K Ultra HD (3840 × 2160)</option>
                    <option value="1080p">1080p Full HD (1920 × 1080)</option>
                    <option value="720p">720p HD (1280 × 720)</option>
                    <option value="480p">480p SD (640 × 480)</option>
                  </select>
                </div>

                <div className="form-group flex-1">
                  <label className="input-label">FRAME RATE</label>
                  <select
                    className="hud-select w-full"
                    value={cameraSettings.frameRate}
                    onChange={(e) => onUpdateCameraSettings({ frameRate: parseInt(e.target.value, 10) })}
                  >
                    <option value={60}>60 FPS (Fluid Motion)</option>
                    <option value={30}>30 FPS (Standard EVA)</option>
                    <option value={24}>24 FPS (Cinematic)</option>
                  </select>
                </div>
              </div>

              {/* Video Orientation & Adjustments */}
              <div className="orientation-controls-box">
                <label className="input-label">VIDEO ORIENTATION & IMAGE TUNING</label>
                <div className="orientation-buttons-row">
                  <button
                    type="button"
                    className={`orient-btn ${cameraSettings.flipHorizontal ? 'active' : ''}`}
                    onClick={() => onUpdateCameraSettings({ flipHorizontal: !cameraSettings.flipHorizontal })}
                  >
                    <FlipHorizontal size={13} />
                    <span>Mirror Horizontal</span>
                  </button>

                  <button
                    type="button"
                    className={`orient-btn ${cameraSettings.flipVertical ? 'active' : ''}`}
                    onClick={() => onUpdateCameraSettings({ flipVertical: !cameraSettings.flipVertical })}
                  >
                    <span>Flip Vertical (Inverted Mount)</span>
                  </button>
                </div>

                {/* Brightness & Contrast Sliders */}
                <div className="sliders-subgrid">
                  <div className="slider-item">
                    <div className="slider-labels">
                      <span>Brightness</span>
                      <span>{cameraSettings.brightness || 100}%</span>
                    </div>
                    <input
                      type="range"
                      min="60"
                      max="150"
                      value={cameraSettings.brightness || 100}
                      onChange={(e) => onUpdateCameraSettings({ brightness: parseInt(e.target.value, 10) })}
                      className="hud-range-slider"
                    />
                  </div>

                  <div className="slider-item">
                    <div className="slider-labels">
                      <span>Contrast</span>
                      <span>{cameraSettings.contrast || 100}%</span>
                    </div>
                    <input
                      type="range"
                      min="70"
                      max="150"
                      value={cameraSettings.contrast || 100}
                      onChange={(e) => onUpdateCameraSettings({ contrast: parseInt(e.target.value, 10) })}
                      className="hud-range-slider"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Real-time Live Camera Preview */}
            <div className="camera-preview-col">
              <label className="input-label">LIVE CAMERA HARDWARE PREVIEW</label>
              <div className="preview-viewport-box">
                <video
                  ref={previewVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="preview-video-element"
                  style={getPreviewFilter()}
                />

                <div className="preview-status-chip">
                  <span className={`status-dot ${previewActive ? 'dot-active' : 'dot-inactive'}`} />
                  <span>{previewActive ? 'STREAM ACTIVE' : 'INITIALIZING PREVIEW...'}</span>
                </div>

                <div className="preview-res-tag">
                  {cameraSettings.resolution} • {cameraSettings.frameRate} FPS
                </div>
              </div>

              <div className="preview-hint-text">
                Check camera alignment, focus, and lighting before engaging the HUD visor.
              </div>
            </div>
          </div>

          {/* Action Footer with Fully Fixed, Styled, High-Impact Action Buttons */}
          <div className="camera-setup-footer">
            <button
              type="button"
              className="hud-action-btn btn-secondary btn-mars-sim"
              onClick={handleUseSimulation}
              title="Operate with Mars surface 3D environment when no camera is connected"
            >
              <Sparkles size={15} className="btn-icon-amber" />
              <span>USE MARS SURFACE SIMULATION</span>
            </button>

            <button
              type="button"
              className="hud-action-btn btn-primary-dest btn-confirm-headcam"
              onClick={handleConfirmActivation}
              title="Activate selected camera as the HUD visual feed"
            >
              <CheckCircle2 size={16} className="btn-icon-check" />
              <span>CONFIRM & ENGAGE HEADCAM HUD</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
