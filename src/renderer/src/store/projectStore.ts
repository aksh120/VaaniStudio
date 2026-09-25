import { create } from 'zustand';
import {
  ProjectData,
  HardwareProfile,
  SubtitleEvent,
  SubtitleStyle,
  ProjectSettings,
  MediaInfo,
  WaveformData,
  CrashRecoveryEntry,
  TranscriptionRunMetadata,
} from '../../../shared/types/models.js';
import { createEmptyProject } from '../../../shared/defaults.js';
import { ActionableError } from '../../../shared/errors/errorTranslator.js';

interface ProjectState {
  project: ProjectData;
  hardware: HardwareProfile | null;
  audioWavPath: string | null;
  waveformData: WaveformData | null;
  currentTime: number;
  selectedEventId: string | null;
  isLoading: boolean;
  statusMessage: string;

  // Persistence & Reliability State
  isDirty: boolean;
  currentProjectFilePath: string | null;
  lastSavedAt: string | null;
  activeError: ActionableError | null;
  crashRecoveries: CrashRecoveryEntry[];

  // Actions
  setHardware: (hardware: HardwareProfile) => void;
  setMedia: (media: MediaInfo) => void;
  setAudioWavPath: (path: string | null) => void;
  setWaveformData: (data: WaveformData | null) => void;
  updateSettings: (settings: Partial<ProjectSettings>) => void;
  updateStyle: (style: Partial<SubtitleStyle>) => void;
  setEvents: (events: SubtitleEvent[]) => void;
  setLastTranscriptionRun: (run: TranscriptionRunMetadata) => void;
  addEvent: (event: SubtitleEvent) => void;
  selectEvent: (id: string | null) => void;
  setCurrentTime: (time: number) => void;
  setStatusMessage: (msg: string) => void;
  setIsLoading: (loading: boolean) => void;
  loadProjectData: (project: ProjectData, filePath?: string) => void;
  resetProject: () => void;

  // Persistence & Error Actions
  setIsDirty: (isDirty: boolean) => void;
  setProjectFilePath: (path: string | null) => void;
  setLastSavedAt: (timestamp: string | null) => void;
  setActiveError: (error: ActionableError | null) => void;
  setCrashRecoveries: (recoveries: CrashRecoveryEntry[]) => void;
  dismissCrashRecovery: (projectId: string) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  project: createEmptyProject(),
  hardware: null,
  audioWavPath: null,
  waveformData: null,
  currentTime: 0,
  selectedEventId: null,
  isLoading: false,
  statusMessage: 'Ready',

  isDirty: false,
  currentProjectFilePath: null,
  lastSavedAt: null,
  activeError: null,
  crashRecoveries: [],

  setHardware: (hardware) => set({ hardware }),
  setAudioWavPath: (audioWavPath) => set({ audioWavPath }),
  setWaveformData: (waveformData) => set({ waveformData }),

  setMedia: (media) =>
    set((state) => ({
      isDirty: true,
      project: {
        ...state.project,
        media,
        modifiedAt: new Date().toISOString(),
      },
    })),

  updateSettings: (newSettings) =>
    set((state) => ({
      isDirty: true,
      project: {
        ...state.project,
        settings: { ...state.project.settings, ...newSettings },
        modifiedAt: new Date().toISOString(),
      },
    })),

  updateStyle: (newStyle) =>
    set((state) => ({
      isDirty: true,
      project: {
        ...state.project,
        style: { ...state.project.style, ...newStyle },
        modifiedAt: new Date().toISOString(),
      },
    })),

  setEvents: (events) =>
    set((state) => ({
      isDirty: true,
      project: {
        ...state.project,
        events,
        modifiedAt: new Date().toISOString(),
      },
    })),

  setLastTranscriptionRun: (run) =>
    set((state) => ({
      isDirty: true,
      project: {
        ...state.project,
        lastTranscriptionRun: run,
        modifiedAt: new Date().toISOString(),
      },
    })),

  addEvent: (event) =>
    set((state) => ({
      isDirty: true,
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

  loadProjectData: (project, filePath) =>
    set({
      project,
      audioWavPath: null,
      waveformData: null,
      currentTime: 0,
      selectedEventId: null,
      isDirty: false,
      currentProjectFilePath: filePath || null,
      lastSavedAt: filePath ? project.modifiedAt || new Date().toISOString() : null,
    }),

  resetProject: () =>
    set({
      project: createEmptyProject(),
      audioWavPath: null,
      waveformData: null,
      currentTime: 0,
      selectedEventId: null,
      isDirty: false,
      currentProjectFilePath: null,
      lastSavedAt: null,
    }),

  setIsDirty: (isDirty) => set({ isDirty }),
  setProjectFilePath: (currentProjectFilePath) => set({ currentProjectFilePath }),
  setLastSavedAt: (lastSavedAt) => set({ lastSavedAt, isDirty: false }),
  setActiveError: (activeError) => set({ activeError }),
  setCrashRecoveries: (crashRecoveries) => set({ crashRecoveries }),
  dismissCrashRecovery: (projectId) =>
    set((state) => ({
      crashRecoveries: state.crashRecoveries.filter((r) => r.projectId !== projectId),
    })),
}));
