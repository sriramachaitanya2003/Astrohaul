import { Vector2D } from '../engine/Vector2D.js';

/**
 * ParticleSystem - High-performance pooled particle engine for VFX and Whimsy
 * Authored by: agency-technical-artist & agency-whimsy-injector
 */
export class ParticleSystem {
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

