import { COMMODITIES } from '../economy/Economy.js';
import { Vector2D } from '../engine/Vector2D.js';

/**
 * HUD - Next-Gen Diegetic Sci-Fi Cockpit Avionics & Tactical Display
 * Features Segmented LED Gauges, Top Telemetry Ribbon, Real-time Target Lock Reticle,
 * Sweeping Radar Scanner, and Integrated Tactical Systems Array.
 * Authored by: agency-ui-designer, agency-ux-architect & agency-senior-developer
 */
export class HUD {
  constructor(canvas) {
    this.canvas = canvas;
    this.radarRadius = 80;
    this.radarRange = 2200; // World units displayed on radar
    this.radarAngle = 0;   // Sweeping radar scan line angle
  }

  render(ctx, ship, station, asteroids, enemies, minerals, camera, missionManager, derelicts = [], blackHole = null) {
    if (!ship || ship.isDead) return;

    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.shadowBlur = 0;

    const time = performance.now() * 0.001;
    this.radarAngle = (this.radarAngle + 0.04) % (Math.PI * 2);

    // 1. Top-Center Sector Navigation & Telemetry Ribbon with Starbase Telemetry
    this._renderSectorRibbon(ctx, ship, station, time);

    // 2. Autopilot Engaged Cockpit Banner (If active)
    if (ship.autopilot) {
      this._renderAutopilotBanner(ctx, ship, station, time);
    }

    // 3. Cargo Bay Full Alert Banner
    this._renderCargoAlert(ctx, ship, time);

    // 4. Top-Left: Unified Cockpit Avionics (Shields, Hull, Telemetry, Abilities)
    this._renderAvionicsHub(ctx, ship, time);

    // 5. Top-Right: Cargo Bay & Refined Resources Bay
    this._renderCargoBay(ctx, ship);

    // 6. Active Mission Contract Tracker with Multi-tier Blinking Timer (Below Cargo)
    if (missionManager && missionManager.activeMission) {
      this._renderMissionTracker(ctx, missionManager, ship, time);
    }

    // 7. Dynamic Holographic Target Lock Reticle
    this._renderTargetReticle(ctx, ship, camera, asteroids, enemies, derelicts);

    // 8. Prograde Flight Reticle
    this._renderFlightReticle(ctx, ship, camera);

    // 9. Dedicated Starbase Waypoint & Directional Distance Beacon
    if (station) {
      this._renderStarbaseBeacon(ctx, ship, station, camera, time, missionManager);
    }

    // 10. Bottom-Right: Military Tactical Sonar Radar (With Sweeping Scanline)
    this._renderTacticalRadar(ctx, ship, station, asteroids, enemies, minerals, derelicts, blackHole);

    // 11. Docking Approach Guidance Indicator
    if (station) {
      this._renderDockingGuidance(ctx, ship, station);
    }

    ctx.restore();
  }

  /* -------------------------------------------------------------
   * Chamfered High-Tech Sci-Fi Glassmorphic Frame
   * ------------------------------------------------------------- */
  _drawCyberPanel(ctx, x, y, w, h, strokeColor = '#00e5ff', cornerSize = 10) {
    ctx.save();
    // Deep dark obsidian backing for 100% legibility over space
    ctx.fillStyle = 'rgba(5, 8, 14, 0.92)';
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = strokeColor;
    ctx.shadowBlur = 8;

    // Chamfered sci-fi path
    ctx.beginPath();
    ctx.moveTo(x + cornerSize, y);
    ctx.lineTo(x + w - cornerSize, y);
    ctx.lineTo(x + w, y + cornerSize);
    ctx.lineTo(x + w, y + h - cornerSize);
    ctx.lineTo(x + w - cornerSize, y + h);
    ctx.lineTo(x + cornerSize, y + h);
    ctx.lineTo(x, y + h - cornerSize);
    ctx.lineTo(x, y + cornerSize);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Corner decorative accent ticks
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1.2;
    ctx.shadowBlur = 0;

    // Top-Left notch
    ctx.beginPath();
    ctx.moveTo(x, y + 14); ctx.lineTo(x, y + cornerSize); ctx.lineTo(x + cornerSize, y); ctx.lineTo(x + 14, y);
    ctx.stroke();

    // Bottom-Right notch
    ctx.beginPath();
    ctx.moveTo(x + w - 14, y + h); ctx.lineTo(x + w - cornerSize, y + h); ctx.lineTo(x + w, y + h - cornerSize); ctx.lineTo(x + w, y + h - 14);
    ctx.stroke();

    ctx.restore();
  }

