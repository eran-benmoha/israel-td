import { Events } from "../core/events";

export class ShopView {
  constructor({ eventBus, elements }) {
    this.eventBus = eventBus;
    this.elements = elements;
    this.cleanupHandlers = [];
    this.state = {
      catalog: [],
      categories: [],
      activeCategory: "air-defense",
      money: 0,
      purchased: {},
    };
    this._tutorialDismissed = false;
    this._tutorialEl = document.getElementById("tutorial-tooltip");
  }

  bindDomEvents() {
    const { shopTabs, shopItems, shopPanel, shopToggleButton } = this.elements;

    if (shopTabs) {
      const onTabClick = (event) => {
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
      const onItemClick = (event) => {
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
      const onToggle = () => {
        const isCollapsed = shopPanel.classList.toggle("is-collapsed");
        shopToggleButton.textContent = isCollapsed ? "👁️" : "🙈";
        shopToggleButton.setAttribute("aria-expanded", isCollapsed ? "false" : "true");
      };
      shopToggleButton.addEventListener("click", onToggle);
      this.cleanupHandlers.push(() => shopToggleButton.removeEventListener("click", onToggle));
    }
  }

  onShopCatalog(units) {
    this.state.catalog = units;
    this.state.categories = [...new Set(units.map((unit) => unit.category))];
    if (!this.state.categories.includes(this.state.activeCategory)) {
      this.state.activeCategory = this.state.categories[0] ?? "air-defense";
    }
    this.render();
  }

  onShopState(money, purchased) {
    this.state.money = money;
    this.state.purchased = purchased;
    this.render();
  }

  onShopResult(success, message) {
    if (!this.elements.shopStatus || typeof message !== "string") {
      return;
    }
    this.elements.shopStatus.textContent = message;
    this.elements.shopStatus.style.color = success ? "#9be3b2" : "#ffb4b4";

    if (success && !this._tutorialDismissed) {
      this._dismissTutorial();
    }
  }

  _dismissTutorial() {
    this._tutorialDismissed = true;
    if (this._tutorialEl) {
      this._tutorialEl.hidden = true;
    }
  }

  render() {
    this.updateMoneyLabel();
    this.renderTabs();
    this.renderItems();
  }

  updateMoneyLabel() {
    if (this.elements.shopMoney) {
      this.elements.shopMoney.textContent = `💰 ${Math.round(this.state.money)}`;
    }
  }

  renderTabs() {
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

  renderItems() {
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

  categoryLabel(categoryKey) {
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

  categoryEmoji(categoryKey) {
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

  destroy() {
    this.cleanupHandlers.forEach((off) => off());
    this.cleanupHandlers = [];
  }
}
