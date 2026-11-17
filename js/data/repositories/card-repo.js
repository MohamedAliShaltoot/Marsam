/**
 * Card Repository
 * CRUD operations for Cards in IndexedDB
 */
import { db } from '../db.js';
import { STORES, INDEXES } from '../schema.js';

export const cardRepo = {
  /**
   * Retrieves all non-archived cards for a project sorted by order
   * @param {string} projectId
   * @returns {Promise<import('../../core/store.js').Card[]>}
   */
  async getByProject(projectId) {
    const all = await db.getAll(STORES.CARDS, INDEXES.CARD_PROJECT, IDBKeyRange.only(projectId));
    return all
      .filter((c) => !c.archived)
      .sort((a, b) => a.order - b.order);
  },

  /**
   * Retrieves a single card by id
   * @param {string} id
   * @returns {Promise<import('../../core/store.js').Card|null>}
   */
  async getById(id) {
    return db.get(STORES.CARDS, id);
  },

  /**
   * Saves or updates a card record
   * @param {import('../../core/store.js').Card} card
   * @returns {Promise<import('../../core/store.js').Card>}
   */
  async save(card) {
    const record = {
      ...card,
      updatedAt: Date.now()
    };
    return db.put(STORES.CARDS, record);
  },

  /**
   * Batch saves cards (for rebalancing or reordering)
   * @param {import('../../core/store.js').Card[]} cards
   * @returns {Promise<import('../../core/store.js').Card[]>}
   */
  async saveMany(cards) {
    return db.putMany(STORES.CARDS, cards);
  },

  /**
   * Deletes a card by id
   * @param {string} id
   * @returns {Promise<void>}
   */
  async delete(id) {
    return db.delete(STORES.CARDS, id);
  }
};
