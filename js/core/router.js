export class Router {
  constructor() {
    this.routes = new Map();
    this.notFoundHandler = null;

    this.onHashChange = this.handleRoute.bind(this);
  }

  addRoute(path, handler) {
    const paramNames = [];
    const patternStr = path.replace(/:([a-zA-Z0-9_]+)/g, (_, paramName) => {
      paramNames.push(paramName);
      return '([^\\/]+)';
    });

    const regex = new RegExp(`^#?${patternStr}\\/?$`);
    this.routes.set(regex, { handler, paramNames });
  }

  navigate(path) {
    const targetHash = path.startsWith('#') ? path : `#${path}`;
    if (window.location.hash === targetHash) {
      this.handleRoute();
    } else {
      window.location.hash = targetHash;
      this.handleRoute();
    }
  }

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

  start() {
    window.addEventListener('hashchange', this.onHashChange);
    this.handleRoute();
  }

  destroy() {
    window.removeEventListener('hashchange', this.onHashChange);
  }
}

export const router = new Router();

