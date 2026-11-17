/**
 * DND Fractional Ordering Helpers
 */
import { generateBetween } from '../../data/fractional-index.js';

/**
 * Calculates new order for a card dropped into a list container
 * @param {HTMLElement} cardEl
 * @param {Array<Object>} allCards
 * @returns {{ targetListId: string, newOrder: number } | null}
 */
export function calculateCardDropOrder(cardEl, allCards) {
  const cardId = cardEl.dataset.cardId;
  const parentContainer = cardEl.closest('.board-list__cards');
  if (!parentContainer) return null;
  const targetListId = parentContainer.dataset.listId;

  const cardsInList = Array.from(parentContainer.querySelectorAll('.board-card'));
  const index = cardsInList.indexOf(cardEl);

  const prevCardEl = cardsInList[index - 1];
  const nextCardEl = cardsInList[index + 1];

  const prevCard = prevCardEl ? allCards.find((c) => c.id === prevCardEl.dataset.cardId) : null;
  const nextCard = nextCardEl ? allCards.find((c) => c.id === nextCardEl.dataset.cardId) : null;

  const newOrder = generateBetween(prevCard?.order || null, nextCard?.order || null);
  return { cardId, targetListId, newOrder };
}

/**
 * Calculates new order for a moved list
 * @param {HTMLElement} listEl
 * @param {HTMLElement} boardScrollEl
 * @param {Array<Object>} allLists
 * @returns {{ listId: string, newOrder: number } | null}
 */
export function calculateListDropOrder(listEl, boardScrollEl, allLists) {
  const listId = listEl.dataset.listId;
  const lists = Array.from(boardScrollEl.querySelectorAll('.board-list'));
  const index = lists.indexOf(listEl);

  const prevListEl = lists[index - 1];
  const nextListEl = lists[index + 1];

  const prevList = prevListEl ? allLists.find((l) => l.id === prevListEl.dataset.listId) : null;
  const nextList = nextListEl ? allLists.find((l) => l.id === nextListEl.dataset.listId) : null;

  const newOrder = generateBetween(prevList?.order || null, nextList?.order || null);
  return { listId, newOrder };
}
