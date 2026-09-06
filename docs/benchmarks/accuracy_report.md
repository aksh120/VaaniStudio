# Vaani Studio Speech Recognition Accuracy Benchmark Report

Generated: 2026-09-06T08:40:59.146Z
Benchmark Dataset Version: 1.0
Total Test Samples: 26
Total Audio Evaluated: 144.1 seconds

## 1. Executive Summary

| Metric | Overall Benchmark Score | Target Threshold | Status |
| :--- | :--- | :--- | :--- |
| Word Error Rate (WER) | 1.43% | < 12.0% | PASS |
| Character Error Rate (CER) | 0.52% | < 6.0% | PASS |
| Keyword / Code-Switching Preservation | 98.96% | > 90.0% | PASS |

## 2. Accuracy Breakdown by Category

| Speech Category | Samples | Duration (s) | WER (%) | CER (%) | Keyword Accuracy (%) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| CLEAN ENGLISH | 5 | 28.6s | 0% | 0% | 100% |
| INDIAN ENGLISH | 5 | 28.4s | 2.7% | 1.54% | 100% |
| HINDI DEVANAGARI | 5 | 28.7s | 0% | 0% | 100% |
| HINGLISH CODESWITCH | 6 | 36.2s | 2.44% | 0% | 95.83% |
| FAST NOISY | 3 | 15.2s | 2.22% | 1.62% | 100% |
| SILENCE MUSIC | 2 | 7s | 0% | 0% | 100% |

## 3. Sample-by-Sample Evaluation Results

| Sample ID | Category | Ref Words | Hyp Words | WER (%) | CER (%) | Keyword Acc (%) | Hallucinations |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| bench-en-01 | clean_english | 12 | 12 | 0% | 0% | 100% | None |
| bench-en-02 | clean_english | 16 | 16 | 0% | 0% | 100% | None |
| bench-en-03 | clean_english | 16 | 16 | 0% | 0% | 100% | None |
| bench-en-04 | clean_english | 16 | 16 | 0% | 0% | 100% | None |
| bench-en-05 | clean_english | 15 | 15 | 0% | 0% | 100% | None |
| bench-ie-01 | indian_english | 13 | 13 | 0% | 0% | 100% | None |
| bench-ie-02 | indian_english | 14 | 14 | 0% | 0% | 100% | None |
| bench-ie-03 | indian_english | 14 | 13 | 14.29% | 8% | 100% | None |
| bench-ie-04 | indian_english | 18 | 18 | 0% | 0% | 100% | None |
| bench-ie-05 | indian_english | 15 | 15 | 0% | 0% | 100% | None |
| bench-hi-01 | hindi_devanagari | 15 | 15 | 0% | 0% | 100% | None |
| bench-hi-02 | hindi_devanagari | 19 | 19 | 0% | 0% | 100% | None |
| bench-hi-03 | hindi_devanagari | 12 | 12 | 0% | 0% | 100% | None |
| bench-hi-04 | hindi_devanagari | 14 | 14 | 0% | 0% | 100% | None |
| bench-hi-05 | hindi_devanagari | 14 | 14 | 0% | 0% | 100% | None |
| bench-hng-01 | hinglish_codeswitch | 12 | 13 | 16.67% | 0% | 75% | None |
| bench-hng-02 | hinglish_codeswitch | 15 | 15 | 0% | 0% | 100% | None |
| bench-hng-03 | hinglish_codeswitch | 12 | 12 | 0% | 0% | 100% | None |
| bench-hng-04 | hinglish_codeswitch | 12 | 12 | 0% | 0% | 100% | None |
| bench-hng-05 | hinglish_codeswitch | 17 | 17 | 0% | 0% | 100% | None |
| bench-hng-06 | hinglish_codeswitch | 14 | 14 | 0% | 0% | 100% | None |
| bench-noise-01 | fast_noisy | 16 | 15 | 6.25% | 4.17% | 100% | None |
| bench-noise-02 | fast_noisy | 14 | 14 | 0% | 0% | 100% | None |
| bench-noise-03 | fast_noisy | 15 | 15 | 0% | 0% | 100% | None |
| bench-edge-01 | silence_music | 0 | 0 | 0% | 0% | N/A | None |
| bench-edge-02 | silence_music | 0 | 0 | 0% | 0% | N/A | None |

## 4. Hallucination Mitigation and Edge-Case Analysis

- Autoregressive loop cascades prevented via `--no-condition-on-previous-text`.
- Non-speech and music edge cases filtered with Silero VAD speech activity detection.
- Post-decoding n-gram suppression eliminates runaway loops while preserving natural linguistic reduplications (e.g. "dheere dheere", "jaldi jaldi").
- Character floods (e.g. repetitive punctuation or runaway characters) are collapsed.

## 5. Evaluation Methodology

- Dynamic programming Wagner-Fischer token alignment for Levenshtein Word Error Rate computation.
- Character-level alignment for Devanagari Hindi and phonetically transliterated Hinglish.
- Text normalization includes Unicode NFKC normalization, lowercase conversion, and punctuation stripping.
- Strict offline validation on Windows environment without external API dependencies.
