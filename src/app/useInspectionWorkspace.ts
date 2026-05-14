import { useEffect, useMemo, useState } from 'react';
import type { DefectFormValues } from '../components/defects/DefectForm';
import { filterDefects } from '../domain/filters';
import { calculateProjectSummary } from '../domain/summaries';
import type {
  Defect,
  DefectFilter,
  DefectStatus,
  InspectionVisit,
  Project,
  ReportSnapshot,
  TaskItem
} from '../domain/types';
import { createReportSnapshot } from '../storage/repositories';
import {
  createDefect,
  createProject,
  createTask,
  createVisit,
  deleteDefect,
  deleteTask,
  getDefects,
  getProjects,
  getTasks,
  getVisits,
  seedVisitTasks,
  updateDefect,
  updateDefectStatus,
  updateProject,
  updateTask,
  updateVisit
} from '../storage/repositories';
import { todayInputValue } from '../utils/dates';
import { newId } from '../utils/ids';
import { buildVisitReportData } from '../utils/report';

export type AppView = 'dashboard' | 'visit' | 'report';

const CURRENT_PROJECT_KEY = 'kanban-current-project-id';
const CURRENT_VISIT_KEY = 'kanban-current-visit-id';

function latestVisit(visits: InspectionVisit[]): InspectionVisit | undefined {
  return visits[0];
}

