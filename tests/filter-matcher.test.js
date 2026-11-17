import { test } from 'node:test';
import assert from 'node:assert';
import { matchesFilters } from '../js/features/search-filter/filter-matcher.js';

const mockCard = {
  id: 'c1',
  title: 'Implement Auth Flow',
  description: 'Use token authentication',
  labels: [{ id: 'l1', name: 'Security' }],
  dueDate: '2026-11-20',
  checklist: [{ id: 'chk1', text: 'Unit test', done: true }],
  priority: 'high'
};

test('matchesFilters: matches search query in title, desc, labels, checklist', () => {
  assert.strictEqual(matchesFilters(mockCard, { search: 'Auth' }), true);
  assert.strictEqual(matchesFilters(mockCard, { search: 'token' }), true);
  assert.strictEqual(matchesFilters(mockCard, { search: 'Security' }), true);
  assert.strictEqual(matchesFilters(mockCard, { search: 'Unit test' }), true);
  assert.strictEqual(matchesFilters(mockCard, { search: 'NonExistent' }), false);
});

test('matchesFilters: filters by priority', () => {
  assert.strictEqual(matchesFilters(mockCard, { priority: 'high' }), true);
  assert.strictEqual(matchesFilters(mockCard, { priority: 'low' }), false);
});

test('matchesFilters: filters by checklist status', () => {
  assert.strictEqual(matchesFilters(mockCard, { checklist: 'complete' }), true);
  assert.strictEqual(matchesFilters(mockCard, { checklist: 'incomplete' }), false);
});

test('matchesFilters: filters by labelIds', () => {
  assert.strictEqual(matchesFilters(mockCard, { labelIds: ['l1'] }), true);
  assert.strictEqual(matchesFilters(mockCard, { labelIds: ['l99'] }), false);
});
