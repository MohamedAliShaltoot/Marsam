/**
 * Theme Manager
 * Dark / Light / System modes with View Transitions API support & fabric tile refresh
 */
import { settingsRepo } from '../../data/repositories/settings-repo.js';
import { applyFabricTextures } from './fabric-texture.js';
import { eventBus } from '../../core/event-bus.js';

let currentTheme = 'system';

/**
 * Initializes theme on startup
 */
export async function initTheme() {
  const saved = localStorage.getItem('boardly_theme') || 'system';
  currentTheme = saved;
  applyTheme(currentTheme, false);
}

/**
 * Resolves 'system' preference to 'dark' or 'light'
 * @returns {'dark'|'light'}
 */
export function getSystemPreference() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Applies a theme to the document with smooth view transition
 * @param {'light'|'dark'|'system'} theme
 * @param {boolean} [animate=true]
 */
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

/**
 * Toggles theme between light and dark
 */
export function toggleTheme() {
  const effective = document.documentElement.getAttribute('data-theme') || 'light';
  const next = effective === 'dark' ? 'light' : 'dark';
  applyTheme(next, true);
}
