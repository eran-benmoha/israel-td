import { describe, it, expect, beforeEach } from "vitest";
import { HudView } from "./HudView";
import type { HudElements } from "./HudView";

function createMockElement(): HTMLElement {
  return {
    textContent: "",
    style: {},
    setAttribute: () => {},
    getAttribute: () => null,
  } as unknown as HTMLElement;
}

describe("HudView", () => {
  let elements: HudElements;
  let view: HudView;

  beforeEach(() => {
    elements = {
      waveIndicator: createMockElement(),
      waveTimer: createMockElement(),
      waveOrigin: createMockElement(),
      resourceValues: {
        money: createMockElement(),
        morale: createMockElement(),
        population: createMockElement(),
        army: createMockElement(),
        economy: createMockElement(),
      },
    };
    view = new HudView({ elements });
  });

  it("updates wave indicator text", () => {
    view.updateWaveHud({ waveNumber: 5, clockLabel: "01 Jan 2022 00:00 UTC", originLabel: "Active source: Hamas" });

    expect(elements.waveIndicator!.textContent).toBe("Wave 5");
  });

  it("updates wave timer text", () => {
    view.updateWaveHud({ waveNumber: 1, clockLabel: "15 Mar 2022 12:30 UTC", originLabel: "" });

    expect(elements.waveTimer!.textContent).toBe("Clock: 15 Mar 2022 12:30 UTC");
  });

  it("updates wave origin text", () => {
    view.updateWaveHud({ waveNumber: 1, clockLabel: "", originLabel: "Next source: Hezbollah" });

    expect(elements.waveOrigin!.textContent).toBe("Next source: Hezbollah");
  });

  it("handles null elements gracefully", () => {
    const sparseView = new HudView({
      elements: {
        waveIndicator: null,
        waveTimer: null,
        waveOrigin: null,
        resourceValues: {},
      },
    });

    expect(() =>
      sparseView.updateWaveHud({ waveNumber: 1, clockLabel: "test", originLabel: "test" }),
    ).not.toThrow();
  });

  it("updates resource chips", () => {
    view.updateResourceHud({
      resources: { money: 500, morale: 80, population: 90, army: 70, economy: 65 },
      maxResources: { money: 1000, morale: 100, population: 100, army: 100, economy: 100 },
    });

    expect(elements.resourceValues.money!.textContent).toBe("💰 500");
    expect(elements.resourceValues.morale!.textContent).toBe("🙂 80%");
    expect(elements.resourceValues.population!.textContent).toBe("🩺 90%");
    expect(elements.resourceValues.army!.textContent).toBe("🪖 70%");
    expect(elements.resourceValues.economy!.textContent).toBe("📈 65%");
  });

  it("formats money as rounded integer", () => {
    view.updateResourceHud({
      resources: { money: 123.7, morale: 100, population: 100, army: 100, economy: 100 },
      maxResources: { money: 1000, morale: 100, population: 100, army: 100, economy: 100 },
    });

    expect(elements.resourceValues.money!.textContent).toBe("💰 124");
  });

  it("formats percentage resources correctly", () => {
    view.updateResourceHud({
      resources: { money: 120, morale: 75.5, population: 100, army: 100, economy: 100 },
      maxResources: { money: 1000, morale: 100, population: 100, army: 100, economy: 100 },
    });

    expect(elements.resourceValues.morale!.textContent).toBe("🙂 76%");
  });
});
