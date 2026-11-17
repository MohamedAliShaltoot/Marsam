/**
 * Cross-Tab Synchronization via BroadcastChannel
 */
import { eventBus } from '../core/event-bus.js';

const CHANNEL_NAME = 'boardly_cross_tab_sync';

class CrossTabSync {
  constructor() {
    /** @type {BroadcastChannel|null} */
    this.channel = null;
    this.init();
  }

  init() {
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          const { type, payload } = event.data || {};
          if (type) {
            eventBus.emit(`sync:${type}`, payload);
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel not supported or blocked:', e);
      }
    }
  }

  /**
   * Broadcasts a data change event to other tabs
   * @param {string} type - e.g. 'project:changed', 'card:updated'
   * @param {any} [payload]
   */
  broadcast(type, payload = {}) {
    if (this.channel) {
      try {
        this.channel.postMessage({ type, payload });
      } catch (e) {
        // Silent catch
      }
    }
  }

  destroy() {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
  }
}

export const sync = new CrossTabSync();
