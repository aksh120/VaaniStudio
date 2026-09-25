import fs from 'node:fs';
import { spawn, ChildProcess } from 'node:child_process';
import readline from 'node:readline';
import {
  ASRComputeType,
  ASRSegment,
  ASRTranscriptionResult,
  InferenceDevice,
  TranscriptionOptions,
} from '../../shared/types/models.js';
import { logger } from '../logger.js';
import { IASREngine, EngineInitOptions, ProgressCallback, SegmentCallback } from './types.js';
import { resolvePythonPath } from './pythonResolver.js';
import { resolveInferenceDevice } from './gpuFallback.js';
import { getModelPath, isModelDownloaded, MODEL_CATALOG } from './modelManager.js';
import { classifyLanguage } from '../../shared/intelligence/languageClassifier.js';
import { getOptimalASRThreads, applyWorkerProcessPriority } from '../hardware/cpuAllocation.js';
import {
  filterHallucinatedSegments,
  isHallucinatorySegment,
} from '../../shared/intelligence/hallucinationDetector.js';
import { resolveWorkerScriptPath } from './workerResolver.js';

export class FasterWhisperEngine implements IASREngine {
  public readonly name = 'faster-whisper';
  public isInitialized = false;

  private pythonPath: string | null = null;
  private workerScriptPath: string;
  private defaultDevice: InferenceDevice = 'cpu';
  private defaultComputeType: ASRComputeType = 'int8';

  constructor() {
    this.workerScriptPath = resolveWorkerScriptPath();
  }

  public async initialize(options?: EngineInitOptions): Promise<void> {
    this.pythonPath = resolvePythonPath();
    const resolution = resolveInferenceDevice();
    this.defaultDevice = options?.device || resolution.device;
    this.defaultComputeType = options?.computeType || resolution.computeType;
    this.isInitialized = true;
    logger.info('ASR', `Initialized ${this.name} engine (Device: ${this.defaultDevice}, Compute: ${this.defaultComputeType})`);
  }

