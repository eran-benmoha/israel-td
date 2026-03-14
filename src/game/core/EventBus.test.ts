import { describe, it, expect, vi } from "vitest";
import { EventBus } from "./EventBus";

describe("EventBus", () => {
  it("calls registered handler when event is emitted", () => {
    const bus = new EventBus();
    const handler = vi.fn();

    bus.on("test", handler);
    bus.emit("test", { value: 42 });

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith({ value: 42 });
  });

  it("supports multiple handlers for the same event", () => {
    const bus = new EventBus();
    const h1 = vi.fn();
    const h2 = vi.fn();

    bus.on("test", h1);
    bus.on("test", h2);
    bus.emit("test", "payload");

    expect(h1).toHaveBeenCalledOnce();
    expect(h2).toHaveBeenCalledOnce();
  });

  it("does not call handlers for different events", () => {
    const bus = new EventBus();
    const handler = vi.fn();

    bus.on("other", handler);
    bus.emit("test", "payload");

    expect(handler).not.toHaveBeenCalled();
  });

  it("removes handler via returned unsubscribe function", () => {
    const bus = new EventBus();
    const handler = vi.fn();

    const unsub = bus.on("test", handler);
    unsub();
    bus.emit("test");

    expect(handler).not.toHaveBeenCalled();
  });

  it("removes handler via off()", () => {
    const bus = new EventBus();
    const handler = vi.fn();

    bus.on("test", handler);
    bus.off("test", handler);
    bus.emit("test");

    expect(handler).not.toHaveBeenCalled();
  });

  it("off() is safe when event has no handlers", () => {
    const bus = new EventBus();
    expect(() => bus.off("nonexistent", vi.fn())).not.toThrow();
  });

  it("emit() is safe when event has no handlers", () => {
    const bus = new EventBus();
    expect(() => bus.emit("nonexistent")).not.toThrow();
  });

  it("emit without payload passes undefined", () => {
    const bus = new EventBus();
    const handler = vi.fn();

    bus.on("test", handler);
    bus.emit("test");

    expect(handler).toHaveBeenCalledWith(undefined);
  });

  it("removing one handler does not affect others", () => {
    const bus = new EventBus();
    const h1 = vi.fn();
    const h2 = vi.fn();

    bus.on("test", h1);
    bus.on("test", h2);
    bus.off("test", h1);
    bus.emit("test");

    expect(h1).not.toHaveBeenCalled();
    expect(h2).toHaveBeenCalledOnce();
  });

  it("cleans up empty handler sets", () => {
    const bus = new EventBus();
    const handler = vi.fn();

    bus.on("test", handler);
    bus.off("test", handler);
    bus.emit("test");

    expect(handler).not.toHaveBeenCalled();
  });
});
