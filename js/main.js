/**
 * Boardly Main Bootstrap Entrypoint
 * Zero dependencies, pure vanilla HTML5/CSS3/ES Modules
 */
import { loadIconsSprite } from './ui/icon.js';
import { initTheme } from './features/theme/theme-manager.js';
import { initAccent } from './features/theme/accent-manager.js';
import { applyFabricTextures } from './features/theme/fabric-texture.js';
import { router } from './core/router.js';
import { seedInitialDataIfNeeded } from './data/seed.js';
import { createHomeView } from './features/home/home-view.js';
import { createBoardView } from './features/board/board-view.js';
import { initKeyboardShortcuts } from './features/shortcuts/keyboard-shortcuts.js';
import { initSoundSettings } from './features/sound/settings.js';
import { initSoundBindings } from './features/sound/bindings.js';
import { eventBus } from './core/event-bus.js';
import { store } from './core/store.js';

let currentView = null;
const appMount = document.getElementById('app');

function mountView(view) {
  if (currentView && typeof currentView.destroy === 'function') {
    currentView.destroy();
  }
  currentView = view;
  appMount.innerHTML = '';
  appMount.appendChild(view.el);
}

async function bootstrap() {
  // 1. Initialize Icon Sprites and Theming
  await loadIconsSprite();
  await initTheme();
  await initAccent();
  await initSoundSettings();
  initSoundBindings();

  const effectiveTheme = document.documentElement.getAttribute('data-theme') || 'light';
  applyFabricTextures(effectiveTheme);

  // 2. Seed initial demo project on first run
  const seededId = await seedInitialDataIfNeeded();

  // 3. Register Hash Routes
  router.addRoute('/', () => {
    const homeView = createHomeView();
    mountView(homeView);
  });

  router.addRoute('/p/:id', ({ id }) => {
    const boardView = createBoardView(id);
    mountView(boardView);
  });

  // 4. Initialize Global Keyboard Shortcuts
  initKeyboardShortcuts(currentView);

  // 5. Cross-tab synchronization listener
  eventBus.on('sync:card:changed', ({ projectId }) => {
    if (store.getState().project?.id === projectId) {
      store.loadProject(projectId);
    }
  });

  eventBus.on('sync:list:changed', ({ projectId }) => {
    if (store.getState().project?.id === projectId) {
      store.loadProject(projectId);
    }
  });

  // 6. Start Router
  router.start();
  if ((!window.location.hash || window.location.hash === '#' || window.location.hash === '#/') && seededId) {
    router.navigate(`/p/${seededId}`);
  }
}

// Start application once DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
