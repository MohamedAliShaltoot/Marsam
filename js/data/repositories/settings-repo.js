/**
 * Settings Repository
 * Manages user preferences: theme, accent, lastOpenedProjectId, reducedMotion, liteVisuals
 */
import { db } from '../db.js';
import { STORES } from '../schema.js';

const SETTINGS_KEY = 'settings';

/** @type {import('../../core/store.js').Settings} */
const DEFAULT_SETTINGS = {
  id: 'settings',
  theme: 'system',
  accent: 'violet',
  lastOpenedProjectId: null,
  reducedMotion: false,
  liteVisuals: false,
  soundEnabled: true,
  soundVolume: 40,
  soundTheme: 'soft',
  soundReduced: false
};

export const settingsRepo = {
  /**
   * Loads persisted settings or returns defaults
   * @returns {Promise<import('../../core/store.js').Settings>}
   */
  async get() {
    const record = await db.get(STORES.SETTINGS, SETTINGS_KEY);
    return { ...DEFAULT_SETTINGS, ...(record || {}) };
  },

  /**
   * Saves updated settings
   * @param {Partial<import('../../core/store.js').Settings>} partialSettings
   * @returns {Promise<import('../../core/store.js').Settings>}
   */
  async save(partialSettings) {
    const current = await this.get();
    const updated = { ...current, ...partialSettings, id: 'settings' };
    await db.put(STORES.SETTINGS, updated);
    return updated;
  }
};
