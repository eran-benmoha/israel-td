import Phaser from "phaser";
import { eventBus } from "../core/EventBus";
import { Events } from "../core/events";
import { GameState } from "../core/GameState";
import { MapSystem } from "../systems/MapSystem";
import { FactionSystem } from "../systems/FactionSystem";
import { ResourceSystem } from "../systems/ResourceSystem";
import { WaveSystem } from "../systems/WaveSystem";
import mapViewConfig from "../../data/map-view.json";
import factionsConfig from "../../data/factions.json";
import unitsConfig from "../../data/units.json";
import israelData from "../../data/israel.json";
import level01 from "../../data/levels/level-01.json";
import type { FactionsConfig, IsraelData, LevelConfig, MapViewConfig, UnitsConfig } from "../../types";

export class BootScene extends Phaser.Scene {
  private state = new GameState();
  private mapSystem: MapSystem | null = null;
  private factionSystem: FactionSystem | null = null;
  private resourceSystem: ResourceSystem | null = null;
  private waveSystem: WaveSystem | null = null;

  constructor() {
    super("boot");
  }

  preload(): void {
    this.mapSystem = new MapSystem({
      scene: this,
      eventBus,
      mapViewConfig: mapViewConfig as MapViewConfig,
      israelData: israelData as IsraelData,
      factionsConfig: factionsConfig as FactionsConfig,
    });
    this.mapSystem.preload();
  }

  create(): void {
    this.mapSystem!.create();
    this.factionSystem = new FactionSystem(factionsConfig as FactionsConfig);
    this.resourceSystem = new ResourceSystem({
      eventBus,
      gameState: this.state,
      unitsConfig: unitsConfig as UnitsConfig,
    });
    this.waveSystem = new WaveSystem({
      scene: this,
      eventBus,
      gameState: this.state,
      levelConfig: level01 as LevelConfig,
      israelData: israelData as IsraelData,
      factionSystem: this.factionSystem,
      mapSystem: this.mapSystem!,
      resourceSystem: this.resourceSystem,
    });

    this.resourceSystem.start();
    this.waveSystem.start();
    eventBus.emit(Events.UI_DEBUG_STATUS, { message: "Debug ready." });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroySystems, this);
  }

  private destroySystems(): void {
    this.waveSystem?.destroy();
    this.resourceSystem?.destroy();
    this.mapSystem?.destroy();
  }
}
