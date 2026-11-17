import { test } from 'node:test';
import assert from 'node:assert';
import { CommandManager } from '../js/core/command.js';

test('command manager: executes and pushes to undo stack', async () => {
  const manager = new CommandManager(10);
  let val = 0;

  const cmd = {
    description: 'Add 1',
    execute: () => { val += 1; },
    undo: () => { val -= 1; }
  };

  await manager.execute(cmd);
  assert.strictEqual(val, 1);
  assert.strictEqual(manager.canUndo(), true);
  assert.strictEqual(manager.canRedo(), false);

  await manager.undo();
  assert.strictEqual(val, 0);
  assert.strictEqual(manager.canUndo(), false);
  assert.strictEqual(manager.canRedo(), true);

  await manager.redo();
  assert.strictEqual(val, 1);
  assert.strictEqual(manager.canUndo(), true);
  assert.strictEqual(manager.canRedo(), false);
});

test('command manager: respects max stack size', async () => {
  const manager = new CommandManager(3);
  for (let i = 0; i < 5; i++) {
    await manager.execute({
      description: `Step ${i}`,
      execute: () => {},
      undo: () => {}
    });
  }
  assert.strictEqual(manager.undoStack.length, 3);
});
