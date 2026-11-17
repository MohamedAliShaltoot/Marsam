/**
 * Card Search & Filter Matching Engine
 * Pure logic function testing cards against search terms and combinable filters
 */
import { getDueStatus } from '../../utils/date.js';

/**
 * Tests whether a card matches the active search query and filter criteria
 * @param {import('../../core/store.js').Card} card
 * @param {Object} filters
 * @param {string} [filters.search]
 * @param {string[]} [filters.labelIds]
 * @param {string|null} [filters.due] - 'overdue'|'today'|'soon'|'none'
 * @param {string|null} [filters.checklist] - 'complete'|'incomplete'
 * @param {string|null} [filters.priority] - 'low'|'medium'|'high'|'urgent'
 * @returns {boolean}
 */
export function matchesFilters(card, filters) {
  if (!filters) return true;

  // 1. Text Search across Title, Description, Checklist text, Label names
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

  // 2. Label filter
  if (filters.labelIds && filters.labelIds.length > 0) {
    const cardLabelIds = (card.labels || []).map((l) => l.id);
    const hasLabel = filters.labelIds.some((id) => cardLabelIds.includes(id));
    if (!hasLabel) return false;
  }

  // 3. Due date filter
  if (filters.due) {
    const status = getDueStatus(card.dueDate);
    if (filters.due === 'none') {
      if (card.dueDate) return false;
    } else if (status !== filters.due) {
      return false;
    }
  }

  // 4. Checklist status filter
  if (filters.checklist) {
    const items = card.checklist || [];
    if (items.length === 0) return false;
    const allDone = items.every((i) => i.done);
    if (filters.checklist === 'complete' && !allDone) return false;
    if (filters.checklist === 'incomplete' && allDone) return false;
  }

  // 5. Priority filter
  if (filters.priority) {
    if (card.priority !== filters.priority) return false;
  }

  return true;
}
