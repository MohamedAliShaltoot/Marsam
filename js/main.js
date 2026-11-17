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
  await loadIconsSprite();
  await initTheme();
  await initAccent();
  await initSoundSettings();
  initSoundBindings();

  const effectiveTheme = document.documentElement.getAttribute('data-theme') || 'light';
  applyFabricTextures(effectiveTheme);

  const seededId = await seedInitialDataIfNeeded();

  router.addRoute('/', () => {
    const homeView = createHomeView();
    mountView(homeView);
  });

  router.addRoute('/p/:id', ({ id }) => {
    const boardView = createBoardView(id);
    mountView(boardView);
  });

  initKeyboardShortcuts(currentView);

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

  router.start();
  if ((!window.location.hash || window.location.hash === '#' || window.location.hash === '#/') && seededId) {
    router.navigate(`/p/${seededId}`);
  }

  if (!window.boardlyDesktop?.isDesktop && 'serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}

