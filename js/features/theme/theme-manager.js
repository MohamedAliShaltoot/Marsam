import { settingsRepo } from '../../data/repositories/settings-repo.js';
import { applyFabricTextures } from './fabric-texture.js';
import { eventBus } from '../../core/event-bus.js';

let currentTheme = 'system';

export async function initTheme() {
  const saved = localStorage.getItem('boardly_theme') || 'system';
  currentTheme = saved;
  applyTheme(currentTheme, false);
}

export function getSystemPreference() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme, animate = true) {
  currentTheme = theme;
  const effective = theme === 'system' ? getSystemPreference() : theme;

  const updateDOM = () => {
    document.documentElement.setAttribute('data-theme', effective);
    localStorage.setItem('boardly_theme', theme);
    applyFabricTextures(effective);
  };

  if (animate) {
    eventBus.emit('theme:changed', { theme, effective });
  }

  if (animate && document.startViewTransition) {
    document.startViewTransition(updateDOM);
  } else {
    updateDOM();
  }

  settingsRepo.save({ theme }).catch(() => {});
}

export function toggleTheme() {
  const effective = document.documentElement.getAttribute('data-theme') || 'light';
  const next = effective === 'dark' ? 'light' : 'dark';
  applyTheme(next, true);
}

