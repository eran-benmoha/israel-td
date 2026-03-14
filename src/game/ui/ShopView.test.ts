import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventBus } from "../core/EventBus";
import { ShopView } from "./ShopView";
import type { UnitDefinition } from "../../types";

function createMockElement(): HTMLElement {
  return {
    textContent: "",
    innerHTML: "",
    style: { color: "" },
    dataset: {},
    setAttribute: vi.fn(),
    getAttribute: vi.fn(() => null),
    classList: {
      toggle: vi.fn(() => false),
    },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as unknown as HTMLElement;
}

const mockUnits: UnitDefinition[] = [
  { id: "iron-dome-battery", name: "Iron Dome Battery", category: "air-defense", cost: 120, moraleBoost: 0.8, armyBoost: 2.2 },
  { id: "fighter-sortie", name: "Fighter Sortie", category: "air-force", cost: 160, moraleBoost: 1, armyBoost: 2.7 },
  { id: "reserve-brigade", name: "Reserve Brigade", category: "ground-troops", cost: 90, moraleBoost: 0.6, armyBoost: 1.8 },
];

describe("ShopView", () => {
  let eventBus: EventBus;
  let elements: ReturnType<typeof createElements>;
  let view: ShopView;

  function createElements() {
    return {
      shopPanel: createMockElement(),
      shopTabs: createMockElement(),
      shopItems: createMockElement(),
      shopStatus: createMockElement(),
      shopMoney: createMockElement(),
      shopToggleButton: createMockElement(),
    };
  }

  beforeEach(() => {
    eventBus = new EventBus();
    elements = createElements();
    view = new ShopView({ eventBus, elements });
  });

  it("renders tabs from catalog", () => {
    view.onShopCatalog(mockUnits);

    expect(elements.shopTabs.innerHTML).toContain("air-defense");
    expect(elements.shopTabs.innerHTML).toContain("air-force");
    expect(elements.shopTabs.innerHTML).toContain("ground-troops");
  });

  it("renders items for active category", () => {
    view.onShopCatalog(mockUnits);

    expect(elements.shopItems.innerHTML).toContain("Iron Dome Battery");
  });

  it("updates money label on state change", () => {
    view.onShopCatalog(mockUnits);
    view.onShopState(500, {});

    expect(elements.shopMoney.textContent).toBe("💰 500");
  });

  it("shows purchase result success", () => {
    view.onShopResult(true, "Purchased Iron Dome Battery for 120.");

    expect(elements.shopStatus.textContent).toBe("Purchased Iron Dome Battery for 120.");
    expect(elements.shopStatus.style.color).toBe("#9be3b2");
  });

  it("shows purchase result failure", () => {
    view.onShopResult(false, "Not enough money.");

    expect(elements.shopStatus.textContent).toBe("Not enough money.");
    expect(elements.shopStatus.style.color).toBe("#ffb4b4");
  });

  it("shows owned count for purchased units", () => {
    view.onShopCatalog(mockUnits);
    view.onShopState(500, { "iron-dome-battery": 3 });

    expect(elements.shopItems.innerHTML).toContain("📦 3");
  });

  it("disables buy button when money insufficient", () => {
    view.onShopCatalog(mockUnits);
    view.onShopState(10, {});

    expect(elements.shopItems.innerHTML).toContain("disabled");
    expect(elements.shopItems.innerHTML).toContain("⛔ Funds");
  });

  it("enables buy button when money sufficient", () => {
    view.onShopCatalog(mockUnits);
    view.onShopState(500, {});

    expect(elements.shopItems.innerHTML).toContain("🛍️ Buy");
  });

  it("handles empty catalog", () => {
    view.onShopCatalog([]);

    expect(elements.shopTabs.innerHTML).toBe("");
  });

  it("handles null status element for result", () => {
    const viewNoStatus = new ShopView({
      eventBus,
      elements: { ...elements, shopStatus: null },
    });

    expect(() => viewNoStatus.onShopResult(true, "test")).not.toThrow();
  });

  it("destroy cleans up handlers", () => {
    view.bindDomEvents();
    view.destroy();

    expect(elements.shopTabs.removeEventListener).toHaveBeenCalled();
  });
});
