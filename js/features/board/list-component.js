/**
 * Board Column List Component Factory
 */
import { el, empty } from '../../core/dom.js';
import { createIcon } from '../../ui/icon.js';
import { createCardComponent } from './card-component.js';
import { createCardComposer } from './card-composer.js';
import { store } from '../../core/store.js';
import { generateBetween } from '../../data/fractional-index.js';
import { generateId } from '../../core/id.js';
import { openDropdown } from '../../ui/dropdown.js';
import { openConfirmDialog } from '../../ui/confirm-dialog.js';

export function createListComponent(list, onCardClick) {
  let currentList = list;
  const listEl = el('div', {
    class: 'board-list fabric-sunken-list',
    dataset: { listId: list.id }
  });

  const cardsContainer = el('div', {
    class: 'board-list__cards',
    dataset: { listId: list.id }
  });

  const titleText = el('span', { class: 'board-list__title' }, list.title);
  const countBadge = el('span', { class: 'board-list__count' }, '0');
  const colorBar = el('div', {
    class: 'board-list__color-bar',
    style: { 'background-color': list.color || 'var(--accent)' }
  });

  const menuBtn = el('button', {
    class: 'btn-icon',
    'aria-label': 'List menu',
    onClick: (e) => {
      e.stopPropagation();
      openDropdown({
        anchorEl: e.currentTarget,
        items: [
          { label: 'Rename List', icon: 'edit', onClick: enableTitleEdit },
          { label: 'Add Card', icon: 'plus', onClick: () => {
            const composerPrompt = listEl.querySelector('.board-list__composer button');
            if (composerPrompt) composerPrompt.click();
          }},
          { label: 'Delete List', icon: 'trash', danger: true, onClick: () => {
            openConfirmDialog({
              title: 'Delete List?',
              message: `Are you sure you want to delete "${currentList.title}" and all cards inside it?`,
              confirmText: 'Delete List',
              onConfirm: () => store.deleteList(currentList.id)
            });
          }}
        ]
      });
    }
  }, [createIcon('more')]);

  function enableTitleEdit() {
    const input = el('input', {
      class: 'form-input',
      value: currentList.title,
      style: { padding: '2px 6px', 'font-weight': '600', 'font-size': 'var(--font-size-md)' },
      onBlur: () => finishEdit(),
      onKeydown: (e) => {
        if (e.key === 'Enter') finishEdit();
        if (e.key === 'Escape') cancelEdit();
      }
    });

    titleArea.replaceChild(input, titleText);
    input.focus();
    input.select();

    function finishEdit() {
      const newTitle = input.value.trim();
      if (newTitle && newTitle !== currentList.title) {
        store.updateList(currentList.id, { title: newTitle });
      }
      cancelEdit();
    }

    function cancelEdit() {
      if (input.parentNode) {
        titleArea.replaceChild(titleText, input);
      }
    }
  }

  titleText.addEventListener('click', enableTitleEdit);

  const titleArea = el('div', { class: 'board-list__title-area' }, [colorBar, titleText, countBadge]);
  const header = el('div', {
    class: 'board-list__header',
    dataset: { listHeaderId: list.id }
  }, [titleArea, menuBtn]);

  const composer = createCardComposer(async (title) => {
    const cardsInList = store.getState().cards.filter((c) => c.listId === currentList.id);
    const lastCard = cardsInList[cardsInList.length - 1];
    const newOrder = generateBetween(lastCard?.order || null, null);

    const now = Date.now();
    await store.addCard({
      id: generateId(),
      listId: currentList.id,
      projectId: currentList.projectId,
      title,
      description: '',
      order: newOrder,
      labels: [],
      dueDate: null,
      checklist: [],
      priority: null,
      cover: null,
      createdAt: now,
      updatedAt: now,
      archived: false
    });
  });

  const footer = el('div', { class: 'board-list__footer' }, [composer]);

  listEl.appendChild(header);
  listEl.appendChild(cardsContainer);
  listEl.appendChild(footer);

  /** @type {Map<string, ReturnType<typeof createCardComponent>>} */
  const cardComponents = new Map();

  function render(updatedList, cards) {
    currentList = updatedList;
    titleText.textContent = updatedList.title;
    colorBar.style.backgroundColor = updatedList.color || 'var(--accent)';
    countBadge.textContent = String(cards.length);

    empty(cardsContainer);
    for (const card of cards) {
      let comp = cardComponents.get(card.id);
      if (!comp) {
        comp = createCardComponent(card, onCardClick);
        cardComponents.set(card.id, comp);
      } else {
        comp.update(card);
      }
      cardsContainer.appendChild(comp.el);
    }
  }

  return {
    el: listEl,
    update: render,
    destroy: () => {
      cardComponents.forEach((comp) => comp.destroy());
      cardComponents.clear();
    }
  };
}
