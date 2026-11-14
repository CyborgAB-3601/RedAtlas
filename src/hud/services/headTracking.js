/**
 * Head Tracking and Gaze Orientation Service
 * Supports:
 * - Device Orientation API (IMU/Gyroscope for head-mounted displays/phones)
 * - Mouse-look (Pointer lock / drag for desktop testing)
 * - Keyboard look fallback (Arrow keys / WASD)
 * - Gaze Dwell timer & raycasting helpers
 */

export class HeadTracker {
  constructor(onChange) {
    this.onChange = onChange;
    this.yaw = 0;   // Horizontal heading (-180 to +180)
    this.pitch = 0; // Vertical inclination (-90 to +90)
    this.roll = 0;
    this.baseYaw = 0;
    this.basePitch = 0;

    this.isPointerLocked = false;
    this.isDragging = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;

    this.hasImu = false;
    this.enabled = true;

    this.handleOrientation = this.handleOrientation.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  start() {
    if (typeof window === 'undefined') return;

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', this.handleOrientation, true);
    }

    window.addEventListener('keydown', this.handleKeyDown);
  }

  stop() {
    if (typeof window === 'undefined') return;
    window.removeEventListener('deviceorientation', this.handleOrientation, true);
    window.removeEventListener('keydown', this.handleKeyDown);
  }

  handleOrientation(e) {
    if (!this.enabled) return;
    if (e.alpha === null || e.beta === null || e.gamma === null) return;
    this.hasImu = true;

    // Convert deviceorientation to yaw/pitch
    let currentYaw = (e.alpha || 0); // 0..360
    let currentPitch = (e.beta || 0); // -180..180

    // Calibrate relative to recenter offset
    let relYaw = (currentYaw - this.baseYaw) % 360;
    if (relYaw > 180) relYaw -= 360;
    if (relYaw < -180) relYaw += 360;

    let relPitch = currentPitch - this.basePitch;
    relPitch = Math.max(-60, Math.min(60, relPitch));

    this.yaw = relYaw;
    this.pitch = relPitch;
    this.roll = e.gamma || 0;

    this.notify();
  }

  handleKeyDown(e) {
    if (!this.enabled) return;
    const step = 4.0;
    let changed = false;

    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      this.yaw -= step;
      changed = true;
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      this.yaw += step;
      changed = true;
    } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      this.pitch = Math.min(50, this.pitch + step);
      changed = true;
    } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
      this.pitch = Math.max(-50, this.pitch - step);
      changed = true;
    } else if (e.key === 'c' || e.key === 'C') {
      this.recenter();
      changed = true;
    }

    if (changed) {
      // Normalize yaw to -180..180
      if (this.yaw > 180) this.yaw -= 360;
      if (this.yaw < -180) this.yaw += 360;
      this.notify();
    }
  }

  handleMouseDown(e) {
    this.isDragging = true;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
  }

  handleMouseUp() {
    this.isDragging = false;
  }

  handleMouseMove(e) {
    if (!this.enabled) return;

    if (document.pointerLockElement) {
      const sensitivity = 0.12;
      this.yaw += (e.movementX || 0) * sensitivity;
      this.pitch -= (e.movementY || 0) * sensitivity;
      this.pitch = Math.max(-55, Math.min(55, this.pitch));

      if (this.yaw > 180) this.yaw -= 360;
      if (this.yaw < -180) this.yaw += 360;

      this.notify();
      return;
    }

    if (this.isDragging) {
      const dx = e.clientX - this.lastMouseX;
      const dy = e.clientY - this.lastMouseY;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;

      const sensitivity = 0.2;
      this.yaw += dx * sensitivity;
      this.pitch -= dy * sensitivity;
      this.pitch = Math.max(-55, Math.min(55, this.pitch));

      if (this.yaw > 180) this.yaw -= 360;
      if (this.yaw < -180) this.yaw += 360;

      this.notify();
    }
  }

  recenter() {
    this.yaw = 0;
    this.pitch = 0;
    this.roll = 0;
    this.baseYaw = 0;
    this.basePitch = 0;
    this.notify();
  }

  notify() {
    if (this.onChange) {
      this.onChange({
        yaw: this.yaw,
        pitch: this.pitch,
        roll: this.roll,
        heading: ((Math.round(this.yaw) % 360) + 360) % 360
      });
    }
  }
}
