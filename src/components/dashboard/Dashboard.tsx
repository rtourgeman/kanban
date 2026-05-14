import { useEffect, useState } from 'react';
import { calculateProjectSummary } from '../../domain/summaries';
import type { Defect, InspectionVisit, Project, TaskItem } from '../../domain/types';
import { formatHebrewDate, todayInputValue } from '../../utils/dates';

type DashboardProps = {
  projects: Project[];
  currentProject?: Project;
  currentVisit?: InspectionVisit;
  tasks: TaskItem[];
  defects: Defect[];
  onSelectProject: (projectId: string) => void;
  onCreateProjectAndVisit: (input: {
    name: string;
    address?: string;
    clientName?: string;
    inspectorName: string;
    visitDate: string;
  }) => Promise<void>;
  onUpdateProject: (input: { name: string; address?: string; clientName?: string }) => Promise<void>;
  onContinueVisit: () => Promise<void>;
  onNewVisit: (input: { inspectorName: string; visitDate: string }) => Promise<void>;
  onOpenReport: () => void;
  onOpenWorkspace: () => void;
};

export function Dashboard({
  projects,
  currentProject,
  currentVisit,
  tasks,
  defects,
  onSelectProject,
  onCreateProjectAndVisit,
  onUpdateProject,
  onContinueVisit,
  onNewVisit,
  onOpenReport,
  onOpenWorkspace
}: DashboardProps): JSX.Element {
  const [name, setName] = useState(currentProject?.name ?? '');
  const [address, setAddress] = useState(currentProject?.address ?? '');
  const [clientName, setClientName] = useState(currentProject?.clientName ?? '');
  const [inspectorName, setInspectorName] = useState(currentVisit?.inspectorName ?? '');
  const [visitDate, setVisitDate] = useState(currentVisit?.visitDate ?? todayInputValue());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setName(currentProject?.name ?? '');
    setAddress(currentProject?.address ?? '');
    setClientName(currentProject?.clientName ?? '');
    setInspectorName(currentVisit?.inspectorName ?? inspectorName);
    setVisitDate(currentVisit?.visitDate ?? todayInputValue());
  }, [currentProject, currentVisit]);

  const summary = calculateProjectSummary(tasks, defects, currentVisit?.id);

  async function handleCreateOrUpdate(): Promise<void> {
    setError('');
    if (!name.trim()) {
      setError('חובה להזין שם פרויקט.');
      return;
    }

    setSaving(true);
    try {
      if (currentProject) {
        await onUpdateProject({ name, address, clientName });
      } else {
        await onCreateProjectAndVisit({
          name,
          address,
          clientName,
          inspectorName,
          visitDate
        });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleNewVisit(): Promise<void> {
    setSaving(true);
    try {
      await onNewVisit({ inspectorName, visitDate });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="screen dashboard" aria-labelledby="dashboard-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">לוח בקרה</p>
          <h1 id="dashboard-title">בקרת ליקויי בניה</h1>
        </div>
        <button className="secondary-button" onClick={onOpenWorkspace} disabled={!currentProject || !currentVisit}>
          מעבר לביקור
        </button>
      </div>

      {projects.length > 1 && (
        <label className="field">
          <span>בחירת פרויקט</span>
          <select value={currentProject?.id ?? ''} onChange={(event) => onSelectProject(event.target.value)}>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="summary-grid" aria-label="סיכום פרויקט">
        <article className="summary-card">
          <span>משימות שבוצעו</span>
          <strong>
            {summary.completedTasks}/{summary.totalTasks}
          </strong>
        </article>
        <article className="summary-card">
          <span>ליקויים פעילים</span>
          <strong>{summary.activeDefects}</strong>
        </article>
        <article className="summary-card">
          <span>ליקויים שטופלו בביקור</span>
          <strong>{summary.doneThisVisit}</strong>
        </article>
        <article className="summary-card">
          <span>סה״כ ליקויים בפרויקט</span>
          <strong>{summary.totalProjectDefects}</strong>
        </article>
      </div>

      <form className="form-grid" onSubmit={(event) => event.preventDefault()}>
        <label className="field">
          <span>שם הפרויקט</span>
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="לדוגמה: מגדל הכרמל" />
        </label>
        <label className="field">
          <span>אתר / כתובת</span>
          <input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="רחוב, עיר, קומה" />
        </label>
        <label className="field">
          <span>לקוח</span>
          <input value={clientName} onChange={(event) => setClientName(event.target.value)} placeholder="אופציונלי" />
        </label>
        <label className="field">
          <span>שם בודק</span>
          <input
            value={inspectorName}
            onChange={(event) => setInspectorName(event.target.value)}
            placeholder="שם המהנדס/ית"
          />
        </label>
        <label className="field">
          <span>תאריך ביקור</span>
          <input type="date" value={visitDate} onChange={(event) => setVisitDate(event.target.value)} />
        </label>
      </form>

      {error && <p className="form-error">{error}</p>}

      <div className="action-row dashboard-actions">
        <button className="primary-button" onClick={handleCreateOrUpdate} disabled={saving}>
          {currentProject ? 'שמור פרויקט' : 'שמור והתחל ביקור'}
        </button>
        <button className="secondary-button" onClick={onContinueVisit} disabled={!currentProject || saving}>
          המשך ביקור
        </button>
        <button className="secondary-button" onClick={handleNewVisit} disabled={!currentProject || saving}>
          ביקור חדש
        </button>
        <button className="secondary-button" onClick={onOpenReport} disabled={!currentProject || !currentVisit}>
          הפקת דוח ביקור
        </button>
      </div>

      <div className="context-strip">
        <span>ביקור אחרון: {formatHebrewDate(currentVisit?.visitDate)}</span>
        <span>בודק: {currentVisit?.inspectorName || 'לא צוין'}</span>
        <span>אתר: {currentProject?.address || 'לא צוין'}</span>
      </div>
    </section>
  );
}
