/**
 * Subtitle Constraint Validator
 * Enforces broadcast and digital video standards for subtitle reading speed (CPS),
 * line width (CPL), minimum/maximum duration, and interval gaps.
 */

import { SubtitleEvent } from '../types/models.js';

export type ValidationErrorCode =
  | 'HIGH_CPS'
  | 'CRITICAL_CPS'
  | 'LINE_OVERFLOW'
  | 'CRITICAL_LINE_OVERFLOW'
  | 'TOO_SHORT'
  | 'TOO_LONG'
  | 'GAP_TOO_SMALL'
  | 'OVERLAPPING_EVENTS';

export type ValidationSeverity = 'warning' | 'error';
export type SuggestedAction = 'split_event' | 'merge_event' | 'extend_duration' | 'reduce_duration' | 'adjust_gap';

export interface SubtitleValidationIssue {
  id: string;
  eventId: string;
  eventIndex: number;
  code: ValidationErrorCode;
  severity: ValidationSeverity;
  message: string;
  suggestedAction?: SuggestedAction;
  details?: {
    currentValue: number;
    threshold: number;
  };
}

export interface ValidationRules {
  warnCps?: number;        // Default: 21.0 CPS
  maxCps?: number;         // Default: 25.0 CPS
  warnCpl?: number;        // Default: 37 characters
  maxCpl?: number;         // Default: 42 characters
  minDurationSeconds?: number; // Default: 0.8s
  maxDurationSeconds?: number; // Default: 6.0s
  minGapSeconds?: number;      // Default: 0.067s (~2 frames at 30fps)
}

export const DEFAULT_VALIDATION_RULES: Required<ValidationRules> = {
  warnCps: 21.0,
  maxCps: 25.0,
  warnCpl: 37,
  maxCpl: 42,
  minDurationSeconds: 0.8,
  maxDurationSeconds: 6.0,
  minGapSeconds: 0.067,
};

export interface SubtitleValidationReport {
  totalEvents: number;
  validEventsCount: number;
  warningsCount: number;
  errorsCount: number;
  issues: SubtitleValidationIssue[];
  averageCps: number;
  maxCplEncountered: number;
}

/**
 * Validates an array of subtitle events against broadcast and readability standards.
 */
