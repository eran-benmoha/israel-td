import type { EventBus } from "../core/EventBus";
import { Events } from "../core/events";

export interface DebugElements {
  debugToggleButton: HTMLElement | null;
  debugPanel: HTMLElement | null;
  debugLaunchWaveButton: HTMLElement | null;
  debugStatus: HTMLElement | null;
  debugZoom: HTMLElement | null;
}

export class DebugView {
  private eventBus: EventBus;
  private elements: DebugElements;
  private cleanupHandlers: Array<() => void> = [];

  constructor({ eventBus, elements }: { eventBus: EventBus; elements: DebugElements }) {
    this.eventBus = eventBus;
    this.elements = elements;
  }

  bindDomEvents(): void {
    const { debugToggleButton, debugPanel, debugLaunchWaveButton } = this.elements;

    if (debugToggleButton && debugPanel) {
      const onToggle = (): void => {
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
      const onLaunch = (): void => {
        this.eventBus.emit(Events.DEBUG_LAUNCH_WAVE);
      };
      debugLaunchWaveButton.addEventListener("click", onLaunch);
      this.cleanupHandlers.push(() => debugLaunchWaveButton.removeEventListener("click", onLaunch));
    }
  }

  onDebugStatus(message: string): void {
    if (this.elements.debugStatus && typeof message === "string") {
      this.elements.debugStatus.textContent = message;
    }
  }

  onDebugZoom(zoom: number): void {
    if (this.elements.debugZoom && typeof zoom === "number" && Number.isFinite(zoom)) {
      this.elements.debugZoom.textContent = `🔎 ${zoom.toFixed(2)}x`;
    }
  }

  destroy(): void {
    this.cleanupHandlers.forEach((off) => off());
    this.cleanupHandlers = [];
  }
}
