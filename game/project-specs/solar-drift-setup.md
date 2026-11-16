# Solar Drift: Void Miner - Complete Specification

## 1. Project Overview & Vision
- **Title**: Solar Drift: Void Miner
- **Genre**: Newtonian Space Exploration, Asteroid Mining & Economy Roguelite
- **Target Platform**: Modern Web Browsers (Canvas 2D / WebGL, Web Audio API, Zero External Dependencies)
- **Framerate Target**: Solid 60 FPS across standard desktop and laptop displays

---

## 2. Division Contributions

### A. Game Development Division

#### 1. Game Designer (`agency-game-designer`)
- **Moment-to-Moment Loop (0–30s)**:
  - Pilot miner craft using Newtonian inertia (thrust, turn, retro-brake).
  - Locate mineral-rich asteroids via radar sensors.
  - Fire continuous mining beam to heat and fracture asteroids into mineral cores.
  - Engage tractor beam to reel drifting minerals into cargo hold.
- **Session Loop (5–15 min)**:
  - Fill cargo hold with high-grade ores while monitoring fuel, hull integrity, and shield charge.
  - Evade or eliminate rogue pirate interceptors targeting your cargo.
  - Navigate back to an Orbital Starbase, dock safely, refine ores, sell commodities, and purchase ship upgrades.
- **Long-Term Meta Loop**:
  - Progress from a rickety "Prospector Skiff" to a fully armed "Void Dreadnought" with heavy plasma turrets, military shields, and quantum mining arrays.
  - Explore deeper sectors (Belt Alpha, Nebula Rim, Pirate Graveyard) with progressively rare ores and deadlier threats.

#### 2. Economy Designer (`agency-economy-designer`)
- **Commodity Tiers**:
  1. *Ferrite Ore*: Common industrial metal, 10-15 Credits / ton.
  2. *Silicon Crystal*: Electronic component base, 25-40 Credits / ton.
  3. *Titanium Alloy*: High-strength hull metal, 75-110 Credits / ton.
  4. *Platinum Core*: Rare precious conductor, 200-320 Credits / ton.
  5. *Quantum Shard*: Exotic hyperdrive matter, 600-950 Credits / ton.
- **Consumable & Service Sinks**:
  - Hull Repair: 2 Credits per 1% structural damage.
  - Shield Re-energize / Reactor Coolant refill.
- **Upgrade Tiers (1 to 5)**:
  - *Engine Thrusters*: Increases main thrust and RCS turn rate.
  - *Shield Matrix*: Increases max shield pool and decreases recharge delay.
  - *Reinforced Hull*: Adds armor plating to survive high-speed asteroid bumps and weapon impacts.
  - *Mining Laser Array*: Increases fracture speed and beam range, decreases heat generation.
  - *Tractor Beam Coil*: Increases capture radius and pull acceleration.
  - *Cargo Bay Expansion*: Increases cargo hold capacity (15 -> 30 -> 60 -> 120 -> 250 tons).
  - *Plasma Cannon*: Equips defense blasters with increased rate of fire and armor penetration.

#### 3. Level & Narrative Designer (`agency-level-designer` & `agency-narrative-designer`)
- **Sector Generation**:
  - Dynamic 8000x8000 sector space with looping / boundary warning beacons.
  - Varied asteroid belts: Dense inner clusters (low risk, common ores) vs hazardous outer fields (dense iron, high velocity fragments, pirate spawners).
  - Central Starbase "Aegis Station" equipped with docking guidance lights and defense grid.
  - Atmospheric comms logs & station dockmaster greetings ("Welcome to Aegis Hub, Miner. Keep your weapons holstered inside the safety perimeter.").

#### 4. Technical Artist (`agency-technical-artist`)
- **Visual Systems**:
  - Tri-layer parallax starfield with distant stellar nebulae and micro space dust creating a visceral sense of speed.
  - Procedurally generated irregular asteroid polygons with crater shading and density coloring.
  - Reactive particle systems:
    - Blue/orange ion thruster exhaust particles responding dynamically to throttle.
    - Searing cyan/amber mining beam with particle sparks splashing off asteroid contact points.
    - Mineral fracture fragments bursting outward upon asteroid split.
    - Blue energy ring wave when shields absorb kinetic impact.

#### 5. Game Audio Engineer (`agency-game-audio-engineer`)
- **Self-Contained Web Audio Synthesizer**:
  - Procedural thruster rumble (filtered white noise + low frequency sine wave).
  - Mining laser hum (frequency modulated sawtooth with variable resonance).
  - Tractor beam pull pulses.
  - Mineral crystal pickup chimes (resonant pentatonic bells).
  - Explosive kinetic crashes and pirate ship detonations.
  - Ambient generative space chord providing deep immersion without background music file downloads.

---

### B. Design & UX Division

#### 1. UI Designer (`agency-ui-designer`)
- **Diegetic Sci-Fi Flight HUD**:
  - Prograde / Retrograde velocity vector marker showing actual movement trajectory independent of ship facing angle.
  - Circular arc meters around the ship for quick peripheral reading: Shield (Cyan), Hull (Orange/Red), Heat/Coolant (Yellow).
  - Top-left Status Panel: Ship model, credit balance, speed indicator (m/s).
  - Top-right Cargo Monitor: Visual storage slots showing ore counts and percentage capacity.
  - Bottom-right Circular Radar: 360-degree radar display showing asteroids, stations, loot, and hostile signatures.
  - Station Terminal UI: Clean holographic modal displaying Market, Shipyard Outfitting, and Repair bays.

#### 2. UX Architect (`agency-ux-architect`)
- **Accessible & Responsive Controls**:
  - *Movement*: `W` / `Up Arrow` for Main Thrusters, `S` / `Down Arrow` for Retrograde Brake / Reverse, `A`/`D` or `Left`/`Right` for Rotation, `Shift` for Afterburner Boost.
  - *Weapons & Tools*: Left Click / `J` to fire Mining Laser, Right Click / Space / `K` for Tractor Beam, `F` or Spacebar for Plasma Cannons.
  - *Flight Assist Toggle*: `X` toggles Inertial Dampeners (on = automatic retro-braking, off = true frictionless Newton space drifting).
  - *Docking*: Approach station beacon and press `E` or click "Dock".

#### 3. Whimsy Injector (`agency-whimsy-injector`)
- **Juice & Feel**:
  - Dynamic camera shake proportional to impact velocity and weapon recoil.
  - Satisfying "Crunch" and floating gold/purple value popups when capturing rare ores (`+85 Plat`).
  - Speed lines and subtle FOV widening when afterburner is engaged.
  - Station docking sequence with hydraulic hiss and clamp lock animations.

---

## 3. Engineering & Architecture Standards (`agency-software-architect`)
- **Clean Vanilla ES6+ Structure**:
  - `index.html`: Canvas container, UI overlay layers.
  - `css/style.css`: High-contrast cyberpunk sci-fi aesthetic, glowing vector borders, scanline filters.
  - `js/engine/`: Core game loop, input handlers, vector math, camera with dampening & shake.
  - `js/physics/`: 2D Newtonian rigid body physics, elastic collisions, momentum transfer.
  - `js/entities/`: Player ship, procedural asteroids, mineral shards, starbases, pirate drones, plasma bolts.
  - `js/audio/`: Pure Web Audio API procedural sound engine.
  - `js/vfx/`: High-performance pooled particle system.
  - `js/economy/`: Inventory, trading algorithms, upgrade store specs.
  - `js/ui/`: HUD renderer, radar minimap, station interface.
  - `js/main.js`: Initialization and state coordinator.

