import {
  ASRComputeType,
  ASREngineId,
  InferenceDevice,
  LanguageMode,
  ModelSelectionSource,
  PerformanceMode,
  ScriptMode,
  TranscriptionOptions,
} from './types/models.js';
import { getPerformanceProfileConfig } from './hardware/hardwareProfiles.js';

export interface TranscriptionRequestSettings {
  languageMode: LanguageMode;
  scriptMode?: ScriptMode;
  performanceMode?: PerformanceMode;
  modelId?: string;
  modelSelectionSource?: ModelSelectionSource;
}

export interface TranscriptionRequestHardware {
  inferenceDevice?: InferenceDevice;
  inferenceComputeType?: ASRComputeType;
  physicalCores?: number;
  logicalCores?: number;
  allocatedThreads?: {
    asrThreads: number;
  };
}

export interface ResolveTranscriptionRequestInput {
  settings: TranscriptionRequestSettings;
  hardware?: TranscriptionRequestHardware;
  options?: Partial<TranscriptionOptions>;
}

export interface ResolvedTranscriptionRequest extends TranscriptionOptions {
  engineId: ASREngineId;
  modelId: string;
  performanceMode: PerformanceMode;
  modelSelectionSource: ModelSelectionSource;
  language: string;
  beamSize: number;
  temperature: number;
  vadFilter: boolean;
  device: InferenceDevice;
  computeType: ASRComputeType;
  cpuThreads: number;
}

export function mapLanguageModeToEngineLanguage(
  languageMode: LanguageMode
): 'en' | 'hi' | 'auto' {
  if (languageMode === 'english') return 'en';
  if (languageMode === 'hindi') return 'hi';
  return 'auto';
}

export function resolveTranscriptionRequest({
  settings,
  hardware,
  options,
}: ResolveTranscriptionRequestInput): ResolvedTranscriptionRequest {
  const requestedPerformanceMode =
    options?.performanceMode ?? settings.performanceMode ?? 'balanced';
  const cpu =
    hardware?.physicalCores !== undefined || hardware?.logicalCores !== undefined
      ? {
          physicalCores: hardware.physicalCores ?? 0,
          logicalCores: hardware.logicalCores ?? 0,
        }
      : undefined;
  const profile = getPerformanceProfileConfig(requestedPerformanceMode, cpu);
  const performanceMode = profile.mode;
  const hasExplicitModel =
    typeof options?.modelId === 'string' && options.modelId.trim().length > 0;
  const requestedModelSelectionSource =
    options?.modelSelectionSource ??
    (hasExplicitModel ? 'user' : settings.modelSelectionSource);
  const modelSelectionSource =
    requestedModelSelectionSource === 'user'
      ? 'user'
      : requestedModelSelectionSource === 'profile'
      ? 'profile'
      : hasExplicitModel
      ? 'user'
      : 'profile';
  const configuredModelId = hasExplicitModel ? options.modelId : settings.modelId;
  const modelId = configuredModelId || profile.modelId;
  const device = options?.device ?? hardware?.inferenceDevice ?? 'cpu';
  const hardwareComputeType =
    hardware?.inferenceDevice === device
      ? hardware.inferenceComputeType
      : undefined;
  const computeType =
    options?.computeType ??
    hardwareComputeType ??
    (device === 'cuda' ? 'float16' : 'int8');
  const configuredThreads = hardware?.allocatedThreads?.asrThreads;
  const cpuThreads =
    typeof options?.cpuThreads === 'number' && options.cpuThreads > 0
      ? options.cpuThreads
      : typeof configuredThreads === 'number' && configuredThreads > 0
      ? configuredThreads
      : profile.asrThreads;

  return {
    ...options,
    engineId: options?.engineId ?? profile.engineId,
    modelId,
    performanceMode,
    modelSelectionSource,
    language: options?.language ?? mapLanguageModeToEngineLanguage(settings.languageMode),
    scriptMode: options?.scriptMode ?? settings.scriptMode,
    beamSize: options?.beamSize ?? profile.beamSize,
    temperature: options?.temperature ?? profile.temperature,
    vadFilter: options?.vadFilter ?? profile.vadFilter,
    device,
    computeType,
    cpuThreads,
  };
}
