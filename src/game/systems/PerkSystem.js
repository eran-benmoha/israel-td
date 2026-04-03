import { Events } from "../core/events";
import { isPerkUnlocked, getPerkPoints, getActiveEffectTotal } from "../core/selectors";

export class PerkSystem {
  constructor({ eventBus, gameState, perksConfig }) {
    this.eventBus = eventBus;
    this.state = gameState;
    this.config = perksConfig;
    this.perks = perksConfig.perks ?? [];
    this.pointsPerWave = perksConfig.pointsPerWave ?? 1;
    this.unsubscribers = [];
  }

  start() {
    this.unsubscribers.push(
      this.eventBus.on(Events.PERK_UNLOCK, ({ perkId }) => this.unlockPerk(perkId)),
    );
    this.publishPerkState();
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
    this.unsubscribers = [];
  }

  onWaveSurvived() {
    this.state.perks.points += this.pointsPerWave;
    this.publishPerkState();
  }

  unlockPerk(perkId) {
    const perk = this.perks.find((p) => p.id === perkId);
    if (!perk) {
      return;
    }

    if (isPerkUnlocked(this.state, perkId)) {
      return;
    }

    if (perk.requires && !isPerkUnlocked(this.state, perk.requires)) {
      return;
    }

    if (getPerkPoints(this.state) < perk.cost) {
      return;
    }

    this.state.perks.points -= perk.cost;
    this.state.perks.unlocked[perkId] = true;
    this.publishPerkState();
    this.eventBus.emit(Events.UI_PERK_UNLOCKED, { perk });
    this.eventBus.emit(Events.UI_DEBUG_STATUS, { message: `⭐ Perk unlocked: ${perk.name}` });
  }

  getEffectTotal(effectType) {
    return getActiveEffectTotal(this.state, this.config, effectType);
  }

  publishPerkState() {
    this.eventBus.emit(Events.UI_PERKS, {
      points: getPerkPoints(this.state),
      unlocked: { ...this.state.perks.unlocked },
      perks: this.perks,
    });
  }
}
