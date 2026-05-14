export function nowIso(): string {
  return new Date().toISOString();
}

export function todayInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatHebrewDate(value?: string): string {
  if (!value) {
    return 'לא צוין';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('he-IL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

export function formatHebrewDateTime(value?: string): string {
  if (!value) {
    return 'לא צוין';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('he-IL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}
