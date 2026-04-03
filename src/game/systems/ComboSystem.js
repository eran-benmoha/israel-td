import { Events } from "../core/events";

export class ComboSystem {
  constructor({ eventBus, resourceSystem, comboConfig }) {
    this.eventBus = eventBus;
    this.resourceSystem = resourceSystem;
    this.config = comboConfig;
    this.streak = 0;
    this.bestStreak = 0;
    this.decayTimer = null;
    this.unsubscribers = [];
  }

  start() {
    this.unsubscribers.push(
      this.eventBus.on(Events.MISSILE_INTERCEPTED, () => this.onInterception()),
      this.eventBus.on(Events.MISSILE_IMPACT, () => this.onImpact()),
    );
    this.publishCombo();
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
    this.unsubscribers = [];
    if (this.decayTimer) {
      clearTimeout(this.decayTimer);
      this.decayTimer = null;
    }
  }

  onInterception() {
    this.streak += 1;
    if (this.streak > this.bestStreak) {
      this.bestStreak = this.streak;
    }
    this.resetDecayTimer();
    this.awardTierBonus();
    this.publishCombo();
  }

  onImpact() {
    if (this.streak > 0) {
      this.streak = 0;
      this.clearDecayTimer();
      this.publishCombo();
    }
  }

  resetDecayTimer() {
    this.clearDecayTimer();
    this.decayTimer = setTimeout(() => {
      this.streak = 0;
      this.decayTimer = null;
      this.publishCombo();
    }, this.config.decayMs);
  }

  clearDecayTimer() {
    if (this.decayTimer) {
      clearTimeout(this.decayTimer);
      this.decayTimer = null;
    }
  }

  getCurrentTier() {
    const tiers = this.config.tiers;
    let matched = null;
    for (const tier of tiers) {
      if (this.streak >= tier.minStreak) {
        matched = tier;
      }
    }
    return matched;
  }

  awardTierBonus() {
    const tier = this.getCurrentTier();
    if (!tier) return;

    const isExactThreshold = this.streak === tier.minStreak;
    if (isExactThreshold) {
      this.resourceSystem.adjust("money", tier.moneyBonus);
      this.resourceSystem.adjust("morale", tier.moraleBonus);
      this.resourceSystem.publishResourceState();
      this.eventBus.emit(Events.UI_DEBUG_STATUS, {
        message: `🔥 ${tier.label} ${this.streak}x combo! +${tier.moneyBonus} money`,
      });
    }
  }

  publishCombo() {
    const tier = this.getCurrentTier();
    this.eventBus.emit(Events.UI_COMBO, {
      streak: this.streak,
      bestStreak: this.bestStreak,
      tier: tier ? { ...tier } : null,
    });
  }
}
