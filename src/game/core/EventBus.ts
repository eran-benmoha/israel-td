export type EventHandler<T = unknown> = (payload: T) => void;

export class EventBus {
  private listeners = new Map<string, Set<EventHandler>>();

  on<T = unknown>(eventName: string, handler: EventHandler<T>): () => void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }

    this.listeners.get(eventName)!.add(handler as EventHandler);
    return () => this.off(eventName, handler);
  }

  off<T = unknown>(eventName: string, handler: EventHandler<T>): void {
    const handlers = this.listeners.get(eventName);
    if (!handlers) {
      return;
    }

    handlers.delete(handler as EventHandler);
    if (handlers.size === 0) {
      this.listeners.delete(eventName);
    }
  }

  emit<T = unknown>(eventName: string, payload?: T): void {
    const handlers = this.listeners.get(eventName);
    if (!handlers) {
      return;
    }

    [...handlers].forEach((handler) => handler(payload));
  }
}

export const eventBus = new EventBus();
