/**
 * Debounce and Throttle Utilities
 */

/**
 * Creates a debounced function that delays invoking fn until after wait ms
 * @template {Function} T
 * @param {T} fn
 * @param {number} wait
 * @returns {T & { cancel: () => void }}
 */
export function debounce(fn, wait = 150) {
  let timer = null;

  const debounced = function(...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn.apply(this, args);
    }, wait);
  };

  debounced.cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  return /** @type {any} */ (debounced);
}

/**
 * Creates a throttled function that only invokes fn at most once per limit ms
 * @template {Function} T
 * @param {T} fn
 * @param {number} limit
 * @returns {T}
 */
export function throttle(fn, limit = 50) {
  let inThrottle = false;
  return /** @type {any} */ (function(...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => { inThrottle = false; }, limit);
    }
  });
}
