/**
 * Speech Recognition Accuracy Benchmark Evaluator
 * Runs automated evaluation suites across benchmark manifests,
 * computes category-level aggregations, and generates standardized Markdown reports.
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  computeWER,
  computeCER,
  computeKeywordAccuracy,
  computeTimestampMAE,
  WERResult,
  CERResult,
  KeywordAccuracyResult,
  TimestampMAEResult,
} from './metrics.js';
import { cleanHallucinations } from '../intelligence/hallucinationDetector.js';
import { ASRSegment } from '../types/models.js';

export interface BenchmarkSample {
  id: string;
  category: string;
  language: string;
  script: string;
  durationSeconds: number;
  referenceText: string;
  expectedKeywords?: string[];
  notes?: string;
  referenceTimings?: Array<{ start: number; end: number }>;
}

export interface BenchmarkDataset {
  version: string;
  description: string;
  samples: BenchmarkSample[];
}

export interface SampleEvaluationResult {
  id: string;
  category: string;
  durationSeconds: number;
  referenceText: string;
  hypothesisText: string;
  werResult: WERResult;
  cerResult: CERResult;
  keywordResult?: KeywordAccuracyResult;
  timestampResult?: TimestampMAEResult;
  hallucinationsDetected: string[];
}

export interface CategorySummary {
  category: string;
  sampleCount: number;
  totalDurationSeconds: number;
  averageWER: number; // 0 to 100%
  averageCER: number; // 0 to 100%
  averageKeywordAccuracy: number; // 0 to 100%
  averageTimestampMAE?: number; // seconds
}

export interface BenchmarkSummaryReport {
  timestamp: string;
  datasetVersion: string;
  totalSamples: number;
  totalDurationSeconds: number;
  overallWER: number; // 0 to 100%
  overallCER: number; // 0 to 100%
  overallKeywordAccuracy: number; // 0 to 100%
  overallTimestampMAE?: number;
  categorySummaries: CategorySummary[];
  sampleResults: SampleEvaluationResult[];
}

/**
 * Evaluates a single speech sample hypothesis against ground truth reference.
 */
export function evaluateSample(
  sample: BenchmarkSample,
  hypothesis: string | { text: string; segments?: ASRSegment[] }
): SampleEvaluationResult {
  const hypText = typeof hypothesis === 'string' ? hypothesis : hypothesis.text;
  const hypSegments = typeof hypothesis === 'object' && hypothesis.segments ? hypothesis.segments : [];

  const werResult = computeWER(sample.referenceText, hypText);
  const cerResult = computeCER(sample.referenceText, hypText);

  let keywordResult: KeywordAccuracyResult | undefined;
  if (sample.expectedKeywords && sample.expectedKeywords.length > 0) {
    keywordResult = computeKeywordAccuracy(hypText, sample.expectedKeywords);
  }

  let timestampResult: TimestampMAEResult | undefined;
  if (sample.referenceTimings && sample.referenceTimings.length > 0 && hypSegments.length > 0) {
    const hypTimings = hypSegments.map((s) => ({ start: s.startTime, end: s.endTime }));
    timestampResult = computeTimestampMAE(sample.referenceTimings, hypTimings);
  }

  const hallucinationCheck = cleanHallucinations(hypText);

  return {
    id: sample.id,
    category: sample.category,
    durationSeconds: sample.durationSeconds,
    referenceText: sample.referenceText,
    hypothesisText: hypText,
    werResult,
    cerResult,
    keywordResult,
    timestampResult,
    hallucinationsDetected: hallucinationCheck.reasons,
  };
}

/**
 * Evaluates an entire dataset of benchmark samples using a hypothesis provider function.
 */
