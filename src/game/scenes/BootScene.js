import Phaser from "phaser";
import { eventBus } from "../core/EventBus";
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

export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
    this.state = new GameState();
    this.mapSystem = null;
    this.factionSystem = null;
    this.resourceSystem = null;
    this.waveSystem = null;
  }

  preload() {
    this.mapSystem = new MapSystem({
      scene: this,
      eventBus,
      mapViewConfig,
      israelData,
      factionsConfig,
    });
    this.mapSystem.preload();
  }

  create() {
    this.mapSystem.create();
    this.factionSystem = new FactionSystem(factionsConfig);
    this.resourceSystem = new ResourceSystem({
      eventBus,
      gameState: this.state,
      unitsConfig,
    });
    this.waveSystem = new WaveSystem({
      scene: this,
      eventBus,
      gameState: this.state,
      levelConfig: level01,
      israelData,
      factionSystem: this.factionSystem,
      mapSystem: this.mapSystem,
      resourceSystem: this.resourceSystem,
    });

    this.resourceSystem.start();
    this.waveSystem.start();
    eventBus.emit("ui/debug-status", { message: "Debug ready." });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroySystems, this);
  }

  destroySystems() {
    this.waveSystem?.destroy();
    this.resourceSystem?.destroy();
    this.mapSystem?.destroy();
  }
}
