/**
 * Authentic NASA / Sci-Fi Audio Synthesizer for Helmet HUD
 * Uses the Web Audio API to produce real-time procedural sound effects
 * without needing external MP3 files.
 */

class AudioService {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.masterGain = null;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.18, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.18, this.ctx.currentTime);
    }
  }

  isMuted() {
    return this.muted;
  }

  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  playReticleHover() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1800, this.ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch (e) {}
  }

  playTargetLock() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      // High harmonic dual-tone chime
      [880, 1760].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.25, now + idx * 0.06 + 0.08);
        gain.gain.setValueAtTime(0.08, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.12);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.13);
      });
    } catch (e) {}
  }

  playSelect() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(940, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1480, this.ctx.currentTime + 0.07);
      gain.gain.setValueAtTime(0.09, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
    } catch (e) {}
  }

  playDestinationSet() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 major chord
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.05);
        gain.gain.setValueAtTime(0.08, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.22);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now + i * 0.05);
        osc.stop(now + i * 0.05 + 0.25);
      });
    } catch (e) {}
  }

  playWaypointPlaced() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(now + 0.2);
    } catch (e) {}
  }

  playWarning() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      for (let i = 0; i < 2; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, now + i * 0.14);
        osc.frequency.linearRampToValueAtTime(400, now + i * 0.14 + 0.1);
        gain.gain.setValueAtTime(0.08, now + i * 0.14);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.14 + 0.12);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now + i * 0.14);
        osc.stop(now + i * 0.14 + 0.13);
      }
    } catch (e) {}
  }
}

export const hudAudio = new AudioService();
