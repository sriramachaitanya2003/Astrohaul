import { Vector2D } from '../engine/Vector2D.js';

/**
 * Station - Massive orbital starbase with docking bays, market terminal, and safety zone
 * Authored by: agency-game-designer & agency-ui-designer
 */
export class Station {
  constructor(x = 0, y = 0) {
    this.pos = new Vector2D(x, y);
    this.radius = 160;
    this.dockingRadius = 140;
    this.maxDockingSpeed = 75; // Player must approach below 75 m/s to dock safely
    this.angle = 0;
    this.rotSpeed = 0.08;

    this.name = 'AEGIS STARBASE 01';
    this.faction = 'Stellar Mining Guild';

    // Docking beacon strobe
    this.beaconTimer = 0;
    this.beaconState = false;
  }

  update(dt) {
    this.angle += this.rotSpeed * dt;
    this.beaconTimer += dt;
    if (this.beaconTimer >= 0.5) {
      this.beaconTimer = 0;
      this.beaconState = !this.beaconState;
    }
  }

  canPlayerDock(ship) {
    const dist = this.pos.dist(ship.pos);
    const speed = ship.vel.mag();
    const inRange = dist < this.dockingRadius;
    const safeSpeed = speed <= this.maxDockingSpeed;
    return {
      canDock: inRange && safeSpeed,
      inRange,
      safeSpeed,
      speed,
      dist
    };
  }

  render(ctx, camera) {
    if (!camera.isVisible(this.pos.x, this.pos.y, this.radius * 2.2)) return;

    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);

    // 1. Safety Perimeter / Docking Zone Ring
    ctx.strokeStyle = this.beaconState ? 'rgba(0, 240, 255, 0.65)' : 'rgba(0, 240, 255, 0.28)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([12, 10]);
    ctx.beginPath();
    ctx.arc(0, 0, this.dockingRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Rotating Outer Ring & Solar Spindles
    ctx.save();
    ctx.rotate(this.angle);

    const ringRadius = this.radius * 0.72;

    // Outer Habitat Ring (Upper Arc: Electric Ice Cyan, Lower Arc: Radiant Solar Copper)
    // Upper arc (PI to 2*PI across top)
    ctx.strokeStyle = '#00f5ff';
    ctx.lineWidth = 4.5;
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(0, 0, ringRadius, Math.PI, 0);
    ctx.stroke();

    // Lower arc (0 to PI across bottom)
    ctx.strokeStyle = '#ff8833';
    ctx.shadowColor = '#ff6600';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(0, 0, ringRadius, 0, Math.PI);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 4 Structural Cross Spokes at 45 degree diagonals
    ctx.strokeStyle = '#355577';
    ctx.lineWidth = 3.5;
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI * 0.25;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * (ringRadius + 32), Math.sin(a) * (ringRadius + 32));
      ctx.stroke();
    }

    // 4 Rectangular Solar Panel Modules on 45-degree struts
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI * 0.25;
      ctx.save();
      ctx.rotate(a);
      ctx.translate(ringRadius - 10, 0);

      // Solar cell body - solid dark obsidian navy for strong silhouette
      ctx.fillStyle = '#060d18';
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 8;
      ctx.fillRect(-12, -18, 48, 36);
      ctx.strokeRect(-12, -18, 48, 36);

      // Cell division grid
      ctx.strokeStyle = '#1e3e60';
      ctx.lineWidth = 1.2;
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.moveTo(12, -18); ctx.lineTo(12, 18);
      ctx.moveTo(-12, 0); ctx.lineTo(36, 0);
      ctx.stroke();

      ctx.restore();
    }

    ctx.restore();

    // 3. Central Command Hub Core
    ctx.save();
    ctx.rotate(-this.angle * 0.5);

    // Hexagonal Core Chassis
    ctx.fillStyle = '#060a12';
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 3.5;
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const x = Math.cos(a) * 44;
      const y = Math.sin(a) * 44;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Radiant Central Solar Hub Gateway
    ctx.fillStyle = '#ffaa33';
    ctx.shadowColor = '#ff7700';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // 4. Station Labels & Comms Beacon (High-contrast glassmorphic badge)
    ctx.textAlign = 'center';
    ctx.save();
    ctx.fillStyle = 'rgba(6, 10, 16, 0.82)';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(-100, -this.radius * 0.95 - 14, 200, 32, 6);
    } else {
      ctx.rect(-100, -this.radius * 0.95 - 14, 200, 32);
    }
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffbb33';
    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.shadowColor = '#ff8800';
    ctx.shadowBlur = 8;
    ctx.fillText(this.name, 0, -this.radius * 0.95);

    ctx.fillStyle = '#00f0ff';
    ctx.font = '10px "Courier New", monospace';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 6;
    ctx.fillText('[DOCKING TERMINAL ACTIVE]', 0, -this.radius * 0.95 + 13);
    ctx.restore();

    ctx.restore();
  }
}

