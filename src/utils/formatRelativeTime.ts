export function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes < 1) {
    return 'JUST NOW';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}M AGO`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}H AGO`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}D AGO`;
  }

  return date
    .toLocaleDateString(undefined, {day: 'numeric', month: 'short'})
    .toUpperCase();
}
