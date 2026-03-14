import Phaser from "phaser";

export class ResourceSystem {
  constructor({ eventBus, gameState, unitsConfig }) {
    this.eventBus = eventBus;
    this.state = gameState;
    this.units = unitsConfig.units ?? [];
    this.unsubscribePurchase = null;
  }

  start() {
    this.unsubscribePurchase = this.eventBus.on("shop/purchase-unit", ({ unitId }) => this.purchaseUnit(unitId));
    this.eventBus.emit("ui/shop-catalog", { units: this.units });
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
      this.eventBus.emit("ui/shop-result", { success: false, message: "Unit not found." });
      return;
    }

    if (this.state.resources.money < unit.cost) {
      this.eventBus.emit("ui/shop-result", { success: false, message: `Not enough money for ${unit.name}.` });
      return;
    }

    this.adjust("money", -unit.cost);
    this.adjust("army", unit.armyBoost);
    this.adjust("morale", unit.moraleBoost);
    this.state.purchasedUnits[unit.id] = (this.state.purchasedUnits[unit.id] ?? 0) + 1;
    this.publishResourceState();
    this.eventBus.emit("ui/debug-status", { message: `Purchased ${unit.name}.` });
    this.eventBus.emit("ui/shop-result", { success: true, message: `Purchased ${unit.name} for ${unit.cost}.` });
  }

  publishResourceState() {
    this.recalculateEconomy();
    this.eventBus.emit("ui/resources", {
      resources: { ...this.state.resources },
      maxResources: { ...this.state.maxResources },
    });
    this.eventBus.emit("ui/shop-state", {
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
