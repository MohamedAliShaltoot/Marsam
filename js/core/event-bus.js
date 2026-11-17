/**
 * Lightweight Typed Event Bus
 */

class EventBus {
  constructor() {
    /** @type {Map<string, Set<Function>>} */
    this.listeners = new Map();
  }

  /**
   * Subscribes to an event
   * @param {string} event
   * @param {Function} handler
   * @returns {() => void} Unsubscribe handle
   */
  on(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const handlers = this.listeners.get(event);
    handlers.add(handler);

    return () => {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.listeners.delete(event);
      }
    };
  }

  /**
   * Emits an event with optional payload
   * @param {string} event
   * @param {any} [payload]
   */
  emit(event, payload) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(payload);
        } catch (err) {
          console.error(`Error in event handler for "${event}":`, err);
        }
      }
    }
  }

  /**
   * Clears all event listeners
   */
  clear() {
    this.listeners.clear();
  }
}

export const eventBus = new EventBus();
