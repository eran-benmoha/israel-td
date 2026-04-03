import Phaser from "phaser";
import { Events } from "../core/events";

export class ResourceSystem {
  constructor({ eventBus, gameState, unitsConfig, perkSystem }) {
    this.eventBus = eventBus;
    this.state = gameState;
    this.units = unitsConfig.units ?? [];
    this.perkSystem = perkSystem ?? null;
    this.unsubscribePurchase = null;
  }

  start() {
    this.unsubscribePurchase = this.eventBus.on(Events.SHOP_PURCHASE_UNIT, ({ unitId }) => this.purchaseUnit(unitId));
    this.eventBus.emit(Events.UI_SHOP_CATALOG, { units: this.units });
    this.publishResourceState();
  }

  destroy() {
    if (this.unsubscribePurchase) {
      this.unsubscribePurchase();
      this.unsubscribePurchase = null;
    }
  }

  adjust(resourceName, delta) {
    const max = this.state.maxResources[resourceName];
    const current = this.state.resources[resourceName];
    this.state.resources[resourceName] = Phaser.Math.Clamp(current + delta, 0, max);
  }

  onWaveLaunched(waveNumber, perkSystem) {
    let income = 28 + waveNumber * 3;
    if (perkSystem) {
      const incomeBonus = perkSystem.getEffectTotal("income_bonus");
      income = Math.round(income * (1 + incomeBonus));
      const moraleRegen = perkSystem.getEffectTotal("morale_regen");
      if (moraleRegen > 0) {
        this.adjust("morale", moraleRegen);
      }
    }
    this.adjust("money", income);
    this.adjust("army", 0.75);
    this.publishResourceState();
  }

  onImpact(impactScale, moraleShield = 0) {
    const moraleDamage = Phaser.Math.FloatBetween(0.45, 1.2) * impactScale * (1 - moraleShield);
    this.adjust("morale", -moraleDamage);
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

    const costReduction = this.perkSystem ? this.perkSystem.getEffectTotal("cost_reduction") : 0;
    const effectiveCost = Math.max(1, Math.round(unit.cost * (1 - costReduction)));

    if (this.state.resources.money < effectiveCost) {
      this.eventBus.emit(Events.UI_SHOP_RESULT, { success: false, message: `Not enough money for ${unit.name}.` });
      return;
    }

    this.adjust("money", -effectiveCost);
    this.adjust("army", unit.armyBoost);
    this.adjust("morale", unit.moraleBoost);
    this.state.purchasedUnits[unit.id] = (this.state.purchasedUnits[unit.id] ?? 0) + 1;
    this.publishResourceState();
    this.eventBus.emit(Events.UI_DEBUG_STATUS, { message: `Purchased ${unit.name}.` });
    this.eventBus.emit(Events.UI_SHOP_RESULT, { success: true, message: `Purchased ${unit.name} for ${effectiveCost}.` });
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
