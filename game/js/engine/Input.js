import { Vector2D } from './Vector2D.js';

/**
 * Input - Unified Keyboard & Mouse state management with world-coordinate tracking
 */
export class Input {
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

