import { describe, it, expect } from 'vitest';
import {
  colorToAss,
  assToColor,
  getAssAlignment,
  calculateAssMarginV,
  styleToAssStyle,
  parseAssStyle,
  validateStyleJson,
  serializeStyleToJson,
  generateAssStylesSection,
} from '../../src/shared/subtitles/assStyleSerializer.js';
import { SubtitleStyle } from '../../src/shared/types/models.js';

describe('ASS Style and JSON Serialization Engine', () => {
  describe('colorToAss and assToColor', () => {
    it('converts standard hex colors to ASS inverted alpha BGR representation', () => {
      // #FFFFFF -> &H00FFFFFF
      expect(colorToAss('#FFFFFF', 1.0)).toBe('&H00FFFFFF');

      // #FFD700 (Gold: R=FF, G=D7, B=00) -> &H0000D7FF
      expect(colorToAss('#FFD700', 1.0)).toBe('&H0000D7FF');

      // Pure red: #FF0000 (R=FF, G=00, B=00) -> &H000000FF
      expect(colorToAss('#FF0000', 1.0)).toBe('&H000000FF');

      // Pure blue: #0000FF (R=00, G=00, B=FF) -> &H00FF0000
      expect(colorToAss('#0000FF', 1.0)).toBe('&H00FF0000');
    });

    it('handles inverted alpha correctly (0.0 = FF transparent, 1.0 = 00 opaque, 0.5 = 80)', () => {
      // Fully transparent black (opacity 0)
      expect(colorToAss('#000000', 0.0)).toBe('&HFF000000');

      // Semi-transparent black (opacity 0.5 -> alpha 128 = 80 in hex)
      const semiAss = colorToAss('#000000', 0.5);
      expect(semiAss).toBe('&H80000000');

      // Parses back to hex and opacity
      const parsed = assToColor(semiAss);
      expect(parsed.hex).toBe('#000000');
      expect(parsed.opacity).toBeCloseTo(0.5, 1);
    });

    it('parses ASS hex color strings back to CSS hex and opacity', () => {
      const parsedWhite = assToColor('&H00FFFFFF');
      expect(parsedWhite.hex).toBe('#FFFFFF');
      expect(parsedWhite.opacity).toBe(1.0);

      const parsedGold = assToColor('&H0000D7FF');
      expect(parsedGold.hex).toBe('#FFD700');
      expect(parsedGold.opacity).toBe(1.0);
    });
  });

  describe('Alignment and Margins', () => {
    it('maps horizontal alignment and vertical percentage to ASS numpad codes', () => {
      // Bottom: 1 (left), 2 (center), 3 (right)
      expect(getAssAlignment('left', 85)).toBe(1);
      expect(getAssAlignment('center', 85)).toBe(2);
      expect(getAssAlignment('right', 85)).toBe(3);

      // Middle: 4 (left), 5 (center), 6 (right)
      expect(getAssAlignment('left', 50)).toBe(4);
      expect(getAssAlignment('center', 50)).toBe(5);
      expect(getAssAlignment('right', 50)).toBe(6);

      // Top: 7 (left), 8 (center), 9 (right)
      expect(getAssAlignment('left', 15)).toBe(7);
      expect(getAssAlignment('center', 15)).toBe(8);
      expect(getAssAlignment('right', 15)).toBe(9);
    });

    it('calculates vertical margin MarginV relative to 1080p canvas', () => {
      // Bottom 85% -> 15% margin from bottom -> 0.15 * 1080 = 162
      expect(calculateAssMarginV(85, 1080)).toBe(162);

      // Top 10% -> 10% margin from top -> 0.10 * 1080 = 108
      expect(calculateAssMarginV(10, 1080)).toBe(108);

      // Middle 50% -> 0
      expect(calculateAssMarginV(50, 1080)).toBe(0);
    });
  });

  describe('styleToAssStyle and parseAssStyle', () => {
    const sampleStyle: SubtitleStyle = {
      id: 'style_punch',
      name: 'Punch',
      fontFamily: 'Montserrat, sans-serif',
      fontSize: 54,
      fontWeight: 800,
      fontStyle: 'normal',
      textTransform: 'uppercase',
      letterSpacing: 1,
      lineHeight: 1.25,
      primaryColor: '#FFFFFF',
      primaryOpacity: 1.0,
      activeWordColor: '#FFE500',
      strokeColor: '#000000',
      strokeWidth: 4,
      shadowColor: '#000000',
      shadowBlur: 6,
      shadowOffsetX: 2,
      shadowOffsetY: 2,
      hasBackgroundBox: false,
      backgroundColor: '#000000',
      backgroundOpacity: 0.8,
      boxPaddingX: 16,
      boxPaddingY: 8,
      boxBorderRadius: 8,
      position: {
        alignment: 'center',
        verticalPercent: 85,
      },
    };

    it('generates standard ASS Style line with 23 tokens', () => {
      const assLine = styleToAssStyle(sampleStyle);
      expect(assLine.startsWith('Style: Punch,Montserrat,54,')).toBe(true);

      const tokens = assLine.replace('Style: ', '').split(',');
      expect(tokens.length).toBe(23);

      // Primary color (&H00FFFFFF)
      expect(tokens[3]).toBe('&H00FFFFFF');
      // Secondary / active color (#FFE500 -> R=FF, G=E5, B=00 -> &H0000E5FF)
      expect(tokens[4]).toBe('&H0000E5FF');
      // Outline width (4)
      expect(tokens[16]).toBe('4');
      // Bold (-1)
      expect(tokens[7]).toBe('-1');
      // Alignment (2 = bottom-center)
      expect(tokens[18]).toBe('2');
    });

    it('parses ASS Style line back into a coherent SubtitleStyle', () => {
      const assLine = styleToAssStyle(sampleStyle);
      const parsed = parseAssStyle(assLine);

      expect(parsed.name).toBe('Punch');
      expect(parsed.fontFamily).toBe('Montserrat');
      expect(parsed.fontSize).toBe(54);
      expect(parsed.primaryColor).toBe('#FFFFFF');
      expect(parsed.activeWordColor).toBe('#FFE500');
      expect(parsed.strokeWidth).toBe(4);
      expect(parsed.position?.alignment).toBe('center');
      expect(parsed.position?.verticalPercent).toBeGreaterThanOrEqual(80);
    });

    it('generates full [V4+ Styles] section containing multiple styles', () => {
      const section = generateAssStylesSection([sampleStyle]);
      expect(section).toContain('[V4+ Styles]');
      expect(section).toContain('Format: Name, Fontname');
      expect(section).toContain('Style: Punch,Montserrat');
    });
  });

  describe('validateStyleJson and serializeStyleToJson', () => {
    it('validates a correct SubtitleStyle JSON object', () => {
      const validPayload: SubtitleStyle = {
        id: 'test_style',
        name: 'Test Style',
        fontFamily: 'Inter',
        fontSize: 42,
        fontWeight: 600,
        textTransform: 'none',
        letterSpacing: 0,
        lineHeight: 1.3,
        primaryColor: '#FFFFFF',
        primaryOpacity: 1.0,
        activeWordColor: '#FFD700',
        strokeColor: '#000000',
        strokeWidth: 2,
        shadowColor: '#000000',
        shadowBlur: 4,
        shadowOffsetX: 0,
        shadowOffsetY: 2,
        hasBackgroundBox: false,
        backgroundColor: '#000000',
        backgroundOpacity: 0.8,
        boxPaddingX: 14,
        boxPaddingY: 6,
        boxBorderRadius: 6,
        position: {
          alignment: 'center',
          verticalPercent: 85,
        },
      };

      const result = validateStyleJson(validPayload);
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.style?.id).toBe('test_style');
    });

    it('rejects invalid style payloads and reports specific error messages', () => {
      const invalidPayload = {
        name: 'No ID Style',
        fontSize: -10,
      };

      const result = validateStyleJson(invalidPayload);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing or invalid id');
      expect(result.errors).toContain('fontSize must be a positive number');
      expect(result.errors).toContain('Missing or invalid fontFamily');
      expect(result.errors).toContain('Missing or invalid primaryColor');
    });

    it('serializes style to pretty formatted JSON', () => {
      const style: SubtitleStyle = {
        id: 'json_test',
        name: 'JSON Test',
        fontFamily: 'Roboto',
        fontSize: 36,
        fontWeight: 400,
        textTransform: 'none',
        letterSpacing: 0,
        lineHeight: 1.3,
        primaryColor: '#F0F0F0',
        primaryOpacity: 1.0,
        activeWordColor: '#00E5FF',
        strokeColor: '#000000',
        strokeWidth: 1,
        shadowColor: '#000000',
        shadowBlur: 2,
        shadowOffsetX: 0,
        shadowOffsetY: 1,
        hasBackgroundBox: true,
        backgroundColor: '#10141E',
        backgroundOpacity: 0.9,
        boxPaddingX: 12,
        boxPaddingY: 6,
        boxBorderRadius: 8,
        position: {
          alignment: 'center',
          verticalPercent: 85,
        },
      };

      const json = serializeStyleToJson(style);
      expect(json).toContain('"id": "json_test"');
      expect(json).toContain('"name": "JSON Test"');

      const reParsed = JSON.parse(json);
      const validation = validateStyleJson(reParsed);
      expect(validation.valid).toBe(true);
    });
  });
});