  public async transcribe(
    audioPath: string,
    options: TranscriptionOptions,
    onProgress?: ProgressCallback,
    onSegment?: SegmentCallback,
    signal?: AbortSignal
  ): Promise<ASRTranscriptionResult> {
    if (!this.isInitialized || !this.pythonPath) {
      await this.initialize();
    }

    if (signal?.aborted) {
      throw new Error('Transcription aborted prior to execution.');
    }

    if (!fs.existsSync(audioPath)) {
      throw new Error(`Audio file does not exist: ${audioPath}`);
    }

    const catalogEntry = MODEL_CATALOG.find((entry) => entry.id === options.modelId);
    let modelTarget: string;
    if (fs.existsSync(options.modelId) && fs.statSync(options.modelId).isDirectory()) {
      modelTarget = options.modelId;
    } else if (catalogEntry && isModelDownloaded(options.modelId)) {
      modelTarget = getModelPath(options.modelId);
    } else if (!catalogEntry) {
      throw new Error(`Unknown speech model: ${options.modelId}`);
    } else {
      throw new Error(`Speech model is not downloaded: ${catalogEntry.name}. Download it from Settings before starting transcription.`);
    }

    if (fs.existsSync(modelTarget)) {
      const modelFiles = fs.readdirSync(modelTarget);
      const hasTokenizer = modelFiles.includes('tokenizer.json');
      const hasVocabulary = modelFiles.some((file) => file.startsWith('vocabulary.'));
      if (!hasTokenizer || !hasVocabulary) {
        throw new Error(`Speech model is incomplete: ${catalogEntry?.name || options.modelId}. Required tokenizer and vocabulary files are missing.`);
      }
    }

    const device = options.device || this.defaultDevice;
    const computeType = options.computeType || this.defaultComputeType;
    const threads = options.cpuThreads || getOptimalASRThreads();

    const effectiveLanguage = options.language === 'hinglish' ? 'auto' : (options.language || 'auto');
    const initialPrompt = options.initialPrompt;

    this.workerScriptPath = resolveWorkerScriptPath();
    const args = [
      this.workerScriptPath,
      'transcribe',
      audioPath,
      '--model', modelTarget,
      '--device', device,
      '--compute-type', computeType,
      '--threads', String(threads),
      '--language', effectiveLanguage,
      '--beam-size', String(options.beamSize ?? 5),
    ];

    if (initialPrompt) {
      args.push('--initial-prompt', initialPrompt);
    }

    if (options.temperature !== undefined) {
      args.push('--temperature', String(options.temperature));
    }

    if (options.vadFilter === false) {
      args.push('--no-vad');
    } else {
      args.push('--vad');
    }

    // Mitigate autoregressive hallucination loops
    args.push('--no-condition-on-previous-text');

    logger.info('ASR', `Spawning worker: ${this.pythonPath} ${args.slice(1).join(' ')}`);

    return new Promise<ASRTranscriptionResult>((resolve, reject) => {
      let child: ChildProcess | null = null;
      let stderrOutput = '';
      let isSettled = false;
      const accumulatedSegments: ASRSegment[] = [];
      let detectedLanguage = options.language || 'en';
      let totalDuration = 0;

      const cleanup = () => {
        if (signal) {
          signal.removeEventListener('abort', handleAbort);
        }
      };

      const handleAbort = () => {
        if (isSettled) return;
        isSettled = true;
        cleanup();
        logger.warn('ASR', 'Transcription cancelled by user signal.');
        if (child && child.pid) {
          try {
            if (process.platform === 'win32') {
              spawn('taskkill', ['/pid', String(child.pid), '/f', '/t'], { windowsHide: true });
            } else {
              child.kill('SIGTERM');
            }
          } catch {
            // Ignore kill errors
          }
        }
        reject(new Error('Transcription cancelled.'));
      };

      if (signal) {
        signal.addEventListener('abort', handleAbort);
      }

      try {
        child = spawn(this.pythonPath!, args, {
          windowsHide: true,
          stdio: ['ignore', 'pipe', 'pipe'],
        });
        if (child.pid) {
          applyWorkerProcessPriority(child.pid);
        }
      } catch (err: any) {
        cleanup();
        return reject(new Error(`Failed to spawn Python ASR worker: ${err?.message}`));
      }

      const rl = readline.createInterface({
        input: child.stdout!,
        terminal: false,
      });

      rl.on('line', (line) => {
        const trimmed = line.trim();
        if (!trimmed.startsWith('{')) {
          return;
        }

        try {
          const msg = JSON.parse(trimmed);
          switch (msg.type) {
            case 'status':
              onProgress?.({
                stage: 'transcribing',
                percent: 0,
                message: msg.message,
              });
              break;

            case 'info':
              totalDuration = msg.duration || 0;
              detectedLanguage = msg.language || detectedLanguage;
              onProgress?.({
                stage: 'transcribing',
                percent: 0,
                message: `Language detected: ${detectedLanguage} (${Math.round((msg.language_probability || 1) * 100)}% confidence)`,
              });
              break;

            case 'progress':
              onProgress?.({
                stage: 'transcribing',
                percent: msg.percent,
                message: `Transcribing audio (${msg.percent}%)...`,
              });
              break;

            case 'segment': {
              const rawSeg: ASRSegment = {
                id: msg.id,
                startTime: msg.startTime,
                endTime: msg.endTime,
                text: msg.text,
                words: msg.words || [],
                avgLogprob: msg.avgLogprob,
                noSpeechProbability: msg.noSpeechProbability,
                compressionRatio: msg.compressionRatio,
              };
               if (options.scriptMode === 'exact' || !isHallucinatorySegment(rawSeg)) {
                 accumulatedSegments.push(rawSeg);
                 onSegment?.(rawSeg);
               }
              break;
            }

            case 'done':
              detectedLanguage = msg.language || detectedLanguage;
              totalDuration = msg.duration || totalDuration;
              break;

            case 'error':
              logger.error('ASR', `Worker error: ${msg.message}`);
              if (!isSettled) {
                isSettled = true;
                cleanup();
                reject(new Error(msg.message));
              }
              break;
          }
        } catch {
          // Non-JSON line ignored
        }
      });

      child.stderr?.on('data', (chunk) => {
        stderrOutput += chunk.toString();
      });

      child.on('error', (err) => {
        if (!isSettled) {
          isSettled = true;
          cleanup();
          reject(new Error(`Worker process execution error: ${err.message}`));
        }
      });

      child.on('close', (code) => {
        if (isSettled) return;
        isSettled = true;
        cleanup();

        if (code === 0) {
          onProgress?.({
            stage: 'idle',
            percent: 100,
            message: 'Transcription complete.',
          });

           const finalSegments = options.scriptMode === 'exact'
             ? accumulatedSegments
             : filterHallucinatedSegments(accumulatedSegments);
          const fullText = finalSegments.map((s) => s.text).join(' ');
          const classificationResult = classifyLanguage(fullText);

          resolve({
            language: detectedLanguage,
            durationSeconds: totalDuration,
            segments: finalSegments,
            classification: classificationResult.classification,
          });
        } else {
          logger.error('ASR', `Worker exited with code ${code}. Stderr: ${stderrOutput}`);
          reject(new Error(`ASR worker exited with error code ${code}: ${stderrOutput || 'Unknown error'}`));
        }
      });
    });
  }

  public async dispose(): Promise<void> {
    this.isInitialized = false;
    logger.info('ASR', `Disposed ${this.name} engine`);
  }
}
