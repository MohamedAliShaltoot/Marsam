import { settingsRepo } from '../../data/repositories/settings-repo.js';

export const ACCENT_PALETTES = [
  { id: 'violet', name: '🟣 Electric Violet', hex: '#6d4aff' },
  { id: 'blue', name: '🔵 Ocean Blue', hex: '#1a73e8' },
  { id: 'teal', name: '🟢 Mint Teal', hex: '#0f9d8a' },
  { id: 'amber', name: '🟠 Warm Amber', hex: '#d97706' },
  { id: 'rose', name: '🌸 Berry Rose', hex: '#e11d48' },
  { id: 'emerald', name: '🌲 Forest Emerald', hex: '#059669' }
];

let currentAccent = 'violet';

export async function initAccent() {
  const saved = localStorage.getItem('boardly_accent') || 'violet';
  setAccent(saved, false);
}

export function setAccent(accentId, persist = true) {
  const palette = ACCENT_PALETTES.find((p) => p.id === accentId) || ACCENT_PALETTES[0];
  currentAccent = palette.id;
  document.documentElement.setAttribute('data-accent', currentAccent);

  if (persist) {
    localStorage.setItem('boardly_accent', currentAccent);
    settingsRepo.save({ accent: currentAccent }).catch(() => {});
  }
}

export function getCurrentAccent() {
  return currentAccent;
}

