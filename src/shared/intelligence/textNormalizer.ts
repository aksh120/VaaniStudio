/**
 * Text Cleanup, Formatting, and Number Normalization
 * Normalizes Indian numbering systems (Lakhs, Crores, Hazar), removes optional
 * conversational filler words, and standardizes punctuation.
 */

import { SubtitleEvent } from '../types/models.js';

export interface NormalizationOptions {
  normalizeNumbers?: boolean;
  removeFillerWords?: boolean;
  formatPunctuation?: boolean;
  preserveWordTiming?: boolean;
}

const DEFAULT_OPTIONS: NormalizationOptions = {
  normalizeNumbers: true,
  removeFillerWords: false,
  formatPunctuation: true,
};

// Hindi / English number word mapping
const NUMBER_WORDS: Record<string, number> = {
  'zero': 0, 'shunya': 0,
  'one': 1, 'ek': 1,
  'two': 2, 'do': 2,
  'three': 3, 'teen': 3,
  'four': 4, 'char': 4,
  'five': 5, 'paanch': 5, 'panch': 5,
  'six': 6, 'chhe': 6, 'che': 6,
  'seven': 7, 'saat': 7,
  'eight': 8, 'aath': 8,
  'nine': 9, 'nau': 9,
  'ten': 10, 'das': 10,
  'eleven': 11, 'gyarah': 11,
  'twelve': 12, 'barah': 12,
  'thirteen': 13, 'terah': 13,
  'fourteen': 14, 'chaudah': 14,
  'fifteen': 15, 'pandrah': 15,
  'sixteen': 16, 'solah': 16,
  'seventeen': 17, 'satrah': 17,
  'eighteen': 18, 'athaarah': 18,
  'nineteen': 19, 'unnis': 19,
  'twenty': 20, 'bees': 20,
  'thirty': 30, 'tees': 30,
  'forty': 40, 'chalis': 40,
  'fifty': 50, 'pachaas': 50, 'pachas': 50,
  'sixty': 60, 'saath': 60,
  'seventy': 70, 'sattar': 70,
  'eighty': 80, 'assi': 80,
  'ninety': 90, 'nabbe': 90,
  'hundred': 100, 'sau': 100,
};

// Filler words set for optional removal
const FILLER_WORDS = new Set([
  'um', 'uh', 'umm', 'uhh', 'er', 'ah',
]);

const HINDI_FILLER_PHRASES = [
  /\bmatlab\b/gi,
  /\byani ki\b/gi,
  /\byou know\b/gi,
  /\bbasically\b/gi,
];

/**
 * Formats a raw number integer into standard Indian numbering notation (e.g. 2,50,000).
 */
