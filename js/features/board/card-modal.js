import { el, empty } from '../../core/dom.js';
import { openModal } from '../../ui/modal.js';
import { openConfirmDialog } from '../../ui/confirm-dialog.js';
import { showToast } from '../../ui/toast.js';
import { createIcon } from '../../ui/icon.js';
import { store } from '../../core/store.js';
import { eventBus } from '../../core/event-bus.js';
import { generateId } from '../../core/id.js';
import { CURATED_SWATCHES } from '../../ui/color-picker.js';
import { getDueStatus } from '../../utils/date.js';
import { createLabelsEditor } from './card-labels-editor.js';

export function openCardModal(cardId) {
  const card = store.getState().cards.find((c) => c.id === cardId);
  if (!card) return;

  const current = JSON.parse(JSON.stringify(card));

  function saveField(key, value) {
    current[key] = value;
    store.updateCard(cardId, { [key]: value });
  }

  const titleInput = el('input', {
    class: 'form-input',
    value: current.title,
    style: { 'font-size': 'var(--font-size-lg)', 'font-weight': '600' },
    onInput: (e) => saveField('title', e.target.value.trim() || 'Untitled Card')
  });

  const descTextarea = el('textarea', {
    class: 'form-textarea',
    placeholder: 'Add a more detailed description...',
    rows: 3,
    onInput: (e) => {
      saveField('description', e.target.value);
      e.target.style.height = 'auto';
      e.target.style.height = `${e.target.scrollHeight}px`;
    }
  }, current.description || '');

  const prioritySelect = el('select', {
    class: 'form-input',
    style: { width: 'auto' },
    onChange: (e) => saveField('priority', e.target.value || null)
  }, [
    el('option', { value: '' }, 'No Priority'),
    el('option', { value: 'low' }, 'Low'),
    el('option', { value: 'medium' }, 'Medium'),
    el('option', { value: 'high' }, 'High'),
    el('option', { value: 'urgent' }, 'Urgent')
  ]);
  prioritySelect.value = current.priority || '';

  const dateInput = el('input', {
    type: 'date',
    class: 'form-input',
    style: { width: 'auto' },
    value: current.dueDate || '',
    onChange: (e) => {
      const val = e.target.value || null;
      saveField('dueDate', val);
      updateDueBadge(val);
    }
  });

  const dueBadge = el('span', { class: 'card-badge' });
  function updateDueBadge(val) {
    const status = getDueStatus(val);
    dueBadge.textContent = status === 'none' ? 'No due date' : status.toUpperCase();
    dueBadge.className = `card-badge ${status === 'overdue' ? 'card-badge--overdue' : (status === 'soon' ? 'card-badge--soon' : '')}`;
  }
  updateDueBadge(current.dueDate);

  const labelsEditor = createLabelsEditor(current.labels, (newLabels) => {
    current.labels = newLabels;
    saveField('labels', newLabels);
  });

  const checklistContainer = el('div', { class: 'stack-xs' });
  const progressFill = el('div', { style: { height: '6px', 'background-color': 'var(--accent)', 'border-radius': '4px', width: '0%', transition: 'width 200ms ease' } });
  const progressBar = el('div', { style: { height: '6px', 'background-color': 'var(--bg-surface-sunken)', 'border-radius': '4px', 'margin-block': 'var(--space-2)' } }, [progressFill]);

  function renderChecklist() {
    empty(checklistContainer);
    const items = current.checklist || [];
    const total = items.length;
    const doneCount = items.filter((i) => i.done).length;
    progressFill.style.width = total > 0 ? `${Math.round((doneCount / total) * 100)}%` : '0%';

    for (const item of items) {
      const checkbox = el('input', {
        type: 'checkbox',
        checked: item.done,
        onChange: (e) => {
          item.done = e.target.checked;
          saveField('checklist', current.checklist);
          const newDone = current.checklist.filter((i) => i.done).length;
          const newTotal = current.checklist.length;
          if (newTotal > 0 && newDone === newTotal && item.done) {
            eventBus.emit('checklist:completed', { total: newTotal });
          } else {
            eventBus.emit('checklist:item-toggled', { done: item.done, doneCount: newDone, total: newTotal });
          }
          renderChecklist();
        }
      });

      const itemText = el('span', {
        style: { flex: 1, 'text-decoration': item.done ? 'line-through' : 'none', color: item.done ? 'var(--text-muted)' : 'inherit' }
      }, item.text);

      const delItemBtn = el('button', {
        class: 'btn-icon',
        style: { width: '24px', height: '24px' },
        onClick: () => {
          current.checklist = current.checklist.filter((i) => i.id !== item.id);
          saveField('checklist', current.checklist);
          renderChecklist();
        }
      }, [createIcon('close')]);

      checklistContainer.appendChild(el('div', { class: 'row-gap-sm' }, [checkbox, itemText, delItemBtn]));
    }
  }
  renderChecklist();

  const newChecklistInput = el('input', {
    class: 'form-input',
    placeholder: 'Add an item...',
    onKeydown: (e) => {
      if (e.key === 'Enter') {
        const text = e.target.value.trim();
        if (!text) return;
        current.checklist = [...(current.checklist || []), { id: generateId(), text, done: false }];
        saveField('checklist', current.checklist);
        e.target.value = '';
        renderChecklist();
      }
    }
  });

  const coverRow = el('div', { class: 'row-gap-sm', style: { 'flex-wrap': 'wrap' } });
  for (const hex of CURATED_SWATCHES.slice(0, 8)) {
    coverRow.appendChild(el('button', {
      class: 'color-swatch',
      style: { 'background-color': hex },
      onClick: () => saveField('cover', hex)
    }));
  }
  coverRow.appendChild(el('button', {
    class: 'btn btn--ghost btn--sm',
    onClick: () => saveField('cover', null)
  }, 'Remove'));

  const body = el('div', { class: 'stack-md' }, [
    el('div', {}, [el('label', { class: 'form-label' }, 'Title'), titleInput]),
    el('div', { class: 'row-gap-md' }, [
      el('div', {}, [el('label', { class: 'form-label' }, 'Priority'), prioritySelect]),
      el('div', {}, [el('label', { class: 'form-label' }, 'Due Date'), el('div', { class: 'row-gap-sm' }, [dateInput, dueBadge])])
    ]),
    el('div', {}, [el('label', { class: 'form-label' }, 'Labels'), labelsEditor.wrapperEl]),
    el('div', {}, [el('label', { class: 'form-label' }, 'Cover Color'), coverRow]),
    el('div', {}, [el('label', { class: 'form-label' }, 'Description'), descTextarea]),
    el('div', {}, [el('label', { class: 'form-label' }, 'Checklist'), progressBar, checklistContainer, el('div', { style: { 'margin-block-start': 'var(--space-2)' } }, [newChecklistInput])])
  ]);

  const duplicateBtn = el('button', {
    class: 'btn btn--outline btn--sm',
    onClick: async () => {
      modal.close();
      const newCard = { ...current, id: generateId(), title: `${current.title} (Copy)`, order: current.order + 10 };
      await store.addCard(newCard);
    }
  }, [createIcon('copy'), 'Duplicate']);

  const archiveBtn = el('button', {
    class: 'btn btn--outline btn--sm',
    onClick: async () => {
      modal.close();
      await store.updateCard(current.id, { archived: true });
      eventBus.emit('card:archived', current);
      showToast({
        message: `Card "${current.title}" archived.`,
        action: { label: 'Undo', onClick: () => store.updateCard(current.id, { archived: false }) }
      });
    }
  }, [createIcon('archive'), 'Archive']);

  const deleteBtn = el('button', {
    class: 'btn btn--danger btn--sm',
    onClick: () => {
      openConfirmDialog({
        title: 'Delete Card?',
        message: `Are you sure you want to delete "${current.title}"?`,
        confirmText: 'Delete Card',
        onConfirm: async () => {
          modal.close();
          await store.deleteCard(current.id);
          showToast('Card deleted.');
        }
      });
    }
  }, [createIcon('trash'), 'Delete']);

  const saveBtn = el('button', {
    class: 'btn btn--primary btn--sm',
    onClick: () => {
      modal.close();
      showToast({ message: 'Card saved.', type: 'success' });
    }
  }, [createIcon('check'), 'Save & Close']);

  const modal = openModal({
    title: el('span', { class: 'row-gap-sm' }, [createIcon('edit'), 'Card Details']),
    content: body,
    footer: [duplicateBtn, archiveBtn, deleteBtn, saveBtn],
    size: 'lg'
  });
}

