export const GAP = 1000;
const MIN_EPSILON = 1e-4;

export function generateBetween(prevOrder, nextOrder) {
  if ((prevOrder === null || prevOrder === undefined) && (nextOrder === null || nextOrder === undefined)) {
    return GAP;
  }

  if (prevOrder === null || prevOrder === undefined) {
    if (nextOrder <= 0) {
      return nextOrder - GAP;
    }
    return nextOrder / 2;
  }

  if (nextOrder === null || nextOrder === undefined) {
    return prevOrder + GAP;
  }

  const diff = nextOrder - prevOrder;
  if (Math.abs(diff) < MIN_EPSILON) {
    return prevOrder + diff / 2;
  }

  return prevOrder + diff / 2;
}

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

