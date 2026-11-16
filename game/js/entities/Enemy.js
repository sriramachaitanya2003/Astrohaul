import { Vector2D } from '../engine/Vector2D.js';
import { Projectile } from './Projectile.js';
import { Mineral } from './Mineral.js';

/**
 * Enemy - Autonomous Pirate Raider drone interceptor
 * Authored by: agency-game-designer & agency-level-designer
 */
export class Enemy {
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

