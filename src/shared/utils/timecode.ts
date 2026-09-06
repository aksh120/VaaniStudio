/**
 * Timecode formatting and parsing utilities for subtitle editing.
 */

export function formatTimecode(seconds: number, format: 'full' | 'subrip' | 'compact' = 'full'): string {
  if (isNaN(seconds) || seconds < 0) seconds = 0;

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);

  const pad2 = (n: number) => n.toString().padStart(2, '0');
  const pad3 = (n: number) => n.toString().padStart(3, '0');

  if (format === 'subrip') {
    return `${pad2(hours)}:${pad2(minutes)}:${pad2(secs)},${pad3(millis)}`;
  }

  if (format === 'compact') {
    if (hours > 0) {
      return `${pad2(hours)}:${pad2(minutes)}:${pad2(secs)}.${Math.floor(millis / 100)}`;
    }
    return `${pad2(minutes)}:${pad2(secs)}.${Math.floor(millis / 100)}`;
  }

  // default 'full': 00:00:00.000
  return `${pad2(hours)}:${pad2(minutes)}:${pad2(secs)}.${pad3(millis)}`;
}

export function parseTimecode(tc: string): number {
  if (!tc || typeof tc !== 'string') return 0;

  const trimmed = tc.trim().replace(',', '.');

  // Check if it's already a plain number e.g. "12.34"
  if (!trimmed.includes(':')) {
    const parsed = parseFloat(trimmed);
    return isNaN(parsed) ? 0 : Math.max(0, parsed);
  }

  const parts = trimmed.split(':');
  let hours = 0;
  let minutes = 0;
  let seconds = 0;

  if (parts.length === 3) {
    hours = parseFloat(parts[0]) || 0;
    minutes = parseFloat(parts[1]) || 0;
    seconds = parseFloat(parts[2]) || 0;
  } else if (parts.length === 2) {
    minutes = parseFloat(parts[0]) || 0;
    seconds = parseFloat(parts[1]) || 0;
  }

  const total = hours * 3600 + minutes * 60 + seconds;
  return isNaN(total) ? 0 : Math.max(0, Number(total.toFixed(3)));
}

export function snapToInterval(time: number, interval: number = 0.05): number {
  return Number((Math.round(time / interval) * interval).toFixed(3));
}
