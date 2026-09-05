import {
  ASRSegment,
  ASRTranscriptionResult,
  ProgressUpdate,
  TranscriptionOptions,
} from '../../shared/types/models.js';

export interface EngineInitOptions {
  device?: 'cpu' | 'cuda';
  computeType?: 'int8' | 'float16' | 'float32';
  cpuThreads?: number;
}

export type ProgressCallback = (update: ProgressUpdate) => void;
export type SegmentCallback = (segment: ASRSegment) => void;

/**
 * Abstract ASR Engine Interface
 * Decouples subtitle generation logic from specific inference backends
 * (faster-whisper, Whisper.cpp, ONNX, IndicConformer).
 */
export interface IASREngine {
  readonly name: string;
  readonly isInitialized: boolean;

  /**
   * Initializes engine resources or models.
   */
  initialize(options?: EngineInitOptions): Promise<void>;

  /**
   * Transcribes a standardized 16 kHz 16-bit mono PCM WAV audio file.
   * Emits progressive status updates and live segments as they are decoded.
   */
  transcribe(
    audioPath: string,
    options: TranscriptionOptions,
    onProgress?: ProgressCallback,
    onSegment?: SegmentCallback,
    signal?: AbortSignal
  ): Promise<ASRTranscriptionResult>;

  /**
   * Cleans up running processes or released memory.
   */
  dispose(): Promise<void>;
}
