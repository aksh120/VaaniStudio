import { describe, it, expect, vi } from 'vitest';
import { ShortcutManager } from '../../src/renderer/src/editor/shortcutManager.js';

describe('ShortcutManager Keyboard Dispatcher', () => {
  it('dispatches play/pause on Space when not inside an input', () => {
    const onTogglePlayPause = vi.fn();
    const manager = new ShortcutManager({ onTogglePlayPause });

    const event = {
      code: 'Space',
      key: ' ',
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      target: { tagName: 'DIV' },
      preventDefault: vi.fn(),
    } as unknown as KeyboardEvent;

    const handled = manager.handleKeyDown(event);
    expect(handled).toBe(true);
    expect(onTogglePlayPause).toHaveBeenCalledTimes(1);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('suppresses Space shortcut when typing inside input or textarea', () => {
    const onTogglePlayPause = vi.fn();
    const manager = new ShortcutManager({ onTogglePlayPause });

    const inputEvent = {
      code: 'Space',
      key: ' ',
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      target: { tagName: 'INPUT' },
      preventDefault: vi.fn(),
    } as unknown as KeyboardEvent;

    const handled = manager.handleKeyDown(inputEvent);
    expect(handled).toBe(false);
    expect(onTogglePlayPause).not.toHaveBeenCalled();
    expect(inputEvent.preventDefault).not.toHaveBeenCalled();
  });

  it('handles undo and redo with Ctrl+Z and Ctrl+Y', () => {
    const onUndo = vi.fn();
    const onRedo = vi.fn();
    const manager = new ShortcutManager({ onUndo, onRedo });

    // Ctrl + Z -> Undo
    const undoEvent = {
      key: 'z',
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
      target: { tagName: 'DIV' },
      preventDefault: vi.fn(),
    } as unknown as KeyboardEvent;

    expect(manager.handleKeyDown(undoEvent)).toBe(true);
    expect(onUndo).toHaveBeenCalledTimes(1);

    // Ctrl + Y -> Redo
    const redoEvent = {
      key: 'y',
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
      target: { tagName: 'DIV' },
      preventDefault: vi.fn(),
    } as unknown as KeyboardEvent;

    expect(manager.handleKeyDown(redoEvent)).toBe(true);
    expect(onRedo).toHaveBeenCalledTimes(1);

    // Ctrl + Shift + Z -> Redo
    const redoShiftEvent = {
      key: 'z',
      ctrlKey: true,
      metaKey: false,
      shiftKey: true,
      target: { tagName: 'DIV' },
      preventDefault: vi.fn(),
    } as unknown as KeyboardEvent;

    expect(manager.handleKeyDown(redoShiftEvent)).toBe(true);
    expect(onRedo).toHaveBeenCalledTimes(2);
  });

  it('handles Split at playhead with Ctrl+K or S when not editing text', () => {
    const onSplit = vi.fn();
    const manager = new ShortcutManager({ onSplit });

    // S key
    const sEvent = {
      key: 's',
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      target: { tagName: 'DIV' },
      preventDefault: vi.fn(),
    } as unknown as KeyboardEvent;

    expect(manager.handleKeyDown(sEvent)).toBe(true);
    expect(onSplit).toHaveBeenCalledTimes(1);

    // Ctrl+K
    const ctrlKEvent = {
      key: 'k',
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
      target: { tagName: 'DIV' },
      preventDefault: vi.fn(),
    } as unknown as KeyboardEvent;

    expect(manager.handleKeyDown(ctrlKEvent)).toBe(true);
    expect(onSplit).toHaveBeenCalledTimes(2);
  });

  it('leaves Tab for native focus navigation and supports Alt+Arrow subtitle navigation', () => {
    const onNextSubtitle = vi.fn();
    const onPrevSubtitle = vi.fn();
    const manager = new ShortcutManager({ onNextSubtitle, onPrevSubtitle });

    const tabEvent = {
      key: 'Tab',
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      target: { tagName: 'DIV' },
      preventDefault: vi.fn(),
    } as unknown as KeyboardEvent;
    expect(manager.handleKeyDown(tabEvent)).toBe(false);
    expect(tabEvent.preventDefault).not.toHaveBeenCalled();

    const nextEvent = {
      key: 'ArrowDown',
      altKey: true,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      target: { tagName: 'DIV' },
      preventDefault: vi.fn(),
    } as unknown as KeyboardEvent;
    expect(manager.handleKeyDown(nextEvent)).toBe(true);
    expect(onNextSubtitle).toHaveBeenCalledTimes(1);

    const previousEvent = {
      ...nextEvent,
      key: 'ArrowUp',
    } as unknown as KeyboardEvent;
    expect(manager.handleKeyDown(previousEvent)).toBe(true);
    expect(onPrevSubtitle).toHaveBeenCalledTimes(1);
  });

  it('does not split or merge while an input is focused', () => {
    const onSplit = vi.fn();
    const onMerge = vi.fn();
    const manager = new ShortcutManager({ onSplit, onMerge });
    const inputEvent = {
      key: 'k',
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
      target: { tagName: 'INPUT' },
      preventDefault: vi.fn(),
    } as unknown as KeyboardEvent;

    expect(manager.handleKeyDown(inputEvent)).toBe(false);
    expect(onSplit).not.toHaveBeenCalled();
    expect(onMerge).not.toHaveBeenCalled();
    expect(inputEvent.preventDefault).not.toHaveBeenCalled();
  });

  it('handles ArrowLeft / ArrowRight frame and second stepping', () => {
    const onStepFrame = vi.fn();
    const onStepSecond = vi.fn();
    const manager = new ShortcutManager({ onStepFrame, onStepSecond });

    const leftFrameEvent = {
      key: 'ArrowLeft',
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      target: { tagName: 'DIV' },
      preventDefault: vi.fn(),
    } as unknown as KeyboardEvent;

    expect(manager.handleKeyDown(leftFrameEvent)).toBe(true);
    expect(onStepFrame).toHaveBeenCalledWith(-1);

    const rightSecondEvent = {
      key: 'ArrowRight',
      ctrlKey: false,
      metaKey: false,
      shiftKey: true,
      target: { tagName: 'DIV' },
      preventDefault: vi.fn(),
    } as unknown as KeyboardEvent;

    expect(manager.handleKeyDown(rightSecondEvent)).toBe(true);
    expect(onStepSecond).toHaveBeenCalledWith(1);
  });
});
