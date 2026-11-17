/**
 * FLIP (First, Last, Invert, Play) Animation Helper
 * Animates DOM element positional changes smoothly without layout thrashing
 */

export class Flip {
  /**
   * @param {HTMLElement[]} elements
   */
  static snapshot(elements) {
    const map = new Map();
    for (const el of elements) {
      if (el) map.set(el, el.getBoundingClientRect());
    }
    return map;
  }

  /**
   * Plays FLIP animation from firstRects to current rects
   * @param {Map<HTMLElement, DOMRect>} firstRects
   * @param {number} [duration=180]
   */
  static play(firstRects, duration = 180) {
    for (const [el, first] of firstRects.entries()) {
      if (!el.isConnected) continue;
      const last = el.getBoundingClientRect();
      const dx = first.left - last.left;
      const dy = first.top - last.top;

      if (dx === 0 && dy === 0) continue;

      el.style.transform = `translate(${dx}px, ${dy}px)`;
      el.style.transition = 'none';

      requestAnimationFrame(() => {
        el.style.transition = `transform ${duration}ms cubic-bezier(0.2, 0, 0, 1)`;
        el.style.transform = '';
      });

      const cleanup = () => {
        el.style.transition = '';
        el.style.transform = '';
        el.removeEventListener('transitionend', cleanup);
      };
      el.addEventListener('transitionend', cleanup, { once: true });
    }
  }
}
