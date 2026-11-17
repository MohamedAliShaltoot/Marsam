/**
 * IndexedDB Schema Migrations
 */
import { STORES, INDEXES } from './schema.js';

/**
 * Handles database upgrade migrations across versions
 * @param {IDBDatabase} db
 * @param {IDBVersionChangeEvent} event
 */
export function runMigrations(db, event) {
  const oldVersion = event.oldVersion;

  if (oldVersion < 1) {
    // Version 1 setup
    if (!db.objectStoreNames.contains(STORES.PROJECTS)) {
      const projectStore = db.createObjectStore(STORES.PROJECTS, { keyPath: 'id' });
      projectStore.createIndex(INDEXES.PROJECT_UPDATED, 'updatedAt', { unique: false });
    }

    if (!db.objectStoreNames.contains(STORES.LISTS)) {
      const listStore = db.createObjectStore(STORES.LISTS, { keyPath: 'id' });
      listStore.createIndex(INDEXES.LIST_PROJECT, 'projectId', { unique: false });
      listStore.createIndex(INDEXES.LIST_ORDER, 'order', { unique: false });
    }

    if (!db.objectStoreNames.contains(STORES.CARDS)) {
      const cardStore = db.createObjectStore(STORES.CARDS, { keyPath: 'id' });
      cardStore.createIndex(INDEXES.CARD_PROJECT, 'projectId', { unique: false });
      cardStore.createIndex(INDEXES.CARD_LIST, 'listId', { unique: false });
      cardStore.createIndex(INDEXES.CARD_ORDER, 'order', { unique: false });
    }

    if (!db.objectStoreNames.contains(STORES.DRAWINGS)) {
      const drawingStore = db.createObjectStore(STORES.DRAWINGS, { keyPath: 'id' });
      drawingStore.createIndex(INDEXES.DRAWING_PROJECT, 'projectId', { unique: false });
    }

    if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
      db.createObjectStore(STORES.SETTINGS, { keyPath: 'id' });
    }
  }
}
