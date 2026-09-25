import { ASREngineId } from '../../shared/types/models.js';
import { FasterWhisperEngine } from './fasterWhisperEngine.js';
import { IASREngine } from './types.js';

export type ASREngineFactory = () => IASREngine;

const engineFactories: Record<ASREngineId, ASREngineFactory> = {
  'faster-whisper': () => new FasterWhisperEngine(),
};

export function createASREngine(
  engineId: ASREngineId = 'faster-whisper'
): IASREngine {
  const factory = engineFactories[engineId];
  if (!factory) {
    throw new Error(`Unsupported ASR engine: ${engineId}`);
  }
  return factory();
}

export function getRegisteredEngineIds(): ASREngineId[] {
  return Object.keys(engineFactories) as ASREngineId[];
}
