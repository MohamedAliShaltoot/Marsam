export function getDueStatus(dueDateStr) {
  if (!dueDateStr) return 'none';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(dueDateStr + 'T00:00:00');
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'overdue';
  if (diffDays === 0) return 'today';
  if (diffDays <= 2) return 'soon';
  return 'future';
}

export function formatDueDate(dueDateStr) {
  if (!dueDateStr) return '';
  const due = new Date(dueDateStr + 'T00:00:00');
  return due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function formatRelativeTime(timestamp) {
  if (!timestamp) return '';
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

