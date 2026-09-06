/**
 * History Manager for Desktop Subtitle Editor Workspace
 * Implements an immutable, transactional undo/redo history stack (TASK-035).
 */

export interface HistoryOptions {
  maxCapacity?: number;
}

export class HistoryManager<T> {
  private past: T[] = [];
  private present: T;
  private future: T[] = [];
  private maxCapacity: number;

  constructor(initialState: T, options?: HistoryOptions) {
    this.present = this.clone(initialState);
    this.maxCapacity = options?.maxCapacity ?? 100;
  }

  private clone(state: T): T {
    // Deep clone state to ensure immutability
    return JSON.parse(JSON.stringify(state));
  }

  /**
   * Push a new state onto the history stack.
   * Clears any existing redo future states.
   */
  public pushState(newState: T): void {
    this.past.push(this.present);
    this.present = this.clone(newState);
    this.future = [];

    // Enforce max capacity by evicting oldest snapshots
    if (this.past.length > this.maxCapacity) {
      this.past.splice(0, this.past.length - this.maxCapacity);
    }
  }

  /**
   * Undo to previous state if available.
   * Returns the new present state, or null if cannot undo.
   */
  public undo(): T | null {
    if (!this.canUndo()) {
      return null;
    }
    const previous = this.past.pop()!;
    this.future.unshift(this.present);
    this.present = previous;
    return this.clone(this.present);
  }

  /**
   * Redo to future state if available.
   * Returns the new present state, or null if cannot redo.
   */
  public redo(): T | null {
    if (!this.canRedo()) {
      return null;
    }
    const next = this.future.shift()!;
    this.past.push(this.present);
    this.present = next;
    return this.clone(this.present);
  }

  public canUndo(): boolean {
    return this.past.length > 0;
  }

  public canRedo(): boolean {
    return this.future.length > 0;
  }

  public getCurrent(): T {
    return this.clone(this.present);
  }

  public clear(newInitialState: T): void {
    this.past = [];
    this.present = this.clone(newInitialState);
    this.future = [];
  }

  public getStats(): { pastCount: number; futureCount: number; maxCapacity: number } {
    return {
      pastCount: this.past.length,
      futureCount: this.future.length,
      maxCapacity: this.maxCapacity,
    };
  }
}
