import { db } from '../db.js';
import { STORES, INDEXES } from '../schema.js';

export const listRepo = {
  async getByProject(projectId) {
    const all = await db.getAll(STORES.LISTS, INDEXES.LIST_PROJECT, IDBKeyRange.only(projectId));
    return all
      .filter((l) => !l.archived)
      .sort((a, b) => a.order - b.order);
  },

  async save(list) {
    return db.put(STORES.LISTS, list);
  },

  async saveMany(lists) {
    return db.putMany(STORES.LISTS, lists);
  },

  async delete(id) {
    return db.delete(STORES.LISTS, id);
  }
};

