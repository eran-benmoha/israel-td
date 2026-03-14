import Phaser from "phaser";
import type { Faction, FactionsConfig, MissileProfile } from "../../types";

export class FactionSystem {
  private factions: Faction[];
  private byId: Map<string, Faction>;

  constructor(factionsConfig: FactionsConfig) {
    this.factions = factionsConfig.factions ?? [];
    this.byId = new Map(this.factions.map((faction) => [faction.id, faction]));
  }

  getById(factionId: string): Faction | null {
    return this.byId.get(factionId) ?? null;
  }

  describe(factionId: string): string {
    const faction = this.getById(factionId);
    if (!faction) {
      return "Unknown";
    }
    return `${faction.name} • ${faction.territory}`;
  }

  pickMissileProfile(factionId: string): MissileProfile | null {
    const faction = this.getById(factionId);
    if (!faction) {
      return null;
    }

    if (!Array.isArray(faction.missileProfiles) || faction.missileProfiles.length === 0) {
      return {
        id: `${faction.id}-standard`,
        label: "standard",
        minRangeKm: 0,
        maxRangeKm: 9999,
        rocketColor: faction.rocketColor,
        trailOuterColor: faction.trailColor,
        trailInnerColor: 0xffe2c6,
        flameColor: 0xffd7a8,
        durationMin: faction.durationMin,
        durationMax: faction.durationMax,
        impactScale: 1,
      };
    }

    const weighted: MissileProfile[] = [];
    faction.missileProfiles.forEach((profile) => {
      const weight = Math.max(1, Math.floor(profile.weight ?? 1));
      for (let i = 0; i < weight; i += 1) {
        weighted.push(profile);
      }
    });
    return Phaser.Utils.Array.GetRandom(weighted);
  }
}
