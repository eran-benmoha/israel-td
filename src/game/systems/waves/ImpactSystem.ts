import Phaser from "phaser";
import type { MapSystem } from "../MapSystem";
import type { ResourceSystem } from "../ResourceSystem";
import type { Faction, MissileProfile } from "../../../types";

interface ImpactSystemDeps {
  scene: Phaser.Scene;
  mapSystem: MapSystem;
  resourceSystem: ResourceSystem;
}

export class ImpactSystem {
  private scene: Phaser.Scene;
  private mapSystem: MapSystem;
  private resourceSystem: ResourceSystem;

  constructor({ scene, mapSystem, resourceSystem }: ImpactSystemDeps) {
    this.scene = scene;
    this.mapSystem = mapSystem;
    this.resourceSystem = resourceSystem;
  }

  createImpact(x: number, y: number, faction: Faction, missileProfile: MissileProfile): void {
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
