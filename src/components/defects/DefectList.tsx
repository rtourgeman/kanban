import { useState } from 'react';
import {
  DEFECT_FILTER_LABELS,
  DEFECT_SEVERITY_LABELS,
  DEFECT_STATUS_LABELS
} from '../../domain/defaults';
import type {
  Defect,
  DefectFilter,
  DefectFilterMode,
  DefectSeverity,
  DefectStatus,
  InspectionVisit
} from '../../domain/types';
import { formatHebrewDate, formatHebrewDateTime } from '../../utils/dates';
import { DefectForm, type DefectFormValues } from './DefectForm';

type DefectListProps = {
  defects: Defect[];
  allDefectsCount: number;
  currentVisit?: InspectionVisit;
  filter: DefectFilter;
  onFilterChange: (filter: DefectFilter) => void;
  onSaveDefect: (values: DefectFormValues, defect?: Defect) => Promise<void>;
  onDeleteDefect: (defectId: string) => Promise<void>;
  onChangeStatus: (defect: Defect, status: DefectStatus, note?: string) => Promise<void>;
};

const filterModes: DefectFilterMode[] = [
  'active',
  'new_this_visit',
  'done_this_visit',
  'in_progress',
  'high_critical',
  'history',
  'all'
];

export function DefectList({
  defects,
  allDefectsCount,
  currentVisit,
  filter,
  onFilterChange,
  onSaveDefect,
  onDeleteDefect,
  onChangeStatus
}: DefectListProps): JSX.Element {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [statusNote, setStatusNote] = useState<Record<string, string>>({});

  function updateFilter(patch: Partial<DefectFilter>): void {
    onFilterChange({ ...filter, ...patch, visitId: currentVisit?.id });
  }

  return (
    <section className="workspace-section" aria-labelledby="defects-title">
      <div className="section-heading compact">
        <div>
          <p className="eyebrow">ליקויים</p>
          <h2 id="defects-title">רשם ליקויים לפרויקט</h2>
        </div>
        <span className="pill">{allDefectsCount} בהיסטוריה</span>
      </div>

      <div className="filter-panel" aria-label="סינון ליקויים">
        <div className="segmented-control">
          {filterModes.map((mode) => (
            <button
              key={mode}
              className={filter.mode === mode ? 'is-selected' : ''}
              onClick={() => updateFilter({ mode })}
              type="button"
            >
              {DEFECT_FILTER_LABELS[mode]}
            </button>
          ))}
        </div>

        <div className="form-grid filters-grid">
          <label className="field">
            <span>חיפוש</span>
            <input
              value={filter.query ?? ''}
              onChange={(event) => updateFilter({ query: event.target.value })}
              placeholder="כותרת, מיקום או אחראי"
            />
          </label>
          <label className="field">
            <span>חומרה</span>
            <select
              value={filter.severity ?? 'all'}
              onChange={(event) => updateFilter({ severity: event.target.value as DefectSeverity | 'all' })}
            >
              <option value="all">כל החומרות</option>
              {Object.entries(DEFECT_SEVERITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {defects.length === 0 ? (
        <p className="empty-state">
          אין ליקויים להצגה במסנן הזה. ליקויים פתוחים ובטיפול יופיעו אוטומטית גם בביקורים הבאים.
        </p>
      ) : (
        <div className="defect-list" data-testid="defect-list">
          {defects.map((defect, index) => (
            <article className={`defect-card severity-${defect.severity}`} key={defect.id}>
              <div className="defect-card-header">
                <div>
                  <span className="defect-number">#{index + 1}</span>
                  <h3>{defect.title}</h3>
                </div>
                <div className="status-stack">
                  <span className={`status-badge status-${defect.status}`}>{DEFECT_STATUS_LABELS[defect.status]}</span>
                  <span className={`severity-badge severity-${defect.severity}`}>
                    {DEFECT_SEVERITY_LABELS[defect.severity]}
                  </span>
                </div>
              </div>

              {defect.description && <p>{defect.description}</p>}

              <dl className="defect-meta">
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
              </dl>

              {defect.photos.length > 0 && (
                <div className="photo-grid compact" aria-label="תמונות ליקוי">
                  {defect.photos.map((photo) => (
                    <img key={photo.id} src={photo.dataUrl} alt={photo.fileName || defect.title} />
                  ))}
                </div>
              )}

              <div className="status-update-row">
                <label className="field">
                  <span>שינוי סטטוס</span>
                  <select
                    value={defect.status}
                    onChange={(event) => void onChangeStatus(defect, event.target.value as DefectStatus)}
                  >
                    {Object.entries(DEFECT_STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>הערת סטטוס</span>
                  <input
                    value={statusNote[defect.id] ?? ''}
                    onChange={(event) => setStatusNote((current) => ({ ...current, [defect.id]: event.target.value }))}
                    placeholder="אופציונלי"
                  />
                </label>
                <button
                  className="primary-button"
                  onClick={() => {
                    void onChangeStatus(defect, 'done', statusNote[defect.id]);
                    setStatusNote((current) => ({ ...current, [defect.id]: '' }));
                  }}
                  disabled={defect.status === 'done'}
                >
                  סמן כטופל
                </button>
              </div>

              <details className="history-block">
                <summary>היסטוריית סטטוס</summary>
                <ol>
                  {defect.statusHistory.map((change) => (
                    <li key={change.id}>
                      {formatHebrewDateTime(change.changedAt)} - {DEFECT_STATUS_LABELS[change.toStatus]}
                      {change.note ? ` - ${change.note}` : ''}
                    </li>
                  ))}
                </ol>
              </details>

              <div className="action-row">
                <button className="secondary-button" onClick={() => setEditingId(editingId === defect.id ? null : defect.id)}>
                  ערוך
                </button>
                <button
                  className="danger-button"
                  onClick={() => {
                    if (window.confirm('למחוק את הליקוי? מחיקה מיועדת רק לרשומה שנוצרה בטעות.')) {
                      void onDeleteDefect(defect.id);
                    }
                  }}
                >
                  מחק
                </button>
              </div>

              {editingId === defect.id && (
                <DefectForm
                  initialDefect={defect}
                  submitLabel="שמור שינויים"
                  onSave={async (values) => {
                    await onSaveDefect(values, defect);
                    setEditingId(null);
                  }}
                  onCancel={() => setEditingId(null)}
                />
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
