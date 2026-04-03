import Phaser from "phaser";
import { eventBus } from "../core/EventBus";
import { Events } from "../core/events";
import { GameState } from "../core/GameState";
import { MapSystem } from "../systems/MapSystem";
import { InputSystem } from "../systems/InputSystem";
import { FactionSystem } from "../systems/FactionSystem";
import { ResourceSystem } from "../systems/ResourceSystem";
import { WaveSystem } from "../systems/WaveSystem";
import { ComboSystem } from "../systems/ComboSystem";
import mapViewConfig from "../../data/map-view.json";
import factionsConfig from "../../data/factions.json";
import unitsConfig from "../../data/units.json";
import israelData from "../../data/israel.json";
import level01 from "../../data/levels/level-01.json";
import comboConfig from "../../data/combo-config.json";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
    this.state = new GameState();
    this.mapSystem = null;
    this.inputSystem = null;
    this.factionSystem = null;
    this.resourceSystem = null;
    this.waveSystem = null;
    this.comboSystem = null;
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
    this.inputSystem = new InputSystem({
      scene: this,
      eventBus,
      mapViewConfig,
    });
    this.mapSystem.setInputSystem(this.inputSystem);

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

    this.comboSystem = new ComboSystem({
      eventBus,
      resourceSystem: this.resourceSystem,
      comboConfig,
    });

    this.resourceSystem.start();
    this.waveSystem.start();
    this.comboSystem.start();
    eventBus.emit(Events.UI_DEBUG_STATUS, { message: "Debug ready." });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroySystems, this);
  }

  update() {
    this.inputSystem?.update();
  }

  destroySystems() {
    this.comboSystem?.destroy();
    this.waveSystem?.destroy();
    this.resourceSystem?.destroy();
    this.mapSystem?.destroy();
  }
}
