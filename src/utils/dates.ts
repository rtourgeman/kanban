export function nowIso(): string {
  return new Date().toISOString();
}

export function todayInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

function padDatePart(value: number): string {
  return String(value).padStart(2, '0');
}

function parseDateValue(value: string): Date | undefined {
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function formatHebrewDate(value?: string): string {
  if (!value) {
    return 'לא צוין';
  }

  const date = parseDateValue(value);
  if (!date) {
    return value;
  }

  return `${padDatePart(date.getDate())}/${padDatePart(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export function formatHebrewDateTime(value?: string): string {
  if (!value) {
    return 'לא צוין';
  }

  const date = parseDateValue(value);
  if (!date) {
    return value;
  }

  const time = new Intl.DateTimeFormat('he-IL', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);

  return `${formatHebrewDate(value)}, ${time}`;
}
