import { DEFAULT_TASK_TEMPLATES } from '../domain/defaults';
import { changeDefectStatus } from '../domain/status';
import {
  getActiveDefects,
  getAllDefects,
  getDefectsFirstSeenInVisit,
  getDefectsMarkedDoneInVisit,
  getDefectsUpdatedInVisit
} from '../domain/summaries';
import type {
  Defect,
  DefectStatus,
  InspectionVisit,
  NewDefectInput,
  NewProjectInput,
  NewTaskInput,
  NewVisitInput,
  PhotoAttachment,
  Project,
  TaskItem
} from '../domain/types';
import { validateDefectInput, validateTaskInput } from '../domain/validation';
import { nowIso } from '../utils/dates';
import { newId } from '../utils/ids';
import { deleteFromStore, getAllFromStore, getFromStore, putInStore, putManyInStore } from './db';

function byUpdatedDesc<T extends { updatedAt: string }>(a: T, b: T): number {
  return b.updatedAt.localeCompare(a.updatedAt);
}

function byVisitDateDesc(a: InspectionVisit, b: InspectionVisit): number {
  return `${b.visitDate}-${b.createdAt}`.localeCompare(`${a.visitDate}-${a.createdAt}`);
}

function trimOptional(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function buildPhotoAttachment(photo: NonNullable<NewDefectInput['photos']>[number], defectId: string): PhotoAttachment {
  return {
    id: photo.id ?? newId('photo'),
    defectId,
    dataUrl: photo.dataUrl,
    fileName: trimOptional(photo.fileName),
    mimeType: photo.mimeType,
    width: photo.width,
    height: photo.height,
    createdAt: photo.createdAt ?? nowIso()
  };
}

export async function getProjects(): Promise<Project[]> {
  return (await getAllFromStore('projects')).sort(byUpdatedDesc);
}

export async function getProject(projectId: string): Promise<Project | undefined> {
  return getFromStore('projects', projectId);
}

export async function createProject(input: NewProjectInput): Promise<Project> {
  const now = nowIso();
  const project: Project = {
    id: newId('project'),
    name: input.name.trim() || 'פרויקט ללא שם',
    address: trimOptional(input.address),
    clientName: trimOptional(input.clientName),
    createdAt: now,
    updatedAt: now
  };

  return putInStore('projects', project);
}

export async function updateProject(projectId: string, patch: Partial<NewProjectInput>): Promise<Project> {
  const existing = await getProject(projectId);
  if (!existing) {
    throw new Error('הפרויקט לא נמצא.');
  }

  const updated: Project = {
    ...existing,
    name: patch.name?.trim() || existing.name,
    address: patch.address !== undefined ? trimOptional(patch.address) : existing.address,
    clientName: patch.clientName !== undefined ? trimOptional(patch.clientName) : existing.clientName,
    updatedAt: nowIso()
  };

  return putInStore('projects', updated);
}

export async function getVisits(projectId: string): Promise<InspectionVisit[]> {
  return (await getAllFromStore('visits')).filter((visit) => visit.projectId === projectId).sort(byVisitDateDesc);
}

export async function getVisit(visitId: string): Promise<InspectionVisit | undefined> {
  return getFromStore('visits', visitId);
}

export async function createVisit(input: NewVisitInput): Promise<InspectionVisit> {
  const now = nowIso();
  const visit: InspectionVisit = {
    id: newId('visit'),
    projectId: input.projectId,
    inspectorName: input.inspectorName.trim() || 'מהנדס האתר',
    visitDate: input.visitDate,
    notes: trimOptional(input.notes),
    createdAt: now,
    updatedAt: now
  };

  return putInStore('visits', visit);
}

export async function updateVisit(visitId: string, patch: Partial<NewVisitInput>): Promise<InspectionVisit> {
  const existing = await getVisit(visitId);
  if (!existing) {
    throw new Error('הביקור לא נמצא.');
  }

  const updated: InspectionVisit = {
    ...existing,
    inspectorName:
      patch.inspectorName !== undefined ? patch.inspectorName.trim() || existing.inspectorName : existing.inspectorName,
    visitDate: patch.visitDate ?? existing.visitDate,
    notes: patch.notes !== undefined ? trimOptional(patch.notes) : existing.notes,
    updatedAt: nowIso()
  };

  return putInStore('visits', updated);
}

export async function getTasks(projectId: string, visitId?: string): Promise<TaskItem[]> {
  return (await getAllFromStore('tasks'))
    .filter((task) => task.projectId === projectId && (!visitId || task.visitId === visitId || task.scope === 'project'))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function createTask(input: NewTaskInput): Promise<TaskItem> {
  const validation = validateTaskInput(input);
  if (!validation.valid) {
    throw new Error(validation.errors[0]);
  }

  const now = nowIso();
  const task: TaskItem = {
    id: newId('task'),
    projectId: input.projectId,
    visitId: input.visitId,
    scope: input.scope ?? 'visit',
    title: input.title.trim(),
    description: trimOptional(input.description),
    status: 'todo',
    category: trimOptional(input.category),
    createdAt: now,
    updatedAt: now
  };

  return putInStore('tasks', task);
}

export async function seedVisitTasks(projectId: string, visitId: string): Promise<TaskItem[]> {
  const existing = await getTasks(projectId, visitId);
  if (existing.some((task) => task.visitId === visitId)) {
    return existing.filter((task) => task.visitId === visitId);
  }

  const now = nowIso();
  const tasks: TaskItem[] = DEFAULT_TASK_TEMPLATES.map((title) => ({
    id: newId('task'),
    projectId,
    visitId,
    scope: 'visit',
    title,
    status: 'todo',
    category: 'בדיקת אתר',
    createdAt: now,
    updatedAt: now
  }));

  return putManyInStore('tasks', tasks);
}

export async function updateTask(taskId: string, patch: Partial<TaskItem>): Promise<TaskItem> {
  const existing = await getFromStore('tasks', taskId);
  if (!existing) {
    throw new Error('המשימה לא נמצאה.');
  }

  const now = nowIso();
  const status = patch.status ?? existing.status;
  const updated: TaskItem = {
    ...existing,
    ...patch,
    title: patch.title !== undefined ? patch.title.trim() || existing.title : existing.title,
    completedAt: status === 'done' ? patch.completedAt ?? existing.completedAt ?? now : undefined,
    completedVisitId:
      status === 'done' ? patch.completedVisitId ?? existing.completedVisitId ?? existing.visitId : undefined,
    status,
    updatedAt: now
  };

  return putInStore('tasks', updated);
}

export async function deleteTask(taskId: string): Promise<void> {
  await deleteFromStore('tasks', taskId);
}

export async function getDefects(projectId: string): Promise<Defect[]> {
  return (await getAllFromStore('defects'))
    .filter((defect) => defect.projectId === projectId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getDefect(defectId: string): Promise<Defect | undefined> {
  return getFromStore('defects', defectId);
}

export async function createDefect(input: NewDefectInput): Promise<Defect> {
  const validation = validateDefectInput(input);
  if (!validation.valid) {
    throw new Error(validation.errors[0]);
  }

  const now = nowIso();
  const defectId = newId('defect');
  const status = input.status ?? 'open';
  const defect: Defect = {
    id: defectId,
    projectId: input.projectId,
    firstSeenVisitId: input.firstSeenVisitId,
    lastUpdatedVisitId: input.firstSeenVisitId,
    title: input.title.trim(),
    description: trimOptional(input.description),
    location: trimOptional(input.location),
    trade: trimOptional(input.trade),
    severity: input.severity ?? 'medium',
    status,
    statusUpdatedAt: now,
    responsibleParty: trimOptional(input.responsibleParty),
    dueDate: trimOptional(input.dueDate),
    doneAt: status === 'done' ? now : undefined,
    doneVisitId: status === 'done' ? input.firstSeenVisitId : undefined,
    photos: (input.photos ?? []).map((photo) => buildPhotoAttachment(photo, defectId)),
    statusHistory: [
      {
        id: newId('status-change'),
        projectId: input.projectId,
        defectId,
        visitId: input.firstSeenVisitId,
        toStatus: status,
        changedAt: now
      }
    ],
    createdAt: now,
    updatedAt: now
  };

  return putInStore('defects', defect);
}

export async function updateDefect(
  defectId: string,
  patch: Partial<Omit<Defect, 'id' | 'projectId' | 'firstSeenVisitId' | 'createdAt' | 'statusHistory'>>
): Promise<Defect> {
  const existing = await getDefect(defectId);
  if (!existing) {
    throw new Error('הליקוי לא נמצא.');
  }

  const validation = validateDefectInput({ title: patch.title ?? existing.title });
  if (!validation.valid) {
    throw new Error(validation.errors[0]);
  }

  const now = nowIso();
  const updated: Defect = {
    ...existing,
    ...patch,
    title: patch.title !== undefined ? patch.title.trim() : existing.title,
    description: patch.description !== undefined ? trimOptional(patch.description) : existing.description,
    location: patch.location !== undefined ? trimOptional(patch.location) : existing.location,
    trade: patch.trade !== undefined ? trimOptional(patch.trade) : existing.trade,
    responsibleParty:
      patch.responsibleParty !== undefined ? trimOptional(patch.responsibleParty) : existing.responsibleParty,
    dueDate: patch.dueDate !== undefined ? trimOptional(patch.dueDate) : existing.dueDate,
    photos:
      patch.photos?.map((photo) => ({
        ...photo,
        defectId
      })) ?? existing.photos,
    updatedAt: now
  };

  return putInStore('defects', updated);
}

export async function updateDefectStatus(params: {
  defectId: string;
  status: DefectStatus;
  visitId?: string;
  note?: string;
}): Promise<Defect> {
  const existing = await getDefect(params.defectId);
  if (!existing) {
    throw new Error('הליקוי לא נמצא.');
  }

  const updated = changeDefectStatus(existing, params.status, {
    visitId: params.visitId,
    note: params.note
  });

  return putInStore('defects', updated);
}

export async function deleteDefect(defectId: string): Promise<void> {
  await deleteFromStore('defects', defectId);
}

export async function getActiveProjectDefects(projectId: string): Promise<Defect[]> {
  return getActiveDefects(await getDefects(projectId), projectId);
}

export async function getAllProjectDefects(projectId: string): Promise<Defect[]> {
  return getAllDefects(await getDefects(projectId), projectId);
}

export async function getProjectDefectsFirstSeenInVisit(visitId: string): Promise<Defect[]> {
  return getDefectsFirstSeenInVisit(await getAllFromStore('defects'), visitId);
}

export async function getProjectDefectsUpdatedInVisit(visitId: string): Promise<Defect[]> {
  return getDefectsUpdatedInVisit(await getAllFromStore('defects'), visitId);
}

export async function getProjectDefectsMarkedDoneInVisit(visitId: string): Promise<Defect[]> {
  return getDefectsMarkedDoneInVisit(await getAllFromStore('defects'), visitId);
}
