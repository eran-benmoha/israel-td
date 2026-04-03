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

export function isPerkUnlocked(gameState, perkId) {
  return gameState.perks.unlocked[perkId] === true;
}

export function getPerkPoints(gameState) {
  return gameState.perks.points;
}

export function getActiveEffectTotal(gameState, perksConfig, effectType) {
  const perks = perksConfig.perks ?? [];
  return perks.reduce((total, perk) => {
    if (gameState.perks.unlocked[perk.id] && perk.effect.type === effectType) {
      return total + perk.effect.value;
    }
    return total;
  }, 0);
}
