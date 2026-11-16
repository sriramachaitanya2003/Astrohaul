/* Solar Drift: Void Miner - Autonomous Offline Bundle */
(() => {

/* --- js/engine/Vector2D.js --- */
/**
 * Vector2D - High-performance 2D vector utility class
 * Designed for Newtonian orbital & space physics
 */
class Vector2D {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  set(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }

  copy() {
    return new Vector2D(this.x, this.y);
  }

  add(v) {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  sub(v) {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  mult(n) {
    this.x *= n;
    this.y *= n;
    return this;
  }

  div(n) {
    if (n !== 0) {
      this.x /= n;
      this.y /= n;
    }
    return this;
  }

  magSq() {
    return this.x * this.x + this.y * this.y;
  }

  mag() {
    return Math.sqrt(this.magSq());
  }

  heading() {
    return Math.atan2(this.y, this.x);
  }

  normalize() {
    const m = this.mag();
    if (m !== 0) {
      this.div(m);
    }
    return this;
  }

  limit(max) {
    const mSq = this.magSq();
    if (mSq > max * max) {
      this.normalize().mult(max);
    }
    return this;
  }

  dist(v) {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  distSq(v) {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return dx * dx + dy * dy;
  }

  dot(v) {
    return this.x * v.x + this.y * v.y;
  }

  rotate(angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const nx = this.x * cos - this.y * sin;
    const ny = this.x * sin + this.y * cos;
    this.x = nx;
    this.y = ny;
    return this;
  }

  lerp(v, amt) {
    this.x += (v.x - this.x) * amt;
    this.y += (v.y - this.y) * amt;
    return this;
  }

  static fromAngle(angle, length = 1) {
    return new Vector2D(Math.cos(angle) * length, Math.sin(angle) * length);
  }

  static dist(v1, v2) {
    return v1.dist(v2);
  }

  static sub(v1, v2) {
    return new Vector2D(v1.x - v2.x, v1.y - v2.y);
  }

  static add(v1, v2) {
    return new Vector2D(v1.x + v2.x, v1.y + v2.y);
  }
}

/* --- js/engine/Camera.js --- */
/**
 * Camera - 2D Smooth tracking viewport with dynamic zoom and screen shake
 * Implemented with Whimsy Injector standards for tactile impact
 */
class Camera {
  constructor(canvas) {
    this.canvas = canvas;
    this.pos = new Vector2D(0, 0);
    this.target = new Vector2D(0, 0);
    this.zoom = 1.0;
    this.targetZoom = 1.0;
    this.smoothSpeed = 0.08;

    // Screen Shake variables
    this.shakeIntensity = 0;
    this.shakeDecay = 0.92;
    this.shakeOffset = new Vector2D(0, 0);

    // Viewport bounds
    this.viewportWidth = canvas.width;
    this.viewportHeight = canvas.height;
  }

  resize(w, h) {
    this.viewportWidth = w;
    this.viewportHeight = h;
  }

  setTarget(x, y) {
    this.target.set(x, y);
  }

  addShake(amount) {
    this.shakeIntensity = Math.min(this.shakeIntensity + amount, 28);
  }

  update(dt) {
    // Smooth camera tracking to target
    this.pos.lerp(this.target, this.smoothSpeed);

    // Smooth zoom interpolation
    this.zoom += (this.targetZoom - this.zoom) * 0.05;

    // Process screen shake
    if (this.shakeIntensity > 0.1) {
      const angle = Math.random() * Math.PI * 2;
      const mag = this.shakeIntensity;
      this.shakeOffset.set(Math.cos(angle) * mag, Math.sin(angle) * mag);
      this.shakeIntensity *= this.shakeDecay;
    } else {
      this.shakeIntensity = 0;
      this.shakeOffset.set(0, 0);
    }
  }

  apply(ctx) {
    ctx.save();
    // Center viewport
    ctx.translate(
      this.viewportWidth * 0.5 + this.shakeOffset.x,
      this.viewportHeight * 0.5 + this.shakeOffset.y
    );
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.pos.x, -this.pos.y);
  }

  restore(ctx) {
    ctx.restore();
  }

  screenToWorld(screenX, screenY) {
    const centeredX = (screenX - this.viewportWidth * 0.5 - this.shakeOffset.x) / this.zoom;
    const centeredY = (screenY - this.viewportHeight * 0.5 - this.shakeOffset.y) / this.zoom;
    return new Vector2D(centeredX + this.pos.x, centeredY + this.pos.y);
  }

  worldToScreen(worldX, worldY) {
    const relX = (worldX - this.pos.x) * this.zoom;
    const relY = (worldY - this.pos.y) * this.zoom;
    return new Vector2D(
      relX + this.viewportWidth * 0.5 + this.shakeOffset.x,
      relY + this.viewportHeight * 0.5 + this.shakeOffset.y
    );
  }

  isVisible(worldX, worldY, radius = 50) {
    const halfW = (this.viewportWidth * 0.5) / this.zoom + radius;
    const halfH = (this.viewportHeight * 0.5) / this.zoom + radius;
    return (
      Math.abs(worldX - this.pos.x) <= halfW &&
      Math.abs(worldY - this.pos.y) <= halfH
    );
  }
}

/* --- js/engine/Input.js --- */
/**
 * Input - Unified Keyboard & Mouse state management with world-coordinate tracking
 */
class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Map();
    this.mouse = {
      screen: new Vector2D(0, 0),
      world: new Vector2D(0, 0),
      leftDown: false,
      rightDown: false,
      wheelDelta: 0
    };

    this.justPressed = new Set();
    this._attachListeners();
  }

  _attachListeners() {
    window.addEventListener('keydown', (e) => {
      // Prevent default scrolling and browser shortcuts for game control keys
      if (['Space', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyS', 'KeyA', 'KeyD', 'KeyQ', 'KeyC', 'KeyR'].includes(e.code)) {
        e.preventDefault();
      }
      if (!this.keys.get(e.code)) {
        this.justPressed.add(e.code);
      }
      this.keys.set(e.code, true);
    });

    window.addEventListener('keyup', (e) => {
      this.keys.set(e.code, false);
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.screen.set(e.clientX - rect.left, e.clientY - rect.top);
    });

    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) this.mouse.leftDown = true;
      if (e.button === 2) {
        e.preventDefault();
        this.mouse.rightDown = true;
      }
    });

    this.canvas.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouse.leftDown = false;
      if (e.button === 2) this.mouse.rightDown = false;
    });

    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.mouse.wheelDelta = Math.sign(e.deltaY);
    }, { passive: false });

    window.addEventListener('blur', () => {
      this.keys.clear();
      this.mouse.leftDown = false;
      this.mouse.rightDown = false;
      this.justPressed.clear();
    });
  }

  update(camera) {
    // Translate screen coords to world coords via camera
    this.mouse.world = camera.screenToWorld(this.mouse.screen.x, this.mouse.screen.y);
  }

  postUpdate() {
    this.justPressed.clear();
    this.mouse.wheelDelta = 0;
  }

  isDown(code) {
    return !!this.keys.get(code);
  }

  wasJustPressed(code) {
    return this.justPressed.has(code);
  }

  // Convenient semantic checks
  isThrusting() {
    return this.isDown('KeyW') || this.isDown('ArrowUp');
  }

  isReversing() {
    return this.isDown('KeyS') || this.isDown('ArrowDown');
  }

  isTurningLeft() {
    return this.isDown('KeyA') || this.isDown('ArrowLeft');
  }

  isTurningRight() {
    return this.isDown('KeyD') || this.isDown('ArrowRight');
  }

  isBoosting() {
    return this.isDown('ShiftLeft') || this.isDown('ShiftRight');
  }

  isFiringMiningLaser() {
    return this.mouse.leftDown || this.isDown('KeyJ');
  }

  isTractorBeamActive() {
    return this.mouse.rightDown || this.isDown('KeyK') || this.isDown('Space');
  }

  isFiringWeapons() {
    return this.isDown('KeyF');
  }

  isAutopilotPressed() {
    return this.wasJustPressed('KeyG');
  }

  isToggleDampeners() {
    return this.wasJustPressed('KeyX');
  }

  isDockingRequested() {
    return this.wasJustPressed('KeyE');
  }

  isScannerPressed() {
    return this.wasJustPressed('KeyQ') || this.wasJustPressed('Tab');
  }

  isEMPPressed() {
    return this.wasJustPressed('KeyC');
  }

  isTorpedoPressed() {
    return this.wasJustPressed('KeyR');
  }
}

/* --- js/engine/SpatialHash.js --- */
/**
 * SpatialHash - 2D Grid spatial partitioning for O(1) broad-phase collision detection
 */
class SpatialHash {
  constructor(cellSize = 300) {
    this.cellSize = cellSize;
    this.grid = new Map();
  }

  clear() {
    this.grid.clear();
  }

  _getKey(x, y) {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    return `${cx}:${cy}`;
  }

  insert(entity) {
    const minX = Math.floor((entity.pos.x - (entity.radius || 20)) / this.cellSize);
    const maxX = Math.floor((entity.pos.x + (entity.radius || 20)) / this.cellSize);
    const minY = Math.floor((entity.pos.y - (entity.radius || 20)) / this.cellSize);
    const maxY = Math.floor((entity.pos.y + (entity.radius || 20)) / this.cellSize);

    for (let cx = minX; cx <= maxX; cx++) {
      for (let cy = minY; cy <= maxY; cy++) {
        const key = `${cx}:${cy}`;
        let cell = this.grid.get(key);
        if (!cell) {
          cell = [];
          this.grid.set(key, cell);
        }
        cell.push(entity);
      }
    }
  }

  query(x, y, radius) {
    const results = new Set();
    const minX = Math.floor((x - radius) / this.cellSize);
    const maxX = Math.floor((x + radius) / this.cellSize);
    const minY = Math.floor((y - radius) / this.cellSize);
    const maxY = Math.floor((y + radius) / this.cellSize);

    for (let cx = minX; cx <= maxX; cx++) {
      for (let cy = minY; cy <= maxY; cy++) {
        const key = `${cx}:${cy}`;
        const cell = this.grid.get(key);
        if (cell) {
          for (let i = 0; i < cell.length; i++) {
            results.add(cell[i]);
          }
        }
      }
    }

    return Array.from(results);
  }
}

/* --- js/audio/SoundEngine.js --- */
/**
 * SoundEngine - Pure Web Audio API procedural sound synthesizer
 * 100% self-contained: No audio asset files, zero 404s, fully dynamic!
 * Authored by: agency-game-audio-engineer
 */
class SoundEngine {
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

/* --- js/vfx/ParticleSystem.js --- */
/**
 * ParticleSystem - High-performance pooled particle engine for VFX and Whimsy
 * Authored by: agency-technical-artist & agency-whimsy-injector
 */
class ParticleSystem {
  constructor(maxParticles = 1200) {
    this.maxParticles = maxParticles;
    this.particles = [];
    this.floatingTexts = [];
    
    // Pre-allocate pool
    for (let i = 0; i < maxParticles; i++) {
      this.particles.push({
        active: false,
        pos: new Vector2D(),
        vel: new Vector2D(),
        size: 2,
        life: 0,
        maxLife: 1,
        color: '#ffffff',
        alpha: 1,
        decay: 0.96,
        isRing: false,
        ringRadius: 0
      });
    }
  }

  _getFreeParticle() {
    for (let i = 0; i < this.maxParticles; i++) {
      if (!this.particles[i].active) {
        return this.particles[i];
      }
    }
    return null;
  }

  emit(options) {
    const p = this._getFreeParticle();
    if (!p) return;

    p.active = true;
    p.pos.set(options.x, options.y);
    p.vel.set(options.vx || 0, options.vy || 0);
    p.size = options.size || 3;
    p.life = 0;
    p.maxLife = options.life || 0.6;
    p.color = options.color || '#00e5ff';
    p.alpha = 1;
    p.decay = options.decay || 0.98;
    p.isRing = options.isRing || false;
    p.ringRadius = options.ringRadius || 0;
  }

  emitThruster(x, y, heading, isBoosting = false) {
    const count = isBoosting ? 4 : 2;
    const spread = isBoosting ? 0.4 : 0.25;
    const speed = isBoosting ? 320 : 180;
    const baseColor = isBoosting ? '#ff7700' : '#00e5ff';
    const altColor = isBoosting ? '#ffffff' : '#0077ff';

    for (let i = 0; i < count; i++) {
      const angle = heading + Math.PI + (Math.random() - 0.5) * spread;
      const s = speed * (0.7 + Math.random() * 0.6);
      this.emit({
        x: x + (Math.random() - 0.5) * 4,
        y: y + (Math.random() - 0.5) * 4,
        vx: Math.cos(angle) * s,
        vy: Math.sin(angle) * s,
        size: (isBoosting ? 4 : 2.5) * (0.8 + Math.random() * 0.5),
        life: (isBoosting ? 0.35 : 0.22) * (0.8 + Math.random() * 0.4),
        color: Math.random() > 0.4 ? baseColor : altColor,
        decay: 0.94
      });
    }
  }

  emitMiningSparks(x, y, normalAngle, color = '#ffd000') {
    const count = 3;
    for (let i = 0; i < count; i++) {
      const angle = normalAngle + (Math.random() - 0.5) * 1.6;
      const speed = 70 + Math.random() * 110;
      this.emit({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1.5 + Math.random() * 2,
        life: 0.2 + Math.random() * 0.2,
        color: color,
        decay: 0.9
      });
    }
  }

