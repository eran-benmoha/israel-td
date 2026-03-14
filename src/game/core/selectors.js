export function getPurchasedUnitCount(gameState, unitId) {
  return gameState.purchasedUnits[unitId] ?? 0;
}

export function getWaveDefinition(levelConfig, waveNumber) {
  const waves = levelConfig.waves ?? [];
  if (waves.length === 0) {
    return null;
  }

  const index = (waveNumber - 1 + waves.length) % waves.length;
  return waves[Math.max(0, index)];
}

export function getUpcomingFactionId(levelConfig, waveNumber) {
  return getWaveDefinition(levelConfig, waveNumber)?.factionId ?? null;
}