  /* -------------------------------------------------------------
   * 1. Top Sector Ribbon with Starbase Distance & Compass
   * ------------------------------------------------------------- */
  _renderSectorRibbon(ctx, ship, station, time) {
    const w = 530;
    const h = 28;
    const x = this.canvas.width * 0.5 - w * 0.5;
    const y = 14;

    this._drawCyberPanel(ctx, x, y, w, h, 'rgba(0, 229, 255, 0.45)', 6);

    ctx.save();
    // Blinking status pip
    const blink = Math.sin(time * 3) > 0;
    ctx.fillStyle = blink ? '#00ffaa' : '#00aa66';
    ctx.shadowColor = '#00ffaa';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(x + 16, y + 14, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Sector Title & Telemetry
    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.fillStyle = '#00e5ff';
    ctx.fillText('SECTOR 04 // AEGIS BELT', x + 26, y + 18);

    ctx.fillStyle = '#88aacc';
    const gridX = Math.round(ship.pos.x / 10);
    const gridY = Math.round(ship.pos.y / 10);
    ctx.fillText(`[${gridX}, ${gridY}]`, x + 195, y + 18);

    // Live Starbase distance and bearing compass
    if (station) {
      const dist = ship.pos.dist(station.pos);
      const distStr = dist < 1000 ? `${Math.round(dist)}M` : `${(dist / 1000).toFixed(1)}KM`;
      const toHome = station.pos.copy().sub(ship.pos);
      let angleToHome = Math.atan2(toHome.y, toHome.x) - ship.angle;
      while (angleToHome < -Math.PI) angleToHome += Math.PI * 2;
      while (angleToHome > Math.PI) angleToHome -= Math.PI * 2;
      const deg = Math.round((angleToHome * 180) / Math.PI);
      const arrow = Math.abs(deg) < 20 ? '▲' : (deg > 0 ? '►' : '◄');

      ctx.fillStyle = dist < 220 ? '#00ffaa' : '#ffd700';
      ctx.fillText(`STARBASE: ${distStr} [${arrow} ${deg > 0 ? '+' : ''}${deg}°]`, x + 270, y + 18);
    }

    ctx.fillStyle = ship.autopilot ? '#00ffaa' : '#ffaa33';
    ctx.textAlign = 'right';
    ctx.fillText(ship.autopilot ? 'AUTOPILOT: ON' : 'PATROL', x + w - 16, y + 18);
    ctx.restore();
  }

  /* -------------------------------------------------------------
   * 1B. Autopilot Cockpit Banner
   * ------------------------------------------------------------- */
  _renderAutopilotBanner(ctx, ship, station, time) {
    const w = 500;
    const h = 26;
    const x = this.canvas.width * 0.5 - w * 0.5;
    const y = 46;

    const pulse = 0.8 + 0.2 * Math.sin(time * 6);
    this._drawCyberPanel(ctx, x, y, w, h, '#00ffaa', 5);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.fillStyle = '#00ffaa';
    ctx.shadowColor = '#00ffaa';
    ctx.shadowBlur = 8 * pulse;

    const dist = station ? ship.pos.dist(station.pos) : 0;
    const distStr = dist < 1000 ? `${Math.round(dist)} M` : `${(dist / 1000).toFixed(1)} KM`;

    ctx.fillText(`✈️ AUTOPILOT ACTIVE // HOMING STARBASE (${distStr}) - PRESS [G] OR WASD TO CANCEL`, this.canvas.width * 0.5, y + 17);
    ctx.restore();
  }

  /* -------------------------------------------------------------
   * 1C. Cargo Bay Alert Banner
   * ------------------------------------------------------------- */
  _renderCargoAlert(ctx, ship, time) {
    const cur = ship.economy.getTotalCargoWeight();
    const max = ship.economy.getMaxCargo();
    if (cur < max) return;

    const w = 440;
    const h = 24;
    const x = this.canvas.width * 0.5 - w * 0.5;
    const y = ship.autopilot ? 76 : 46;

    const strobe = Math.floor(time * 3) % 2 === 0;
    const alertColor = strobe ? '#ffaa00' : '#ff4422';

    ctx.save();
    ctx.fillStyle = 'rgba(15, 6, 4, 0.9)';
    ctx.strokeStyle = alertColor;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = alertColor;
    ctx.shadowBlur = 8;

    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(x, y, w, h, 4);
    } else {
      ctx.rect(x, y, w, h);
    }
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.fillStyle = alertColor;
    ctx.fillText(`⚠️ CARGO BAY FULL [${cur}/${max} T] // RETURN TO STARBASE TO REFINE ORE ⚠️`, this.canvas.width * 0.5, y + 16);
    ctx.restore();
  }

