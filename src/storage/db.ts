import type { Defect, InspectionVisit, Project, TaskItem } from '../domain/types';

const DB_NAME = 'construction-inspection-kanban';
const DB_VERSION = 1;

export type StoreName = 'projects' | 'visits' | 'tasks' | 'defects';

type StoreRecordMap = {
  projects: Project;
  visits: InspectionVisit;
  tasks: TaskItem;
  defects: Defect;
};

let databasePromise: Promise<IDBDatabase> | undefined;

function createIndexes(db: IDBDatabase): void {
  const projects = db.createObjectStore('projects', { keyPath: 'id' });
  projects.createIndex('updatedAt', 'updatedAt');

  const visits = db.createObjectStore('visits', { keyPath: 'id' });
  visits.createIndex('projectId', 'projectId');
  visits.createIndex('visitDate', 'visitDate');

  const tasks = db.createObjectStore('tasks', { keyPath: 'id' });
  tasks.createIndex('projectId', 'projectId');
  tasks.createIndex('visitId', 'visitId');

  const defects = db.createObjectStore('defects', { keyPath: 'id' });
  defects.createIndex('projectId', 'projectId');
  defects.createIndex('firstSeenVisitId', 'firstSeenVisitId');
  defects.createIndex('status', 'status');
}

export function openKanbanDb(): Promise<IDBDatabase> {
  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        createIndexes(db);
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
  const transaction = db.transaction(['projects', 'visits', 'tasks', 'defects'], 'readwrite');
  ['projects', 'visits', 'tasks', 'defects'].forEach((storeName) => {
    transaction.objectStore(storeName).clear();
  });
  await promisifyTransaction(transaction);
}
