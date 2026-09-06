/**
 * Subtitle Style Serialization Engine
 * Bidirectional serialization between SubtitleStyle, JSON (.vstyle.json), and ASS [V4+ Styles] format.
 */

import {
  SubtitleStyle,
  HorizontalAlignment,
} from '../types/models.js';

export interface AssScriptResolution {
  playResX: number;
  playResY: number;
}

export const DEFAULT_SCRIPT_RESOLUTION: AssScriptResolution = {
  playResX: 1920,
  playResY: 1080,
};

/**
 * Standard ASS [V4+ Styles] Format Header
 */
export const ASS_STYLE_FORMAT_HEADER =
  'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding';

/**
 * Convert Hex or CSS RGBA color + opacity to ASS hex color string &HAABBGGRR
 * Note: In ASS, Alpha is inverted (00 is fully opaque, FF is fully transparent)
 * and byte order is Blue-Green-Red (BGR) instead of RGB.
 */
export function colorToAss(colorInput: string, opacity: number = 1.0): string {
  let r = 255;
  let g = 255;
  let b = 255;
  let alpha = Math.max(0, Math.min(1, opacity));

  if (!colorInput) {
    return '&H00FFFFFF';
  }

  const clean = colorInput.trim();

  // Check rgba(r, g, b, a) or rgb(r, g, b)
  const rgbMatch = clean.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)$/i);
  if (rgbMatch) {
    r = parseInt(rgbMatch[1], 10);
    g = parseInt(rgbMatch[2], 10);
    b = parseInt(rgbMatch[3], 10);
    if (rgbMatch[4] !== undefined) {
      alpha *= parseFloat(rgbMatch[4]);
    }
  } else if (clean.startsWith('#')) {
    const hex = clean.substring(1);
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    } else if (hex.length === 8) {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
      const a = parseInt(hex.substring(6, 8), 16);
      alpha *= a / 255;
    }
  }

  // Clamping
  r = Math.max(0, Math.min(255, Math.round(r)));
  g = Math.max(0, Math.min(255, Math.round(g)));
  b = Math.max(0, Math.min(255, Math.round(b)));

  // ASS alpha: 00 = completely opaque (alpha=1), FF = completely transparent (alpha=0)
  const assAlphaNum = Math.max(0, Math.min(255, Math.round((1 - alpha) * 255)));

  const aHex = assAlphaNum.toString(16).padStart(2, '0').toUpperCase();
  const bHex = b.toString(16).padStart(2, '0').toUpperCase();
  const gHex = g.toString(16).padStart(2, '0').toUpperCase();
  const rHex = r.toString(16).padStart(2, '0').toUpperCase();

  return `&H${aHex}${bHex}${gHex}${rHex}`;
}

/**
 * Convert ASS hex color string &HAABBGGRR back to hex (#RRGGBB) and opacity (0.0 to 1.0)
 */
export function assToColor(assColor: string): { hex: string; opacity: number } {
  if (!assColor || typeof assColor !== 'string') {
    return { hex: '#FFFFFF', opacity: 1.0 };
  }

  let cleaned = assColor.trim().toUpperCase();
  if (cleaned.startsWith('&H')) {
    cleaned = cleaned.substring(2);
  }
  if (cleaned.endsWith('&')) {
    cleaned = cleaned.substring(0, cleaned.length - 1);
  }

  // Pad to 8 hex digits if needed
  cleaned = cleaned.padStart(8, '0');

  const aHex = cleaned.substring(0, 2);
  const bHex = cleaned.substring(2, 4);
  const gHex = cleaned.substring(4, 6);
  const rHex = cleaned.substring(6, 8);

  const assAlphaNum = parseInt(aHex, 16) || 0;
  const opacity = Number((1 - assAlphaNum / 255).toFixed(2));

  const hex = `#${rHex}${gHex}${bHex}`.toUpperCase();
  return { hex, opacity };
}

/**
 * Convert UI alignment and vertical percentage to ASS numpad alignment code (1-9)
 */
