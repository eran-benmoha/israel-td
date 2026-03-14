import { Events } from "../core/events";

export class DebugView {
  constructor({ eventBus, elements }) {
    this.eventBus = eventBus;
    this.elements = elements;
    this.cleanupHandlers = [];
  }

  bindDomEvents() {
    const { debugToggleButton, debugPanel, debugLaunchWaveButton } = this.elements;

    if (debugToggleButton && debugPanel) {
      const onToggle = () => {
        const hidden = debugPanel.hasAttribute("hidden");
        if (hidden) {
          debugPanel.removeAttribute("hidden");
          debugToggleButton.setAttribute("aria-expanded", "true");
          return;
        }
        debugPanel.setAttribute("hidden", "");
        debugToggleButton.setAttribute("aria-expanded", "false");
      };
      debugToggleButton.addEventListener("click", onToggle);
      this.cleanupHandlers.push(() => debugToggleButton.removeEventListener("click", onToggle));
    }

    if (debugLaunchWaveButton) {
      const onLaunch = () => this.eventBus.emit(Events.DEBUG_LAUNCH_WAVE);
      debugLaunchWaveButton.addEventListener("click", onLaunch);
      this.cleanupHandlers.push(() => debugLaunchWaveButton.removeEventListener("click", onLaunch));
    }
  }

  onDebugStatus(message) {
    if (this.elements.debugStatus && typeof message === "string") {
      this.elements.debugStatus.textContent = message;
    }
  }

  onDebugZoom(zoom) {
    if (this.elements.debugZoom && typeof zoom === "number" && Number.isFinite(zoom)) {
      this.elements.debugZoom.textContent = `🔎 ${zoom.toFixed(2)}x`;
    }
  }

  destroy() {
    this.cleanupHandlers.forEach((off) => off());
    this.cleanupHandlers = [];
  }
}
