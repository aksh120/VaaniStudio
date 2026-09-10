import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type WorkspaceTab = 'projects' | 'editor' | 'subtitles' | 'style' | 'export' | 'settings';
export type ThemeMode = 'dark' | 'light';

export type InspectorTab = 'style' | 'translate' | 'review' | 'subtitle' | 'video' | 'audio';

export interface RecentProjectEntry {
  id: string;
  name: string;
  filePath: string;
  mediaPath?: string;
  lastOpened: string;
  durationSeconds: number;
  subtitleCount: number;
}

interface UIState {
  activeTab: WorkspaceTab;
  theme: ThemeMode;
  leftPanelVisible: boolean;
  leftPanelWidth: number;
  inspectorVisible: boolean;
  inspectorTab: InspectorTab;
  inspectorWidth: number;
  timelineHeight: number;
  focusMode: boolean;
  isGenerateModalOpen: boolean;
  isTutorialOpen: boolean;
  isHelpOpen: boolean;
  tutorialCompleted: boolean;
  openInEditorAfterGeneration: boolean;
  recentProjects: RecentProjectEntry[];

  // Actions
  setActiveTab: (tab: WorkspaceTab) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setLeftPanelVisible: (visible: boolean) => void;
  toggleLeftPanel: () => void;
  setLeftPanelWidth: (width: number) => void;
  setInspectorVisible: (visible: boolean) => void;
  toggleInspector: () => void;
  setInspectorTab: (tab: InspectorTab) => void;
  setInspectorWidth: (width: number) => void;
  setTimelineHeight: (height: number) => void;
  toggleFocusMode: () => void;
  setIsGenerateModalOpen: (open: boolean) => void;
  setIsTutorialOpen: (open: boolean) => void;
  setIsHelpOpen: (open: boolean) => void;
  setTutorialCompleted: (completed: boolean) => void;
  setOpenInEditorAfterGeneration: (open: boolean) => void;
  addRecentProject: (entry: Omit<RecentProjectEntry, 'lastOpened'>) => void;
  removeRecentProject: (id: string) => void;
  clearRecentProjects: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      activeTab: 'projects',
      theme: 'dark',
      leftPanelVisible: true,
      leftPanelWidth: 280,
      inspectorVisible: true,
      inspectorTab: 'style',
      inspectorWidth: 320,
      timelineHeight: 160,
      focusMode: false,
      isGenerateModalOpen: false,
      isTutorialOpen: false,
      isHelpOpen: false,
      tutorialCompleted: false,
      openInEditorAfterGeneration: true,
      recentProjects: [],

      setActiveTab: (tab) => set({ activeTab: tab }),
      setTheme: (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        set({ theme });
      },
      toggleTheme: () =>
        set((state) => {
          const next = state.theme === 'dark' ? 'light' : 'dark';
          document.documentElement.setAttribute('data-theme', next);
          return { theme: next };
        }),
      setLeftPanelVisible: (leftPanelVisible) => set({ leftPanelVisible }),
      toggleLeftPanel: () => set((state) => ({ leftPanelVisible: !state.leftPanelVisible })),
      setLeftPanelWidth: (leftPanelWidth) => set({ leftPanelWidth: Math.max(220, Math.min(450, leftPanelWidth)) }),
      setInspectorVisible: (inspectorVisible) => set({ inspectorVisible }),
      toggleInspector: () => set((state) => ({ inspectorVisible: !state.inspectorVisible })),
      setInspectorTab: (inspectorTab) => set({ inspectorTab }),
      setInspectorWidth: (inspectorWidth) => set({ inspectorWidth: Math.max(260, Math.min(480, inspectorWidth)) }),
      setTimelineHeight: (timelineHeight) => set({ timelineHeight: Math.max(90, Math.min(350, timelineHeight)) }),
      toggleFocusMode: () =>
        set((state) => {
          const next = !state.focusMode;
          if (next) {
            return { focusMode: true, leftPanelVisible: false, inspectorVisible: false };
          }
          return { focusMode: false, leftPanelVisible: true, inspectorVisible: true };
        }),
      setIsGenerateModalOpen: (isGenerateModalOpen) => set({ isGenerateModalOpen }),
      setIsTutorialOpen: (isTutorialOpen) => set({ isTutorialOpen }),
      setIsHelpOpen: (isHelpOpen) => set({ isHelpOpen }),
      setTutorialCompleted: (tutorialCompleted) => set({ tutorialCompleted }),
      setOpenInEditorAfterGeneration: (openInEditorAfterGeneration) => set({ openInEditorAfterGeneration }),

      addRecentProject: (entry) =>
        set((state) => {
          const filtered = state.recentProjects.filter(
            (p) => p.id !== entry.id && p.filePath !== entry.filePath
          );
          const updated: RecentProjectEntry = {
            ...entry,
            lastOpened: new Date().toISOString(),
          };
          return {
            recentProjects: [updated, ...filtered].slice(0, 15), // keep up to 15 recent
          };
        }),

      removeRecentProject: (id) =>
        set((state) => ({
          recentProjects: state.recentProjects.filter((p) => p.id !== id),
        })),

      clearRecentProjects: () => set({ recentProjects: [] }),
    }),
    {
      name: 'vaani-ui-settings',
      partialize: (state) => ({
        theme: state.theme,
        leftPanelVisible: state.leftPanelVisible,
        leftPanelWidth: state.leftPanelWidth,
        inspectorVisible: state.inspectorVisible,
        inspectorWidth: state.inspectorWidth,
        inspectorTab: state.inspectorTab,
        timelineHeight: state.timelineHeight,
        tutorialCompleted: state.tutorialCompleted,
        recentProjects: state.recentProjects,
        activeTab: state.activeTab,
      }),
    }
  )
);
