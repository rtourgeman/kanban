import type { DefectSeverity, DefectStatus } from './types';

export const DEFAULT_TASK_TEMPLATES = [
  'בדיקת איטום',
  'בדיקת ריצוף',
  'בדיקת טיח וצבע',
  'בדיקת חשמל',
  'בדיקת אינסטלציה',
  'בדיקת אלומיניום/פתחים',
  'בדיקת בטיחות באתר',
  'צילום תיעוד כללי'
];

export const DEFECT_STATUS_LABELS: Record<DefectStatus, string> = {
  open: 'פתוח',
  in_progress: 'בטיפול',
  done: 'טופל',
  verified: 'אומת',
  closed: 'סגור'
};

export const DEFECT_SEVERITY_LABELS: Record<DefectSeverity, string> = {
  low: 'נמוכה',
  medium: 'בינונית',
  high: 'גבוהה',
  critical: 'קריטית'
};

export const DEFECT_FILTER_LABELS = {
  active: 'פתוחים/בטיפול',
  all: 'כל הליקויים',
  new_this_visit: 'חדש בביקור',
  in_progress: 'בטיפול',
  done_this_visit: 'טופל בביקור הזה',
  history: 'היסטוריה',
  high_critical: 'חמור/קריטי'
} as const;
