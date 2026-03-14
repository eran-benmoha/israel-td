import Phaser from "phaser";
import { BootScene } from "./game/scenes/BootScene.js";
import { UiSystem } from "./game/systems/UiSystem";
import { eventBus } from "./game/core/EventBus";

const gameRoot = document.getElementById("game-root");
const uiSystem = new UiSystem({ eventBus });
uiSystem.start();

new Phaser.Game({
  type: Phaser.AUTO,
  parent: gameRoot,
  backgroundColor: "#05070e",
  antialias: true,
  roundPixels: false,
  scene: [BootScene],
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: gameRoot.clientWidth || window.innerWidth,
    height: gameRoot.clientHeight || window.innerHeight,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
});
