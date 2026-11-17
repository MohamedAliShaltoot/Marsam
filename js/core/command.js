export class CommandManager {
  constructor(maxSize = 50) {
    this.maxSize = maxSize;
    this.undoStack = [];
    this.redoStack = [];
  }

  async execute(command) {
    await command.execute();
    this.undoStack.push(command);
    if (this.undoStack.length > this.maxSize) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }

  async undo() {
    if (this.undoStack.length === 0) return null;
    const command = this.undoStack.pop();
    await command.undo();
    this.redoStack.push(command);
    return command;
  }

  async redo() {
    if (this.redoStack.length === 0) return null;
    const command = this.redoStack.pop();
    await command.execute();
    this.undoStack.push(command);
    return command;
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }
}

export const commandManager = new CommandManager(50);

