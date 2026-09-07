import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type WorkspaceTab = 'projects' | 'editor' | 'subtitles' | 'style' | 'export' | 'settings';
export type ThemeMode = 'dark' | 'light';

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
  inspectorVisible: boolean;
  inspectorTab: 'properties' | 'timing' | 'style';
  inspectorWidth: number;
  isGenerateModalOpen: boolean;
  isTutorialOpen: boolean;
  isHelpOpen: boolean;
  tutorialCompleted: boolean;
  recentProjects: RecentProjectEntry[];

  // Actions
  setActiveTab: (tab: WorkspaceTab) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setInspectorVisible: (visible: boolean) => void;
  toggleInspector: () => void;
  setInspectorTab: (tab: 'properties' | 'timing' | 'style') => void;
  setInspectorWidth: (width: number) => void;
  setIsGenerateModalOpen: (open: boolean) => void;
  setIsTutorialOpen: (open: boolean) => void;
  setIsHelpOpen: (open: boolean) => void;
  setTutorialCompleted: (completed: boolean) => void;
  addRecentProject: (entry: Omit<RecentProjectEntry, 'lastOpened'>) => void;
  removeRecentProject: (id: string) => void;
  clearRecentProjects: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      activeTab: 'projects',
      theme: 'dark',
      inspectorVisible: false,
      inspectorTab: 'properties',
      inspectorWidth: 280,
      isGenerateModalOpen: false,
      isTutorialOpen: false,
      isHelpOpen: false,
      tutorialCompleted: false,
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
      setInspectorVisible: (inspectorVisible) => set({ inspectorVisible }),
      toggleInspector: () => set((state) => ({ inspectorVisible: !state.inspectorVisible })),
      setInspectorTab: (inspectorTab) => set({ inspectorTab }),
      setInspectorWidth: (inspectorWidth) => set({ inspectorWidth }),
      setIsGenerateModalOpen: (isGenerateModalOpen) => set({ isGenerateModalOpen }),
      setIsTutorialOpen: (isTutorialOpen) => set({ isTutorialOpen }),
      setIsHelpOpen: (isHelpOpen) => set({ isHelpOpen }),
      setTutorialCompleted: (tutorialCompleted) => set({ tutorialCompleted }),

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
        inspectorVisible: state.inspectorVisible,
        inspectorWidth: state.inspectorWidth,
        tutorialCompleted: state.tutorialCompleted,
        recentProjects: state.recentProjects,
        activeTab: state.activeTab,
      }),
    }
  )
);
