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
  speakerId?: string;
}

export interface SpeakerProfile {
  id: string;
  name: string;
  color: string;
  styleOverrides?: Partial<SubtitleStyle>;
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

  // Kinetic Animation
  animation?: AnimationConfig;
}

export interface StylePreset {
  id: string;
  name: string;
  description: string;
  isBuiltIn: boolean;
  style: SubtitleStyle;
}

export type AnimationType = 'none' | 'fade' | 'pop' | 'slide-up' | 'bounce' | 'karaoke';
export type KaraokeHighlightMode = 'step' | 'sweep';

export interface AnimationConfig {
  entrance: AnimationType;
  exit: AnimationType;
  durationMs: number; // e.g. 150ms
  activeWordEmphasis: boolean;
  activeWordScale: number; // e.g. 1.05
  karaokeMode: KaraokeHighlightMode;
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

export const CURRENT_PROJECT_VERSION = 1;

export interface ProjectExportRecord {
  id: string;
  format: 'srt' | 'vtt' | 'ass' | 'mp4';
  timestamp: string;
  outputPath: string;
  resolution?: string;
  fileSizeBytes?: number;
}

export interface CrashRecoveryEntry {
  projectId: string;
  projectName: string;
  originalFilePath?: string;
  autosavePath: string;
  timestamp: string;
  eventCount: number;
  mediaFileName?: string;
}

export interface DeepSystemScanResult {
  allowed: boolean;
  scannedAt: string;
  osName: string;
  cpuDetails: {
    name: string;
    physicalCores: number;
    logicalCores: number;
    maxClockGhz?: number;
    hasAvx2: boolean;
  };
  gpuDetails: {
    name: string;
    vramMB: number;
    isDedicated: boolean;
    hasCuda: boolean;
  };
  ramDetails: {
    totalMB: number;
    availableMB: number;
  };
  recommendedModelId: string;
  recommendationReason: string;
  estimatedSpeedFactor: string;
}

export interface OnboardingStatus {
  isFirstRun: boolean;
  hasCompletedOnboarding: boolean;
  recommendedModelId: string;
  downloadedModelIds: string[];
  allowDeepSystemScan?: boolean;
}

export interface ModelIntegrityResult {
  valid: boolean;
  modelId: string;
  filesChecked: string[];
  totalBytes: number;
  sha256?: string;
  error?: string;
}

export interface ProjectData {
  projectVersion: number; // Current schema version: 1
  projectId: string;
  projectName: string;
  createdAt: string; // ISO 8601
  modifiedAt: string; // ISO 8601
  media: MediaInfo | null;
  relativeMediaPath?: string;
  mediaHash?: string;
  settings: ProjectSettings;
  events: SubtitleEvent[];
  style: SubtitleStyle;
  animation: AnimationConfig;
  exportHistory?: ProjectExportRecord[];
  speakers?: SpeakerProfile[];
}

export interface BatchJobItem {
  id: string;
  filePath: string;
  fileName: string;
  status: 'queued' | 'extracting' | 'transcribing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  durationSeconds?: number;
  outputPath?: string;
  error?: string;
}

export interface BatchJobConfig {
  languageMode: LanguageMode;
  scriptMode: ScriptMode;
  modelId: string;
  exportFormat: 'srt' | 'vtt' | 'ass';
  outputDirectory: string;
  renderVideo?: boolean;
  autoDiarize?: boolean;
}

export interface BatchQueueState {
  isProcessing: boolean;
  activeItemId: string | null;
  items: BatchJobItem[];
  completedCount: number;
  totalCount: number;
}

export interface MemoryStats {
  rssMB: number;
  heapUsedMB: number;
  heapTotalMB: number;
  externalMB: number;
  systemFreeMB: number;
  systemTotalMB: number;
  timestamp: string;
}

export interface CPUAllocationConfig {
  asrThreads: number;
  ffmpegThreads: number;
  reservedUIThreads: number;
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
  allocatedThreads?: CPUAllocationConfig;
  memoryStats?: MemoryStats;
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

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  sizeMB: number;
  parameters: string;
  isDownloaded: boolean;
  isRecommended: boolean;
  localPath?: string;
}

export interface TranscriptionOptions {
  modelId: string;
  language?: string;
  scriptMode?: ScriptMode;
  beamSize?: number;
  temperature?: number;
  vadFilter?: boolean;
  initialPrompt?: string;
}

export interface ASRWord {
  word: string;
  startTime: number;
  endTime: number;
  confidence: number;
}

export interface ASRSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  words: ASRWord[];
}

