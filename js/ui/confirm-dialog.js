import { el } from '../core/dom.js';
import { createIcon } from './icon.js';
import { eventBus } from '../core/event-bus.js';

let activeConfirmDialog = null;

export function openConfirmDialog({
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  icon = 'trash',
  isDanger = true,
  onConfirm
}) {
  if (activeConfirmDialog) {
    activeConfirmDialog.close();
  }

  const root = document.getElementById('modal-root') || document.body;
  const previouslyFocused = document.activeElement;

  const iconEl = el('div', { class: 'mac-dialog__icon-badge' }, [createIcon(icon)]);
  const titleEl = el('h3', { class: 'mac-dialog__title' }, title);
  const msgEl = el('p', { class: 'mac-dialog__message' }, message);

  const cancelBtn = el('button', {
    type: 'button',
    class: 'mac-dialog__btn',
    onClick: () => close()
  }, cancelText);

  const confirmBtn = el('button', {
    type: 'button',
    class: `mac-dialog__btn ${isDanger ? 'mac-dialog__btn--danger' : ''}`,
    onClick: async () => {
      close();
      if (typeof onConfirm === 'function') {
        await onConfirm();
      }
    }
  }, confirmText);

  const actions = el('div', { class: 'mac-dialog__actions' }, [cancelBtn, confirmBtn]);

  const dialog = el('div', {
    class: 'mac-dialog',
    role: 'alertdialog',
    'aria-modal': 'true'
  }, [iconEl, titleEl, msgEl, actions]);

  const backdrop = el('div', {
    class: 'mac-dialog-backdrop anim-fade-in',
    onClick: (e) => {
      if (e.target === backdrop) close();
    }
  }, [dialog]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      close();
    } else if (e.key === 'Enter' && document.activeElement !== cancelBtn) {
      e.stopPropagation();
      confirmBtn.click();
    }
  };

  document.addEventListener('keydown', handleKeyDown);
  root.appendChild(backdrop);
  eventBus.emit('modal:opened');

  requestAnimationFrame(() => cancelBtn.focus());

  function close() {
    document.removeEventListener('keydown', handleKeyDown);
    if (backdrop.parentNode) {
      backdrop.parentNode.removeChild(backdrop);
    }
    if (activeConfirmDialog === controller) {
      activeConfirmDialog = null;
    }
    if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
      previouslyFocused.focus();
    }
    eventBus.emit('modal:closed');
  }

  const controller = { close };
  activeConfirmDialog = controller;
  return controller;
}

