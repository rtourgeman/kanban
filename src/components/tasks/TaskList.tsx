import { useState } from 'react';
import type { TaskItem } from '../../domain/types';

type TaskListProps = {
  tasks: TaskItem[];
  onAddTask: (title: string) => Promise<void>;
  onUpdateTask: (taskId: string, patch: Partial<TaskItem>) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onSeedTasks: () => Promise<void>;
};

export function TaskList({ tasks, onAddTask, onUpdateTask, onDeleteTask, onSeedTasks }: TaskListProps): JSX.Element {
  const [title, setTitle] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  async function handleAddTask(): Promise<void> {
    if (!title.trim()) {
      return;
    }

    await onAddTask(title);
    setTitle('');
  }

  async function handleToggle(task: TaskItem): Promise<void> {
    await onUpdateTask(task.id, {
      status: task.status === 'done' ? 'todo' : 'done'
    });
  }

  async function handleSaveEdit(task: TaskItem): Promise<void> {
    if (!editingTitle.trim()) {
      return;
    }

    await onUpdateTask(task.id, { title: editingTitle });
    setEditingTaskId(null);
    setEditingTitle('');
  }

  return (
    <section className="workspace-section tasks-panel" aria-labelledby="tasks-title">
      <div className="section-heading compact">
        <div>
          <p className="eyebrow">משימות</p>
          <h2 id="tasks-title">רשימת בדיקה לביקור</h2>
        </div>
        <button className="ghost-button" onClick={onSeedTasks}>
          הוסף תבנית
        </button>
      </div>

      <div className="inline-form">
        <label className="sr-only" htmlFor="new-task">
          משימה חדשה
        </label>
        <input
          id="new-task"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="הוסף משימה מהירה"
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              void handleAddTask();
            }
          }}
        />
        <button className="secondary-button" onClick={handleAddTask}>
          הוסף משימה
        </button>
      </div>

      {tasks.length === 0 ? (
        <p className="empty-state">אין משימות עדיין. אפשר להוסיף משימה או להוסיף את תבנית הבדיקות.</p>
      ) : (
        <ul className="task-list">
          {tasks.map((task) => (
            <li key={task.id} className={`task-item ${task.status === 'done' ? 'is-done' : ''}`} data-testid="task-item">
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  aria-label={`סמן ${task.title} כבוצע`}
                  checked={task.status === 'done'}
                  onChange={() => void handleToggle(task)}
                />
                <span>{task.status === 'done' ? 'בוצע' : 'לביצוע'}</span>
              </label>

              {editingTaskId === task.id ? (
                <div className="task-edit-row">
                  <input value={editingTitle} onChange={(event) => setEditingTitle(event.target.value)} />
                  <button className="secondary-button" onClick={() => void handleSaveEdit(task)}>
                    שמור
                  </button>
                </div>
              ) : (
                <button
                  className="plain-text-button task-title"
                  onClick={() => {
                    setEditingTaskId(task.id);
                    setEditingTitle(task.title);
                  }}
                >
                  {task.title}
                </button>
              )}

              <button
                className="task-delete-button"
                aria-label={`מחק משימה ${task.title}`}
                title="מחק משימה"
                onClick={() => {
                  if (window.confirm('למחוק את המשימה?')) {
                    void onDeleteTask(task.id);
                  }
                }}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
