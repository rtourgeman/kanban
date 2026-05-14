import {
  DEFECT_SEVERITY_LABELS,
  DEFECT_STATUS_LABELS
} from '../../domain/defaults';
import type { Defect, InspectionVisit, TaskItem, VisitReportData } from '../../domain/types';
import { formatHebrewDate, formatHebrewDateTime } from '../../utils/dates';
import { exportReportAsJson } from '../../utils/report';

type ReportPreviewProps = {
  report: VisitReportData;
  onBack: () => void;
};

function downloadJson(fileName: string, json: string): void {
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function ReportSection({
  title,
  defects,
  emptyText,
  testId,
  visits
}: {
  title: string;
  defects: Defect[];
  emptyText: string;
  testId: string;
  visits: InspectionVisit[];
}): JSX.Element {
  const visitsById = new Map(visits.map((visit) => [visit.id, visit]));

  return (
    <section className="report-section" data-testid={testId}>
      <h2>{title}</h2>
      {defects.length === 0 ? (
        <p className="empty-state print-friendly">{emptyText}</p>
      ) : (
        <div className="report-defect-list">
          {defects.map((defect, index) => (
            <article className="report-defect-card" key={defect.id}>
              <header>
                <span>#{index + 1}</span>
                <h3>{defect.title}</h3>
              </header>
              <dl>
                <div>
                  <dt>סטטוס</dt>
                  <dd>{DEFECT_STATUS_LABELS[defect.status]}</dd>
                </div>
                <div>
                  <dt>חומרה</dt>
                  <dd>{DEFECT_SEVERITY_LABELS[defect.severity]}</dd>
                </div>
                <div>
                  <dt>מיקום</dt>
                  <dd>{defect.location || 'לא צוין'}</dd>
                </div>
                <div>
                  <dt>אחראי</dt>
                  <dd>{defect.responsibleParty || 'לא צוין'}</dd>
                </div>
                <div>
                  <dt>תאריך יעד</dt>
                  <dd>{formatHebrewDate(defect.dueDate)}</dd>
                </div>
                <div>
                  <dt>עדכון אחרון</dt>
                  <dd>{formatHebrewDateTime(defect.statusUpdatedAt)}</dd>
                </div>
                <div>
                  <dt>זוהה לראשונה</dt>
                  <dd>{formatHebrewDate(visitsById.get(defect.firstSeenVisitId)?.visitDate ?? defect.createdAt)}</dd>
                </div>
                {defect.doneAt && (
                  <div>
                    <dt>טופל בתאריך</dt>
                    <dd>{formatHebrewDateTime(defect.doneAt)}</dd>
                  </div>
                )}
              </dl>
              {defect.description && <p>{defect.description}</p>}
              {defect.photos.length > 0 && (
                <div className="photo-grid compact print-photos">
                  {defect.photos.map((photo) => (
                    <img key={photo.id} src={photo.dataUrl} alt={photo.fileName || defect.title} />
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function TaskSummary({ tasks }: { tasks: TaskItem[] }): JSX.Element {
  return (
    <section className="report-section">
      <h2>סיכום משימות</h2>
      {tasks.length === 0 ? (
        <p className="empty-state print-friendly">לא נרשמו משימות בביקור הזה.</p>
      ) : (
        <ul className="report-task-list">
          {tasks.map((task) => (
            <li key={task.id}>
              <span>{task.title}</span>
              <strong>{task.status === 'done' ? 'בוצע' : 'לביצוע'}</strong>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function ReportPreview({ report, onBack }: ReportPreviewProps): JSX.Element {
  const reportFileName = `report-${report.project.name}-${report.visit.visitDate}.json`.replace(/\s+/g, '-');

  return (
    <section className="screen report-preview" aria-labelledby="report-title">
      <div className="report-toolbar no-print">
        <button className="secondary-button" onClick={onBack}>
          חזרה
        </button>
        <button className="primary-button" onClick={() => window.print()}>
          הדפס / שמור כ־PDF
        </button>
        <button className="secondary-button" onClick={() => downloadJson(reportFileName, exportReportAsJson(report))}>
          יצוא JSON
        </button>
      </div>

      <header className="report-header">
        <p className="eyebrow">דו״ח ביקור</p>
        <h1 id="report-title">{report.project.name}</h1>
        <dl className="report-meta">
          <div>
            <dt>אתר</dt>
            <dd>{report.project.address || 'לא צוין'}</dd>
          </div>
          <div>
            <dt>לקוח</dt>
            <dd>{report.project.clientName || 'לא צוין'}</dd>
          </div>
          <div>
            <dt>בודק</dt>
            <dd>{report.visit.inspectorName}</dd>
          </div>
          <div>
            <dt>תאריך ביקור</dt>
            <dd>{formatHebrewDate(report.visit.visitDate)}</dd>
          </div>
          <div>
            <dt>הופק</dt>
            <dd>{formatHebrewDateTime(report.generatedAt)}</dd>
          </div>
        </dl>
      </header>

      <div className="summary-grid report-summary" aria-label="סיכום דו״ח">
        <article className="summary-card">
          <span>סה״כ ליקויים</span>
          <strong data-testid="report-total-defects">{report.counts.totalProjectDefects}</strong>
        </article>
        <article className="summary-card">
          <span>חדשים בביקור</span>
          <strong data-testid="report-new-defects-count">{report.counts.newDefectsThisVisit}</strong>
        </article>
        <article className="summary-card">
          <span>טופלו בביקור</span>
          <strong data-testid="report-done-this-visit-count">{report.counts.doneThisVisit}</strong>
        </article>
        <article className="summary-card">
          <span>עדיין פתוחים</span>
          <strong data-testid="report-active-defects-count">{report.counts.activeDefects}</strong>
        </article>
      </div>

      <TaskSummary tasks={report.tasks} />

      <ReportSection
        title="ליקויים חדשים בביקור"
        defects={report.newDefects}
        emptyText="לא נרשמו ליקויים חדשים בביקור הזה."
        testId="report-new-defects"
        visits={report.visits}
      />
      <ReportSection
        title="ליקויים פתוחים מביקורים קודמים"
        defects={report.carriedOverActiveDefects}
        emptyText="אין ליקויים פעילים שנמשכו מביקורים קודמים."
        testId="report-carried-over-defects"
        visits={report.visits}
      />
      <ReportSection
        title="ליקויים שטופלו בביקור הזה"
        defects={report.doneThisVisit}
        emptyText="לא סומנו ליקויים כטופלו בביקור הזה."
        testId="report-done-defects"
        visits={report.visits}
      />
      <ReportSection
        title="ליקויים שעדיין פתוחים"
        defects={report.stillOpenDefects}
        emptyText="אין ליקויים פתוחים או בטיפול בזמן הפקת הדו״ח."
        testId="report-still-open-defects"
        visits={report.visits}
      />
    </section>
  );
}
