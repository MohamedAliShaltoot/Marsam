import { db } from '../db.js';
import { STORES } from '../schema.js';

const SETTINGS_KEY = 'settings';

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
  async get() {
    const record = await db.get(STORES.SETTINGS, SETTINGS_KEY);
    return { ...DEFAULT_SETTINGS, ...(record || {}) };
  },

  async save(partialSettings) {
    const current = await this.get();
    const updated = { ...current, ...partialSettings, id: 'settings' };
    await db.put(STORES.SETTINGS, updated);
    return updated;
  }
};

