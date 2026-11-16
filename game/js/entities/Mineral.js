import { Vector2D } from '../engine/Vector2D.js';
import { COMMODITIES } from '../economy/Economy.js';

/**
 * Mineral - Harvestable ore crystal drifting in the void
 * Authored by: agency-game-designer & agency-technical-artist
 */
export class Mineral {
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

