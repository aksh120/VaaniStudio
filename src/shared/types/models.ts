/**
 * Core Domain Models for Vaani Studio
 * Strongly typed contracts shared across Main, Preload, and Renderer processes.
 */

export interface MediaInfo {
  filePath: string;
  fileName: string;
  durationSeconds: number;
  width?: number;
  height?: number;
  fps?: number;
  audioSampleRate?: number;
  audioChannels?: number;
  audioCodec?: string;
  videoCodec?: string;
  bitrate?: number;
  fileSizeBytes: number;
}

export interface WordTiming {
  id: string;
  word: string;
  startTime: number; // Seconds (e.g. 1.25)
  endTime: number;   // Seconds (e.g. 1.68)
  confidence: number; // 0.0 to 1.0
  punctuationFollows?: string;
}

export interface SubtitleEvent {
  id: string;
  index: number;
  startTime: number; // Seconds
  endTime: number;   // Seconds
  text: string;
  words: WordTiming[];
  speakerId?: string;
  speakerLabel?: string;
  cps?: number; // Characters per second reading speed
  cpl?: number; // Maximum characters per line
}

export type TextTransform = 'none' | 'uppercase' | 'lowercase';
export type HorizontalAlignment = 'left' | 'center' | 'right';
export type VerticalPosition = 'top' | 'middle' | 'bottom';

export interface SubtitlePosition {
  verticalPercent: number; // 0 (top) to 100 (bottom), default 85
  alignment: HorizontalAlignment;
}

export interface SubtitleStyle {
  id: string;
  name: string;
  fontFamily: string;
  fontSize: number; // In px relative to 1080p canvas baseline
  fontWeight: number | string; // e.g. 400, 600, 700, 800
  fontStyle?: 'normal' | 'italic';
  textTransform: TextTransform;
  letterSpacing: number; // px
  lineHeight: number; // multiplier e.g. 1.25
  
  // Fill & Highlight
  primaryColor: string; // Hex color e.g. #FFFFFF
  primaryOpacity: number; // 0.0 to 1.0
  activeWordColor: string; // Hex highlight color e.g. #FFD700
  
  // Outline / Stroke
  strokeColor: string;
  strokeWidth: number; // px
  
  // Drop Shadow
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  
  // Background Box
  hasBackgroundBox: boolean;
  backgroundColor: string;
  backgroundOpacity: number;
  boxPaddingX: number;
  boxPaddingY: number;
  boxBorderRadius: number;
  
  // Placement
  position: SubtitlePosition;
}

export type AnimationType = 'none' | 'fade' | 'pop' | 'slide-up' | 'bounce' | 'karaoke';

export interface AnimationConfig {
  entrance: AnimationType;
  exit: AnimationType;
  durationMs: number; // e.g. 150ms
  activeWordEmphasis: boolean;
  activeWordScale: number; // e.g. 1.05
}

export type LanguageMode = 'english' | 'hindi' | 'hinglish' | 'auto';
export type ScriptMode = 'exact' | 'roman' | 'devanagari' | 'cleaned';
export type PerformanceMode = 'fast' | 'balanced' | 'quality';

export interface ProjectSettings {
  languageMode: LanguageMode;
  scriptMode: ScriptMode;
  performanceMode: PerformanceMode;
  modelId: string;
  maxCharactersPerLine: number;
  maxLinesPerSubtitle: number;
  targetReadingSpeedCPS: number;
}

export interface ProjectData {
  projectVersion: number; // Current schema version: 1
  projectId: string;
  projectName: string;
  createdAt: string; // ISO 8601
  modifiedAt: string; // ISO 8601
  media: MediaInfo | null;
  settings: ProjectSettings;
  events: SubtitleEvent[];
  style: SubtitleStyle;
  animation: AnimationConfig;
}

export interface HardwareProfile {
  cpuModel: string;
  physicalCores: number;
  logicalCores: number;
  totalMemoryMB: number;
  gpuName?: string;
  gpuVramMB?: number;
  hasCudaSupport: boolean;
  recommendedMode: PerformanceMode;
  inferenceDevice: 'cpu' | 'cuda';
}

export interface ProgressUpdate {
  stage: 'extracting_audio' | 'vad' | 'transcribing' | 'segmenting' | 'rendering' | 'idle';
  percent: number; // 0 to 100
  message: string;
  etaSeconds?: number;
}

export interface DiagnosticLogEntry {
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  category: string;
  message: string;
}

export interface WaveformData {
  peaks: number[]; // Normalized amplitude values (0.0 to 1.0)
  durationSeconds: number;
  sampleRate: number;
  bucketsPerSecond: number;
}

export interface ThumbnailInfo {
  timestamp: number;
  filePath: string;
  width: number;
  height: number;
}

/**
 * IPC Channel definitions and Contract Types
 */
export const IPC_CHANNELS = {
  GET_HARDWARE_PROFILE: 'vaani:get-hardware-profile',
  PROBE_MEDIA: 'vaani:probe-media',
  SELECT_MEDIA_FILE: 'vaani:select-media-file',
  EXTRACT_AUDIO: 'vaani:extract-audio',
  GENERATE_WAVEFORM: 'vaani:generate-waveform',
  EXTRACT_FRAME: 'vaani:extract-frame',
  SAVE_PROJECT: 'vaani:save-project',
  LOAD_PROJECT: 'vaani:load-project',
  LOG_MESSAGE: 'vaani:log-message',
  PROGRESS_EVENT: 'vaani:progress-event',
} as const;

export interface IPCResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    actionableGuidance?: string;
  };
}
