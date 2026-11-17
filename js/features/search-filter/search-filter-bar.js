/**
 * Search & Filter Bar Component
 * Debounced search input, combinable filter chips, active match counter
 */
import { el } from '../../core/dom.js';
import { createIcon } from '../../ui/icon.js';
import { debounce } from '../../core/debounce.js';
import { store } from '../../core/store.js';
import { eventBus } from '../../core/event-bus.js';

export function createSearchFilterBar(onFilterChange) {
  const container = el('div', { class: 'filter-bar' });

  const searchInput = el('input', {
    class: 'search-input',
    placeholder: 'Search cards...',
    'aria-label': 'Search cards across project'
  });

  const debouncedSearch = debounce((q) => {
    store.setFilters({ search: q });
    onFilterChange();
  }, 150);

  searchInput.addEventListener('input', (e) => debouncedSearch(e.target.value));

  const kbdHint = el('span', { class: 'search-kbd-hint' }, '/');
  const searchWrapper = el('div', { class: 'search-input-wrapper' }, [
    createIcon('search'),
    searchInput,
    kbdHint
  ]);

  const chipsRow = el('div', { class: 'filter-chips-row' });
  const countBadge = el('span', { class: 'filter-results-count' });

  const filterConfigs = [
    { label: '⏰ Overdue', key: 'due', val: 'overdue' },
    { label: '📅 Due Today', key: 'due', val: 'today' },
    { label: '⏳ Due Soon', key: 'due', val: 'soon' },
    { label: '🔥 Urgent', key: 'priority', val: 'urgent' },
    { label: '⚡ High Priority', key: 'priority', val: 'high' },
    { label: '✅ Complete', key: 'checklist', val: 'complete' }
  ];

  for (const cfg of filterConfigs) {
    const chip = el('button', {
      type: 'button',
      class: 'filter-chip',
      onClick: () => {
        const cur = store.getState().filters[cfg.key];
        const next = cur === cfg.val ? null : cfg.val;
        chip.classList.toggle('is-active', next !== null);
        store.setFilters({ [cfg.key]: next });
        eventBus.emit('filter:applied', { key: cfg.key, val: next });
        onFilterChange();
      }
    }, cfg.label);
    chipsRow.appendChild(chip);
  }

  const clearBtn = el('button', {
    class: 'btn btn--ghost btn--sm',
    style: { display: 'none' },
    onClick: () => {
      searchInput.value = '';
      chipsRow.querySelectorAll('.filter-chip').forEach((c) => c.classList.remove('is-active'));
      store.setFilters({ search: '', due: null, priority: null, checklist: null, labelIds: [] });
      clearBtn.style.display = 'none';
      onFilterChange();
    }
  }, 'Clear filters');
  chipsRow.appendChild(clearBtn);

  container.appendChild(searchWrapper);
  container.appendChild(chipsRow);
  container.appendChild(countBadge);

  function updateMatchCount(matchedCount, totalCount) {
    const filters = store.getState().filters;
    const hasFilter = filters.search || filters.due || filters.priority || filters.checklist || filters.labelIds?.length;
    clearBtn.style.display = hasFilter ? 'inline-flex' : 'none';

    if (hasFilter) {
      countBadge.textContent = `${matchedCount} of ${totalCount} cards`;
      if (filters.search && matchedCount > 0) {
        eventBus.emit('search:matched', { count: matchedCount });
      }
    } else {
      countBadge.textContent = `${totalCount} cards`;
    }
  }

  return {
    el: container,
    focusSearch: () => searchInput.focus(),
    updateCount: updateMatchCount
  };
}
