/**
 * Simple i18n Lookup Helper
 */
import { stringsEn } from './strings.en.js';

let currentStrings = stringsEn;

/**
 * Returns translated string by key or key itself if missing
 * @param {keyof typeof stringsEn} key
 * @returns {string}
 */
export function t(key) {
  return currentStrings[key] || key;
}

/**
 * Sets custom string bundle for another locale
 * @param {Record<string, string>} bundle
 */
export function setLocaleBundle(bundle) {
  currentStrings = { ...stringsEn, ...bundle };
}
