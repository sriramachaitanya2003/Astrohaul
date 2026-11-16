import { Camera } from './engine/Camera.js';
import { Input } from './engine/Input.js';
import { SpatialHash } from './engine/SpatialHash.js';
import { SoundEngine } from './audio/SoundEngine.js';
import { ParticleSystem } from './vfx/ParticleSystem.js';
import { Starfield } from './world/Starfield.js';
import { Economy } from './economy/Economy.js';
import { Ship } from './entities/Ship.js';
import { Station } from './entities/Station.js';
import { Asteroid } from './entities/Asteroid.js';
import { Enemy } from './entities/Enemy.js';
import { HUD } from './ui/HUD.js';
import { StationUI } from './ui/StationUI.js';
import { Derelict } from './entities/Derelict.js';
import { BlackHole } from './entities/BlackHole.js';
import { Torpedo } from './entities/Torpedo.js';
import { MissionManager } from './economy/Missions.js';

/**
 * Solar Drift: Void Miner - Main Orchestration Bootstrap
 * Authored by: agency-agents-orchestrator & agency-senior-developer
 */
class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    // Engine Core
    this.camera = new Camera(this.canvas);
    this.input = new Input(this.canvas);
    this.soundEngine = new SoundEngine();
    this.particleSystem = new ParticleSystem(1500);
    this.spatialHash = new SpatialHash(320);
    this.starfield = new Starfield(8000);

    // Gameplay Systems
    this.economy = new Economy();
    this.missionManager = new MissionManager();
    this.hud = new HUD(this.canvas);
    this.stationUI = new StationUI(this.economy, this.soundEngine, this.particleSystem, this.missionManager);

    // World Entities
    this.station = new Station(0, 0);
    this.blackHole = new BlackHole(2600, -2400);
    this.derelicts = [
      new Derelict(1350, 950, 'USSC VALIANT // DRIFTING PROSPECTOR'),
      new Derelict(-1700, -1350, 'EXPLORER BRAVO // BLACK BOX RETRIEVAL'),
      new Derelict(-950, 2200, 'TITANIC SALVAGE // ABANDONED SKIFF')
    ];
    this.ship = new Ship(0, 180, this.economy);
    this.asteroids = [];
    this.minerals = [];
    this.projectiles = [];
    this.enemies = [];

    // Timers & Spawners
    this.enemySpawnTimer = 10;
    this.maxEnemies = 4;
    this.lastTime = performance.now();
    this.gameState = 'PLAYING'; // 'PLAYING', 'DOCKED', 'GAME_OVER'

    this._setupWindow();
    this._populateAsteroidBelts();
    this._bindAudioUnlock();
  }

  _setupWindow() {
    const resize = () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.camera.resize(this.canvas.width, this.canvas.height);
    };
    window.addEventListener('resize', resize);
    resize();
  }

  _bindAudioUnlock() {
    const unlock = () => {
      this.soundEngine.init();
      this.soundEngine.resume();
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('click', unlock);
    window.addEventListener('keydown', unlock);
  }

  _populateAsteroidBelts() {
    const totalAsteroids = 180;
    const oreProbabilities = [
      { key: 'ferrite', weight: 45 },
      { key: 'silicon', weight: 25 },
      { key: 'titanium', weight: 18 },
      { key: 'platinum', weight: 9 },
      { key: 'quantum', weight: 3 }
    ];

    const pickOre = (distFromCenter) => {
      // Outer rim has much higher chances of rare platinum and quantum shards!
      if (distFromCenter > 2200 && Math.random() < 0.2) return 'quantum';
      if (distFromCenter > 1600 && Math.random() < 0.3) return 'platinum';
      if (distFromCenter > 1000 && Math.random() < 0.35) return 'titanium';

      let rand = Math.random() * 100;
      for (const p of oreProbabilities) {
        if (rand < p.weight) return p.key;
        rand -= p.weight;
      }
      return 'ferrite';
    };

    for (let i = 0; i < totalAsteroids; i++) {
      // Asteroid Ring from radius 600px out to 3800px
      const dist = 600 + Math.random() * 3200;
      const angle = Math.random() * Math.PI * 2;
      const x = Math.cos(angle) * dist;
      const y = Math.sin(angle) * dist;

      const sizeCategory = Math.random();
      let radius = 50;
      let stage = 3;
      if (sizeCategory < 0.45) {
        radius = 20 + Math.random() * 12;
        stage = 1;
      } else if (sizeCategory < 0.8) {
        radius = 35 + Math.random() * 14;
        stage = 2;
      } else {
        radius = 55 + Math.random() * 25;
        stage = 3;
      }

      const oreKey = pickOre(dist);
      this.asteroids.push(new Asteroid(x, y, radius, oreKey, stage));
    }
  }

  start() {
    requestAnimationFrame((t) => this._loop(t));
  }

  _loop(currentTime) {
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1); // Cap delta time
    this.lastTime = currentTime;

    this._update(dt);
    this._render(currentTime * 0.001);

    this.input.postUpdate();
    requestAnimationFrame((t) => this._loop(t));
  }

  _update(dt) {
    // 1. Check for Docking Interactivity
    if (this.input.isDockingRequested()) {
      if (this.gameState === 'DOCKED') {
        this.stationUI.close();
        this.gameState = 'PLAYING';
      } else {
        const dockCheck = this.station.canPlayerDock(this.ship);
        if (dockCheck.canDock) {
          this.gameState = 'DOCKED';
          this.ship.vel.set(0, 0); // Lock ship in station berth
          this.stationUI.open(this.ship);
        }
      }
    }

    // Escape closes station modal if open
    if (this.input.wasJustPressed('Escape') && this.gameState === 'DOCKED') {
      this.stationUI.close();
      this.gameState = 'PLAYING';
    }

    // Sync StationUI state
    if (this.gameState === 'DOCKED' && !this.stationUI.isOpen) {
      this.gameState = 'PLAYING';
    }

    // 2. Update Input & Camera
    this.input.update(this.camera);

    if (this.gameState === 'DOCKED') {
      this.camera.targetZoom = 1.35;
      this.camera.setTarget(this.station.pos.x, this.station.pos.y);
    } else {
      const speed = this.ship.vel.mag();
      this.camera.targetZoom = Math.max(0.75, 1.05 - (speed / 900) * 0.35);
      this.camera.setTarget(this.ship.pos.x, this.ship.pos.y);
    }
    this.camera.update(dt);

    // 3. Update Station, Hazards, Contracts & VFX
    this.station.update(dt);
    this.blackHole.update(dt, this.ship, this.asteroids, this.minerals, this.enemies, this.particleSystem, this.soundEngine, this.camera);
    this.missionManager.update(dt, this.economy, this.particleSystem, this.soundEngine, this.ship.pos);

    // Urgent contract countdown audio alerts (< 30s remaining)
    if (this.missionManager && this.missionManager.activeMission) {
      const m = this.missionManager.activeMission;
      const isReady = this.missionManager.isReadyToClaim(this.economy);
      if (!isReady && m.timeRemaining > 0 && m.timeRemaining <= 30) {
        if (!this.lastMissionWarningTime || performance.now() - this.lastMissionWarningTime > 2800) {
          this.soundEngine.playWarningBeep();
          this.lastMissionWarningTime = performance.now();
        }
      }
    }

    this.particleSystem.update(dt);

    for (const d of this.derelicts) {
      d.update(dt, this.ship, this.particleSystem, this.soundEngine, this.missionManager);
    }

    if (this.gameState === 'PLAYING') {
      // 4. Update Player Ship
      this.ship.update(
        dt,
        this.input,
        this.spatialHash,
        this.projectiles,
        this.particleSystem,
        this.soundEngine,
        this.camera
      );

      // 5. Update Spatial Hash Grid
      this.spatialHash.clear();
      for (const ast of this.asteroids) {
        if (!ast.isDead) this.spatialHash.insert(ast);
      }
      for (const min of this.minerals) {
        if (!min.isDead) this.spatialHash.insert(min);
      }
      for (const en of this.enemies) {
        if (!en.isDead) this.spatialHash.insert(en);
      }
      for (const d of this.derelicts) {
        if (!d.salvaged) this.spatialHash.insert(d);
      }

      // 6. Update Asteroids
      for (let i = this.asteroids.length - 1; i >= 0; i--) {
        const ast = this.asteroids[i];
        ast.update(dt);
        if (ast.isDead) {
          const children = ast.fracture(this.particleSystem, this.soundEngine);
          for (const c of children) {
            if (c.vertices) {
              this.asteroids.push(c);
            } else {
              this.minerals.push(c);
            }
          }
          this.asteroids.splice(i, 1);
        }
      }

      // 7. Update Minerals & Collection
      for (let i = this.minerals.length - 1; i >= 0; i--) {
        const min = this.minerals[i];
        min.update(dt, this.ship);

        // Check if player collects mineral
        const d = min.pos.dist(this.ship.pos);
        if (d < this.ship.radius + min.radius + 14) {
          const added = this.economy.addOre(min.commodityKey, 1);
          if (added > 0) {
            this.soundEngine.playPickup(min.commodity.tier);
            this.particleSystem.addFloatingText(
              `+1 ${min.commodity.name}`,
              min.pos.x,
              min.pos.y - 12,
              min.commodity.color,
              14
            );
            this.minerals.splice(i, 1);
            continue;
          } else {
            // Cargo full warning
            this.particleSystem.addFloatingText('CARGO HOLD FULL!', min.pos.x, min.pos.y - 12, '#ff3322', 12);
          }
        }

        if (min.isDead) {
          this.minerals.splice(i, 1);
        }
      }

      // 8. Update Projectiles & Collisions
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const p = this.projectiles[i];

        if (p instanceof Torpedo) {
          p.update(dt, this.spatialHash, this.particleSystem, this.soundEngine, this.camera);
          if (p.isDead) {
            this.projectiles.splice(i, 1);
          }
          continue;
        }

        p.update(dt);

        if (p.isDead) {
          this.projectiles.splice(i, 1);
          continue;
        }

        // Projectile vs Asteroids
        const nearby = this.spatialHash.query(p.pos.x, p.pos.y, p.radius + 60);
        let hit = false;

        for (const ent of nearby) {
          if (ent.vertices && !ent.isDead) { // Asteroid
            if (p.pos.dist(ent.pos) < ent.radius + p.radius) {
              ent.takeDamage(p.damage);
              this.particleSystem.emitDebris(p.pos.x, p.pos.y, 6, ent.commodity.color, 120);
              this.soundEngine.playImpact(1.2);
              hit = true;
              break;
            }
          } else if (p.source === 'player' && ent instanceof Enemy && !ent.isDead) {
            if (p.pos.dist(ent.pos) < ent.radius + p.radius) {
              ent.takeDamage(p.damage, this.soundEngine, this.particleSystem);
              hit = true;
              break;
            }
          } else if (p.source === 'enemy' && !this.ship.isDead) {
            if (p.pos.dist(this.ship.pos) < this.ship.radius + p.radius) {
              this.ship.takeDamage(p.damage, this.soundEngine, this.particleSystem, this.camera);
              hit = true;
              break;
            }
          }
        }

        if (hit) {
          this.projectiles.splice(i, 1);
        }
      }

      // 9. Update Enemy Raiders
      this._updateEnemies(dt);

      // 10. Ship vs Asteroid Kinetic Bumping
      this._handleShipAsteroidCollisions();

      // 11. Respawn / Game Over Check
      if (this.ship.isDead) {
        if (!this.respawnTimer) this.respawnTimer = 3.5;
        this.respawnTimer -= dt;
        if (this.respawnTimer <= 0) {
          this._respawnPlayer();
        }
      }
    }
  }

  _updateEnemies(dt) {
    this.enemySpawnTimer -= dt;
    if (this.enemySpawnTimer <= 0 && this.enemies.length < this.maxEnemies) {
      this.enemySpawnTimer = 16;
      // Spawn pirate outside station safe perimeter (1800 - 3200px out)
      const spawnDist = 1800 + Math.random() * 1400;
      const angle = Math.random() * Math.PI * 2;
      const tier = Math.random() < 0.6 ? 1 : 2;
      this.enemies.push(new Enemy(Math.cos(angle) * spawnDist, Math.sin(angle) * spawnDist, tier));
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.update(dt, this.ship, this.projectiles, this.particleSystem, this.soundEngine);

      if (e.isDead) {
        this.missionManager.onPirateDestroyed(this.particleSystem, this.ship.pos);
        const loot = e.getLootDrops();
        for (const l of loot) this.minerals.push(l);
        this.enemies.splice(i, 1);
      }
    }
  }

  _handleShipAsteroidCollisions() {
    if (this.ship.isDead) return;

    const nearby = this.spatialHash.query(this.ship.pos.x, this.ship.pos.y, this.ship.radius + 80);
    for (const ent of nearby) {
      if (!ent.vertices || ent.isDead) continue;
      const dist = this.ship.pos.dist(ent.pos);
      const minDist = this.ship.radius + ent.radius * 0.85;

      if (dist < minDist && dist > 0) {
        // Elastic collision response
        const normal = (this.ship.pos.copy().sub(ent.pos)).normalize();
        const overlap = minDist - dist;
        this.ship.pos.add(normal.copy().mult(overlap * 0.8));

        // Impact velocity calculation
        const relVel = this.ship.vel.copy().sub(ent.vel);
        const impulse = relVel.dot(normal);

        if (impulse < 0) {
          this.ship.vel.sub(normal.copy().mult(impulse * 1.5));
          const impactSpeed = Math.abs(impulse);
          if (impactSpeed > 40) {
            const damage = (impactSpeed - 40) * 0.45;
            this.ship.takeDamage(damage, this.soundEngine, this.particleSystem, this.camera);
            ent.takeDamage(damage * 0.5);
          }
        }
      }
    }
  }

  _respawnPlayer() {
    this.respawnTimer = null;
    this.ship.pos.set(0, 180);
    this.ship.vel.set(0, 0);
    this.ship.hull = this.ship.hullStats.maxHull;
    this.ship.shield = this.ship.shieldStats.maxShield;
    this.ship.isDead = false;
    this.particleSystem.addFloatingText('VESSEL RECONSTRUCTED AT STARBASE', 0, 150, '#00ffff', 16);
    this.soundEngine.playDockSuccess();
  }

  _render(time) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 1. World Layer (Transformed by Camera)
    this.camera.apply(this.ctx);

    // Starfield Background & Sector bounds
    this.starfield.render(this.ctx, this.camera, time);

    // Station & Cosmic Hazards
    this.station.render(this.ctx, this.camera);
    this.blackHole.render(this.ctx, this.camera);

    // Derelicts
    for (const d of this.derelicts) {
      d.render(this.ctx, this.camera);
    }

    // Minerals
    for (const min of this.minerals) {
      min.render(this.ctx, this.camera);
    }

    // Asteroids
    for (const ast of this.asteroids) {
      ast.render(this.ctx, this.camera);
    }

    // Enemies
    for (const en of this.enemies) {
      en.render(this.ctx, this.camera);
    }

    // Projectiles
    for (const p of this.projectiles) {
      p.render(this.ctx, this.camera);
    }

    // Player Ship
    this.ship.render(this.ctx, this.camera);

    // VFX Particles & World Floating Text
    this.particleSystem.render(this.ctx);

    this.camera.restore(this.ctx);

    // 2. HUD & Screen UI Overlay (Static Screen coordinates)
    if (this.gameState === 'PLAYING') {
      this.hud.render(
        this.ctx,
        this.ship,
        this.station,
        this.asteroids,
        this.enemies,
        this.minerals,
        this.camera,
        this.missionManager,
        this.derelicts,
        this.blackHole
      );
    } else if (this.ship.isDead) {
      this._renderDeathScreen();
    }
  }

  _renderDeathScreen() {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(20, 0, 0, 0.65)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = '#ff2233';
    this.ctx.font = 'bold 28px "Courier New", monospace';
    this.ctx.shadowColor = '#ff0022';
    this.ctx.shadowBlur = 12;
    this.ctx.fillText('CRITICAL HULL FAILURE', this.canvas.width * 0.5, this.canvas.height * 0.45);

    this.ctx.font = '14px "Courier New", monospace';
    this.ctx.fillStyle = '#ffaaaa';
    this.ctx.fillText('EMERGENCY ESCAPE POD DOCKED TO AEGIS STARBASE...', this.canvas.width * 0.5, this.canvas.height * 0.52);
    this.ctx.fillText('RECONSTRUCTING SHIP...', this.canvas.width * 0.5, this.canvas.height * 0.56);
    this.ctx.restore();
  }
}

// Launch Game safely across all browser ready states
function initSolarDrift() {
  if (window.__solarDriftGame) return;
  const canvas = document.getElementById('game-canvas');
  if (!canvas) {
    setTimeout(initSolarDrift, 50);
    return;
  }
  const game = new Game();
  game.start();
  window.__solarDriftGame = game;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSolarDrift);
} else {
  initSolarDrift();
}

