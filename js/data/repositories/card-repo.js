import { db } from '../db.js';
import { STORES, INDEXES } from '../schema.js';

export const cardRepo = {
  async getByProject(projectId) {
    const all = await db.getAll(STORES.CARDS, INDEXES.CARD_PROJECT, IDBKeyRange.only(projectId));
    return all
      .filter((c) => !c.archived)
      .sort((a, b) => a.order - b.order);
  },

  async getById(id) {
    return db.get(STORES.CARDS, id);
  },

  async save(card) {
    const record = {
      ...card,
      updatedAt: Date.now()
    };
    return db.put(STORES.CARDS, record);
  },

  async saveMany(cards) {
    return db.putMany(STORES.CARDS, cards);
  },

  async delete(id) {
    return db.delete(STORES.CARDS, id);
  }
};

