import Phaser from "phaser";
import { BootScene } from "./game/scenes/BootScene.js";

const gameRoot = document.getElementById("game-root");
const debugToggleButton = document.getElementById("debug-toggle");
const debugPanel = document.getElementById("debug-panel");
const debugLaunchWaveButton = document.getElementById("debug-launch-wave");
const debugStatus = document.getElementById("debug-status");

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

if (debugToggleButton && debugPanel) {
  debugToggleButton.addEventListener("click", () => {
    const panelIsHidden = debugPanel.hasAttribute("hidden");
    if (panelIsHidden) {
      debugPanel.removeAttribute("hidden");
      debugToggleButton.setAttribute("aria-expanded", "true");
      return;
    }

    debugPanel.setAttribute("hidden", "");
    debugToggleButton.setAttribute("aria-expanded", "false");
  });
}

if (debugLaunchWaveButton) {
  debugLaunchWaveButton.addEventListener("click", () => {
    window.dispatchEvent(new CustomEvent("debug:launchWaveInstant"));
  });
}

window.addEventListener("debug:status", (event) => {
  if (!debugStatus) {
    return;
  }

  const message = event.detail?.message;
  if (typeof message === "string" && message.length > 0) {
    debugStatus.textContent = message;
  }
});
