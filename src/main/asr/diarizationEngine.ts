/**
 * Vaani Studio - Local Speaker Diarization Engine
 * Clusters speech segments by acoustic energy, zero-crossing rate, and conversational
 * turn-taking pause thresholds to assign speaker identities without external cloud dependencies.
 */

import fs from 'node:fs';
import { SubtitleEvent, SpeakerProfile, WordTiming } from '../../shared/types/models.js';
import { logger } from '../logger.js';

export interface DiarizationOptions {
  maxSpeakers?: number;
  minSilenceTurnMs?: number; // Inter-segment silence gap threshold (default: 650ms)
  sensitivity?: number; // 0.0 to 1.0
}

export interface DiarizationResult {
  events: SubtitleEvent[];
  speakers: SpeakerProfile[];
}

export interface DiarizationEngine {
  diarize(events: SubtitleEvent[], audioWavPath?: string, options?: DiarizationOptions): Promise<DiarizationResult>;
}

// Accessible palette for up to 8 distinct speakers
export const DEFAULT_SPEAKER_COLORS = [
  '#3b82f6', // Speaker 1: Vibrant Blue
  '#10b981', // Speaker 2: Emerald Green
  '#f59e0b', // Speaker 3: Warm Amber
  '#ec4899', // Speaker 4: Vivid Pink
  '#8b5cf6', // Speaker 5: Soft Purple
  '#06b6d4', // Speaker 6: Electric Cyan
  '#f97316', // Speaker 7: Bright Orange
  '#14b8a6', // Speaker 8: Deep Teal
];

export class AcousticDiarizer implements DiarizationEngine {
  /**
   * Diarizes a list of subtitle events, assigning speakerId and speakerLabel.
   */
  public async diarize(
    events: SubtitleEvent[],
    audioWavPath?: string,
    options?: DiarizationOptions
  ): Promise<DiarizationResult> {
    if (events.length === 0) {
      return { events: [], speakers: [] };
    }

    const maxSpeakers = Math.max(1, Math.min(8, options?.maxSpeakers || 2));
    const minSilenceGap = (options?.minSilenceTurnMs || 650) / 1000.0; // In seconds

    logger.info('DIARIZATION', `Starting diarization across ${events.length} events (Max speakers: ${maxSpeakers})`);

    // 1. Extract feature vectors per event: [normalizedEnergy, zeroCrossingRate, gapBefore]
    const features: number[][] = [];
    let audioBuffer: Buffer | null = null;
    let sampleRate = 16000;

    if (audioWavPath && fs.existsSync(audioWavPath)) {
      try {
        const stats = fs.statSync(audioWavPath);
        // Only load if under 50 MB to preserve memory ceiling
        if (stats.size > 44 && stats.size < 50 * 1024 * 1024) {
          audioBuffer = fs.readFileSync(audioWavPath);
          if (audioBuffer.length > 28) {
            sampleRate = audioBuffer.readUInt32LE(24) || 16000;
          }
        }
      } catch (err: any) {
        logger.warn('DIARIZATION', `Could not read audio for acoustic features: ${err.message}`);
      }
    }

    for (let i = 0; i < events.length; i++) {
      const evt = events[i];
      const gapBefore = i > 0 ? Math.max(0, evt.startTime - events[i - 1].endTime) : 1.0;

      let energy = 0.5;
      let zcr = 0.5;

      if (audioBuffer && audioBuffer.length > 44) {
        const acoustic = this.extractAcousticFeatures(audioBuffer, sampleRate, evt.startTime, evt.endTime);
        energy = acoustic.energy;
        zcr = acoustic.zcr;
      }

      features.push([energy, zcr, gapBefore]);
    }

    // 2. Cluster features into discrete speaker clusters
    const clusterAssignments = this.clusterSpeakers(features, maxSpeakers, minSilenceGap);

    // 3. Collect active speaker IDs and generate SpeakerProfile entries
    const speakerIdSet = new Set<number>();
    for (const clusterId of clusterAssignments) {
      speakerIdSet.add(clusterId);
    }

    const sortedSpeakerIds = Array.from(speakerIdSet).sort((a, b) => a - b);
    const speakers: SpeakerProfile[] = sortedSpeakerIds.map((clusterId, idx) => ({
      id: `spk_${clusterId + 1}`,
      name: `Speaker ${clusterId + 1}`,
      color: DEFAULT_SPEAKER_COLORS[idx % DEFAULT_SPEAKER_COLORS.length],
    }));

    // 4. Map speaker attributes to SubtitleEvents and child WordTimings
    const updatedEvents: SubtitleEvent[] = events.map((evt, idx) => {
      const clusterId = clusterAssignments[idx];
      const speaker = speakers.find((s) => s.id === `spk_${clusterId + 1}`) || speakers[0];

      const updatedWords: WordTiming[] = (evt.words || []).map((w) => ({
        ...w,
        speakerId: speaker.id,
      }));

      return {
        ...evt,
        speakerId: speaker.id,
        speakerLabel: speaker.name,
        words: updatedWords,
      };
    });

    logger.info('DIARIZATION', `Diarization completed. Identified ${speakers.length} speakers.`);

    return {
      events: updatedEvents,
      speakers,
    };
  }

