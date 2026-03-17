import { describe, it, expect, vi } from "vitest";
import { EventBus } from "../src/game/core/EventBus";

describe("EventBus", () => {
  it("delivers payload to registered listeners", () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on("test", handler);
    bus.emit("test", { value: 42 });
    expect(handler).toHaveBeenCalledWith({ value: 42 });
  });

  it("supports multiple listeners on the same event", () => {
    const bus = new EventBus();
    const a = vi.fn();
    const b = vi.fn();
    bus.on("x", a);
    bus.on("x", b);
    bus.emit("x", "payload");
    expect(a).toHaveBeenCalledOnce();
    expect(b).toHaveBeenCalledOnce();
  });

  it("does not call listeners for other events", () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on("a", handler);
    bus.emit("b", null);
    expect(handler).not.toHaveBeenCalled();
  });

  it("returns an unsubscribe function from on()", () => {
    const bus = new EventBus();
    const handler = vi.fn();
    const unsub = bus.on("e", handler);
    unsub();
    bus.emit("e", null);
    expect(handler).not.toHaveBeenCalled();
  });

  it("off() removes a specific listener", () => {
    const bus = new EventBus();
    const kept = vi.fn();
    const removed = vi.fn();
    bus.on("e", kept);
    bus.on("e", removed);
    bus.off("e", removed);
    bus.emit("e", null);
    expect(kept).toHaveBeenCalledOnce();
    expect(removed).not.toHaveBeenCalled();
  });

  it("emit with no listeners does not throw", () => {
    const bus = new EventBus();
    expect(() => bus.emit("nonexistent", {})).not.toThrow();
  });

  it("cleans up event key when last listener is removed", () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on("e", handler);
    bus.off("e", handler);
    expect(bus.listeners.has("e")).toBe(false);
  });
});
