/**
 * Hallucination Loop Detection and Mitigation
 * Identifies autoregressive runaway repetitions, repetitive n-gram loops,
 * and character floods while preserving legitimate natural language reduplications (e.g., Hinglish idioms).
 */

import { ASRSegment } from '../types/models.js';

/**
 * Legitimate natural reduplications in Hindi, Hinglish, and conversational English
 * where repeating a word twice is grammatically and culturally common.
 */
const NATURAL_REDUPLICATIONS = new Set([
  'dheere',    // dheere dheere (slowly)
  'jaldi',     // jaldi jaldi (quickly)
  'kabhi',     // kabhi kabhi (sometimes)
  'alag',      // alag alag (distinct/separate)
  'ek',        // ek ek (one by one)
  'saath',     // saath saath (together)
  'sath',      // sath sath
  'baar',      // baar baar (again and again)
  'bar',       // bar bar
  'chhota',    // chhota chhota (small)
  'bada',      // bada bada (large)
  'kya',       // kya kya (what all)
  'saaf',      // saaf saaf (clearly)
  'theek',     // theek theek (just right)
  'garam',     // garam garam (fresh and hot)
  'roz',       // roz roz (daily)
  'sach',      // sach sach (truthfully)
  'door',      // door door (far away)
  'paas',      // paas paas (close together)
  'kam',       // kam kam (in small amounts)
  'zyada',     // zyada zyada
  'bye',       // bye bye
  'no',        // no no
  'yes',       // yes yes
  'very',      // very very
]);

/**
 * Known YouTube / subtitle credit hallucination trigger phrases that Whisper models
 * frequently invent during periods of background music, noise, or silence.
 */
const HALLUCINATION_PHRASES = [
  /subtitles?\s+by\s+the\s+amara\.org\s+community/i,
  /subtitles?\s+by\s+amara\.org/i,
  /thank\s+you\s+for\s+watching/i,
  /thanks\s+for\s+watching/i,
  /subscribe\s+to\s+(?:the|my|our)\s+channel/i,
  /please\s+like\s+and\s+subscribe/i,
  /watching!/i,
];

export interface HallucinationCheckResult {
  cleanedText: string;
  hasHallucination: boolean;
  reasons: string[];
}

/**
 * Checks if a word is in the legitimate natural reduplication dictionary.
 */
export function isNaturalReduplication(word: string): boolean {
  return NATURAL_REDUPLICATIONS.has(word.toLowerCase().replace(/[^a-z]/g, ''));
}

/**
 * Mitigates character floods such as '..........', '???????', or 'aaaaaa'.
 */
export function cleanCharacterFloods(text: string): { text: string; modified: boolean } {
  let modified = false;

  // Collapse 4+ consecutive identical punctuation marks to 1 (or 3 for dots ellipsis)
  let result = text.replace(/([.!?\-,])\1{3,}/g, (_match, char) => {
    modified = true;
    return char === '.' ? '...' : char;
  });

  // Collapse 4+ consecutive identical alphabetic characters to 2
  result = result.replace(/([a-zA-Z\u0900-\u097F])\1{3,}/gi, (_match, char) => {
    modified = true;
    return char + char;
  });

  return { text: result, modified };
}

/**
 * Detects and collapses consecutive single-word repeats.
 * E.g., "thank thank thank thank" -> "thank"
 * "dheere dheere dheere dheere" -> "dheere dheere" (preserves 2 for natural reduplications)
 */
export function cleanSingleWordLoops(text: string): { text: string; modified: boolean } {
  const words = text.split(/\s+/);
  if (words.length <= 2) {
    return { text, modified: false };
  }

  const cleanedWords: string[] = [];
  let modified = false;
  let i = 0;

  while (i < words.length) {
    const currentWord = words[i];
    const cleanCurrent = currentWord.toLowerCase().replace(/[^a-z0-9\u0900-\u097F]/g, '');

    // Lookahead for consecutive identical words
    let repeatCount = 1;
    while (i + repeatCount < words.length) {
      const nextWord = words[i + repeatCount];
      const cleanNext = nextWord.toLowerCase().replace(/[^a-z0-9\u0900-\u097F]/g, '');
      if (cleanCurrent.length > 0 && cleanCurrent === cleanNext) {
        repeatCount++;
      } else {
        break;
      }
    }

    if (repeatCount >= 3) {
      // Runaway loop detected!
      modified = true;
      const isNatural = isNaturalReduplication(cleanCurrent);
      // Keep 2 instances if natural reduplication, otherwise 1
      const keepCount = isNatural ? 2 : 1;
      for (let k = 0; k < keepCount; k++) {
        cleanedWords.push(words[i + k]);
      }

      // Preserve any trailing punctuation from the end of the repeating sequence
      const lastSequenceWord = words[i + repeatCount - 1];
      const punctMatch = lastSequenceWord.match(/[^a-z0-9\u0900-\u097F]+$/i);
      if (punctMatch) {
        const lastPushedIdx = cleanedWords.length - 1;
        if (!cleanedWords[lastPushedIdx].endsWith(punctMatch[0])) {
          cleanedWords[lastPushedIdx] = cleanedWords[lastPushedIdx] + punctMatch[0];
        }
      }

      i += repeatCount;
    } else {
      cleanedWords.push(currentWord);
      i++;
    }
  }

  return {
    text: cleanedWords.join(' '),
    modified,
  };
}

