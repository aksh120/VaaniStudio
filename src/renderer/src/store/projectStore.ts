import { create } from 'zustand';
import {
  ProjectData,
  HardwareProfile,
  SubtitleEvent,
  SubtitleStyle,
  ProjectSettings,
  MediaInfo,
} from '../../../shared/types/models.js';
import { createEmptyProject } from '../../../shared/defaults.js';

interface ProjectState {
  project: ProjectData;
  hardware: HardwareProfile | null;
  currentTime: number;
  selectedEventId: string | null;
  isLoading: boolean;
  statusMessage: string;

  // Actions
  setHardware: (hardware: HardwareProfile) => void;
  setMedia: (media: MediaInfo) => void;
  updateSettings: (settings: Partial<ProjectSettings>) => void;
  updateStyle: (style: Partial<SubtitleStyle>) => void;
  setEvents: (events: SubtitleEvent[]) => void;
  addEvent: (event: SubtitleEvent) => void;
  selectEvent: (id: string | null) => void;
  setCurrentTime: (time: number) => void;
  setStatusMessage: (msg: string) => void;
  setIsLoading: (loading: boolean) => void;
  loadProjectData: (project: ProjectData) => void;
  resetProject: () => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  project: createEmptyProject(),
  hardware: null,
  currentTime: 0,
  selectedEventId: null,
  isLoading: false,
  statusMessage: 'Ready',

  setHardware: (hardware) => set({ hardware }),

  setMedia: (media) =>
    set((state) => ({
      project: {
        ...state.project,
        media,
        modifiedAt: new Date().toISOString(),
      },
    })),

  updateSettings: (newSettings) =>
    set((state) => ({
      project: {
        ...state.project,
        settings: { ...state.project.settings, ...newSettings },
        modifiedAt: new Date().toISOString(),
      },
    })),

  updateStyle: (newStyle) =>
    set((state) => ({
      project: {
        ...state.project,
        style: { ...state.project.style, ...newStyle },
        modifiedAt: new Date().toISOString(),
      },
    })),

  setEvents: (events) =>
    set((state) => ({
      project: {
        ...state.project,
        events,
        modifiedAt: new Date().toISOString(),
      },
    })),

  addEvent: (event) =>
    set((state) => ({
      project: {
        ...state.project,
        events: [...state.project.events, event],
        modifiedAt: new Date().toISOString(),
      },
    })),

  selectEvent: (id) => set({ selectedEventId: id }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setStatusMessage: (statusMessage) => set({ statusMessage }),
  setIsLoading: (isLoading) => set({ isLoading }),
  loadProjectData: (project) => set({ project, selectedEventId: null }),
  resetProject: () => set({ project: createEmptyProject(), selectedEventId: null }),
}));
