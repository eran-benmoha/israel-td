export class ComboView {
  constructor({ elements }) {
    this.container = elements.comboContainer;
    this.streakEl = elements.comboStreak;
    this.labelEl = elements.comboLabel;
    this.bestEl = elements.comboBest;
    this.hideTimeout = null;
  }

  update({ streak, bestStreak, tier }) {
    if (!this.container) return;

    if (streak < 2) {
      this.container.hidden = true;
      this.clearHideTimeout();
      return;
    }

    this.container.hidden = false;
    this.streakEl.textContent = `${streak}x`;
    this.labelEl.textContent = tier?.label ?? "Combo";
    this.bestEl.textContent = bestStreak > 0 ? `Best: ${bestStreak}x` : "";
    this.container.style.setProperty("--combo-color", tier?.color ?? "#5bb8ff");
    this.container.classList.remove("combo--pulse");
    void this.container.offsetWidth;
    this.container.classList.add("combo--pulse");

    this.clearHideTimeout();
    this.hideTimeout = setTimeout(() => {
      if (this.container) this.container.hidden = true;
    }, 10000);
  }

  clearHideTimeout() {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }
}
