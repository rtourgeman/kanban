import { describe, expect, it } from 'vitest';
import { changeDefectStatus } from '../domain/status';
import { makeDefect, makeProject, makeTask, makeVisit } from '../test/factories';
import { buildVisitReportData } from './report';

describe('buildVisitReportData', () => {
  it('maps new, carried-over, done-this-visit, and still-open sections', () => {
    const project = makeProject();
    const visit = makeVisit({ id: 'visit-2', visitDate: '2026-05-21' });
    const carriedOpen = makeDefect({
      id: 'defect-carried',
      title: 'פתוח מקודם',
      firstSeenVisitId: 'visit-1'
    });
    const newDefect = makeDefect({
      id: 'defect-new',
      title: 'חדש בביקור',
      firstSeenVisitId: 'visit-2'
    });
    const doneThisVisit = changeDefectStatus(
      makeDefect({ id: 'defect-done', title: 'טופל עכשיו', firstSeenVisitId: 'visit-1' }),
      'done',
      {
        visitId: 'visit-2',
        changedAt: '2026-05-21T10:00:00.000Z',
        idFactory: () => 'done-change'
      }
    );

    const report = buildVisitReportData({
      project,
      visit,
      tasks: [makeTask({ id: 'task-1', visitId: 'visit-2', status: 'done' })],
      defects: [carriedOpen, newDefect, doneThisVisit],
      generatedAt: '2026-05-21T11:00:00.000Z'
    });

    expect(report.tasks).toHaveLength(1);
    expect(report.newDefects.map((defect) => defect.title)).toEqual(['חדש בביקור']);
    expect(report.carriedOverActiveDefects.map((defect) => defect.title)).toEqual(['פתוח מקודם']);
    expect(report.doneThisVisit.map((defect) => defect.title)).toEqual(['טופל עכשיו']);
    expect(report.stillOpenDefects.map((defect) => defect.title)).toEqual(['פתוח מקודם', 'חדש בביקור']);
    expect(report.counts).toMatchObject({
      totalProjectDefects: 3,
      newDefectsThisVisit: 1,
      activeDefects: 2,
      doneThisVisit: 1,
      totalTasks: 1,
      completedTasks: 1
    });
  });
});
