import Phaser from "phaser";
import { Events } from "../core/events";

export class ResourceSystem {
  constructor({ eventBus, gameState, unitsConfig }) {
    this.eventBus = eventBus;
    this.state = gameState;
    this.units = unitsConfig.units ?? [];
    this.unsubscribePurchase = null;
    this.unsubscribeUpgrade = null;
  }

  start() {
    this.unsubscribePurchase = this.eventBus.on(Events.SHOP_PURCHASE_UNIT, ({ unitId }) => this.purchaseUnit(unitId));
    this.unsubscribeUpgrade = this.eventBus.on(Events.SHOP_UPGRADE_UNIT, ({ unitId }) => this.upgradeUnit(unitId));
    this.eventBus.emit(Events.UI_SHOP_CATALOG, { units: this.units });
    this.publishResourceState();
  }

  destroy() {
    if (this.unsubscribePurchase) {
      this.unsubscribePurchase();
      this.unsubscribePurchase = null;
    }
    if (this.unsubscribeUpgrade) {
      this.unsubscribeUpgrade();
      this.unsubscribeUpgrade = null;
    }
  }

  adjust(resourceName, delta) {
    const max = this.state.maxResources[resourceName];
    const current = this.state.resources[resourceName];
    this.state.resources[resourceName] = Phaser.Math.Clamp(current + delta, 0, max);
  }

  onWaveLaunched(waveNumber) {
    this.adjust("money", 28 + waveNumber * 3);
    this.adjust("army", 0.75);
    this.publishResourceState();
  }

  onImpact(impactScale) {
    this.adjust("morale", -Phaser.Math.FloatBetween(0.45, 1.2) * impactScale);
    this.adjust("population", -Phaser.Math.FloatBetween(0.35, 0.95) * impactScale);
    this.adjust("army", -Phaser.Math.FloatBetween(0.28, 0.78) * impactScale);
    this.adjust("money", -Phaser.Math.FloatBetween(1, 4) * impactScale);
    this.publishResourceState();
  }

  purchaseUnit(unitId) {
    const unit = this.units.find((candidate) => candidate.id === unitId);
    if (!unit) {
      this.eventBus.emit(Events.UI_SHOP_RESULT, { success: false, message: "Unit not found." });
      return;
    }

    if (this.state.resources.money < unit.cost) {
      this.eventBus.emit(Events.UI_SHOP_RESULT, { success: false, message: `Not enough money for ${unit.name}.` });
      return;
    }

    this.adjust("money", -unit.cost);
    this.adjust("army", unit.armyBoost);
    this.adjust("morale", unit.moraleBoost);
    this.state.purchasedUnits[unit.id] = (this.state.purchasedUnits[unit.id] ?? 0) + 1;
    this.state.unitLevels[unit.id] = this.state.unitLevels[unit.id] ?? 1;
    this.publishResourceState();
    this.eventBus.emit(Events.UI_DEBUG_STATUS, { message: `Purchased ${unit.name}.` });
    this.eventBus.emit(Events.UI_SHOP_RESULT, { success: true, message: `Purchased ${unit.name} for ${unit.cost}.` });
  }

  upgradeUnit(unitId) {
    const unit = this.units.find((candidate) => candidate.id === unitId);
    if (!unit) {
      this.eventBus.emit(Events.UI_SHOP_RESULT, { success: false, message: "Unit not found." });
      return;
    }

    const currentLevel = this.state.unitLevels[unit.id] ?? 0;
    if (currentLevel <= 0) {
      this.eventBus.emit(Events.UI_SHOP_RESULT, { success: false, message: `Must purchase ${unit.name} first.` });
      return;
    }

    const upgrades = unit.upgrades ?? [];
    const nextUpgrade = upgrades.find((u) => u.level === currentLevel + 1);
    if (!nextUpgrade) {
      this.eventBus.emit(Events.UI_SHOP_RESULT, { success: false, message: `${unit.name} is already at max level.` });
      return;
    }

    if (this.state.resources.money < nextUpgrade.cost) {
      this.eventBus.emit(Events.UI_SHOP_RESULT, { success: false, message: `Not enough money to upgrade ${unit.name}.` });
      return;
    }

    this.adjust("money", -nextUpgrade.cost);
    this.adjust("army", nextUpgrade.armyBoost ?? 0);
    this.adjust("morale", nextUpgrade.moraleBoost ?? 0);
    this.state.unitLevels[unit.id] = nextUpgrade.level;
    this.publishResourceState();
    this.eventBus.emit(Events.UI_DEBUG_STATUS, { message: `Upgraded ${unit.name} to Lv.${nextUpgrade.level}.` });
    this.eventBus.emit(Events.UI_SHOP_RESULT, { success: true, message: `Upgraded ${unit.name} to Lv.${nextUpgrade.level} for ${nextUpgrade.cost}.` });
  }

  publishResourceState() {
    this.recalculateEconomy();
    this.eventBus.emit(Events.UI_RESOURCES, {
      resources: { ...this.state.resources },
      maxResources: { ...this.state.maxResources },
    });
    this.eventBus.emit(Events.UI_SHOP_STATE, {
      money: this.state.resources.money,
      purchased: { ...this.state.purchasedUnits },
      levels: { ...this.state.unitLevels },
    });
  }

  recalculateEconomy() {
    const moneyPercent = (this.state.resources.money / this.state.maxResources.money) * 100;
    const weightedEconomy =
      moneyPercent * 0.45 +
      this.state.resources.morale * 0.2 +
      this.state.resources.population * 0.2 +
      this.state.resources.army * 0.15;
    this.state.resources.economy = Phaser.Math.Clamp(weightedEconomy, 0, 100);
  }
}
