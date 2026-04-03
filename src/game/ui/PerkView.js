import { Events } from "../core/events";

export class PerkView {
  constructor({ eventBus, elements }) {
    this.eventBus = eventBus;
    this.elements = elements;
    this.cleanupHandlers = [];
    this.state = {
      points: 0,
      unlocked: {},
      perks: [],
    };
    this._toastTimeout = null;
  }

  bindDomEvents() {
    const { perkPanel, perkToggleButton, perkItems } = this.elements;

    if (perkPanel && perkToggleButton) {
      const onToggle = () => {
        const isCollapsed = perkPanel.classList.toggle("is-collapsed");
        perkToggleButton.textContent = isCollapsed ? "⭐" : "✖";
        perkToggleButton.setAttribute("aria-expanded", isCollapsed ? "false" : "true");
      };
      perkToggleButton.addEventListener("click", onToggle);
      this.cleanupHandlers.push(() => perkToggleButton.removeEventListener("click", onToggle));
    }

    if (perkItems) {
      const onPerkClick = (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
          return;
        }
        const perkId = target.dataset.perkId;
        if (!perkId) {
          return;
        }
        this.eventBus.emit(Events.PERK_UNLOCK, { perkId });
      };
      perkItems.addEventListener("click", onPerkClick);
      this.cleanupHandlers.push(() => perkItems.removeEventListener("click", onPerkClick));
    }
  }

  onPerkState({ points, unlocked, perks }) {
    this.state.points = points;
    this.state.unlocked = unlocked;
    this.state.perks = perks;
    this.render();
  }

  onPerkUnlocked({ perk }) {
    this.showToast(perk);
  }

  showToast(perk) {
    const toast = this.elements.perkToast;
    if (!toast) {
      return;
    }
    toast.textContent = `⭐ ${perk.icon} ${perk.name} unlocked!`;
    toast.classList.add("is-visible");
    if (this._toastTimeout) {
      clearTimeout(this._toastTimeout);
    }
    this._toastTimeout = setTimeout(() => {
      toast.classList.remove("is-visible");
      this._toastTimeout = null;
    }, 2500);
  }

  render() {
    this.renderPointsBadge();
    this.renderItems();
  }

  renderPointsBadge() {
    if (this.elements.perkPoints) {
      this.elements.perkPoints.textContent = `⭐ ${this.state.points}`;
    }
  }

  renderItems() {
    if (!this.elements.perkItems) {
      return;
    }

    const categories = [...new Set(this.state.perks.map((p) => p.category))];
    this.elements.perkItems.innerHTML = categories
      .map((cat) => {
        const catPerks = this.state.perks.filter((p) => p.category === cat);
        const catLabel = this.categoryLabel(cat);
        const items = catPerks.map((perk) => this.renderPerkItem(perk)).join("");
        return `<div class="perk__category"><div class="perk__category-label">${catLabel}</div>${items}</div>`;
      })
      .join("");
  }

  renderPerkItem(perk) {
    const isUnlocked = this.state.unlocked[perk.id] === true;
    const prereqMet = !perk.requires || this.state.unlocked[perk.requires] === true;
    const canAfford = this.state.points >= perk.cost;
    const canBuy = !isUnlocked && prereqMet && canAfford;
    const locked = !isUnlocked && !prereqMet;

    let statusClass = "perk__item--locked";
    if (isUnlocked) {
      statusClass = "perk__item--unlocked";
    } else if (canBuy) {
      statusClass = "perk__item--available";
    }

    return `<div class="perk__item ${statusClass}"><div class="perk__item-header"><span class="perk__item-icon">${perk.icon}</span><span class="perk__item-name">${perk.name}</span><span class="perk__item-cost">${isUnlocked ? "✅" : `⭐${perk.cost}`}</span></div><div class="perk__item-desc">${perk.description}</div>${!isUnlocked ? `<button class="perk__buy" type="button" data-perk-id="${perk.id}" ${canBuy ? "" : "disabled"}>${locked ? "🔒 Locked" : canAfford ? "Unlock" : "Need ⭐"}</button>` : ""}</div>`;
  }

  categoryLabel(cat) {
    switch (cat) {
      case "defense":
        return "🛡️ Defense";
      case "economy":
        return "💰 Economy";
      case "morale":
        return "📢 Morale";
      default:
        return cat;
    }
  }

  destroy() {
    this.cleanupHandlers.forEach((off) => off());
    this.cleanupHandlers = [];
    if (this._toastTimeout) {
      clearTimeout(this._toastTimeout);
      this._toastTimeout = null;
    }
  }
}