  /**
   * Extracts RMS energy and Zero-Crossing Rate (ZCR) from raw 16-bit PCM WAV slice.
   */
  private extractAcousticFeatures(
    wavBuffer: Buffer,
    sampleRate: number,
    startTime: number,
    endTime: number
  ): { energy: number; zcr: number } {
    const headerOffset = 44;
    const bytesPerSample = 2; // 16-bit mono PCM

    const startByte = Math.max(headerOffset, headerOffset + Math.floor(startTime * sampleRate) * bytesPerSample);
    const endByte = Math.min(wavBuffer.length, headerOffset + Math.floor(endTime * sampleRate) * bytesPerSample);

    if (endByte <= startByte) {
      return { energy: 0.5, zcr: 0.5 };
    }

    const sampleCount = Math.floor((endByte - startByte) / bytesPerSample);
    let sumSquares = 0;
    let zeroCrossings = 0;
    let lastSign = 0;

    for (let offset = startByte; offset < endByte; offset += bytesPerSample) {
      const sample = wavBuffer.readInt16LE(offset) / 32768.0; // Normalize -1.0 to 1.0
      sumSquares += sample * sample;

      const currentSign = sample >= 0 ? 1 : -1;
      if (lastSign !== 0 && currentSign !== lastSign) {
        zeroCrossings++;
      }
      lastSign = currentSign;
    }

    const rms = Math.sqrt(sumSquares / Math.max(1, sampleCount));
    const zcr = zeroCrossings / Math.max(1, sampleCount);

    return {
      energy: Math.min(1.0, rms * 4.0),
      zcr: Math.min(1.0, zcr * 8.0),
    };
  }

  /**
   * Clusters events into speaker IDs using turn-taking pause heuristics and feature clustering.
   */
  private clusterSpeakers(features: number[][], maxSpeakers: number, minSilenceGap: number): number[] {
    const count = features.length;
    if (count === 0) return [];
    if (maxSpeakers <= 1) return new Array(count).fill(0);

    const assignments: number[] = new Array(count).fill(0);
    let currentSpeaker = 0;

    for (let i = 0; i < count; i++) {
      if (i > 0) {
        const gapBefore = features[i][2];
        const [prevEnergy, prevZcr] = features[i - 1];
        const [currEnergy, currZcr] = features[i];

        const acousticDelta = Math.abs(currEnergy - prevEnergy) + Math.abs(currZcr - prevZcr);

        // Turn switch heuristic: significant silence gap OR acoustic shift across a conversational pause
        if (gapBefore >= minSilenceGap || (gapBefore >= 0.3 && acousticDelta > 0.4)) {
          // Switch turn between speakers
          currentSpeaker = (currentSpeaker + 1) % maxSpeakers;
        }
      }

      assignments[i] = currentSpeaker;
    }

    return assignments;
  }
}
