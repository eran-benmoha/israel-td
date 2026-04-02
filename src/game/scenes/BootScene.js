import Phaser from "phaser";
import { eventBus } from "../core/EventBus";
import { Events } from "../core/events";
import { GameState } from "../core/GameState";
import { MapSystem } from "../systems/MapSystem";
import { InputSystem } from "../systems/InputSystem";
import { FactionSystem } from "../systems/FactionSystem";
import { ResourceSystem } from "../systems/ResourceSystem";
import { WaveSystem } from "../systems/WaveSystem";
import { ScoreSystem } from "../systems/ScoreSystem";
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
    this.inputSystem = null;
    this.factionSystem = null;
    this.resourceSystem = null;
    this.waveSystem = null;
    this.scoreSystem = null;
    this.unsubscribeRestart = null;
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
    this.scoreSystem = new ScoreSystem({
      eventBus,
      gameState: this.state,
      totalWaves: (level01.waves ?? []).length,
    });

    this.resourceSystem.start();
    this.waveSystem.start();
    this.scoreSystem.start();
    eventBus.emit(Events.UI_DEBUG_STATUS, { message: "Debug ready." });

    this.unsubscribeRestart = eventBus.on(Events.GAME_RESTART, () => this.restartGame());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroySystems, this);
  }

  update() {
    this.inputSystem?.update();
  }

  restartGame() {
    this.destroySystems();
    this.state.reset();

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
    this.scoreSystem = new ScoreSystem({
      eventBus,
      gameState: this.state,
      totalWaves: (level01.waves ?? []).length,
    });

    this.resourceSystem.start();
    this.waveSystem.start();
    this.scoreSystem.start();
    eventBus.emit(Events.UI_DEBUG_STATUS, { message: "Game restarted." });
  }

  destroySystems() {
    this.scoreSystem?.destroy();
    this.waveSystem?.destroy();
    this.resourceSystem?.destroy();
    if (this.unsubscribeRestart) {
      this.unsubscribeRestart();
      this.unsubscribeRestart = null;
    }
  }
}
