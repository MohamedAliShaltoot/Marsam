import { stringsEn } from './strings.en.js';

let currentStrings = stringsEn;

export function t(key) {
  return currentStrings[key] || key;
}

export function setLocaleBundle(bundle) {
  currentStrings = { ...stringsEn, ...bundle };
}

