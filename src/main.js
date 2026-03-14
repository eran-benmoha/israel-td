import Phaser from "phaser";
import { BootScene } from "./game/scenes/BootScene.js";

const gameRoot = document.getElementById("game-root");
const debugToggleButton = document.getElementById("debug-toggle");
const debugPanel = document.getElementById("debug-panel");
const debugLaunchWaveButton = document.getElementById("debug-launch-wave");
const debugStatus = document.getElementById("debug-status");
const debugZoom = document.getElementById("debug-zoom");
const shopPanel = document.querySelector(".shop");
const shopTabs = document.getElementById("shop-tabs");
const shopItems = document.getElementById("shop-items");
const shopStatus = document.getElementById("shop-status");
const shopMoney = document.getElementById("shop-money");
const shopToggleButton = document.getElementById("shop-toggle");

const config = {
  type: Phaser.AUTO,
  parent: gameRoot,
  backgroundColor: "#05070e",
  scene: [BootScene],
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: gameRoot.clientWidth || window.innerWidth,
    height: gameRoot.clientHeight || window.innerHeight,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

const shopUiState = {
  catalog: [],
  categories: [],
  activeCategory: "air-defense",
  money: 0,
  purchased: {},
};

function categoryLabel(categoryKey) {
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

function updateShopMoneyLabel() {
  if (!shopMoney) {
    return;
  }

  shopMoney.textContent = `Money: ${Math.round(shopUiState.money)}`;
}

function renderShopTabs() {
  if (!shopTabs) {
    return;
  }

  shopTabs.innerHTML = shopUiState.categories
    .map((category) => {
      const isActive = category === shopUiState.activeCategory;
      return `<button
        class="shop__tab${isActive ? " is-active" : ""}"
        type="button"
        data-category="${category}"
        role="tab"
        aria-selected="${isActive ? "true" : "false"}"
      >${categoryLabel(category)}</button>`;
    })
    .join("");
}

function renderShopItems() {
  if (!shopItems) {
    return;
  }

  const filteredItems = shopUiState.catalog.filter((unit) => unit.category === shopUiState.activeCategory);
  if (filteredItems.length === 0) {
    shopItems.innerHTML = `<div class="shop__status">No units in this category yet.</div>`;
    return;
  }

  shopItems.innerHTML = filteredItems
    .map((unit) => {
      const owned = shopUiState.purchased[unit.id] ?? 0;
      const canAfford = shopUiState.money >= unit.cost;
      return `<div class="shop__item">
        <div class="shop__item-name">${unit.name}</div>
        <div class="shop__item-meta"><span>Cost: ${unit.cost}</span><span>Owned: ${owned}</span></div>
        <button class="shop__buy" type="button" data-unit-id="${unit.id}" ${canAfford ? "" : "disabled"}>
          ${canAfford ? "Purchase" : "Need more money"}
        </button>
      </div>`;
    })
    .join("");
}

function renderShopUi() {
  updateShopMoneyLabel();
  renderShopTabs();
  renderShopItems();
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

    shopUiState.activeCategory = category;
    renderShopUi();
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

    window.dispatchEvent(new CustomEvent("shop:purchaseUnit", { detail: { unitId } }));
  });
}

if (shopPanel && shopToggleButton) {
  shopToggleButton.addEventListener("click", () => {
    const isCollapsed = shopPanel.classList.toggle("is-collapsed");
    shopToggleButton.textContent = isCollapsed ? "Show" : "Hide";
    shopToggleButton.setAttribute("aria-expanded", isCollapsed ? "false" : "true");
  });
}

if (debugToggleButton && debugPanel) {
  debugToggleButton.addEventListener("click", () => {
    const panelIsHidden = debugPanel.hasAttribute("hidden");
    if (panelIsHidden) {
      debugPanel.removeAttribute("hidden");
      debugToggleButton.setAttribute("aria-expanded", "true");
      return;
    }

    debugPanel.setAttribute("hidden", "");
    debugToggleButton.setAttribute("aria-expanded", "false");
  });
}

if (debugLaunchWaveButton) {
  debugLaunchWaveButton.addEventListener("click", () => {
    window.dispatchEvent(new CustomEvent("debug:launchWaveInstant"));
  });
}

window.addEventListener("shop:catalog", (event) => {
  const units = event.detail?.units;
  if (!Array.isArray(units)) {
    return;
  }

  shopUiState.catalog = units;
  shopUiState.categories = [...new Set(units.map((unit) => unit.category))];
  if (!shopUiState.categories.includes(shopUiState.activeCategory)) {
    shopUiState.activeCategory = shopUiState.categories[0] ?? "air-defense";
  }
  renderShopUi();
});

window.addEventListener("shop:state", (event) => {
  const money = event.detail?.money;
  const purchased = event.detail?.purchased;
  if (typeof money === "number") {
    shopUiState.money = money;
  }
  if (purchased && typeof purchased === "object") {
    shopUiState.purchased = purchased;
  }
  renderShopUi();
});

window.addEventListener("shop:purchaseResult", (event) => {
  if (!shopStatus) {
    return;
  }

  const { success, message } = event.detail ?? {};
  if (typeof message === "string" && message.length > 0) {
    shopStatus.textContent = message;
    shopStatus.style.color = success ? "#9be3b2" : "#ffb4b4";
  }
});

window.addEventListener("debug:status", (event) => {
  if (!debugStatus) {
    return;
  }

  const message = event.detail?.message;
  if (typeof message === "string" && message.length > 0) {
    debugStatus.textContent = message;
  }
});

window.addEventListener("debug:zoom", (event) => {
  if (!debugZoom) {
    return;
  }

  const zoom = event.detail?.zoom;
  if (typeof zoom === "number" && Number.isFinite(zoom)) {
    debugZoom.textContent = `Zoom: ${zoom.toFixed(2)}x`;
  }
});

new Phaser.Game(config);
