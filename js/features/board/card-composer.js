/**
 * Inline Card Composer Component
 * Inline creation: Enter adds card, Shift+Enter newline, Esc cancels
 */
import { el } from '../../core/dom.js';
import { createIcon } from '../../ui/icon.js';

/**
 * Creates an inline card composer
 * @param {(title: string) => void} onAdd
 * @returns {HTMLElement}
 */
export function createCardComposer(onAdd) {
  let isEditing = false;
  const container = el('div', { class: 'board-list__composer' });

  const addPromptBtn = el('button', {
    class: 'btn-add-card-compact',
    onClick: () => activate()
  }, [createIcon('plus'), 'Add a card']);

  const textarea = el('textarea', {
    class: 'form-textarea',
    placeholder: 'Enter a title for this card...',
    rows: 2,
    style: { 'min-height': '54px', 'margin-block-end': 'var(--space-2)' },
    onKeydown: (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submit();
      } else if (e.key === 'Escape') {
        deactivate();
      }
    }
  });

  const submitBtn = el('button', {
    class: 'btn btn--primary btn--sm',
    onClick: () => submit()
  }, 'Add card');

  const cancelBtn = el('button', {
    class: 'btn btn--ghost btn--sm',
    onClick: () => deactivate()
  }, [createIcon('close')]);

  const formActions = el('div', { class: 'row-gap-sm' }, [submitBtn, cancelBtn]);
  const formEl = el('div', {}, [textarea, formActions]);

  function activate() {
    isEditing = true;
    container.innerHTML = '';
    container.appendChild(formEl);
    textarea.value = '';
    requestAnimationFrame(() => textarea.focus());
  }

  function deactivate() {
    isEditing = false;
    container.innerHTML = '';
    container.appendChild(addPromptBtn);
  }

  function submit() {
    const title = textarea.value.trim();
    if (!title) {
      textarea.focus();
      return;
    }
    onAdd(title);
    textarea.value = '';
    textarea.focus();
  }

  container.appendChild(addPromptBtn);
  return container;
}
