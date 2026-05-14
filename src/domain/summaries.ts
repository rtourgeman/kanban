import { isActiveDefectStatus } from './status';
import type { Defect, ProjectSummary, TaskItem } from './types';

export function getActiveDefects(defects: Defect[], projectId?: string): Defect[] {
  return defects.filter(
    (defect) => (!projectId || defect.projectId === projectId) && isActiveDefectStatus(defect.status)
  );
}

export function getAllDefects(defects: Defect[], projectId?: string): Defect[] {
  return defects.filter((defect) => !projectId || defect.projectId === projectId);
}

export function getDefectsFirstSeenInVisit(defects: Defect[], visitId: string): Defect[] {
  return defects.filter((defect) => defect.firstSeenVisitId === visitId);
}

export function getDefectsUpdatedInVisit(defects: Defect[], visitId: string): Defect[] {
  return defects.filter(
    (defect) =>
      defect.lastUpdatedVisitId === visitId ||
      defect.statusHistory.some((statusChange) => statusChange.visitId === visitId)
  );
}

export function getDefectsMarkedDoneInVisit(defects: Defect[], visitId: string): Defect[] {
  return defects.filter(
    (defect) =>
      defect.doneVisitId === visitId ||
      defect.statusHistory.some(
        (statusChange) => statusChange.visitId === visitId && statusChange.toStatus === 'done'
      )
  );
}

export function getCarriedOverActiveDefects(
  defects: Defect[],
  projectId: string,
  visitId: string
): Defect[] {
  return defects.filter(
    (defect) =>
      defect.projectId === projectId &&
      defect.firstSeenVisitId !== visitId &&
      isActiveDefectStatus(defect.status)
  );
}

export function getTaskSummary(tasks: TaskItem[]): Pick<ProjectSummary, 'totalTasks' | 'completedTasks'> {
  return {
    totalTasks: tasks.length,
    completedTasks: tasks.filter((task) => task.status === 'done').length
  };
}

export function calculateProjectSummary(
  tasks: TaskItem[],
  defects: Defect[],
  visitId?: string
): ProjectSummary {
  const taskSummary = getTaskSummary(tasks);

  return {
    ...taskSummary,
    activeDefects: getActiveDefects(defects).length,
    newDefectsThisVisit: visitId ? getDefectsFirstSeenInVisit(defects, visitId).length : 0,
    doneThisVisit: visitId ? getDefectsMarkedDoneInVisit(defects, visitId).length : 0,
    totalProjectDefects: defects.length,
    closedOrVerified: defects.filter((defect) => defect.status === 'closed' || defect.status === 'verified')
      .length
  };
}