/**
 * Detects and removes multi-word repeating n-gram loops (2-gram, 3-gram, 4-gram, 5-gram).
 * E.g., "thank you thank you thank you" -> "thank you"
 * "subtitles by subtitles by subtitles by" -> "subtitles by"
 */
export function cleanMultiWordLoops(text: string): { text: string; modified: boolean } {
  let currentText = text.trim();
  let overallModified = false;

  // Try n-gram lengths from 5 down to 2 words
  for (let n = 5; n >= 2; n--) {
    let changed = true;
    while (changed) {
      changed = false;
      const words = currentText.split(/\s+/);
      if (words.length < n * 2) {
        break;
      }

      for (let i = 0; i <= words.length - n * 2; i++) {
        const phraseA = words.slice(i, i + n).join(' ').toLowerCase().replace(/[^a-z0-9\u0900-\u097F]/g, '');
        const phraseB = words.slice(i + n, i + n * 2).join(' ').toLowerCase().replace(/[^a-z0-9\u0900-\u097F]/g, '');

        if (phraseA.length > 0 && phraseA === phraseB) {
          // Check how many consecutive times this n-gram repeats
          let repeats = 2;
          while (i + n * (repeats + 1) <= words.length) {
            const nextPhrase = words
              .slice(i + n * repeats, i + n * (repeats + 1))
              .join(' ')
              .toLowerCase()
              .replace(/[^a-z0-9\u0900-\u097F]/g, '');
            if (nextPhrase === phraseA) {
              repeats++;
            } else {
              break;
            }
          }

          // If repeating 2 or more times consecutively
          // Keep only the first instance of the n-gram phrase
          const prefix = words.slice(0, i + n);
          const lastSeqWord = words[i + n * repeats - 1];
          const punctMatch = lastSeqWord.match(/[^a-z0-9\u0900-\u097F]+$/i);
          if (punctMatch) {
            const lastPrefixWord = prefix[prefix.length - 1];
            if (!lastPrefixWord.endsWith(punctMatch[0])) {
              prefix[prefix.length - 1] = lastPrefixWord + punctMatch[0];
            }
          }
          const suffix = words.slice(i + n * repeats);
          currentText = [...prefix, ...suffix].join(' ');
          overallModified = true;
          changed = true;
          break; // Re-tokenize and re-evaluate with currentText
        }
      }
    }
  }

  return { text: currentText, modified: overallModified };
}

/**
 * Comprehensive hallucination cleaner combining character floods,
 * single-word loops, and multi-word repetitive sequences.
 */
export function cleanHallucinations(rawText: string): HallucinationCheckResult {
  const reasons: string[] = [];
  let text = rawText || '';

  // 1. Character floods
  const floodResult = cleanCharacterFloods(text);
  if (floodResult.modified) {
    reasons.push('character_flood');
    text = floodResult.text;
  }

  // 2. Single-word loops
  const singleResult = cleanSingleWordLoops(text);
  if (singleResult.modified) {
    reasons.push('single_word_loop');
    text = singleResult.text;
  }

  // 3. Multi-word n-gram loops
  const multiResult = cleanMultiWordLoops(text);
  if (multiResult.modified) {
    reasons.push('multi_word_loop');
    text = multiResult.text;
  }

  return {
    cleanedText: text.trim(),
    hasHallucination: reasons.length > 0,
    reasons,
  };
}

/**
 * Checks if a segment represents a common hallucination artifact during silence or music.
 */
export function isHallucinatorySegment(segment: ASRSegment): boolean {
  const text = segment.text.trim();
  if (!text) return true;

  // Check known hallucination phrases
  for (const pattern of HALLUCINATION_PHRASES) {
    if (pattern.test(text)) {
      return true;
    }
  }

  // Check compression ratio heuristic (repeated single word ratio)
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  if (words.length >= 6) {
    const uniqueWords = new Set(words.map((w) => w.toLowerCase().replace(/[^a-z0-9]/g, '')));
    if (uniqueWords.size <= 2) {
      // 6 or more words with only 1-2 distinct words indicates a repetitive runaway loop
      return true;
    }
  }

  return false;
}

/**
 * Post-processes an array of ASR segments, pruning hallucinated segments
 * and cleaning loops/floods in-place while preserving valid timing metadata.
 */
export function filterHallucinatedSegments(segments: ASRSegment[]): ASRSegment[] {
  const filtered: ASRSegment[] = [];

  for (const seg of segments) {
    if (isHallucinatorySegment(seg)) {
      continue; // Discard pure hallucination segment
    }

    const { cleanedText, hasHallucination } = cleanHallucinations(seg.text);
    if (!cleanedText) {
      continue;
    }

    if (hasHallucination) {
      // Update text and keep words that still align
      const cleanedWordsList = cleanedText.split(/\s+/).map((w) => w.toLowerCase());
      const filteredWords = (seg.words || []).filter((w) =>
        cleanedWordsList.includes(w.word.trim().toLowerCase())
      );

      filtered.push({
        ...seg,
        text: cleanedText,
        words: filteredWords.length > 0 ? filteredWords : seg.words,
      });
    } else {
      filtered.push(seg);
    }
  }

  return filtered;
}
