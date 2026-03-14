import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventBus } from "../core/EventBus";
import { Events } from "../core/events";
import { DebugView } from "./DebugView";
import type { DebugElements } from "./DebugView";

function createMockElement(): HTMLElement & { _listeners: Record<string, Function[]> } {
  const listeners: Record<string, Function[]> = {};
  return {
    textContent: "",
    _listeners: listeners,
    setAttribute: vi.fn(),
    getAttribute: vi.fn(() => null),
    hasAttribute: vi.fn(() => false),
    removeAttribute: vi.fn(),
    addEventListener: vi.fn((event: string, handler: Function) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(handler);
    }),
    removeEventListener: vi.fn(),
  } as unknown as HTMLElement & { _listeners: Record<string, Function[]> };
}

describe("DebugView", () => {
  let eventBus: EventBus;
  let elements: DebugElements & { debugToggleButton: ReturnType<typeof createMockElement>; debugPanel: ReturnType<typeof createMockElement>; debugLaunchWaveButton: ReturnType<typeof createMockElement> };
  let view: DebugView;

  beforeEach(() => {
    eventBus = new EventBus();
    elements = {
      debugToggleButton: createMockElement(),
      debugPanel: createMockElement(),
      debugLaunchWaveButton: createMockElement(),
      debugStatus: createMockElement(),
      debugZoom: createMockElement(),
    };
    view = new DebugView({ eventBus, elements });
  });

  it("binds toggle click handler", () => {
    view.bindDomEvents();
    expect(elements.debugToggleButton.addEventListener).toHaveBeenCalledWith("click", expect.any(Function));
  });

  it("binds launch wave click handler", () => {
    view.bindDomEvents();
    expect(elements.debugLaunchWaveButton.addEventListener).toHaveBeenCalledWith("click", expect.any(Function));
  });

  it("emits DEBUG_LAUNCH_WAVE on launch button click", () => {
    const handler = vi.fn();
    eventBus.on(Events.DEBUG_LAUNCH_WAVE, handler);

    view.bindDomEvents();
    const clickHandlers = elements.debugLaunchWaveButton._listeners["click"];
    clickHandlers[0]();

    expect(handler).toHaveBeenCalled();
  });

  it("updates debug status text", () => {
    view.onDebugStatus("Test status message");
    expect(elements.debugStatus!.textContent).toBe("Test status message");
  });

  it("updates debug zoom display", () => {
    view.onDebugZoom(2.5);
    expect(elements.debugZoom!.textContent).toBe("🔎 2.50x");
  });

  it("ignores non-string messages for status", () => {
    elements.debugStatus!.textContent = "original";
    view.onDebugStatus(42 as unknown as string);
    expect(elements.debugStatus!.textContent).toBe("original");
  });

  it("ignores non-number values for zoom", () => {
    elements.debugZoom!.textContent = "original";
    view.onDebugZoom("not a number" as unknown as number);
    expect(elements.debugZoom!.textContent).toBe("original");
  });

  it("destroy removes event listeners", () => {
    view.bindDomEvents();
    view.destroy();

    expect(elements.debugToggleButton.removeEventListener).toHaveBeenCalled();
    expect(elements.debugLaunchWaveButton.removeEventListener).toHaveBeenCalled();
  });
});
