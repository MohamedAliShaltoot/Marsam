import { getDueStatus } from '../../utils/date.js';

export function matchesFilters(card, filters) {
  if (!filters) return true;

  if (filters.search && filters.search.trim()) {
    const q = filters.search.toLowerCase().trim();
    const titleMatch = (card.title || '').toLowerCase().includes(q);
    const descMatch = (card.description || '').toLowerCase().includes(q);
    const labelMatch = (card.labels || []).some((l) => (l.name || '').toLowerCase().includes(q));
    const checkMatch = (card.checklist || []).some((i) => (i.text || '').toLowerCase().includes(q));

    if (!titleMatch && !descMatch && !labelMatch && !checkMatch) {
      return false;
    }
  }

  if (filters.labelIds && filters.labelIds.length > 0) {
    const cardLabelIds = (card.labels || []).map((l) => l.id);
    const hasLabel = filters.labelIds.some((id) => cardLabelIds.includes(id));
    if (!hasLabel) return false;
  }

  if (filters.due) {
    const status = getDueStatus(card.dueDate);
    if (filters.due === 'none') {
      if (card.dueDate) return false;
    } else if (status !== filters.due) {
      return false;
    }
  }

  if (filters.checklist) {
    const items = card.checklist || [];
    if (items.length === 0) return false;
    const allDone = items.every((i) => i.done);
    if (filters.checklist === 'complete' && !allDone) return false;
    if (filters.checklist === 'incomplete' && allDone) return false;
  }

  if (filters.priority) {
    if (card.priority !== filters.priority) return false;
  }

  return true;
}

