/**
 * Language Detection and Code-Switching Classifier
 * Analyzes script distribution and lexical token transitions to classify
 * utterances as pure English, pure Hindi, or code-switched Hinglish.
 */

export type LanguageClassification = 'pure_english' | 'pure_hindi' | 'code_switched_hinglish';

export interface LanguageClassificationResult {
  classification: LanguageClassification;
  confidence: number;
  devanagariRatio: number;
  latinRatio: number;
  hindiMarkerRatio: number;
  dominantScript: 'devanagari' | 'latin' | 'mixed';
  detectedHinglishTokens: string[];
}

// Common conversational Hindi functional and grammatical markers written in Latin script
const HINDI_PHONETIC_MARKERS = new Set([
  'hai', 'hain', 'tha', 'thi', 'kya', 'kyun', 'kaise', 'kahan', 'kab',
  'kaun', 'aur', 'lekin', 'agar', 'toh', 'nahi', 'nahin', 'matlab', 'achha',
  'accha', 'yaar', 'bhai', 'karo', 'karna', 'karenge', 'kar', 'hoga', 'hogi',
  'honge', 'ho', 'kiya', 'gaya', 'gayi', 'gaye', 'rahe', 'rahi', 'raha', 'mujhe',
  'tumhe', 'aapko', 'hume', 'hum', 'tum', 'aap', 'apna', 'apni', 'apne', 'mera',
  'meri', 'mere', 'tera', 'teri', 'tere', 'uska', 'uski', 'uske', 'unka', 'unki',
  'unke', 'isko', 'usko', 'kisko', 'par', 'pe', 'se', 'ko', 'ke', 'ki', 'ka',
  'ek', 'do', 'teen', 'char', 'paanch', 'baat', 'bol', 'dekh', 'samajh', 'bhi',
  'ab', 'tab', 'jab', 'sab', 'kuch', 'koi', 'bohot', 'bahut', 'thoda', 'jyada', 'behtar',
]);

const ENGLISH_COMMON_STOPWORDS = new Set([
  'the', 'is', 'are', 'was', 'were', 'this', 'that', 'these', 'those', 'with',
  'from', 'have', 'has', 'had', 'will', 'would', 'could', 'should', 'and', 'but',
  'because', 'about', 'into', 'through', 'before', 'after', 'for', 'you', 'they',
  'we', 'he', 'she', 'it', 'my', 'your', 'his', 'her', 'their', 'our', 'what',
  'which', 'who', 'whom', 'where', 'when', 'why', 'how', 'all', 'any', 'both',
  'each', 'few', 'more', 'most', 'other', 'some', 'such', 'than', 'too', 'very',
]);

/**
 * Classifies an input text string or token sequence.
 */
export function classifyLanguage(text: string): LanguageClassificationResult {
  if (!text || text.trim().length === 0) {
    return {
      classification: 'pure_english',
      confidence: 1.0,
      devanagariRatio: 0,
      latinRatio: 0,
      hindiMarkerRatio: 0,
      dominantScript: 'latin',
      detectedHinglishTokens: [],
    };
  }

  let devanagariChars = 0;
  let latinChars = 0;
  let totalChars = 0;

  for (const ch of text) {
    const code = ch.charCodeAt(0);
    // Devanagari range: \u0900 to \u097F
    if (code >= 0x0900 && code <= 0x097f) {
      devanagariChars++;
      totalChars++;
    } else if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122)) {
      latinChars++;
      totalChars++;
    }
  }

  const devanagariRatio = totalChars > 0 ? devanagariChars / totalChars : 0;
  const latinRatio = totalChars > 0 ? latinChars / totalChars : 0;

  let dominantScript: 'devanagari' | 'latin' | 'mixed' = 'latin';
  if (devanagariRatio > 0.75) {
    dominantScript = 'devanagari';
  } else if (latinRatio > 0.75) {
    dominantScript = 'latin';
  } else {
    dominantScript = 'mixed';
  }

  // Tokenize words
  const words = text
    .toLowerCase()
    .replace(/[^\w\s\u0900-\u097F]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const totalWords = words.length;
  const detectedHinglishTokens: string[] = [];
  let englishMarkerCount = 0;

  for (const word of words) {
    if (HINDI_PHONETIC_MARKERS.has(word)) {
      detectedHinglishTokens.push(word);
    }
    if (ENGLISH_COMMON_STOPWORDS.has(word)) {
      englishMarkerCount++;
    }
  }

  const hindiMarkerRatio = totalWords > 0 ? detectedHinglishTokens.length / totalWords : 0;

  // Case 1: Mixed script presence (Latin and Devanagari both present meaningfully)
  if (devanagariRatio >= 0.15 && latinRatio >= 0.15) {
    return {
      classification: 'code_switched_hinglish',
      confidence: Math.min(0.95, 0.5 + (devanagariRatio * latinRatio * 4)),
      devanagariRatio: Number(devanagariRatio.toFixed(3)),
      latinRatio: Number(latinRatio.toFixed(3)),
      hindiMarkerRatio: Number(hindiMarkerRatio.toFixed(3)),
      dominantScript,
      detectedHinglishTokens,
    };
  }

  // Case 2: Pure Devanagari script
  if (devanagariRatio > 0.75) {
    return {
      classification: 'pure_hindi',
      confidence: Number(devanagariRatio.toFixed(3)),
      devanagariRatio: Number(devanagariRatio.toFixed(3)),
      latinRatio: Number(latinRatio.toFixed(3)),
      hindiMarkerRatio: Number(hindiMarkerRatio.toFixed(3)),
      dominantScript,
      detectedHinglishTokens,
    };
  }

  // Case 3: Latin script - distinguish Pure English vs Roman Hinglish
  if (detectedHinglishTokens.length >= 2 || hindiMarkerRatio >= 0.15) {
    const confidence = Math.min(0.98, 0.6 + hindiMarkerRatio);
    return {
      classification: 'code_switched_hinglish',
      confidence: Number(confidence.toFixed(3)),
      devanagariRatio: Number(devanagariRatio.toFixed(3)),
      latinRatio: Number(latinRatio.toFixed(3)),
      hindiMarkerRatio: Number(hindiMarkerRatio.toFixed(3)),
      dominantScript,
      detectedHinglishTokens,
    };
  }

  return {
    classification: 'pure_english',
    confidence: Number((1.0 - hindiMarkerRatio).toFixed(3)),
    devanagariRatio: Number(devanagariRatio.toFixed(3)),
    latinRatio: Number(latinRatio.toFixed(3)),
    hindiMarkerRatio: Number(hindiMarkerRatio.toFixed(3)),
    dominantScript,
    detectedHinglishTokens: [],
  };
}
