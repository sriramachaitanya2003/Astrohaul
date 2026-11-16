/**
 * MissionManager - Dynamic Station Contracts & Bounties System
 * Authored by: agency-economy-designer & agency-narrative-designer
 */
export class MissionManager {
  constructor() {
    this.availableMissions = [];
    this.activeMission = null;
    this.completedCount = 0;

    this.refreshAvailableMissions();
  }

  refreshAvailableMissions() {
    this.availableMissions = [
      {
        id: 'ore_silicon',
        title: 'SILICON CRYSTAL QUOTA',
        desc: 'Aegis avionics bay urgently requires semiconductor grade crystals.',
        type: 'delivery',
        commodity: 'silicon',
        targetAmount: 6,
        currentAmount: 0,
        rewardCredits: 450,
        timeLimit: 240, // 4 mins
        timeRemaining: 240
      },
      {
        id: 'bounty_pirates',
        title: 'OUTER RIM PATROL BOUNTY',
        desc: 'Marauder scouts have harassed transport freighters. Terminate hostiles.',
        type: 'bounty',
        targetAmount: 2,
        currentAmount: 0,
        rewardCredits: 850,
        timeLimit: 360,
        timeRemaining: 360
      },
      {
        id: 'salvage_derelict',
        title: 'LOST EXPLORER BLACK BOX',
        desc: 'Locate a silent derelict vessel adrift in the asteroid belt and recover its telemetry unit.',
        type: 'salvage',
        targetAmount: 1,
        currentAmount: 0,
        rewardCredits: 1200,
        timeLimit: 400,
        timeRemaining: 400
      },
      {
        id: 'ore_titanium',
        title: 'HEAVY ARMOR ALLOY RUSH',
        desc: 'Refit drydock needs high-tensile titanium alloys for hull reinforcements.',
        type: 'delivery',
        commodity: 'titanium',
        targetAmount: 4,
        currentAmount: 0,
        rewardCredits: 750,
        timeLimit: 240,
        timeRemaining: 240
      }
    ];
  }

  acceptMission(missionId) {
    const mission = this.availableMissions.find(m => m.id === missionId);
    if (!mission) return false;

    this.activeMission = { ...mission };
    return true;
  }

  abandonMission() {
    this.activeMission = null;
  }

  update(dt, economy, particleSystem, soundEngine, playerPos) {
    if (!this.activeMission) return;

    if (this.activeMission.timeRemaining > 0) {
      this.activeMission.timeRemaining -= dt;
      if (this.activeMission.timeRemaining <= 0) {
        // Mission expired
        particleSystem.addFloatingText('CONTRACT EXPIRED // MISSION FAILED', playerPos.x, playerPos.y - 30, '#ff3344', 16);
        this.activeMission = null;
        return;
      }
    }

    // Check delivery missions progress against inventory
    if (this.activeMission.type === 'delivery') {
      const stored = economy.inventory[this.activeMission.commodity] || 0;
      this.activeMission.currentAmount = Math.min(stored, this.activeMission.targetAmount);
    }
  }

  onPirateDestroyed(particleSystem, playerPos) {
    if (!this.activeMission || this.activeMission.type !== 'bounty') return;
    this.activeMission.currentAmount++;
    particleSystem.addFloatingText(
      `BOUNTY PROGRESS: ${this.activeMission.currentAmount}/${this.activeMission.targetAmount}`,
      playerPos.x,
      playerPos.y - 25,
      '#ffcc00',
      14
    );
  }

  onDerelictSalvaged(particleSystem, playerPos) {
    if (!this.activeMission || this.activeMission.type !== 'salvage') return;
    this.activeMission.currentAmount++;
    particleSystem.addFloatingText('BLACK BOX RECOVERED // RETURN TO STATION', playerPos.x, playerPos.y - 25, '#00ffff', 14);
  }

  isReadyToClaim(economy) {
    if (!this.activeMission) return false;
    if (this.activeMission.type === 'delivery') {
      const stored = economy.inventory[this.activeMission.commodity] || 0;
      return stored >= this.activeMission.targetAmount;
    }
    return this.activeMission.currentAmount >= this.activeMission.targetAmount;
  }

  claimReward(economy, soundEngine, particleSystem) {
    if (!this.isReadyToClaim(economy)) return 0;

    const reward = this.activeMission.rewardCredits;
    // Deduct commodity if delivery
    if (this.activeMission.type === 'delivery') {
      economy.inventory[this.activeMission.commodity] -= this.activeMission.targetAmount;
    }

    economy.credits += reward;
    this.completedCount++;
    soundEngine.playPickup(5);
    this.activeMission = null;
    this.refreshAvailableMissions();
    return reward;
  }
}