export function validateSubtitles(
  events: SubtitleEvent[],
  customRules?: ValidationRules
): SubtitleValidationReport {
  const rules = { ...DEFAULT_VALIDATION_RULES, ...customRules };
  const issues: SubtitleValidationIssue[] = [];

  let totalCps = 0;
  let maxCplEncountered = 0;
  let errorEvents = new Set<string>();
  let warningEvents = new Set<string>();

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const duration = Math.max(0.001, event.endTime - event.startTime);
    const lines = event.text.split('\n');
    const pureText = event.text.replace(/\n/g, ' ');
    const cps = event.cps ?? Number((pureText.length / duration).toFixed(1));
    const cpl = event.cpl ?? Math.max(...lines.map((l) => l.length));

    totalCps += cps;
    if (cpl > maxCplEncountered) {
      maxCplEncountered = cpl;
    }

    // 1. Reading Speed (CPS) Check
    if (cps > rules.maxCps) {
      issues.push({
        id: `val-${event.id}-cps-err`,
        eventId: event.id,
        eventIndex: event.index,
        code: 'CRITICAL_CPS',
        severity: 'error',
        message: `Reading speed of ${cps} CPS is too fast for viewers (maximum recommended is ${rules.maxCps} CPS).`,
        suggestedAction: 'split_event',
        details: { currentValue: cps, threshold: rules.maxCps },
      });
      errorEvents.add(event.id);
    } else if (cps > rules.warnCps) {
      issues.push({
        id: `val-${event.id}-cps-warn`,
        eventId: event.id,
        eventIndex: event.index,
        code: 'HIGH_CPS',
        severity: 'warning',
        message: `Reading speed of ${cps} CPS may be difficult to read (standard target is ${rules.warnCps} CPS).`,
        suggestedAction: 'split_event',
        details: { currentValue: cps, threshold: rules.warnCps },
      });
      warningEvents.add(event.id);
    }

    // 2. Characters Per Line (CPL) Check
    if (cpl > rules.maxCpl) {
      issues.push({
        id: `val-${event.id}-cpl-err`,
        eventId: event.id,
        eventIndex: event.index,
        code: 'CRITICAL_LINE_OVERFLOW',
        severity: 'error',
        message: `Line length of ${cpl} characters exceeds safe video boundary (limit is ${rules.maxCpl} CPL).`,
        suggestedAction: 'split_event',
        details: { currentValue: cpl, threshold: rules.maxCpl },
      });
      errorEvents.add(event.id);
    } else if (cpl > rules.warnCpl) {
      issues.push({
        id: `val-${event.id}-cpl-warn`,
        eventId: event.id,
        eventIndex: event.index,
        code: 'LINE_OVERFLOW',
        severity: 'warning',
        message: `Line length of ${cpl} characters exceeds ideal line width (guideline is ${rules.warnCpl} CPL).`,
        suggestedAction: 'split_event',
        details: { currentValue: cpl, threshold: rules.warnCpl },
      });
      warningEvents.add(event.id);
    }

    // 3. Minimum and Maximum Duration Checks
    if (duration < rules.minDurationSeconds) {
      issues.push({
        id: `val-${event.id}-dur-short`,
        eventId: event.id,
        eventIndex: event.index,
        code: 'TOO_SHORT',
        severity: 'warning',
        message: `Duration of ${duration.toFixed(2)}s is below minimum display duration (${rules.minDurationSeconds}s). May cause visual flickering.`,
        suggestedAction: 'extend_duration',
        details: { currentValue: Number(duration.toFixed(2)), threshold: rules.minDurationSeconds },
      });
      warningEvents.add(event.id);
    } else if (duration > rules.maxDurationSeconds) {
      issues.push({
        id: `val-${event.id}-dur-long`,
        eventId: event.id,
        eventIndex: event.index,
        code: 'TOO_LONG',
        severity: 'warning',
        message: `Duration of ${duration.toFixed(2)}s exceeds maximum display duration (${rules.maxDurationSeconds}s).`,
        suggestedAction: 'split_event',
        details: { currentValue: Number(duration.toFixed(2)), threshold: rules.maxDurationSeconds },
      });
      warningEvents.add(event.id);
    }

    // 4. Consecutive Gap and Overlap Checks
    if (i > 0) {
      const prev = events[i - 1];
      const gap = event.startTime - prev.endTime;

      if (gap < -0.001) {
        issues.push({
          id: `val-${event.id}-overlap`,
          eventId: event.id,
          eventIndex: event.index,
          code: 'OVERLAPPING_EVENTS',
          severity: 'error',
          message: `Subtitle overlaps with preceding subtitle #${prev.index} by ${Math.abs(gap).toFixed(3)}s.`,
          suggestedAction: 'adjust_gap',
          details: { currentValue: Number(gap.toFixed(3)), threshold: 0 },
        });
        errorEvents.add(event.id);
      } else if (gap > 0 && gap < rules.minGapSeconds) {
        issues.push({
          id: `val-${event.id}-gap-small`,
          eventId: event.id,
          eventIndex: event.index,
          code: 'GAP_TOO_SMALL',
          severity: 'warning',
          message: `Gap between subtitle #${prev.index} and #${event.index} is ${(gap * 1000).toFixed(0)}ms (recommended minimum is ${(rules.minGapSeconds * 1000).toFixed(0)}ms).`,
          suggestedAction: 'adjust_gap',
          details: { currentValue: Number(gap.toFixed(3)), threshold: rules.minGapSeconds },
        });
        warningEvents.add(event.id);
      }
    }
  }

  const averageCps = events.length > 0 ? Number((totalCps / events.length).toFixed(1)) : 0;
  const errorsCount = issues.filter((i) => i.severity === 'error').length;
  const warningsCount = issues.filter((i) => i.severity === 'warning').length;
  const invalidEventIds = new Set([...errorEvents, ...warningEvents]);
  const validEventsCount = events.length - invalidEventIds.size;

  return {
    totalEvents: events.length,
    validEventsCount,
    warningsCount,
    errorsCount,
    issues,
    averageCps,
    maxCplEncountered,
  };
}
