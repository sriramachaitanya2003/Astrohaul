import { Vector2D } from '../engine/Vector2D.js';
import { Projectile } from './Projectile.js';
import { Torpedo } from './Torpedo.js';

/**
 * Ship - Player-controlled Newtonian Void Miner Craft
 * Authored by: agency-game-designer, agency-ux-architect & agency-technical-artist
 */
export class Ship {
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

