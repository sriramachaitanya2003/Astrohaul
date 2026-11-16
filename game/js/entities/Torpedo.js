import { Vector2D } from '../engine/Vector2D.js';

/**
 * Torpedo - Heavy guided homing ordnance with thrust trails and area-of-effect detonation
 * Authored by: agency-game-designer & agency-technical-artist
 */
export class Torpedo {
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

