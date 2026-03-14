import type { EventBus } from "../core/EventBus";
import { Events } from "../core/events";
import type { UnitDefinition } from "../../types";

export interface ShopElements {
  shopPanel: HTMLElement | null;
  shopTabs: HTMLElement | null;
  shopItems: HTMLElement | null;
  shopStatus: HTMLElement | null;
  shopMoney: HTMLElement | null;
  shopToggleButton: HTMLElement | null;
}

interface ShopState {
  catalog: UnitDefinition[];
  categories: string[];
  activeCategory: string;
  money: number;
  purchased: Record<string, number>;
}

export class ShopView {
  private eventBus: EventBus;
  private elements: ShopElements;
  private cleanupHandlers: Array<() => void> = [];
  private state: ShopState = {
    catalog: [],
    categories: [],
    activeCategory: "air-defense",
    money: 0,
    purchased: {},
  };

  constructor({ eventBus, elements }: { eventBus: EventBus; elements: ShopElements }) {
    this.eventBus = eventBus;
    this.elements = elements;
  }

  bindDomEvents(): void {
    const { shopTabs, shopItems, shopPanel, shopToggleButton } = this.elements;

    if (shopTabs) {
      const onTabClick = (event: Event): void => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
          return;
        }
        const category = target.dataset.category;
        if (!category) {
          return;
        }
        this.state.activeCategory = category;
        this.render();
      };
      shopTabs.addEventListener("click", onTabClick);
      this.cleanupHandlers.push(() => shopTabs.removeEventListener("click", onTabClick));
    }

    if (shopItems) {
      const onItemClick = (event: Event): void => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
          return;
        }
        const unitId = target.dataset.unitId;
        if (!unitId) {
          return;
        }
        this.eventBus.emit(Events.SHOP_PURCHASE_UNIT, { unitId });
      };
      shopItems.addEventListener("click", onItemClick);
      this.cleanupHandlers.push(() => shopItems.removeEventListener("click", onItemClick));
    }

    if (shopPanel && shopToggleButton) {
      const onToggle = (): void => {
        const isCollapsed = shopPanel.classList.toggle("is-collapsed");
        shopToggleButton.textContent = isCollapsed ? "👁️" : "🙈";
        shopToggleButton.setAttribute("aria-expanded", isCollapsed ? "false" : "true");
      };
      shopToggleButton.addEventListener("click", onToggle);
      this.cleanupHandlers.push(() => shopToggleButton.removeEventListener("click", onToggle));
    }
  }

  onShopCatalog(units: UnitDefinition[]): void {
    this.state.catalog = units;
    this.state.categories = [...new Set(units.map((unit) => unit.category))];
    if (!this.state.categories.includes(this.state.activeCategory)) {
      this.state.activeCategory = this.state.categories[0] ?? "air-defense";
    }
    this.render();
  }

  onShopState(money: number, purchased: Record<string, number>): void {
    this.state.money = money;
    this.state.purchased = purchased;
    this.render();
  }

  onShopResult(success: boolean, message: string): void {
    if (!this.elements.shopStatus || typeof message !== "string") {
      return;
    }
    this.elements.shopStatus.textContent = message;
    this.elements.shopStatus.style.color = success ? "#9be3b2" : "#ffb4b4";
  }

  render(): void {
    this.updateMoneyLabel();
    this.renderTabs();
    this.renderItems();
  }

  private updateMoneyLabel(): void {
    if (this.elements.shopMoney) {
      this.elements.shopMoney.textContent = `💰 ${Math.round(this.state.money)}`;
    }
  }

  private renderTabs(): void {
    if (!this.elements.shopTabs) {
      return;
    }
    this.elements.shopTabs.innerHTML = this.state.categories
      .map((category) => {
        const active = category === this.state.activeCategory;
        return `<button class="shop__tab${active ? " is-active" : ""}" type="button" data-category="${category}" role="tab" aria-selected="${active ? "true" : "false"}">${this.categoryLabel(category)}</button>`;
      })
      .join("");
  }

  private renderItems(): void {
    if (!this.elements.shopItems) {
      return;
    }
    const filtered = this.state.catalog.filter((unit) => unit.category === this.state.activeCategory);
    if (filtered.length === 0) {
      this.elements.shopItems.innerHTML = `<div class="shop__status">No units in this category yet.</div>`;
      return;
    }

    this.elements.shopItems.innerHTML = filtered
      .map((unit) => {
        const owned = this.state.purchased[unit.id] ?? 0;
        const canAfford = this.state.money >= unit.cost;
        const icon = this.categoryEmoji(unit.category);
        return `<div class="shop__item"><div class="shop__item-name">${icon} ${unit.name}</div><div class="shop__item-meta"><span>💸 ${unit.cost}</span><span>📦 ${owned}</span></div><button class="shop__buy" type="button" data-unit-id="${unit.id}" ${canAfford ? "" : "disabled"}>${canAfford ? "🛍️ Buy" : "⛔ Funds"}</button></div>`;
      })
      .join("");
  }

  private categoryLabel(categoryKey: string): string {
    switch (categoryKey) {
      case "air-defense":
        return "🛡️ AD";
      case "air-force":
        return "✈️ AF";
      case "ground-troops":
        return "🪖 GT";
      default:
        return categoryKey;
    }
  }

  private categoryEmoji(categoryKey: string): string {
    switch (categoryKey) {
      case "air-defense":
        return "🛡️";
      case "air-force":
        return "✈️";
      case "ground-troops":
        return "🪖";
      default:
        return "⚙️";
    }
  }

  destroy(): void {
    this.cleanupHandlers.forEach((off) => off());
    this.cleanupHandlers = [];
  }
}
