import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  evaluateBenchmarkSuite,
  generateMarkdownReport,
  BenchmarkDataset,
  BenchmarkSample,
} from '../../src/shared/benchmarks/evaluator.js';

describe('Standardized Benchmark Dataset and Evaluator Suite', () => {
  const manifestPath = path.resolve(process.cwd(), 'tests/fixtures/benchmark/manifest.json');

  it('loads and validates benchmark manifest structure', () => {
    expect(fs.existsSync(manifestPath)).toBe(true);
    const content = fs.readFileSync(manifestPath, 'utf-8');
    const dataset: BenchmarkDataset = JSON.parse(content);

    expect(dataset.version).toBeDefined();
    expect(dataset.samples).toBeInstanceOf(Array);
    expect(dataset.samples.length).toBeGreaterThanOrEqual(25);

    const categories = new Set(dataset.samples.map((s) => s.category));
    expect(categories.has('clean_english')).toBe(true);
    expect(categories.has('indian_english')).toBe(true);
    expect(categories.has('hindi_devanagari')).toBe(true);
    expect(categories.has('hinglish_codeswitch')).toBe(true);
    expect(categories.has('fast_noisy')).toBe(true);
    expect(categories.has('silence_music')).toBe(true);

    for (const sample of dataset.samples) {
      expect(sample.id).toMatch(/^bench-/);
      expect(sample.durationSeconds).toBeGreaterThan(0);
      expect(sample.referenceText).toBeDefined();
      expect(sample.language).toBeDefined();
      expect(sample.script).toBeDefined();
    }
  });

  it('runs automated evaluation suite across all 25 benchmark samples', () => {
    const dataset: BenchmarkDataset = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    // Simulated hypothesis generator mimicking high-accuracy local ASR with slight natural variations
    const hypothesisProvider = (sample: BenchmarkSample) => {
      if (sample.category === 'silence_music') {
        // Correctly suppressed silence
        return '';
      }
      // Return reference text with minimal variation
      return sample.referenceText;
    };

    const report = evaluateBenchmarkSuite(dataset, hypothesisProvider);

    expect(report.totalSamples).toBeGreaterThanOrEqual(25);
    expect(report.totalDurationSeconds).toBeGreaterThan(100);
    expect(report.overallWER).toBeLessThan(1.0);
    expect(report.overallCER).toBeLessThan(1.0);
    expect(report.overallKeywordAccuracy).toBe(100.0);
    expect(report.categorySummaries.length).toBe(6);

    // Generate markdown report and verify format
    const markdown = generateMarkdownReport(report);
    expect(markdown).toContain('# Vaani Studio Speech Recognition Accuracy Benchmark Report');
    expect(markdown).toContain('## 1. Executive Summary');
    expect(markdown).toContain('## 2. Accuracy Breakdown by Category');
    expect(markdown).toContain('## 3. Sample-by-Sample Evaluation Results');

    // Strict no-emojis assertion: verify no emoji Unicode sequences exist in report
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    expect(emojiRegex.test(markdown)).toBe(false);
  });
});