export function evaluateBenchmarkSuite(
  dataset: BenchmarkDataset,
  hypothesisProvider: (sample: BenchmarkSample) => string | { text: string; segments?: ASRSegment[] }
): BenchmarkSummaryReport {
  const sampleResults: SampleEvaluationResult[] = [];
  const categoryMap = new Map<string, SampleEvaluationResult[]>();

  let totalDurationSeconds = 0;

  for (const sample of dataset.samples) {
    totalDurationSeconds += sample.durationSeconds;
    const hypothesis = hypothesisProvider(sample);
    const result = evaluateSample(sample, hypothesis);
    sampleResults.push(result);

    if (!categoryMap.has(sample.category)) {
      categoryMap.set(sample.category, []);
    }
    categoryMap.get(sample.category)!.push(result);
  }

  // Calculate overall metrics
  const totalRefWords = sampleResults.reduce((acc, r) => acc + r.werResult.referenceWordCount, 0);
  const totalErrors = sampleResults.reduce(
    (acc, r) => acc + r.werResult.substitutions + r.werResult.deletions + r.werResult.insertions,
    0
  );
  const overallWER = totalRefWords > 0 ? (totalErrors / totalRefWords) * 100 : 0;

  const totalRefChars = sampleResults.reduce((acc, r) => acc + r.cerResult.referenceCharCount, 0);
  const totalCharErrors = sampleResults.reduce(
    (acc, r) => acc + r.cerResult.substitutions + r.cerResult.deletions + r.cerResult.insertions,
    0
  );
  const overallCER = totalRefChars > 0 ? (totalCharErrors / totalRefChars) * 100 : 0;

  const samplesWithKw = sampleResults.filter((r) => r.keywordResult !== undefined);
  const overallKeywordAccuracy =
    samplesWithKw.length > 0
      ? (samplesWithKw.reduce((acc, r) => acc + r.keywordResult!.accuracy, 0) / samplesWithKw.length) * 100
      : 100;

  // Calculate category breakdowns
  const categorySummaries: CategorySummary[] = [];

  for (const [category, results] of categoryMap.entries()) {
    const catWords = results.reduce((acc, r) => acc + r.werResult.referenceWordCount, 0);
    const catErrors = results.reduce(
      (acc, r) => acc + r.werResult.substitutions + r.werResult.deletions + r.werResult.insertions,
      0
    );
    const avgWER = catWords > 0 ? (catErrors / catWords) * 100 : 0;

    const catChars = results.reduce((acc, r) => acc + r.cerResult.referenceCharCount, 0);
    const catCharErrors = results.reduce(
      (acc, r) => acc + r.cerResult.substitutions + r.cerResult.deletions + r.cerResult.insertions,
      0
    );
    const avgCER = catChars > 0 ? (catCharErrors / catChars) * 100 : 0;

    const catKwSamples = results.filter((r) => r.keywordResult !== undefined);
    const avgKw =
      catKwSamples.length > 0
        ? (catKwSamples.reduce((acc, r) => acc + r.keywordResult!.accuracy, 0) / catKwSamples.length) * 100
        : 100;

    const catDuration = results.reduce((acc, r) => acc + r.durationSeconds, 0);

    categorySummaries.push({
      category,
      sampleCount: results.length,
      totalDurationSeconds: Math.round(catDuration * 10) / 10,
      averageWER: Math.round(avgWER * 100) / 100,
      averageCER: Math.round(avgCER * 100) / 100,
      averageKeywordAccuracy: Math.round(avgKw * 100) / 100,
    });
  }

  return {
    timestamp: new Date().toISOString(),
    datasetVersion: dataset.version,
    totalSamples: dataset.samples.length,
    totalDurationSeconds: Math.round(totalDurationSeconds * 10) / 10,
    overallWER: Math.round(overallWER * 100) / 100,
    overallCER: Math.round(overallCER * 100) / 100,
    overallKeywordAccuracy: Math.round(overallKeywordAccuracy * 100) / 100,
    categorySummaries,
    sampleResults,
  };
}

/**
 * Formats a BenchmarkSummaryReport into clean, GitHub-flavored Markdown.
 * Adheres strictly to the no-emojis policy.
 */
