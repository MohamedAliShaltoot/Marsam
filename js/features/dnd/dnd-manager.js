import { el } from '../../core/dom.js';
import { Flip } from './flip.js';
import { AutoScroller } from './dnd-autoscroll.js';
import { store } from '../../core/store.js';
import { eventBus } from '../../core/event-bus.js';
import { calculateCardDropOrder, calculateListDropOrder } from './dnd-order.js';

export class DndManager {
  constructor(boardScrollEl) {
    this.boardScrollEl = boardScrollEl;
    this.scroller = new AutoScroller();
    this.isDragging = false;
    this.dragType = null;
    this.draggedEl = null;
    this.placeholder = null;
    this.startX = 0;
    this.startY = 0;
    this.offsetX = 0;
    this.offsetY = 0;

    this.onPointerDown = this.handlePointerDown.bind(this);
    this.onPointerMove = this.handlePointerMove.bind(this);
    this.onPointerUp = this.handlePointerUp.bind(this);

    this.boardScrollEl.addEventListener('pointerdown', this.onPointerDown);
  }

  handlePointerDown(e) {
    if (e.button !== 0) return;
    if (e.target.closest('button, input, textarea, a, select, [contenteditable="true"]')) return;

    const cardEl = e.target.closest('.board-card');
    const listHeader = e.target.closest('.board-list__header');

    if (cardEl) {
      this.initDragCandidate(e, 'card', cardEl);
    } else if (listHeader) {
      const listEl = listHeader.closest('.board-list');
      if (listEl) this.initDragCandidate(e, 'list', listEl);
    }
  }

  initDragCandidate(e, type, targetEl) {
    this.dragType = type;
    this.draggedEl = targetEl;
    this.startX = e.clientX;
    this.startY = e.clientY;
    const rect = targetEl.getBoundingClientRect();
    this.offsetX = e.clientX - rect.left;
    this.offsetY = e.clientY - rect.top;

    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
  }

  handlePointerMove(e) {
    const dist = Math.hypot(e.clientX - this.startX, e.clientY - this.startY);
    if (!this.isDragging && dist > 6) {
      this.startDragging(e);
    }
    if (this.isDragging) {
      this.moveDragging(e);
    }
  }

  startDragging(e) {
    this.isDragging = true;
    this.draggedEl.dataset.isDragging = 'true';
    eventBus.emit('dnd:lift', { type: this.dragType });
    const rect = this.draggedEl.getBoundingClientRect();

    this.placeholder = el('div', { class: 'dnd-placeholder' });
    this.placeholder.style.height = `${rect.height}px`;
    this.placeholder.style.width = `${rect.width}px`;

    this.draggedEl.parentNode.insertBefore(this.placeholder, this.draggedEl);

    this.draggedEl.classList.add('fabric-card-lifted');
    this.draggedEl.style.position = 'fixed';
    this.draggedEl.style.width = `${rect.width}px`;
    this.draggedEl.style.pointerEvents = 'none';
    document.body.appendChild(this.draggedEl);

    this.moveDragging(e);
  }

  moveDragging(e) {
    this.draggedEl.style.left = `${e.clientX - this.offsetX}px`;
    this.draggedEl.style.top = `${e.clientY - this.offsetY}px`;

    if (this.dragType === 'card') {
      this.updateCardPlacement(e.clientX, e.clientY);
    } else if (this.dragType === 'list') {
      this.updateListPlacement(e.clientX);
    }

    const currentCardsContainer = this.placeholder?.closest('.board-list__cards');
    this.scroller.update(e.clientX, e.clientY, this.boardScrollEl, currentCardsContainer);
  }

  updateCardPlacement(x, y) {
    const elemBelow = document.elementFromPoint(x, y);
    const targetList = elemBelow?.closest('.board-list');
    if (!targetList) return;

    const cardsContainer = targetList.querySelector('.board-list__cards');
    if (!cardsContainer) return;

    const siblings = Array.from(cardsContainer.querySelectorAll('.board-card:not([data-is-dragging="true"])'));
    let insertBeforeEl = null;

    for (const sib of siblings) {
      const box = sib.getBoundingClientRect();
      if (y < box.top + box.height / 2) {
        insertBeforeEl = sib;
        break;
      }
    }

    if (this.placeholder.parentNode !== cardsContainer || this.placeholder.nextSibling !== insertBeforeEl) {
      const snapshot = Flip.snapshot([...siblings, this.placeholder]);
      if (insertBeforeEl) {
        cardsContainer.insertBefore(this.placeholder, insertBeforeEl);
      } else {
        cardsContainer.appendChild(this.placeholder);
      }
      Flip.play(snapshot, 160);
    }
  }

  updateListPlacement(x) {
    const lists = Array.from(this.boardScrollEl.querySelectorAll('.board-list:not([data-is-dragging="true"])'));
    let insertBeforeEl = null;

    for (const list of lists) {
      const box = list.getBoundingClientRect();
      if (x < box.left + box.width / 2) {
        insertBeforeEl = list;
        break;
      }
    }

    if (this.placeholder.nextSibling !== insertBeforeEl) {
      const snapshot = Flip.snapshot([...lists, this.placeholder]);
      if (insertBeforeEl) {
        this.boardScrollEl.insertBefore(this.placeholder, insertBeforeEl);
      } else {
        const addWrapper = this.boardScrollEl.querySelector('.board-add-list-wrapper');
        this.boardScrollEl.insertBefore(this.placeholder, addWrapper);
      }
      Flip.play(snapshot, 160);
    }
  }

  async handlePointerUp() {
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    this.scroller.stop();

    if (!this.isDragging) {
      this.reset();
      return;
    }

    eventBus.emit('dnd:drop', { type: this.dragType });

    const targetPlaceholder = this.placeholder;
    const movedEl = this.draggedEl;

    if (targetPlaceholder?.parentNode) {
      targetPlaceholder.parentNode.replaceChild(movedEl, targetPlaceholder);
    }

    movedEl.classList.remove('fabric-card-lifted');
    movedEl.classList.add('anim-card-settle', 'anim-fabric-ripple');
    movedEl.style.position = '';
    movedEl.style.width = '';
    movedEl.style.left = '';
    movedEl.style.top = '';
    movedEl.style.pointerEvents = '';

    setTimeout(() => {
      movedEl.classList.remove('anim-card-settle', 'anim-fabric-ripple');
      delete movedEl.dataset.isDragging;
    }, 400);

    if (this.dragType === 'card') {
      const res = calculateCardDropOrder(movedEl, store.getState().cards);
      if (res) await store.moveCard(res.cardId, res.targetListId, res.newOrder);
    } else if (this.dragType === 'list') {
      const res = calculateListDropOrder(movedEl, this.boardScrollEl, store.getState().lists);
      if (res) await store.moveList(res.listId, res.newOrder);
    }

    this.reset();
  }

  reset() {
    this.isDragging = false;
    this.dragType = null;
    this.draggedEl = null;
    if (this.placeholder?.parentNode) {
      this.placeholder.parentNode.removeChild(this.placeholder);
    }
    this.placeholder = null;
  }

  destroy() {
    this.boardScrollEl.removeEventListener('pointerdown', this.onPointerDown);
    this.scroller.stop();
  }
}

