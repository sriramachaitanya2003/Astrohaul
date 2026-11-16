import { Vector2D } from '../engine/Vector2D.js';
import { COMMODITIES } from '../economy/Economy.js';
import { Mineral } from './Mineral.js';

/**
 * Asteroid - Procedural destructible celestial body with mineral veins
 * Authored by: agency-game-designer & agency-technical-artist
 */
export class Asteroid {
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