export interface ASRTranscriptionResult {
  language: string;
  durationSeconds: number;
  segments: ASRSegment[];
  classification?: 'pure_english' | 'pure_hindi' | 'code_switched_hinglish';
}

/**
 * Phase 9: Subtitle Export and Video Rendering Types
 */
export type SubtitleFormat = 'srt' | 'vtt' | 'ass';

export interface SubtitleExportOptions {
  format: SubtitleFormat;
  outputPath?: string;
  includeKaraoke?: boolean;
  encoding?: 'utf-8' | 'utf-8-bom';
}

export type VideoExportResolution = 'original' | '720p' | '1080p' | '4k';
export type VideoExportPreset = 'ultrafast' | 'fast' | 'medium' | 'slow';

export interface VideoRenderOptions {
  inputVideoPath: string;
  outputPath: string;
  resolution: VideoExportResolution;
  crf?: number; // 18-28, default 20
  preset?: VideoExportPreset; // default 'fast'
  encoder?: 'libx264' | 'h264_qsv' | 'h264_nvenc' | 'auto';
  audioBitrate?: string;
  includeKaraoke?: boolean;
}

export interface RenderProgressUpdate {
  jobId: string;
  status: 'rendering' | 'completed' | 'failed' | 'cancelled';
  percent: number; // 0 to 100
  currentFrame?: number;
  fps?: number;
  speed?: string;
  elapsedSeconds: number;
  etaSeconds?: number;
  outputPath?: string;
  error?: string;
}

/**
 * IPC Channel definitions and Contract Types
 */
export const IPC_CHANNELS = {
  GET_HARDWARE_PROFILE: 'vaani:get-hardware-profile',
  PROBE_MEDIA: 'vaani:probe-media',
  SELECT_MEDIA_FILE: 'vaani:select-media-file',
  SELECT_SAVE_PATH: 'vaani:select-save-path',
  EXTRACT_AUDIO: 'vaani:extract-audio',
  GENERATE_WAVEFORM: 'vaani:generate-waveform',
  EXTRACT_FRAME: 'vaani:extract-frame',
  GET_MODELS: 'vaani:get-models',
  DOWNLOAD_MODEL: 'vaani:download-model',
  DELETE_MODEL: 'vaani:delete-model',
  START_TRANSCRIPTION: 'vaani:start-transcription',
  CANCEL_TRANSCRIPTION: 'vaani:cancel-transcription',
  SAVE_PROJECT: 'vaani:save-project',
  LOAD_PROJECT: 'vaani:load-project',
  CHECK_CRASH_RECOVERY: 'vaani:check-crash-recovery',
  DISCARD_CRASH_RECOVERY: 'vaani:discard-crash-recovery',
  SAVE_AUTOSAVE_SNAPSHOT: 'vaani:save-autosave-snapshot',
  GET_DIAGNOSTIC_REPORT: 'vaani:get-diagnostic-report',
  CHECK_ONBOARDING_STATUS: 'vaani:check-onboarding-status',
  COMPLETE_ONBOARDING: 'vaani:complete-onboarding',
  VERIFY_MODEL_INTEGRITY: 'vaani:verify-model-integrity',
  GET_CUSTOM_PRESETS: 'vaani:get-custom-presets',
  SAVE_CUSTOM_PRESET: 'vaani:save-custom-preset',
  DELETE_CUSTOM_PRESET: 'vaani:delete-custom-preset',
  EXPORT_PRESET_FILE: 'vaani:export-preset-file',
  IMPORT_PRESET_FILE: 'vaani:import-preset-file',
  EXPORT_SUBTITLES: 'vaani:export-subtitles',
  START_RENDER_VIDEO: 'vaani:start-render-video',
  CANCEL_RENDER_VIDEO: 'vaani:cancel-render-video',
  RENDER_PROGRESS_EVENT: 'vaani:render-progress-event',
  SHOW_ITEM_IN_FOLDER: 'vaani:show-item-in-folder',
  GET_MEMORY_STATS: 'vaani:get-memory-stats',
  CLEAN_CACHE: 'vaani:clean-cache',
  DIARIZE_SUBTITLES: 'vaani:diarize-subtitles',
  START_BATCH_QUEUE: 'vaani:start-batch-queue',
  CANCEL_BATCH_QUEUE: 'vaani:cancel-batch-queue',
  GET_BATCH_STATUS: 'vaani:get-batch-status',
  CLEAR_BATCH_QUEUE: 'vaani:clear-batch-queue',
  BATCH_PROGRESS_EVENT: 'vaani:batch-progress-event',
  RUN_DEEP_SYSTEM_SCAN: 'vaani:run-deep-system-scan',
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