export function getAssAlignment(
  alignment: HorizontalAlignment,
  verticalPercent: number
): number {
  let col = 2; // Center
  if (alignment === 'left') col = 1;
  else if (alignment === 'right') col = 3;

  let row = 0; // Bottom
  if (verticalPercent <= 33) {
    row = 2; // Top
  } else if (verticalPercent <= 66) {
    row = 1; // Middle
  } else {
    row = 0; // Bottom
  }

  // ASS alignment numpad mapping:
  // Top: 7 (col 1), 8 (col 2), 9 (col 3)
  // Mid: 4 (col 1), 5 (col 2), 6 (col 3)
  // Bot: 1 (col 1), 2 (col 2), 3 (col 3)
  if (row === 2) return 6 + col;
  if (row === 1) return 3 + col;
  return col;
}

/**
 * Calculate ASS vertical margin MarginV based on verticalPercent and canvas height
 */
export function calculateAssMarginV(
  verticalPercent: number,
  resolutionY: number = DEFAULT_SCRIPT_RESOLUTION.playResY
): number {
  const clampedPercent = Math.max(0, Math.min(100, verticalPercent));

  if (clampedPercent > 66) {
    // Bottom aligned: margin from bottom
    const margin = Math.round(((100 - clampedPercent) / 100) * resolutionY);
    return Math.max(10, margin);
  } else if (clampedPercent <= 33) {
    // Top aligned: margin from top
    const margin = Math.round((clampedPercent / 100) * resolutionY);
    return Math.max(10, margin);
  } else {
    // Middle aligned: vertical margin is typically 0
    return 0;
  }
}

/**
 * Serialize a SubtitleStyle into a standard ASS Style line
 */
