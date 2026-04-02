import { Events } from "../core/events";

const TICK_INTERVAL_MS = 250;

export class AbilitySystem {
  constructor({ eventBus, gameState, resourceSystem, interceptionSystem, projectileSystem, abilitiesConfig }) {
    this.eventBus = eventBus;
    this.state = gameState;
    this.resourceSystem = resourceSystem;
    this.interceptionSystem = interceptionSystem;
    this.projectileSystem = projectileSystem;
    this.abilities = abilitiesConfig.abilities ?? [];
    this.unsubscribeActivate = null;
    this.tickTimer = null;
    this.lastTickTime = 0;
  }

  start() {
    for (const ability of this.abilities) {
      this.state.abilities[ability.id] = {
        remainingCooldownMs: 0,
        remainingDurationMs: 0,
        unlocked: this.state.wave.number >= ability.unlockWave,
      };
    }

    this.unsubscribeActivate = this.eventBus.on(Events.ABILITY_ACTIVATE, ({ abilityId }) =>
      this.activateAbility(abilityId),
    );

    this.lastTickTime = Date.now();
    this.tickTimer = setInterval(() => this.tick(), TICK_INTERVAL_MS);

    this.publishState();
  }

  destroy() {
    if (this.unsubscribeActivate) {
      this.unsubscribeActivate();
      this.unsubscribeActivate = null;
    }
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
  }

  tick() {
    const now = Date.now();
    const deltaMs = now - this.lastTickTime;
    this.lastTickTime = now;

    let changed = false;
    for (const ability of this.abilities) {
      const abilityState = this.state.abilities[ability.id];
      if (!abilityState) continue;

      const wasUnlocked = abilityState.unlocked;
      abilityState.unlocked = this.state.wave.number >= ability.unlockWave;
      if (abilityState.unlocked !== wasUnlocked) changed = true;

      if (abilityState.remainingCooldownMs > 0) {
        abilityState.remainingCooldownMs = Math.max(0, abilityState.remainingCooldownMs - deltaMs);
        changed = true;
      }

      if (abilityState.remainingDurationMs > 0) {
        abilityState.remainingDurationMs = Math.max(0, abilityState.remainingDurationMs - deltaMs);
        changed = true;

        if (abilityState.remainingDurationMs <= 0) {
          this.onEffectExpired(ability);
        }
      }
    }

    if (changed) {
      this.publishState();
    }
  }

  activateAbility(abilityId) {
    const ability = this.abilities.find((a) => a.id === abilityId);
    if (!ability) {
      this.eventBus.emit(Events.UI_ABILITY_RESULT, { success: false, message: "Unknown ability." });
      return;
    }

    const abilityState = this.state.abilities[abilityId];
    if (!abilityState || !abilityState.unlocked) {
      this.eventBus.emit(Events.UI_ABILITY_RESULT, { success: false, message: `${ability.name} is not unlocked yet.` });
      return;
    }

    if (abilityState.remainingCooldownMs > 0) {
      const seconds = Math.ceil(abilityState.remainingCooldownMs / 1000);
      this.eventBus.emit(Events.UI_ABILITY_RESULT, {
        success: false,
        message: `${ability.name} on cooldown (${seconds}s).`,
      });
      return;
    }

    if (this.state.resources.money < ability.moneyCost) {
      this.eventBus.emit(Events.UI_ABILITY_RESULT, {
        success: false,
        message: `Not enough money for ${ability.name}.`,
      });
      return;
    }

    if (ability.moneyCost > 0) {
      this.resourceSystem.adjust("money", -ability.moneyCost);
    }

    abilityState.remainingCooldownMs = ability.cooldownMs;
    if (ability.durationMs > 0) {
      abilityState.remainingDurationMs = ability.durationMs;
    }

    this.applyEffect(ability);

    this.resourceSystem.publishResourceState();
    this.publishState();

    this.eventBus.emit(Events.UI_ABILITY_RESULT, { success: true, message: `${ability.name} activated!` });
    this.eventBus.emit(Events.UI_DEBUG_STATUS, { message: `⚡ ${ability.name} activated!` });
  }

  applyEffect(ability) {
    const effect = ability.effect;
    if (!effect) return;

    switch (effect.type) {
      case "interception-boost":
        this.interceptionSystem.setInterceptionBoost(effect.multiplier ?? 2);
        break;

      case "destroy-all-missiles": {
        const count = this.projectileSystem.destroyAllActiveRockets();
        this.eventBus.emit(Events.UI_DEBUG_STATUS, { message: `💥 Airstrike destroyed ${count} missiles!` });
        break;
      }

      case "resource-grant":
        if (effect.grants) {
          for (const [resource, amount] of Object.entries(effect.grants)) {
            this.resourceSystem.adjust(resource, amount);
          }
        }
        if (effect.penalties) {
          for (const [resource, amount] of Object.entries(effect.penalties)) {
            this.resourceSystem.adjust(resource, amount);
          }
        }
        break;
    }
  }

  onEffectExpired(ability) {
    const effect = ability.effect;
    if (!effect) return;

    switch (effect.type) {
      case "interception-boost":
        this.interceptionSystem.setInterceptionBoost(1);
        this.eventBus.emit(Events.UI_DEBUG_STATUS, { message: `🚨 ${ability.name} expired.` });
        break;
    }
  }

  publishState() {
    const abilityStates = this.abilities.map((ability) => {
      const s = this.state.abilities[ability.id];
      return {
        id: ability.id,
        name: ability.name,
        icon: ability.icon,
        description: ability.description,
        moneyCost: ability.moneyCost,
        cooldownMs: ability.cooldownMs,
        durationMs: ability.durationMs,
        unlocked: s?.unlocked ?? false,
        remainingCooldownMs: s?.remainingCooldownMs ?? 0,
        remainingDurationMs: s?.remainingDurationMs ?? 0,
        ready: (s?.unlocked ?? false) && (s?.remainingCooldownMs ?? 0) <= 0,
      };
    });
    this.eventBus.emit(Events.UI_ABILITY_STATE, { abilities: abilityStates });
  }
}
