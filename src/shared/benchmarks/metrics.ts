/**
 * Speech Recognition Accuracy Evaluation Metrics
 * Implements Levenshtein-based Word Error Rate (WER), Character Error Rate (CER),
 * Keyword Accuracy (Code-Switching preservation), and Timestamp Mean Absolute Error (MAE).
 */

export interface WordAlignmentStep {
  type: 'match' | 'substitution' | 'deletion' | 'insertion';
  refWord?: string;
  hypWord?: string;
}

export interface WERResult {
  wer: number;
  substitutions: number;
  deletions: number;
  insertions: number;
  hits: number;
  referenceWordCount: number;
  hypothesisWordCount: number;
  alignment: WordAlignmentStep[];
}

export interface CERResult {
  cer: number;
  substitutions: number;
  deletions: number;
  insertions: number;
  hits: number;
  referenceCharCount: number;
  hypothesisCharCount: number;
}

export interface TimestampMAEResult {
  maeSeconds: number;
  maeStartSeconds: number;
  maeEndSeconds: number;
  sampleCount: number;
}

export interface KeywordAccuracyResult {
  totalKeywords: number;
  matchedKeywords: number;
  accuracy: number;
  matched: string[];
  missingKeywords: string[];
}

/**
 * Standard text normalization for speech recognition benchmarking.
 * Strips punctuation, normalizes unicode (NFKC), collapses whitespace, and lowercases.
 */
export function normalizeForEvaluation(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFKC')
    .toLowerCase()
    // Remove Latin punctuation and Devanagari danda / double danda
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'–—…।॥]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Computes Word Error Rate (WER) using Levenshtein distance on tokenized words.
 * WER = (Substitutions + Deletions + Insertions) / ReferenceWordCount
 */
export function computeWER(reference: string, hypothesis: string): WERResult {
  const normRef = normalizeForEvaluation(reference);
  const normHyp = normalizeForEvaluation(hypothesis);

  const refTokens = normRef.length > 0 ? normRef.split(' ') : [];
  const hypTokens = normHyp.length > 0 ? normHyp.split(' ') : [];

  const n = refTokens.length;
  const m = hypTokens.length;

  if (n === 0) {
    return {
      wer: m === 0 ? 0.0 : 1.0,
      substitutions: 0,
      deletions: 0,
      insertions: m,
      hits: 0,
      referenceWordCount: 0,
      hypothesisWordCount: m,
      alignment: hypTokens.map((w) => ({ type: 'insertion', hypWord: w })),
    };
  }

  // Cost matrix: dp[i][j] = min edit operations between ref[0..i-1] and hyp[0..j-1]
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

  for (let i = 0; i <= n; i++) dp[i][0] = i;
  for (let j = 0; j <= m; j++) dp[0][j] = j;

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const match = refTokens[i - 1] === hypTokens[j - 1];
      const subCost = match ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j - 1] + subCost, // substitution or match
        dp[i - 1][j] + 1,           // deletion
        dp[i][j - 1] + 1            // insertion
      );
    }
  }

  // Backtrack to extract alignment and counts
  let i = n;
  let j = m;
  let substitutions = 0;
  let deletions = 0;
  let insertions = 0;
  let hits = 0;
  const alignment: WordAlignmentStep[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0) {
      const match = refTokens[i - 1] === hypTokens[j - 1];
      const subCost = match ? 0 : 1;
      if (dp[i][j] === dp[i - 1][j - 1] + subCost) {
        if (match) {
          hits++;
          alignment.unshift({ type: 'match', refWord: refTokens[i - 1], hypWord: hypTokens[j - 1] });
        } else {
          substitutions++;
          alignment.unshift({ type: 'substitution', refWord: refTokens[i - 1], hypWord: hypTokens[j - 1] });
        }
        i--;
        j--;
        continue;
      }
    }

    if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      deletions++;
      alignment.unshift({ type: 'deletion', refWord: refTokens[i - 1] });
      i--;
    } else {
      insertions++;
      alignment.unshift({ type: 'insertion', hypWord: hypTokens[j - 1] });
      j--;
    }
  }

  const wer = (substitutions + deletions + insertions) / n;

  return {
    wer: Math.round(wer * 10000) / 10000,
    substitutions,
    deletions,
    insertions,
    hits,
    referenceWordCount: n,
    hypothesisWordCount: m,
    alignment,
  };
}

