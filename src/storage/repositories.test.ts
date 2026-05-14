import { beforeEach, describe, expect, it } from 'vitest';
import { clearKanbanDbForTests } from './db';
import {
  createDefect,
  createProject,
  createVisit,
  getActiveProjectDefects,
  getAllProjectDefects,
  updateDefect,
  updateDefectStatus
} from './repositories';

describe('repository lifecycle helpers', () => {
  beforeEach(async () => {
    await clearKanbanDbForTests();
  });

  it('keeps active defects visible for a later visit and preserves project history', async () => {
    const project = await createProject({ name: 'אתר בדיקה' });
    const visitOne = await createVisit({
      projectId: project.id,
      inspectorName: 'דנה',
      visitDate: '2026-05-14'
    });

    const first = await createDefect({
      projectId: project.id,
      firstSeenVisitId: visitOne.id,
      title: 'ליקוי ראשון'
    });
    const second = await createDefect({
      projectId: project.id,
      firstSeenVisitId: visitOne.id,
      title: 'ליקוי שני'
    });

    const visitTwo = await createVisit({
      projectId: project.id,
      inspectorName: 'דנה',
      visitDate: '2026-05-21'
    });

    expect(await getActiveProjectDefects(project.id)).toHaveLength(2);

    await updateDefectStatus({ defectId: first.id, status: 'done', visitId: visitTwo.id });
    const active = await getActiveProjectDefects(project.id);
    const history = await getAllProjectDefects(project.id);

    expect(active.map((defect) => defect.id)).toEqual([second.id]);
    expect(history).toHaveLength(2);
    expect(history.find((defect) => defect.id === first.id)?.doneVisitId).toBe(visitTwo.id);
  });

  it('updates defect fields without changing status history by accident', async () => {
    const project = await createProject({ name: 'אתר בדיקה' });
    const visit = await createVisit({
      projectId: project.id,
      inspectorName: 'דנה',
      visitDate: '2026-05-14'
    });
    const defect = await createDefect({
      projectId: project.id,
      firstSeenVisitId: visit.id,
      title: 'סדק'
    });

    const updated = await updateDefect(defect.id, {
      title: 'סדק בקיר מערבי',
      severity: 'high'
    });

    expect(updated.status).toBe('open');
    expect(updated.statusHistory).toHaveLength(defect.statusHistory.length);
    expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(defect.updatedAt).getTime());
  });
});
