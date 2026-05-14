import { Dashboard } from '../components/dashboard/Dashboard';
import { OfflineIndicator } from '../components/common/OfflineIndicator';
import { ReportPreview } from '../components/reports/ReportPreview';
import { useInspectionWorkspace } from './useInspectionWorkspace';
import { VisitWorkspace } from './VisitWorkspace';

export function App(): JSX.Element {
  const workspace = useInspectionWorkspace();

  if (workspace.loading) {
    return (
      <main className="app-shell">
        <p className="loading-state">טוען נתונים מקומיים...</p>
      </main>
    );
  }

  if (workspace.view === 'report' && workspace.report) {
    return (
      <main className="app-shell report-mode" dir="rtl">
        <ReportPreview report={workspace.report} onBack={() => workspace.setView('visit')} />
      </main>
    );
  }

  return (
    <main className="app-shell" dir="rtl">
      <header className="app-header no-print">
        <div>
          <span className="app-mark" aria-hidden="true">
            ✓
          </span>
          <span>ליקויי בניה</span>
        </div>
        <OfflineIndicator />
      </header>

      {workspace.error && (
        <div className="error-banner" role="alert">
          {workspace.error}
        </div>
      )}

      <nav className="tab-bar no-print" aria-label="ניווט ראשי">
        <button className={workspace.view === 'dashboard' ? 'active' : ''} onClick={() => workspace.setView('dashboard')}>
          לוח בקרה
        </button>
        <button
          className={workspace.view === 'visit' ? 'active' : ''}
          onClick={() => workspace.setView('visit')}
          disabled={!workspace.currentProject || !workspace.currentVisit}
        >
          ביקור
        </button>
      </nav>

      {workspace.view === 'dashboard' && (
        <Dashboard
          projects={workspace.projects}
          currentProject={workspace.currentProject}
          currentVisit={workspace.currentVisit}
          tasks={workspace.tasks}
          defects={workspace.defects}
          onSelectProject={(projectId) => void workspace.handleSelectProject(projectId)}
          onCreateProjectAndVisit={workspace.handleCreateProjectAndVisit}
          onUpdateProject={workspace.handleUpdateProject}
          onContinueVisit={workspace.handleContinueVisit}
          onNewVisit={workspace.handleNewVisit}
          onOpenReport={() => void workspace.openReportPreview()}
          onOpenWorkspace={() => workspace.setView('visit')}
        />
      )}

      {workspace.view === 'visit' && (
        <VisitWorkspace
          currentProject={workspace.currentProject}
          currentVisit={workspace.currentVisit}
          tasks={workspace.tasks}
          defects={workspace.defects}
          filteredDefects={workspace.filteredDefects}
          filter={workspace.filter}
          summary={workspace.summary}
          showDefectForm={workspace.showDefectForm}
          canGenerateReport={workspace.canGenerateReport}
          setFilter={workspace.setFilter}
          setShowDefectForm={workspace.setShowDefectForm}
          openReportPreview={workspace.openReportPreview}
          handleUpdateVisit={workspace.handleUpdateVisit}
          handleAddTask={workspace.handleAddTask}
          handleUpdateTask={workspace.handleUpdateTask}
          handleDeleteTask={workspace.handleDeleteTask}
          handleSeedTasks={workspace.handleSeedTasks}
          handleSaveDefect={workspace.handleSaveDefect}
          handleDeleteDefect={workspace.handleDeleteDefect}
          handleChangeStatus={workspace.handleChangeStatus}
        />
      )}
    </main>
  );
}