export function formatIndianNumber(num: number): string {
  const str = Math.floor(num).toString();
  if (str.length <= 3) return str;

  const lastThree = str.substring(str.length - 3);
  const otherNumbers = str.substring(0, str.length - 3);
  const formattedOther = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${formattedOther},${lastThree}`;
}

/**
 * Normalizes spoken number phrases into formatted digits.
 * e.g., "pachas hazar" -> "50,000", "do lakh" -> "2,00,000", "das crore" -> "10 Crore"
 */
export function normalizeIndianNumbers(text: string): string {
  if (!text) return '';

  let result = text;

  // 1. Crore expressions: "<num> crore"
  result = result.replace(
    /\b([a-zA-Z0-9]+)\s+(crore|karor|करोड़)\b/gi,
    (_match, numPart) => {
      const lower = numPart.toLowerCase();
      const val = NUMBER_WORDS[lower] ?? (isNaN(Number(numPart)) ? null : Number(numPart));
      if (val !== null) {
        return `${val} Crore`;
      }
      return _match;
    }
  );

  // 2. Lakh expressions: "<num> lakh"
  result = result.replace(
    /\b([a-zA-Z0-9]+)\s+(lakh|lac|लाख)\b/gi,
    (_match, numPart) => {
      const lower = numPart.toLowerCase();
      const val = NUMBER_WORDS[lower] ?? (isNaN(Number(numPart)) ? null : Number(numPart));
      if (val !== null) {
        return formatIndianNumber(val * 100000);
      }
      return _match;
    }
  );

  // 3. Thousand expressions: "<num> thousand / hazar"
  result = result.replace(
    /\b([a-zA-Z0-9]+)\s+(thousand|hazar|hazaar|हज़ार|हजार)\b/gi,
    (_match, numPart) => {
      const lower = numPart.toLowerCase();
      const val = NUMBER_WORDS[lower] ?? (isNaN(Number(numPart)) ? null : Number(numPart));
      if (val !== null) {
        return formatIndianNumber(val * 1000);
      }
      return _match;
    }
  );

  // 4. Hundred expressions: "<num> hundred / sau"
  result = result.replace(
    /\b([a-zA-Z0-9]+)\s+(hundred|sau|सौ)\b/gi,
    (_match, numPart) => {
      const lower = numPart.toLowerCase();
      const val = NUMBER_WORDS[lower] ?? (isNaN(Number(numPart)) ? null : Number(numPart));
      if (val !== null) {
        return formatIndianNumber(val * 100);
      }
      return _match;
    }
  );

  // 5. Currency conversions: "<num> rupees / rupaye" -> "₹<num>"
  result = result.replace(
    /\b([0-9,]+|[a-zA-Z]+)\s+(rupees|rupee|rupaye|रुपये)\b/gi,
    (_match, amount) => {
      const cleanAmount = amount.replace(/,/g, '');
      const numVal = NUMBER_WORDS[amount.toLowerCase()] ?? (isNaN(Number(cleanAmount)) ? null : Number(cleanAmount));
      if (numVal !== null) {
        return `₹${formatIndianNumber(numVal)}`;
      }
      return _match;
    }
  );

  // 6. Percentages: "<num> percent / pratishat" -> "<num>%"
  result = result.replace(
    /\b([0-9]+|[a-zA-Z]+)\s+(percent|percentage|pratishat|प्रतिशत)\b/gi,
    (_match, amount) => {
      const numVal = NUMBER_WORDS[amount.toLowerCase()] ?? (isNaN(Number(amount)) ? null : Number(amount));
      if (numVal !== null) {
        return `${numVal}%`;
      }
      return _match;
    }
  );

  return result;
}

/**
 * Removes conversational filler words while preserving grammar.
 */
export function removeFillers(text: string): string {
  if (!text) return '';

  let result = text;
  for (const regex of HINDI_FILLER_PHRASES) {
    result = result.replace(regex, '');
  }

  // Remove single token fillers
  const tokens = result.split(/\s+/);
  const filtered = tokens.filter((t) => {
    const clean = t.toLowerCase().replace(/[^\w]/g, '');
    return !FILLER_WORDS.has(clean);
  });

  return filtered.join(' ').replace(/\s+,/g, ',').replace(/\s{2,}/g, ' ').trim();
}

/**
 * Normalizes punctuation, capitalizes sentence boundaries, and applies
 * question mark punctuation for interrogative phrases.
 */
export function formatPunctuation(text: string): string {
  if (!text || text.trim().length === 0) return '';

  let trimmed = text.trim();

  // Capitalize first letter
  trimmed = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);

  // Check for interrogative start words
  const isQuestion = /^(kya|kyun|kaise|kab|kahan|kaun|kisne|who|what|why|when|where|how|is|are|can|could|would|should|do|does|did)\b/i.test(trimmed);

  // Ensure terminal punctuation
  const lastChar = trimmed.charAt(trimmed.length - 1);
  if (!['.', '?', '!', '।'].includes(lastChar)) {
    trimmed += isQuestion ? '?' : '.';
  } else if (lastChar === '.' && isQuestion) {
    trimmed = trimmed.slice(0, -1) + '?';
  }

  return trimmed;
}

/**
 * Normalizes a plain text string according to configured options.
 */
export function normalizeText(text: string, options: NormalizationOptions = DEFAULT_OPTIONS): string {
  let res = text;

  if (options.removeFillerWords) {
    res = removeFillers(res);
  }

  if (options.normalizeNumbers) {
    res = normalizeIndianNumbers(res);
  }

  if (options.formatPunctuation) {
    res = formatPunctuation(res);
  }

  return res;
}

/**
 * Normalizes a SubtitleEvent non-destructively, updating the display text
 * and optionally filtering filler word tokens from the words list.
 */
export function normalizeSubtitleEvent(
  event: SubtitleEvent,
  options: NormalizationOptions = DEFAULT_OPTIONS
): SubtitleEvent {
  const newText = normalizeText(event.text, options);

  let newWords = event.words;
  if (options.removeFillerWords && event.words) {
    newWords = event.words.filter((w) => {
      const clean = w.word.toLowerCase().replace(/[^\w]/g, '');
      return !FILLER_WORDS.has(clean);
    });
  }

  const duration = Math.max(0.1, event.endTime - event.startTime);
  const cps = duration > 0 ? Math.round((newText.length / duration) * 10) / 10 : 0;

  return {
    ...event,
    text: newText,
    words: newWords,
    cps,
    cpl: Math.max(...newText.split('\n').map((line) => line.length), 0),
    wordTimingState:
      (options.preserveWordTiming || (newText === event.text && newWords.length === (event.words?.length || 0)))
        ? event.wordTimingState || 'fresh'
        : 'stale',
  };
}
