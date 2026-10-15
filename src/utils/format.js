export function assignmentTitle(assignment) {
  const title = assignment?.title || 'Assignment';
  const number = Number(assignment?.assignmentNumber);
  if (!Number.isInteger(number) || number < 1) return title;
  return `Assignment ${number}: ${title}`;
}

export function displayValue(value) {
  if (value === undefined || value === null || String(value).trim() === '') return '—';
  return String(value);
}

export function formatDateTime(value) {
  if (!value) return { label: '—', iso: undefined };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { label: '—', iso: undefined };
  return {
    label: new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date),
    iso: date.toISOString(),
  };
}

export function formatAction(action) {
  if (!action) return 'Activity';
  const text = String(action).replace(/[_.-]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!text) return 'Activity';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatStatus(status) {
  const value = String(status || '').trim();
  if (!value) return 'Unknown';
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export function isActiveStatus(status) {
  return String(status || '').toLowerCase() === 'active';
}
