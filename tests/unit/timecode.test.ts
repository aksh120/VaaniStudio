import { describe, it, expect } from 'vitest';
import { formatTimecode, parseTimecode, snapToInterval } from '../../src/shared/utils/timecode.js';

describe('Timecode Utilities', () => {
  it('formats seconds into full HH:MM:SS.mmm format', () => {
    expect(formatTimecode(0)).toBe('00:00:00.000');
    expect(formatTimecode(65.432)).toBe('00:01:05.432');
    expect(formatTimecode(3661.050)).toBe('01:01:01.050');
  });

  it('formats seconds into subrip format with comma separator', () => {
    expect(formatTimecode(65.432, 'subrip')).toBe('00:01:05,432');
  });

  it('formats seconds into compact display format', () => {
    expect(formatTimecode(65.4, 'compact')).toBe('01:05.4');
  });

  it('parses formatted timecode strings back to seconds', () => {
    expect(parseTimecode('00:01:05.432')).toBe(65.432);
    expect(parseTimecode('00:01:05,432')).toBe(65.432);
    expect(parseTimecode('01:05.5')).toBe(65.5);
    expect(parseTimecode('12.34')).toBe(12.34);
    expect(parseTimecode('')).toBe(0);
  });

  it('snaps time to 50ms grid', () => {
    expect(snapToInterval(1.023, 0.05)).toBe(1.0);
    expect(snapToInterval(1.026, 0.05)).toBe(1.05);
    expect(snapToInterval(1.049, 0.05)).toBe(1.05);
  });
});