export function useInspectionWorkspace() {
  const [view, setView] = useState<AppView>('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | undefined>();
  const [visits, setVisits] = useState<InspectionVisit[]>([]);
  const [currentVisit, setCurrentVisit] = useState<InspectionVisit | undefined>();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [defects, setDefects] = useState<Defect[]>([]);
  const [filter, setFilter] = useState<DefectFilter>({ mode: 'active' });
  const [showDefectForm, setShowDefectForm] = useState(false);
  const [activeReportSnapshot, setActiveReportSnapshot] = useState<ReportSnapshot | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function refresh(projectId?: string, visitId?: string): Promise<void> {
    setError('');
    const allProjects = await getProjects();
    setProjects(allProjects);

    const storedProjectId = localStorage.getItem(CURRENT_PROJECT_KEY) ?? undefined;
    const selectedProject =
      allProjects.find((project) => project.id === projectId) ??
      allProjects.find((project) => project.id === storedProjectId) ??
      allProjects[0];

    setCurrentProject(selectedProject);

    if (!selectedProject) {
      setVisits([]);
      setCurrentVisit(undefined);
      setTasks([]);
      setDefects([]);
      return;
    }

    localStorage.setItem(CURRENT_PROJECT_KEY, selectedProject.id);

    const projectVisits = await getVisits(selectedProject.id);
    setVisits(projectVisits);

    const storedVisitId = localStorage.getItem(CURRENT_VISIT_KEY) ?? undefined;
    const selectedVisit =
      projectVisits.find((visit) => visit.id === visitId) ??
      projectVisits.find((visit) => visit.id === storedVisitId) ??
      latestVisit(projectVisits);

    setCurrentVisit(selectedVisit);

    if (selectedVisit) {
      localStorage.setItem(CURRENT_VISIT_KEY, selectedVisit.id);
    }

    const [projectTasks, projectDefects] = await Promise.all([
      selectedVisit ? getTasks(selectedProject.id, selectedVisit.id) : getTasks(selectedProject.id),
      getDefects(selectedProject.id)
    ]);

    setTasks(projectTasks);
    setDefects(projectDefects);
    setFilter((current) => ({ ...current, visitId: selectedVisit?.id }));
  }

  useEffect(() => {
    refresh()
      .catch(() => setError('לא ניתן לטעון את הנתונים המקומיים.'))
      .finally(() => setLoading(false));
  }, []);

  const filteredDefects = useMemo(
    () => filterDefects(defects, { ...filter, visitId: currentVisit?.id }),
    [currentVisit?.id, defects, filter]
  );

  const summary = useMemo(
    () => calculateProjectSummary(tasks, defects, currentVisit?.id),
    [tasks, defects, currentVisit?.id]
  );

  async function runAction(action: () => Promise<void>, failureMessage: string): Promise<void> {
    setError('');
    try {
      await action();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : failureMessage);
    }
  }

  async function openReportPreview(): Promise<void> {
    if (!currentProject || !currentVisit) {
      return;
    }

    await runAction(async () => {
      const reportData = buildVisitReportData({
        project: currentProject,
        visit: currentVisit,
        visits,
        tasks,
        defects
      });
      const snapshot = await createReportSnapshot(reportData);
      setActiveReportSnapshot(snapshot);
      setView('report');
    }, 'לא ניתן להפיק דו״ח.');
  }

  async function handleCreateProjectAndVisit(input: {
    name: string;
    address?: string;
    clientName?: string;
    inspectorName: string;
    visitDate: string;
  }): Promise<void> {
    await runAction(async () => {
      const project = await createProject(input);
      const visit = await createVisit({
        projectId: project.id,
        inspectorName: input.inspectorName,
        visitDate: input.visitDate || todayInputValue()
      });
      await seedVisitTasks(project.id, visit.id);
      await refresh(project.id, visit.id);
      setView('visit');
    }, 'לא ניתן ליצור פרויקט.');
  }

  async function handleSelectProject(projectId: string): Promise<void> {
    await runAction(async () => {
      localStorage.setItem(CURRENT_PROJECT_KEY, projectId);
      await refresh(projectId);
    }, 'לא ניתן לעבור לפרויקט.');
  }

  async function handleUpdateProject(input: { name: string; address?: string; clientName?: string }): Promise<void> {
    if (!currentProject) {
      return;
    }

    await runAction(async () => {
      await updateProject(currentProject.id, input);
      await refresh(currentProject.id, currentVisit?.id);
    }, 'לא ניתן לשמור פרויקט.');
  }

  async function handleContinueVisit(): Promise<void> {
    if (!currentProject) {
      return;
    }

    await runAction(async () => {
      let visit = currentVisit ?? latestVisit(visits);
      if (!visit) {
        visit = await createVisit({
          projectId: currentProject.id,
          inspectorName: 'מהנדס האתר',
          visitDate: todayInputValue()
        });
        await seedVisitTasks(currentProject.id, visit.id);
      }

      await refresh(currentProject.id, visit.id);
      setView('visit');
    }, 'לא ניתן לפתוח ביקור.');
  }

  async function handleNewVisit(input: { inspectorName: string; visitDate: string }): Promise<void> {
    if (!currentProject) {
      return;
    }

    await runAction(async () => {
      const visit = await createVisit({
        projectId: currentProject.id,
        inspectorName: input.inspectorName || currentVisit?.inspectorName || 'מהנדס האתר',
        visitDate: input.visitDate || todayInputValue()
      });
      await seedVisitTasks(currentProject.id, visit.id);
      await refresh(currentProject.id, visit.id);
      setFilter({ mode: 'active', visitId: visit.id });
      setView('visit');
    }, 'לא ניתן ליצור ביקור חדש.');
  }

  async function handleUpdateVisit(patch: Partial<InspectionVisit>): Promise<void> {
    if (!currentVisit || !currentProject) {
      return;
    }

    await runAction(async () => {
      await updateVisit(currentVisit.id, {
        projectId: currentProject.id,
        inspectorName: patch.inspectorName ?? currentVisit.inspectorName,
        visitDate: patch.visitDate ?? currentVisit.visitDate,
        notes: patch.notes
      });
      await refresh(currentProject.id, currentVisit.id);
    }, 'לא ניתן לעדכן ביקור.');
  }

  async function handleAddTask(title: string): Promise<void> {
    if (!currentProject || !currentVisit) {
      return;
    }

    await runAction(async () => {
      await createTask({ projectId: currentProject.id, visitId: currentVisit.id, title });
      await refresh(currentProject.id, currentVisit.id);
    }, 'לא ניתן להוסיף משימה.');
  }

  async function handleUpdateTask(taskId: string, patch: Partial<TaskItem>): Promise<void> {
    if (!currentProject) {
      return;
    }

    await runAction(async () => {
      await updateTask(taskId, patch);
      await refresh(currentProject.id, currentVisit?.id);
    }, 'לא ניתן לעדכן משימה.');
  }

  async function handleDeleteTask(taskId: string): Promise<void> {
    if (!currentProject) {
      return;
    }

    await runAction(async () => {
      await deleteTask(taskId);
      await refresh(currentProject.id, currentVisit?.id);
    }, 'לא ניתן למחוק משימה.');
  }

  async function handleSeedTasks(): Promise<void> {
    if (!currentProject || !currentVisit) {
      return;
    }

    await runAction(async () => {
      await seedVisitTasks(currentProject.id, currentVisit.id);
      await refresh(currentProject.id, currentVisit.id);
    }, 'לא ניתן להוסיף תבנית משימות.');
  }

  async function handleSaveDefect(values: DefectFormValues, defect?: Defect): Promise<void> {
    if (!currentProject || !currentVisit) {
      return;
    }

    await runAction(async () => {
      if (defect) {
        await updateDefect(defect.id, {
          title: values.title,
          description: values.description,
          location: values.location,
          trade: values.trade,
          severity: values.severity,
          responsibleParty: values.responsibleParty,
          dueDate: values.dueDate,
          photos: values.photos.map((photo) => ({
            id: photo.id ?? newId('photo'),
            defectId: defect.id,
            dataUrl: photo.dataUrl,
            fileName: photo.fileName,
            mimeType: photo.mimeType,
            width: photo.width,
            height: photo.height,
            createdAt: photo.createdAt ?? new Date().toISOString()
          }))
        });
        if (values.status !== defect.status) {
          await updateDefectStatus({
            defectId: defect.id,
            status: values.status,
            visitId: currentVisit.id
          });
        }
      } else {
        await createDefect({
          projectId: currentProject.id,
          firstSeenVisitId: currentVisit.id,
          title: values.title,
          description: values.description,
          location: values.location,
          trade: values.trade,
          status: values.status,
          severity: values.severity,
          responsibleParty: values.responsibleParty,
          dueDate: values.dueDate,
          photos: values.photos
        });
      }

      await refresh(currentProject.id, currentVisit.id);
      setShowDefectForm(false);
      setFilter({ mode: 'active', visitId: currentVisit.id });
    }, 'לא ניתן לשמור ליקוי.');
  }

  async function handleDeleteDefect(defectId: string): Promise<void> {
    if (!currentProject) {
      return;
    }

    await runAction(async () => {
      await deleteDefect(defectId);
      await refresh(currentProject.id, currentVisit?.id);
    }, 'לא ניתן למחוק ליקוי.');
  }

  async function handleChangeStatus(defect: Defect, status: DefectStatus, note?: string): Promise<void> {
    if (!currentProject) {
      return;
    }

    await runAction(async () => {
      await updateDefectStatus({
        defectId: defect.id,
        status,
        visitId: currentVisit?.id,
        note
      });
      await refresh(currentProject.id, currentVisit?.id);
      if (status === 'done') {
        setFilter({ mode: 'active', visitId: currentVisit?.id });
      }
    }, 'לא ניתן לעדכן סטטוס.');
  }

  return {
    view,
    setView,
    projects,
    currentProject,
    currentVisit,
    tasks,
    defects,
    filter,
    setFilter,
    showDefectForm,
    setShowDefectForm,
    loading,
    error,
    filteredDefects,
    summary,
    report: activeReportSnapshot?.data,
    canGenerateReport: Boolean(currentProject && currentVisit),
    openReportPreview,
    handleCreateProjectAndVisit,
    handleSelectProject,
    handleUpdateProject,
    handleContinueVisit,
    handleNewVisit,
    handleUpdateVisit,
    handleAddTask,
    handleUpdateTask,
    handleDeleteTask,
    handleSeedTasks,
    handleSaveDefect,
    handleDeleteDefect,
    handleChangeStatus
  };
}
