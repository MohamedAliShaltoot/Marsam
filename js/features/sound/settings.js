/**
 * Sound Settings Manager
 * Persisted preferences: enabled, volume (0-100), soundTheme ('soft'|'crisp'), soundReduced (boolean)
 */
import { settingsRepo } from '../../data/repositories/settings-repo.js';
import { eventBus } from '../../core/event-bus.js';

/**
 * @typedef {Object} SoundSettings
 * @property {boolean} soundEnabled
 * @property {number} soundVolume - 0 to 100
 * @property {'soft'|'crisp'} soundTheme
 * @property {boolean} soundReduced
 */

/** @type {SoundSettings} */
let currentSettings = {
  soundEnabled: true,
  soundVolume: 40,
  soundTheme: 'soft',
  soundReduced: false
};

/**
 * Initializes sound settings from repository, adapting to prefers-reduced-motion
 * @returns {Promise<SoundSettings>}
 */
export async function initSoundSettings() {
  const repoSettings = await settingsRepo.get();
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  currentSettings = {
    soundEnabled: repoSettings.soundEnabled !== false,
    soundVolume: typeof repoSettings.soundVolume === 'number' ? repoSettings.soundVolume : 40,
    soundTheme: repoSettings.soundTheme || 'soft',
    soundReduced: repoSettings.soundReduced ?? prefersReduced
  };

  return currentSettings;
}

/**
 * Returns a copy of current sound settings
 * @returns {SoundSettings}
 */
export function getSoundSettings() {
  return { ...currentSettings };
}

/**
 * Updates sound settings and persists to repository
 * @param {Partial<SoundSettings>} changes
 * @returns {Promise<SoundSettings>}
 */
export async function updateSoundSettings(changes) {
  currentSettings = { ...currentSettings, ...changes };
  await settingsRepo.save(changes);
  eventBus.emit('sound:settings-changed', currentSettings);
  return { ...currentSettings };
}

/**
 * Toggles sound enabled / muted state
 * @returns {Promise<boolean>} new enabled state
 */
export async function toggleSoundMute() {
  const next = !currentSettings.soundEnabled;
  await updateSoundSettings({ soundEnabled: next });
  eventBus.emit('sound:mute-toggled', { enabled: next });
  return next;
}
