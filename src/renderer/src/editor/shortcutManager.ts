/**
 * Keyboard Shortcut Manager for Desktop Subtitle Editor Workspace (TASK-035).
 * Handles global keybindings with input focus guards.
 */

export interface ShortcutHandlers {
  onTogglePlayPause?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onSplit?: () => void;
  onMerge?: () => void;
  onDelete?: () => void;
  onNextSubtitle?: () => void;
  onPrevSubtitle?: () => void;
  onStepFrame?: (direction: 1 | -1) => void;
  onStepSecond?: (direction: 1 | -1) => void;
  onEscape?: () => void;
}

export class ShortcutManager {
  private handlers: ShortcutHandlers = {};
  private enabled: boolean = true;
  private keydownListener: ((e: KeyboardEvent) => void) | null = null;

  constructor(handlers?: ShortcutHandlers) {
    if (handlers) {
      this.handlers = handlers;
    }
  }

  public setHandlers(handlers: ShortcutHandlers): void {
    this.handlers = { ...this.handlers, ...handlers };
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public isInputFocused(target?: EventTarget | null): boolean {
    const el = (target as HTMLElement) || (typeof document !== 'undefined' ? document.activeElement : null);
    if (!el) return false;
    const tagName = el.tagName?.toLowerCase();
    const isInput = tagName === 'input' || tagName === 'textarea' || tagName === 'select';
    const isContentEditable = el.isContentEditable || (el.getAttribute && el.getAttribute('contenteditable') === 'true');
    return isInput || isContentEditable;
  }

  public handleKeyDown(e: KeyboardEvent): boolean {
    if (!this.enabled) return false;

    const isCtrlOrCmd = e.ctrlKey || e.metaKey;
    const isShift = e.shiftKey;
    const key = e.key.toLowerCase();
    const inputActive = this.isInputFocused(e.target);

    // 1. Undo / Redo (Works even with input focused if desired, or handled by browser in text inputs)
    if (isCtrlOrCmd && !isShift && key === 'z') {
      if (!inputActive && this.handlers.onUndo) {
        e.preventDefault();
        this.handlers.onUndo();
        return true;
      }
    }
    if ((isCtrlOrCmd && key === 'y') || (isCtrlOrCmd && isShift && key === 'z')) {
      if (!inputActive && this.handlers.onRedo) {
        e.preventDefault();
        this.handlers.onRedo();
        return true;
      }
    }

    if (inputActive) {
      if (e.key === 'Escape' && this.handlers.onEscape) {
        this.handlers.onEscape();
        return true;
      }
      return false;
    }

    // 2. Split at Playhead (Ctrl+K or 'S' when not editing text)
    if ((isCtrlOrCmd && key === 'k') || (!isCtrlOrCmd && !isShift && !inputActive && key === 's')) {
      if (this.handlers.onSplit) {
        e.preventDefault();
        this.handlers.onSplit();
        return true;
      }
    }

    // 3. Merge Selected (Ctrl+M)
    if (isCtrlOrCmd && key === 'm') {
      if (this.handlers.onMerge) {
        e.preventDefault();
        this.handlers.onMerge();
        return true;
      }
    }

    // 3. Play / Pause (Space)
    if (e.code === 'Space' || e.key === ' ') {
      if (this.handlers.onTogglePlayPause) {
        e.preventDefault();
        this.handlers.onTogglePlayPause();
        return true;
      }
    }

    // 5. Delete Subtitle (Delete or Backspace)
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (this.handlers.onDelete) {
        e.preventDefault();
        this.handlers.onDelete();
        return true;
      }
    }

    if (e.altKey && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault();
      if (e.key === 'ArrowDown') {
        this.handlers.onNextSubtitle?.();
      } else {
        this.handlers.onPrevSubtitle?.();
      }
      return true;
    }

    // 7. Step Playhead Left / Right (Arrow keys)
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (isShift) {
        this.handlers.onStepSecond?.(-1);
      } else {
        this.handlers.onStepFrame?.(-1);
      }
      return true;
    }

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (isShift) {
        this.handlers.onStepSecond?.(1);
      } else {
        this.handlers.onStepFrame?.(1);
      }
      return true;
    }

    // 8. Escape (Deselect / Cancel)
    if (e.key === 'Escape') {
      if (this.handlers.onEscape) {
        e.preventDefault();
        this.handlers.onEscape();
        return true;
      }
    }

    return false;
  }

  public attach(): () => void {
    if (typeof window === 'undefined') {
      return () => {};
    }
    this.keydownListener = (e: KeyboardEvent) => {
      this.handleKeyDown(e);
    };
    window.addEventListener('keydown', this.keydownListener);
    return () => this.detach();
  }

  public detach(): void {
    if (typeof window !== 'undefined' && this.keydownListener) {
      window.removeEventListener('keydown', this.keydownListener);
      this.keydownListener = null;
    }
  }
}
