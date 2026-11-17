/**
 * Board Workspace View Orchestrator
 * Lists, cards, 3D parallax tilt, search filtering, inline list addition
 */
import { el, empty } from '../../core/dom.js';
import { createIcon } from '../../ui/icon.js';
import { store } from '../../core/store.js';
import { createBoardHeader } from './board-header.js';
import { createSearchFilterBar } from '../search-filter/search-filter-bar.js';
import { createListComponent } from './list-component.js';
import { openCardModal } from './card-modal.js';
import { DndManager } from '../dnd/dnd-manager.js';
import { RadialMenuController } from '../radial-menu/radial-menu.js';
import { generateBetween } from '../../data/fractional-index.js';
import { generateId } from '../../core/id.js';
import { matchesFilters } from '../search-filter/filter-matcher.js';

export function createBoardView(projectId) {
  const container = el('div', { class: 'board-view' });
  let searchBar = null;
  let dnd = null;
  let radialMenu = null;
  let unsubscribeStore = null;

  /** @type {Map<string, ReturnType<typeof createListComponent>>} */
  const listComponents = new Map();

  async function init() {
    await store.loadProject(projectId);
    const project = store.getState().project;
    if (!project) {
      container.appendChild(el('div', { style: { padding: 'var(--space-8)', 'text-align': 'center' } }, [
        el('h2', {}, 'Project not found'),
        el('button', { class: 'btn btn--primary', style: { 'margin-block-start': 'var(--space-4)' }, onClick: () => router.navigate('/') }, 'Back to Projects')
      ]));
      return;
    }

    // Header
    const header = createBoardHeader(project, () => {
      searchBar.el.style.display = searchBar.el.style.display === 'none' ? 'flex' : 'none';
      if (searchBar.el.style.display !== 'none') searchBar.focusSearch();
    });
    container.appendChild(header.el);

    // Search & Filter Bar
    searchBar = createSearchFilterBar(() => applyFilters());
    container.appendChild(searchBar.el);

    // 3D Parallax Plane
    const parallaxPlane = el('div', { class: 'board-parallax-plane' });
    const scrollContainer = el('div', { class: 'board-lists-scroll' });
    parallaxPlane.appendChild(scrollContainer);

    const viewport = el('div', { class: 'board-viewport' }, [parallaxPlane]);
    container.appendChild(viewport);

    // Pointer Parallax (tilt at most ~1.5deg)
    const handlePointerMove = (e) => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const xNorm = (e.clientX / window.innerWidth) - 0.5;
      const yNorm = (e.clientY / window.innerHeight) - 0.5;
      parallaxPlane.style.setProperty('--tilt-x', `${yNorm * -2.5}deg`);
      parallaxPlane.style.setProperty('--tilt-y', `${xNorm * 2.5}deg`);
    };
    window.addEventListener('pointermove', handlePointerMove);

    // Render Lists
    renderLists(scrollContainer);

    // Initialize Dnd & Radial Menu
    dnd = new DndManager(scrollContainer);
    radialMenu = new RadialMenuController(scrollContainer);

    // Subscribe to Store updates
    unsubscribeStore = store.subscribe((state, action) => {
      if (action.startsWith('list:')) {
        renderLists(scrollContainer);
      } else if (action.startsWith('card:')) {
        updateAllListCards();
      }
      applyFilters();
    });

    applyFilters();
  }

  function renderLists(scrollContainer) {
    empty(scrollContainer);
    const { lists, cards } = store.getState();
    const activeLists = lists.filter((l) => !l.archived);

    for (const list of activeLists) {
      let comp = listComponents.get(list.id);
      if (!comp) {
        comp = createListComponent(list, (c) => openCardModal(c.id));
        listComponents.set(list.id, comp);
      }
      const listCards = cards.filter((c) => c.listId === list.id && !c.archived).sort((a, b) => a.order - b.order);
      comp.update(list, listCards);
      scrollContainer.appendChild(comp.el);
    }

    // Add List Button Wrapper
    scrollContainer.appendChild(renderAddListWrapper());
  }

  function updateAllListCards() {
    const { lists, cards } = store.getState();
    const activeLists = lists.filter((l) => !l.archived);
    for (const list of activeLists) {
      const comp = listComponents.get(list.id);
      if (comp) {
        const listCards = cards.filter((c) => c.listId === list.id && !c.archived).sort((a, b) => a.order - b.order);
        comp.update(list, listCards);
      }
    }
  }

  function renderAddListWrapper() {
    const wrapper = el('div', { class: 'board-add-list-wrapper' });

    const promptBtn = el('button', {
      class: 'btn btn--outline',
      style: { width: '100%', 'justify-content': 'flex-start', padding: 'var(--space-3)' },
      onClick: () => activate()
    }, [createIcon('plus'), 'Add list']);

    const input = el('input', {
      class: 'form-input',
      placeholder: 'Enter list title...',
      style: { 'margin-block-end': 'var(--space-2)' },
      onKeydown: (e) => {
        if (e.key === 'Enter') submit();
        if (e.key === 'Escape') deactivate();
      }
    });

    const addBtn = el('button', { class: 'btn btn--primary btn--sm', onClick: submit }, 'Add list');
    const cancelBtn = el('button', { class: 'btn btn--ghost btn--sm', onClick: deactivate }, [createIcon('close')]);
    const formEl = el('div', { class: 'fabric-sunken-list', style: { padding: 'var(--space-2)' } }, [
      input,
      el('div', { class: 'row-gap-sm' }, [addBtn, cancelBtn])
    ]);

    function activate() {
      empty(wrapper);
      wrapper.appendChild(formEl);
      input.value = '';
      input.focus();
    }

    function deactivate() {
      empty(wrapper);
      wrapper.appendChild(promptBtn);
    }

    async function submit() {
      const title = input.value.trim();
      if (!title) return;
      const lists = store.getState().lists;
      const lastList = lists[lists.length - 1];
      const newOrder = generateBetween(lastList?.order || null, null);

      await store.addList({
        id: generateId(),
        projectId,
        title,
        order: newOrder,
        archived: false
      });
      deactivate();
    }

    wrapper.appendChild(promptBtn);
    return wrapper;
  }

  function applyFilters() {
    const filters = store.getState().filters;
    const cards = store.getState().cards;
    let matchCount = 0;

    for (const card of cards) {
      const cardEl = container.querySelector(`[data-card-id="${card.id}"]`);
      if (cardEl) {
        const isMatch = matchesFilters(card, filters);
        cardEl.classList.toggle('board-card--dimmed', !isMatch);
        if (isMatch) matchCount++;
      }
    }

    searchBar?.updateCount(matchCount, cards.length);
  }

  init();

  return {
    el: container,
    focusSearch: () => searchBar?.focusSearch(),
    destroy: () => {
      if (dnd) dnd.destroy();
      if (radialMenu) radialMenu.destroy();
      if (unsubscribeStore) unsubscribeStore();
      listComponents.forEach((c) => c.destroy());
      listComponents.clear();
    }
  };
}
