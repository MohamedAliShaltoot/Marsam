import { db } from '../db.js';
import { STORES, INDEXES } from '../schema.js';

export const drawingRepo = {
  async getByProject(projectId) {
    return db.getAll(STORES.DRAWINGS, INDEXES.DRAWING_PROJECT, IDBKeyRange.only(projectId));
  },

  async getById(id) {
    return db.get(STORES.DRAWINGS, id);
  },

  async save(drawing) {
    const record = {
      ...drawing,
      updatedAt: Date.now()
    };
    return db.put(STORES.DRAWINGS, record);
  },

  async delete(id) {
    return db.delete(STORES.DRAWINGS, id);
  }
};

