/**
 * Project Repository
 * CRUD operations for Projects in IndexedDB
 */
import { db } from '../db.js';
import { STORES, INDEXES } from '../schema.js';

export const projectRepo = {
  /**
   * Retrieves all non-archived projects sorted by updatedAt desc
   * @returns {Promise<import('../../core/store.js').Project[]>}
   */
  async getAll() {
    const list = await db.getAll(STORES.PROJECTS);
    return list
      .filter((p) => !p.archived)
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  },

  /**
   * Retrieves a single project by id
   * @param {string} id
   * @returns {Promise<import('../../core/store.js').Project|null>}
   */
  async getById(id) {
    return db.get(STORES.PROJECTS, id);
  },

  /**
   * Creates or updates a project record
   * @param {import('../../core/store.js').Project} project
   * @returns {Promise<import('../../core/store.js').Project>}
   */
  async save(project) {
    const record = {
      ...project,
      updatedAt: Date.now()
    };
    return db.put(STORES.PROJECTS, record);
  },

  /**
   * Deletes a project by id
   * @param {string} id
   * @returns {Promise<void>}
   */
  async delete(id) {
    return db.delete(STORES.PROJECTS, id);
  }
};
