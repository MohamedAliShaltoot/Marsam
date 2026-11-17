import { db } from '../db.js';
import { STORES, INDEXES } from '../schema.js';

export const projectRepo = {
  async getAll() {
    const list = await db.getAll(STORES.PROJECTS);
    return list
      .filter((p) => !p.archived)
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  },

  async getById(id) {
    return db.get(STORES.PROJECTS, id);
  },

  async save(project) {
    const record = {
      ...project,
      updatedAt: Date.now()
    };
    return db.put(STORES.PROJECTS, record);
  },

  async delete(id) {
    return db.delete(STORES.PROJECTS, id);
  }
};

