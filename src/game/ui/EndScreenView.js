export class EndScreenView {
  constructor() {
    this.overlay = document.getElementById("end-screen-overlay");
    this.title = document.getElementById("end-screen-title");
    this.reason = document.getElementById("end-screen-reason");
    this.scoreValue = document.getElementById("end-screen-score");
    this.statsContainer = document.getElementById("end-screen-stats");
  }

  show({ isVictory, reason, score, resources }) {
    if (!this.overlay) return;

    this.overlay.classList.toggle("end-screen--victory", isVictory);
    this.overlay.classList.toggle("end-screen--defeat", !isVictory);

    if (this.title) {
      this.title.textContent = isVictory ? "Victory!" : "Game Over";
    }
    if (this.reason) {
      this.reason.textContent = reason ?? (isVictory ? "All waves defended" : "Defeat");
    }
    if (this.scoreValue) {
      this.scoreValue.textContent = score.points.toLocaleString();
    }
    if (this.statsContainer) {
      const rate = (score.missilesIntercepted + score.missilesImpacted) > 0
        ? Math.round((score.missilesIntercepted / (score.missilesIntercepted + score.missilesImpacted)) * 100)
        : 0;
      this.statsContainer.innerHTML = this.buildStatsHtml(score, rate, resources);
    }

    this.overlay.hidden = false;
  }

  buildStatsHtml(score, rate, resources) {
    return `
      <div class="end-screen__stat">
        <span class="end-screen__stat-label">Waves Survived</span>
        <span class="end-screen__stat-value">${score.wavesCompleted}</span>
      </div>
      <div class="end-screen__stat">
        <span class="end-screen__stat-label">Missiles Intercepted</span>
        <span class="end-screen__stat-value">${score.missilesIntercepted}</span>
      </div>
      <div class="end-screen__stat">
        <span class="end-screen__stat-label">Missiles Impacted</span>
        <span class="end-screen__stat-value">${score.missilesImpacted}</span>
      </div>
      <div class="end-screen__stat">
        <span class="end-screen__stat-label">Interception Rate</span>
        <span class="end-screen__stat-value">${rate}%</span>
      </div>
      <div class="end-screen__stat">
        <span class="end-screen__stat-label">Final Morale</span>
        <span class="end-screen__stat-value">${Math.round(resources.morale)}%</span>
      </div>
      <div class="end-screen__stat">
        <span class="end-screen__stat-label">Final Population</span>
        <span class="end-screen__stat-value">${Math.round(resources.population)}%</span>
      </div>
    `;
  }
}
