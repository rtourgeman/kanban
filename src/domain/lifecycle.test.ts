import { describe, expect, it } from 'vitest';
import { filterDefects } from './filters';
import { changeDefectStatus } from './status';
import {
  calculateProjectSummary,
  getActiveDefects,
  getCarriedOverActiveDefects,
  getDefectsMarkedDoneInVisit,
  getTaskSummary
} from './summaries';
import { validateDefectInput } from './validation';
import { makeDefect, makeTask } from '../test/factories';

describe('defect lifecycle rules', () => {
  it('validates that title-only defects are allowed but blank titles are rejected', () => {
    expect(validateDefectInput({ title: 'רטיבות בתקרה' })).toEqual({ valid: true, errors: [] });
    expect(validateDefectInput({ title: '   ' }).valid).toBe(false);
  });

  it('marks a defect as done with visit metadata and status history', () => {
    const done = changeDefectStatus(makeDefect(), 'done', {
      visitId: 'visit-2',
      changedAt: '2026-05-21T09:00:00.000Z',
      idFactory: () => 'status-2'
    });

    expect(done.status).toBe('done');
    expect(done.doneAt).toBe('2026-05-21T09:00:00.000Z');
    expect(done.doneVisitId).toBe('visit-2');
    expect(done.lastUpdatedVisitId).toBe('visit-2');
    expect(done.statusHistory).toContainEqual(
      expect.objectContaining({
        id: 'status-2',
        fromStatus: 'open',
        toStatus: 'done',
        visitId: 'visit-2'
      })
    );
  });

  it('carries active project defects into later visits and keeps done items in history', () => {
    const visitOneDefects = Array.from({ length: 5 }, (_, index) =>
      makeDefect({
        id: `defect-${index + 1}`,
        title: `ליקוי ${index + 1}`,
        firstSeenVisitId: 'visit-1'
      })
    );

    expect(getCarriedOverActiveDefects(visitOneDefects, 'project-1', 'visit-2')).toHaveLength(5);

    const visitTwoDefects = visitOneDefects.map((defect, index) =>
      index < 2
        ? changeDefectStatus(defect, 'done', {
            visitId: 'visit-2',
            changedAt: `2026-05-21T09:0${index}:00.000Z`,
            idFactory: () => `done-${index}`
          })
        : defect
    );

    expect(getActiveDefects(visitTwoDefects, 'project-1')).toHaveLength(3);
    expect(visitTwoDefects).toHaveLength(5);
    expect(getDefectsMarkedDoneInVisit(visitTwoDefects, 'visit-2')).toHaveLength(2);
  });
});

describe('summaries and filters', () => {
  it('calculates task and project summary counts', () => {
    const tasks = [
      makeTask({ id: 'task-1', status: 'done' }),
      makeTask({ id: 'task-2', status: 'todo' })
    ];
    const defects = [
      makeDefect({ id: 'defect-1', status: 'open' }),
      makeDefect({ id: 'defect-2', status: 'in_progress' }),
      makeDefect({ id: 'defect-3', status: 'verified' })
    ];

    expect(getTaskSummary(tasks)).toEqual({ totalTasks: 2, completedTasks: 1 });
    expect(calculateProjectSummary(tasks, defects, 'visit-1')).toMatchObject({
      totalTasks: 2,
      completedTasks: 1,
      activeDefects: 2,
      totalProjectDefects: 3,
      closedOrVerified: 1
    });
  });

  it('filters active work separately from done and history lists', () => {
    const doneThisVisit = changeDefectStatus(makeDefect({ id: 'defect-2', title: 'טופל' }), 'done', {
      visitId: 'visit-2',
      changedAt: '2026-05-21T09:00:00.000Z',
      idFactory: () => 'done-change'
    });
    const defects = [
      makeDefect({ id: 'defect-1', title: 'פתוח', status: 'open', severity: 'critical' }),
      doneThisVisit,
      makeDefect({ id: 'defect-3', title: 'אומת', status: 'verified' })
    ];

    expect(filterDefects(defects, { mode: 'active' })).toHaveLength(1);
    expect(filterDefects(defects, { mode: 'done_this_visit', visitId: 'visit-2' })).toEqual([doneThisVisit]);
    expect(filterDefects(defects, { mode: 'history' })).toHaveLength(2);
    expect(filterDefects(defects, { mode: 'high_critical' })).toHaveLength(1);
  });
});
