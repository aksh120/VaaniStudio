import { describe, it, expect } from 'vitest';
import { HistoryManager } from '../../src/renderer/src/editor/historyManager.js';

describe('HistoryManager Undo/Redo Stack', () => {
  it('initializes with given state and empty history', () => {
    const history = new HistoryManager({ text: 'initial' });
    expect(history.getCurrent()).toEqual({ text: 'initial' });
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(false);
  });

  it('pushes states and enables undo', () => {
    const history = new HistoryManager({ val: 1 });
    history.pushState({ val: 2 });
    history.pushState({ val: 3 });

    expect(history.getCurrent()).toEqual({ val: 3 });
    expect(history.canUndo()).toBe(true);
    expect(history.canRedo()).toBe(false);

    const undone1 = history.undo();
    expect(undone1).toEqual({ val: 2 });
    expect(history.canRedo()).toBe(true);

    const undone2 = history.undo();
    expect(undone2).toEqual({ val: 1 });
    expect(history.canUndo()).toBe(false);

    const undone3 = history.undo();
    expect(undone3).toBeNull();
  });

  it('redoes previously undone states', () => {
    const history = new HistoryManager('A');
    history.pushState('B');
    history.pushState('C');

    history.undo(); // back to B
    history.undo(); // back to A

    const redone1 = history.redo();
    expect(redone1).toBe('B');

    const redone2 = history.redo();
    expect(redone2).toBe('C');

    expect(history.canRedo()).toBe(false);
  });

  it('clears redo history when pushing a new state after undo', () => {
    const history = new HistoryManager(1);
    history.pushState(2);
    history.pushState(3);

    history.undo(); // at 2
    expect(history.canRedo()).toBe(true);

    history.pushState(4); // replaces future
    expect(history.canRedo()).toBe(false);
    expect(history.getCurrent()).toBe(4);

    expect(history.undo()).toBe(2);
    expect(history.undo()).toBe(1);
  });

  it('respects maximum capacity by discarding oldest states', () => {
    const maxCapacity = 5;
    const history = new HistoryManager(0, { maxCapacity });

    for (let i = 1; i <= 10; i++) {
      history.pushState(i);
    }

    expect(history.getCurrent()).toBe(10);
    const stats = history.getStats();
    expect(stats.pastCount).toBe(5);

    // Can only undo 5 times back to 5
    for (let i = 9; i >= 5; i--) {
      expect(history.undo()).toBe(i);
    }
    expect(history.canUndo()).toBe(false);
  });
});
