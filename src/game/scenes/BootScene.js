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
import { getLevelCatalog, resolveInitialLevelConfig } from "../../data/levels/index.js";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
    this.levelConfig = resolveInitialLevelConfig();
    this.state = new GameState({ levelConfig: this.levelConfig });
    this.levelCatalog = getLevelCatalog();
    this.mapSystem = null;
    this.factionSystem = null;
    this.resourceSystem = null;
    this.waveSystem = null;
    this.titleText = null;
    this.resizeHandler = null;
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
      levelConfig: this.levelConfig,
      israelData,
      factionSystem: this.factionSystem,
      mapSystem: this.mapSystem,
      resourceSystem: this.resourceSystem,
    });

    this.resourceSystem.start();
    this.waveSystem.start();
    this.createStaticTitle();
    eventBus.emit("ui/debug-status", {
      message: `Loaded ${this.levelConfig.name} (${this.levelConfig.id}) • ${this.levelCatalog.length} levels available.`,
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroySystems, this);
  }

  createStaticTitle() {
    const { width } = this.scale;
    const subtitle = this.levelConfig.subtitle ?? "Drag + pinch/scroll zoom • Hostile waves";
    this.titleText = this.add
      .text(width / 2, 34, `${this.levelConfig.name}\n${subtitle}`, {
        fontFamily: "Arial",
        fontSize: "16px",
        color: "#dbe9ff",
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        padding: { x: 10, y: 6 },
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0);
    this.titleText.setAlign("center");
    this.titleText.setLineSpacing(2);

    this.resizeHandler = (gameSize) => {
      if (this.titleText) {
        this.titleText.setPosition(gameSize.width / 2, 34);
      }
    };
    this.scale.on("resize", this.resizeHandler);
  }

  destroySystems() {
    this.waveSystem?.destroy();
    this.resourceSystem?.destroy();
    this.mapSystem?.destroy();
    if (this.resizeHandler) {
      this.scale.off("resize", this.resizeHandler);
      this.resizeHandler = null;
    }
  }
}
