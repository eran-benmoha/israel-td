export class ImpactSystem {
  constructor({ scene, mapSystem, resourceSystem, perkSystem }) {
    this.scene = scene;
    this.mapSystem = mapSystem;
    this.resourceSystem = resourceSystem;
    this.perkSystem = perkSystem ?? null;
  }

  createImpact(x, y, faction, missileProfile) {
    let impactScale = (faction.impactMultiplier ?? 1) * (missileProfile.impactScale ?? 1);
    if (this.perkSystem) {
      const impactReduction = this.perkSystem.getEffectTotal("impact_reduction");
      impactScale *= (1 - impactReduction);
    }
    const moraleShield = this.perkSystem ? this.perkSystem.getEffectTotal("morale_shield") : 0;
    this.resourceSystem.onImpact(impactScale, moraleShield);

    const sf = this.mapSystem.getOverlayScaleFactor?.() ?? 1;
    const impact = this.scene.add.circle(x, y, 12 * sf, missileProfile.rocketColor ?? faction.rocketColor, 0.95);
    this.mapSystem.mapContainer.add(impact);
    this.scene.tweens.add({
      targets: impact,
      scale: 6,
      alpha: 0,
      duration: 280,
      ease: "Cubic.easeOut",
      onComplete: () => impact.destroy(),
    });
  }
}
