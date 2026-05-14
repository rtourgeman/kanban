import type { NewDefectInput, NewTaskInput } from './types';

export type ValidationResult = {
  valid: boolean;
  errors: string[];
};

export function validateDefectInput(input: Pick<NewDefectInput, 'title'>): ValidationResult {
  const errors: string[] = [];

  if (!input.title.trim()) {
    errors.push('חובה להזין כותרת לליקוי.');
  }

  if (input.title.trim().length > 140) {
    errors.push('כותרת הליקוי ארוכה מדי.');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function validateTaskInput(input: Pick<NewTaskInput, 'title'>): ValidationResult {
  const errors: string[] = [];

  if (!input.title.trim()) {
    errors.push('חובה להזין שם משימה.');
  }

  if (input.title.trim().length > 120) {
    errors.push('שם המשימה ארוך מדי.');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
