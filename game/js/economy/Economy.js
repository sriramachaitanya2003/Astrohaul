/**
 * Economy - Commodities, Market, Cargo Inventory and Subsystem Upgrade trees
 * Authored by: agency-economy-designer
 */
export const COMMODITIES = {
  ferrite: {
    id: 'ferrite',
    name: 'Ferrite Ore',
    color: '#ff8844',
    glowColor: '#ff5500',
    basePrice: 15,
    tier: 1,
    weight: 1,
    desc: 'Common structural ferrous metal. Backbone of stellar construction.'
  },
  silicon: {
    id: 'silicon',
    name: 'Silicon Crystal',
    color: '#00f0ff',
    glowColor: '#00c0ff',
    basePrice: 35,
    tier: 2,
    weight: 1,
    desc: 'High-purity semiconductor crystal required for avionics and shields.'
  },
  titanium: {
    id: 'titanium',
    name: 'Titanium Alloy',
    color: '#ffd040',
    glowColor: '#ffaa00',
    basePrice: 90,
    tier: 3,
    weight: 1,
    desc: 'Dense, heat-resistant alloy used in combat armor and engine nozzles.'
  },
  platinum: {
    id: 'platinum',
    name: 'Platinum Core',
    color: '#33ffcc',
    glowColor: '#00dd99',
    basePrice: 260,
    tier: 4,
    weight: 1,
    desc: 'Superconducting precious metal essential for high-yield laser emitters.'
  },
  quantum: {
    id: 'quantum',
    name: 'Quantum Shard',
    color: '#ff33aa',
    glowColor: '#ff0077',
    basePrice: 750,
    tier: 5,
    weight: 1,
    desc: 'Exotic matter exhibiting micro-wormhole fluctuation. Highly valuable.'
  }
};

export const UPGRADE_TREES = {
  thruster: {
    name: 'Ion Thrusters',
    maxTier: 5,
    costs: [0, 220, 550, 1400, 3200],
    stats: [
      { thrust: 220, turnSpeed: 2.8, boostMult: 1.8, maxSpeed: 420 },
      { thrust: 280, turnSpeed: 3.2, boostMult: 1.9, maxSpeed: 500 },
      { thrust: 350, turnSpeed: 3.6, boostMult: 2.0, maxSpeed: 580 },
      { thrust: 440, turnSpeed: 4.0, boostMult: 2.1, maxSpeed: 680 },
      { thrust: 550, turnSpeed: 4.5, boostMult: 2.3, maxSpeed: 800 }
    ],
    desc: 'Improves engine acceleration, rotational response, and afterburner output.'
  },
  shields: {
    name: 'Deflector Shields',
    maxTier: 5,
    costs: [0, 250, 650, 1600, 3600],
    stats: [
      { maxShield: 50, rechargeRate: 8, rechargeDelay: 3.5 },
      { maxShield: 80, rechargeRate: 12, rechargeDelay: 3.0 },
      { maxShield: 125, rechargeRate: 18, rechargeDelay: 2.6 },
      { maxShield: 180, rechargeRate: 25, rechargeDelay: 2.2 },
      { maxShield: 260, rechargeRate: 35, rechargeDelay: 1.8 }
    ],
    desc: 'Increases kinetic shield energy capacity and reduces recharge delay.'
  },
  hull: {
    name: 'Reinforced Hull',
    maxTier: 5,
    costs: [0, 200, 500, 1200, 2800],
    stats: [
      { maxHull: 100, armor: 0.1 },
      { maxHull: 150, armor: 0.2 },
      { maxHull: 220, armor: 0.3 },
      { maxHull: 310, armor: 0.4 },
      { maxHull: 420, armor: 0.5 }
    ],
    desc: 'Hardened composite plating to withstand high-velocity collisions and plasma fire.'
  },
  laser: {
    name: 'Mining Laser',
    maxTier: 5,
    costs: [0, 260, 620, 1500, 3400],
    stats: [
      { dps: 35, range: 240, heatPerSec: 22 },
      { dps: 55, range: 280, heatPerSec: 20 },
      { dps: 85, range: 330, heatPerSec: 18 },
      { dps: 125, range: 390, heatPerSec: 16 },
      { dps: 180, range: 460, heatPerSec: 14 }
    ],
    desc: 'Thermal cutting beam for fracturing mineral-bearing asteroids.'
  },
  tractor: {
    name: 'Tractor Beam',
    maxTier: 5,
    costs: [0, 180, 460, 1100, 2600],
    stats: [
      { range: 200, pullForce: 300 },
      { range: 270, pullForce: 420 },
      { range: 350, pullForce: 580 },
      { range: 440, pullForce: 760 },
      { range: 550, pullForce: 1000 }
    ],
    desc: 'Gravity tether projector to pull floating ore shards safely into the cargo hold.'
  },
  cargo: {
    name: 'Cargo Bay',
    maxTier: 5,
    costs: [0, 160, 420, 1000, 2400],
    stats: [
      { capacity: 15 },
      { capacity: 30 },
      { capacity: 60 },
      { capacity: 120 },
      { capacity: 250 }
    ],
    desc: 'Modular pressurized storage hold for ore and salvage materials.'
  },
  weapons: {
    name: 'Plasma Cannons',
    maxTier: 5,
    costs: [0, 320, 780, 1800, 4200],
    stats: [
      { damage: 24, fireRate: 3.5, speed: 750, energyCost: 8 },
      { damage: 36, fireRate: 4.2, speed: 850, energyCost: 7 },
      { damage: 52, fireRate: 5.0, speed: 950, energyCost: 6 },
      { damage: 75, fireRate: 6.0, speed: 1100, energyCost: 5 },
      { damage: 110, fireRate: 7.2, speed: 1300, energyCost: 4 }
    ],
    desc: 'Twin plasma bolt projectors for repelling pirate raiders.'
  }
};

