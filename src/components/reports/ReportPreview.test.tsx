import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { makeDefect, makeProject, makeTask, makeVisit } from '../../test/factories';
import { buildVisitReportData } from '../../utils/report';
import { ReportPreview } from './ReportPreview';

describe('ReportPreview', () => {
  it('renders report counts and defect titles', () => {
    const report = buildVisitReportData({
      project: makeProject({ name: 'פרויקט הצפון' }),
      visit: makeVisit(),
      tasks: [makeTask({ status: 'done' })],
      defects: [makeDefect({ title: 'רטיבות במרפסת' })],
      generatedAt: '2026-05-14T10:00:00.000Z'
    });

    render(<ReportPreview report={report} onBack={() => undefined} />);

    expect(screen.getByRole('heading', { name: 'פרויקט הצפון' })).toBeInTheDocument();
    expect(screen.getByText('רטיבות במרפסת')).toBeInTheDocument();
    expect(screen.getByText('חדשים בביקור')).toBeInTheDocument();
  });
});