  /* -------------------------------------------------------------
   * 2. Unified Avionics Hub (Diagnostics, Telemetry, Abilities)
   * ------------------------------------------------------------- */
  _renderAvionicsHub(ctx, ship, time) {
    const x = 20;
    const y = 20;
    const w = 265;
    const h = 210;

    this._drawCyberPanel(ctx, x, y, w, h, '#00e5ff', 8);

    ctx.save();
    // Header Row
    ctx.fillStyle = '#00ffaa';
    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.fillText('● ONLINE', x + 14, y + 20);

    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.fillText('VOID PROSPECTOR // MK.I', x + 76, y + 20);

    // --- Shield Segmented LED Meter ---
    const shieldMax = ship.shieldStats.maxShield;
    const shieldCur = Math.ceil(ship.shield);
    const shieldPct = Math.max(0, Math.min(1, ship.shield / shieldMax));

    ctx.fillStyle = '#88b0d0';
    ctx.font = '10px "Courier New", monospace';
    ctx.fillText(`SHIELDS`, x + 14, y + 38);
    ctx.textAlign = 'right';
    ctx.fillText(`${shieldCur}/${shieldMax}`, x + w - 14, y + 38);
    ctx.textAlign = 'left';

    this._drawSegmentedBar(ctx, x + 14, y + 43, w - 28, 8, 10, shieldPct, '#00f5ff', '#0099cc', '#102030');

    // --- Hull Segmented LED Meter ---
    const hullMax = ship.hullStats.maxHull;
    const hullCur = Math.ceil(ship.hull);
    const hullPct = Math.max(0, Math.min(1, ship.hull / hullMax));
    const hullColor = hullPct < 0.3 ? '#ff3322' : '#ff9933';
    const hullGlow = hullPct < 0.3 ? '#ff1100' : '#ff7700';

    ctx.fillStyle = '#c09870';
    ctx.fillText(`HULL`, x + 14, y + 66);
    ctx.textAlign = 'right';
    ctx.fillText(`${hullCur}/${hullMax}`, x + w - 14, y + 66);
    ctx.textAlign = 'left';

    this._drawSegmentedBar(ctx, x + 14, y + 71, w - 28, 8, 10, hullPct, hullColor, hullGlow, '#241410');

    // --- Telemetry Row (Credits, Velocity, Flight Assist) ---
    const speed = Math.round(ship.vel.mag());
    ctx.fillStyle = 'rgba(2, 6, 12, 0.75)';
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 14, y + 87, w - 28, 28);
    ctx.fillRect(x + 14, y + 87, w - 28, 28);

    ctx.fillStyle = '#ffd744';
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.fillText(`CR: ${ship.economy.credits}`, x + 20, y + 105);

    ctx.fillStyle = '#c5dff5';
    ctx.fillText(`VEL: ${speed}M/S`, x + 115, y + 105);

    ctx.fillStyle = ship.inertialDampeners ? '#00ffaa' : '#ff8833';
    ctx.fillText(`FA: ${ship.inertialDampeners ? 'ON' : 'OFF'}`, x + 205, y + 105);

    // --- Tactical Systems Cooldowns ---
    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.fillText('// TACTICAL SYSTEMS', x + 14, y + 132);

    const abilities = [
      { key: '[Q] SONAR', cd: ship.scannerCooldown, maxCd: 6.0, color: '#00ffff' },
      { key: '[C] EMP', cd: ship.empCooldown, maxCd: 12.0, color: '#b844ff' },
      { key: '[R] TORP', cd: ship.torpedoCooldown, maxCd: 4.5, color: '#ff7722' }
    ];

    let abY = y + 148;
    for (const a of abilities) {
      const isReady = a.cd <= 0;
      ctx.fillStyle = isReady ? a.color : '#667788';
      ctx.font = '10px "Courier New", monospace';
      ctx.fillText(a.key, x + 14, abY);

      const statusText = isReady ? 'READY' : `${a.cd.toFixed(1)}S`;
      ctx.textAlign = 'right';
      ctx.fillStyle = isReady ? '#00ffaa' : '#88aacc';
      ctx.fillText(statusText, x + w - 14, abY);
      ctx.textAlign = 'left';

      // Mini bar
      const pct = Math.max(0, 1 - a.cd / a.maxCd);
      ctx.fillStyle = '#0c1622';
      ctx.fillRect(x + 90, abY - 7, 95, 5);
      ctx.fillStyle = isReady ? a.color : '#335577';
      ctx.shadowColor = a.color;
      ctx.shadowBlur = isReady ? 6 : 0;
      ctx.fillRect(x + 90, abY - 7, 95 * pct, 5);
      ctx.shadowBlur = 0;

      abY += 18;
    }

