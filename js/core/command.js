/**
 * Command Stack for Undo / Redo Operations
 * Maintains an undo/redo history up to a maximum limit (50).
 */

/**
 * @typedef {Object} Command
 * @property {() => Promise<void>|void} execute
 * @property {() => Promise<void>|void} undo
 * @property {string} description
 */

export class CommandManager {
  /**
   * @param {number} [maxSize=50]
   */
  constructor(maxSize = 50) {
    this.maxSize = maxSize;
    /** @type {Command[]} */
    this.undoStack = [];
    /** @type {Command[]} */
    this.redoStack = [];
  }

  /**
   * Executes a command and pushes it to the undo stack
   * @param {Command} command
   * @returns {Promise<void>}
   */
  async execute(command) {
    await command.execute();
    this.undoStack.push(command);
    if (this.undoStack.length > this.maxSize) {
      this.undoStack.shift();
    }
    // New action invalidates redo stack
    this.redoStack = [];
  }

  /**
   * Undoes the most recent command
   * @returns {Promise<Command|null>} The undone command, or null if stack empty
   */
  async undo() {
    if (this.undoStack.length === 0) return null;
    const command = this.undoStack.pop();
    await command.undo();
    this.redoStack.push(command);
    return command;
  }

  /**
   * Redoes the most recently undone command
   * @returns {Promise<Command|null>} The redone command, or null if stack empty
   */
  async redo() {
    if (this.redoStack.length === 0) return null;
    const command = this.redoStack.pop();
    await command.execute();
    this.undoStack.push(command);
    return command;
  }

  /**
   * @returns {boolean}
   */
  canUndo() {
    return this.undoStack.length > 0;
  }

  /**
   * @returns {boolean}
   */
  canRedo() {
    return this.redoStack.length > 0;
  }

  /**
   * Clears undo and redo stacks
   */
  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }
}

export const commandManager = new CommandManager(50);
