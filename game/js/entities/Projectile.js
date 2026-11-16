import { Vector2D } from '../engine/Vector2D.js';

/**
 * Projectile - High-velocity plasma energy bolts for combat
 * Authored by: agency-game-designer & agency-technical-artist
 */
export class Projectile {
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

