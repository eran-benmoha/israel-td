export class EarlyWarningView {
  constructor({ elements }) {
    this.elements = elements;
    this.cleanupHandlers = [];
    this._expanded = true;
  }

  bindDomEvents() {
    const toggle = this.elements.earlyWarningToggle;
    const body = this.elements.earlyWarningBody;
    if (toggle && body) {
      const onClick = () => {
        this._expanded = !this._expanded;
        body.hidden = !this._expanded;
        toggle.textContent = this._expanded ? "▾" : "▸";
        toggle.setAttribute("aria-expanded", String(this._expanded));
      };
      toggle.addEventListener("click", onClick);
      this.cleanupHandlers.push(() => toggle.removeEventListener("click", onClick));
    }
  }

  onForecast({ entries }) {
    const body = this.elements.earlyWarningBody;
    if (!body) return;

    if (entries.length === 0) {
      body.innerHTML = `<div class="ew__empty">No intel available</div>`;
      return;
    }

    body.innerHTML = entries
      .map((entry) => {
        const badge = `<span class="ew__badge" style="background:${entry.threatLevel.color}">${entry.threatLevel.label}</span>`;
        return `<div class="ew__entry"><span class="ew__wave-num">W${entry.waveNumber}</span><span class="ew__faction">${entry.factionName}</span><span class="ew__territory">${entry.territory}</span>${badge}</div>`;
      })
      .join("");
  }

  onAlert({ active }) {
    const panel = this.elements.earlyWarningPanel;
    if (!panel) return;

    if (active) {
      panel.classList.add("ew--alert");
    } else {
      panel.classList.remove("ew--alert");
    }
  }

  destroy() {
    this.cleanupHandlers.forEach((off) => off());
    this.cleanupHandlers = [];
  }
}
