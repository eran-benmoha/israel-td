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

  updateWaveProgress({ progress, remainingMs }) {
    if (this.elements.waveProgressBar) {
      this.elements.waveProgressBar.style.width = `${(progress * 100).toFixed(1)}%`;
    }
    if (this.elements.waveProgressLabel) {
      const seconds = Math.ceil(remainingMs / 1000);
      this.elements.waveProgressLabel.textContent = seconds > 0 ? `${seconds}s` : "";
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

  updateScore(score) {
    if (this.elements.scoreValue) {
      this.elements.scoreValue.textContent = `${score} pts`;
    }
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
