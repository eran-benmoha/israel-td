import type { EventBus } from "../core/EventBus";
import { Events } from "../core/events";
import type { GameState } from "../core/GameState";
import type { FactionSystem } from "./FactionSystem";
import type { MapSystem } from "./MapSystem";
import type { ResourceSystem } from "./ResourceSystem";
import { WaveDirector } from "./waves/WaveDirector";
import type { WaveLaunchPayload } from "./waves/WaveDirector";
import { ProjectileSystem } from "./waves/ProjectileSystem";
import { InterceptionSystem } from "./waves/InterceptionSystem";
import { ImpactSystem } from "./waves/ImpactSystem";
import type { IsraelData, LevelConfig, Target } from "../../types";

interface WaveSystemDeps {
  scene: Phaser.Scene;
  eventBus: EventBus;
  gameState: GameState;
  levelConfig: LevelConfig;
  israelData: IsraelData;
  factionSystem: FactionSystem;
  mapSystem: MapSystem;
  resourceSystem: ResourceSystem;
}

export class WaveSystem {
  private scene: Phaser.Scene;
  private eventBus: EventBus;
  private state: GameState;
  private targets: Target[];
  private factionSystem: FactionSystem;
  private resourceSystem: ResourceSystem;
  private unsubscribeDebugLaunch: (() => void) | null = null;

  private director: WaveDirector;
  private interceptionSystem: InterceptionSystem;
  private impactSystem: ImpactSystem;
  private projectileSystem: ProjectileSystem;

  constructor({ scene, eventBus, gameState, levelConfig, israelData, factionSystem, mapSystem, resourceSystem }: WaveSystemDeps) {
    this.scene = scene;
    this.eventBus = eventBus;
    this.state = gameState;
    this.targets = israelData.targets ?? [];
    this.factionSystem = factionSystem;
    this.resourceSystem = resourceSystem;

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

  start(): void {
    this.director.start((payload: WaveLaunchPayload) => this.launchWave(payload));
    this.unsubscribeDebugLaunch = this.eventBus.on(Events.DEBUG_LAUNCH_WAVE, () => this.launchWave({ source: "debug" }));
  }

  private launchWave({ source }: WaveLaunchPayload): void {
    const launchResult = this.director.launchNextWave({
      source,
      onWaveDue: (payload: WaveLaunchPayload) => this.launchWave(payload),
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

  destroy(): void {
    this.director.destroy();
    if (this.unsubscribeDebugLaunch) {
      this.unsubscribeDebugLaunch();
      this.unsubscribeDebugLaunch = null;
    }
  }
}
