import type { Defect, InspectionVisit, Project, ReportSnapshot, TaskItem } from '../domain/types';

const DB_NAME = 'construction-inspection-kanban';
const DB_VERSION = 2;

export type StoreName = 'projects' | 'visits' | 'tasks' | 'defects' | 'reports';

type StoreRecordMap = {
  projects: Project;
  visits: InspectionVisit;
  tasks: TaskItem;
  defects: Defect;
  reports: ReportSnapshot;
};

let databasePromise: Promise<IDBDatabase> | undefined;

function ensureStore(db: IDBDatabase, transaction: IDBTransaction, storeName: StoreName): IDBObjectStore {
  if (db.objectStoreNames.contains(storeName)) {
    return transaction.objectStore(storeName);
  }

  return db.createObjectStore(storeName, { keyPath: 'id' });
}

function ensureIndex(store: IDBObjectStore, indexName: string, keyPath: string): void {
  if (!store.indexNames.contains(indexName)) {
    store.createIndex(indexName, keyPath);
  }
}

function createIndexes(db: IDBDatabase, transaction: IDBTransaction): void {
  const projects = ensureStore(db, transaction, 'projects');
  ensureIndex(projects, 'updatedAt', 'updatedAt');

  const visits = ensureStore(db, transaction, 'visits');
  ensureIndex(visits, 'projectId', 'projectId');
  ensureIndex(visits, 'visitDate', 'visitDate');

  const tasks = ensureStore(db, transaction, 'tasks');
  ensureIndex(tasks, 'projectId', 'projectId');
  ensureIndex(tasks, 'visitId', 'visitId');

  const defects = ensureStore(db, transaction, 'defects');
  ensureIndex(defects, 'projectId', 'projectId');
  ensureIndex(defects, 'firstSeenVisitId', 'firstSeenVisitId');
  ensureIndex(defects, 'status', 'status');

  const reports = ensureStore(db, transaction, 'reports');
  ensureIndex(reports, 'projectId', 'projectId');
  ensureIndex(reports, 'visitId', 'visitId');
  ensureIndex(reports, 'generatedAt', 'generatedAt');
}

export function openKanbanDb(): Promise<IDBDatabase> {
  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!request.transaction) {
          reject(new Error('לא ניתן לשדרג את מסד הנתונים המקומי.'));
          return;
        }
        createIndexes(db, request.transaction);
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () =>
        reject(new Error('מסד הנתונים חסום על ידי חלון אחר. יש לסגור כרטיסיות אחרות של האפליקציה.'));
    });
  }

  return databasePromise;
}

function promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function promisifyTransaction(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

export async function getAllFromStore<Name extends StoreName>(
  storeName: Name
): Promise<StoreRecordMap[Name][]> {
  const db = await openKanbanDb();
  const transaction = db.transaction(storeName, 'readonly');
  const store = transaction.objectStore(storeName);
  return promisifyRequest(store.getAll()) as Promise<StoreRecordMap[Name][]>;
}

export async function getFromStore<Name extends StoreName>(
  storeName: Name,
  id: string
): Promise<StoreRecordMap[Name] | undefined> {
  const db = await openKanbanDb();
  const transaction = db.transaction(storeName, 'readonly');
  const store = transaction.objectStore(storeName);
  return promisifyRequest(store.get(id)) as Promise<StoreRecordMap[Name] | undefined>;
}

export async function putInStore<Name extends StoreName>(
  storeName: Name,
  record: StoreRecordMap[Name]
): Promise<StoreRecordMap[Name]> {
  const db = await openKanbanDb();
  const transaction = db.transaction(storeName, 'readwrite');
  transaction.objectStore(storeName).put(record);
  await promisifyTransaction(transaction);
  return record;
}

export async function putManyInStore<Name extends StoreName>(
  storeName: Name,
  records: StoreRecordMap[Name][]
): Promise<StoreRecordMap[Name][]> {
  const db = await openKanbanDb();
  const transaction = db.transaction(storeName, 'readwrite');
  const store = transaction.objectStore(storeName);
  records.forEach((record) => store.put(record));
  await promisifyTransaction(transaction);
  return records;
}

export async function deleteFromStore(storeName: StoreName, id: string): Promise<void> {
  const db = await openKanbanDb();
  const transaction = db.transaction(storeName, 'readwrite');
  transaction.objectStore(storeName).delete(id);
  await promisifyTransaction(transaction);
}

export async function clearKanbanDbForTests(): Promise<void> {
  const db = await openKanbanDb();
  const storeNames: StoreName[] = ['projects', 'visits', 'tasks', 'defects', 'reports'];
  const transaction = db.transaction(storeNames, 'readwrite');
  storeNames.forEach((storeName) => {
    transaction.objectStore(storeName).clear();
  });
  await promisifyTransaction(transaction);
}
