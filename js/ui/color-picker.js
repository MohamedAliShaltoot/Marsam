/**
 * Palette Swatch & Color Picker Component
 */
import { el } from '../core/dom.js';

export const CURATED_SWATCHES = [
  '#ef4444', '#f97316', '#f59e0b', '#10b981',
  '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6',
  '#6366f1', '#8b5cf6', '#a855f7', '#ec4899',
  '#64748b', '#78716c', '#18181b', '#ffffff'
];

/**
 * Creates a swatch palette selector
 * @param {Object} options
 * @param {string[]} [options.swatches=CURATED_SWATCHES]
 * @param {string} options.selectedColor
 * @param {(color: string) => void} options.onSelect
 * @param {boolean} [options.allowCustom=true]
 * @returns {HTMLElement}
 */
export function createColorPicker({ swatches = CURATED_SWATCHES, selectedColor, onSelect, allowCustom = true }) {
  const container = el('div', { class: 'swatch-group' });

  for (const hex of swatches) {
    const isSelected = hex.toLowerCase() === (selectedColor || '').toLowerCase();
    const swatch = el('button', {
      type: 'button',
      class: `color-swatch ${isSelected ? 'is-selected' : ''}`,
      style: { 'background-color': hex },
      'aria-label': `Select color ${hex}`,
      onClick: (e) => {
        e.preventDefault();
        container.querySelectorAll('.color-swatch').forEach((s) => s.classList.remove('is-selected'));
        swatch.classList.add('is-selected');
        onSelect(hex);
      }
    });
    container.appendChild(swatch);
  }

  if (allowCustom) {
    const customInput = el('input', {
      type: 'color',
      value: selectedColor || '#6d4aff',
      class: 'color-swatch color-swatch--input',
      title: 'Custom color',
      onInput: (e) => {
        container.querySelectorAll('.color-swatch').forEach((s) => s.classList.remove('is-selected'));
        onSelect(e.target.value);
      }
    });
    container.appendChild(customInput);
  }

  return container;
}
