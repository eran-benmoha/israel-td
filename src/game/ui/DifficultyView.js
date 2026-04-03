import { Events } from "../core/events";

export class DifficultyView {
  constructor({ eventBus }) {
    this.eventBus = eventBus;
    this.overlay = document.getElementById("difficulty-overlay");
    this.cardsContainer = document.getElementById("difficulty-cards");
    this.startButton = document.getElementById("difficulty-start");
    this.selectedId = null;
    this._onStartClick = null;
    this._onCardClick = null;
    this.resolveSelection = null;
  }

  show(difficulties, selectedId) {
    this.selectedId = selectedId;
    this.renderCards(difficulties);
    this.overlay.hidden = false;
    this.overlay.classList.add("difficulty-overlay--visible");

    return new Promise((resolve) => {
      this.resolveSelection = resolve;

      this._onCardClick = (e) => {
        const card = e.target.closest("[data-difficulty-id]");
        if (!card) return;
        this.selectedId = card.dataset.difficultyId;
        this.highlightSelected();
        this.startButton.disabled = false;
      };

      this._onStartClick = () => {
        if (!this.selectedId) return;
        this.eventBus.emit(Events.DIFFICULTY_SELECT, { difficultyId: this.selectedId });
        this.hide();
        resolve(this.selectedId);
      };

      this.cardsContainer.addEventListener("click", this._onCardClick);
      this.startButton.addEventListener("click", this._onStartClick);
    });
  }

  hide() {
    this.overlay.classList.remove("difficulty-overlay--visible");
    this.overlay.hidden = true;
    if (this._onCardClick) {
      this.cardsContainer.removeEventListener("click", this._onCardClick);
      this._onCardClick = null;
    }
    if (this._onStartClick) {
      this.startButton.removeEventListener("click", this._onStartClick);
      this._onStartClick = null;
    }
  }

  renderCards(difficulties) {
    this.cardsContainer.innerHTML = "";
    difficulties.forEach((d) => {
      const card = document.createElement("button");
      card.className = "difficulty-card";
      card.dataset.difficultyId = d.id;
      if (d.id === this.selectedId) card.classList.add("difficulty-card--selected");

      const modifiers = d.modifiers;
      const detailLines = [
        `💰 Starting funds: ${modifiers.startingMoney}`,
        `⏱️ Wave pace: ${this.formatMultiplier(modifiers.waveTimingMultiplier, true)}`,
        `💥 Impact damage: ${this.formatMultiplier(modifiers.impactDamageMultiplier, false)}`,
        `🚀 Volley size: ${this.formatMultiplier(modifiers.volleySizeMultiplier, false)}`,
        `📈 Income: ${this.formatMultiplier(modifiers.incomeMultiplier, true)}`,
      ];

      card.innerHTML = `
        <span class="difficulty-card__icon">${d.icon}</span>
        <span class="difficulty-card__name">${d.name}</span>
        <span class="difficulty-card__desc">${d.description}</span>
        <ul class="difficulty-card__details">
          ${detailLines.map((line) => `<li>${line}</li>`).join("")}
        </ul>
      `;
      this.cardsContainer.appendChild(card);
    });
  }

  highlightSelected() {
    const cards = this.cardsContainer.querySelectorAll(".difficulty-card");
    cards.forEach((card) => {
      card.classList.toggle("difficulty-card--selected", card.dataset.difficultyId === this.selectedId);
    });
  }

  formatMultiplier(value, higherIsBetter) {
    if (value === 1.0) return "Standard";
    const percent = Math.round((value - 1) * 100);
    const sign = percent > 0 ? "+" : "";
    const label = `${sign}${percent}%`;
    const favorable = higherIsBetter ? percent > 0 : percent < 0;
    return favorable ? `<span class="mod-good">${label}</span>` : `<span class="mod-bad">${label}</span>`;
  }

  destroy() {
    this.hide();
  }
}
