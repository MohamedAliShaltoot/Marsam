import { test } from 'node:test';
import assert from 'node:assert';
import { validateImportSchema } from '../js/data/export-import.js';

test('validateImportSchema: accepts valid payload', () => {
  const validPayload = {
    app: 'boardly',
    version: 1,
    project: { id: 'p1', name: 'My Project' },
    lists: [{ id: 'l1', title: 'To Do', order: 1000 }],
    cards: [{ id: 'c1', title: 'Task 1', order: 1000 }]
  };
  assert.strictEqual(validateImportSchema(validPayload), true);
});

test('validateImportSchema: rejects invalid or missing project', () => {
  assert.strictEqual(validateImportSchema(null), false);
  assert.strictEqual(validateImportSchema({}), false);
  assert.strictEqual(validateImportSchema({ project: null, lists: [], cards: [] }), false);
  assert.strictEqual(validateImportSchema({ project: { name: 123 }, lists: [], cards: [] }), false);
});

test('validateImportSchema: rejects missing lists or cards arrays', () => {
  assert.strictEqual(validateImportSchema({ project: { name: 'P' }, lists: null, cards: [] }), false);
  assert.strictEqual(validateImportSchema({ project: { name: 'P' }, lists: [], cards: {} }), false);
});