export function generateMarkdownReport(report: BenchmarkSummaryReport): string {
  const lines: string[] = [];

  lines.push('# Vaani Studio Speech Recognition Accuracy Benchmark Report');
  lines.push('');
  lines.push(`Generated: ${report.timestamp}`);
  lines.push(`Benchmark Dataset Version: ${report.datasetVersion}`);
  lines.push(`Total Test Samples: ${report.totalSamples}`);
  lines.push(`Total Audio Evaluated: ${report.totalDurationSeconds} seconds`);
  lines.push('');
  lines.push('## 1. Executive Summary');
  lines.push('');
  lines.push('| Metric | Overall Benchmark Score | Target Threshold | Status |');
  lines.push('| :--- | :--- | :--- | :--- |');
  lines.push(`| Word Error Rate (WER) | ${report.overallWER}% | < 12.0% | ${report.overallWER < 12.0 ? 'PASS' : 'WARN'} |`);
  lines.push(`| Character Error Rate (CER) | ${report.overallCER}% | < 6.0% | ${report.overallCER < 6.0 ? 'PASS' : 'WARN'} |`);
  lines.push(`| Keyword / Code-Switching Preservation | ${report.overallKeywordAccuracy}% | > 90.0% | ${report.overallKeywordAccuracy >= 90.0 ? 'PASS' : 'WARN'} |`);
  lines.push('');
  lines.push('## 2. Accuracy Breakdown by Category');
  lines.push('');
  lines.push('| Speech Category | Samples | Duration (s) | WER (%) | CER (%) | Keyword Accuracy (%) |');
  lines.push('| :--- | :--- | :--- | :--- | :--- | :--- |');

  for (const cat of report.categorySummaries) {
    const formattedCatName = cat.category.replace(/_/g, ' ').toUpperCase();
    lines.push(
      `| ${formattedCatName} | ${cat.sampleCount} | ${cat.totalDurationSeconds}s | ${cat.averageWER}% | ${cat.averageCER}% | ${cat.averageKeywordAccuracy}% |`
    );
  }

  lines.push('');
  lines.push('## 3. Sample-by-Sample Evaluation Results');
  lines.push('');
  lines.push('| Sample ID | Category | Ref Words | Hyp Words | WER (%) | CER (%) | Keyword Acc (%) | Hallucinations |');
  lines.push('| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |');

  for (const r of report.sampleResults) {
    const kwAcc = r.keywordResult ? `${Math.round(r.keywordResult.accuracy * 100)}%` : 'N/A';
    const hal = r.hallucinationsDetected.length > 0 ? r.hallucinationsDetected.join(', ') : 'None';
    const werPercent = Math.round(r.werResult.wer * 10000) / 100;
    const cerPercent = Math.round(r.cerResult.cer * 10000) / 100;
    lines.push(
      `| ${r.id} | ${r.category} | ${r.werResult.referenceWordCount} | ${r.werResult.hypothesisWordCount} | ${werPercent}% | ${cerPercent}% | ${kwAcc} | ${hal} |`
    );
  }

  lines.push('');
  lines.push('## 4. Hallucination Mitigation and Edge-Case Analysis');
  lines.push('');
  lines.push('- Autoregressive loop cascades prevented via `--no-condition-on-previous-text`.');
  lines.push('- Non-speech and music edge cases filtered with Silero VAD speech activity detection.');
  lines.push('- Post-decoding n-gram suppression eliminates runaway loops while preserving natural linguistic reduplications (e.g. "dheere dheere", "jaldi jaldi").');
  lines.push('- Character floods (e.g. repetitive punctuation or runaway characters) are collapsed.');
  lines.push('');
  lines.push('## 5. Evaluation Methodology');
  lines.push('');
  lines.push('- Dynamic programming Wagner-Fischer token alignment for Levenshtein Word Error Rate computation.');
  lines.push('- Character-level alignment for Devanagari Hindi and phonetically transliterated Hinglish.');
  lines.push('- Text normalization includes Unicode NFKC normalization, lowercase conversion, and punctuation stripping.');
  lines.push('- Strict offline validation on Windows environment without external API dependencies.');
  lines.push('');

  return lines.join('\n');
}

/**
 * Saves generated markdown benchmark report to disk.
 */
export async function saveReportToFile(markdown: string, outputPath: string): Promise<void> {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(outputPath, markdown, 'utf-8');
}
