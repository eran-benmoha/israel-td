export class HudView {
  constructor({ elements }) {
    this.elements = elements;
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
      if (!valueEl) {
        return;
      }

      const value = resources[key];
      const max = maxResources[key];
      const percent = (value / max) * 100;
      valueEl.textContent = this.formatResourceChip(key, value, max, percent);
    });
  }

  formatResourceChip(resourceKey, value, max, percent) {
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
