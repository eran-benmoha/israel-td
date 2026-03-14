import Phaser from "phaser";
import { BootScene } from "./game/scenes/BootScene.js";

const gameRoot = document.getElementById("game-root");

const config = {
  type: Phaser.AUTO,
  parent: gameRoot,
  backgroundColor: "#05070e",
  scene: [BootScene],
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: gameRoot.clientWidth || window.innerWidth,
    height: gameRoot.clientHeight || window.innerHeight,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

new Phaser.Game(config);
