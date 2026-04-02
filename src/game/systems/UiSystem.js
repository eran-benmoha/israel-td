import { Events } from "../core/events";
import { HudView } from "../ui/HudView";
import { DebugView } from "../ui/DebugView";
import { ShopView } from "../ui/ShopView";
import { AbilityView } from "../ui/AbilityView";

export class UiSystem {
  constructor({ eventBus }) {
    this.eventBus = eventBus;
    this.unsubscribers = [];
    this.elements = {
      waveIndicator: document.getElementById("wave-indicator"),
      waveTimer: document.getElementById("wave-timer"),
      waveOrigin: document.getElementById("wave-origin"),
      waveProgressBar: document.getElementById("wave-progress-bar"),
      waveProgressLabel: document.getElementById("wave-progress-label"),
      debugToggleButton: document.getElementById("debug-toggle"),
      debugPanel: document.getElementById("debug-panel"),
      debugLaunchWaveButton: document.getElementById("debug-launch-wave"),
      debugStatus: document.getElementById("debug-status"),
      debugZoom: document.getElementById("debug-zoom"),
      shopPanel: document.querySelector(".shop"),
      shopTabs: document.getElementById("shop-tabs"),
      shopItems: document.getElementById("shop-items"),
      shopStatus: document.getElementById("shop-status"),
      shopMoney: document.getElementById("shop-money"),
      shopToggleButton: document.getElementById("shop-toggle"),
      resourceValues: {
        money: document.getElementById("resource-money-value"),
        morale: document.getElementById("resource-morale-value"),
        population: document.getElementById("resource-population-value"),
        army: document.getElementById("resource-army-value"),
        economy: document.getElementById("resource-economy-value"),
      },
      abilityBar: document.getElementById("ability-bar"),
      abilityStatus: document.getElementById("ability-status"),
    };
    this.hudView = new HudView({ elements: this.elements });
    this.debugView = new DebugView({ eventBus, elements: this.elements });
    this.shopView = new ShopView({ eventBus, elements: this.elements });
    this.abilityView = new AbilityView({ eventBus, elements: this.elements });
  }

  start() {
    this.debugView.bindDomEvents();
    this.shopView.bindDomEvents();
    this.abilityView.bindDomEvents();
    this.bindBusEvents();
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
    this.unsubscribers = [];
    this.debugView.destroy();
    this.shopView.destroy();
    this.abilityView.destroy();
  }

  bindBusEvents() {
    this.unsubscribers.push(
      this.eventBus.on(Events.UI_WAVE, (payload) => this.hudView.updateWaveHud(payload)),
      this.eventBus.on(Events.UI_WAVE_PROGRESS, (payload) => this.hudView.updateWaveProgress(payload)),
      this.eventBus.on(Events.UI_RESOURCES, (payload) => this.hudView.updateResourceHud(payload)),
      this.eventBus.on(Events.UI_SHOP_CATALOG, ({ units }) => this.shopView.onShopCatalog(units)),
      this.eventBus.on(Events.UI_SHOP_STATE, ({ money, purchased }) => this.shopView.onShopState(money, purchased)),
      this.eventBus.on(Events.UI_SHOP_RESULT, ({ success, message }) => this.shopView.onShopResult(success, message)),
      this.eventBus.on(Events.UI_DEBUG_STATUS, ({ message }) => this.debugView.onDebugStatus(message)),
      this.eventBus.on(Events.UI_DEBUG_ZOOM, ({ zoom }) => this.debugView.onDebugZoom(zoom)),
      this.eventBus.on(Events.UI_ABILITY_STATE, ({ abilities }) => this.abilityView.onAbilityState(abilities)),
      this.eventBus.on(Events.UI_ABILITY_RESULT, ({ success, message }) => this.abilityView.onAbilityResult(success, message)),
    );
  }
}
