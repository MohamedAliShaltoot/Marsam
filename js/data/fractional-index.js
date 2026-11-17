/**
 * Fractional / Gap Indexing Engine
 * Ensures moving an item only updates ONE database record instead of shifting whole lists.
 */

export const GAP = 1000;
const MIN_EPSILON = 1e-4;

/**
 * Calculates a new fractional order between two neighboring items
 * @param {number|null} prevOrder - Order of previous item or null if first
 * @param {number|null} nextOrder - Order of next item or null if last
 * @returns {number} The calculated order
 */
export function generateBetween(prevOrder, nextOrder) {
  // Case 1: Empty list or sole item
  if ((prevOrder === null || prevOrder === undefined) && (nextOrder === null || nextOrder === undefined)) {
    return GAP;
  }

  // Case 2: Inserting at the very beginning of the list
  if (prevOrder === null || prevOrder === undefined) {
    if (nextOrder <= 0) {
      return nextOrder - GAP;
    }
    // Halfway between 0 and nextOrder
    return nextOrder / 2;
  }

  // Case 3: Appending to the very end of the list
  if (nextOrder === null || nextOrder === undefined) {
    return prevOrder + GAP;
  }

  // Case 4: Inserting between two existing items
  const diff = nextOrder - prevOrder;
  if (Math.abs(diff) < MIN_EPSILON) {
    // Orders are too close; will need rebalancing, but provide midpoint
    return prevOrder + diff / 2;
  }

  return prevOrder + diff / 2;
}

/**
 * Rebalances an array of ordered items with even 1000 gaps
 * @template {{ order: number }} T
 * @param {T[]} items - Array of items sorted by current order
 * @returns {{ item: T, newOrder: number }[]} Changed items that need database update
 */
export function rebalance(items) {
  const updates = [];
  let currentOrder = GAP;

  for (const item of items) {
    if (item.order !== currentOrder) {
      updates.push({ item, newOrder: currentOrder });
    }
    currentOrder += GAP;
  }

  return updates;
}