export function styleToAssStyle(
  style: SubtitleStyle,
  options?: { scriptResolutionY?: number; styleName?: string }
): string {
  const resY = options?.scriptResolutionY ?? DEFAULT_SCRIPT_RESOLUTION.playResY;
  const name = (options?.styleName || style.name || style.id || 'Default').replace(/,/g, '_');
  const fontName = (style.fontFamily || 'Inter').split(',')[0].replace(/['"]/g, '').trim();
  const fontSize = Math.round(style.fontSize || 48);

  const primaryColour = colorToAss(style.primaryColor, style.primaryOpacity ?? 1.0);
  // Secondary colour is often used for karaoke active highlight
  const secondaryColour = colorToAss(style.activeWordColor || '#FFD700', 1.0);
  const outlineColour = colorToAss(style.strokeColor || '#000000', 1.0);

  let backColour: string;
  let borderStyle = 1; // 1 = outline + drop shadow, 3 = opaque background box
  let outlineWidth = Math.round(style.strokeWidth ?? 0);
  let shadowDepth = Math.round(Math.max(style.shadowOffsetX ?? 0, style.shadowOffsetY ?? 0, style.shadowBlur ? style.shadowBlur / 3 : 0));

  if (style.hasBackgroundBox) {
    borderStyle = 3; // Opaque box in ASS
    backColour = colorToAss(style.backgroundColor || '#000000', style.backgroundOpacity ?? 0.8);
    outlineWidth = Math.round(Math.max(style.boxPaddingX ?? 10, style.boxPaddingY ?? 6) / 2);
    shadowDepth = 0;
  } else {
    borderStyle = 1;
    backColour = colorToAss(style.shadowColor || '#000000', 0.8);
  }

  const isBold =
    typeof style.fontWeight === 'number'
      ? style.fontWeight >= 700
        ? -1
        : 0
      : style.fontWeight === 'bold' || style.fontWeight === '800' || style.fontWeight === '900'
      ? -1
      : 0;

  const isItalic = style.fontStyle === 'italic' ? -1 : 0;
  const underline = 0;
  const strikeOut = 0;
  const scaleX = 100;
  const scaleY = 100;
  const spacing = Math.round(style.letterSpacing ?? 0);
  const angle = 0;

  const alignment = getAssAlignment(
    style.position?.alignment || 'center',
    style.position?.verticalPercent ?? 85
  );

  const marginL = 40;
  const marginR = 40;
  const marginV = calculateAssMarginV(style.position?.verticalPercent ?? 85, resY);
  const encoding = 1; // Default / UTF-8 ANSI

  return `Style: ${name},${fontName},${fontSize},${primaryColour},${secondaryColour},${outlineColour},${backColour},${isBold},${isItalic},${underline},${strikeOut},${scaleX},${scaleY},${spacing},${angle},${borderStyle},${outlineWidth},${shadowDepth},${alignment},${marginL},${marginR},${marginV},${encoding}`;
}

/**
 * Generate full ASS [V4+ Styles] section for export
 */
export function generateAssStylesSection(
  styles: SubtitleStyle[],
  options?: { scriptResolutionY?: number }
): string {
  const lines = ['[V4+ Styles]', ASS_STYLE_FORMAT_HEADER];
  for (const style of styles) {
    lines.push(styleToAssStyle(style, options));
  }
  return lines.join('\n');
}

/**
 * Parse a standard ASS Style line back into a partial SubtitleStyle
 */
export function parseAssStyle(styleLine: string): Partial<SubtitleStyle> {
  const match = styleLine.trim().match(/^Style:\s*(.+)$/i);
  if (!match) {
    return {};
  }

  const tokens = match[1].split(',').map((t) => t.trim());
  if (tokens.length < 23) {
    return {};
  }

  const [
    name,
    fontName,
    fontSizeStr,
    primaryColourStr,
    secondaryColourStr,
    outlineColourStr,
    backColourStr,
    boldStr,
    italicStr,
    ,
    ,
    ,
    ,
    spacingStr,
    ,
    borderStyleStr,
    outlineStr,
    shadowStr,
    alignmentStr,
    ,
    ,
    marginVStr,
  ] = tokens;

  const fontSize = parseInt(fontSizeStr, 10) || 48;
  const primary = assToColor(primaryColourStr);
  const secondary = assToColor(secondaryColourStr);
  const outline = assToColor(outlineColourStr);
  const back = assToColor(backColourStr);

  const isBold = boldStr === '-1' || boldStr === '1';
  const isItalic = italicStr === '-1' || italicStr === '1';
  const spacing = parseFloat(spacingStr) || 0;
  const borderStyle = parseInt(borderStyleStr, 10) || 1;
  const outlineWidth = parseInt(outlineStr, 10) || 0;
  const shadowDepth = parseInt(shadowStr, 10) || 0;
  const assAlignment = parseInt(alignmentStr, 10) || 2;
  const marginV = parseInt(marginVStr, 10) || 60;

  // Derive UI horizontal alignment
  let alignment: HorizontalAlignment = 'center';
  if ([1, 4, 7].includes(assAlignment)) alignment = 'left';
  else if ([3, 6, 9].includes(assAlignment)) alignment = 'right';

  // Derive vertical percentage
  let verticalPercent = 85;
  if ([7, 8, 9].includes(assAlignment)) {
    // Top
    verticalPercent = Math.max(5, Math.min(30, Math.round((marginV / 1080) * 100)));
  } else if ([4, 5, 6].includes(assAlignment)) {
    // Middle
    verticalPercent = 50;
  } else {
    // Bottom
    verticalPercent = Math.max(70, Math.min(95, 100 - Math.round((marginV / 1080) * 100)));
  }

  const hasBackgroundBox = borderStyle === 3;

  return {
    name,
    fontFamily: fontName,
    fontSize,
    fontWeight: isBold ? 700 : 400,
    fontStyle: isItalic ? 'italic' : 'normal',
    letterSpacing: spacing,
    primaryColor: primary.hex,
    primaryOpacity: primary.opacity,
    activeWordColor: secondary.hex,
    strokeColor: outline.hex,
    strokeWidth: outlineWidth,
    shadowColor: back.hex,
    shadowBlur: shadowDepth * 2,
    hasBackgroundBox,
    backgroundColor: back.hex,
    backgroundOpacity: back.opacity,
    position: {
      alignment,
      verticalPercent,
    },
  };
}

/**
 * Validate a JSON style or preset payload against SubtitleStyle schema
 */
export function validateStyleJson(
  data: unknown
): { valid: boolean; errors: string[]; style?: SubtitleStyle } {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Input payload is not an object'] };
  }

  const raw = data as Partial<SubtitleStyle>;

  if (!raw.id || typeof raw.id !== 'string') {
    errors.push('Missing or invalid id');
  }
  if (!raw.name || typeof raw.name !== 'string') {
    errors.push('Missing or invalid name');
  }
  if (!raw.fontFamily || typeof raw.fontFamily !== 'string') {
    errors.push('Missing or invalid fontFamily');
  }
  if (typeof raw.fontSize !== 'number' || isNaN(raw.fontSize) || raw.fontSize <= 0) {
    errors.push('fontSize must be a positive number');
  }
  if (!raw.primaryColor || typeof raw.primaryColor !== 'string') {
    errors.push('Missing or invalid primaryColor');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Construct a normalized SubtitleStyle with safe defaults for missing fields
  const normalized: SubtitleStyle = {
    id: raw.id!,
    name: raw.name!,
    fontFamily: raw.fontFamily!,
    fontSize: Math.max(12, Math.min(180, raw.fontSize!)),
    fontWeight: raw.fontWeight ?? 600,
    fontStyle: raw.fontStyle === 'italic' ? 'italic' : 'normal',
    textTransform: raw.textTransform ?? 'none',
    letterSpacing: typeof raw.letterSpacing === 'number' ? raw.letterSpacing : 0,
    lineHeight: typeof raw.lineHeight === 'number' ? raw.lineHeight : 1.3,
    primaryColor: raw.primaryColor!,
    primaryOpacity: typeof raw.primaryOpacity === 'number' ? Math.max(0, Math.min(1, raw.primaryOpacity)) : 1.0,
    activeWordColor: raw.activeWordColor || '#FFD700',
    strokeColor: raw.strokeColor || '#000000',
    strokeWidth: typeof raw.strokeWidth === 'number' ? Math.max(0, Math.min(30, raw.strokeWidth)) : 0,
    shadowColor: raw.shadowColor || '#000000',
    shadowBlur: typeof raw.shadowBlur === 'number' ? Math.max(0, Math.min(50, raw.shadowBlur)) : 0,
    shadowOffsetX: typeof raw.shadowOffsetX === 'number' ? raw.shadowOffsetX : 0,
    shadowOffsetY: typeof raw.shadowOffsetY === 'number' ? raw.shadowOffsetY : 2,
    hasBackgroundBox: Boolean(raw.hasBackgroundBox),
    backgroundColor: raw.backgroundColor || '#000000',
    backgroundOpacity: typeof raw.backgroundOpacity === 'number' ? Math.max(0, Math.min(1, raw.backgroundOpacity)) : 0.8,
    boxPaddingX: typeof raw.boxPaddingX === 'number' ? Math.max(0, raw.boxPaddingX) : 14,
    boxPaddingY: typeof raw.boxPaddingY === 'number' ? Math.max(0, raw.boxPaddingY) : 6,
    boxBorderRadius: typeof raw.boxBorderRadius === 'number' ? Math.max(0, raw.boxBorderRadius) : 6,
    position: {
      alignment: raw.position?.alignment || 'center',
      verticalPercent: typeof raw.position?.verticalPercent === 'number' ? raw.position.verticalPercent : 85,
    },
  };

  return { valid: true, errors: [], style: normalized };
}

/**
 * Serialize SubtitleStyle to pretty-printed JSON
 */
export function serializeStyleToJson(style: SubtitleStyle): string {
  return JSON.stringify(style, null, 2);
}
