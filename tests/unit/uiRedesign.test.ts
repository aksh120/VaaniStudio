import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '../../src/renderer/src/store/uiStore.js';
import { BUILT_IN_PRESETS } from '../../src/shared/subtitles/defaultPresets.js';

describe('UI Redesign Architecture and State Management', () => {
  beforeEach(() => {
    // Reset uiStore to initial default state
    useUIStore.setState({
      activeTab: 'editor',
      leftPanelVisible: true,
      leftPanelWidth: 280,
      inspectorVisible: true,
      inspectorTab: 'subtitle',
      inspectorWidth: 320,
      timelineHeight: 160,
       focusMode: false,
       recentProjectsLimit: 10,
     });
  });

  describe('3-Column Workspace State', () => {
    it('initializes with default panel dimensions and visibility', () => {
      const state = useUIStore.getState();
      expect(state.leftPanelVisible).toBe(true);
      expect(state.leftPanelWidth).toBe(280);
      expect(state.inspectorVisible).toBe(true);
      expect(state.inspectorTab).toBe('subtitle');
      expect(state.timelineHeight).toBe(160);
      expect(state.focusMode).toBe(false);
    });

    it('toggles left subtitle panel visibility', () => {
      const { toggleLeftPanel } = useUIStore.getState();
      toggleLeftPanel();
      expect(useUIStore.getState().leftPanelVisible).toBe(false);
      toggleLeftPanel();
      expect(useUIStore.getState().leftPanelVisible).toBe(true);
    });

    it('updates left panel width when resized', () => {
      const { setLeftPanelWidth } = useUIStore.getState();
      setLeftPanelWidth(340);
      expect(useUIStore.getState().leftPanelWidth).toBe(340);
    });

    it('toggles contextual inspector visibility', () => {
      const { toggleInspector } = useUIStore.getState();
      toggleInspector();
      expect(useUIStore.getState().inspectorVisible).toBe(false);
      toggleInspector();
      expect(useUIStore.getState().inspectorVisible).toBe(true);
    });

    it('switches between contextual inspector tabs', () => {
      const { setInspectorTab } = useUIStore.getState();
      setInspectorTab('style');
      expect(useUIStore.getState().inspectorTab).toBe('style');

      setInspectorTab('video');
      expect(useUIStore.getState().inspectorTab).toBe('video');

      setInspectorTab('audio');
      expect(useUIStore.getState().inspectorTab).toBe('audio');

      setInspectorTab('subtitle');
      expect(useUIStore.getState().inspectorTab).toBe('subtitle');
    });

    it('updates timeline vertical height', () => {
      const { setTimelineHeight } = useUIStore.getState();
      setTimelineHeight(220);
      expect(useUIStore.getState().timelineHeight).toBe(220);
    });

    it('manages openInEditorAfterGeneration preference state', () => {
      const { setOpenInEditorAfterGeneration } = useUIStore.getState();
      expect(useUIStore.getState().openInEditorAfterGeneration).toBe(true);

      setOpenInEditorAfterGeneration(false);
      expect(useUIStore.getState().openInEditorAfterGeneration).toBe(false);

      setOpenInEditorAfterGeneration(true);
      expect(useUIStore.getState().openInEditorAfterGeneration).toBe(true);
    });

    it('persists the recent-project display limit', () => {
      const { setRecentProjectsLimit } = useUIStore.getState();
      setRecentProjectsLimit(20);
      expect(useUIStore.getState().recentProjectsLimit).toBe(20);
      setRecentProjectsLimit(50);
      expect(useUIStore.getState().recentProjectsLimit).toBe(20);
    });
  });

  describe('Responsive Aspect Ratio Calculation Logic', () => {
    const computeFrame = (viewportW: number, viewportH: number, ratio: number) => {
      const padX = 4;
      const padY = 4;
      const availW = Math.max(80, viewportW - padX);
      const availH = Math.max(80, viewportH - padY);

      let w = availW;
      let h = w / ratio;
      if (h > availH) {
        h = availH;
        w = h * ratio;
      }
      return {
        width: Math.round(w),
        height: Math.round(h),
      };
    };

    it('maximizes 16:9 landscape video into center workspace without wasted space', () => {
      const frame = computeFrame(900, 500, 16 / 9);
      expect(frame.width).toBeLessThanOrEqual(900);
      expect(frame.height).toBeLessThanOrEqual(500);
      // Verify height fills available height closely
      expect(frame.height).toBe(500 - 4);
    });

    it('properly constrains 9:16 vertical video reel inside center workspace', () => {
      const frame = computeFrame(900, 500, 9 / 16);
      expect(frame.width).toBeLessThanOrEqual(900);
      expect(frame.height).toBe(500 - 4);
      expect(frame.width).toBe(Math.round((500 - 4) * (9 / 16)));
    });

    it('properly constrains 1:1 square video frame', () => {
      const frame = computeFrame(800, 600, 1.0);
      expect(frame.height).toBe(600 - 4);
      expect(frame.width).toBe(600 - 4);
    });
  });

  describe('Built-in Style Presets for Mini-Grid', () => {
    it('provides complete broadcast-quality style configurations', () => {
      expect(BUILT_IN_PRESETS.length).toBeGreaterThanOrEqual(6);

      for (const preset of BUILT_IN_PRESETS) {
        expect(preset.id).toBeTruthy();
        expect(preset.name).toBeTruthy();
        expect(preset.style.fontFamily).toBeTruthy();
        expect(preset.style.fontSize).toBeGreaterThan(0);
        expect(preset.style.primaryColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(preset.style.position.alignment).toMatch(/^(left|center|right)$/);
      }
    });
  });
});
