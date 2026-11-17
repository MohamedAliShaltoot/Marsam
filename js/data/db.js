/**
 * Promise-Based IndexedDB Wrapper
 * Clean transaction handling, quota persistence, and error events
 */
import { DB_NAME, DB_VERSION } from './schema.js';
import { runMigrations } from './migrations.js';
import { eventBus } from '../core/event-bus.js';

class DB {
  constructor() {
    /** @type {IDBDatabase|null} */
    this.db = null;
    /** @type {Promise<IDBDatabase>|null} */
    this.initPromise = null;
  }

  /**
   * Initializes or returns the open IndexedDB instance
   * @returns {Promise<IDBDatabase>}
   */
  async open() {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB is not supported in this environment.'));
        return;
      }

      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = (e) => {
        runMigrations(req.result, e);
      };

      req.onsuccess = () => {
        this.db = req.result;
        this.requestPersistence();
        resolve(this.db);
      };

      req.onerror = () => {
        const error = req.error || new Error('Failed to open database');
        eventBus.emit('db:error', { message: 'Database error: ' + error.message });
        reject(error);
      };

      req.onblocked = () => {
        eventBus.emit('db:error', { message: 'Database upgrade blocked. Please close other tabs.' });
      };
    });

    return this.initPromise;
  }

  /**
   * Attempts to request persistent storage
   */
  async requestPersistence() {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      try {
        await navigator.storage.persist();
      } catch (e) {
        // Silent catch for unsupported browsers
      }
    }
  }

  /**
   * Retrieves an item by key from an object store
   * @template T
   * @param {string} storeName
   * @param {string} key
   * @returns {Promise<T|null>}
   */
  async get(storeName, key) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Retrieves all items from a store, optionally using an index
   * @template T
   * @param {string} storeName
   * @param {string} [indexName]
   * @param {IDBKeyRange|IDBValidKey} [query]
   * @returns {Promise<T[]>}
   */
  async getAll(storeName, indexName, query) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const target = indexName ? store.index(indexName) : store;
      const req = query ? target.getAll(query) : target.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Saves or updates an item in an object store
   * @template T
   * @param {string} storeName
   * @param {T} item
   * @returns {Promise<T>}
   */
  async put(storeName, item) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(item);
      req.onsuccess = () => resolve(item);
      req.onerror = () => {
        eventBus.emit('db:error', { message: 'Storage write failed: ' + req.error?.message });
        reject(req.error);
      };
    });
  }

  /**
   * Saves multiple items within a single transaction
   * @template T
   * @param {string} storeName
   * @param {T[]} items
   * @returns {Promise<T[]>}
   */
  async putMany(storeName, items) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      items.forEach((item) => store.put(item));
      tx.oncomplete = () => resolve(items);
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Deletes an item by key
   * @param {string} storeName
   * @param {string} key
   * @returns {Promise<void>}
   */
  async delete(storeName, key) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}

export const db = new DB();
