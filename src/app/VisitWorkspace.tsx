import { DefectForm } from '../components/defects/DefectForm';
import { DefectList } from '../components/defects/DefectList';
import { TaskList } from '../components/tasks/TaskList';
import type { Defect, DefectFilter, DefectStatus, InspectionVisit, Project, ProjectSummary, TaskItem } from '../domain/types';
import { formatHebrewDate } from '../utils/dates';
import type { useInspectionWorkspace } from './useInspectionWorkspace';

type WorkspaceActions = Pick<
  ReturnType<typeof useInspectionWorkspace>,
  | 'setFilter'
  | 'setShowDefectForm'
  | 'openReportPreview'
  | 'handleUpdateVisit'
  | 'handleAddTask'
  | 'handleUpdateTask'
  | 'handleDeleteTask'
  | 'handleSeedTasks'
  | 'handleSaveDefect'
  | 'handleDeleteDefect'
  | 'handleChangeStatus'
>;

type VisitWorkspaceProps = WorkspaceActions & {
  currentProject?: Project;
  currentVisit?: InspectionVisit;
  tasks: TaskItem[];
  defects: Defect[];
  filteredDefects: Defect[];
  filter: DefectFilter;
  summary: ProjectSummary;
  showDefectForm: boolean;
  canGenerateReport: boolean;
};

export function VisitWorkspace({
  currentProject,
  currentVisit,
  tasks,
  defects,
  filteredDefects,
  filter,
  summary,
  showDefectForm,
  canGenerateReport,
  setFilter,
  setShowDefectForm,
  openReportPreview,
  handleUpdateVisit,
  handleAddTask,
  handleUpdateTask,
  handleDeleteTask,
  handleSeedTasks,
  handleSaveDefect,
  handleDeleteDefect,
  handleChangeStatus
}: VisitWorkspaceProps): JSX.Element {
  return (
    <section className="screen visit-workspace" aria-labelledby="workspace-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{currentProject?.name ?? 'פרויקט'}</p>
          <h1 id="workspace-title">ביקור עבודה</h1>
        </div>
        <div className="header-actions">
          <button className="primary-button" onClick={() => setShowDefectForm((current) => !current)}>
            הוסף ליקוי
          </button>
          <button className="secondary-button" onClick={() => void openReportPreview()} disabled={!canGenerateReport}>
            הפקת דוח ביקור
          </button>
        </div>
      </div>

      {currentVisit && (
        <div className="visit-details compact-visit-details" key={currentVisit.id}>
          <span>בודק: {currentVisit.inspectorName}</span>
          <span>תאריך ביקור: {formatHebrewDate(currentVisit.visitDate)}</span>
          <details>
            <summary>עריכת פרטי ביקור</summary>
            <div className="compact-visit-edit">
              <label className="field compact-field">
                <span>בודק</span>
                <input
                  defaultValue={currentVisit.inspectorName}
                  onBlur={(event) => void handleUpdateVisit({ inspectorName: event.target.value })}
                />
              </label>
              <label className="field compact-field">
                <span>תאריך ביקור</span>
                <input
                  type="date"
                  defaultValue={currentVisit.visitDate}
                  onBlur={(event) => void handleUpdateVisit({ visitDate: event.target.value })}
                />
              </label>
            </div>
          </details>
        </div>
      )}

      <div className="summary-grid sticky-summary">
        <article className="summary-card">
          <span>ליקויים פתוחים</span>
          <strong data-testid="active-defects-count">{summary.activeDefects}</strong>
        </article>
        <article className="summary-card">
          <span>ליקויים חדשים בביקור</span>
          <strong data-testid="new-defects-count">{summary.newDefectsThisVisit}</strong>
        </article>
        <article className="summary-card">
          <span>טופלו בביקור</span>
          <strong data-testid="done-this-visit-count">{summary.doneThisVisit}</strong>
        </article>
        <article className="summary-card">
          <span>סה״כ ליקויים בפרויקט</span>
          <strong data-testid="total-defects-count">{summary.totalProjectDefects}</strong>
        </article>
      </div>

      {showDefectForm && (
        <section className="workspace-section quick-defect-section" aria-label="הוספת ליקוי">
          <DefectForm onSave={handleSaveDefect} onCancel={() => setShowDefectForm(false)} />
        </section>
      )}

      <div className="visit-workspace-grid">
        <DefectList
          defects={filteredDefects}
          currentVisit={currentVisit}
          filter={{ ...filter, visitId: currentVisit?.id }}
          onFilterChange={setFilter}
          onSaveDefect={handleSaveDefect}
          onDeleteDefect={handleDeleteDefect}
          onChangeStatus={(defect: Defect, status: DefectStatus, note?: string) =>
            handleChangeStatus(defect, status, note)
          }
        />

        <TaskList
          tasks={tasks}
          onAddTask={handleAddTask}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          onSeedTasks={handleSeedTasks}
        />
      </div>
    </section>
  );
}
