export class ImpactSystem {
  constructor({ scene, mapSystem, resourceSystem }) {
    this.scene = scene;
    this.mapSystem = mapSystem;
    this.resourceSystem = resourceSystem;
  }

  createImpact(x, y, faction, missileProfile) {
    const impactScale = (faction.impactMultiplier ?? 1) * (missileProfile.impactScale ?? 1);
    this.resourceSystem.onImpact(impactScale);

    const sf = this.mapSystem.getOverlayScaleFactor?.() ?? 1;
    const impact = this.scene.add.circle(x, y, 3 * sf, missileProfile.rocketColor ?? faction.rocketColor, 0.95);
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