  emitDebris(x, y, count = 12, color = '#888899', maxSpeed = 120) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 20 + Math.random() * maxSpeed;
      this.emit({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3.5,
        life: 0.4 + Math.random() * 0.6,
        color: color,
        decay: 0.96
      });
    }
  }

  emitExplosion(x, y, isLarge = false) {
    const count = isLarge ? 55 : 28;
    const colors = ['#ffffff', '#ffdd44', '#ff6600', '#cc1100', '#555555'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (isLarge ? 60 : 30) + Math.random() * (isLarge ? 260 : 160);
      const color = colors[Math.floor(Math.random() * colors.length)];
      this.emit({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: (isLarge ? 3 : 2) + Math.random() * (isLarge ? 5 : 3),
        life: 0.3 + Math.random() * 0.5,
        color: color,
        decay: 0.95
      });
    }
    // Shockwave ring
    this.emit({
      x,
      y,
      vx: 0,
      vy: 0,
      size: 2,
      life: isLarge ? 0.5 : 0.35,
      color: '#00e5ff',
      isRing: true,
      ringRadius: isLarge ? 80 : 45
    });
  }

  emitShieldRipple(x, y, radius = 24) {
    this.emit({
      x,
      y,
      vx: 0,
      vy: 0,
      size: 2,
      life: 0.3,
      color: '#00e5ff',
      isRing: true,
      ringRadius: radius * 1.4
    });
  }

  addFloatingText(text, x, y, color = '#00ffaa', fontSize = 14) {
    this.floatingTexts.push({
      text,
      x,
      y,
      vy: -35,
      alpha: 1,
      life: 0,
      maxLife: 1.1,
      color,
      fontSize
    });
  }

  update(dt) {
    // Update active particles
    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particles[i];
      if (!p.active) continue;

      p.life += dt;
      if (p.life >= p.maxLife) {
        p.active = false;
        continue;
      }

      p.pos.x += p.vel.x * dt;
      p.pos.y += p.vel.y * dt;
      p.vel.x *= p.decay;
      p.vel.y *= p.decay;

      const progress = p.life / p.maxLife;
      p.alpha = 1 - progress;

      if (p.isRing) {
        p.currentRingRadius = p.ringRadius * (0.2 + progress * 0.8);
      }
    }

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.life += dt;
      if (t.life >= t.maxLife) {
        this.floatingTexts.splice(i, 1);
        continue;
      }
      t.y += t.vy * dt;
      t.alpha = 1 - Math.pow(t.life / t.maxLife, 2);
    }
  }

  render(ctx) {
    // Render particles
    ctx.save();
    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particles[i];
      if (!p.active) continue;

      ctx.globalAlpha = p.alpha;
      if (p.isRing) {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.pos.x, p.pos.y, p.currentRingRadius || 10, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.pos.x, p.pos.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    // Render floating texts
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 13px "Courier New", monospace';
    for (let i = 0; i < this.floatingTexts.length; i++) {
      const t = this.floatingTexts[i];
      ctx.globalAlpha = t.alpha;
      ctx.fillStyle = t.color;
      ctx.shadowColor = t.color;
      ctx.shadowBlur = 6;
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.restore();
  }
}

/* --- js/world/Starfield.js --- */
/**
 * Starfield - JWST Deep-Space Cosmic Nebula & Photorealistic Stellar Field
 * Features Quad-Mirrored Seamless Tiling of User's Nebula Photograph with
 * Moody Deep-Space Atmospheric Darkening and Cinematic Cockpit Vignette.
 * Authored by: agency-technical-artist, agency-visual-storyteller & agency-senior-developer
 */
class Starfield {
  constructor(sectorSize = 8000) {
    this.sectorSize = sectorSize;
    this.halfSize = sectorSize * 0.5;

    // Generate immediate procedural fallback with matching deep copper/amber/emerald palette
    this.galaxyCanvas = this._generateProceduralNebula();

    // Load user's authentic JWST nebula photograph
    this._initNebulaImage();

    // Subtle foreground parallax star layers (pinpoint crisp stars, not glaring)
    this.foregroundLayers = [
      this._generateLayer(90, 0.08, 1.2, ['#ffffff', '#ffd085', '#70e0ff', '#ffaa66', '#aaffdd'], 0.7), // Midground
      this._generateLayer(40, 0.22, 1.8, ['#ffffff', '#fff0d0', '#90e8ff', '#ffcc88'], 0.85)             // Near field
    ];

    // Floating stellar dust motes drifting across the viewport
    this.dustMotes = [];
    for (let i = 0; i < 60; i++) {
      this.dustMotes.push({
        x: (Math.random() - 0.5) * 2400,
        y: (Math.random() - 0.5) * 1600,
        size: 0.7 + Math.random() * 1.3,
        alpha: 0.12 + Math.random() * 0.35,
        color: Math.random() > 0.4 ? '#ffd499' : '#a8eeff',
        speedX: (Math.random() - 0.5) * 3,
        speedY: (Math.random() - 0.5) * 3
      });
    }
  }

  _initNebulaImage() {
    const imgEl = typeof document !== 'undefined' ? document.getElementById('nebula-bg-asset') : null;
    if (imgEl && imgEl.complete && imgEl.naturalWidth > 0) {
      this._buildFromImage(imgEl);
      return;
    }

    if (typeof Image !== 'undefined') {
      const img = new Image();
      img.onload = () => this._buildFromImage(img);
      img.src = 'nebula.jpg';

      if (imgEl && !imgEl.complete) {
        imgEl.addEventListener('load', () => this._buildFromImage(imgEl));
      }
    }
  }

  _buildFromImage(img) {
    try {
      const w = img.naturalWidth || 1024;
      const h = img.naturalHeight || 614;

      // Create a 2x2 mirrored quad canvas for 100% mathematically seamless infinite tiling
      const canvas = document.createElement('canvas');
      canvas.width = w * 2;
      canvas.height = h * 2;
      const ctx = canvas.getContext('2d');

      // 1. Deep space void base
      ctx.fillStyle = '#020104';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Draw mirrored tiles
      // Tile 1: Top-Left (Original)
      ctx.drawImage(img, 0, 0, w, h);

      // Tile 2: Top-Right (Horizontal Flip)
      ctx.save();
      ctx.translate(w * 2, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0, w, h);
      ctx.restore();

      // Tile 3: Bottom-Left (Vertical Flip)
      ctx.save();
      ctx.translate(0, h * 2);
      ctx.scale(1, -1);
      ctx.drawImage(img, 0, 0, w, h);
      ctx.restore();

      // Tile 4: Bottom-Right (Both Flipped)
      ctx.save();
      ctx.translate(w * 2, h * 2);
      ctx.scale(-1, -1);
      ctx.drawImage(img, 0, 0, w, h);
      ctx.restore();

      // 3. Deep-Space Atmosphere Filter: Tones down the blinding brightness
      // while retaining all the rich copper, amber, and teal cosmic dust filaments
      ctx.fillStyle = 'rgba(2, 3, 6, 0.46)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 4. Overlay subtle JWST 6-point diffraction stars
      this._renderJWSTStars(ctx, canvas.width, canvas.height);

      this.galaxyCanvas = canvas;
    } catch (e) {
      console.warn('Nebula canvas generation deferred to procedural fallback', e);
    }
  }

  _renderJWSTStars(ctx, w, h) {
    ctx.save();

    // Refined subtle hero stars
    const starCount = 32;
    for (let i = 0; i < starCount; i++) {
      const x = 50 + ((i * 137.5 + 43) % (w - 100));
      const y = 40 + ((i * 97.3 + 19) % (h - 80));
      const size = 1.3 + ((i * 3.7) % 2.0);
      const isHeroStar = (i % 6 === 0);
      const spikeLength = isHeroStar ? 38 + (i % 20) : 18 + (i % 14);

      const colorSeed = i % 4;
      const starColor = colorSeed === 0 ? '#ffffff' : (colorSeed === 1 ? '#ffe8b5' : (colorSeed === 2 ? '#b8edff' : '#ffc080'));

      // Soft halo bloom
      const haloGrad = ctx.createRadialGradient(x, y, 0, x, y, size * 4.5);
      haloGrad.addColorStop(0, 'rgba(255, 240, 210, 0.45)');
      haloGrad.addColorStop(0.35, 'rgba(255, 180, 100, 0.16)');
      haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = haloGrad;
      ctx.beginPath();
      ctx.arc(x, y, size * 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Diamond stellar core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();

      // JWST Hexagonal 6-Point Spikes
      ctx.strokeStyle = starColor;
      ctx.lineWidth = 0.8;
      ctx.globalAlpha = isHeroStar ? 0.55 : 0.32;

      for (let s = 0; s < 3; s++) {
        const rad = (s * Math.PI) / 3;
        const dx = Math.cos(rad) * spikeLength;
        const dy = Math.sin(rad) * spikeLength;
        ctx.beginPath();
        ctx.moveTo(x - dx, y - dy);
        ctx.lineTo(x + dx, y + dy);
        ctx.stroke();
      }

      if (isHeroStar) {
        ctx.lineWidth = 0.5;
        ctx.globalAlpha = 0.25;
        const dx = spikeLength * 0.6;
        ctx.beginPath();
        ctx.moveTo(x - dx, y); ctx.lineTo(x + dx, y);
        ctx.moveTo(x, y - dx); ctx.lineTo(x, y + dx);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  _generateProceduralNebula() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1228;
    const ctx = canvas.getContext('2d');
    const cx = canvas.width * 0.5;
    const cy = canvas.height * 0.5;

    // Deep cosmic space void matching dark JWST backdrop
    ctx.fillStyle = '#020104';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Warm copper / burnt orange dust clouds
    const copperPlumes = [
      { x: cx - 250, y: cy - 80, r: 520, c: 'rgba(175, 75, 32, 0.28)' },
      { x: cx + 300, y: cy + 120, r: 600, c: 'rgba(145, 55, 20, 0.24)' },
      { x: cx - 100, y: cy + 240, r: 480, c: 'rgba(195, 95, 38, 0.26)' }
    ];
    for (const p of copperPlumes) {
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      g.addColorStop(0, p.c);
      g.addColorStop(0.5, 'rgba(110, 35, 14, 0.15)');
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Dusky emerald / teal filaments
    const tealPlumes = [
      { x: cx + 200, y: cy - 220, r: 480, c: 'rgba(28, 65, 52, 0.22)' },
      { x: cx - 350, y: cy - 180, r: 420, c: 'rgba(20, 55, 45, 0.18)' }
    ];
    for (const p of tealPlumes) {
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      g.addColorStop(0, p.c);
      g.addColorStop(0.6, 'rgba(12, 38, 30, 0.10)');
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    this._renderJWSTStars(ctx, canvas.width, canvas.height);
    return canvas;
  }

  _generateLayer(count, parallax, baseSize, colorPalette, baseAlpha) {
    const stars = [];
    for (let i = 0; i < count; i++) {
      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      stars.push({
        x: (Math.random() - 0.5) * 3600,
        y: (Math.random() - 0.5) * 2400,
        size: baseSize * (0.65 + Math.random() * 0.75),
        color: color,
        alpha: baseAlpha * (0.5 + Math.random() * 0.5),
        twinkleSpeed: 0.8 + Math.random() * 2.2,
        twinklePhase: Math.random() * Math.PI * 2
      });
    }
    return { stars, parallax };
  }

  render(ctx, camera, time = 0) {
    ctx.save();

    // 1. Render Deep Space Cosmic Nebula in Screen Space with Parallax
    if (this.galaxyCanvas) {
      ctx.save();
      // Reset transform to pure screen pixel coordinates
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      const sw = ctx.canvas.width;
      const sh = ctx.canvas.height;
      const gw = this.galaxyCanvas.width;
      const gh = this.galaxyCanvas.height;
      const parallax = 0.04; // Smooth cinematic deep-space parallax

      // Deep space background fill
      ctx.fillStyle = '#020204';
      ctx.fillRect(0, 0, sw, sh);

      const scx = sw * 0.5;
      const scy = sh * 0.5;

      const shiftX = (-camera.pos.x * parallax + camera.shakeOffset.x);
      const shiftY = (-camera.pos.y * parallax + camera.shakeOffset.y);

      const startX = ((scx - gw * 0.5 + shiftX) % gw + gw) % gw - gw;
      const startY = ((scy - gh * 0.5 + shiftY) % gh + gh) % gh - gh;

      // Draw seamless nebula with rich atmospheric luminosity
      ctx.globalAlpha = 0.82;
      for (let x = startX; x < sw; x += gw) {
        for (let y = startY; y < sh; y += gh) {
          ctx.drawImage(this.galaxyCanvas, x, y);
        }
      }
      ctx.globalAlpha = 1.0;

      // 2. Cinematic Cockpit Vignette: Darkens screen edges for true deep-space immersion
      const vignette = ctx.createRadialGradient(scx, scy, Math.min(sw, sh) * 0.38, scx, scy, Math.max(sw, sh) * 0.82);
      vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignette.addColorStop(0.55, 'rgba(2, 4, 8, 0.40)');
      vignette.addColorStop(1, 'rgba(1, 2, 4, 0.85)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, sw, sh);

      ctx.restore();
    }

    // 3. Render Foreground Parallax Stars
    for (const layer of this.foregroundLayers) {
      for (const s of layer.stars) {
        const px = s.x - camera.pos.x * layer.parallax;
        const py = s.y - camera.pos.y * layer.parallax;

        const range = 2400;
        const halfR = range * 0.5;
        const relX = ((px - camera.pos.x + halfR) % range + range) % range - halfR + camera.pos.x;
        const relY = ((py - camera.pos.y + halfR) % range + range) % range - halfR + camera.pos.y;

        if (!camera.isVisible(relX, relY, 10)) continue;

        const twinkle = Math.sin(time * s.twinkleSpeed + s.twinklePhase) * 0.25;
        ctx.globalAlpha = Math.max(0.15, Math.min(1.0, s.alpha + twinkle));
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(relX, relY, s.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 4. Render Drifting Stellar Dust Motes
    for (const mote of this.dustMotes) {
      mote.x += mote.speedX * 0.016;
      mote.y += mote.speedY * 0.016;

      const px = mote.x - camera.pos.x * 0.55;
      const py = mote.y - camera.pos.y * 0.55;

      const rangeX = 2200;
      const rangeY = 1500;
      const relX = ((px - camera.pos.x + rangeX * 0.5) % rangeX + rangeX) % rangeX - rangeX * 0.5 + camera.pos.x;
      const relY = ((py - camera.pos.y + rangeY * 0.5) % rangeY + rangeY) % rangeY - rangeY * 0.5 + camera.pos.y;

      if (camera.isVisible(relX, relY, 5)) {
        ctx.globalAlpha = mote.alpha;
        ctx.fillStyle = mote.color;
        ctx.beginPath();
        ctx.arc(relX, relY, mote.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 5. Render Sector Boundaries
    ctx.globalAlpha = 0.40;
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2.0;
    ctx.setLineDash([20, 15]);
    ctx.strokeRect(-this.halfSize, -this.halfSize, this.sectorSize, this.sectorSize);
    ctx.setLineDash([]);

    // Corner beacon warnings
    const corners = [
      { x: -this.halfSize, y: -this.halfSize, label: 'NW BEACON' },
      { x: this.halfSize, y: -this.halfSize, label: 'NE BEACON' },
      { x: this.halfSize, y: this.halfSize, label: 'SE BEACON' },
      { x: -this.halfSize, y: this.halfSize, label: 'SW BEACON' }
    ];

    ctx.fillStyle = '#ffaa44';
    ctx.font = 'bold 11px "Courier New", monospace';
    for (const c of corners) {
      if (camera.isVisible(c.x, c.y, 100)) {
        ctx.beginPath();
        ctx.arc(c.x, c.y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText(c.label, c.x + 14, c.y + 4);
      }
    }

    ctx.restore();
  }
}

/* --- js/economy/Economy.js --- */
/**
 * Economy - Commodities, Market, Cargo Inventory and Subsystem Upgrade trees
 * Authored by: agency-economy-designer
 */
const COMMODITIES = {
  ferrite: {
    id: 'ferrite',
    name: 'Ferrite Ore',
    color: '#ff8844',
    glowColor: '#ff5500',
    basePrice: 15,
    tier: 1,
    weight: 1,
    desc: 'Common structural ferrous metal. Backbone of stellar construction.'
  },
  silicon: {
    id: 'silicon',
    name: 'Silicon Crystal',
    color: '#00f0ff',
    glowColor: '#00c0ff',
    basePrice: 35,
    tier: 2,
    weight: 1,
    desc: 'High-purity semiconductor crystal required for avionics and shields.'
  },
  titanium: {
    id: 'titanium',
    name: 'Titanium Alloy',
    color: '#ffd040',
    glowColor: '#ffaa00',
    basePrice: 90,
    tier: 3,
    weight: 1,
    desc: 'Dense, heat-resistant alloy used in combat armor and engine nozzles.'
  },
  platinum: {
    id: 'platinum',
    name: 'Platinum Core',
    color: '#33ffcc',
    glowColor: '#00dd99',
    basePrice: 260,
    tier: 4,
    weight: 1,
    desc: 'Superconducting precious metal essential for high-yield laser emitters.'
  },
  quantum: {
    id: 'quantum',
    name: 'Quantum Shard',
    color: '#ff33aa',
    glowColor: '#ff0077',
    basePrice: 750,
    tier: 5,
    weight: 1,
    desc: 'Exotic matter exhibiting micro-wormhole fluctuation. Highly valuable.'
  }
};

const UPGRADE_TREES = {
  thruster: {
    name: 'Ion Thrusters',
    maxTier: 5,
    costs: [0, 220, 550, 1400, 3200],
    stats: [
      { thrust: 220, turnSpeed: 2.8, boostMult: 1.8, maxSpeed: 420 },
      { thrust: 280, turnSpeed: 3.2, boostMult: 1.9, maxSpeed: 500 },
      { thrust: 350, turnSpeed: 3.6, boostMult: 2.0, maxSpeed: 580 },
      { thrust: 440, turnSpeed: 4.0, boostMult: 2.1, maxSpeed: 680 },
      { thrust: 550, turnSpeed: 4.5, boostMult: 2.3, maxSpeed: 800 }
    ],
    desc: 'Improves engine acceleration, rotational response, and afterburner output.'
  },
  shields: {
    name: 'Deflector Shields',
    maxTier: 5,
    costs: [0, 250, 650, 1600, 3600],
    stats: [
      { maxShield: 50, rechargeRate: 8, rechargeDelay: 3.5 },
      { maxShield: 80, rechargeRate: 12, rechargeDelay: 3.0 },
      { maxShield: 125, rechargeRate: 18, rechargeDelay: 2.6 },
      { maxShield: 180, rechargeRate: 25, rechargeDelay: 2.2 },
      { maxShield: 260, rechargeRate: 35, rechargeDelay: 1.8 }
    ],
    desc: 'Increases kinetic shield energy capacity and reduces recharge delay.'
  },
  hull: {
    name: 'Reinforced Hull',
    maxTier: 5,
    costs: [0, 200, 500, 1200, 2800],
    stats: [
      { maxHull: 100, armor: 0.1 },
      { maxHull: 150, armor: 0.2 },
      { maxHull: 220, armor: 0.3 },
      { maxHull: 310, armor: 0.4 },
      { maxHull: 420, armor: 0.5 }
    ],
    desc: 'Hardened composite plating to withstand high-velocity collisions and plasma fire.'
  },
  laser: {
    name: 'Mining Laser',
    maxTier: 5,
    costs: [0, 260, 620, 1500, 3400],
    stats: [
      { dps: 35, range: 240, heatPerSec: 22 },
      { dps: 55, range: 280, heatPerSec: 20 },
      { dps: 85, range: 330, heatPerSec: 18 },
      { dps: 125, range: 390, heatPerSec: 16 },
      { dps: 180, range: 460, heatPerSec: 14 }
    ],
    desc: 'Thermal cutting beam for fracturing mineral-bearing asteroids.'
  },
  tractor: {
    name: 'Tractor Beam',
    maxTier: 5,
    costs: [0, 180, 460, 1100, 2600],
    stats: [
      { range: 200, pullForce: 300 },
      { range: 270, pullForce: 420 },
      { range: 350, pullForce: 580 },
      { range: 440, pullForce: 760 },
      { range: 550, pullForce: 1000 }
    ],
    desc: 'Gravity tether projector to pull floating ore shards safely into the cargo hold.'
  },
  cargo: {
    name: 'Cargo Bay',
    maxTier: 5,
    costs: [0, 160, 420, 1000, 2400],
    stats: [
      { capacity: 15 },
      { capacity: 30 },
      { capacity: 60 },
      { capacity: 120 },
      { capacity: 250 }
    ],
    desc: 'Modular pressurized storage hold for ore and salvage materials.'
  },
  weapons: {
    name: 'Plasma Cannons',
    maxTier: 5,
    costs: [0, 320, 780, 1800, 4200],
    stats: [
      { damage: 24, fireRate: 3.5, speed: 750, energyCost: 8 },
      { damage: 36, fireRate: 4.2, speed: 850, energyCost: 7 },
      { damage: 52, fireRate: 5.0, speed: 950, energyCost: 6 },
      { damage: 75, fireRate: 6.0, speed: 1100, energyCost: 5 },
      { damage: 110, fireRate: 7.2, speed: 1300, energyCost: 4 }
    ],
    desc: 'Twin plasma bolt projectors for repelling pirate raiders.'
  }
};

class Economy {
  constructor() {
    this.credits = 120;
    this.inventory = {
      ferrite: 0,
      silicon: 0,
      titanium: 0,
      platinum: 0,
      quantum: 0
    };

    // Installed tier indices (0 = Tier 1, 4 = Tier 5)
    this.tiers = {
      thruster: 0,
      shields: 0,
      hull: 0,
      laser: 0,
      tractor: 0,
      cargo: 0,
      weapons: 0
    };
  }

  getUpgradeStats(systemKey) {
    const tree = UPGRADE_TREES[systemKey];
    if (!tree) return null;
    const tier = this.tiers[systemKey];
    return tree.stats[tier];
  }

  getNextUpgradeCost(systemKey) {
    const tree = UPGRADE_TREES[systemKey];
    const currentTier = this.tiers[systemKey];
    if (currentTier >= tree.maxTier - 1) return null; // Already maxed
    return tree.costs[currentTier + 1];
  }

  buyUpgrade(systemKey) {
    const cost = this.getNextUpgradeCost(systemKey);
    if (cost === null || this.credits < cost) return false;

    this.credits -= cost;
    this.tiers[systemKey]++;
    return true;
  }

  getTotalCargoWeight() {
    let total = 0;
    for (const key in this.inventory) {
      const comm = COMMODITIES[key];
      if (comm) {
        total += this.inventory[key] * comm.weight;
      }
    }
    return total;
  }

  getMaxCargo() {
    return this.getUpgradeStats('cargo').capacity;
  }

  canAcceptOre(commodityKey, amount = 1) {
    const comm = COMMODITIES[commodityKey];
    if (!comm) return 0;
    const available = this.getMaxCargo() - this.getTotalCargoWeight();
    const canFit = Math.floor(available / comm.weight);
    return Math.max(0, Math.min(amount, canFit));
  }

  addOre(commodityKey, amount = 1) {
    const accepted = this.canAcceptOre(commodityKey, amount);
    if (accepted > 0) {
      this.inventory[commodityKey] = (this.inventory[commodityKey] || 0) + accepted;
    }
    return accepted;
  }

  sellOre(commodityKey, amount) {
    const stored = this.inventory[commodityKey] || 0;
    const toSell = Math.min(stored, amount);
    if (toSell <= 0) return 0;

    const price = COMMODITIES[commodityKey].basePrice;
    const revenue = toSell * price;

    this.inventory[commodityKey] -= toSell;
    this.credits += revenue;
    return revenue;
  }

  sellAll() {
    let totalRevenue = 0;
    for (const key in this.inventory) {
      if (this.inventory[key] > 0) {
        totalRevenue += this.sellOre(key, this.inventory[key]);
      }
    }
    return totalRevenue;
  }
}

/* --- js/economy/Missions.js --- */
/**
 * MissionManager - Dynamic Station Contracts & Bounties System
 * Authored by: agency-economy-designer & agency-narrative-designer
 */
class MissionManager {
  constructor() {
    this.availableMissions = [];
    this.activeMission = null;
    this.completedCount = 0;

    this.refreshAvailableMissions();
  }

  refreshAvailableMissions() {
    this.availableMissions = [
      {
        id: 'ore_silicon',
        title: 'SILICON CRYSTAL QUOTA',
        desc: 'Aegis avionics bay urgently requires semiconductor grade crystals.',
        type: 'delivery',
        commodity: 'silicon',
        targetAmount: 6,
        currentAmount: 0,
        rewardCredits: 450,
        timeLimit: 240, // 4 mins
        timeRemaining: 240
      },
      {
        id: 'bounty_pirates',
        title: 'OUTER RIM PATROL BOUNTY',
        desc: 'Marauder scouts have harassed transport freighters. Terminate hostiles.',
        type: 'bounty',
        targetAmount: 2,
        currentAmount: 0,
        rewardCredits: 850,
        timeLimit: 360,
        timeRemaining: 360
      },
      {
        id: 'salvage_derelict',
        title: 'LOST EXPLORER BLACK BOX',
        desc: 'Locate a silent derelict vessel adrift in the asteroid belt and recover its telemetry unit.',
        type: 'salvage',
        targetAmount: 1,
        currentAmount: 0,
        rewardCredits: 1200,
        timeLimit: 400,
        timeRemaining: 400
      },
      {
        id: 'ore_titanium',
        title: 'HEAVY ARMOR ALLOY RUSH',
        desc: 'Refit drydock needs high-tensile titanium alloys for hull reinforcements.',
        type: 'delivery',
        commodity: 'titanium',
        targetAmount: 4,
        currentAmount: 0,
        rewardCredits: 750,
        timeLimit: 240,
        timeRemaining: 240
      }
    ];
  }

  acceptMission(missionId) {
    const mission = this.availableMissions.find(m => m.id === missionId);
    if (!mission) return false;

    this.activeMission = { ...mission };
    return true;
  }

  abandonMission() {
    this.activeMission = null;
  }

  update(dt, economy, particleSystem, soundEngine, playerPos) {
    if (!this.activeMission) return;

    if (this.activeMission.timeRemaining > 0) {
      this.activeMission.timeRemaining -= dt;
      if (this.activeMission.timeRemaining <= 0) {
        // Mission expired
        particleSystem.addFloatingText('CONTRACT EXPIRED // MISSION FAILED', playerPos.x, playerPos.y - 30, '#ff3344', 16);
        this.activeMission = null;
        return;
      }
    }

    // Check delivery missions progress against inventory
    if (this.activeMission.type === 'delivery') {
      const stored = economy.inventory[this.activeMission.commodity] || 0;
      this.activeMission.currentAmount = Math.min(stored, this.activeMission.targetAmount);
    }
  }

  onPirateDestroyed(particleSystem, playerPos) {
    if (!this.activeMission || this.activeMission.type !== 'bounty') return;
    this.activeMission.currentAmount++;
    particleSystem.addFloatingText(
      `BOUNTY PROGRESS: ${this.activeMission.currentAmount}/${this.activeMission.targetAmount}`,
      playerPos.x,
      playerPos.y - 25,
      '#ffcc00',
      14
    );
  }

  onDerelictSalvaged(particleSystem, playerPos) {
    if (!this.activeMission || this.activeMission.type !== 'salvage') return;
    this.activeMission.currentAmount++;
    particleSystem.addFloatingText('BLACK BOX RECOVERED // RETURN TO STATION', playerPos.x, playerPos.y - 25, '#00ffff', 14);
  }

  isReadyToClaim(economy) {
    if (!this.activeMission) return false;
    if (this.activeMission.type === 'delivery') {
      const stored = economy.inventory[this.activeMission.commodity] || 0;
      return stored >= this.activeMission.targetAmount;
    }
    return this.activeMission.currentAmount >= this.activeMission.targetAmount;
  }

  claimReward(economy, soundEngine, particleSystem) {
    if (!this.isReadyToClaim(economy)) return 0;

    const reward = this.activeMission.rewardCredits;
    // Deduct commodity if delivery
    if (this.activeMission.type === 'delivery') {
      economy.inventory[this.activeMission.commodity] -= this.activeMission.targetAmount;
    }

    economy.credits += reward;
    this.completedCount++;
    soundEngine.playPickup(5);
    this.activeMission = null;
    this.refreshAvailableMissions();
    return reward;
  }
}

/* --- js/entities/Station.js --- */
/**
 * Station - Massive orbital starbase with docking bays, market terminal, and safety zone
 * Authored by: agency-game-designer & agency-ui-designer
 */
class Station {
  constructor(x = 0, y = 0) {
    this.pos = new Vector2D(x, y);
    this.radius = 160;
    this.dockingRadius = 140;
    this.maxDockingSpeed = 75; // Player must approach below 75 m/s to dock safely
    this.angle = 0;
    this.rotSpeed = 0.08;

    this.name = 'AEGIS STARBASE 01';
    this.faction = 'Stellar Mining Guild';

    // Docking beacon strobe
    this.beaconTimer = 0;
    this.beaconState = false;
  }

  update(dt) {
    this.angle += this.rotSpeed * dt;
    this.beaconTimer += dt;
    if (this.beaconTimer >= 0.5) {
      this.beaconTimer = 0;
      this.beaconState = !this.beaconState;
    }
  }

  canPlayerDock(ship) {
    const dist = this.pos.dist(ship.pos);
    const speed = ship.vel.mag();
    const inRange = dist < this.dockingRadius;
    const safeSpeed = speed <= this.maxDockingSpeed;
    return {
      canDock: inRange && safeSpeed,
      inRange,
      safeSpeed,
      speed,
      dist
    };
  }

  render(ctx, camera) {
    if (!camera.isVisible(this.pos.x, this.pos.y, this.radius * 2.2)) return;

    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);

    // 1. Safety Perimeter / Docking Zone Ring
    ctx.strokeStyle = this.beaconState ? 'rgba(0, 240, 255, 0.65)' : 'rgba(0, 240, 255, 0.28)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([12, 10]);
    ctx.beginPath();
    ctx.arc(0, 0, this.dockingRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Rotating Outer Ring & Solar Spindles
    ctx.save();
    ctx.rotate(this.angle);

    const ringRadius = this.radius * 0.72;

    // Outer Habitat Ring (Upper Arc: Electric Ice Cyan, Lower Arc: Radiant Solar Copper)
    // Upper arc (PI to 2*PI across top)
    ctx.strokeStyle = '#00f5ff';
    ctx.lineWidth = 4.5;
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(0, 0, ringRadius, Math.PI, 0);
    ctx.stroke();

    // Lower arc (0 to PI across bottom)
    ctx.strokeStyle = '#ff8833';
    ctx.shadowColor = '#ff6600';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(0, 0, ringRadius, 0, Math.PI);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 4 Structural Cross Spokes at 45 degree diagonals
    ctx.strokeStyle = '#355577';
    ctx.lineWidth = 3.5;
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI * 0.25;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * (ringRadius + 32), Math.sin(a) * (ringRadius + 32));
      ctx.stroke();
    }

    // 4 Rectangular Solar Panel Modules on 45-degree struts
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI * 0.25;
      ctx.save();
      ctx.rotate(a);
      ctx.translate(ringRadius - 10, 0);

      // Solar cell body - solid dark obsidian navy for strong silhouette
      ctx.fillStyle = '#060d18';
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 8;
      ctx.fillRect(-12, -18, 48, 36);
      ctx.strokeRect(-12, -18, 48, 36);

      // Cell division grid
      ctx.strokeStyle = '#1e3e60';
      ctx.lineWidth = 1.2;
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.moveTo(12, -18); ctx.lineTo(12, 18);
      ctx.moveTo(-12, 0); ctx.lineTo(36, 0);
      ctx.stroke();

      ctx.restore();
    }

    ctx.restore();

    // 3. Central Command Hub Core
    ctx.save();
    ctx.rotate(-this.angle * 0.5);

    // Hexagonal Core Chassis
    ctx.fillStyle = '#060a12';
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 3.5;
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const x = Math.cos(a) * 44;
      const y = Math.sin(a) * 44;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Radiant Central Solar Hub Gateway
    ctx.fillStyle = '#ffaa33';
    ctx.shadowColor = '#ff7700';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // 4. Station Labels & Comms Beacon (High-contrast glassmorphic badge)
    ctx.textAlign = 'center';
    ctx.save();
    ctx.fillStyle = 'rgba(6, 10, 16, 0.82)';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(-100, -this.radius * 0.95 - 14, 200, 32, 6);
    } else {
      ctx.rect(-100, -this.radius * 0.95 - 14, 200, 32);
    }
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffbb33';
    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.shadowColor = '#ff8800';
    ctx.shadowBlur = 8;
    ctx.fillText(this.name, 0, -this.radius * 0.95);

    ctx.fillStyle = '#00f0ff';
    ctx.font = '10px "Courier New", monospace';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 6;
    ctx.fillText('[DOCKING TERMINAL ACTIVE]', 0, -this.radius * 0.95 + 13);
    ctx.restore();

    ctx.restore();
  }
}

/* --- js/entities/Mineral.js --- */
/**
 * Mineral - Harvestable ore crystal drifting in the void
 * Authored by: agency-game-designer & agency-technical-artist
 */
class Mineral {
  constructor(x, y, commodityKey = 'ferrite', value = 1) {
    this.pos = new Vector2D(x, y);
    this.vel = new Vector2D((Math.random() - 0.5) * 60, (Math.random() - 0.5) * 60);
    this.commodityKey = commodityKey;
    this.commodity = COMMODITIES[commodityKey] || COMMODITIES.ferrite;
    this.value = value;
    this.radius = 7;
    this.angle = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 3;
    this.life = 0;
    this.maxLife = 90; // Stays alive for 90 seconds
    this.isDead = false;

    // Procedural crystalline vertices
    this.points = [
      { x: -5, y: -2 },
      { x: 0, y: -7 },
      { x: 6, y: -3 },
      { x: 5, y: 5 },
      { x: -2, y: 7 },
      { x: -6, y: 3 }
    ];
  }

  update(dt, playerShip) {
    this.life += dt;
    if (this.life >= this.maxLife) {
      this.isDead = true;
      return;
    }

    // Space drift friction
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;
    this.vel.mult(0.992);
    this.angle += this.rotSpeed * dt;

    // Tractor beam attraction logic
    if (playerShip && playerShip.isTractorActive) {
      const d = this.pos.dist(playerShip.pos);
      const tractorRange = playerShip.tractorStats.range;
      if (d < tractorRange && d > 5) {
        const pullDir = Vector2D.sub(playerShip.pos, this.pos).normalize();
        const pullForce = playerShip.tractorStats.pullForce * (1 - d / tractorRange) + 120;
        this.vel.add(pullDir.mult(pullForce * dt));
      }
    }
  }

  render(ctx, camera) {
    if (!camera.isVisible(this.pos.x, this.pos.y, 25)) return;

    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    ctx.rotate(this.angle);

    // Glowing halo
    ctx.shadowColor = this.commodity.glowColor;
    ctx.shadowBlur = 8;
    ctx.fillStyle = this.commodity.color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;

    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}

/* --- js/entities/Asteroid.js --- */
/**
 * Asteroid - Procedural destructible celestial body with mineral veins
 * Authored by: agency-game-designer & agency-technical-artist
 */
class Asteroid {
  constructor(x, y, radius = 50, commodityKey = 'ferrite', stage = 3) {
    this.pos = new Vector2D(x, y);
    this.vel = new Vector2D((Math.random() - 0.5) * 35, (Math.random() - 0.5) * 35);
    this.radius = radius;
    this.commodityKey = commodityKey;
    this.commodity = COMMODITIES[commodityKey] || COMMODITIES.ferrite;
    this.stage = stage; // 3 = Large, 2 = Medium, 1 = Small

    this.angle = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 0.8;

    this.maxHealth = Math.pow(radius, 1.2) * 2.2;
    this.health = this.maxHealth;
    this.mass = Math.PI * radius * radius * 0.1;
    this.isDead = false;

    // Deep-Scanner & Fault Line weak point mechanics
    this.scannedTimer = 0; // Set > 0 when scanned by sonar pulse
    this.faultLineAngle = Math.random() * Math.PI * 2;
    this.faultLineArc = 0.45; // ~26 degrees tolerance
    this.lastHitWasCrit = false;

    // Generate irregular polygon vertices
    this.vertices = [];
    const numPoints = 10 + Math.floor(Math.random() * 6);
    for (let i = 0; i < numPoints; i++) {
      const a = (i / numPoints) * Math.PI * 2;
      const r = radius * (0.8 + Math.random() * 0.4);
      this.vertices.push({
        x: Math.cos(a) * r,
        y: Math.sin(a) * r
      });
    }

    // Interior craters
    this.craters = [];
    const numCraters = Math.floor(radius / 14);
    for (let i = 0; i < numCraters; i++) {
      const dist = Math.random() * (radius * 0.55);
      const angle = Math.random() * Math.PI * 2;
      this.craters.push({
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        r: 3 + Math.random() * (radius * 0.18)
      });
    }
  }

  checkWeakPointHit(worldHitPoint) {
    // Calculate angle from asteroid center to hit point in local coordinates
    const dx = worldHitPoint.x - this.pos.x;
    const dy = worldHitPoint.y - this.pos.y;
    let localHitAngle = Math.atan2(dy, dx) - this.angle;
    
    // Normalize to -PI to PI
    while (localHitAngle > Math.PI) localHitAngle -= Math.PI * 2;
    while (localHitAngle < -Math.PI) localHitAngle += Math.PI * 2;

    let targetAngle = this.faultLineAngle;
    while (targetAngle > Math.PI) targetAngle -= Math.PI * 2;
    while (targetAngle < -Math.PI) targetAngle += Math.PI * 2;

    let diff = Math.abs(localHitAngle - targetAngle);
    if (diff > Math.PI) diff = Math.PI * 2 - diff;

    return diff <= this.faultLineArc;
  }

  takeDamage(amount, isCrit = false) {
    this.lastHitWasCrit = isCrit;
    this.health -= amount;
    if (this.health <= 0) {
      this.isDead = true;
    }
  }

  update(dt) {
    if (this.scannedTimer > 0) {
      this.scannedTimer -= dt;
    }
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;
    this.angle += this.rotSpeed * dt;
  }

  fracture(particleSystem, soundEngine) {
    const isCrit = this.lastHitWasCrit;
    if (isCrit) {
      soundEngine.playCriticalHit();
      soundEngine.playExplosion(true);
      particleSystem.emitDebris(this.pos.x, this.pos.y, this.stage * 24, '#ffdd44', 220);
      particleSystem.addFloatingText('CRITICAL FRACTURE! 3X YIELD', this.pos.x, this.pos.y - 25, '#ffd700', 16);
    } else {
      soundEngine.playExplosion(this.stage === 3);
      particleSystem.emitDebris(this.pos.x, this.pos.y, this.stage * 12, this.commodity.color, 160);
    }

    const children = [];
    if (this.stage > 1) {
      // Split into 2-3 smaller asteroids
      const count = (2 + Math.floor(Math.random() * 2)) + (isCrit ? 1 : 0);
      for (let i = 0; i < count; i++) {
        const nextRadius = this.radius * 0.55;
        const child = new Asteroid(
          this.pos.x + (Math.random() - 0.5) * 20,
          this.pos.y + (Math.random() - 0.5) * 20,
          nextRadius,
          this.commodityKey,
          this.stage - 1
        );
        const splitAngle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
        const splitSpeed = (45 + Math.random() * 45) * (isCrit ? 1.5 : 1.0);
        child.vel.set(this.vel.x + Math.cos(splitAngle) * splitSpeed, this.vel.y + Math.sin(splitAngle) * splitSpeed);
        children.push(child);
      }
      // If critical on large/medium rock, also drop bonus mineral cores immediately!
      if (isCrit) {
        children.push(new Mineral(this.pos.x, this.pos.y, this.commodityKey, 1));
      }
    } else {
      // Small asteroid directly drops mineral cores!
      const dropCount = (1 + Math.floor(Math.random() * 2)) * (isCrit ? 3 : 1);
      for (let i = 0; i < dropCount; i++) {
        children.push(new Mineral(
          this.pos.x + (Math.random() - 0.5) * 20,
          this.pos.y + (Math.random() - 0.5) * 20,
          this.commodityKey,
          1
        ));
      }
    }
    return children;
  }

  render(ctx, camera) {
    if (!camera.isVisible(this.pos.x, this.pos.y, this.radius * 1.5)) return;

    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    ctx.rotate(this.angle);

    // Asteroid Body - Solid dark obsidian basalt for maximum contrast against vibrant nebula
    ctx.fillStyle = '#080d15';
    ctx.strokeStyle = '#40b8ff';
    ctx.lineWidth = 2.0;
    ctx.shadowColor = '#00a0ff';
    ctx.shadowBlur = 8;

    ctx.beginPath();
    ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
    for (let i = 1; i < this.vertices.length; i++) {
      ctx.lineTo(this.vertices[i].x, this.vertices[i].y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Render Inset Craters
    ctx.fillStyle = '#04070c';
    ctx.strokeStyle = '#254465';
    ctx.lineWidth = 1.2;
    ctx.shadowBlur = 0;
    for (const c of this.craters) {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Mineral Vein Nodes (Luminous glowing ore crystals)
    ctx.fillStyle = this.commodity.color;
    ctx.shadowColor = this.commodity.glowColor || this.commodity.color;
    ctx.shadowBlur = 10;
    for (let i = 0; i < Math.min(3, this.stage + 1); i++) {
      const vx = this.vertices[i * 2].x * 0.55;
      const vy = this.vertices[i * 2].y * 0.55;
      ctx.beginPath();
      ctx.arc(vx, vy, 3.0 + this.stage * 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Heat damage crack glow when damaged
    if (this.health < this.maxHealth) {
      const damagePct = 1 - this.health / this.maxHealth;
      ctx.strokeStyle = `rgba(255, 120, 30, ${damagePct * 0.8})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(this.vertices[1].x * 0.8, this.vertices[1].y * 0.8);
      ctx.moveTo(0, 0);
      ctx.lineTo(this.vertices[3].x * 0.7, this.vertices[3].y * 0.7);
      ctx.stroke();
    }

    // Scanned Sonar Visuals & Fault Line Target
    if (this.scannedTimer > 0) {
      const alpha = Math.min(1, this.scannedTimer);

      // Sonar pulse halo around perimeter
      ctx.strokeStyle = `rgba(0, 229, 255, ${alpha * 0.6})`;
      ctx.lineWidth = 1.8;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Weak Point Fault Line Reticle
      const targetDist = this.radius * 0.95;
      const tx = Math.cos(this.faultLineAngle) * targetDist;
      const ty = Math.sin(this.faultLineAngle) * targetDist;

      ctx.save();
      ctx.translate(tx, ty);
      ctx.strokeStyle = '#ffd700';
      ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
      ctx.shadowColor = '#ffbb00';
      ctx.shadowBlur = 8;
      ctx.lineWidth = 2;

      // Diamond reticle
      ctx.beginPath();
      ctx.moveTo(0, -7);
      ctx.lineTo(7, 0);
      ctx.lineTo(0, 7);
      ctx.lineTo(-7, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 9px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CRIT', 0, -9);
      ctx.restore();
    }

    ctx.restore();
  }
}

/* --- js/entities/Projectile.js --- */
/**
 * Projectile - High-velocity plasma energy bolts for combat
 * Authored by: agency-game-designer & agency-technical-artist
 */
class Projectile {
  constructor(x, y, vx, vy, damage = 25, source = 'player', color = '#00ffcc') {
    this.pos = new Vector2D(x, y);
    this.vel = new Vector2D(vx, vy);
    this.damage = damage;
    this.source = source;
    this.color = color;
    this.radius = 4;
    this.life = 0;
    this.maxLife = 1.4;
    this.isDead = false;
  }

  update(dt) {
    this.life += dt;
    if (this.life >= this.maxLife) {
      this.isDead = true;
      return;
    }
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;
  }

  render(ctx, camera) {
    if (!camera.isVisible(this.pos.x, this.pos.y, 20)) return;

    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    const angle = this.vel.heading();
    ctx.rotate(angle);

    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;

    // Bolt shape
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(-10, -2.5);
    ctx.lineTo(-10, 2.5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}

/* --- js/entities/Torpedo.js --- */
/**
 * Torpedo - Heavy guided homing ordnance with thrust trails and area-of-effect detonation
 * Authored by: agency-game-designer & agency-technical-artist
 */
class Torpedo {
  constructor(x, y, heading, target = null) {
    this.pos = new Vector2D(x, y);
    this.vel = Vector2D.fromAngle(heading, 260);
    this.angle = heading;
    this.target = target;
    this.speed = 260;
    this.maxSpeed = 750;
    this.turnRate = 3.8;
    this.damage = 160;
    this.blastRadius = 85;
    this.radius = 7;
    this.life = 0;
    this.maxLife = 5.0;
    this.isDead = false;
    this.source = 'player';
  }

  update(dt, spatialHash, particleSystem, soundEngine, camera) {
    this.life += dt;
    if (this.life >= this.maxLife) {
      this.detonate(spatialHash, particleSystem, soundEngine, camera);
      return;
    }

    // Accelerate
    this.speed = Math.min(this.maxSpeed, this.speed + 420 * dt);

    // Homing steering logic
    if (this.target && !this.target.isDead) {
      const toTarget = Vector2D.sub(this.target.pos, this.pos);
      const targetAngle = toTarget.heading();
      let diff = targetAngle - this.angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.angle += Math.sign(diff) * Math.min(Math.abs(diff), this.turnRate * dt);
    }

    this.vel = Vector2D.fromAngle(this.angle, this.speed);
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;

    // Smoke & flame thruster trail
    const tailX = this.pos.x - Math.cos(this.angle) * 12;
    const tailY = this.pos.y - Math.sin(this.angle) * 12;
    particleSystem.emit({
      x: tailX,
      y: tailY,
      vx: (Math.random() - 0.5) * 20,
      vy: (Math.random() - 0.5) * 20,
      size: 2.5 + Math.random() * 2,
      life: 0.35,
      color: Math.random() < 0.4 ? '#ff6600' : '#888899',
      decay: 0.93
    });

    // Check impact
    const nearby = spatialHash.query(this.pos.x, this.pos.y, this.radius + 50);
    for (const ent of nearby) {
      if (ent.isDead) continue;
      // Don't collide with player
      if (ent.name === 'player' || ent.radius === 18) continue;
      if (this.pos.dist(ent.pos) < ent.radius + this.radius) {
        this.detonate(spatialHash, particleSystem, soundEngine, camera);
        break;
      }
    }
  }

  detonate(spatialHash, particleSystem, soundEngine, camera) {
    if (this.isDead) return;
    this.isDead = true;

    soundEngine.playExplosion(true);
    camera.addShake(14);
    particleSystem.emitExplosion(this.pos.x, this.pos.y, true);
    particleSystem.addFloatingText('TORPEDO IMPACT', this.pos.x, this.pos.y - 20, '#ff4400', 16);

    // Area of effect damage
    const targets = spatialHash.query(this.pos.x, this.pos.y, this.blastRadius);
    for (const ent of targets) {
      if (ent.isDead) continue;
      const d = this.pos.dist(ent.pos);
      if (d <= this.blastRadius + (ent.radius || 20)) {
        const falloff = 1 - d / (this.blastRadius + (ent.radius || 20));
        const finalDmg = this.damage * Math.max(0.3, falloff);
        if (typeof ent.takeDamage === 'function') {
          ent.takeDamage(finalDmg, soundEngine, particleSystem);
        }
      }
    }
  }

  render(ctx, camera) {
    if (!camera.isVisible(this.pos.x, this.pos.y, 25)) return;

    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    ctx.rotate(this.angle);

    ctx.fillStyle = '#ff3300';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;

    // Torpedo projectile shape
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-6, -4);
    ctx.lineTo(-10, -5);
    ctx.lineTo(-8, 0);
    ctx.lineTo(-10, 5);
    ctx.lineTo(-6, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // High-heat warhead nose tip
    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    ctx.arc(10, 0, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

/* --- js/entities/Derelict.js --- */
/**
 * Derelict - Abandoned exploration vessel adrift in the void with salvageable tech and black box
 * Authored by: agency-level-designer & agency-narrative-designer
 */
class Derelict {
  constructor(x, y, name = 'USSC NAUTILUS // RECOVERY TARGET') {
    this.pos = new Vector2D(x, y);
    this.vel = new Vector2D((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
    this.angle = Math.random() * Math.PI * 2;
    this.rotSpeed = 0.04;
    this.radius = 32;
    this.name = name;

    this.salvaged = false;
    this.salvageProgress = 0; // 0 to 1
    this.salvageDuration = 2.5; // Requires 2.5s of tractor or close scan
    this.beaconTimer = 0;
    this.beaconOn = false;
    this.scanned = false;
  }

  update(dt, playerShip, particleSystem, soundEngine, missionManager) {
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;
    this.angle += this.rotSpeed * dt;

    this.beaconTimer += dt;
    if (this.beaconTimer > 0.8) {
      this.beaconTimer = 0;
      this.beaconOn = !this.beaconOn;
    }

    if (this.salvaged) return;

    // Check player salvage interaction
    const dist = this.pos.dist(playerShip.pos);
    if (dist < 140 && (playerShip.isTractorActive || dist < 65)) {
      this.salvageProgress += dt / this.salvageDuration;

      // Salvage particle sparks
      if (Math.random() < 0.4) {
        particleSystem.emit({
          x: this.pos.x + (Math.random() - 0.5) * 30,
          y: this.pos.y + (Math.random() - 0.5) * 30,
          vx: (playerShip.pos.x - this.pos.x) * 1.5,
          vy: (playerShip.pos.y - this.pos.y) * 1.5,
          size: 2,
          life: 0.4,
          color: '#00ffff'
        });
      }

      if (this.salvageProgress >= 1.0) {
        this.salvaged = true;
        soundEngine.playSalvage();
        particleSystem.emitExplosion(this.pos.x, this.pos.y, false);
        particleSystem.addFloatingText('DERELICT TELEMETRY & CACHE SECURED! +350 CR', this.pos.x, this.pos.y - 30, '#00ffff', 15);
        playerShip.economy.credits += 350;

        // Drop bonus rare minerals
        playerShip.economy.addOre('titanium', 2);
        playerShip.economy.addOre('quantum', 1);

        if (missionManager) {
          missionManager.onDerelictSalvaged(particleSystem, playerShip.pos);
        }
      }
    } else {
      this.salvageProgress = Math.max(0, this.salvageProgress - dt * 0.5);
    }
  }

  render(ctx, camera) {
    if (!camera.isVisible(this.pos.x, this.pos.y, 60)) return;

    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    ctx.rotate(this.angle);

    // Derelict ship skeleton geometry
    ctx.fillStyle = this.salvaged ? '#141820' : '#1e2838';
    ctx.strokeStyle = this.salvaged ? '#334455' : (this.scanned ? '#00e5ff' : '#6688aa');
    ctx.lineWidth = 2;

    // Damaged hull
    ctx.beginPath();
    ctx.moveTo(28, 0);
    ctx.lineTo(8, -18);
    ctx.lineTo(-24, -14);
    ctx.lineTo(-18, 0);
    ctx.lineTo(-24, 14);
    ctx.lineTo(8, 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Fractured structural ribs
    ctx.strokeStyle = '#445566';
    ctx.beginPath();
    ctx.moveTo(-10, -12); ctx.lineTo(-10, 12);
    ctx.moveTo(2, -14); ctx.lineTo(2, 14);
    ctx.stroke();

    // Emergency Distress Beacon
    if (!this.salvaged && this.beaconOn) {
      ctx.fillStyle = '#ff8800';
      ctx.shadowColor = '#ff6600';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(4, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.restore();

    // Salvage progress arc
    if (!this.salvaged && this.salvageProgress > 0) {
      ctx.save();
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, 42, -Math.PI * 0.5, -Math.PI * 0.5 + Math.PI * 2 * this.salvageProgress);
      ctx.stroke();

      ctx.fillStyle = '#00ffff';
      ctx.font = 'bold 10px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`SALVAGING ${Math.round(this.salvageProgress * 100)}%`, this.pos.x, this.pos.y - 48);
      ctx.restore();
    } else if (!this.salvaged) {
      ctx.fillStyle = '#ffaa00';
      ctx.font = '10px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[DISTRESS BEACON]', this.pos.x, this.pos.y - 36);
    }
  }
}

/* --- js/entities/BlackHole.js --- */
/**
 * BlackHole - Gravitational cosmic anomaly with accretion disk, spacetime shear, and exotic matter
 * Authored by: agency-game-designer & agency-technical-artist
 */
class BlackHole {
  constructor(x = 2400, y = -2200) {
    this.pos = new Vector2D(x, y);
    this.horizonRadius = 38;
    this.accretionRadius = 340;
    this.gravityRadius = 950;
    this.gravityStrength = 48000;
    this.angle = 0;
    this.rotSpeed = 1.2;

    this.spawnTimer = 0;
    this.name = 'SINGULARITY OMEGA // EXOTIC ZONE';
  }

  update(dt, playerShip, asteroids, minerals, enemies, particleSystem, soundEngine, camera) {
    this.angle += this.rotSpeed * dt;

    // Spawn orbiting exotic quantum matter periodically
    this.spawnTimer += dt;
    if (this.spawnTimer >= 18) {
      this.spawnTimer = 0;
      const spawnAngle = Math.random() * Math.PI * 2;
      const spawnDist = 480 + Math.random() * 220;
      const qx = this.pos.x + Math.cos(spawnAngle) * spawnDist;
      const qy = this.pos.y + Math.sin(spawnAngle) * spawnDist;
      const shard = new Mineral(qx, qy, 'quantum', 1);
      // Tangential orbital velocity
      shard.vel.set(-Math.sin(spawnAngle) * 95, Math.cos(spawnAngle) * 95);
      minerals.push(shard);
    }

    // Apply Gravitational Pull to Player Ship
    if (playerShip && !playerShip.isDead) {
      const dist = this.pos.dist(playerShip.pos);
      if (dist < this.gravityRadius && dist > 5) {
        const toHole = Vector2D.sub(this.pos, playerShip.pos).normalize();
        const pull = (this.gravityStrength / Math.max(80, dist)) * dt;
        playerShip.vel.add(toHole.mult(pull));

        // Event Horizon Shear Damage
        if (dist < this.horizonRadius + playerShip.radius) {
          playerShip.takeDamage(45 * dt, soundEngine, particleSystem, camera);
          camera.addShake(2.0);
          particleSystem.addFloatingText('GRAVITATIONAL SHEAR WARNING!', playerShip.pos.x, playerShip.pos.y - 30, '#ff0055', 13);
        }
      }
    }

    // Apply Gravitational Pull to Minerals & Asteroids
    for (const m of minerals) {
      const dist = this.pos.dist(m.pos);
      if (dist < this.gravityRadius && dist > 5) {
        const pull = (this.gravityStrength * 0.45 / Math.max(60, dist)) * dt;
        m.vel.add(Vector2D.sub(this.pos, m.pos).normalize().mult(pull));
        if (dist < this.horizonRadius) {
          m.isDead = true; // Consumed by the singularity
        }
      }
    }

    // Ambient swirling accretion particles
    if (Math.random() < 0.35) {
      const pAngle = Math.random() * Math.PI * 2;
      const pDist = 80 + Math.random() * (this.accretionRadius - 80);
      particleSystem.emit({
        x: this.pos.x + Math.cos(pAngle) * pDist,
        y: this.pos.y + Math.sin(pAngle) * pDist,
        vx: -Math.sin(pAngle) * 120,
        vy: Math.cos(pAngle) * 120,
        size: 2,
        life: 0.6,
        color: Math.random() < 0.5 ? '#aa00ee' : '#00ffff',
        decay: 0.96
      });
    }
  }

  render(ctx, camera) {
    if (!camera.isVisible(this.pos.x, this.pos.y, this.accretionRadius * 1.5)) return;

    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);

    // 1. Swirling Accretion Disk Glow
    const grad = ctx.createRadialGradient(0, 0, this.horizonRadius, 0, 0, this.accretionRadius);
    grad.addColorStop(0, 'rgba(180, 0, 255, 0.45)');
    grad.addColorStop(0.3, 'rgba(0, 200, 255, 0.25)');
    grad.addColorStop(0.7, 'rgba(120, 0, 200, 0.1)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, this.accretionRadius, 0, Math.PI * 2);
    ctx.fill();

    // 2. Gravitational Lensing Rings
    ctx.save();
    ctx.rotate(this.angle);
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([15, 20]);
    ctx.beginPath();
    ctx.arc(0, 0, this.horizonRadius * 2.2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.rotate(-this.angle * 2.2);
    ctx.strokeStyle = 'rgba(200, 0, 255, 0.5)';
    ctx.beginPath();
    ctx.arc(0, 0, this.horizonRadius * 1.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 3. Event Horizon (Pure Black Void)
    ctx.fillStyle = '#000000';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(0, 0, this.horizonRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 4. Hazard Label
    ctx.fillStyle = '#ff00ff';
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SINGULARITY OMEGA', 0, -this.accretionRadius * 0.7);
    ctx.fillStyle = '#00ffff';
    ctx.font = '9px "Courier New", monospace';
    ctx.fillText('[EXTREME GRAVITATIONAL SHEAR]', 0, -this.accretionRadius * 0.7 + 14);

    ctx.restore();
  }
}

/* --- js/entities/Enemy.js --- */
/**
 * Enemy - Autonomous Pirate Raider drone interceptor
 * Authored by: agency-game-designer & agency-level-designer
 */
class Enemy {
  constructor(x, y, tier = 1) {
    this.pos = new Vector2D(x, y);
    this.vel = new Vector2D((Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40);
    this.angle = Math.random() * Math.PI * 2;
    this.tier = tier;
    this.radius = 16;

    this.maxHealth = 40 + tier * 25;
    this.health = this.maxHealth;
    this.maxShield = 20 + tier * 15;
    this.shield = this.maxShield;

    this.speed = 180 + tier * 25;
    this.turnSpeed = 2.4;
    this.detectionRadius = 650;
    this.fireRange = 400;
    this.fireCooldown = 0;
    this.fireInterval = Math.max(0.6, 1.4 - tier * 0.2);

    this.isDead = false;
    this.state = 'PATROL'; // PATROL, ATTACK
    this.patrolTimer = 0;
    this.targetPos = new Vector2D(x, y);

    this.empStunTimer = 0;
    this.scannedTimer = 0;
  }

  applyEMP(duration = 5, particleSystem) {
    this.empStunTimer = Math.max(this.empStunTimer, duration);
    if (particleSystem) {
      particleSystem.addFloatingText('SYSTEMS DISABLED!', this.pos.x, this.pos.y - 20, '#00e5ff', 12);
    }
  }

  takeDamage(amount, soundEngine, particleSystem) {
    if (this.shield > 0) {
      this.shield -= amount;
      particleSystem.emitShieldRipple(this.pos.x, this.pos.y, this.radius);
      if (this.shield < 0) {
        this.health += this.shield; // Overflow damage to hull
        this.shield = 0;
      }
    } else {
      this.health -= amount;
      particleSystem.emitDebris(this.pos.x, this.pos.y, 4, '#ff4444', 100);
    }

    if (this.health <= 0) {
      this.isDead = true;
      soundEngine.playExplosion(true);
      particleSystem.emitExplosion(this.pos.x, this.pos.y, true);
    } else {
      soundEngine.playImpact(1.2);
    }
  }

  update(dt, playerShip, projectiles, particleSystem, soundEngine) {
    if (this.scannedTimer > 0) this.scannedTimer -= dt;

    // Handle EMP stun state
    if (this.empStunTimer > 0) {
      this.empStunTimer -= dt;
      this.vel.mult(0.95);
      this.pos.x += this.vel.x * dt;
      this.pos.y += this.vel.y * dt;
      if (Math.random() < 0.25) {
        particleSystem.emit({
          x: this.pos.x + (Math.random() - 0.5) * 16,
          y: this.pos.y + (Math.random() - 0.5) * 16,
          vx: (Math.random() - 0.5) * 40,
          vy: (Math.random() - 0.5) * 40,
          size: 2,
          life: 0.2,
          color: '#00e5ff'
        });
      }
      return;
    }

    this.patrolTimer -= dt;
    this.fireCooldown -= dt;

    const distToPlayer = this.pos.dist(playerShip.pos);

    // Transition between patrol and attack
    if (distToPlayer < this.detectionRadius && !playerShip.isDead) {
      this.state = 'ATTACK';
    } else if (distToPlayer > this.detectionRadius * 1.5) {
      this.state = 'PATROL';
    }

    let desiredAngle = this.angle;

    if (this.state === 'ATTACK') {
      // Calculate angle toward player
      const toPlayer = Vector2D.sub(playerShip.pos, this.pos);
      desiredAngle = toPlayer.heading();

      // Maintain optimal combat distance (~220px)
      if (distToPlayer > 260) {
        const thrust = Vector2D.fromAngle(this.angle, this.speed * dt);
        this.vel.add(thrust);
      } else if (distToPlayer < 160) {
        const reverse = Vector2D.fromAngle(this.angle, -this.speed * dt);
        this.vel.add(reverse);
      }

      // Fire plasma cannons when aligned
      const angleDiff = Math.abs(this._normalizeAngle(desiredAngle - this.angle));
      if (angleDiff < 0.3 && distToPlayer < this.fireRange && this.fireCooldown <= 0) {
        this.fireCooldown = this.fireInterval;
        const boltVel = Vector2D.fromAngle(this.angle, 600).add(this.vel);
        projectiles.push(new Projectile(
          this.pos.x + Math.cos(this.angle) * 18,
          this.pos.y + Math.sin(this.angle) * 18,
          boltVel.x,
          boltVel.y,
          15 + this.tier * 5,
          'enemy',
          '#ff3322'
        ));
        soundEngine.playPlasmaShot();
      }
    } else {
      // Patrol wander
      if (this.patrolTimer <= 0) {
        this.patrolTimer = 3 + Math.random() * 4;
        this.targetPos.set(
          this.pos.x + (Math.random() - 0.5) * 600,
          this.pos.y + (Math.random() - 0.5) * 600
        );
      }
      desiredAngle = Vector2D.sub(this.targetPos, this.pos).heading();
      const thrust = Vector2D.fromAngle(this.angle, this.speed * 0.45 * dt);
      this.vel.add(thrust);
    }

    // Smooth rotation toward desired angle
    const diff = this._normalizeAngle(desiredAngle - this.angle);
    this.angle += Math.sign(diff) * Math.min(Math.abs(diff), this.turnSpeed * dt);

    // Apply motion and friction
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;
    this.vel.mult(0.985);

    // Thruster exhaust
    if (this.vel.mag() > 20) {
      particleSystem.emitThruster(
        this.pos.x - Math.cos(this.angle) * 14,
        this.pos.y - Math.sin(this.angle) * 14,
        this.angle + Math.PI,
        false
      );
    }

    // Shield passive regeneration
    if (this.shield < this.maxShield) {
      this.shield = Math.min(this.maxShield, this.shield + 4 * dt);
    }
  }

  _normalizeAngle(angle) {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
  }

  getLootDrops() {
    const drops = [];
    const oreTypes = ['ferrite', 'silicon', 'titanium'];
    const chosenOre = oreTypes[Math.min(this.tier - 1, oreTypes.length - 1)];
    drops.push(new Mineral(this.pos.x, this.pos.y, chosenOre, 1));
    return drops;
  }

  render(ctx, camera) {
    if (!camera.isVisible(this.pos.x, this.pos.y, 40)) return;

    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    ctx.rotate(this.angle);

    // Raider ship geometry (Vampiric Arrowhead)
    ctx.fillStyle = '#220e10';
    ctx.strokeStyle = '#ff2233';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#ff1122';
    ctx.shadowBlur = 6;

    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(-14, -12);
    ctx.lineTo(-8, 0);
    ctx.lineTo(-14, 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Red Cockpit Eye
    ctx.fillStyle = '#ff0033';
    ctx.beginPath();
    ctx.arc(2, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    // EMP Stunned electric cage
    if (this.empStunTimer > 0) {
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();

    // Health / Shield Bar above enemy
    if (this.health < this.maxHealth || this.shield < this.maxShield) {
      const barW = 28;
      const barH = 3;
      const bx = this.pos.x - barW * 0.5;
      const by = this.pos.y - 24;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(bx, by, barW, barH);

      const hpPct = Math.max(0, this.health / this.maxHealth);
      ctx.fillStyle = '#ff3344';
      ctx.fillRect(bx, by, barW * hpPct, barH);
    }
  }
}

/* --- js/entities/Ship.js --- */
/**
 * Ship - Player-controlled Newtonian Void Miner Craft
 * Authored by: agency-game-designer, agency-ux-architect & agency-technical-artist
 */
class Ship {
  constructor(x = 0, y = 0, economy) {
    this.pos = new Vector2D(x, y);
    this.vel = new Vector2D(0, 0);
    this.angle = -Math.PI / 2; // Facing up initially
    this.economy = economy;
    this.radius = 18;

    // Subsystem stats synced from Economy
    this.syncStats();

    this.hull = this.hullStats.maxHull;
    this.shield = this.shieldStats.maxShield;
    this.shieldTimer = 0; // Delay before shields recharge after taking damage

    this.inertialDampeners = true; // Flight assist ON by default
    this.isThrusting = false;
    this.isBoosting = false;
    this.isTractorActive = false;
    this.isMiningActive = false;

    // Mining Laser target & state
    this.miningTargetPoint = null;
    this.miningHitAsteroid = null;
    this.laserHeat = 0; // Overheat gauge (0 to 100)

    // Weapon & Ability Cooldowns
    this.weaponCooldown = 0;
    this.scannerCooldown = 0;
    this.empCooldown = 0;
    this.torpedoCooldown = 0;
    this.isLaserCrit = false;

    this.isDead = false;
    this.autopilot = false;
  }

  syncStats() {
    this.thrusterStats = this.economy.getUpgradeStats('thruster');
    this.shieldStats = this.economy.getUpgradeStats('shields');
    this.hullStats = this.economy.getUpgradeStats('hull');
    this.laserStats = this.economy.getUpgradeStats('laser');
    this.tractorStats = this.economy.getUpgradeStats('tractor');
    this.cargoStats = this.economy.getUpgradeStats('cargo');
    this.weaponStats = this.economy.getUpgradeStats('weapons');
  }

  takeDamage(amount, soundEngine, particleSystem, camera) {
    if (this.isDead) return;

    this.shieldTimer = this.shieldStats.rechargeDelay;

    if (this.shield > 0) {
      this.shield -= amount;
      soundEngine.playImpact(1.5);
      particleSystem.emitShieldRipple(this.pos.x, this.pos.y, this.radius);
      camera.addShake(4);
      if (this.shield < 0) {
        const armorReduction = 1 - this.hullStats.armor;
        this.hull += this.shield * armorReduction;
        this.shield = 0;
      }
    } else {
      const armorReduction = 1 - this.hullStats.armor;
      this.hull -= amount * armorReduction;
      soundEngine.playImpact(2.5);
      particleSystem.emitDebris(this.pos.x, this.pos.y, 8, '#ffaa00', 140);
      camera.addShake(8);
    }

    if (this.hull <= 0) {
      this.hull = 0;
      this.isDead = true;
      soundEngine.playExplosion(true);
      particleSystem.emitExplosion(this.pos.x, this.pos.y, true);
      camera.addShake(20);
    } else if (this.shield <= 0 && this.hull < this.hullStats.maxHull * 0.3) {
      soundEngine.playAlarm();
    }
  }

  repair(amount) {
    this.hull = Math.min(this.hullStats.maxHull, this.hull + amount);
  }

  rechargeShields() {
    this.shield = this.shieldStats.maxShield;
  }

  update(dt, input, spatialHash, projectiles, particleSystem, soundEngine, camera) {
    if (this.isDead) return;

    this.syncStats();

    // 1. Controls & Rotation
    if (input.isTurningLeft()) {
      this.angle -= this.thrusterStats.turnSpeed * dt;
    }
    if (input.isTurningRight()) {
      this.angle += this.thrusterStats.turnSpeed * dt;
    }

    // Toggle Inertial Dampeners
    if (input.isToggleDampeners()) {
      this.inertialDampeners = !this.inertialDampeners;
      particleSystem.addFloatingText(
        `Flight Assist: ${this.inertialDampeners ? 'ON' : 'OFF'}`,
        this.pos.x,
        this.pos.y - 30,
        this.inertialDampeners ? '#00e5ff' : '#ffaa00'
      );
    }

    // Toggle Autopilot Return Assist [Key G]
    if (input.isAutopilotPressed()) {
      this.autopilot = !this.autopilot;
      if (this.autopilot) {
        particleSystem.addFloatingText('AUTOPILOT: HOMING AEGIS STARBASE', this.pos.x, this.pos.y - 32, '#00ffaa', 14);
        if (soundEngine && soundEngine.playAutopilot) soundEngine.playAutopilot(true);
      } else {
        particleSystem.addFloatingText('AUTOPILOT: MANUAL OVERRIDE', this.pos.x, this.pos.y - 32, '#ffaa00', 14);
        if (soundEngine && soundEngine.playAutopilot) soundEngine.playAutopilot(false);
      }
    }

    // Manual controls disengage autopilot
    if (this.autopilot && (input.isThrusting() || input.isReversing() || input.isTurningLeft() || input.isTurningRight())) {
      this.autopilot = false;
      particleSystem.addFloatingText('AUTOPILOT: MANUAL OVERRIDE', this.pos.x, this.pos.y - 32, '#ffaa00', 14);
      if (soundEngine && soundEngine.playAutopilot) soundEngine.playAutopilot(false);
    }

    // Process Autopilot Navigation toward Aegis Starbase at (0, 0)
    if (this.autopilot) {
      const toHome = new Vector2D(-this.pos.x, -this.pos.y);
      const homeDist = toHome.mag();

      if (homeDist < 220) {
        // Arrived at safe docking perimeter!
        this.autopilot = false;
        particleSystem.addFloatingText('STARBASE DOCKING PERIMETER REACHED [PRESS E]', this.pos.x, this.pos.y - 32, '#00ffff', 15);
        if (soundEngine && soundEngine.playDockSuccess) soundEngine.playDockSuccess();
      } else {
        const desiredHeading = toHome.heading();
        let diff = desiredHeading - this.angle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;

        const maxTurn = this.thrusterStats.turnSpeed * dt * 1.6;
        this.angle += Math.sign(diff) * Math.min(Math.abs(diff), maxTurn);

        // If approximately aligned with Starbase, fire thrusters
        if (Math.abs(diff) < 0.7) {
          const thrustVector = Vector2D.fromAngle(this.angle, this.thrusterStats.thrust * 1.15 * dt);
          this.vel.add(thrustVector);
          const nozzleX = this.pos.x - Math.cos(this.angle) * 16;
          const nozzleY = this.pos.y - Math.sin(this.angle) * 16;
          particleSystem.emitThruster(nozzleX, nozzleY, this.angle, false);
        }
      }
    }

    // 2. Thrust & Movement
    this.isThrusting = input.isThrusting() || (this.autopilot && Math.abs(new Vector2D(-this.pos.x, -this.pos.y).heading() - this.angle) < 0.7);
    this.isBoosting = input.isThrusting() && input.isBoosting();

    let currentThrust = this.thrusterStats.thrust;
    if (this.isBoosting) {
      currentThrust *= this.thrusterStats.boostMult;
      camera.addShake(0.6);
    }

    if (this.isThrusting) {
      const thrustVector = Vector2D.fromAngle(this.angle, currentThrust * dt);
      this.vel.add(thrustVector);

      // Exhaust VFX
      const nozzleX = this.pos.x - Math.cos(this.angle) * 16;
      const nozzleY = this.pos.y - Math.sin(this.angle) * 16;
      particleSystem.emitThruster(nozzleX, nozzleY, this.angle, this.isBoosting);
    }

    // Retrograde braking
    if (input.isReversing()) {
      const brakeVector = Vector2D.fromAngle(this.angle, -currentThrust * 0.6 * dt);
      this.vel.add(brakeVector);
    }

    // Flight Assist (Inertial Dampeners)
    if (this.inertialDampeners && !this.isThrusting && !input.isReversing()) {
      const speed = this.vel.mag();
      if (speed > 1) {
        const brakeForce = Math.min(speed, this.thrusterStats.thrust * 0.75 * dt);
        const dampVec = this.vel.copy().normalize().mult(-brakeForce);
        this.vel.add(dampVec);
      } else {
        this.vel.set(0, 0);
      }
    }

    // Limit maximum speed
    this.vel.limit(this.thrusterStats.maxSpeed * (this.isBoosting ? 1.3 : 1.0));

    // Update position
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;

    // Audio volume update for thrusters
    soundEngine.setThrusterVolume(this.isThrusting ? 1 : 0, this.isBoosting);

    // 3. Shield Regeneration
    if (this.shieldTimer > 0) {
      this.shieldTimer -= dt;
    } else if (this.shield < this.shieldStats.maxShield) {
      this.shield = Math.min(this.shieldStats.maxShield, this.shield + this.shieldStats.rechargeRate * dt);
    }

    // 4. Mining Laser System
    this.isMiningActive = input.isFiringMiningLaser();
    this.miningHitAsteroid = null;
    this.miningTargetPoint = null;

    if (this.isMiningActive) {
      soundEngine.setMiningLaserVolume(true);
      const laserRange = this.laserStats.range;
      const beamDir = Vector2D.fromAngle(this.angle, 1);
      const beamEnd = Vector2D.add(this.pos, beamDir.copy().mult(laserRange));

      // Query nearby asteroids via spatial hash
      const nearby = spatialHash.query(this.pos.x, this.pos.y, laserRange + 100);
      let closestHitDist = laserRange;
      let hitAsteroid = null;
      let hitPoint = null;

      for (const ent of nearby) {
        if (!ent.vertices || ent.isDead) continue; // Must be an Asteroid
        const toEnt = Vector2D.sub(ent.pos, this.pos);
        const proj = toEnt.dot(beamDir);
        if (proj > 0 && proj < closestHitDist) {
          const perpDistSq = toEnt.magSq() - proj * proj;
          if (perpDistSq <= ent.radius * ent.radius) {
            closestHitDist = proj - Math.sqrt(Math.max(0, ent.radius * ent.radius - perpDistSq));
            hitAsteroid = ent;
            hitPoint = Vector2D.add(this.pos, beamDir.copy().mult(closestHitDist));
          }
        }
      }

      this.isLaserCrit = false;
      if (hitAsteroid && hitPoint) {
        this.miningHitAsteroid = hitAsteroid;
        this.miningTargetPoint = hitPoint;
        const isCrit = typeof hitAsteroid.checkWeakPointHit === 'function' && hitAsteroid.checkWeakPointHit(hitPoint);
        this.isLaserCrit = isCrit;

        const effectiveDps = this.laserStats.dps * (isCrit ? 3.5 : 1.0);
        hitAsteroid.takeDamage(effectiveDps * dt, isCrit);

        if (isCrit) {
          particleSystem.emitMiningSparks(hitPoint.x, hitPoint.y, this.angle + Math.PI, '#ffd700');
          camera.addShake(0.6);
        } else {
          particleSystem.emitMiningSparks(hitPoint.x, hitPoint.y, this.angle + Math.PI, hitAsteroid.commodity.color);
          camera.addShake(0.3);
        }
      } else {
        this.miningTargetPoint = beamEnd;
      }
    } else {
      this.isLaserCrit = false;
      soundEngine.setMiningLaserVolume(false);
    }

    // 5. Tractor Beam System
    this.isTractorActive = input.isTractorBeamActive();

    // 6. Plasma Weapons Firing
    this.weaponCooldown -= dt;
    if (input.isFiringWeapons() && this.weaponCooldown <= 0) {
      this.weaponCooldown = 1 / this.weaponStats.fireRate;
      soundEngine.playPlasmaShot();
      camera.addShake(1.5);

      // Dual wingtip fire
      const leftWing = this.pos.copy().add(Vector2D.fromAngle(this.angle - 1.8, 14));
      const rightWing = this.pos.copy().add(Vector2D.fromAngle(this.angle + 1.8, 14));
      const boltVel = Vector2D.fromAngle(this.angle, this.weaponStats.speed).add(this.vel);

      projectiles.push(new Projectile(leftWing.x, leftWing.y, boltVel.x, boltVel.y, this.weaponStats.damage, 'player', '#00ffcc'));
      projectiles.push(new Projectile(rightWing.x, rightWing.y, boltVel.x, boltVel.y, this.weaponStats.damage, 'player', '#00ffcc'));
    }

    // 7. Prospector Deep Sonar Scanner [Q / Tab]
    if (this.scannerCooldown > 0) this.scannerCooldown -= dt;
    if (input.isScannerPressed() && this.scannerCooldown <= 0) {
      this.scannerCooldown = 6.0;
      soundEngine.playSonarPing();
      particleSystem.emit({
        x: this.pos.x,
        y: this.pos.y,
        isRing: true,
        ringRadius: 1400,
        life: 0.9,
        color: '#00ffff'
      });
      camera.addShake(1.5);
      particleSystem.addFloatingText('SONAR SECTOR PULSE // WEAK POINTS HIGHLIGHTED', this.pos.x, this.pos.y - 35, '#00ffff', 14);

      // Reveal all asteroids and derelicts in scanner radius
      const scannedEntities = spatialHash.query(this.pos.x, this.pos.y, 1600);
      for (const ent of scannedEntities) {
        if (ent.scannedTimer !== undefined) {
          ent.scannedTimer = 10.0;
        }
        if (ent.scanned !== undefined) {
          ent.scanned = true;
        }
      }
    }

    // 8. EMP Shockwave Ability [C]
    if (this.empCooldown > 0) this.empCooldown -= dt;
    if (input.isEMPPressed() && this.empCooldown <= 0) {
      this.empCooldown = 12.0;
      soundEngine.playEMP();
      camera.addShake(12);
      particleSystem.emit({
        x: this.pos.x,
        y: this.pos.y,
        isRing: true,
        ringRadius: 460,
        life: 0.65,
        color: '#00aaff'
      });
      particleSystem.addFloatingText('EMP DISCHARGE! HOSTILES STUNNED', this.pos.x, this.pos.y - 45, '#00e5ff', 16);

      // Stun enemies and fracture cracked asteroids in radius
      const empTargets = spatialHash.query(this.pos.x, this.pos.y, 460);
      for (const ent of empTargets) {
        if (ent.isDead) continue;
        if (typeof ent.applyEMP === 'function') {
          ent.applyEMP(5.0, particleSystem);
        } else if (ent.vertices) { // Asteroid
          ent.takeDamage(90, false);
          particleSystem.emitDebris(ent.pos.x, ent.pos.y, 10, '#00e5ff', 140);
        }
      }
    }

    // 9. Heavy Homing Torpedo [R]
    if (this.torpedoCooldown > 0) this.torpedoCooldown -= dt;
    if (input.isTorpedoPressed() && this.torpedoCooldown <= 0) {
      this.torpedoCooldown = 4.5;
      soundEngine.playTorpedoLaunch();
      camera.addShake(3.0);

      // Find nearest hostile or large asteroid in front of ship
      const forwardDir = Vector2D.fromAngle(this.angle, 1);
      const candidates = spatialHash.query(this.pos.x, this.pos.y, 1200);
      let bestTarget = null;
      let closestDist = 1200;

      for (const c of candidates) {
        if (c.isDead || c === this) continue;
        const toC = Vector2D.sub(c.pos, this.pos);
        if (toC.dot(forwardDir) > 0) { // In front
          const dist = toC.mag();
          if (dist < closestDist) {
            closestDist = dist;
            bestTarget = c;
          }
        }
      }

      const launchNose = this.pos.copy().add(Vector2D.fromAngle(this.angle, 22));
      projectiles.push(new Torpedo(launchNose.x, launchNose.y, this.angle, bestTarget));
      particleSystem.addFloatingText('TORPEDO FIRED', this.pos.x, this.pos.y - 25, '#ff5500', 13);
    }
  }

  render(ctx, camera) {
    if (this.isDead) return;

    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);

    // 1. Tractor Beam Visual Cone / Wave
    if (this.isTractorActive) {
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.25)';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.arc(0, 0, this.tractorStats.range, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 2. Shield Bubble
    if (this.shield > 0) {
      const shieldAlpha = 0.15 + (this.shield / this.shieldStats.maxShield) * 0.25;
      ctx.strokeStyle = `rgba(0, 229, 255, ${shieldAlpha})`;
      ctx.fillStyle = `rgba(0, 229, 255, ${shieldAlpha * 0.2})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // 3. Ship Hull Geometry (High-tech Sleek Void Prospector)
    ctx.rotate(this.angle);

    ctx.fillStyle = '#080e18';
    ctx.strokeStyle = '#00f5ff';
    ctx.lineWidth = 2.4;
    ctx.shadowColor = '#00d5ff';
    ctx.shadowBlur = 6;

    // Main wedge chassis
    ctx.beginPath();
    ctx.moveTo(18, 0);       // Nose
    ctx.lineTo(-12, -14);    // Left Wingtip
    ctx.lineTo(-6, -6);      // Inset
    ctx.lineTo(-14, 0);      // Engine core
    ctx.lineTo(-6, 6);       // Inset
    ctx.lineTo(-12, 14);     // Right Wingtip
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Canopy Cockpit - glowing high-contrast mint cyan
    ctx.fillStyle = '#22ffcc';
    ctx.shadowColor = '#00ffaa';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.ellipse(2, 0, 6, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Mining Laser Emitter Nose Tip
    ctx.fillStyle = '#ffaa00';
    ctx.shadowColor = '#ff8800';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(17, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();

    // 4. Render Active Mining Laser Beam in World Coordinates
    if (this.isMiningActive && this.miningTargetPoint) {
      const noseWorld = this.pos.copy().add(Vector2D.fromAngle(this.angle, 18));
      ctx.save();
      // Outer glow
      ctx.strokeStyle = this.isLaserCrit ? '#ffd700' : '#ff9900';
      ctx.lineWidth = this.isLaserCrit ? 7.0 : 4.5;
      ctx.shadowColor = this.isLaserCrit ? '#ffff00' : '#ffaa00';
      ctx.shadowBlur = this.isLaserCrit ? 22 : 12;
      ctx.beginPath();
      ctx.moveTo(noseWorld.x, noseWorld.y);
      ctx.lineTo(this.miningTargetPoint.x, this.miningTargetPoint.y);
      ctx.stroke();

      // Inner cutting core
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = this.isLaserCrit ? 3.0 : 1.8;
      ctx.beginPath();
      ctx.moveTo(noseWorld.x, noseWorld.y);
      ctx.lineTo(this.miningTargetPoint.x, this.miningTargetPoint.y);
      ctx.stroke();
      ctx.restore();
    }
  }
}

/* --- js/ui/HUD.js --- */
/**
 * HUD - Next-Gen Diegetic Sci-Fi Cockpit Avionics & Tactical Display
 * Features Segmented LED Gauges, Top Telemetry Ribbon, Real-time Target Lock Reticle,
 * Sweeping Radar Scanner, and Integrated Tactical Systems Array.
 * Authored by: agency-ui-designer, agency-ux-architect & agency-senior-developer
 */
class HUD {
  constructor(canvas) {
    this.canvas = canvas;
    this.radarRadius = 80;
    this.radarRange = 2200; // World units displayed on radar
    this.radarAngle = 0;   // Sweeping radar scan line angle
  }

  render(ctx, ship, station, asteroids, enemies, minerals, camera, missionManager, derelicts = [], blackHole = null) {
    if (!ship || ship.isDead) return;

    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.shadowBlur = 0;

    const time = performance.now() * 0.001;
    this.radarAngle = (this.radarAngle + 0.04) % (Math.PI * 2);

    // 1. Top-Center Sector Navigation & Telemetry Ribbon with Starbase Telemetry
    this._renderSectorRibbon(ctx, ship, station, time);

    // 2. Autopilot Engaged Cockpit Banner (If active)
    if (ship.autopilot) {
      this._renderAutopilotBanner(ctx, ship, station, time);
    }

    // 3. Cargo Bay Full Alert Banner
    this._renderCargoAlert(ctx, ship, time);

    // 4. Top-Left: Unified Cockpit Avionics (Shields, Hull, Telemetry, Abilities)
    this._renderAvionicsHub(ctx, ship, time);

    // 5. Top-Right: Cargo Bay & Refined Resources Bay
    this._renderCargoBay(ctx, ship);

    // 6. Active Mission Contract Tracker with Multi-tier Blinking Timer (Below Cargo)
    if (missionManager && missionManager.activeMission) {
      this._renderMissionTracker(ctx, missionManager, ship, time);
    }

    // 7. Dynamic Holographic Target Lock Reticle
    this._renderTargetReticle(ctx, ship, camera, asteroids, enemies, derelicts);

    // 8. Prograde Flight Reticle
    this._renderFlightReticle(ctx, ship, camera);

    // 9. Dedicated Starbase Waypoint & Directional Distance Beacon
    if (station) {
      this._renderStarbaseBeacon(ctx, ship, station, camera, time, missionManager);
    }

    // 10. Bottom-Right: Military Tactical Sonar Radar (With Sweeping Scanline)
    this._renderTacticalRadar(ctx, ship, station, asteroids, enemies, minerals, derelicts, blackHole);

    // 11. Docking Approach Guidance Indicator
    if (station) {
      this._renderDockingGuidance(ctx, ship, station);
    }

    ctx.restore();
  }

  /* -------------------------------------------------------------
   * Chamfered High-Tech Sci-Fi Glassmorphic Frame
   * ------------------------------------------------------------- */
  _drawCyberPanel(ctx, x, y, w, h, strokeColor = '#00e5ff', cornerSize = 10) {
    ctx.save();
    // Deep dark obsidian backing for 100% legibility over space
    ctx.fillStyle = 'rgba(5, 8, 14, 0.92)';
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = strokeColor;
    ctx.shadowBlur = 8;

    // Chamfered sci-fi path
    ctx.beginPath();
    ctx.moveTo(x + cornerSize, y);
    ctx.lineTo(x + w - cornerSize, y);
    ctx.lineTo(x + w, y + cornerSize);
    ctx.lineTo(x + w, y + h - cornerSize);
    ctx.lineTo(x + w - cornerSize, y + h);
    ctx.lineTo(x + cornerSize, y + h);
    ctx.lineTo(x, y + h - cornerSize);
    ctx.lineTo(x, y + cornerSize);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Corner decorative accent ticks
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1.2;
    ctx.shadowBlur = 0;

    // Top-Left notch
    ctx.beginPath();
    ctx.moveTo(x, y + 14); ctx.lineTo(x, y + cornerSize); ctx.lineTo(x + cornerSize, y); ctx.lineTo(x + 14, y);
    ctx.stroke();

    // Bottom-Right notch
    ctx.beginPath();
    ctx.moveTo(x + w - 14, y + h); ctx.lineTo(x + w - cornerSize, y + h); ctx.lineTo(x + w, y + h - cornerSize); ctx.lineTo(x + w, y + h - 14);
    ctx.stroke();

    ctx.restore();
  }

  /* -------------------------------------------------------------
   * 1. Top Sector Ribbon with Starbase Distance & Compass
   * ------------------------------------------------------------- */
  _renderSectorRibbon(ctx, ship, station, time) {
    const w = 530;
    const h = 28;
    const x = this.canvas.width * 0.5 - w * 0.5;
    const y = 14;

    this._drawCyberPanel(ctx, x, y, w, h, 'rgba(0, 229, 255, 0.45)', 6);

    ctx.save();
    // Blinking status pip
    const blink = Math.sin(time * 3) > 0;
    ctx.fillStyle = blink ? '#00ffaa' : '#00aa66';
    ctx.shadowColor = '#00ffaa';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(x + 16, y + 14, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Sector Title & Telemetry
    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.fillStyle = '#00e5ff';
    ctx.fillText('SECTOR 04 // AEGIS BELT', x + 26, y + 18);

    ctx.fillStyle = '#88aacc';
    const gridX = Math.round(ship.pos.x / 10);
    const gridY = Math.round(ship.pos.y / 10);
    ctx.fillText(`[${gridX}, ${gridY}]`, x + 195, y + 18);

    // Live Starbase distance and bearing compass
    if (station) {
      const dist = ship.pos.dist(station.pos);
      const distStr = dist < 1000 ? `${Math.round(dist)}M` : `${(dist / 1000).toFixed(1)}KM`;
      const toHome = station.pos.copy().sub(ship.pos);
      let angleToHome = Math.atan2(toHome.y, toHome.x) - ship.angle;
      while (angleToHome < -Math.PI) angleToHome += Math.PI * 2;
      while (angleToHome > Math.PI) angleToHome -= Math.PI * 2;
      const deg = Math.round((angleToHome * 180) / Math.PI);
      const arrow = Math.abs(deg) < 20 ? '▲' : (deg > 0 ? '►' : '◄');

      ctx.fillStyle = dist < 220 ? '#00ffaa' : '#ffd700';
      ctx.fillText(`STARBASE: ${distStr} [${arrow} ${deg > 0 ? '+' : ''}${deg}°]`, x + 270, y + 18);
    }

    ctx.fillStyle = ship.autopilot ? '#00ffaa' : '#ffaa33';
    ctx.textAlign = 'right';
    ctx.fillText(ship.autopilot ? 'AUTOPILOT: ON' : 'PATROL', x + w - 16, y + 18);
    ctx.restore();
  }

  /* -------------------------------------------------------------
   * 1B. Autopilot Cockpit Banner
   * ------------------------------------------------------------- */
  _renderAutopilotBanner(ctx, ship, station, time) {
    const w = 500;
    const h = 26;
    const x = this.canvas.width * 0.5 - w * 0.5;
    const y = 46;

    const pulse = 0.8 + 0.2 * Math.sin(time * 6);
    this._drawCyberPanel(ctx, x, y, w, h, '#00ffaa', 5);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.fillStyle = '#00ffaa';
    ctx.shadowColor = '#00ffaa';
    ctx.shadowBlur = 8 * pulse;

    const dist = station ? ship.pos.dist(station.pos) : 0;
    const distStr = dist < 1000 ? `${Math.round(dist)} M` : `${(dist / 1000).toFixed(1)} KM`;

    ctx.fillText(`✈️ AUTOPILOT ACTIVE // HOMING STARBASE (${distStr}) - PRESS [G] OR WASD TO CANCEL`, this.canvas.width * 0.5, y + 17);
    ctx.restore();
  }

  /* -------------------------------------------------------------
   * 1C. Cargo Bay Alert Banner
   * ------------------------------------------------------------- */
  _renderCargoAlert(ctx, ship, time) {
    const cur = ship.economy.getTotalCargoWeight();
    const max = ship.economy.getMaxCargo();
    if (cur < max) return;

    const w = 440;
    const h = 24;
    const x = this.canvas.width * 0.5 - w * 0.5;
    const y = ship.autopilot ? 76 : 46;

    const strobe = Math.floor(time * 3) % 2 === 0;
    const alertColor = strobe ? '#ffaa00' : '#ff4422';

    ctx.save();
    ctx.fillStyle = 'rgba(15, 6, 4, 0.9)';
    ctx.strokeStyle = alertColor;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = alertColor;
    ctx.shadowBlur = 8;

    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(x, y, w, h, 4);
    } else {
      ctx.rect(x, y, w, h);
    }
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.fillStyle = alertColor;
    ctx.fillText(`⚠️ CARGO BAY FULL [${cur}/${max} T] // RETURN TO STARBASE TO REFINE ORE ⚠️`, this.canvas.width * 0.5, y + 16);
    ctx.restore();
  }

  /* -------------------------------------------------------------
   * 2. Unified Avionics Hub (Diagnostics, Telemetry, Abilities)
   * ------------------------------------------------------------- */
  _renderAvionicsHub(ctx, ship, time) {
    const x = 20;
    const y = 20;
    const w = 265;
    const h = 210;

    this._drawCyberPanel(ctx, x, y, w, h, '#00e5ff', 8);

    ctx.save();
    // Header Row
    ctx.fillStyle = '#00ffaa';
    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.fillText('● ONLINE', x + 14, y + 20);

    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.fillText('VOID PROSPECTOR // MK.I', x + 76, y + 20);

    // --- Shield Segmented LED Meter ---
    const shieldMax = ship.shieldStats.maxShield;
    const shieldCur = Math.ceil(ship.shield);
    const shieldPct = Math.max(0, Math.min(1, ship.shield / shieldMax));

    ctx.fillStyle = '#88b0d0';
    ctx.font = '10px "Courier New", monospace';
    ctx.fillText(`SHIELDS`, x + 14, y + 38);
    ctx.textAlign = 'right';
    ctx.fillText(`${shieldCur}/${shieldMax}`, x + w - 14, y + 38);
    ctx.textAlign = 'left';

    this._drawSegmentedBar(ctx, x + 14, y + 43, w - 28, 8, 10, shieldPct, '#00f5ff', '#0099cc', '#102030');

    // --- Hull Segmented LED Meter ---
    const hullMax = ship.hullStats.maxHull;
    const hullCur = Math.ceil(ship.hull);
    const hullPct = Math.max(0, Math.min(1, ship.hull / hullMax));
    const hullColor = hullPct < 0.3 ? '#ff3322' : '#ff9933';
    const hullGlow = hullPct < 0.3 ? '#ff1100' : '#ff7700';

    ctx.fillStyle = '#c09870';
    ctx.fillText(`HULL`, x + 14, y + 66);
    ctx.textAlign = 'right';
    ctx.fillText(`${hullCur}/${hullMax}`, x + w - 14, y + 66);
    ctx.textAlign = 'left';

    this._drawSegmentedBar(ctx, x + 14, y + 71, w - 28, 8, 10, hullPct, hullColor, hullGlow, '#241410');

    // --- Telemetry Row (Credits, Velocity, Flight Assist) ---
    const speed = Math.round(ship.vel.mag());
    ctx.fillStyle = 'rgba(2, 6, 12, 0.75)';
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 14, y + 87, w - 28, 28);
    ctx.fillRect(x + 14, y + 87, w - 28, 28);

    ctx.fillStyle = '#ffd744';
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.fillText(`CR: ${ship.economy.credits}`, x + 20, y + 105);

    ctx.fillStyle = '#c5dff5';
    ctx.fillText(`VEL: ${speed}M/S`, x + 115, y + 105);

    ctx.fillStyle = ship.inertialDampeners ? '#00ffaa' : '#ff8833';
    ctx.fillText(`FA: ${ship.inertialDampeners ? 'ON' : 'OFF'}`, x + 205, y + 105);

    // --- Tactical Systems Cooldowns ---
    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.fillText('// TACTICAL SYSTEMS', x + 14, y + 132);

    const abilities = [
      { key: '[Q] SONAR', cd: ship.scannerCooldown, maxCd: 6.0, color: '#00ffff' },
      { key: '[C] EMP', cd: ship.empCooldown, maxCd: 12.0, color: '#b844ff' },
      { key: '[R] TORP', cd: ship.torpedoCooldown, maxCd: 4.5, color: '#ff7722' }
    ];

    let abY = y + 148;
    for (const a of abilities) {
      const isReady = a.cd <= 0;
      ctx.fillStyle = isReady ? a.color : '#667788';
      ctx.font = '10px "Courier New", monospace';
      ctx.fillText(a.key, x + 14, abY);

      const statusText = isReady ? 'READY' : `${a.cd.toFixed(1)}S`;
      ctx.textAlign = 'right';
      ctx.fillStyle = isReady ? '#00ffaa' : '#88aacc';
      ctx.fillText(statusText, x + w - 14, abY);
      ctx.textAlign = 'left';

      // Mini bar
      const pct = Math.max(0, 1 - a.cd / a.maxCd);
      ctx.fillStyle = '#0c1622';
      ctx.fillRect(x + 90, abY - 7, 95, 5);
      ctx.fillStyle = isReady ? a.color : '#335577';
      ctx.shadowColor = a.color;
      ctx.shadowBlur = isReady ? 6 : 0;
      ctx.fillRect(x + 90, abY - 7, 95 * pct, 5);
      ctx.shadowBlur = 0;

      abY += 18;
    }

    ctx.restore();
  }

  /* -------------------------------------------------------------
   * Segmented LED Bar Renderer
   * ------------------------------------------------------------- */
  _drawSegmentedBar(ctx, x, y, w, h, segments, pct, activeColor, glowColor, inactiveColor) {
    const gap = 2;
    const segW = (w - (segments - 1) * gap) / segments;
    const activeCount = Math.round(pct * segments);

    ctx.save();
    for (let i = 0; i < segments; i++) {
      const sx = x + i * (segW + gap);
      const isActive = i < activeCount;

      if (isActive) {
        ctx.fillStyle = activeColor;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 6;
      } else {
        ctx.fillStyle = inactiveColor;
        ctx.shadowBlur = 0;
      }

      ctx.fillRect(sx, y, segW, h);
    }
    ctx.restore();
  }

  /* -------------------------------------------------------------
   * 3. Cargo Bay & Refined Resources Bay
   * ------------------------------------------------------------- */
  _renderCargoBay(ctx, ship) {
    const w = 240;
    const h = 165;
    const x = this.canvas.width - w - 20;
    const y = 20;

    this._drawCyberPanel(ctx, x, y, w, h, '#00e5ff', 8);

    ctx.save();
    const currentWeight = ship.economy.getTotalCargoWeight();
    const maxCapacity = ship.economy.getMaxCargo();
    const cargoPct = Math.min(1, currentWeight / maxCapacity);

    // Title
    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.fillText(`CARGO BAY // ${currentWeight}/${maxCapacity} T`, x + 14, y + 20);

    ctx.textAlign = 'right';
    ctx.fillStyle = cargoPct >= 1 ? '#ff3322' : '#88aacc';
    ctx.fillText(`${Math.round(cargoPct * 100)}%`, x + w - 14, y + 20);
    ctx.textAlign = 'left';

    // Segmented Capacity Gauge
    const barColor = cargoPct >= 1 ? '#ff3322' : (cargoPct > 0.75 ? '#ffaa33' : '#00e5ff');
    this._drawSegmentedBar(ctx, x + 14, y + 27, w - 28, 6, 12, cargoPct, barColor, barColor, '#102030');

    // Commodity Inventory List with Jewel Badges
    let lineY = y + 54;
    ctx.font = '10px "Courier New", monospace';

    for (const key in ship.economy.inventory) {
      const count = ship.economy.inventory[key];
      const comm = COMMODITIES[key];

      // Diamond jewel indicator
      ctx.fillStyle = comm.color;
      ctx.shadowColor = comm.glowColor || comm.color;
      ctx.shadowBlur = count > 0 ? 6 : 0;
      ctx.fillText('◆', x + 14, lineY);
      ctx.shadowBlur = 0;

      // Name
      ctx.fillStyle = count > 0 ? '#d0e5ff' : '#667788';
      ctx.fillText(comm.name, x + 28, lineY);

      // Amount & Value
      ctx.textAlign = 'right';
      ctx.fillStyle = count > 0 ? comm.color : '#556677';
      const valStr = count > 0 ? `${count} [${count * comm.basePrice}CR]` : '0';
      ctx.fillText(valStr, x + w - 14, lineY);
      ctx.textAlign = 'left';

      lineY += 19;
    }

    ctx.restore();
  }

  /* -------------------------------------------------------------
   * 4. Active Mission Tracker with Multi-phase Blinking Countdown
   * ------------------------------------------------------------- */
  _renderMissionTracker(ctx, missionManager, ship, time) {
    const m = missionManager.activeMission;
    if (!m) return;

    const isReady = missionManager.isReadyToClaim ? missionManager.isReadyToClaim(ship.economy) : (m.currentAmount >= m.targetAmount);
    const timeLeft = Math.max(0, m.timeRemaining);
    const mins = Math.floor(timeLeft / 60);
    const secs = Math.floor(timeLeft % 60);
    const timeStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

    // Urgency phase determination
    let panelColor = '#ffd700';
    let timerColor = '#ffffff';
    let statusLabel = `TIME: ${timeStr}`;
    let isBlinking = false;

    if (isReady) {
      // Mission Complete! Pulsing emerald celebration
      panelColor = '#00ffaa';
      timerColor = Math.sin(time * 6) > 0 ? '#00ffaa' : '#ffffff';
      statusLabel = '★ OBJECTIVE COMPLETE // DOCK FOR PAYOUT ★';
      isBlinking = true;
    } else if (timeLeft <= 30) {
      // CRITICAL EMERGENCY (< 30s) - Rapid 8Hz strobe
      const strobe = Math.floor(time * 8) % 2 === 0;
      panelColor = strobe ? '#ff2233' : '#881122';
      timerColor = strobe ? '#ff2233' : '#ffffff';
      statusLabel = `🚨 CRITICAL TIMER: ${timeStr} 🚨`;
      isBlinking = true;
    } else if (timeLeft <= 60) {
      // WARNING PHASE (30s - 60s) - 2Hz warning blink
      const blink = Math.sin(time * 6) > 0;
      panelColor = blink ? '#ffaa00' : '#885500';
      timerColor = blink ? '#ffaa00' : '#ffffff';
      statusLabel = `⚠️ TIME REMAINING: ${timeStr} ⚠️`;
      isBlinking = true;
    } else {
      // Normal phase (> 60s) - Smooth breathing pulse
      timerColor = '#e0f0ff';
      statusLabel = `TIME REMAINING: ${timeStr}`;
    }

    const w = 245;
    const h = 95;
    const x = this.canvas.width - w - 20;
    const y = 195;

    this._drawCyberPanel(ctx, x, y, w, h, panelColor, 6);

    ctx.save();
    // Header Row with glowing badge
    ctx.fillStyle = panelColor;
    ctx.shadowColor = panelColor;
    ctx.shadowBlur = isBlinking ? 8 : 4;
    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.fillText(isReady ? '★ CONTRACT FULFILLED' : 'CONTRACT IN PROGRESS', x + 14, y + 18);
    ctx.shadowBlur = 0;

    // Mission Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.fillText(m.title, x + 14, y + 33);

    // Progress bar
    const progress = Math.min(1, m.currentAmount / m.targetAmount);
    ctx.fillStyle = '#88aacc';
    ctx.font = '10px "Courier New", monospace';
    ctx.fillText(`PROGRESS: ${m.currentAmount} / ${m.targetAmount}`, x + 14, y + 49);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(x + 14, y + 54, w - 28, 5);
    ctx.fillStyle = isReady ? '#00ffaa' : (timeLeft <= 30 ? '#ff2233' : '#ffd700');
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 5;
    ctx.fillRect(x + 14, y + 54, (w - 28) * progress, 5);
    ctx.shadowBlur = 0;

    // Blinking Countdown Timer Badge
    ctx.fillStyle = timerColor;
    ctx.shadowColor = timerColor;
    ctx.shadowBlur = isBlinking ? 8 : 0;
    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.fillText(statusLabel, x + 14, y + 73);
    ctx.shadowBlur = 0;

    // Payout Reward Chip
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffdd44';
    ctx.fillText(`+${m.rewardCredits} CR`, x + w - 14, y + 73);
    ctx.textAlign = 'left';

    // Subtext reminder
    if (isReady) {
      ctx.fillStyle = '#00ffaa';
      ctx.font = 'bold 8.5px "Courier New", monospace';
      ctx.fillText('RETURN TO AEGIS STARBASE FOR BOUNTY', x + 14, y + 87);
    } else if (timeLeft <= 30) {
      ctx.fillStyle = '#ff4444';
      ctx.font = 'bold 8.5px "Courier New", monospace';
      ctx.fillText('CONTRACT EXPIRING SOON! ACCELERATE!', x + 14, y + 87);
    }

    ctx.restore();
  }

  /* -------------------------------------------------------------
   * 5. Dynamic Holographic Target Lock Reticle
   * ------------------------------------------------------------- */
  _renderTargetReticle(ctx, ship, camera, asteroids, enemies, derelicts) {
    let closestTarget = null;
    let closestDist = 650; // Detection range in world coordinates
    let targetType = 'asteroid';

    // Check enemies first (higher threat priority)
    for (const e of enemies) {
      if (e.isDead) continue;
      const d = ship.pos.dist(e.pos);
      if (d < closestDist) {
        closestDist = d;
        closestTarget = e;
        targetType = 'enemy';
      }
    }

    // Check laser hit asteroid or nearest asteroid
    if (!closestTarget && ship.miningHitAsteroid) {
      closestTarget = ship.miningHitAsteroid;
      closestDist = ship.pos.dist(closestTarget.pos);
      targetType = 'asteroid';
    } else if (!closestTarget) {
      for (const a of asteroids) {
        if (a.isDead) continue;
        const d = ship.pos.dist(a.pos);
        if (d < 380 && d < closestDist) {
          closestDist = d;
          closestTarget = a;
          targetType = 'asteroid';
        }
      }
    }

    if (!closestTarget) return;

    // Project target world position to screen coordinates
    const screenPos = camera.worldToScreen(closestTarget.pos.x, closestTarget.pos.y);
    const rad = (closestTarget.radius || 24) * camera.zoom;
    const boxSize = Math.max(34, rad * 1.3);

    ctx.save();
    ctx.translate(screenPos.x, screenPos.y);

    const isEnemy = targetType === 'enemy';
    const reticleColor = isEnemy ? '#ff2244' : '#00e5ff';
    ctx.strokeStyle = reticleColor;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = reticleColor;
    ctx.shadowBlur = 8;

    // 4 Corner Brackets
    const bLen = 8;
    // Top-Left
    ctx.beginPath();
    ctx.moveTo(-boxSize, -boxSize + bLen); ctx.lineTo(-boxSize, -boxSize); ctx.lineTo(-boxSize + bLen, -boxSize);
    ctx.stroke();

    // Top-Right
    ctx.beginPath();
    ctx.moveTo(boxSize - bLen, -boxSize); ctx.lineTo(boxSize, -boxSize); ctx.lineTo(boxSize, -boxSize + bLen);
    ctx.stroke();

    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(-boxSize, boxSize - bLen); ctx.lineTo(-boxSize, boxSize); ctx.lineTo(-boxSize + bLen, boxSize);
    ctx.stroke();

    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(boxSize - bLen, boxSize); ctx.lineTo(boxSize, boxSize); ctx.lineTo(boxSize, boxSize - bLen);
    ctx.stroke();

    // Target Info Tag
    ctx.shadowBlur = 0;
    ctx.font = 'bold 9px "Courier New", monospace';
    ctx.fillStyle = reticleColor;
    ctx.textAlign = 'center';

    const distM = Math.round(closestDist);
    if (isEnemy) {
      ctx.fillText(`THREAT // PIRATE RAIDER [${distM}M]`, 0, -boxSize - 8);
      // Health bar
      const hpPct = Math.max(0, closestTarget.hull / (closestTarget.maxHull || 60));
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(-25, boxSize + 6, 50, 4);
      ctx.fillStyle = '#ff2244';
      ctx.fillRect(-25, boxSize + 6, 50 * hpPct, 4);
    } else {
      const commName = closestTarget.commodity ? closestTarget.commodity.name.toUpperCase() : 'ORE ROCK';
      const estYield = closestTarget.commodity ? Math.max(1, Math.round(closestTarget.health * 0.12)) * closestTarget.commodity.basePrice : 45;
      ctx.fillText(`TARGET // ${commName} [${distM}M] ~${estYield}CR`, 0, -boxSize - 8);
      // Integrity bar
      const hpPct = Math.max(0, closestTarget.health / closestTarget.maxHealth);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(-25, boxSize + 6, 50, 4);
      ctx.fillStyle = closestTarget.commodity ? closestTarget.commodity.color : '#00e5ff';
      ctx.fillRect(-25, boxSize + 6, 50 * hpPct, 4);
    }

    ctx.restore();
  }

  /* -------------------------------------------------------------
   * 6. Prograde Flight Reticle
   * ------------------------------------------------------------- */
  _renderFlightReticle(ctx, ship, camera) {
    const speed = ship.vel.mag();
    if (speed < 10) return;

    const progradeWorld = ship.pos.copy().add(ship.vel.copy().normalize().mult(65));
    const proScreen = camera.worldToScreen(progradeWorld.x, progradeWorld.y);

    ctx.save();
    ctx.translate(proScreen.x, proScreen.y);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.65)';
    ctx.lineWidth = 1.4;

    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, -6); ctx.lineTo(0, -10);
    ctx.moveTo(-6, 0); ctx.lineTo(-10, 0);
    ctx.moveTo(6, 0);  ctx.lineTo(10, 0);
    ctx.stroke();

    ctx.restore();
  }

  /* -------------------------------------------------------------
   * 7. Tactical Military Radar with Sweeping Beam
   * ------------------------------------------------------------- */
  _renderTacticalRadar(ctx, ship, station, asteroids, enemies, minerals, derelicts = [], blackHole = null) {
    const cx = this.canvas.width - this.radarRadius - 25;
    const cy = this.canvas.height - this.radarRadius - 25;
    const r = this.radarRadius;

    ctx.save();

    // Dark Radar Glass
    ctx.fillStyle = 'rgba(4, 7, 12, 0.94)';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Rotating Radar Sweep Beam (Continuous 360 Scan)
    ctx.save();
    ctx.translate(cx, cy);
    const sweepGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    sweepGrad.addColorStop(0, 'rgba(0, 229, 255, 0.25)');
    sweepGrad.addColorStop(1, 'rgba(0, 229, 255, 0.02)');
    ctx.fillStyle = sweepGrad;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r, this.radarAngle - 0.45, this.radarAngle);
    ctx.closePath();
    ctx.fill();

    // Leading sweep line
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(this.radarAngle) * r, Math.sin(this.radarAngle) * r);
    ctx.stroke();
    ctx.restore();

    // Radar Concentric Range Rings (0.5k, 1.2k)
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.22)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.4, 0, Math.PI * 2);
    ctx.arc(cx, cy, r * 0.75, 0, Math.PI * 2);
    ctx.stroke();

    // Crosshairs & Cardinal Ticks
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.35)';
    ctx.beginPath();
    ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy);
    ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r);
    ctx.stroke();

    // Glowing Neon Coral Perimeter Ring
    ctx.strokeStyle = '#ff3377';
    ctx.lineWidth = 2.2;
    ctx.shadowColor = '#ff2266';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Helper: World to Radar conversion
    const toRadar = (worldPos) => {
      const dx = worldPos.x - ship.pos.x;
      const dy = worldPos.y - ship.pos.y;
      const scale = r / this.radarRange;
      const rx = dx * scale;
      const ry = dy * scale;
      const dist = Math.sqrt(rx * rx + ry * ry);
      if (dist > r - 3) {
        return {
          x: cx + (rx / dist) * (r - 4),
          y: cy + (ry / dist) * (r - 4),
          clamped: true
        };
      }
      return { x: cx + rx, y: cy + ry, clamped: false };
    };

    // 1. Station Blip (Cyan Diamond)
    if (station) {
      const sPos = toRadar(station.pos);
      ctx.fillStyle = '#00ffff';
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(sPos.x, sPos.y - 4);
      ctx.lineTo(sPos.x + 4, sPos.y);
      ctx.lineTo(sPos.x, sPos.y + 4);
      ctx.lineTo(sPos.x - 4, sPos.y);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // 2. Black Hole (Violet Swirl)
    if (blackHole) {
      const bhPos = toRadar(blackHole.pos);
      ctx.strokeStyle = '#aa00ee';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(bhPos.x, bhPos.y, 5, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 3. Derelicts (Amber Squares)
    ctx.fillStyle = '#ffaa00';
    for (const d of derelicts) {
      if (d.salvaged) continue;
      const dPos = toRadar(d.pos);
      ctx.fillRect(dPos.x - 2.5, dPos.y - 2.5, 5, 5);
    }

    // 4. Asteroids (Warm Amber Pips)
    ctx.fillStyle = '#ffaa33';
    for (let i = 0; i < asteroids.length; i++) {
      const ast = asteroids[i];
      if (ast.isDead) continue;
      const p = toRadar(ast.pos);
      if (!p.clamped) {
        const dotSize = ast.radius > 50 ? 2.5 : (ast.radius > 30 ? 1.8 : 1.2);
        ctx.beginPath();
        ctx.arc(p.x, p.y, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 5. Minerals (Glinting Ore)
    for (let i = 0; i < minerals.length; i++) {
      const m = minerals[i];
      if (m.isDead) continue;
      const p = toRadar(m.pos);
      if (!p.clamped) {
        ctx.fillStyle = m.commodity ? m.commodity.color : '#ffffff';
        ctx.fillRect(p.x - 1, p.y - 1, 2.5, 2.5);
      }
    }

    // 6. Enemies (Hostile Red Triangles)
    ctx.fillStyle = '#ff2244';
    ctx.shadowColor = '#ff0022';
    ctx.shadowBlur = 6;
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (e.isDead) continue;
      const p = toRadar(e.pos);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - 3.5);
      ctx.lineTo(p.x + 3.5, p.y + 3.5);
      ctx.lineTo(p.x - 3.5, p.y + 3.5);
      ctx.closePath();
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // 7. Player Craft (Centered Cyan Delta Vector)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(ship.angle);
    ctx.fillStyle = '#00f5ff';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(7, 0);
    ctx.lineTo(-4, -4);
    ctx.lineTo(-2, 0);
    ctx.lineTo(-4, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Radar Sub-Badge
    ctx.save();
    ctx.fillStyle = 'rgba(5, 8, 14, 0.88)';
    ctx.strokeStyle = 'rgba(255, 50, 120, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(cx - 56, cy + r + 5, 112, 18, 4);
    } else {
      ctx.rect(cx - 56, cy + r + 5, 112, 18);
    }
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#b0d8f5';
    ctx.font = 'bold 9px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('RADAR // 2.2KM TACTICAL', cx, cy + r + 17);
    ctx.restore();

    ctx.restore();
  }

  /* -------------------------------------------------------------
   * 8. Dedicated Starbase Waypoint & Directional Distance Beacon
   * ------------------------------------------------------------- */
  _renderStarbaseBeacon(ctx, ship, station, camera, time, missionManager) {
    const dist = ship.pos.dist(station.pos);
    const distStr = dist < 1000 ? `${Math.round(dist)} M` : `${(dist / 1000).toFixed(2)} KM`;

    const isMissionReady = missionManager && missionManager.isReadyToClaim && missionManager.isReadyToClaim(ship.economy);
    const isCargoFull = ship.economy.getTotalCargoWeight() >= ship.economy.getMaxCargo();

    // Check if station center is currently on-screen
    const stationScreen = camera.worldToScreen(station.pos.x, station.pos.y);
    const isOnScreen = (
      stationScreen.x >= 60 &&
      stationScreen.x <= this.canvas.width - 60 &&
      stationScreen.y >= 60 &&
      stationScreen.y <= this.canvas.height - 60
    );

    if (isOnScreen) {
      if (dist < 180) return; // Player is already in docking berth

      // Station is visible on screen: Floating holographic bracket above hub
      ctx.save();
      ctx.translate(stationScreen.x, stationScreen.y);

      const pulse = 0.8 + 0.2 * Math.sin(time * 3);
      const tagColor = isMissionReady ? '#00ffaa' : (isCargoFull ? '#ffaa00' : '#00e5ff');

      ctx.strokeStyle = tagColor;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = tagColor;
      ctx.shadowBlur = 8 * pulse;

      const bracketY = -90;
      ctx.font = 'bold 10px "Courier New", monospace';
      ctx.fillStyle = tagColor;
      ctx.textAlign = 'center';

      let statusMsg = 'AEGIS STARBASE // DOCKING TERMINAL';
      if (isMissionReady) {
        statusMsg = '★ CONTRACT COMPLETE // DOCK FOR PAYOUT ★';
      } else if (isCargoFull) {
        statusMsg = '⚠️ CARGO FULL // DOCK TO REFINE ⚠️';
      }

      ctx.fillText(statusMsg, 0, bracketY - 14);
      ctx.font = 'bold 12px "Courier New", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`[ DISTANCE: ${distStr} ]`, 0, bracketY);

      // Downward pointer arrow
      ctx.fillStyle = tagColor;
      ctx.beginPath();
      ctx.moveTo(0, bracketY + 7);
      ctx.lineTo(-6, bracketY + 1);
      ctx.lineTo(6, bracketY + 1);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    } else {
      // Station is OFF-SCREEN: Edge-clamped directional beacon
      const cx = this.canvas.width * 0.5;
      const cy = this.canvas.height * 0.5;
      const dx = stationScreen.x - cx;
      const dy = stationScreen.y - cy;
      const angle = Math.atan2(dy, dx);

      // Clamping to screen perimeter box with generous margins
      const padX = 100;
      const padY = 75;
      const maxX = cx - padX;
      const maxY = cy - padY;

      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const scaleX = cos !== 0 ? Math.abs(maxX / cos) : Infinity;
      const scaleY = sin !== 0 ? Math.abs(maxY / sin) : Infinity;
      const scale = Math.min(scaleX, scaleY);

      const edgeX = cx + cos * scale;
      const edgeY = cy + sin * scale;

      ctx.save();
      ctx.translate(edgeX, edgeY);

      const pulseSpeed = (isMissionReady || isCargoFull) ? 6 : 3;
      const pulse = 0.75 + 0.25 * Math.sin(time * pulseSpeed);
      const beaconColor = isMissionReady ? '#00ffaa' : (isCargoFull ? '#ffaa00' : '#00e5ff');

      // 1. Directional Arrow Pointer rotated toward station
      ctx.save();
      ctx.rotate(angle);
      ctx.fillStyle = beaconColor;
      ctx.shadowColor = beaconColor;
      ctx.shadowBlur = 12 * pulse;

      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(-9, -9);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-9, 9);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // 2. High-Tech Waypoint Information Card
      const cardW = 165;
      const cardH = 34;
      let cardX = -cardW * 0.5;
      let cardY = -cardH * 0.5;

      if (cos > 0.45) cardX = -cardW - 16;
      else if (cos < -0.45) cardX = 16;
      else if (sin > 0) cardY = -cardH - 16;
      else cardY = 16;

      this._drawCyberPanel(ctx, cardX, cardY, cardW, cardH, beaconColor, 5);

      ctx.textAlign = 'center';
      ctx.font = 'bold 9px "Courier New", monospace';
      ctx.fillStyle = beaconColor;
      ctx.shadowColor = beaconColor;
      ctx.shadowBlur = 4;

      const subLabel = isMissionReady ? '★ CONTRACT READY' : (isCargoFull ? '⚠️ CARGO FULL' : 'DOCKING TERMINAL');
      ctx.fillText(`⬡ AEGIS STARBASE`, cardX + cardW * 0.5, cardY + 13);

      ctx.font = 'bold 11px "Courier New", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${distStr} [${subLabel}]`, cardX + cardW * 0.5, cardY + 27);

      ctx.restore();
    }
  }

  /* -------------------------------------------------------------
   * 9. Docking Approach Guidance Indicator
   * ------------------------------------------------------------- */
  _renderDockingGuidance(ctx, ship, station) {
    const dockStatus = station.canPlayerDock(ship);
    if (!dockStatus.inRange) return;

    const cx = this.canvas.width * 0.5;
    const cy = this.canvas.height - 75;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 13px "Courier New", monospace';

    const safe = dockStatus.safeSpeed;
    const promptText = safe ?
      '[ PRESS (E) TO DOCK AT STARBASE ]' :
      `[ CAUTION: VELOCITY ${Math.round(dockStatus.speed)} M/S (MAX 75 M/S) ]`;

    const boxW = Math.max(380, promptText.length * 9.2 + 40);

    ctx.fillStyle = 'rgba(4, 7, 13, 0.92)';
    ctx.strokeStyle = safe ? '#00f0ff' : '#ff9900';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = 10;

    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(cx - boxW * 0.5, cy - 20, boxW, 30, 6);
    } else {
      ctx.rect(cx - boxW * 0.5, cy - 20, boxW, 30);
    }
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = safe ? '#00ffff' : '#ffaa33';
    ctx.fillText(promptText, cx, cy);
    ctx.restore();
  }
}

/* --- js/ui/StationUI.js --- */
/**
 * StationUI - Holographic Starbase Terminal for Trading, Outfitting, and Repairs
 * Authored by: agency-ui-designer & agency-economy-designer
 */
class StationUI {
  constructor(economy, soundEngine, particleSystem, missionManager) {
    this.economy = economy;
    this.soundEngine = soundEngine;
    this.particleSystem = particleSystem;
    this.missionManager = missionManager;
    this.isOpen = false;
    this.currentTab = 'refinery'; // 'refinery', 'shipyard', 'maintenance', 'missions'
    this.domElement = null;

    this._createDOM();
  }

  _createDOM() {
    const overlay = document.createElement('div');
    overlay.id = 'station-terminal';
    overlay.className = 'station-modal hidden';

    overlay.innerHTML = `
      <div class="terminal-container">
        <div class="terminal-header">
          <div class="terminal-title">
            <h2>AEGIS STARBASE // LOGISTICS TERMINAL</h2>
            <span class="station-status">STATUS: ONLINE // SECURITY GRID ACTIVE</span>
          </div>
          <button id="btn-undock" class="btn-terminal btn-danger">UNDOCK [ESC / E]</button>
        </div>

        <div class="terminal-nav">
          <button class="nav-tab active" data-tab="refinery">ORE REFINERY & MARKET</button>
          <button class="nav-tab" data-tab="shipyard">SHIPYARD OUTFITTING</button>
          <button class="nav-tab" data-tab="missions">MISSION CONTRACTS</button>
          <button class="nav-tab" data-tab="maintenance">DRYDOCK MAINTENANCE</button>
        </div>

        <div class="terminal-body">
          <div id="tab-refinery" class="tab-content active"></div>
          <div id="tab-shipyard" class="tab-content"></div>
          <div id="tab-missions" class="tab-content"></div>
          <div id="tab-maintenance" class="tab-content"></div>
        </div>

        <div class="terminal-footer">
          <div class="footer-credits">ACCOUNT BALANCE: <span id="terminal-credits" class="credits-val">0 CR</span></div>
          <div class="footer-cargo">HOLD USAGE: <span id="terminal-cargo" class="cargo-val">0 / 0 T</span></div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.domElement = overlay;

    // Attach event listeners
    document.getElementById('btn-undock').addEventListener('click', () => this.close());

    const tabs = overlay.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        overlay.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        tab.classList.add('active');
        const targetId = `tab-${tab.dataset.tab}`;
        document.getElementById(targetId).classList.add('active');
        this.currentTab = tab.dataset.tab;
        this.render();
      });
    });
  }

  open(ship) {
    this.isOpen = true;
    this.ship = ship;
    this.domElement.classList.remove('hidden');
    this.soundEngine.playDockSuccess();
    this.render();
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.domElement.classList.add('hidden');
    if (this.ship) {
      this.ship.rechargeShields();
    }
  }

  render() {
    if (!this.isOpen) return;

    // Update Footer Readouts
    document.getElementById('terminal-credits').innerText = `${this.economy.credits} CR`;
    const curWeight = this.economy.getTotalCargoWeight();
    const maxCap = this.economy.getMaxCargo();
    document.getElementById('terminal-cargo').innerText = `${curWeight} / ${maxCap} T (${Math.round((curWeight / maxCap) * 100)}%)`;

    // Render Active Tab Content
    if (this.currentTab === 'refinery') {
      this._renderRefinery();
    } else if (this.currentTab === 'shipyard') {
      this._renderShipyard();
    } else if (this.currentTab === 'missions') {
      this._renderMissions();
    } else if (this.currentTab === 'maintenance') {
      this._renderMaintenance();
    }
  }

  _renderMissions() {
    const container = document.getElementById('tab-missions');
    if (!this.missionManager) {
      container.innerHTML = '<p>No mission dispatcher connected.</p>';
      return;
    }

    const active = this.missionManager.activeMission;
    let activeHtml = '';

    if (active) {
      const ready = this.missionManager.isReadyToClaim(this.economy);
      const mins = Math.floor(active.timeRemaining / 60);
      const secs = Math.floor(active.timeRemaining % 60);
      const timeStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

      activeHtml = `
        <div class="active-mission-banner" style="background: rgba(255, 215, 0, 0.1); border: 2px solid #ffd700; border-radius: 6px; padding: 16px; margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <h4 style="color: #ffd700; font-family: 'Orbitron'; font-size: 14px;">ACTIVE CONTRACT: ${active.title}</h4>
            <span style="color: ${ready ? '#00ffaa' : '#ffaa00'}; font-weight: bold; font-size: 12px;">
              ${ready ? '★ OBJECTIVE COMPLETE' : `TIME: ${timeStr}`}
            </span>
          </div>
          <p style="font-size: 11px; color: #c9d6df; margin-bottom: 12px;">${active.desc}</p>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 12px; color: #88aacc;">
              PROGRESS: <strong style="color: #ffffff;">${active.currentAmount} / ${active.targetAmount}</strong> | REWARD: <strong style="color: #ffdd44;">${active.rewardCredits} CR</strong>
            </div>
            <div style="display: flex; gap: 10px;">
              ${ready ? `
                <button id="btn-claim-mission" class="btn-terminal btn-primary" style="background: #00ffaa; color: #002211; font-weight: bold;">
                  CLAIM PAYOUT (+${active.rewardCredits} CR)
                </button>
              ` : `
                <button id="btn-abandon-mission" class="btn-terminal btn-danger" style="font-size: 10px;">
                  ABANDON CONTRACT
                </button>
              `}
            </div>
          </div>
        </div>
      `;
    }

    let availableListHtml = '';
    const available = this.missionManager.availableMissions;

    for (const m of available) {
      const isAlreadyActive = active && active.id === m.id;
      availableListHtml += `
        <div class="market-row" style="margin-bottom: 10px;">
          <div class="item-info" style="flex: 2;">
            <div>
              <div class="item-name" style="color: #00e5ff;">${m.title}</div>
              <div class="item-desc">${m.desc}</div>
              <div style="font-size: 10px; color: #ffaa00; margin-top: 4px;">TARGET: ${m.targetAmount} | TIME LIMIT: ${Math.round(m.timeLimit / 60)} MINS</div>
            </div>
          </div>
          <div class="item-market" style="text-align: right; padding-right: 20px;">
            <div class="item-price" style="font-size: 13px;">+${m.rewardCredits} CR</div>
          </div>
          <div class="item-actions">
            <button class="btn-terminal btn-accept-mission" data-id="${m.id}" ${isAlreadyActive || active ? 'disabled' : ''}>
              ${isAlreadyActive ? 'ACTIVE' : (active ? 'SLOT BUSY' : 'ACCEPT CONTRACT')}
            </button>
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="refinery-header" style="margin-bottom: 16px;">
        <div>
          <h3>AEGIS STARBASE MISSION DISPATCH</h3>
          <p>Official guild contracts, commercial delivery quotas, and high-value outer rim bounties.</p>
        </div>
      </div>
      ${activeHtml}
      <h4 style="color: #00e5ff; font-family: 'Orbitron'; font-size: 12px; margin-bottom: 12px;">AVAILABLE GUILD BOUNTIES & DELIVERIES</h4>
      <div class="market-list">${availableListHtml}</div>
    `;

    // Hook listeners
    const claimBtn = document.getElementById('btn-claim-mission');
    if (claimBtn) {
      claimBtn.addEventListener('click', () => {
        const rev = this.missionManager.claimReward(this.economy, this.soundEngine, this.particleSystem);
        if (rev > 0) {
          this.render();
        }
      });
    }

    const abandonBtn = document.getElementById('btn-abandon-mission');
    if (abandonBtn) {
      abandonBtn.addEventListener('click', () => {
        this.missionManager.abandonMission();
        this.render();
      });
    }

    container.querySelectorAll('.btn-accept-mission').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        if (this.missionManager.acceptMission(id)) {
          this.soundEngine.playPickup(3);
          this.render();
        }
      });
    });
  }

  _renderRefinery() {
    const container = document.getElementById('tab-refinery');
    let rowsHtml = '';
    let totalCargoValue = 0;

    for (const key in this.economy.inventory) {
      const count = this.economy.inventory[key];
      const comm = COMMODITIES[key];
      const rowVal = count * comm.basePrice;
      totalCargoValue += rowVal;

      rowsHtml += `
        <div class="market-row ${count > 0 ? 'has-stock' : ''}">
          <div class="item-info">
            <span class="ore-dot" style="background: ${comm.color}; box-shadow: 0 0 8px ${comm.glowColor}"></span>
            <div>
              <div class="item-name">${comm.name}</div>
              <div class="item-desc">${comm.desc}</div>
            </div>
          </div>
          <div class="item-market">
            <div class="item-price">${comm.basePrice} CR / T</div>
            <div class="item-qty">In Hold: <strong>${count}</strong></div>
          </div>
          <div class="item-actions">
            <button class="btn-terminal btn-sell" data-key="${key}" ${count <= 0 ? 'disabled' : ''}>
              SELL (${rowVal} CR)
            </button>
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="refinery-header">
        <div>
          <h3>MINERAL REFINERY QUOTATIONS</h3>
          <p>Instant liquidation of raw ore deposits at standard Galactic Guild index rates.</p>
        </div>
        <button id="btn-sell-all" class="btn-terminal btn-primary" ${totalCargoValue <= 0 ? 'disabled' : ''}>
          SELL ALL ORES (+${totalCargoValue} CR)
        </button>
      </div>
      <div class="market-list">${rowsHtml}</div>
    `;

    // Hook Sell Buttons
    container.querySelectorAll('.btn-sell').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const key = e.currentTarget.dataset.key;
        const count = this.economy.inventory[key];
        const rev = this.economy.sellOre(key, count);
        if (rev > 0) {
          this.soundEngine.playPickup(COMMODITIES[key].tier);
          this.render();
        }
      });
    });

    const sellAllBtn = document.getElementById('btn-sell-all');
    if (sellAllBtn) {
      sellAllBtn.addEventListener('click', () => {
        const rev = this.economy.sellAll();
        if (rev > 0) {
          this.soundEngine.playPickup(5);
          this.render();
        }
      });
    }
  }

  _renderShipyard() {
    const container = document.getElementById('tab-shipyard');
    let cardsHtml = '';

    for (const sysKey in UPGRADE_TREES) {
      const tree = UPGRADE_TREES[sysKey];
      const curTier = this.economy.tiers[sysKey];
      const isMax = curTier >= tree.maxTier - 1;
      const nextCost = this.economy.getNextUpgradeCost(sysKey);
      const canAfford = nextCost !== null && this.economy.credits >= nextCost;

      cardsHtml += `
        <div class="upgrade-card">
          <div class="card-header">
            <h4>${tree.name}</h4>
            <span class="tier-badge ${isMax ? 'max-tier' : ''}">MK.${curTier + 1} / MK.${tree.maxTier}</span>
          </div>
          <div class="card-desc">${tree.desc}</div>
          <div class="card-action">
            <div class="cost-tag">${isMax ? 'MAX TIER' : `COST: ${nextCost} CR`}</div>
            <button class="btn-terminal btn-upgrade" data-sys="${sysKey}" ${!canAfford || isMax ? 'disabled' : ''}>
              ${isMax ? 'MAXED' : 'UPGRADE'}
            </button>
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="shipyard-grid">${cardsHtml}</div>
    `;

    container.querySelectorAll('.btn-upgrade').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const sys = e.currentTarget.dataset.sys;
        if (this.economy.buyUpgrade(sys)) {
          this.soundEngine.playPickup(4);
          this.ship.syncStats();
          this.render();
        }
      });
    });
  }

  _renderMaintenance() {
    const container = document.getElementById('tab-maintenance');
    const maxHull = this.ship.hullStats.maxHull;
    const curHull = Math.ceil(this.ship.hull);
    const damage = maxHull - curHull;
    const repairCostPerPoint = 2;
    const totalRepairCost = damage * repairCostPerPoint;
    const canAffordRepair = this.economy.credits >= totalRepairCost && damage > 0;

    container.innerHTML = `
      <div class="maintenance-container">
        <h3>DRYDOCK REPAIRS & RE-ENERGIZATION</h3>
        
        <div class="repair-box">
          <div class="box-stat">
            <span>HULL STRUCTURAL INTEGRITY:</span>
            <strong>${curHull} / ${maxHull} (${Math.round((curHull / maxHull) * 100)}%)</strong>
          </div>
          <div class="box-stat">
            <span>TOTAL REPAIR ESTIMATE:</span>
            <strong>${damage > 0 ? `${totalRepairCost} CR (${damage} PTS @ 2 CR/PT)` : 'NOMINAL (0 DAMAGE)'}</strong>
          </div>
          <button id="btn-repair-hull" class="btn-terminal btn-primary" ${!canAffordRepair ? 'disabled' : ''}>
            REPAIR HULL COMPLETELY (${totalRepairCost} CR)
          </button>
        </div>

        <div class="repair-box">
          <div class="box-stat">
            <span>DEFLECTOR SHIELD CAPACITORS:</span>
            <strong style="color: #00ffff">RECHARGING AUTOMATICALLY AT DOCK</strong>
          </div>
          <p style="color: #88aacc; font-size: 11px;">Starbase safety grid supplies continuous wireless power to docked vessels at zero charge.</p>
        </div>
      </div>
    `;

    const repairBtn = document.getElementById('btn-repair-hull');
    if (repairBtn) {
      repairBtn.addEventListener('click', () => {
        if (canAffordRepair) {
          this.economy.credits -= totalRepairCost;
          this.ship.repair(damage);
          this.soundEngine.playDockSuccess();
          this.render();
        }
      });
    }
  }
}

/* --- js/main.js --- */
/**
 * Solar Drift: Void Miner - Main Orchestration Bootstrap
 * Authored by: agency-agents-orchestrator & agency-senior-developer
 */
class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    // Engine Core
    this.camera = new Camera(this.canvas);
    this.input = new Input(this.canvas);
    this.soundEngine = new SoundEngine();
    this.particleSystem = new ParticleSystem(1500);
    this.spatialHash = new SpatialHash(320);
    this.starfield = new Starfield(8000);

    // Gameplay Systems
    this.economy = new Economy();
    this.missionManager = new MissionManager();
    this.hud = new HUD(this.canvas);
    this.stationUI = new StationUI(this.economy, this.soundEngine, this.particleSystem, this.missionManager);

    // World Entities
    this.station = new Station(0, 0);
    this.blackHole = new BlackHole(2600, -2400);
    this.derelicts = [
      new Derelict(1350, 950, 'USSC VALIANT // DRIFTING PROSPECTOR'),
      new Derelict(-1700, -1350, 'EXPLORER BRAVO // BLACK BOX RETRIEVAL'),
      new Derelict(-950, 2200, 'TITANIC SALVAGE // ABANDONED SKIFF')
    ];
    this.ship = new Ship(0, 180, this.economy);
    this.asteroids = [];
    this.minerals = [];
    this.projectiles = [];
    this.enemies = [];

    // Timers & Spawners
    this.enemySpawnTimer = 10;
    this.maxEnemies = 4;
    this.lastTime = performance.now();
    this.gameState = 'PLAYING'; // 'PLAYING', 'DOCKED', 'GAME_OVER'

    this._setupWindow();
    this._populateAsteroidBelts();
    this._bindAudioUnlock();
  }

  _setupWindow() {
    const resize = () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.camera.resize(this.canvas.width, this.canvas.height);
    };
    window.addEventListener('resize', resize);
    resize();
  }

  _bindAudioUnlock() {
    const unlock = () => {
      this.soundEngine.init();
      this.soundEngine.resume();
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('click', unlock);
    window.addEventListener('keydown', unlock);
  }

  _populateAsteroidBelts() {
    const totalAsteroids = 180;
    const oreProbabilities = [
      { key: 'ferrite', weight: 45 },
      { key: 'silicon', weight: 25 },
      { key: 'titanium', weight: 18 },
      { key: 'platinum', weight: 9 },
      { key: 'quantum', weight: 3 }
    ];

    const pickOre = (distFromCenter) => {
      // Outer rim has much higher chances of rare platinum and quantum shards!
      if (distFromCenter > 2200 && Math.random() < 0.2) return 'quantum';
      if (distFromCenter > 1600 && Math.random() < 0.3) return 'platinum';
      if (distFromCenter > 1000 && Math.random() < 0.35) return 'titanium';

      let rand = Math.random() * 100;
      for (const p of oreProbabilities) {
        if (rand < p.weight) return p.key;
        rand -= p.weight;
      }
      return 'ferrite';
    };

    for (let i = 0; i < totalAsteroids; i++) {
      // Asteroid Ring from radius 600px out to 3800px
      const dist = 600 + Math.random() * 3200;
      const angle = Math.random() * Math.PI * 2;
      const x = Math.cos(angle) * dist;
      const y = Math.sin(angle) * dist;

      const sizeCategory = Math.random();
      let radius = 50;
      let stage = 3;
      if (sizeCategory < 0.45) {
        radius = 20 + Math.random() * 12;
        stage = 1;
      } else if (sizeCategory < 0.8) {
        radius = 35 + Math.random() * 14;
        stage = 2;
      } else {
        radius = 55 + Math.random() * 25;
        stage = 3;
      }

      const oreKey = pickOre(dist);
      this.asteroids.push(new Asteroid(x, y, radius, oreKey, stage));
    }
  }

  start() {
    requestAnimationFrame((t) => this._loop(t));
  }

  _loop(currentTime) {
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1); // Cap delta time
    this.lastTime = currentTime;

    this._update(dt);
    this._render(currentTime * 0.001);

    this.input.postUpdate();
    requestAnimationFrame((t) => this._loop(t));
  }

  _update(dt) {
    // 1. Check for Docking Interactivity
    if (this.input.isDockingRequested()) {
      if (this.gameState === 'DOCKED') {
        this.stationUI.close();
        this.gameState = 'PLAYING';
      } else {
        const dockCheck = this.station.canPlayerDock(this.ship);
        if (dockCheck.canDock) {
          this.gameState = 'DOCKED';
          this.ship.vel.set(0, 0); // Lock ship in station berth
          this.stationUI.open(this.ship);
        }
      }
    }

    // Escape closes station modal if open
    if (this.input.wasJustPressed('Escape') && this.gameState === 'DOCKED') {
      this.stationUI.close();
      this.gameState = 'PLAYING';
    }

    // Sync StationUI state
    if (this.gameState === 'DOCKED' && !this.stationUI.isOpen) {
      this.gameState = 'PLAYING';
    }

    // 2. Update Input & Camera
    this.input.update(this.camera);

    if (this.gameState === 'DOCKED') {
      this.camera.targetZoom = 1.35;
      this.camera.setTarget(this.station.pos.x, this.station.pos.y);
    } else {
      const speed = this.ship.vel.mag();
      this.camera.targetZoom = Math.max(0.75, 1.05 - (speed / 900) * 0.35);
      this.camera.setTarget(this.ship.pos.x, this.ship.pos.y);
    }
    this.camera.update(dt);

    // 3. Update Station, Hazards, Contracts & VFX
    this.station.update(dt);
    this.blackHole.update(dt, this.ship, this.asteroids, this.minerals, this.enemies, this.particleSystem, this.soundEngine, this.camera);
    this.missionManager.update(dt, this.economy, this.particleSystem, this.soundEngine, this.ship.pos);

    // Urgent contract countdown audio alerts (< 30s remaining)
    if (this.missionManager && this.missionManager.activeMission) {
      const m = this.missionManager.activeMission;
      const isReady = this.missionManager.isReadyToClaim(this.economy);
      if (!isReady && m.timeRemaining > 0 && m.timeRemaining <= 30) {
        if (!this.lastMissionWarningTime || performance.now() - this.lastMissionWarningTime > 2800) {
          this.soundEngine.playWarningBeep();
          this.lastMissionWarningTime = performance.now();
        }
      }
    }

    this.particleSystem.update(dt);

    for (const d of this.derelicts) {
      d.update(dt, this.ship, this.particleSystem, this.soundEngine, this.missionManager);
    }

    if (this.gameState === 'PLAYING') {
      // 4. Update Player Ship
      this.ship.update(
        dt,
        this.input,
        this.spatialHash,
        this.projectiles,
        this.particleSystem,
        this.soundEngine,
        this.camera
      );

      // 5. Update Spatial Hash Grid
      this.spatialHash.clear();
      for (const ast of this.asteroids) {
        if (!ast.isDead) this.spatialHash.insert(ast);
      }
      for (const min of this.minerals) {
        if (!min.isDead) this.spatialHash.insert(min);
      }
      for (const en of this.enemies) {
        if (!en.isDead) this.spatialHash.insert(en);
      }
      for (const d of this.derelicts) {
        if (!d.salvaged) this.spatialHash.insert(d);
      }

      // 6. Update Asteroids
      for (let i = this.asteroids.length - 1; i >= 0; i--) {
        const ast = this.asteroids[i];
        ast.update(dt);
        if (ast.isDead) {
          const children = ast.fracture(this.particleSystem, this.soundEngine);
          for (const c of children) {
            if (c.vertices) {
              this.asteroids.push(c);
            } else {
              this.minerals.push(c);
            }
          }
          this.asteroids.splice(i, 1);
        }
      }

      // 7. Update Minerals & Collection
      for (let i = this.minerals.length - 1; i >= 0; i--) {
        const min = this.minerals[i];
        min.update(dt, this.ship);

        // Check if player collects mineral
        const d = min.pos.dist(this.ship.pos);
        if (d < this.ship.radius + min.radius + 14) {
          const added = this.economy.addOre(min.commodityKey, 1);
          if (added > 0) {
            this.soundEngine.playPickup(min.commodity.tier);
            this.particleSystem.addFloatingText(
              `+1 ${min.commodity.name}`,
              min.pos.x,
              min.pos.y - 12,
              min.commodity.color,
              14
            );
            this.minerals.splice(i, 1);
            continue;
          } else {
            // Cargo full warning
            this.particleSystem.addFloatingText('CARGO HOLD FULL!', min.pos.x, min.pos.y - 12, '#ff3322', 12);
          }
        }

        if (min.isDead) {
          this.minerals.splice(i, 1);
        }
      }

      // 8. Update Projectiles & Collisions
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const p = this.projectiles[i];

        if (p instanceof Torpedo) {
          p.update(dt, this.spatialHash, this.particleSystem, this.soundEngine, this.camera);
          if (p.isDead) {
            this.projectiles.splice(i, 1);
          }
          continue;
        }

        p.update(dt);

        if (p.isDead) {
          this.projectiles.splice(i, 1);
          continue;
        }

        // Projectile vs Asteroids
        const nearby = this.spatialHash.query(p.pos.x, p.pos.y, p.radius + 60);
        let hit = false;

        for (const ent of nearby) {
          if (ent.vertices && !ent.isDead) { // Asteroid
            if (p.pos.dist(ent.pos) < ent.radius + p.radius) {
              ent.takeDamage(p.damage);
              this.particleSystem.emitDebris(p.pos.x, p.pos.y, 6, ent.commodity.color, 120);
              this.soundEngine.playImpact(1.2);
              hit = true;
              break;
            }
          } else if (p.source === 'player' && ent instanceof Enemy && !ent.isDead) {
            if (p.pos.dist(ent.pos) < ent.radius + p.radius) {
              ent.takeDamage(p.damage, this.soundEngine, this.particleSystem);
              hit = true;
              break;
            }
          } else if (p.source === 'enemy' && !this.ship.isDead) {
            if (p.pos.dist(this.ship.pos) < this.ship.radius + p.radius) {
              this.ship.takeDamage(p.damage, this.soundEngine, this.particleSystem, this.camera);
              hit = true;
              break;
            }
          }
        }

        if (hit) {
          this.projectiles.splice(i, 1);
        }
      }

      // 9. Update Enemy Raiders
      this._updateEnemies(dt);

      // 10. Ship vs Asteroid Kinetic Bumping
      this._handleShipAsteroidCollisions();

      // 11. Respawn / Game Over Check
      if (this.ship.isDead) {
        if (!this.respawnTimer) this.respawnTimer = 3.5;
        this.respawnTimer -= dt;
        if (this.respawnTimer <= 0) {
          this._respawnPlayer();
        }
      }
    }
  }

  _updateEnemies(dt) {
    this.enemySpawnTimer -= dt;
    if (this.enemySpawnTimer <= 0 && this.enemies.length < this.maxEnemies) {
      this.enemySpawnTimer = 16;
      // Spawn pirate outside station safe perimeter (1800 - 3200px out)
      const spawnDist = 1800 + Math.random() * 1400;
      const angle = Math.random() * Math.PI * 2;
      const tier = Math.random() < 0.6 ? 1 : 2;
      this.enemies.push(new Enemy(Math.cos(angle) * spawnDist, Math.sin(angle) * spawnDist, tier));
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.update(dt, this.ship, this.projectiles, this.particleSystem, this.soundEngine);

      if (e.isDead) {
        this.missionManager.onPirateDestroyed(this.particleSystem, this.ship.pos);
        const loot = e.getLootDrops();
        for (const l of loot) this.minerals.push(l);
        this.enemies.splice(i, 1);
      }
    }
  }

  _handleShipAsteroidCollisions() {
    if (this.ship.isDead) return;

    const nearby = this.spatialHash.query(this.ship.pos.x, this.ship.pos.y, this.ship.radius + 80);
    for (const ent of nearby) {
      if (!ent.vertices || ent.isDead) continue;
      const dist = this.ship.pos.dist(ent.pos);
      const minDist = this.ship.radius + ent.radius * 0.85;

      if (dist < minDist && dist > 0) {
        // Elastic collision response
        const normal = (this.ship.pos.copy().sub(ent.pos)).normalize();
        const overlap = minDist - dist;
        this.ship.pos.add(normal.copy().mult(overlap * 0.8));

        // Impact velocity calculation
        const relVel = this.ship.vel.copy().sub(ent.vel);
        const impulse = relVel.dot(normal);

        if (impulse < 0) {
          this.ship.vel.sub(normal.copy().mult(impulse * 1.5));
          const impactSpeed = Math.abs(impulse);
          if (impactSpeed > 40) {
            const damage = (impactSpeed - 40) * 0.45;
            this.ship.takeDamage(damage, this.soundEngine, this.particleSystem, this.camera);
            ent.takeDamage(damage * 0.5);
          }
        }
      }
    }
  }

  _respawnPlayer() {
    this.respawnTimer = null;
    this.ship.pos.set(0, 180);
    this.ship.vel.set(0, 0);
    this.ship.hull = this.ship.hullStats.maxHull;
    this.ship.shield = this.ship.shieldStats.maxShield;
    this.ship.isDead = false;
    this.particleSystem.addFloatingText('VESSEL RECONSTRUCTED AT STARBASE', 0, 150, '#00ffff', 16);
    this.soundEngine.playDockSuccess();
  }

  _render(time) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 1. World Layer (Transformed by Camera)
    this.camera.apply(this.ctx);

    // Starfield Background & Sector bounds
    this.starfield.render(this.ctx, this.camera, time);

    // Station & Cosmic Hazards
    this.station.render(this.ctx, this.camera);
    this.blackHole.render(this.ctx, this.camera);

    // Derelicts
    for (const d of this.derelicts) {
      d.render(this.ctx, this.camera);
    }

    // Minerals
    for (const min of this.minerals) {
      min.render(this.ctx, this.camera);
    }

    // Asteroids
    for (const ast of this.asteroids) {
      ast.render(this.ctx, this.camera);
    }

    // Enemies
    for (const en of this.enemies) {
      en.render(this.ctx, this.camera);
    }

    // Projectiles
    for (const p of this.projectiles) {
      p.render(this.ctx, this.camera);
    }

    // Player Ship
    this.ship.render(this.ctx, this.camera);

    // VFX Particles & World Floating Text
    this.particleSystem.render(this.ctx);

    this.camera.restore(this.ctx);

    // 2. HUD & Screen UI Overlay (Static Screen coordinates)
    if (this.gameState === 'PLAYING') {
      this.hud.render(
        this.ctx,
        this.ship,
        this.station,
        this.asteroids,
        this.enemies,
        this.minerals,
        this.camera,
        this.missionManager,
        this.derelicts,
        this.blackHole
      );
    } else if (this.ship.isDead) {
      this._renderDeathScreen();
    }
  }

  _renderDeathScreen() {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(20, 0, 0, 0.65)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = '#ff2233';
    this.ctx.font = 'bold 28px "Courier New", monospace';
    this.ctx.shadowColor = '#ff0022';
    this.ctx.shadowBlur = 12;
    this.ctx.fillText('CRITICAL HULL FAILURE', this.canvas.width * 0.5, this.canvas.height * 0.45);

    this.ctx.font = '14px "Courier New", monospace';
    this.ctx.fillStyle = '#ffaaaa';
    this.ctx.fillText('EMERGENCY ESCAPE POD DOCKED TO AEGIS STARBASE...', this.canvas.width * 0.5, this.canvas.height * 0.52);
    this.ctx.fillText('RECONSTRUCTING SHIP...', this.canvas.width * 0.5, this.canvas.height * 0.56);
    this.ctx.restore();
  }
}

// Launch Game safely across all browser ready states
function initSolarDrift() {
  if (window.__solarDriftGame) return;
  const canvas = document.getElementById('game-canvas');
  if (!canvas) {
    setTimeout(initSolarDrift, 50);
    return;
  }
  const game = new Game();
  game.start();
  window.__solarDriftGame = game;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSolarDrift);
} else {
  initSolarDrift();
}

})();
