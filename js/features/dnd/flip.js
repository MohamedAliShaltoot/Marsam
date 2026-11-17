export class Flip {
  static snapshot(elements) {
    const map = new Map();
    for (const el of elements) {
      if (el) map.set(el, el.getBoundingClientRect());
    }
    return map;
  }

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

