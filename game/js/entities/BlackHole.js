import { Vector2D } from '../engine/Vector2D.js';
import { Mineral } from './Mineral.js';

/**
 * BlackHole - Gravitational cosmic anomaly with accretion disk, spacetime shear, and exotic matter
 * Authored by: agency-game-designer & agency-technical-artist
 */
export class BlackHole {
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

