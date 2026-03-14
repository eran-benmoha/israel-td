import Phaser from "phaser";
import type { EventBus } from "../core/EventBus";
import { Events } from "../core/events";
import type { GameState } from "../core/GameState";
import type { ResourceKey, UnitDefinition } from "../../types";

interface ResourceSystemDeps {
  eventBus: EventBus;
  gameState: GameState;
  unitsConfig: { units: UnitDefinition[] };
}

export class ResourceSystem {
  private eventBus: EventBus;
  private state: GameState;
  private units: UnitDefinition[];
  private unsubscribePurchase: (() => void) | null = null;

  constructor({ eventBus, gameState, unitsConfig }: ResourceSystemDeps) {
    this.eventBus = eventBus;
    this.state = gameState;
    this.units = unitsConfig.units ?? [];
  }

  start(): void {
    this.unsubscribePurchase = this.eventBus.on(Events.SHOP_PURCHASE_UNIT, ({ unitId }: { unitId: string }) =>
      this.purchaseUnit(unitId),
    );
    this.eventBus.emit(Events.UI_SHOP_CATALOG, { units: this.units });
    this.publishResourceState();
  }

  destroy(): void {
    if (this.unsubscribePurchase) {
      this.unsubscribePurchase();
      this.unsubscribePurchase = null;
    }
  }

  adjust(resourceName: ResourceKey, delta: number): void {
    const max = this.state.maxResources[resourceName];
    const current = this.state.resources[resourceName];
    this.state.resources[resourceName] = Phaser.Math.Clamp(current + delta, 0, max);
  }

  onWaveLaunched(waveNumber: number): void {
    this.adjust("money", 28 + waveNumber * 3);
    this.adjust("army", 0.75);
    this.publishResourceState();
  }

  onImpact(impactScale: number): void {
    this.adjust("morale", -Phaser.Math.FloatBetween(0.45, 1.2) * impactScale);
    this.adjust("population", -Phaser.Math.FloatBetween(0.35, 0.95) * impactScale);
    this.adjust("army", -Phaser.Math.FloatBetween(0.28, 0.78) * impactScale);
    this.adjust("money", -Phaser.Math.FloatBetween(1, 4) * impactScale);
    this.publishResourceState();
  }

  purchaseUnit(unitId: string): void {
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
    this.publishResourceState();
    this.eventBus.emit(Events.UI_DEBUG_STATUS, { message: `Purchased ${unit.name}.` });
    this.eventBus.emit(Events.UI_SHOP_RESULT, { success: true, message: `Purchased ${unit.name} for ${unit.cost}.` });
  }

  publishResourceState(): void {
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

  recalculateEconomy(): void {
    const moneyPercent = (this.state.resources.money / this.state.maxResources.money) * 100;
    const weightedEconomy =
      moneyPercent * 0.45 +
      this.state.resources.morale * 0.2 +
      this.state.resources.population * 0.2 +
      this.state.resources.army * 0.15;
    this.state.resources.economy = Phaser.Math.Clamp(weightedEconomy, 0, 100);
  }
}
