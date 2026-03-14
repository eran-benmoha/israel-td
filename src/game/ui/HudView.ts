import type { Resources, ResourceKey } from "../../types";

export interface HudElements {
  waveIndicator: HTMLElement | null;
  waveTimer: HTMLElement | null;
  waveOrigin: HTMLElement | null;
  resourceValues: Partial<Record<ResourceKey, HTMLElement | null>>;
}

export interface WaveHudPayload {
  waveNumber: number;
  clockLabel: string;
  originLabel: string;
}

export interface ResourceHudPayload {
  resources: Resources;
  maxResources: Resources;
}

export class HudView {
  private elements: HudElements;

  constructor({ elements }: { elements: HudElements }) {
    this.elements = elements;
  }

  updateWaveHud({ waveNumber, clockLabel, originLabel }: WaveHudPayload): void {
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

  updateResourceHud({ resources, maxResources }: ResourceHudPayload): void {
    (Object.keys(resources) as ResourceKey[]).forEach((key) => {
      const valueEl = this.elements.resourceValues[key];
      if (!valueEl) {
        return;
      }

      const value = resources[key];
      const max = maxResources[key];
      const percent = (value / max) * 100;
      valueEl.textContent = this.formatResourceChip(key, value, max, percent);
    });
  }

  formatResourceChip(resourceKey: ResourceKey, value: number, max: number, percent: number): string {
    const roundedPercent = `${Math.round(percent)}%`;
    switch (resourceKey) {
      case "money":
        return `💰 ${Math.round(value)}`;
      case "morale":
        return `🙂 ${roundedPercent}`;
      case "population":
        return `🩺 ${roundedPercent}`;
      case "army":
        return `🪖 ${roundedPercent}`;
      case "economy":
        return `📈 ${roundedPercent}`;
      default:
        return `${Math.round(value)} / ${max}`;
    }
  }
}
