import { Events } from "../core/events";
import { WaveDirector } from "./waves/WaveDirector";
import { ProjectileSystem } from "./waves/ProjectileSystem";
import { InterceptionSystem } from "./waves/InterceptionSystem";
import { ImpactSystem } from "./waves/ImpactSystem";

export class WaveSystem {
  constructor({ scene, eventBus, gameState, levelConfig, israelData, factionSystem, mapSystem, resourceSystem, unitsConfig }) {
    this.scene = scene;
    this.eventBus = eventBus;
    this.state = gameState;
    this.targets = israelData.targets ?? [];
    this.factionSystem = factionSystem;
    this.resourceSystem = resourceSystem;
    this.unsubscribeDebugLaunch = null;

    this.director = new WaveDirector({
      scene,
      eventBus,
      gameState,
      levelConfig,
      factionSystem,
    });
    this.interceptionSystem = new InterceptionSystem({
      scene,
      eventBus,
      gameState,
      factionSystem,
      mapSystem,
      targets: this.targets,
      unitsConfig,
    });
    this.impactSystem = new ImpactSystem({
      scene,
      mapSystem,
      resourceSystem,
    });
    this.projectileSystem = new ProjectileSystem({
      scene,
      mapSystem,
      factionSystem,
      targets: this.targets,
      interceptionSystem: this.interceptionSystem,
      impactSystem: this.impactSystem,
    });
  }

  start() {
    this.director.start((payload) => this.launchWave(payload));
    this.unsubscribeDebugLaunch = this.eventBus.on(Events.DEBUG_LAUNCH_WAVE, () => this.launchWave({ source: "debug" }));
  }

  launchWave({ source }) {
    const launchResult = this.director.launchNextWave({
      source,
      onWaveDue: (payload) => this.launchWave(payload),
    });
    if (!launchResult) {
      return;
    }

    const { wave, faction } = launchResult;
    this.projectileSystem.spawnRocketWave(faction, wave, this.state.wave.number);
    this.resourceSystem.onWaveLaunched(this.state.wave.number);
    this.eventBus.emit(Events.UI_DEBUG_STATUS, {
      message:
        source === "debug"
          ? `Instant wave ${this.state.wave.number} launched from ${this.factionSystem.describe(faction.id)}.`
          : `Wave ${this.state.wave.number} launched from ${this.factionSystem.describe(faction.id)}.`,
    });
  }

  destroy() {
    this.director.destroy();
    if (this.unsubscribeDebugLaunch) {
      this.unsubscribeDebugLaunch();
      this.unsubscribeDebugLaunch = null;
    }
  }
}
