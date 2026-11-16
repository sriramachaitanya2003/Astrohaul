import { COMMODITIES, UPGRADE_TREES } from '../economy/Economy.js';

/**
 * StationUI - Holographic Starbase Terminal for Trading, Outfitting, and Repairs
 * Authored by: agency-ui-designer & agency-economy-designer
 */
export class StationUI {
  constructor(economy, soundEngine, particleSystem, missionManager) {
    this.economy = economy;
    this.soundEngine = soundEngine;
    this.particleSystem = particleSystem;
    this.missionManager = missionManager;
    this.isOpen = false;
    this.currentTab = 'refinery'; // 'refinery', 'shipyard', 'maintenance', 'missions'
    this.domElement = null;

    this._createDOM();
  }

  _createDOM() {
    const overlay = document.createElement('div');
    overlay.id = 'station-terminal';
    overlay.className = 'station-modal hidden';

    overlay.innerHTML = `
      <div class="terminal-container">
        <div class="terminal-header">
          <div class="terminal-title">
            <h2>AEGIS STARBASE // LOGISTICS TERMINAL</h2>
            <span class="station-status">STATUS: ONLINE // SECURITY GRID ACTIVE</span>
          </div>
          <button id="btn-undock" class="btn-terminal btn-danger">UNDOCK [ESC / E]</button>
        </div>

        <div class="terminal-nav">
          <button class="nav-tab active" data-tab="refinery">ORE REFINERY & MARKET</button>
          <button class="nav-tab" data-tab="shipyard">SHIPYARD OUTFITTING</button>
          <button class="nav-tab" data-tab="missions">MISSION CONTRACTS</button>
          <button class="nav-tab" data-tab="maintenance">DRYDOCK MAINTENANCE</button>
        </div>

        <div class="terminal-body">
          <div id="tab-refinery" class="tab-content active"></div>
          <div id="tab-shipyard" class="tab-content"></div>
          <div id="tab-missions" class="tab-content"></div>
          <div id="tab-maintenance" class="tab-content"></div>
        </div>

        <div class="terminal-footer">
          <div class="footer-credits">ACCOUNT BALANCE: <span id="terminal-credits" class="credits-val">0 CR</span></div>
          <div class="footer-cargo">HOLD USAGE: <span id="terminal-cargo" class="cargo-val">0 / 0 T</span></div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.domElement = overlay;

    // Attach event listeners
    document.getElementById('btn-undock').addEventListener('click', () => this.close());

    const tabs = overlay.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        overlay.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        tab.classList.add('active');
        const targetId = `tab-${tab.dataset.tab}`;
        document.getElementById(targetId).classList.add('active');
        this.currentTab = tab.dataset.tab;
        this.render();
      });
    });
  }

  open(ship) {
    this.isOpen = true;
    this.ship = ship;
    this.domElement.classList.remove('hidden');
    this.soundEngine.playDockSuccess();
    this.render();
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.domElement.classList.add('hidden');
    if (this.ship) {
      this.ship.rechargeShields();
    }
  }

  render() {
    if (!this.isOpen) return;

    // Update Footer Readouts
    document.getElementById('terminal-credits').innerText = `${this.economy.credits} CR`;
    const curWeight = this.economy.getTotalCargoWeight();
    const maxCap = this.economy.getMaxCargo();
    document.getElementById('terminal-cargo').innerText = `${curWeight} / ${maxCap} T (${Math.round((curWeight / maxCap) * 100)}%)`;

    // Render Active Tab Content
    if (this.currentTab === 'refinery') {
      this._renderRefinery();
    } else if (this.currentTab === 'shipyard') {
      this._renderShipyard();
    } else if (this.currentTab === 'missions') {
      this._renderMissions();
    } else if (this.currentTab === 'maintenance') {
      this._renderMaintenance();
    }
  }

  _renderMissions() {
    const container = document.getElementById('tab-missions');
    if (!this.missionManager) {
      container.innerHTML = '<p>No mission dispatcher connected.</p>';
      return;
    }

    const active = this.missionManager.activeMission;
    let activeHtml = '';

    if (active) {
      const ready = this.missionManager.isReadyToClaim(this.economy);
      const mins = Math.floor(active.timeRemaining / 60);
      const secs = Math.floor(active.timeRemaining % 60);
      const timeStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

      activeHtml = `
        <div class="active-mission-banner" style="background: rgba(255, 215, 0, 0.1); border: 2px solid #ffd700; border-radius: 6px; padding: 16px; margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <h4 style="color: #ffd700; font-family: 'Orbitron'; font-size: 14px;">ACTIVE CONTRACT: ${active.title}</h4>
            <span style="color: ${ready ? '#00ffaa' : '#ffaa00'}; font-weight: bold; font-size: 12px;">
              ${ready ? '★ OBJECTIVE COMPLETE' : `TIME: ${timeStr}`}
            </span>
          </div>
          <p style="font-size: 11px; color: #c9d6df; margin-bottom: 12px;">${active.desc}</p>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 12px; color: #88aacc;">
              PROGRESS: <strong style="color: #ffffff;">${active.currentAmount} / ${active.targetAmount}</strong> | REWARD: <strong style="color: #ffdd44;">${active.rewardCredits} CR</strong>
            </div>
            <div style="display: flex; gap: 10px;">
              ${ready ? `
                <button id="btn-claim-mission" class="btn-terminal btn-primary" style="background: #00ffaa; color: #002211; font-weight: bold;">
                  CLAIM PAYOUT (+${active.rewardCredits} CR)
                </button>
              ` : `
                <button id="btn-abandon-mission" class="btn-terminal btn-danger" style="font-size: 10px;">
                  ABANDON CONTRACT
                </button>
              `}
            </div>
          </div>
        </div>
      `;
    }

    let availableListHtml = '';
    const available = this.missionManager.availableMissions;

    for (const m of available) {
      const isAlreadyActive = active && active.id === m.id;
      availableListHtml += `
        <div class="market-row" style="margin-bottom: 10px;">
          <div class="item-info" style="flex: 2;">
            <div>
              <div class="item-name" style="color: #00e5ff;">${m.title}</div>
              <div class="item-desc">${m.desc}</div>
              <div style="font-size: 10px; color: #ffaa00; margin-top: 4px;">TARGET: ${m.targetAmount} | TIME LIMIT: ${Math.round(m.timeLimit / 60)} MINS</div>
            </div>
          </div>
          <div class="item-market" style="text-align: right; padding-right: 20px;">
            <div class="item-price" style="font-size: 13px;">+${m.rewardCredits} CR</div>
          </div>
          <div class="item-actions">
            <button class="btn-terminal btn-accept-mission" data-id="${m.id}" ${isAlreadyActive || active ? 'disabled' : ''}>
              ${isAlreadyActive ? 'ACTIVE' : (active ? 'SLOT BUSY' : 'ACCEPT CONTRACT')}
            </button>
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="refinery-header" style="margin-bottom: 16px;">
        <div>
          <h3>AEGIS STARBASE MISSION DISPATCH</h3>
          <p>Official guild contracts, commercial delivery quotas, and high-value outer rim bounties.</p>
        </div>
      </div>
      ${activeHtml}
      <h4 style="color: #00e5ff; font-family: 'Orbitron'; font-size: 12px; margin-bottom: 12px;">AVAILABLE GUILD BOUNTIES & DELIVERIES</h4>
      <div class="market-list">${availableListHtml}</div>
    `;

    // Hook listeners
    const claimBtn = document.getElementById('btn-claim-mission');
    if (claimBtn) {
      claimBtn.addEventListener('click', () => {
        const rev = this.missionManager.claimReward(this.economy, this.soundEngine, this.particleSystem);
        if (rev > 0) {
          this.render();
        }
      });
    }

    const abandonBtn = document.getElementById('btn-abandon-mission');
    if (abandonBtn) {
      abandonBtn.addEventListener('click', () => {
        this.missionManager.abandonMission();
        this.render();
      });
    }

    container.querySelectorAll('.btn-accept-mission').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        if (this.missionManager.acceptMission(id)) {
          this.soundEngine.playPickup(3);
          this.render();
        }
      });
    });
  }

  _renderRefinery() {
    const container = document.getElementById('tab-refinery');
    let rowsHtml = '';
    let totalCargoValue = 0;

    for (const key in this.economy.inventory) {
      const count = this.economy.inventory[key];
      const comm = COMMODITIES[key];
      const rowVal = count * comm.basePrice;
      totalCargoValue += rowVal;

      rowsHtml += `
        <div class="market-row ${count > 0 ? 'has-stock' : ''}">
          <div class="item-info">
            <span class="ore-dot" style="background: ${comm.color}; box-shadow: 0 0 8px ${comm.glowColor}"></span>
            <div>
              <div class="item-name">${comm.name}</div>
              <div class="item-desc">${comm.desc}</div>
            </div>
          </div>
          <div class="item-market">
            <div class="item-price">${comm.basePrice} CR / T</div>
            <div class="item-qty">In Hold: <strong>${count}</strong></div>
          </div>
          <div class="item-actions">
            <button class="btn-terminal btn-sell" data-key="${key}" ${count <= 0 ? 'disabled' : ''}>
              SELL (${rowVal} CR)
            </button>
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="refinery-header">
        <div>
          <h3>MINERAL REFINERY QUOTATIONS</h3>
          <p>Instant liquidation of raw ore deposits at standard Galactic Guild index rates.</p>
        </div>
        <button id="btn-sell-all" class="btn-terminal btn-primary" ${totalCargoValue <= 0 ? 'disabled' : ''}>
          SELL ALL ORES (+${totalCargoValue} CR)
        </button>
      </div>
      <div class="market-list">${rowsHtml}</div>
    `;

    // Hook Sell Buttons
    container.querySelectorAll('.btn-sell').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const key = e.currentTarget.dataset.key;
        const count = this.economy.inventory[key];
        const rev = this.economy.sellOre(key, count);
        if (rev > 0) {
          this.soundEngine.playPickup(COMMODITIES[key].tier);
          this.render();
        }
      });
    });

    const sellAllBtn = document.getElementById('btn-sell-all');
    if (sellAllBtn) {
      sellAllBtn.addEventListener('click', () => {
        const rev = this.economy.sellAll();
        if (rev > 0) {
          this.soundEngine.playPickup(5);
          this.render();
        }
      });
    }
  }

  _renderShipyard() {
    const container = document.getElementById('tab-shipyard');
    let cardsHtml = '';

    for (const sysKey in UPGRADE_TREES) {
      const tree = UPGRADE_TREES[sysKey];
      const curTier = this.economy.tiers[sysKey];
      const isMax = curTier >= tree.maxTier - 1;
      const nextCost = this.economy.getNextUpgradeCost(sysKey);
      const canAfford = nextCost !== null && this.economy.credits >= nextCost;

      cardsHtml += `
        <div class="upgrade-card">
          <div class="card-header">
            <h4>${tree.name}</h4>
            <span class="tier-badge ${isMax ? 'max-tier' : ''}">MK.${curTier + 1} / MK.${tree.maxTier}</span>
          </div>
          <div class="card-desc">${tree.desc}</div>
          <div class="card-action">
            <div class="cost-tag">${isMax ? 'MAX TIER' : `COST: ${nextCost} CR`}</div>
            <button class="btn-terminal btn-upgrade" data-sys="${sysKey}" ${!canAfford || isMax ? 'disabled' : ''}>
              ${isMax ? 'MAXED' : 'UPGRADE'}
            </button>
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="shipyard-grid">${cardsHtml}</div>
    `;

    container.querySelectorAll('.btn-upgrade').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const sys = e.currentTarget.dataset.sys;
        if (this.economy.buyUpgrade(sys)) {
          this.soundEngine.playPickup(4);
          this.ship.syncStats();
          this.render();
        }
      });
    });
  }

  _renderMaintenance() {
    const container = document.getElementById('tab-maintenance');
    const maxHull = this.ship.hullStats.maxHull;
    const curHull = Math.ceil(this.ship.hull);
    const damage = maxHull - curHull;
    const repairCostPerPoint = 2;
    const totalRepairCost = damage * repairCostPerPoint;
    const canAffordRepair = this.economy.credits >= totalRepairCost && damage > 0;

    container.innerHTML = `
      <div class="maintenance-container">
        <h3>DRYDOCK REPAIRS & RE-ENERGIZATION</h3>
        
        <div class="repair-box">
          <div class="box-stat">
            <span>HULL STRUCTURAL INTEGRITY:</span>
            <strong>${curHull} / ${maxHull} (${Math.round((curHull / maxHull) * 100)}%)</strong>
          </div>
          <div class="box-stat">
            <span>TOTAL REPAIR ESTIMATE:</span>
            <strong>${damage > 0 ? `${totalRepairCost} CR (${damage} PTS @ 2 CR/PT)` : 'NOMINAL (0 DAMAGE)'}</strong>
          </div>
          <button id="btn-repair-hull" class="btn-terminal btn-primary" ${!canAffordRepair ? 'disabled' : ''}>
            REPAIR HULL COMPLETELY (${totalRepairCost} CR)
          </button>
        </div>

        <div class="repair-box">
          <div class="box-stat">
            <span>DEFLECTOR SHIELD CAPACITORS:</span>
            <strong style="color: #00ffff">RECHARGING AUTOMATICALLY AT DOCK</strong>
          </div>
          <p style="color: #88aacc; font-size: 11px;">Starbase safety grid supplies continuous wireless power to docked vessels at zero charge.</p>
        </div>
      </div>
    `;

    const repairBtn = document.getElementById('btn-repair-hull');
    if (repairBtn) {
      repairBtn.addEventListener('click', () => {
        if (canAffordRepair) {
          this.economy.credits -= totalRepairCost;
          this.ship.repair(damage);
          this.soundEngine.playDockSuccess();
          this.render();
        }
      });
    }
  }
}

