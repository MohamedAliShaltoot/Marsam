/**
 * Board Card Component Factory
 * Displays card badges, cover, labels, checklist status, search highlighting
 */
import { el, empty, createHighlightedText } from '../../core/dom.js';
import { createIcon } from '../../ui/icon.js';
import { getDueStatus, formatDueDate } from '../../utils/date.js';
import { store } from '../../core/store.js';

/**
 * Creates a card component instance
 * @param {import('../../core/store.js').Card} card
 * @param {(card: import('../../core/store.js').Card) => void} onCardClick
 * @returns {{ el: HTMLElement, update: (c: import('../../core/store.js').Card) => void, destroy: () => void }}
 */
export function createCardComponent(card, onCardClick) {
  let currentCard = card;
  const cardEl = el('div', {
    class: 'board-card fabric-sunken-card ink-printed-content',
    tabindex: '0',
    role: 'button',
    'aria-label': `Card: ${card.title}`,
    dataset: { cardId: card.id },
    onClick: (e) => {
      // Don't open if dragged or selecting
      if (cardEl.dataset.isDragging === 'true') return;
      onCardClick(currentCard);
    },
    onKeydown: (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onCardClick(currentCard);
      }
    }
  });

  function render(c) {
    currentCard = c;
    empty(cardEl);

    // Cover color
    if (c.cover) {
      const coverEl = el('div', {
        class: 'board-card__cover',
        style: { 'background-color': c.cover }
      });
      cardEl.appendChild(coverEl);
    }

    // Labels
    if (c.labels && c.labels.length > 0) {
      const labelsContainer = el('div', { class: 'board-card__labels' });
      for (const lbl of c.labels) {
        labelsContainer.appendChild(
          el('span', { class: 'card-label-chip', style: { 'background-color': lbl.color } }, lbl.name)
        );
      }
      cardEl.appendChild(labelsContainer);
    }

    // Title (with search highlight)
    const searchQuery = store.getState().filters?.search || '';
    const titleEl = el('div', { class: 'board-card__title' }, [
      createHighlightedText(c.title, searchQuery)
    ]);
    cardEl.appendChild(titleEl);

    // Badges: Checklist, Due Date, Priority
    const badges = [];

    // Description indicator
    if (c.description && c.description.trim()) {
      badges.push(el('span', { class: 'card-badge', title: 'Has description' }, [createIcon('edit')]));
    }

    // Checklist badge
    if (c.checklist && c.checklist.length > 0) {
      const total = c.checklist.length;
      const done = c.checklist.filter((i) => i.done).length;
      const isComplete = done === total;
      badges.push(el('span', {
        class: `card-badge ${isComplete ? 'card-badge--done' : ''}`,
        title: `Checklist: ${done}/${total}`
      }, [
        createIcon('check'),
        `${done}/${total}`
      ]));
    }

    // Due Date badge
    if (c.dueDate) {
      const status = getDueStatus(c.dueDate);
      const statusClass = status === 'overdue' ? 'card-badge--overdue' : (status === 'soon' || status === 'today' ? 'card-badge--soon' : '');
      badges.push(el('span', {
        class: `card-badge ${statusClass}`.trim(),
        title: `Due: ${c.dueDate}`
      }, [
        createIcon('calendar'),
        formatDueDate(c.dueDate)
      ]));
    }

    // Priority badge
    if (c.priority) {
      badges.push(el('span', {
        class: `card-badge priority-${c.priority}`,
        title: `Priority: ${c.priority}`
      }, [
        createIcon('flag'),
        c.priority.toUpperCase()
      ]));
    }

    if (badges.length > 0) {
      const badgesContainer = el('div', { class: 'board-card__badges' }, badges);
      cardEl.appendChild(badgesContainer);
    }
  }

  render(card);

  return {
    el: cardEl,
    update: render,
    destroy: () => {}
  };
}
