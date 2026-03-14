import type { EventBus } from "../core/EventBus";
import { Events } from "../core/events";
import { HudView } from "../ui/HudView";
import { DebugView } from "../ui/DebugView";
import { ShopView } from "../ui/ShopView";
import type { ResourceKey, Resources } from "../../types";

interface UiElements {
  waveIndicator: HTMLElement | null;
  waveTimer: HTMLElement | null;
  waveOrigin: HTMLElement | null;
  debugToggleButton: HTMLElement | null;
  debugPanel: HTMLElement | null;
  debugLaunchWaveButton: HTMLElement | null;
  debugStatus: HTMLElement | null;
  debugZoom: HTMLElement | null;
  shopPanel: HTMLElement | null;
  shopTabs: HTMLElement | null;
  shopItems: HTMLElement | null;
  shopStatus: HTMLElement | null;
  shopMoney: HTMLElement | null;
  shopToggleButton: HTMLElement | null;
  resourceValues: Partial<Record<ResourceKey, HTMLElement | null>>;
}

export class UiSystem {
  private eventBus: EventBus;
  private unsubscribers: Array<() => void> = [];
  private elements: UiElements;
  private hudView: HudView;
  private debugView: DebugView;
  private shopView: ShopView;

  constructor({ eventBus }: { eventBus: EventBus }) {
    this.eventBus = eventBus;
    this.elements = {
      waveIndicator: document.getElementById("wave-indicator"),
      waveTimer: document.getElementById("wave-timer"),
      waveOrigin: document.getElementById("wave-origin"),
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
    };
    this.hudView = new HudView({ elements: this.elements });
    this.debugView = new DebugView({ eventBus, elements: this.elements });
    this.shopView = new ShopView({ eventBus, elements: this.elements });
  }

  start(): void {
    this.debugView.bindDomEvents();
    this.shopView.bindDomEvents();
    this.bindBusEvents();
  }

  destroy(): void {
    this.unsubscribers.forEach((off) => off());
    this.unsubscribers = [];
    this.debugView.destroy();
    this.shopView.destroy();
  }

  private bindBusEvents(): void {
    this.unsubscribers.push(
      this.eventBus.on(Events.UI_WAVE, (payload: unknown) =>
        this.hudView.updateWaveHud(payload as { waveNumber: number; clockLabel: string; originLabel: string }),
      ),
      this.eventBus.on(Events.UI_RESOURCES, (payload: unknown) =>
        this.hudView.updateResourceHud(payload as { resources: Resources; maxResources: Resources }),
      ),
      this.eventBus.on(Events.UI_SHOP_CATALOG, (p: unknown) => {
        const { units } = p as { units: Array<{ id: string; name: string; category: string; cost: number; moraleBoost: number; armyBoost: number }> };
        this.shopView.onShopCatalog(units);
      }),
      this.eventBus.on(Events.UI_SHOP_STATE, (p: unknown) => {
        const { money, purchased } = p as { money: number; purchased: Record<string, number> };
        this.shopView.onShopState(money, purchased);
      }),
      this.eventBus.on(Events.UI_SHOP_RESULT, (p: unknown) => {
        const { success, message } = p as { success: boolean; message: string };
        this.shopView.onShopResult(success, message);
      }),
      this.eventBus.on(Events.UI_DEBUG_STATUS, (p: unknown) => {
        const { message } = p as { message: string };
        this.debugView.onDebugStatus(message);
      }),
      this.eventBus.on(Events.UI_DEBUG_ZOOM, (p: unknown) => {
        const { zoom } = p as { zoom: number };
        this.debugView.onDebugZoom(zoom);
      }),
    );
  }
}