export class Economy {
  constructor() {
    this.credits = 120;
    this.inventory = {
      ferrite: 0,
      silicon: 0,
      titanium: 0,
      platinum: 0,
      quantum: 0
    };

    // Installed tier indices (0 = Tier 1, 4 = Tier 5)
    this.tiers = {
      thruster: 0,
      shields: 0,
      hull: 0,
      laser: 0,
      tractor: 0,
      cargo: 0,
      weapons: 0
    };
  }

  getUpgradeStats(systemKey) {
    const tree = UPGRADE_TREES[systemKey];
    if (!tree) return null;
    const tier = this.tiers[systemKey];
    return tree.stats[tier];
  }

  getNextUpgradeCost(systemKey) {
    const tree = UPGRADE_TREES[systemKey];
    const currentTier = this.tiers[systemKey];
    if (currentTier >= tree.maxTier - 1) return null; // Already maxed
    return tree.costs[currentTier + 1];
  }

  buyUpgrade(systemKey) {
    const cost = this.getNextUpgradeCost(systemKey);
    if (cost === null || this.credits < cost) return false;

    this.credits -= cost;
    this.tiers[systemKey]++;
    return true;
  }

  getTotalCargoWeight() {
    let total = 0;
    for (const key in this.inventory) {
      const comm = COMMODITIES[key];
      if (comm) {
        total += this.inventory[key] * comm.weight;
      }
    }
    return total;
  }

  getMaxCargo() {
    return this.getUpgradeStats('cargo').capacity;
  }

  canAcceptOre(commodityKey, amount = 1) {
    const comm = COMMODITIES[commodityKey];
    if (!comm) return 0;
    const available = this.getMaxCargo() - this.getTotalCargoWeight();
    const canFit = Math.floor(available / comm.weight);
    return Math.max(0, Math.min(amount, canFit));
  }

  addOre(commodityKey, amount = 1) {
    const accepted = this.canAcceptOre(commodityKey, amount);
    if (accepted > 0) {
      this.inventory[commodityKey] = (this.inventory[commodityKey] || 0) + accepted;
    }
    return accepted;
  }

  sellOre(commodityKey, amount) {
    const stored = this.inventory[commodityKey] || 0;
    const toSell = Math.min(stored, amount);
    if (toSell <= 0) return 0;

    const price = COMMODITIES[commodityKey].basePrice;
    const revenue = toSell * price;

    this.inventory[commodityKey] -= toSell;
    this.credits += revenue;
    return revenue;
  }

  sellAll() {
    let totalRevenue = 0;
    for (const key in this.inventory) {
      if (this.inventory[key] > 0) {
        totalRevenue += this.sellOre(key, this.inventory[key]);
      }
    }
    return totalRevenue;
  }
}

