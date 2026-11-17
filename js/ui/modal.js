import { el } from '../core/dom.js';
import { createIcon } from './icon.js';
import { eventBus } from '../core/event-bus.js';

let activeModal = null;

export function openModal({ title, content, footer, size = 'md', onClose }) {
  if (activeModal) {
    activeModal.close();
  }

  const root = document.getElementById('modal-root') || document.body;
  const previouslyFocused = document.activeElement;

  const closeBtn = el('button', {
    class: 'btn-icon',
    'aria-label': 'Close dialog',
    onClick: () => close()
  }, [createIcon('close')]);

  const header = el('div', { class: 'modal-header' }, [
    typeof title === 'string' ? el('h2', { class: 'modal-title' }, title) : title,
    closeBtn
  ]);

  const bodyChildren = Array.isArray(content) ? content : [content];
  const body = el('div', { class: 'modal-body' }, bodyChildren);

  const containerClasses = `modal-container modal--${size} anim-pop-in`;
  const modalContainer = el('div', {
    class: containerClasses,
    role: 'dialog',
    'aria-modal': 'true'
  }, [header, body]);

  if (footer) {
    const footerChildren = Array.isArray(footer) ? footer : [footer];
    const footerEl = el('div', { class: 'modal-footer' }, footerChildren);
    modalContainer.appendChild(footerEl);
  }

  const backdrop = el('div', {
    class: 'modal-backdrop anim-fade-in',
    onClick: (e) => {
      if (e.target === backdrop) close();
    }
  }, [modalContainer]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      close();
    }
  };

  document.addEventListener('keydown', handleKeyDown);
  root.appendChild(backdrop);
  eventBus.emit('modal:opened');

  requestAnimationFrame(() => {
    const focusable = modalContainer.querySelector('input, textarea, button:not([aria-label="Close dialog"]), select');
    if (focusable) {
 (focusable).focus();
    } else {
      closeBtn.focus();
    }
  });

  function close() {
    eventBus.emit('modal:closed');
    document.removeEventListener('keydown', handleKeyDown);
    if (backdrop.parentNode) {
      backdrop.parentNode.removeChild(backdrop);
    }
    if (activeModal === controller) {
      activeModal = null;
    }
    if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
      previouslyFocused.focus();
    }
    if (typeof onClose === 'function') {
      onClose();
    }
  }

  const controller = { close, container: modalContainer };
  activeModal = controller;
  return controller;
}

