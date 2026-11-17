import { test } from 'node:test';
import assert from 'node:assert';
import { generateBetween, rebalance, GAP } from '../js/data/fractional-index.js';

test('fractional index: returns default gap when both prev and next are null', () => {
  const order = generateBetween(null, null);
  assert.strictEqual(order, GAP);
});

test('fractional index: generates half of nextOrder when prepending', () => {
  const order = generateBetween(null, 1000);
  assert.strictEqual(order, 500);
});

test('fractional index: generates nextOrder - GAP when prepending before 0', () => {
  const order = generateBetween(null, 0);
  assert.strictEqual(order, -GAP);
});

test('fractional index: generates prevOrder + GAP when appending', () => {
  const order = generateBetween(2000, null);
  assert.strictEqual(order, 3000);
});

test('fractional index: generates midpoint between two existing orders', () => {
  const order = generateBetween(1000, 2000);
  assert.strictEqual(order, 1500);
});

test('fractional index: rebalance spaces items evenly by GAP', () => {
  const items = [
    { id: '1', order: 100.2 },
    { id: '2', order: 100.5 },
    { id: '3', order: 5000 }
  ];
  const updates = rebalance(items);
  assert.strictEqual(updates.length, 3);
  assert.strictEqual(updates[0].newOrder, 1000);
  assert.strictEqual(updates[1].newOrder, 2000);
  assert.strictEqual(updates[2].newOrder, 3000);
});
