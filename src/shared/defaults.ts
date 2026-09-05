import {
  ProjectData,
  ProjectSettings,
  SubtitleStyle,
  AnimationConfig,
} from './types/models.js';

export const DEFAULT_STYLE: SubtitleStyle = {
  id: 'preset-clean',
  name: 'Clean',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontSize: 44,
  fontWeight: 700,
  fontStyle: 'normal',
  textTransform: 'none',
  letterSpacing: 0.5,
  lineHeight: 1.25,
  primaryColor: '#FFFFFF',
  primaryOpacity: 1.0,
  activeWordColor: '#FACC15', // Vibrant yellow highlight
  strokeColor: '#000000',
  strokeWidth: 3,
  shadowColor: 'rgba(0, 0, 0, 0.75)',
  shadowBlur: 4,
  shadowOffsetX: 2,
  shadowOffsetY: 2,
  hasBackgroundBox: false,
  backgroundColor: 'rgba(0, 0, 0, 0.65)',
  backgroundOpacity: 0.65,
  boxPaddingX: 16,
  boxPaddingY: 8,
  boxBorderRadius: 8,
  position: {
    verticalPercent: 85,
    alignment: 'center',
  },
};

export const DEFAULT_ANIMATION: AnimationConfig = {
  entrance: 'pop',
  exit: 'fade',
  durationMs: 150,
  activeWordEmphasis: true,
  activeWordScale: 1.06,
};

export const DEFAULT_SETTINGS: ProjectSettings = {
  languageMode: 'hinglish',
  scriptMode: 'roman',
  performanceMode: 'balanced',
  modelId: 'whisper-small-ct2-int8',
  maxCharactersPerLine: 37,
  maxLinesPerSubtitle: 2,
  targetReadingSpeedCPS: 19,
};

export function createEmptyProject(name = 'Untitled Project'): ProjectData {
  const now = new Date().toISOString();
  return {
    projectVersion: 1,
    projectId: `proj-${Date.now()}`,
    projectName: name,
    createdAt: now,
    modifiedAt: now,
    media: null,
    settings: { ...DEFAULT_SETTINGS },
    events: [],
    style: { ...DEFAULT_STYLE },
    animation: { ...DEFAULT_ANIMATION },
  };
}