    ctx.restore();
  }

  /* -------------------------------------------------------------
   * Segmented LED Bar Renderer
   * ------------------------------------------------------------- */
  _drawSegmentedBar(ctx, x, y, w, h, segments, pct, activeColor, glowColor, inactiveColor) {
    const gap = 2;
    const segW = (w - (segments - 1) * gap) / segments;
    const activeCount = Math.round(pct * segments);

    ctx.save();
    for (let i = 0; i < segments; i++) {
      const sx = x + i * (segW + gap);
      const isActive = i < activeCount;

      if (isActive) {
        ctx.fillStyle = activeColor;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 6;
      } else {
        ctx.fillStyle = inactiveColor;
        ctx.shadowBlur = 0;
      }

      ctx.fillRect(sx, y, segW, h);
    }
    ctx.restore();
  }

  /* -------------------------------------------------------------
   * 3. Cargo Bay & Refined Resources Bay
   * ------------------------------------------------------------- */
  _renderCargoBay(ctx, ship) {
    const w = 240;
    const h = 165;
    const x = this.canvas.width - w - 20;
    const y = 20;

    this._drawCyberPanel(ctx, x, y, w, h, '#00e5ff', 8);

    ctx.save();
    const currentWeight = ship.economy.getTotalCargoWeight();
    const maxCapacity = ship.economy.getMaxCargo();
    const cargoPct = Math.min(1, currentWeight / maxCapacity);

    // Title
    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.fillText(`CARGO BAY // ${currentWeight}/${maxCapacity} T`, x + 14, y + 20);

    ctx.textAlign = 'right';
    ctx.fillStyle = cargoPct >= 1 ? '#ff3322' : '#88aacc';
    ctx.fillText(`${Math.round(cargoPct * 100)}%`, x + w - 14, y + 20);
    ctx.textAlign = 'left';

    // Segmented Capacity Gauge
    const barColor = cargoPct >= 1 ? '#ff3322' : (cargoPct > 0.75 ? '#ffaa33' : '#00e5ff');
    this._drawSegmentedBar(ctx, x + 14, y + 27, w - 28, 6, 12, cargoPct, barColor, barColor, '#102030');

    // Commodity Inventory List with Jewel Badges
    let lineY = y + 54;
    ctx.font = '10px "Courier New", monospace';

    for (const key in ship.economy.inventory) {
      const count = ship.economy.inventory[key];
      const comm = COMMODITIES[key];

      // Diamond jewel indicator
      ctx.fillStyle = comm.color;
      ctx.shadowColor = comm.glowColor || comm.color;
      ctx.shadowBlur = count > 0 ? 6 : 0;
      ctx.fillText('◆', x + 14, lineY);
      ctx.shadowBlur = 0;

      // Name
      ctx.fillStyle = count > 0 ? '#d0e5ff' : '#667788';
      ctx.fillText(comm.name, x + 28, lineY);

      // Amount & Value
      ctx.textAlign = 'right';
      ctx.fillStyle = count > 0 ? comm.color : '#556677';
      const valStr = count > 0 ? `${count} [${count * comm.basePrice}CR]` : '0';
      ctx.fillText(valStr, x + w - 14, lineY);
      ctx.textAlign = 'left';

      lineY += 19;
    }

    ctx.restore();
  }

  /* -------------------------------------------------------------
   * 4. Active Mission Tracker with Multi-phase Blinking Countdown
   * ------------------------------------------------------------- */
  _renderMissionTracker(ctx, missionManager, ship, time) {
    const m = missionManager.activeMission;
    if (!m) return;

    const isReady = missionManager.isReadyToClaim ? missionManager.isReadyToClaim(ship.economy) : (m.currentAmount >= m.targetAmount);
    const timeLeft = Math.max(0, m.timeRemaining);
    const mins = Math.floor(timeLeft / 60);
    const secs = Math.floor(timeLeft % 60);
    const timeStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

    // Urgency phase determination
    let panelColor = '#ffd700';
    let timerColor = '#ffffff';
    let statusLabel = `TIME: ${timeStr}`;
    let isBlinking = false;

    if (isReady) {
      // Mission Complete! Pulsing emerald celebration
      panelColor = '#00ffaa';
      timerColor = Math.sin(time * 6) > 0 ? '#00ffaa' : '#ffffff';
      statusLabel = '★ OBJECTIVE COMPLETE // DOCK FOR PAYOUT ★';
      isBlinking = true;
    } else if (timeLeft <= 30) {
      // CRITICAL EMERGENCY (< 30s) - Rapid 8Hz strobe
      const strobe = Math.floor(time * 8) % 2 === 0;
      panelColor = strobe ? '#ff2233' : '#881122';
      timerColor = strobe ? '#ff2233' : '#ffffff';
      statusLabel = `🚨 CRITICAL TIMER: ${timeStr} 🚨`;
      isBlinking = true;
    } else if (timeLeft <= 60) {
      // WARNING PHASE (30s - 60s) - 2Hz warning blink
      const blink = Math.sin(time * 6) > 0;
      panelColor = blink ? '#ffaa00' : '#885500';
      timerColor = blink ? '#ffaa00' : '#ffffff';
      statusLabel = `⚠️ TIME REMAINING: ${timeStr} ⚠️`;
      isBlinking = true;
    } else {
      // Normal phase (> 60s) - Smooth breathing pulse
      timerColor = '#e0f0ff';
      statusLabel = `TIME REMAINING: ${timeStr}`;
    }

    const w = 245;
    const h = 95;
    const x = this.canvas.width - w - 20;
    const y = 195;

    this._drawCyberPanel(ctx, x, y, w, h, panelColor, 6);

    ctx.save();
    // Header Row with glowing badge
    ctx.fillStyle = panelColor;
    ctx.shadowColor = panelColor;
    ctx.shadowBlur = isBlinking ? 8 : 4;
    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.fillText(isReady ? '★ CONTRACT FULFILLED' : 'CONTRACT IN PROGRESS', x + 14, y + 18);
    ctx.shadowBlur = 0;

    // Mission Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.fillText(m.title, x + 14, y + 33);

    // Progress bar
    const progress = Math.min(1, m.currentAmount / m.targetAmount);
    ctx.fillStyle = '#88aacc';
    ctx.font = '10px "Courier New", monospace';
    ctx.fillText(`PROGRESS: ${m.currentAmount} / ${m.targetAmount}`, x + 14, y + 49);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(x + 14, y + 54, w - 28, 5);
    ctx.fillStyle = isReady ? '#00ffaa' : (timeLeft <= 30 ? '#ff2233' : '#ffd700');
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 5;
    ctx.fillRect(x + 14, y + 54, (w - 28) * progress, 5);
    ctx.shadowBlur = 0;

    // Blinking Countdown Timer Badge
    ctx.fillStyle = timerColor;
    ctx.shadowColor = timerColor;
    ctx.shadowBlur = isBlinking ? 8 : 0;
    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.fillText(statusLabel, x + 14, y + 73);
    ctx.shadowBlur = 0;

    // Payout Reward Chip
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffdd44';
    ctx.fillText(`+${m.rewardCredits} CR`, x + w - 14, y + 73);
    ctx.textAlign = 'left';

    // Subtext reminder
    if (isReady) {
      ctx.fillStyle = '#00ffaa';
      ctx.font = 'bold 8.5px "Courier New", monospace';
      ctx.fillText('RETURN TO AEGIS STARBASE FOR BOUNTY', x + 14, y + 87);
    } else if (timeLeft <= 30) {
      ctx.fillStyle = '#ff4444';
      ctx.font = 'bold 8.5px "Courier New", monospace';
      ctx.fillText('CONTRACT EXPIRING SOON! ACCELERATE!', x + 14, y + 87);
    }

    ctx.restore();
  }

  /* -------------------------------------------------------------
   * 5. Dynamic Holographic Target Lock Reticle
   * ------------------------------------------------------------- */
  _renderTargetReticle(ctx, ship, camera, asteroids, enemies, derelicts) {
    let closestTarget = null;
    let closestDist = 650; // Detection range in world coordinates
    let targetType = 'asteroid';

    // Check enemies first (higher threat priority)
    for (const e of enemies) {
      if (e.isDead) continue;
      const d = ship.pos.dist(e.pos);
      if (d < closestDist) {
        closestDist = d;
        closestTarget = e;
        targetType = 'enemy';
      }
    }

    // Check laser hit asteroid or nearest asteroid
    if (!closestTarget && ship.miningHitAsteroid) {
      closestTarget = ship.miningHitAsteroid;
      closestDist = ship.pos.dist(closestTarget.pos);
      targetType = 'asteroid';
    } else if (!closestTarget) {
      for (const a of asteroids) {
        if (a.isDead) continue;
        const d = ship.pos.dist(a.pos);
        if (d < 380 && d < closestDist) {
          closestDist = d;
          closestTarget = a;
          targetType = 'asteroid';
        }
      }
    }

    if (!closestTarget) return;

    // Project target world position to screen coordinates
    const screenPos = camera.worldToScreen(closestTarget.pos.x, closestTarget.pos.y);
    const rad = (closestTarget.radius || 24) * camera.zoom;
    const boxSize = Math.max(34, rad * 1.3);

    ctx.save();
    ctx.translate(screenPos.x, screenPos.y);

    const isEnemy = targetType === 'enemy';
    const reticleColor = isEnemy ? '#ff2244' : '#00e5ff';
    ctx.strokeStyle = reticleColor;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = reticleColor;
    ctx.shadowBlur = 8;

    // 4 Corner Brackets
    const bLen = 8;
    // Top-Left
    ctx.beginPath();
    ctx.moveTo(-boxSize, -boxSize + bLen); ctx.lineTo(-boxSize, -boxSize); ctx.lineTo(-boxSize + bLen, -boxSize);
    ctx.stroke();

    // Top-Right
    ctx.beginPath();
    ctx.moveTo(boxSize - bLen, -boxSize); ctx.lineTo(boxSize, -boxSize); ctx.lineTo(boxSize, -boxSize + bLen);
    ctx.stroke();

    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(-boxSize, boxSize - bLen); ctx.lineTo(-boxSize, boxSize); ctx.lineTo(-boxSize + bLen, boxSize);
    ctx.stroke();

    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(boxSize - bLen, boxSize); ctx.lineTo(boxSize, boxSize); ctx.lineTo(boxSize, boxSize - bLen);
    ctx.stroke();

    // Target Info Tag
    ctx.shadowBlur = 0;
    ctx.font = 'bold 9px "Courier New", monospace';
    ctx.fillStyle = reticleColor;
    ctx.textAlign = 'center';

    const distM = Math.round(closestDist);
    if (isEnemy) {
      ctx.fillText(`THREAT // PIRATE RAIDER [${distM}M]`, 0, -boxSize - 8);
      // Health bar
      const hpPct = Math.max(0, closestTarget.hull / (closestTarget.maxHull || 60));
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(-25, boxSize + 6, 50, 4);
      ctx.fillStyle = '#ff2244';
      ctx.fillRect(-25, boxSize + 6, 50 * hpPct, 4);
    } else {
      const commName = closestTarget.commodity ? closestTarget.commodity.name.toUpperCase() : 'ORE ROCK';
      const estYield = closestTarget.commodity ? Math.max(1, Math.round(closestTarget.health * 0.12)) * closestTarget.commodity.basePrice : 45;
      ctx.fillText(`TARGET // ${commName} [${distM}M] ~${estYield}CR`, 0, -boxSize - 8);
      // Integrity bar
      const hpPct = Math.max(0, closestTarget.health / closestTarget.maxHealth);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(-25, boxSize + 6, 50, 4);
      ctx.fillStyle = closestTarget.commodity ? closestTarget.commodity.color : '#00e5ff';
      ctx.fillRect(-25, boxSize + 6, 50 * hpPct, 4);
    }

    ctx.restore();
  }

  /* -------------------------------------------------------------
   * 6. Prograde Flight Reticle
   * ------------------------------------------------------------- */
  _renderFlightReticle(ctx, ship, camera) {
    const speed = ship.vel.mag();
    if (speed < 10) return;

    const progradeWorld = ship.pos.copy().add(ship.vel.copy().normalize().mult(65));
    const proScreen = camera.worldToScreen(progradeWorld.x, progradeWorld.y);

    ctx.save();
    ctx.translate(proScreen.x, proScreen.y);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.65)';
    ctx.lineWidth = 1.4;

    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, -6); ctx.lineTo(0, -10);
    ctx.moveTo(-6, 0); ctx.lineTo(-10, 0);
    ctx.moveTo(6, 0);  ctx.lineTo(10, 0);
    ctx.stroke();

    ctx.restore();
  }

  /* -------------------------------------------------------------
   * 7. Tactical Military Radar with Sweeping Beam
   * ------------------------------------------------------------- */
  _renderTacticalRadar(ctx, ship, station, asteroids, enemies, minerals, derelicts = [], blackHole = null) {
    const cx = this.canvas.width - this.radarRadius - 25;
    const cy = this.canvas.height - this.radarRadius - 25;
    const r = this.radarRadius;

    ctx.save();

    // Dark Radar Glass
    ctx.fillStyle = 'rgba(4, 7, 12, 0.94)';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Rotating Radar Sweep Beam (Continuous 360 Scan)
    ctx.save();
    ctx.translate(cx, cy);
    const sweepGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    sweepGrad.addColorStop(0, 'rgba(0, 229, 255, 0.25)');
    sweepGrad.addColorStop(1, 'rgba(0, 229, 255, 0.02)');
    ctx.fillStyle = sweepGrad;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r, this.radarAngle - 0.45, this.radarAngle);
    ctx.closePath();
    ctx.fill();

    // Leading sweep line
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(this.radarAngle) * r, Math.sin(this.radarAngle) * r);
    ctx.stroke();
    ctx.restore();

    // Radar Concentric Range Rings (0.5k, 1.2k)
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.22)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.4, 0, Math.PI * 2);
    ctx.arc(cx, cy, r * 0.75, 0, Math.PI * 2);
    ctx.stroke();

    // Crosshairs & Cardinal Ticks
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.35)';
    ctx.beginPath();
    ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy);
    ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r);
    ctx.stroke();

    // Glowing Neon Coral Perimeter Ring
    ctx.strokeStyle = '#ff3377';
    ctx.lineWidth = 2.2;
    ctx.shadowColor = '#ff2266';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Helper: World to Radar conversion
    const toRadar = (worldPos) => {
      const dx = worldPos.x - ship.pos.x;
      const dy = worldPos.y - ship.pos.y;
      const scale = r / this.radarRange;
      const rx = dx * scale;
      const ry = dy * scale;
      const dist = Math.sqrt(rx * rx + ry * ry);
      if (dist > r - 3) {
        return {
          x: cx + (rx / dist) * (r - 4),
          y: cy + (ry / dist) * (r - 4),
          clamped: true
        };
      }
      return { x: cx + rx, y: cy + ry, clamped: false };
    };

    // 1. Station Blip (Cyan Diamond)
    if (station) {
      const sPos = toRadar(station.pos);
      ctx.fillStyle = '#00ffff';
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(sPos.x, sPos.y - 4);
      ctx.lineTo(sPos.x + 4, sPos.y);
      ctx.lineTo(sPos.x, sPos.y + 4);
      ctx.lineTo(sPos.x - 4, sPos.y);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // 2. Black Hole (Violet Swirl)
    if (blackHole) {
      const bhPos = toRadar(blackHole.pos);
      ctx.strokeStyle = '#aa00ee';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(bhPos.x, bhPos.y, 5, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 3. Derelicts (Amber Squares)
    ctx.fillStyle = '#ffaa00';
    for (const d of derelicts) {
      if (d.salvaged) continue;
      const dPos = toRadar(d.pos);
      ctx.fillRect(dPos.x - 2.5, dPos.y - 2.5, 5, 5);
    }

    // 4. Asteroids (Warm Amber Pips)
    ctx.fillStyle = '#ffaa33';
    for (let i = 0; i < asteroids.length; i++) {
      const ast = asteroids[i];
      if (ast.isDead) continue;
      const p = toRadar(ast.pos);
      if (!p.clamped) {
        const dotSize = ast.radius > 50 ? 2.5 : (ast.radius > 30 ? 1.8 : 1.2);
        ctx.beginPath();
        ctx.arc(p.x, p.y, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 5. Minerals (Glinting Ore)
    for (let i = 0; i < minerals.length; i++) {
      const m = minerals[i];
      if (m.isDead) continue;
      const p = toRadar(m.pos);
      if (!p.clamped) {
        ctx.fillStyle = m.commodity ? m.commodity.color : '#ffffff';
        ctx.fillRect(p.x - 1, p.y - 1, 2.5, 2.5);
      }
    }

    // 6. Enemies (Hostile Red Triangles)
    ctx.fillStyle = '#ff2244';
    ctx.shadowColor = '#ff0022';
    ctx.shadowBlur = 6;
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (e.isDead) continue;
      const p = toRadar(e.pos);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - 3.5);
      ctx.lineTo(p.x + 3.5, p.y + 3.5);
      ctx.lineTo(p.x - 3.5, p.y + 3.5);
      ctx.closePath();
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // 7. Player Craft (Centered Cyan Delta Vector)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(ship.angle);
    ctx.fillStyle = '#00f5ff';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(7, 0);
    ctx.lineTo(-4, -4);
    ctx.lineTo(-2, 0);
    ctx.lineTo(-4, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Radar Sub-Badge
    ctx.save();
    ctx.fillStyle = 'rgba(5, 8, 14, 0.88)';
    ctx.strokeStyle = 'rgba(255, 50, 120, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(cx - 56, cy + r + 5, 112, 18, 4);
    } else {
      ctx.rect(cx - 56, cy + r + 5, 112, 18);
    }
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#b0d8f5';
    ctx.font = 'bold 9px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('RADAR // 2.2KM TACTICAL', cx, cy + r + 17);
    ctx.restore();

    ctx.restore();
  }

  /* -------------------------------------------------------------
   * 8. Dedicated Starbase Waypoint & Directional Distance Beacon
   * ------------------------------------------------------------- */
  _renderStarbaseBeacon(ctx, ship, station, camera, time, missionManager) {
    const dist = ship.pos.dist(station.pos);
    const distStr = dist < 1000 ? `${Math.round(dist)} M` : `${(dist / 1000).toFixed(2)} KM`;

    const isMissionReady = missionManager && missionManager.isReadyToClaim && missionManager.isReadyToClaim(ship.economy);
    const isCargoFull = ship.economy.getTotalCargoWeight() >= ship.economy.getMaxCargo();

    // Check if station center is currently on-screen
    const stationScreen = camera.worldToScreen(station.pos.x, station.pos.y);
    const isOnScreen = (
      stationScreen.x >= 60 &&
      stationScreen.x <= this.canvas.width - 60 &&
      stationScreen.y >= 60 &&
      stationScreen.y <= this.canvas.height - 60
    );

    if (isOnScreen) {
      if (dist < 180) return; // Player is already in docking berth

      // Station is visible on screen: Floating holographic bracket above hub
      ctx.save();
      ctx.translate(stationScreen.x, stationScreen.y);

      const pulse = 0.8 + 0.2 * Math.sin(time * 3);
      const tagColor = isMissionReady ? '#00ffaa' : (isCargoFull ? '#ffaa00' : '#00e5ff');

      ctx.strokeStyle = tagColor;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = tagColor;
      ctx.shadowBlur = 8 * pulse;

      const bracketY = -90;
      ctx.font = 'bold 10px "Courier New", monospace';
      ctx.fillStyle = tagColor;
      ctx.textAlign = 'center';

      let statusMsg = 'AEGIS STARBASE // DOCKING TERMINAL';
      if (isMissionReady) {
        statusMsg = '★ CONTRACT COMPLETE // DOCK FOR PAYOUT ★';
      } else if (isCargoFull) {
        statusMsg = '⚠️ CARGO FULL // DOCK TO REFINE ⚠️';
      }

      ctx.fillText(statusMsg, 0, bracketY - 14);
      ctx.font = 'bold 12px "Courier New", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`[ DISTANCE: ${distStr} ]`, 0, bracketY);

      // Downward pointer arrow
      ctx.fillStyle = tagColor;
      ctx.beginPath();
      ctx.moveTo(0, bracketY + 7);
      ctx.lineTo(-6, bracketY + 1);
      ctx.lineTo(6, bracketY + 1);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    } else {
      // Station is OFF-SCREEN: Edge-clamped directional beacon
      const cx = this.canvas.width * 0.5;
      const cy = this.canvas.height * 0.5;
      const dx = stationScreen.x - cx;
      const dy = stationScreen.y - cy;
      const angle = Math.atan2(dy, dx);

      // Clamping to screen perimeter box with generous margins
      const padX = 100;
      const padY = 75;
      const maxX = cx - padX;
      const maxY = cy - padY;

      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const scaleX = cos !== 0 ? Math.abs(maxX / cos) : Infinity;
      const scaleY = sin !== 0 ? Math.abs(maxY / sin) : Infinity;
      const scale = Math.min(scaleX, scaleY);

      const edgeX = cx + cos * scale;
      const edgeY = cy + sin * scale;

      ctx.save();
      ctx.translate(edgeX, edgeY);

      const pulseSpeed = (isMissionReady || isCargoFull) ? 6 : 3;
      const pulse = 0.75 + 0.25 * Math.sin(time * pulseSpeed);
      const beaconColor = isMissionReady ? '#00ffaa' : (isCargoFull ? '#ffaa00' : '#00e5ff');

      // 1. Directional Arrow Pointer rotated toward station
      ctx.save();
      ctx.rotate(angle);
      ctx.fillStyle = beaconColor;
      ctx.shadowColor = beaconColor;
      ctx.shadowBlur = 12 * pulse;

      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(-9, -9);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-9, 9);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // 2. High-Tech Waypoint Information Card
      const cardW = 165;
      const cardH = 34;
      let cardX = -cardW * 0.5;
      let cardY = -cardH * 0.5;

      if (cos > 0.45) cardX = -cardW - 16;
      else if (cos < -0.45) cardX = 16;
      else if (sin > 0) cardY = -cardH - 16;
      else cardY = 16;

      this._drawCyberPanel(ctx, cardX, cardY, cardW, cardH, beaconColor, 5);

      ctx.textAlign = 'center';
      ctx.font = 'bold 9px "Courier New", monospace';
      ctx.fillStyle = beaconColor;
      ctx.shadowColor = beaconColor;
      ctx.shadowBlur = 4;

      const subLabel = isMissionReady ? '★ CONTRACT READY' : (isCargoFull ? '⚠️ CARGO FULL' : 'DOCKING TERMINAL');
      ctx.fillText(`⬡ AEGIS STARBASE`, cardX + cardW * 0.5, cardY + 13);

      ctx.font = 'bold 11px "Courier New", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${distStr} [${subLabel}]`, cardX + cardW * 0.5, cardY + 27);

      ctx.restore();
    }
  }

  /* -------------------------------------------------------------
   * 9. Docking Approach Guidance Indicator
   * ------------------------------------------------------------- */
  _renderDockingGuidance(ctx, ship, station) {
    const dockStatus = station.canPlayerDock(ship);
    if (!dockStatus.inRange) return;

    const cx = this.canvas.width * 0.5;
    const cy = this.canvas.height - 75;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 13px "Courier New", monospace';

    const safe = dockStatus.safeSpeed;
    const promptText = safe ?
      '[ PRESS (E) TO DOCK AT STARBASE ]' :
      `[ CAUTION: VELOCITY ${Math.round(dockStatus.speed)} M/S (MAX 75 M/S) ]`;

    const boxW = Math.max(380, promptText.length * 9.2 + 40);

    ctx.fillStyle = 'rgba(4, 7, 13, 0.92)';
    ctx.strokeStyle = safe ? '#00f0ff' : '#ff9900';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = 10;

    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(cx - boxW * 0.5, cy - 20, boxW, 30, 6);
    } else {
      ctx.rect(cx - boxW * 0.5, cy - 20, boxW, 30);
    }
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = safe ? '#00ffff' : '#ffaa33';
    ctx.fillText(promptText, cx, cy);
    ctx.restore();
  }
}
