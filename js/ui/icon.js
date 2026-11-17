/**
 * SVG Sprite Loader and Icon Factory
 */

let spriteLoaded = false;

/**
 * Injects the SVG sprite into the page container
 * @returns {Promise<void>}
 */
export async function loadIconsSprite() {
  if (spriteLoaded) return;
  const container = document.getElementById('svg-sprite-container');
  if (!container) return;

  try {
    const res = await fetch('assets/icons.svg');
    if (res.ok) {
      const svgText = await res.text();
      container.innerHTML = svgText;
      spriteLoaded = true;
    }
  } catch (err) {
    console.warn('Could not load assets/icons.svg', err);
  }
}

/**
 * Creates an SVG icon element using <use>
 * @param {string} iconId - Name of icon without 'icon-' prefix
 * @param {string} [className] - Optional extra class
 * @returns {SVGSVGElement}
 */
export function createIcon(iconId, className = '') {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', `icon ${className}`.trim());
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('viewBox', '0 0 24 24');

  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', `#icon-${iconId}`);
  svg.appendChild(use);

  return svg;
}
