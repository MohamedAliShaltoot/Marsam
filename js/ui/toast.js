/**
 * Toast Notification System
 * Shows brief feedback messages with optional action buttons (e.g. "Undo").
 */
import { el } from '../core/dom.js';
import { createIcon } from './icon.js';
import { eventBus } from '../core/event-bus.js';

let container = null;

function getOrCreateContainer() {
  if (!container || !container.parentNode) {
    container = document.getElementById('toast-root');
    if (!container) {
      container = el('div', { id: 'toast-root', class: 'toast-container' });
      document.body.appendChild(container);
    }
  }
  return container;
}

/**
 * @typedef {Object} ToastOptions
 * @property {string} message
 * @property {'info'|'success'|'error'} [type='info']
 * @property {{ label: string, onClick: () => void }} [action]
 * @property {number} [duration=4500]
 */

/**
 * Displays a toast notification
 * @param {ToastOptions|string} options
 */
export function showToast(options) {
  const opts = typeof options === 'string' ? { message: options } : options;
  const { message, action, duration = 4500 } = opts;
  const parent = getOrCreateContainer();
  eventBus.emit('ui:toast', opts);

  const msgEl = el('span', { class: 'toast-item__message' }, message);
  const elements = [msgEl];

  let dismissTimer = null;

  if (action) {
    const actionBtn = el('button', {
      class: 'toast-item__action',
      onClick: () => {
        if (dismissTimer) clearTimeout(dismissTimer);
        dismiss();
        action.onClick();
      }
    }, action.label);
    elements.push(actionBtn);
  }

  const closeBtn = el('button', {
    class: 'toast-item__close',
    'aria-label': 'Dismiss notification',
    onClick: () => dismiss()
  }, [createIcon('close')]);
  elements.push(closeBtn);

  const toast = el('div', { class: 'toast-item anim-slide-up', role: 'status' }, elements);
  parent.appendChild(toast);

  function dismiss() {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }

  if (duration > 0) {
    dismissTimer = setTimeout(dismiss, duration);
  }

  return { dismiss };
}

// Global DB error subscriber
eventBus.on('db:error', ({ message }) => {
  showToast({ message: `Database error: ${message}`, duration: 6000 });
});
