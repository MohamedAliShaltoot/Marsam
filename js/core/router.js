/**
 * Hash-Based SPA Router
 * Supports routes like #/ and #/p/:id with browser history and reload persistence
 */

export class Router {
  constructor() {
    /** @type {Map<RegExp, { handler: Function, paramNames: string[] }>} */
    this.routes = new Map();
    /** @type {Function|null} */
    this.notFoundHandler = null;

    this.onHashChange = this.handleRoute.bind(this);
  }

  /**
   * Registers a path pattern (e.g. '/' or '/p/:id')
   * @param {string} path
   * @param {Function} handler
   */
  addRoute(path, handler) {
    const paramNames = [];
    const patternStr = path.replace(/:([a-zA-Z0-9_]+)/g, (_, paramName) => {
      paramNames.push(paramName);
      return '([^\\/]+)';
    });

    const regex = new RegExp(`^#?${patternStr}\\/?$`);
    this.routes.set(regex, { handler, paramNames });
  }

  /**
   * Navigates to a specific hash path
   * @param {string} path
   */
  navigate(path) {
    const targetHash = path.startsWith('#') ? path : `#${path}`;
    if (window.location.hash === targetHash) {
      this.handleRoute();
    } else {
      window.location.hash = targetHash;
      // In some environments setting hash doesn't synchronously fire hashchange
      this.handleRoute();
    }
  }

  /**
   * Resolves the current hash against registered routes
   */
  handleRoute() {
    const hash = window.location.hash || '#/';

    for (const [regex, { handler, paramNames }] of this.routes.entries()) {
      const match = hash.match(regex);
      if (match) {
        const params = {};
        paramNames.forEach((name, index) => {
          params[name] = decodeURIComponent(match[index + 1]);
        });
        handler(params);
        return;
      }
    }

    if (this.notFoundHandler) {
      this.notFoundHandler(hash);
    } else {
      this.navigate('/');
    }
  }

  /**
   * Starts listening to hashchange events and executes the initial route
   */
  start() {
    window.addEventListener('hashchange', this.onHashChange);
    this.handleRoute();
  }

  /**
   * Destroys router listeners
   */
  destroy() {
    window.removeEventListener('hashchange', this.onHashChange);
  }
}

export const router = new Router();
