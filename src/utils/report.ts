import {
  calculateProjectSummary,
  getActiveDefects,
  getCarriedOverActiveDefects,
  getDefectsFirstSeenInVisit,
  getDefectsMarkedDoneInVisit
} from '../domain/summaries';
import type { Defect, InspectionVisit, Project, TaskItem, VisitReportData } from '../domain/types';
import { nowIso } from './dates';

export function buildVisitReportData(params: {
  project: Project;
  visit: InspectionVisit;
  visits?: InspectionVisit[];
  tasks: TaskItem[];
  defects: Defect[];
  generatedAt?: string;
}): VisitReportData {
  const { project, visit, tasks, defects } = params;
  const projectDefects = defects.filter((defect) => defect.projectId === project.id);
  const visitTasks = tasks.filter(
    (task) => task.projectId === project.id && (!task.visitId || task.visitId === visit.id)
  );

  return {
    project,
    visit,
    visits: params.visits?.length ? params.visits : [visit],
    generatedAt: params.generatedAt ?? nowIso(),
    counts: calculateProjectSummary(visitTasks, projectDefects, visit.id),
    tasks: visitTasks,
    newDefects: getDefectsFirstSeenInVisit(projectDefects, visit.id),
    carriedOverActiveDefects: getCarriedOverActiveDefects(projectDefects, project.id, visit.id),
    doneThisVisit: getDefectsMarkedDoneInVisit(projectDefects, visit.id),
    stillOpenDefects: getActiveDefects(projectDefects)
  };
}

export function exportReportAsJson(report: VisitReportData): string {
  return JSON.stringify(report, null, 2);
}
