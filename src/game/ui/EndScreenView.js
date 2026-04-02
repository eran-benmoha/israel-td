import { Events } from "../core/events";

export class EndScreenView {
  constructor({ eventBus, elements }) {
    this.eventBus = eventBus;
    this.overlay = elements.endOverlay;
    this.title = elements.endTitle;
    this.subtitle = elements.endSubtitle;
    this.scoreValue = elements.endScore;
    this.highScoreValue = elements.endHighScore;
    this.statsWaves = elements.endStatsWaves;
    this.statsIntercepted = elements.endStatsIntercepted;
    this.statsImpacts = elements.endStatsImpacts;
    this.newHighScoreBadge = elements.endNewHighScore;
    this.restartButton = elements.endRestartButton;
    this.boundRestart = null;
  }

  bindDomEvents() {
    if (this.restartButton) {
      this.boundRestart = () => this.eventBus.emit(Events.GAME_RESTART, {});
      this.restartButton.addEventListener("click", this.boundRestart);
    }
  }

  destroy() {
    if (this.restartButton && this.boundRestart) {
      this.restartButton.removeEventListener("click", this.boundRestart);
      this.boundRestart = null;
    }
  }

  show({ isVictory, score, highScore, isNewHighScore, wavesCompleted, totalWaves, intercepted, impacts }) {
    if (!this.overlay) return;

    this.overlay.classList.toggle("is-victory", isVictory);
    this.overlay.classList.toggle("is-defeat", !isVictory);

    if (this.title) {
      this.title.textContent = isVictory ? "Victory!" : "Defeat";
    }
    if (this.subtitle) {
      this.subtitle.textContent = isVictory
        ? "You successfully defended Israel from all threats."
        : "Your nation has fallen. The defense has crumbled.";
    }
    if (this.scoreValue) {
      this.scoreValue.textContent = String(score);
    }
    if (this.highScoreValue) {
      this.highScoreValue.textContent = String(highScore);
    }
    if (this.statsWaves) {
      this.statsWaves.textContent = `${wavesCompleted} / ${totalWaves}`;
    }
    if (this.statsIntercepted) {
      this.statsIntercepted.textContent = String(intercepted);
    }
    if (this.statsImpacts) {
      this.statsImpacts.textContent = String(impacts);
    }
    if (this.newHighScoreBadge) {
      this.newHighScoreBadge.hidden = !isNewHighScore;
    }

    this.overlay.hidden = false;
  }

  hide() {
    if (this.overlay) {
      this.overlay.hidden = true;
    }
  }
}
