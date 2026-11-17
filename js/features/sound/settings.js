import { settingsRepo } from '../../data/repositories/settings-repo.js';
import { eventBus } from '../../core/event-bus.js';

let currentSettings = {
  soundEnabled: true,
  soundVolume: 40,
  soundTheme: 'soft',
  soundReduced: false
};

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

export function getSoundSettings() {
  return { ...currentSettings };
}

export async function updateSoundSettings(changes) {
  currentSettings = { ...currentSettings, ...changes };
  await settingsRepo.save(changes);
  eventBus.emit('sound:settings-changed', currentSettings);
  return { ...currentSettings };
}

export async function toggleSoundMute() {
  const next = !currentSettings.soundEnabled;
  await updateSoundSettings({ soundEnabled: next });
  eventBus.emit('sound:mute-toggled', { enabled: next });
  return next;
}

