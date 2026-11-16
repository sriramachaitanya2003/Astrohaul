import { Vector2D } from './Vector2D.js';

/**
 * Camera - 2D Smooth tracking viewport with dynamic zoom and screen shake
 * Implemented with Whimsy Injector standards for tactile impact
 */
export class Camera {
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

