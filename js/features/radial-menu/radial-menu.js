import { el } from '../../core/dom.js';
import { createIcon } from '../../ui/icon.js';
import { store } from '../../core/store.js';
import { eventBus } from '../../core/event-bus.js';
import { getCardRadialActions } from './radial-actions.js';

let activeMenuInstance = null;

export class RadialMenuController {
  constructor(rootEl) {
    this.rootEl = rootEl;
    this.timer = null;
    this.startX = 0;
    this.startY = 0;
    this.targetCardEl = null;
    this.isMenuOpen = false;

    this.onPointerDown = this.handlePointerDown.bind(this);
    this.onPointerMove = this.handlePointerMove.bind(this);
    this.onPointerUp = this.handlePointerUp.bind(this);
    this.onKeyDown = this.handleKeyDown.bind(this);

    this.rootEl.addEventListener('pointerdown', this.onPointerDown);
    this.rootEl.addEventListener('keydown', this.onKeyDown);
  }

  handlePointerDown(e) {
    if (e.button !== 0) return;
    const cardEl = e.target.closest('.board-card');
    if (!cardEl) return;

    this.targetCardEl = cardEl;
    this.startX = e.clientX;
    this.startY = e.clientY;

    this.timer = setTimeout(() => {
      this.openMenu(cardEl, e.clientX, e.clientY);
    }, 450);

    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
  }

  handlePointerMove(e) {
    if (!this.isMenuOpen) {
      if (Math.hypot(e.clientX - this.startX, e.clientY - this.startY) > 8) {
        this.cancelTimer();
      }
    } else {
      this.updateHoveredBubble(e.clientX, e.clientY);
    }
  }

  handlePointerUp(e) {
    this.cancelTimer();
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);

    if (this.isMenuOpen && this.activeHoveredBubble) {
      const action = this.activeHoveredBubble._action;
      eventBus.emit('radial:select', { action });
      this.close();
      if (action) action.execute();
    }
  }

  handleKeyDown(e) {
    if (e.key === '.' && document.activeElement?.classList?.contains('board-card')) {
      e.preventDefault();
      const rect = document.activeElement.getBoundingClientRect();
      this.openMenu(document.activeElement, rect.left + rect.width / 2, rect.top);
    }
  }

  openMenu(cardEl, clientX, clientY) {
    if (activeMenuInstance) activeMenuInstance.close();
    activeMenuInstance = this;
    this.isMenuOpen = true;
    eventBus.emit('radial:opened');

    if (navigator.vibrate) navigator.vibrate(10);

    const cardId = cardEl.dataset.cardId;
    const card = store.getState().cards.find((c) => c.id === cardId);
    if (!card) return;

    cardEl.classList.add('radial-target-highlight');

    const actions = getCardRadialActions(card);
    const bubbleElements = [];

    const overlay = el('div', {
      class: 'radial-overlay anim-fade-in',
      onClick: () => this.close()
    });

    const menu = el('div', { class: 'radial-menu' });

    actions.forEach((act, index) => {
      const tooltip = el('span', { class: 'radial-bubble__tooltip' }, act.label);
      const bubble = el('button', {
        class: 'radial-bubble',
        style: { '--bubble-index': index },
        'aria-label': act.label,
        onClick: (e) => {
          e.stopPropagation();
          eventBus.emit('radial:select', { action: act });
          this.close();
          act.execute();
        }
      }, [createIcon(act.icon), tooltip]);

      bubble._action = act;
      bubbleElements.push(bubble);
      menu.appendChild(bubble);
    });

    document.body.appendChild(overlay);
    document.body.appendChild(menu);

    const cardRect = cardEl.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();

    let top = cardRect.top - menuRect.height - 12;
    if (top < 10) {
      top = cardRect.bottom + 12;
    }
    let left = cardRect.left + (cardRect.width - menuRect.width) / 2;
    left = Math.max(12, Math.min(window.innerWidth - menuRect.width - 12, left));

    menu.style.top = `${top}px`;
    menu.style.left = `${left}px`;

    this.overlay = overlay;
    this.menu = menu;
    this.bubbleElements = bubbleElements;
    this.targetCardEl = cardEl;

    let focusedIndex = 0;
    bubbleElements[0]?.focus();

    this.keyHandler = (e) => {
      if (e.key === 'Escape') this.close();
      if (e.key === 'ArrowRight') {
        focusedIndex = (focusedIndex + 1) % bubbleElements.length;
        bubbleElements[focusedIndex]?.focus();
      }
      if (e.key === 'ArrowLeft') {
        focusedIndex = (focusedIndex - 1 + bubbleElements.length) % bubbleElements.length;
        bubbleElements[focusedIndex]?.focus();
      }
    };
    window.addEventListener('keydown', this.keyHandler);
  }

  updateHoveredBubble(x, y) {
    const elBelow = document.elementFromPoint(x, y);
    const bubble = elBelow?.closest('.radial-bubble');

    if (this.activeHoveredBubble !== bubble) {
      if (this.activeHoveredBubble) {
        this.activeHoveredBubble.classList.remove('is-magnified');
      }
      this.activeHoveredBubble = bubble;
      if (bubble) {
        bubble.classList.add('is-magnified');
        const idx = Number(bubble.style.getPropertyValue('--bubble-index')) || 0;
        eventBus.emit('radial:hover', { index: idx });
        if (navigator.vibrate) navigator.vibrate(6);
      }
    }
  }

  cancelTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  close() {
    this.cancelTimer();
    this.isMenuOpen = false;
    this.activeHoveredBubble = null;

    if (this.targetCardEl) {
      this.targetCardEl.classList.remove('radial-target-highlight');
      this.targetCardEl = null;
    }
    if (this.overlay?.parentNode) this.overlay.parentNode.removeChild(this.overlay);
    if (this.menu?.parentNode) this.menu.parentNode.removeChild(this.menu);
    if (this.keyHandler) window.removeEventListener('keydown', this.keyHandler);

    if (activeMenuInstance === this) activeMenuInstance = null;
  }

  destroy() {
    this.close();
    this.rootEl.removeEventListener('pointerdown', this.onPointerDown);
    this.rootEl.removeEventListener('keydown', this.onKeyDown);
  }
}

