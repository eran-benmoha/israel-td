import { Events } from "../core/events";

export class AbilityView {
  constructor({ eventBus, elements }) {
    this.eventBus = eventBus;
    this.container = elements.abilityBar;
    this.statusEl = elements.abilityStatus;
    this.cleanupHandlers = [];
    this.state = { abilities: [] };
  }

  bindDomEvents() {
    if (!this.container) return;
    const onClick = (event) => {
      const target = event.target.closest("[data-ability-id]");
      if (!target) return;
      const abilityId = target.dataset.abilityId;
      if (!abilityId) return;
      this.eventBus.emit(Events.ABILITY_ACTIVATE, { abilityId });
    };
    this.container.addEventListener("click", onClick);
    this.cleanupHandlers.push(() => this.container.removeEventListener("click", onClick));
  }

  onAbilityState(abilities) {
    this.state.abilities = abilities;
    this.render();
  }

  onAbilityResult(success, message) {
    if (!this.statusEl || typeof message !== "string") return;
    this.statusEl.textContent = message;
    this.statusEl.style.color = success ? "#9be3b2" : "#ffb4b4";
    this.statusEl.style.opacity = "1";

    clearTimeout(this._statusFadeTimer);
    this._statusFadeTimer = setTimeout(() => {
      if (this.statusEl) this.statusEl.style.opacity = "0";
    }, 2500);
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = this.state.abilities
      .map((ability) => {
        const locked = !ability.unlocked;
        const onCooldown = ability.remainingCooldownMs > 0;
        const isActive = ability.remainingDurationMs > 0;
        const disabled = locked || onCooldown;

        let cooldownOverlay = "";
        if (onCooldown) {
          const fraction = ability.remainingCooldownMs / ability.cooldownMs;
          const seconds = Math.ceil(ability.remainingCooldownMs / 1000);
          cooldownOverlay = `<div class="ability__cooldown-overlay" style="height:${(fraction * 100).toFixed(1)}%"></div><span class="ability__cooldown-text">${seconds}s</span>`;
        }

        let activeIndicator = "";
        if (isActive) {
          const seconds = Math.ceil(ability.remainingDurationMs / 1000);
          activeIndicator = `<span class="ability__active-indicator">${seconds}s</span>`;
        }

        const classes = [
          "ability__btn",
          locked ? "is-locked" : "",
          onCooldown ? "is-cooldown" : "",
          isActive ? "is-active" : "",
        ]
          .filter(Boolean)
          .join(" ");

        return `<button class="${classes}" type="button" data-ability-id="${ability.id}" ${disabled ? "disabled" : ""} title="${ability.name}: ${ability.description}${ability.moneyCost > 0 ? ` (💰${ability.moneyCost})` : ""}"><span class="ability__icon">${ability.icon}</span>${cooldownOverlay}${activeIndicator}${locked ? '<span class="ability__lock">🔒</span>' : ""}</button>`;
      })
      .join("");
  }

  destroy() {
    clearTimeout(this._statusFadeTimer);
    this.cleanupHandlers.forEach((off) => off());
    this.cleanupHandlers = [];
  }
}
