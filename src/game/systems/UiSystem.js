export class UiSystem {
  constructor({ eventBus }) {
    this.eventBus = eventBus;
    this.unsubscribers = [];
    this.shopUiState = {
      catalog: [],
      categories: [],
      activeCategory: "air-defense",
      money: 0,
      purchased: {},
    };

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
      resourceFills: {
        money: document.getElementById("resource-money-fill"),
        morale: document.getElementById("resource-morale-fill"),
        population: document.getElementById("resource-population-fill"),
        army: document.getElementById("resource-army-fill"),
        economy: document.getElementById("resource-economy-fill"),
      },
    };
  }

  start() {
    this.bindDomEvents();
    this.bindBusEvents();
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
    this.unsubscribers = [];
  }

  bindDomEvents() {
    const { debugToggleButton, debugPanel, debugLaunchWaveButton, shopTabs, shopItems, shopPanel, shopToggleButton } =
      this.elements;

    if (debugToggleButton && debugPanel) {
      debugToggleButton.addEventListener("click", () => {
        const hidden = debugPanel.hasAttribute("hidden");
        if (hidden) {
          debugPanel.removeAttribute("hidden");
          debugToggleButton.setAttribute("aria-expanded", "true");
          return;
        }
        debugPanel.setAttribute("hidden", "");
        debugToggleButton.setAttribute("aria-expanded", "false");
      });
    }

    if (debugLaunchWaveButton) {
      debugLaunchWaveButton.addEventListener("click", () => this.eventBus.emit("debug/launch-wave"));
    }

    if (shopTabs) {
      shopTabs.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
          return;
        }
        const category = target.dataset.category;
        if (!category) {
          return;
        }
        this.shopUiState.activeCategory = category;
        this.renderShopUi();
      });
    }

    if (shopItems) {
      shopItems.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
          return;
        }
        const unitId = target.dataset.unitId;
        if (!unitId) {
          return;
        }
        this.eventBus.emit("shop/purchase-unit", { unitId });
      });
    }

    if (shopPanel && shopToggleButton) {
      shopToggleButton.addEventListener("click", () => {
        const isCollapsed = shopPanel.classList.toggle("is-collapsed");
        shopToggleButton.textContent = isCollapsed ? "Show" : "Hide";
        shopToggleButton.setAttribute("aria-expanded", isCollapsed ? "false" : "true");
      });
    }
  }

  bindBusEvents() {
    this.unsubscribers.push(
      this.eventBus.on("ui/wave", (payload) => this.updateWaveHud(payload)),
      this.eventBus.on("ui/resources", (payload) => this.updateResourceHud(payload)),
      this.eventBus.on("ui/shop-catalog", ({ units }) => this.onShopCatalog(units)),
      this.eventBus.on("ui/shop-state", ({ money, purchased }) => this.onShopState(money, purchased)),
      this.eventBus.on("ui/shop-result", ({ success, message }) => this.onShopResult(success, message)),
      this.eventBus.on("ui/debug-status", ({ message }) => this.onDebugStatus(message)),
      this.eventBus.on("ui/debug-zoom", ({ zoom }) => this.onDebugZoom(zoom)),
    );
  }

  updateWaveHud({ waveNumber, clockLabel, originLabel }) {
    if (this.elements.waveIndicator) {
      this.elements.waveIndicator.textContent = `Wave ${waveNumber}`;
    }
    if (this.elements.waveTimer) {
      this.elements.waveTimer.textContent = `Clock: ${clockLabel}`;
    }
    if (this.elements.waveOrigin) {
      this.elements.waveOrigin.textContent = originLabel;
    }
  }

  updateResourceHud({ resources, maxResources }) {
    Object.keys(resources).forEach((key) => {
      const valueEl = this.elements.resourceValues[key];
      const fillEl = this.elements.resourceFills[key];
      if (!valueEl || !fillEl) {
        return;
      }

      const value = resources[key];
      const max = maxResources[key];
      const percent = (value / max) * 100;
      fillEl.style.width = `${percent}%`;
      valueEl.textContent = key === "money" ? `${Math.round(value)} / ${max}` : `${Math.round(percent)}%`;
    });
  }

  onShopCatalog(units) {
    this.shopUiState.catalog = units;
    this.shopUiState.categories = [...new Set(units.map((unit) => unit.category))];
    if (!this.shopUiState.categories.includes(this.shopUiState.activeCategory)) {
      this.shopUiState.activeCategory = this.shopUiState.categories[0] ?? "air-defense";
    }
    this.renderShopUi();
  }

  onShopState(money, purchased) {
    this.shopUiState.money = money;
    this.shopUiState.purchased = purchased;
    this.renderShopUi();
  }

  onShopResult(success, message) {
    if (!this.elements.shopStatus || typeof message !== "string") {
      return;
    }
    this.elements.shopStatus.textContent = message;
    this.elements.shopStatus.style.color = success ? "#9be3b2" : "#ffb4b4";
  }

  onDebugStatus(message) {
    if (this.elements.debugStatus && typeof message === "string") {
      this.elements.debugStatus.textContent = message;
    }
  }

  onDebugZoom(zoom) {
    if (this.elements.debugZoom && typeof zoom === "number" && Number.isFinite(zoom)) {
      this.elements.debugZoom.textContent = `Zoom: ${zoom.toFixed(2)}x`;
    }
  }

  renderShopUi() {
    this.updateShopMoneyLabel();
    this.renderShopTabs();
    this.renderShopItems();
  }

  updateShopMoneyLabel() {
    if (this.elements.shopMoney) {
      this.elements.shopMoney.textContent = `Money: ${Math.round(this.shopUiState.money)}`;
    }
  }

  renderShopTabs() {
    if (!this.elements.shopTabs) {
      return;
    }
    this.elements.shopTabs.innerHTML = this.shopUiState.categories
      .map((category) => {
        const active = category === this.shopUiState.activeCategory;
        return `<button class="shop__tab${active ? " is-active" : ""}" type="button" data-category="${category}" role="tab" aria-selected="${active ? "true" : "false"}">${this.categoryLabel(category)}</button>`;
      })
      .join("");
  }

  renderShopItems() {
    if (!this.elements.shopItems) {
      return;
    }
    const filtered = this.shopUiState.catalog.filter((unit) => unit.category === this.shopUiState.activeCategory);
    if (filtered.length === 0) {
      this.elements.shopItems.innerHTML = `<div class="shop__status">No units in this category yet.</div>`;
      return;
    }

    this.elements.shopItems.innerHTML = filtered
      .map((unit) => {
        const owned = this.shopUiState.purchased[unit.id] ?? 0;
        const canAfford = this.shopUiState.money >= unit.cost;
        return `<div class="shop__item"><div class="shop__item-name">${unit.name}</div><div class="shop__item-meta"><span>Cost: ${unit.cost}</span><span>Owned: ${owned}</span></div><button class="shop__buy" type="button" data-unit-id="${unit.id}" ${canAfford ? "" : "disabled"}>${canAfford ? "Purchase" : "Need more money"}</button></div>`;
      })
      .join("");
  }

  categoryLabel(categoryKey) {
    switch (categoryKey) {
      case "air-defense":
        return "Air Defense";
      case "air-force":
        return "Air Force";
      case "ground-troops":
        return "Ground Troops";
      default:
        return categoryKey;
    }
  }
}