/**
 * Computes Character Error Rate (CER) using Levenshtein distance on characters.
 * Useful for phonetic scripts like Devanagari and transliterated Hinglish.
 */
export function computeCER(reference: string, hypothesis: string): CERResult {
  const normRef = normalizeForEvaluation(reference).replace(/\s+/g, '');
  const normHyp = normalizeForEvaluation(hypothesis).replace(/\s+/g, '');

  const refChars = Array.from(normRef);
  const hypChars = Array.from(normHyp);

  const n = refChars.length;
  const m = hypChars.length;

  if (n === 0) {
    return {
      cer: m === 0 ? 0.0 : 1.0,
      substitutions: 0,
      deletions: 0,
      insertions: m,
      hits: 0,
      referenceCharCount: 0,
      hypothesisCharCount: m,
    };
  }

  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

  for (let i = 0; i <= n; i++) dp[i][0] = i;
  for (let j = 0; j <= m; j++) dp[0][j] = j;

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const match = refChars[i - 1] === hypChars[j - 1];
      const subCost = match ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j - 1] + subCost,
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1
      );
    }
  }

  let i = n;
  let j = m;
  let substitutions = 0;
  let deletions = 0;
  let insertions = 0;
  let hits = 0;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0) {
      const match = refChars[i - 1] === hypChars[j - 1];
      const subCost = match ? 0 : 1;
      if (dp[i][j] === dp[i - 1][j - 1] + subCost) {
        if (match) hits++;
        else substitutions++;
        i--;
        j--;
        continue;
      }
    }

    if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      deletions++;
      i--;
    } else {
      insertions++;
      j--;
    }
  }

  const cer = (substitutions + deletions + insertions) / n;

  return {
    cer: Math.round(cer * 10000) / 10000,
    substitutions,
    deletions,
    insertions,
    hits,
    referenceCharCount: n,
    hypothesisCharCount: m,
  };
}

/**
 * Computes Keyword / Code-Switching accuracy.
 * Validates that technical terms or specific code-switched phrases from reference appear in hypothesis.
 */
export function computeKeywordAccuracy(
  hypothesis: string,
  expectedKeywords: string[]
): KeywordAccuracyResult {
  if (!expectedKeywords || expectedKeywords.length === 0) {
    return {
      totalKeywords: 0,
      matchedKeywords: 0,
      accuracy: 1.0,
      matched: [],
      missingKeywords: [],
    };
  }

  const normHyp = normalizeForEvaluation(hypothesis);
  const matched: string[] = [];
  const missing: string[] = [];

  for (const kw of expectedKeywords) {
    const normKw = normalizeForEvaluation(kw);
    if (normHyp.includes(normKw)) {
      matched.push(kw);
    } else {
      missing.push(kw);
    }
  }

  const accuracy = matched.length / expectedKeywords.length;

  return {
    totalKeywords: expectedKeywords.length,
    matchedKeywords: matched.length,
    accuracy: Math.round(accuracy * 10000) / 10000,
    matched,
    missingKeywords: missing,
  };
}

/**
 * Computes Timestamp Mean Absolute Error (MAE) between reference segment timings and predicted timings.
 */
export function computeTimestampMAE(
  referenceTimings: Array<{ start: number; end: number }>,
  hypothesisTimings: Array<{ start: number; end: number }>
): TimestampMAEResult {
  const count = Math.min(referenceTimings.length, hypothesisTimings.length);
  if (count === 0) {
    return {
      maeSeconds: 0,
      maeStartSeconds: 0,
      maeEndSeconds: 0,
      sampleCount: 0,
    };
  }

  let totalStartDiff = 0;
  let totalEndDiff = 0;

  for (let i = 0; i < count; i++) {
    totalStartDiff += Math.abs(hypothesisTimings[i].start - referenceTimings[i].start);
    totalEndDiff += Math.abs(hypothesisTimings[i].end - referenceTimings[i].end);
  }

  const maeStart = totalStartDiff / count;
  const maeEnd = totalEndDiff / count;
  const maeCombined = (maeStart + maeEnd) / 2;

  return {
    maeSeconds: Math.round(maeCombined * 1000) / 1000,
    maeStartSeconds: Math.round(maeStart * 1000) / 1000,
    maeEndSeconds: Math.round(maeEnd * 1000) / 1000,
    sampleCount: count,
  };
}
