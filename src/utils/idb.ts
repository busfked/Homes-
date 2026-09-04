/**
 * Robust, high-capacity client-side persistence using native IndexedDB.
 * Modern browsers provide 50MB - 2GB+ of storage in IndexedDB (far exceeding
 * the 5MB browser localStorage quota).
 */
import { Property, UnlockRequest } from '../types';

const DB_NAME = 'betdelala_idb_v1';
const DB_VERSION = 1;

const STORES = {
  PROPERTIES: 'properties',
  UNLOCK_REQUESTS: 'unlock_requests',
  META: 'meta',
} as const;

let dbPromise: Promise<IDBDatabase> | null = null;

export function isIdbSupported(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window && !!window.indexedDB;
}

function getDb(): Promise<IDBDatabase> {
  if (!isIdbSupported()) {
    return Promise.reject(new Error('IndexedDB is not supported in this environment'));
  }

  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORES.PROPERTIES)) {
          db.createObjectStore(STORES.PROPERTIES, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.UNLOCK_REQUESTS)) {
          db.createObjectStore(STORES.UNLOCK_REQUESTS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.META)) {
          db.createObjectStore(STORES.META, { keyPath: 'key' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        dbPromise = null;
        reject(request.error || new Error('Failed to open IndexedDB'));
      };

      request.onblocked = () => {
        console.warn('IndexedDB database upgrade blocked by other open tabs');
      };
    } catch (err) {
      dbPromise = null;
      reject(err);
    }
  });

  return dbPromise;
}

/**
 * Save full list of properties to IndexedDB
 */
export async function idbSaveProperties(properties: Property[]): Promise<void> {
  if (!isIdbSupported() || !Array.isArray(properties)) return;

  try {
    const db = await getDb();
    const tx = db.transaction(STORES.PROPERTIES, 'readwrite');
    const store = tx.objectStore(STORES.PROPERTIES);

    // Clear existing to avoid orphaned deleted properties
    store.clear();

    for (const prop of properties) {
      if (prop && prop.id) {
        store.put(prop);
      }
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => {
        console.warn('idbSaveProperties transaction error:', tx.error);
        resolve(); // resolve gracefully so it never crashes caller
      };
      tx.onabort = () => resolve();
    });
  } catch (err) {
    console.warn('Failed to save properties to IndexedDB:', err);
  }
}

/**
 * Load all properties from IndexedDB
 */
export async function idbGetProperties(): Promise<Property[]> {
  if (!isIdbSupported()) return [];

  try {
    const db = await getDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORES.PROPERTIES, 'readonly');
      const store = tx.objectStore(STORES.PROPERTIES);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result;
        resolve(Array.isArray(results) ? results : []);
      };

      request.onerror = () => {
        console.warn('idbGetProperties error:', request.error);
        resolve([]);
      };
    });
  } catch (err) {
    console.warn('Failed to read properties from IndexedDB:', err);
    return [];
  }
}

/**
 * Save unlock requests to IndexedDB
 */
export async function idbSaveUnlockRequests(requests: UnlockRequest[]): Promise<void> {
  if (!isIdbSupported() || !Array.isArray(requests)) return;

  try {
    const db = await getDb();
    const tx = db.transaction(STORES.UNLOCK_REQUESTS, 'readwrite');
    const store = tx.objectStore(STORES.UNLOCK_REQUESTS);

    store.clear();

    for (const req of requests) {
      if (req && req.id) {
        store.put(req);
      }
    }

    return new Promise((resolve) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    });
  } catch (err) {
    console.warn('Failed to save unlock requests to IndexedDB:', err);
  }
}

/**
 * Load all unlock requests from IndexedDB
 */
export async function idbGetUnlockRequests(): Promise<UnlockRequest[]> {
  if (!isIdbSupported()) return [];

  try {
    const db = await getDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORES.UNLOCK_REQUESTS, 'readonly');
      const store = tx.objectStore(STORES.UNLOCK_REQUESTS);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result;
        resolve(Array.isArray(results) ? results : []);
      };

      request.onerror = () => {
        resolve([]);
      };
    });
  } catch {
    return [];
  }
}

/**
 * Generic meta key-value store for other large objects
 */
export async function idbSetMeta<T>(key: string, value: T): Promise<void> {
  if (!isIdbSupported()) return;
  try {
    const db = await getDb();
    const tx = db.transaction(STORES.META, 'readwrite');
    const store = tx.objectStore(STORES.META);
    store.put({ key, value });
  } catch {}
}

export async function idbGetMeta<T>(key: string): Promise<T | null> {
  if (!isIdbSupported()) return null;
  try {
    const db = await getDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORES.META, 'readonly');
      const store = tx.objectStore(STORES.META);
      const request = store.get(key);
      request.onsuccess = () => {
        resolve(request.result?.value ?? null);
      };
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}
