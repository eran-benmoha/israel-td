export class ThreatView {
  constructor({ elements }) {
    this.elements = elements;
    this.expanded = false;
    this.cleanupHandlers = [];
  }

  bindDomEvents() {
    const { threatToggle, threatDetails } = this.elements;
    if (threatToggle && threatDetails) {
      const onClick = () => {
        this.expanded = !this.expanded;
        threatDetails.hidden = !this.expanded;
        threatToggle.setAttribute("aria-expanded", this.expanded ? "true" : "false");
      };
      threatToggle.addEventListener("click", onClick);
      this.cleanupHandlers.push(() => threatToggle.removeEventListener("click", onClick));
    }
  }

  onThreatUpdate({ overall, factions }) {
    this.updateOverallBadge(overall);
    this.updateFactionRows(factions);
  }

  updateOverallBadge(overall) {
    const { threatBadge, threatLevelLabel, threatScore } = this.elements;
    if (threatBadge) {
      threatBadge.style.borderColor = overall.level.color;
      threatBadge.style.boxShadow = `0 0 8px ${overall.level.color}40`;
    }
    if (threatLevelLabel) {
      threatLevelLabel.textContent = overall.level.label;
      threatLevelLabel.style.color = overall.level.color;
    }
    if (threatScore) {
      threatScore.textContent = `${overall.score}`;
    }
  }

  updateFactionRows(factions) {
    const { threatFactionList } = this.elements;
    if (!threatFactionList) return;

    threatFactionList.innerHTML = factions
      .map((f) => {
        const pct = Math.min(100, f.score);
        return `<div class="threat__faction-row">` +
          `<span class="threat__faction-name">${f.factionName}</span>` +
          `<div class="threat__faction-bar"><div class="threat__faction-fill" style="width:${pct}%;background:${f.level.color}"></div></div>` +
          `<span class="threat__faction-level" style="color:${f.level.color}">${f.level.label}</span>` +
          `<span class="threat__faction-stats">${f.totalIntercepted}/${f.totalLaunched}</span>` +
          `</div>`;
      })
      .join("");
  }

  destroy() {
    this.cleanupHandlers.forEach((off) => off());
    this.cleanupHandlers = [];
  }
}
