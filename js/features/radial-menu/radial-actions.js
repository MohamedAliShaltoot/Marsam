import { store } from '../../core/store.js';
import { generateId } from '../../core/id.js';
import { openModal } from '../../ui/modal.js';
import { openConfirmDialog } from '../../ui/confirm-dialog.js';
import { el } from '../../core/dom.js';
import { CURATED_SWATCHES } from '../../ui/color-picker.js';

export function getCardRadialActions(card) {
  return [
    {
      id: 'move',
      label: 'Move to...',
      icon: 'move',
      execute: () => openMoveToListPicker(card)
    },
    {
      id: 'priority',
      label: 'Priority',
      icon: 'flag',
      execute: () => openQuickPriorityPicker(card)
    },
    {
      id: 'label',
      label: 'Add Label',
      icon: 'tag',
      execute: () => openQuickLabelPicker(card)
    },
    {
      id: 'due',
      label: 'Due Date',
      icon: 'calendar',
      execute: () => openQuickDueDatePicker(card)
    },
    {
      id: 'duplicate',
      label: 'Duplicate',
      icon: 'copy',
      execute: async () => {
        const copy = { ...card, id: generateId(), title: `${card.title} (Copy)`, order: card.order + 10 };
        await store.addCard(copy);
      }
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'trash',
      execute: () => {
        openConfirmDialog({
          title: 'Delete Card?',
          message: `Are you sure you want to delete "${card.title}"?`,
          confirmText: 'Delete Card',
          onConfirm: () => store.deleteCard(card.id)
        });
      }
    }
  ];
}

function openMoveToListPicker(card) {
  const lists = store.getState().lists;
  const listButtons = lists.map((list) => {
    return el('button', {
      class: 'btn btn--outline',
      style: { width: '100%', 'justify-content': 'flex-start', 'margin-block-end': 'var(--space-2)' },
      onClick: async () => {
        modal.close();
        const cardsInList = store.getState().cards.filter((c) => c.listId === list.id);
        const lastOrder = cardsInList[cardsInList.length - 1]?.order || 0;
        await store.moveCard(card.id, list.id, lastOrder + 1000);
      }
    }, list.title);
  });

  const modal = openModal({
    title: 'Move Card to List',
    content: el('div', {}, listButtons)
  });
}

function openQuickPriorityPicker(card) {
  const priorities = ['low', 'medium', 'high', 'urgent'];
  const btns = priorities.map((p) => {
    return el('button', {
      class: 'btn btn--outline',
      style: { width: '100%', 'justify-content': 'flex-start', 'margin-block-end': 'var(--space-2)' },
      onClick: () => {
        modal.close();
        store.updateCard(card.id, { priority: p });
      }
    }, p.toUpperCase());
  });

  const modal = openModal({
    title: 'Set Card Priority',
    content: el('div', {}, btns)
  });
}

function openQuickLabelPicker(card) {
  const color = CURATED_SWATCHES[Math.floor(Math.random() * 8)];
  const input = el('input', { class: 'form-input', placeholder: 'Label title...' });

  const modal = openModal({
    title: 'Quick Add Label',
    content: el('div', {}, [input]),
    footer: [
      el('button', {
        class: 'btn btn--primary',
        onClick: () => {
          const name = input.value.trim();
          if (!name) return;
          modal.close();
          const labels = [...(card.labels || []), { id: generateId(), name, color }];
          store.updateCard(card.id, { labels });
        }
      }, 'Save')
    ]
  });
}

function openQuickDueDatePicker(card) {
  const dateInput = el('input', { type: 'date', class: 'form-input', value: card.dueDate || '' });

  const modal = openModal({
    title: 'Set Due Date',
    content: el('div', {}, [dateInput]),
    footer: [
      el('button', {
        class: 'btn btn--primary',
        onClick: () => {
          modal.close();
          store.updateCard(card.id, { dueDate: dateInput.value || null });
        }
      }, 'Save')
    ]
  });
}

