/**
 * Drawing Repository
 * CRUD operations for Whiteboard Drawings in IndexedDB
 */
import { db } from '../db.js';
import { STORES, INDEXES } from '../schema.js';

export const drawingRepo = {
  /**
   * Retrieves all drawings for a project
   * @param {string} projectId
   * @returns {Promise<import('../../core/store.js').Drawing[]>}
   */
  async getByProject(projectId) {
    return db.getAll(STORES.DRAWINGS, INDEXES.DRAWING_PROJECT, IDBKeyRange.only(projectId));
  },

  /**
   * Retrieves a single drawing by id
   * @param {string} id
   * @returns {Promise<import('../../core/store.js').Drawing|null>}
   */
  async getById(id) {
    return db.get(STORES.DRAWINGS, id);
  },

  /**
   * Saves or updates a drawing
   * @param {import('../../core/store.js').Drawing} drawing
   * @returns {Promise<import('../../core/store.js').Drawing>}
   */
  async save(drawing) {
    const record = {
      ...drawing,
      updatedAt: Date.now()
    };
    return db.put(STORES.DRAWINGS, record);
  },

  /**
   * Deletes a drawing
   * @param {string} id
   * @returns {Promise<void>}
   */
  async delete(id) {
    return db.delete(STORES.DRAWINGS, id);
  }
};
