import type { GameState } from "./GameState";
import type { LevelConfig, WaveDefinition } from "../../types";

export function getPurchasedUnitCount(gameState: GameState, unitId: string): number {
  return gameState.purchasedUnits[unitId] ?? 0;
}

export function getWaveDefinition(levelConfig: LevelConfig, waveNumber: number): WaveDefinition | null {
  const waves = levelConfig.waves ?? [];
  if (waves.length === 0) {
    return null;
  }

  const index = (waveNumber - 1 + waves.length) % waves.length;
  return waves[Math.max(0, index)];
}

export function getUpcomingFactionId(levelConfig: LevelConfig, waveNumber: number): string | null {
  return getWaveDefinition(levelConfig, waveNumber)?.factionId ?? null;
}
