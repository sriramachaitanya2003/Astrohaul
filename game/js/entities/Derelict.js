import { Vector2D } from '../engine/Vector2D.js';
import { Mineral } from './Mineral.js';

/**
 * Derelict - Abandoned exploration vessel adrift in the void with salvageable tech and black box
 * Authored by: agency-level-designer & agency-narrative-designer
 */
export class Derelict {
  constructor(x, y, name = 'USSC NAUTILUS // RECOVERY TARGET') {
    this.pos = new Vector2D(x, y);
    this.vel = new Vector2D((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
    this.angle = Math.random() * Math.PI * 2;
    this.rotSpeed = 0.04;
    this.radius = 32;
    this.name = name;

    this.salvaged = false;
    this.salvageProgress = 0; // 0 to 1
    this.salvageDuration = 2.5; // Requires 2.5s of tractor or close scan
    this.beaconTimer = 0;
    this.beaconOn = false;
    this.scanned = false;
  }

  update(dt, playerShip, particleSystem, soundEngine, missionManager) {
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;
    this.angle += this.rotSpeed * dt;

    this.beaconTimer += dt;
    if (this.beaconTimer > 0.8) {
      this.beaconTimer = 0;
      this.beaconOn = !this.beaconOn;
    }

    if (this.salvaged) return;

    // Check player salvage interaction
    const dist = this.pos.dist(playerShip.pos);
    if (dist < 140 && (playerShip.isTractorActive || dist < 65)) {
      this.salvageProgress += dt / this.salvageDuration;

      // Salvage particle sparks
      if (Math.random() < 0.4) {
        particleSystem.emit({
          x: this.pos.x + (Math.random() - 0.5) * 30,
          y: this.pos.y + (Math.random() - 0.5) * 30,
          vx: (playerShip.pos.x - this.pos.x) * 1.5,
          vy: (playerShip.pos.y - this.pos.y) * 1.5,
          size: 2,
          life: 0.4,
          color: '#00ffff'
        });
      }

      if (this.salvageProgress >= 1.0) {
        this.salvaged = true;
        soundEngine.playSalvage();
        particleSystem.emitExplosion(this.pos.x, this.pos.y, false);
        particleSystem.addFloatingText('DERELICT TELEMETRY & CACHE SECURED! +350 CR', this.pos.x, this.pos.y - 30, '#00ffff', 15);
        playerShip.economy.credits += 350;

        // Drop bonus rare minerals
        playerShip.economy.addOre('titanium', 2);
        playerShip.economy.addOre('quantum', 1);

        if (missionManager) {
          missionManager.onDerelictSalvaged(particleSystem, playerShip.pos);
        }
      }
    } else {
      this.salvageProgress = Math.max(0, this.salvageProgress - dt * 0.5);
    }
  }

  render(ctx, camera) {
    if (!camera.isVisible(this.pos.x, this.pos.y, 60)) return;

    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    ctx.rotate(this.angle);

    // Derelict ship skeleton geometry
    ctx.fillStyle = this.salvaged ? '#141820' : '#1e2838';
    ctx.strokeStyle = this.salvaged ? '#334455' : (this.scanned ? '#00e5ff' : '#6688aa');
    ctx.lineWidth = 2;

    // Damaged hull
    ctx.beginPath();
    ctx.moveTo(28, 0);
    ctx.lineTo(8, -18);
    ctx.lineTo(-24, -14);
    ctx.lineTo(-18, 0);
    ctx.lineTo(-24, 14);
    ctx.lineTo(8, 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Fractured structural ribs
    ctx.strokeStyle = '#445566';
    ctx.beginPath();
    ctx.moveTo(-10, -12); ctx.lineTo(-10, 12);
    ctx.moveTo(2, -14); ctx.lineTo(2, 14);
    ctx.stroke();

    // Emergency Distress Beacon
    if (!this.salvaged && this.beaconOn) {
      ctx.fillStyle = '#ff8800';
      ctx.shadowColor = '#ff6600';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(4, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.restore();

    // Salvage progress arc
    if (!this.salvaged && this.salvageProgress > 0) {
      ctx.save();
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, 42, -Math.PI * 0.5, -Math.PI * 0.5 + Math.PI * 2 * this.salvageProgress);
      ctx.stroke();

      ctx.fillStyle = '#00ffff';
      ctx.font = 'bold 10px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`SALVAGING ${Math.round(this.salvageProgress * 100)}%`, this.pos.x, this.pos.y - 48);
      ctx.restore();
    } else if (!this.salvaged) {
      ctx.fillStyle = '#ffaa00';
      ctx.font = '10px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[DISTRESS BEACON]', this.pos.x, this.pos.y - 36);
    }
  }
}

