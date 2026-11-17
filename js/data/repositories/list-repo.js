/**
 * List Repository
 * CRUD operations for Column Lists in IndexedDB
 */
import { db } from '../db.js';
import { STORES, INDEXES } from '../schema.js';

export const listRepo = {
  /**
   * Retrieves all non-archived lists for a project sorted by order
   * @param {string} projectId
   * @returns {Promise<import('../../core/store.js').List[]>}
   */
  async getByProject(projectId) {
    const all = await db.getAll(STORES.LISTS, INDEXES.LIST_PROJECT, IDBKeyRange.only(projectId));
    return all
      .filter((l) => !l.archived)
      .sort((a, b) => a.order - b.order);
  },

  /**
   * Saves or updates a list record
   * @param {import('../../core/store.js').List} list
   * @returns {Promise<import('../../core/store.js').List>}
   */
  async save(list) {
    return db.put(STORES.LISTS, list);
  },

  /**
   * Batch saves multiple lists (e.g. for rebalancing)
   * @param {import('../../core/store.js').List[]} lists
   * @returns {Promise<import('../../core/store.js').List[]>}
   */
  async saveMany(lists) {
    return db.putMany(STORES.LISTS, lists);
  },

  /**
   * Deletes a list by id
   * @param {string} id
   * @returns {Promise<void>}
   */
  async delete(id) {
    return db.delete(STORES.LISTS, id);
  }
};
