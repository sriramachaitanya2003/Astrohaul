/**
 * SoundEngine - Pure Web Audio API procedural sound synthesizer
 * 100% self-contained: No audio asset files, zero 404s, fully dynamic!
 * Authored by: agency-game-audio-engineer
 */
export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isMuted = false;
    this.isInitialized = false;

    // Continuous sound nodes
    this.thrusterGain = null;
    this.thrusterFilter = null;
    this.thrusterNoise = null;

    this.laserGain = null;
    this.laserOsc = null;
    this.laserSubOsc = null;

    this.ambientGain = null;
    this.ambientOscs = [];
  }

  init() {
    if (this.isInitialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this._initThrusterSynth();
      this._initLaserSynth();
      this._initAmbientDrone();

      this.isInitialized = true;
    } catch (e) {
      console.warn("Web Audio API could not be initialized:", e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  _createNoiseBuffer() {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  _initThrusterSynth() {
    const buffer = this._createNoiseBuffer();
    if (!buffer) return;

    this.thrusterNoise = this.ctx.createBufferSource();
    this.thrusterNoise.buffer = buffer;
    this.thrusterNoise.loop = true;

    this.thrusterFilter = this.ctx.createBiquadFilter();
    this.thrusterFilter.type = 'lowpass';
    this.thrusterFilter.frequency.setValueAtTime(140, this.ctx.currentTime);

    this.thrusterGain = this.ctx.createGain();
    this.thrusterGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

    this.thrusterNoise.connect(this.thrusterFilter);
    this.thrusterFilter.connect(this.thrusterGain);
    this.thrusterGain.connect(this.masterGain);

    this.thrusterNoise.start();
  }

  _initLaserSynth() {
    this.laserOsc = this.ctx.createOscillator();
    this.laserOsc.type = 'sawtooth';
    this.laserOsc.frequency.setValueAtTime(320, this.ctx.currentTime);

    this.laserSubOsc = this.ctx.createOscillator();
    this.laserSubOsc.type = 'triangle';
    this.laserSubOsc.frequency.setValueAtTime(640, this.ctx.currentTime);

    const laserFilter = this.ctx.createBiquadFilter();
    laserFilter.type = 'bandpass';
    laserFilter.frequency.setValueAtTime(450, this.ctx.currentTime);
    laserFilter.Q.setValueAtTime(3.5, this.ctx.currentTime);

    this.laserGain = this.ctx.createGain();
    this.laserGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

    this.laserOsc.connect(laserFilter);
    this.laserSubOsc.connect(laserFilter);
    laserFilter.connect(this.laserGain);
    this.laserGain.connect(this.masterGain);

    this.laserOsc.start();
    this.laserSubOsc.start();
  }

  _initAmbientDrone() {
    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    this.ambientGain.connect(this.masterGain);

    // Deep cosmic space chord (C2, G2, D#3)
    const freqs = [65.41, 98.00, 155.56];
    freqs.forEach(f => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, this.ctx.currentTime);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(180, this.ctx.currentTime);

      osc.connect(filter);
      filter.connect(this.ambientGain);
      osc.start();
      this.ambientOscs.push(osc);
    });
  }

  setThrusterVolume(throttle, isBoosting = false) {
    if (!this.thrusterGain || !this.ctx) return;
    const targetGain = throttle > 0 ? (isBoosting ? 0.35 : 0.18) : 0.0001;
    const targetFreq = isBoosting ? 260 : 130 + throttle * 60;
    this.thrusterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.08);
    this.thrusterFilter.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.1);
  }

  setMiningLaserVolume(active) {
    if (!this.laserGain || !this.ctx) return;
    const targetGain = active ? 0.15 : 0.0001;
    this.laserGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
  }

  playPlasmaShot() {
    if (!this.ctx || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.15);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  playImpact(strength = 1) {
    if (!this.ctx || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120 * strength, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.18);

    const vol = Math.min(0.3, 0.08 * strength);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.19);
  }

  playPickup(tier = 1) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    // Harmonic bell frequencies based on mineral rarity
    const baseFreqs = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    const freq = baseFreqs[Math.min(tier - 1, baseFreqs.length - 1)];

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.22);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.26);
  }

  playExplosion(isLarge = false) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const dur = isLarge ? 0.7 : 0.4;

    // Sub-bass thud
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(90, now);
    subOsc.frequency.exponentialRampToValueAtTime(20, now + dur);

    subGain.gain.setValueAtTime(isLarge ? 0.4 : 0.25, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    subOsc.connect(subGain);
    subGain.connect(this.masterGain);
    subOsc.start(now);
    subOsc.stop(now + dur + 0.05);

    // Noise rumble
    const buffer = this._createNoiseBuffer();
    if (buffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, now);
      filter.frequency.exponentialRampToValueAtTime(50, now + dur);

      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(isLarge ? 0.35 : 0.2, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      noise.connect(filter);
      filter.connect(nGain);
      nGain.connect(this.masterGain);

      noise.start(now);
      noise.stop(now + dur + 0.05);
    }
  }

  playAlarm() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(880, now + 0.08);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.17);
  }

  playDockSuccess() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    // Two-tone airlock chime
    [440, 659.25].forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.12);

      gain.gain.setValueAtTime(0.2, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.3);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.32);
    });
  }

  playAutopilot(enable = true) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const freqs = enable ? [523.25, 659.25, 783.99] : [783.99, 659.25, 523.25];
    freqs.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.08);

      gain.gain.setValueAtTime(0.15, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.22);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.24);
    });
  }

  playWarningBeep() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.setValueAtTime(1174.66, now + 0.06);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  playSonarPing() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.45);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.9);
  }

  playCriticalHit() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    
    // Punchy high-resonance fracture crack
    [880, 1320, 1760].forEach(f => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.exponentialRampToValueAtTime(f * 0.5, now + 0.2);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.26);
    });
  }

  playEMP() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.6);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.7);
  }

  playTorpedoLaunch() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(480, now + 0.28);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.32);
  }

  playSalvage() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    // Mystical chord for tech recovery
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + i * 0.08);

      gain.gain.setValueAtTime(0.2, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.5);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.52);
    });
  }

  playAutopilot(enable) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    if (enable) {
      // Ascending two-tone confirmation chime
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880.00, now + 0.12); // A5
    } else {
      // Descending cancel chime
      osc.frequency.setValueAtTime(659.25, now); // E5
      osc.frequency.setValueAtTime(440.00, now + 0.12); // A4
    }

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  playWarningBeep() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    
    // Crisp urgent double-chirp
    [0, 0.1].forEach(offset => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(980, now + offset);

      gain.gain.setValueAtTime(0.12, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.06);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + offset);
      osc.stop(now + offset + 0.07);
    });
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
    }
    return this.isMuted;
  }
}

