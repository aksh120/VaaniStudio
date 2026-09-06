/**
 * Default Built-in Professional Style Presets
 * Curated collection of broadcast-quality subtitle styling presets for Vaani Studio.
 */

import { StylePreset } from '../types/models.js';

export const BUILT_IN_PRESETS: StylePreset[] = [
  {
    id: 'preset_clean',
    name: 'Clean',
    description: 'Restrained modern sans-serif with subtle shadow. Optimal for long-form YouTube, education, and documentaries.',
    isBuiltIn: true,
    style: {
      id: 'style_clean',
      name: 'Clean',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 44,
      fontWeight: 600,
      fontStyle: 'normal',
      textTransform: 'none',
      letterSpacing: 0,
      lineHeight: 1.3,
      primaryColor: '#FFFFFF',
      primaryOpacity: 1.0,
      activeWordColor: '#60A5FA', // Sky blue highlight
      strokeColor: '#000000',
      strokeWidth: 0,
      shadowColor: '#000000',
      shadowBlur: 8,
      shadowOffsetX: 0,
      shadowOffsetY: 2,
      hasBackgroundBox: false,
      backgroundColor: '#000000',
      backgroundOpacity: 0.7,
      boxPaddingX: 14,
      boxPaddingY: 6,
      boxBorderRadius: 6,
      position: {
        alignment: 'center',
        verticalPercent: 85,
      },
    },
  },
  {
    id: 'preset_minimal',
    name: 'Minimal Pill',
    description: 'Clean white typography on a translucent dark pill background box with rounded corners.',
    isBuiltIn: true,
    style: {
      id: 'style_minimal',
      name: 'Minimal Pill',
      fontFamily: 'Roboto, system-ui, sans-serif',
      fontSize: 40,
      fontWeight: 600,
      fontStyle: 'normal',
      textTransform: 'none',
      letterSpacing: 0.5,
      lineHeight: 1.35,
      primaryColor: '#FFFFFF',
      primaryOpacity: 1.0,
      activeWordColor: '#FACC15', // Amber active word
      strokeColor: '#000000',
      strokeWidth: 0,
      shadowColor: 'transparent',
      shadowBlur: 0,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      hasBackgroundBox: true,
      backgroundColor: '#0F172A', // Slate dark
      backgroundOpacity: 0.85,
      boxPaddingX: 16,
      boxPaddingY: 8,
      boxBorderRadius: 10,
      position: {
        alignment: 'center',
        verticalPercent: 85,
      },
    },
  },
  {
    id: 'preset_podcast',
    name: 'Podcast Warm',
    description: 'Warm cream tones and bold medium weight. Conveys warmth and high authority for interviews and podcasts.',
    isBuiltIn: true,
    style: {
      id: 'style_podcast',
      name: 'Podcast Warm',
      fontFamily: 'Outfit, Inter, sans-serif',
      fontSize: 46,
      fontWeight: 700,
      fontStyle: 'normal',
      textTransform: 'none',
      letterSpacing: 0,
      lineHeight: 1.28,
      primaryColor: '#FDFBF7', // Cream warm white
      primaryOpacity: 1.0,
      activeWordColor: '#FB923C', // Warm orange
      strokeColor: '#1E1E1E',
      strokeWidth: 2,
      shadowColor: '#000000',
      shadowBlur: 6,
      shadowOffsetX: 0,
      shadowOffsetY: 3,
      hasBackgroundBox: false,
      backgroundColor: '#1E1B18',
      backgroundOpacity: 0.8,
      boxPaddingX: 14,
      boxPaddingY: 6,
      boxBorderRadius: 6,
      position: {
        alignment: 'center',
        verticalPercent: 85,
      },
    },
  },
  {
    id: 'preset_karaoke',
    name: 'Karaoke Pop',
    description: 'High-contrast white text with vibrant gold active-word tracking for dynamic lyric and speech pacing.',
    isBuiltIn: true,
    style: {
      id: 'style_karaoke',
      name: 'Karaoke Pop',
      fontFamily: 'Inter, Montserrat, sans-serif',
      fontSize: 48,
      fontWeight: 800,
      fontStyle: 'normal',
      textTransform: 'none',
      letterSpacing: 0.5,
      lineHeight: 1.25,
      primaryColor: '#FFFFFF',
      primaryOpacity: 1.0,
      activeWordColor: '#FFD700', // Vivid gold
      strokeColor: '#000000',
      strokeWidth: 3,
      shadowColor: '#000000',
      shadowBlur: 8,
      shadowOffsetX: 1,
      shadowOffsetY: 2,
      hasBackgroundBox: false,
      backgroundColor: '#000000',
      backgroundOpacity: 0.7,
      boxPaddingX: 14,
      boxPaddingY: 6,
      boxBorderRadius: 6,
      position: {
        alignment: 'center',
        verticalPercent: 82,
      },
    },
  },
  {
    id: 'preset_punch',
    name: 'Punch Reels',
    description: 'Bold uppercase font, heavy black stroke, and electric yellow active highlight for high retention shorts.',
    isBuiltIn: true,
    style: {
      id: 'style_punch',
      name: 'Punch Reels',
      fontFamily: 'Montserrat, Impact, sans-serif',
      fontSize: 54,
      fontWeight: 900,
      fontStyle: 'normal',
      textTransform: 'uppercase',
      letterSpacing: 1.2,
      lineHeight: 1.2,
      primaryColor: '#FFFFFF',
      primaryOpacity: 1.0,
      activeWordColor: '#FFE500', // Electric yellow
      strokeColor: '#000000',
      strokeWidth: 5,
      shadowColor: '#000000',
      shadowBlur: 10,
      shadowOffsetX: 2,
      shadowOffsetY: 3,
      hasBackgroundBox: false,
      backgroundColor: '#000000',
      backgroundOpacity: 0.8,
      boxPaddingX: 16,
      boxPaddingY: 8,
      boxBorderRadius: 8,
      position: {
        alignment: 'center',
        verticalPercent: 78,
      },
    },
  },
  {
    id: 'preset_neon',
    name: 'Neon Glow',
    description: 'Cyberpunk futuristic neon aura with vivid cyan text and glowing backdrop for modern tech and gaming.',
    isBuiltIn: true,
    style: {
      id: 'style_neon',
      name: 'Neon Glow',
      fontFamily: 'Outfit, Montserrat, sans-serif',
      fontSize: 48,
      fontWeight: 800,
      fontStyle: 'normal',
      textTransform: 'none',
      letterSpacing: 1.5,
      lineHeight: 1.25,
      primaryColor: '#E0FFFF', // Ice cyan
      primaryOpacity: 1.0,
      activeWordColor: '#FF007F', // Neon magenta
      strokeColor: '#0A0017', // Deep midnight purple
      strokeWidth: 3,
      shadowColor: '#00E5FF', // Vivid cyan glow
      shadowBlur: 18,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      hasBackgroundBox: false,
      backgroundColor: '#0A0A14',
      backgroundOpacity: 0.8,
      boxPaddingX: 14,
      boxPaddingY: 6,
      boxBorderRadius: 6,
      position: {
        alignment: 'center',
        verticalPercent: 85,
      },
    },
  },
  {
    id: 'preset_cinematic',
    name: 'Cinematic Serif',
    description: 'Classic serif typography with expanded letter spacing. Letterbox safe for cinematic storytelling.',
    isBuiltIn: true,
    style: {
      id: 'style_cinematic',
      name: 'Cinematic Serif',
      fontFamily: 'Georgia, Merriweather, serif',
      fontSize: 42,
      fontWeight: 400,
      fontStyle: 'italic',
      textTransform: 'none',
      letterSpacing: 2.5,
      lineHeight: 1.4,
      primaryColor: '#FFFDF5', // Warm antique white
      primaryOpacity: 0.95,
      activeWordColor: '#F59E0B',
      strokeColor: '#000000',
      strokeWidth: 1,
      shadowColor: '#000000',
      shadowBlur: 12,
      shadowOffsetX: 0,
      shadowOffsetY: 3,
      hasBackgroundBox: false,
      backgroundColor: '#000000',
      backgroundOpacity: 0.7,
      boxPaddingX: 14,
      boxPaddingY: 6,
      boxBorderRadius: 4,
      position: {
        alignment: 'center',
        verticalPercent: 88,
      },
    },
  },
];

/**
 * Get built-in preset by ID
 */
export function getBuiltInPreset(id: string): StylePreset | undefined {
  return BUILT_IN_PRESETS.find((p) => p.id === id);
}

/**
 * Default fallback subtitle style (Clean preset)
 */
export const DEFAULT_SUBTITLE_STYLE = BUILT_IN_PRESETS[0].style;
