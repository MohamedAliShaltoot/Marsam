import { el, empty } from '../../core/dom.js';
import { openModal } from '../../ui/modal.js';
import { createIcon } from '../../ui/icon.js';
import { store } from '../../core/store.js';
import { showToast } from '../../ui/toast.js';
import { openConfirmDialog } from '../../ui/confirm-dialog.js';
import { formatRelativeTime } from '../../utils/date.js';

export function openArchiveModal(projectId) {
  const container = el('div', { class: 'stack-md' });

  function render() {
    empty(container);
    const { cards, lists } = store.getState();
    const archivedCards = cards.filter((c) => c.archived);
    const archivedLists = lists.filter((l) => l.archived);

    if (archivedCards.length === 0 && archivedLists.length === 0) {
      container.appendChild(el('div', {
        style: { 'text-align': 'center', 'padding-block': 'var(--space-8)' }
      }, [
        el('div', { style: { 'font-size': '36px', 'margin-block-end': 'var(--space-2)' } }, '📦'),
        el('h3', { style: { 'font-weight': '600' } }, 'No archived items'),
        el('p', { class: 'text-muted', style: { 'font-size': 'var(--font-size-sm)' } },
          'Cards or lists you archive will appear here so you can restore or delete them.')
      ]));
      return;
    }

    if (archivedCards.length > 0) {
      container.appendChild(el('h4', {
        class: 'form-label',
        style: { 'font-weight': '600', 'margin-block-end': 'var(--space-2)' }
      }, `Archived Cards (${archivedCards.length})`));

      const cardsList = el('div', { class: 'stack-sm' });
      for (const card of archivedCards) {
        const list = lists.find((l) => l.id === card.listId);
        const listTitle = list?.title || 'Unknown List';

        const titleEl = el('span', { style: { 'font-weight': '600' } }, card.title);
        const metaEl = el('span', { class: 'text-muted', style: { 'font-size': 'var(--font-size-xs)' } },
          `In list: ${listTitle} • ${formatRelativeTime(card.updatedAt)}`);

        const restoreBtn = el('button', {
          class: 'btn btn--outline btn--sm',
          onClick: async () => {
            await store.updateCard(card.id, { archived: false });
            showToast({ message: `Restored "${card.title}" to board.`, type: 'success' });
            render();
          }
        }, [createIcon('undo'), 'Restore']);

        const deleteBtn = el('button', {
          class: 'btn btn--danger btn--sm',
          onClick: () => {
            openConfirmDialog({
              title: 'Delete Card Permanently?',
              message: `"${card.title}" will be permanently removed from this project.`,
              confirmText: 'Delete Permanently',
              onConfirm: async () => {
                await store.deleteCard(card.id);
                showToast('Card permanently deleted.');
                render();
              }
            });
          }
        }, [createIcon('trash'), 'Delete']);

        const cardItem = el('div', {
          class: 'row-gap-md',
          style: {
            'justify-content': 'space-between',
            'align-items': 'center',
            padding: 'var(--space-3)',
            background: 'var(--bg-surface-sunken)',
            'border-radius': 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)'
          }
        }, [
          el('div', { class: 'stack-xs' }, [titleEl, metaEl]),
          el('div', { class: 'row-gap-sm' }, [restoreBtn, deleteBtn])
        ]);

        cardsList.appendChild(cardItem);
      }
      container.appendChild(cardsList);
    }
  }

  render();

  openModal({
    title: el('span', { class: 'row-gap-sm' }, [createIcon('archive'), 'Archived Items']),
    content: container,
    size: 'md'
  });
}

