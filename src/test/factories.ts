import type { Defect, InspectionVisit, Project, TaskItem } from '../domain/types';

export function makeProject(patch: Partial<Project> = {}): Project {
  return {
    id: 'project-1',
    name: 'פרויקט בדיקה',
    address: 'רחוב האתר 1',
    createdAt: '2026-05-01T08:00:00.000Z',
    updatedAt: '2026-05-01T08:00:00.000Z',
    ...patch
  };
}

export function makeVisit(patch: Partial<InspectionVisit> = {}): InspectionVisit {
  return {
    id: 'visit-1',
    projectId: 'project-1',
    inspectorName: 'דנה',
    visitDate: '2026-05-14',
    createdAt: '2026-05-14T08:00:00.000Z',
    updatedAt: '2026-05-14T08:00:00.000Z',
    ...patch
  };
}

export function makeTask(patch: Partial<TaskItem> = {}): TaskItem {
  return {
    id: `task-${patch.title ?? '1'}`,
    projectId: 'project-1',
    visitId: 'visit-1',
    scope: 'visit',
    title: 'בדיקת איטום',
    status: 'todo',
    createdAt: '2026-05-14T08:00:00.000Z',
    updatedAt: '2026-05-14T08:00:00.000Z',
    ...patch
  };
}

export function makeDefect(patch: Partial<Defect> = {}): Defect {
  const id = patch.id ?? 'defect-1';
  return {
    id,
    projectId: 'project-1',
    firstSeenVisitId: 'visit-1',
    lastUpdatedVisitId: 'visit-1',
    title: 'סדק בקיר',
    severity: 'medium',
    status: 'open',
    statusUpdatedAt: '2026-05-14T08:00:00.000Z',
    photos: [],
    statusHistory: [
      {
        id: `${id}-status-1`,
        projectId: 'project-1',
        defectId: id,
        visitId: 'visit-1',
        toStatus: 'open',
        changedAt: '2026-05-14T08:00:00.000Z'
      }
    ],
    createdAt: '2026-05-14T08:00:00.000Z',
    updatedAt: '2026-05-14T08:00:00.000Z',
    ...patch
  };
}
