/**
 * Script Representation and Transliteration System
 * Provides deterministic, high-speed transliteration between Devanagari and Roman script
 * with an English technical loanword preservation dictionary.
 */

import { ScriptMode } from '../types/models.js';

// Bidirectional English loanword map: Devanagari phonetic representation <-> standard English spelling
export const ENGLISH_LOANWORD_MAP: Record<string, string> = {
  'लॉगिन': 'login',
  'लॉगइन': 'login',
  'साइनअप': 'signup',
  'डेटाबेस': 'database',
  'डेटा': 'data',
  'फीचर': 'feature',
  'फीचर्स': 'features',
  'अपडेट': 'update',
  'अपडेट्स': 'updates',
  'मीटिंग': 'meeting',
  'प्रोजेक्ट': 'project',
  'प्रोजेक्ट्स': 'projects',
  'सिस्टम': 'system',
  'सर्वर': 'server',
  'स्क्रीन': 'screen',
  'कंप्यूटर': 'computer',
  'इंटरनेट': 'internet',
  'वीडियो': 'video',
  'ऑडियो': 'audio',
  'क्लिक': 'click',
  'बटन': 'button',
  'कोड': 'code',
  'कोडिंग': 'coding',
  'एरर': 'error',
  'बग': 'bug',
  'डाउनलोड': 'download',
  'अपलोड': 'upload',
  'सॉफ्टवेयर': 'software',
  'हार्डवेयर': 'hardware',
  'ऐप': 'app',
  'एप्लीकेशन': 'application',
  'वेबसाइट': 'website',
  'ईमेल': 'email',
  'पासवर्ड': 'password',
  'यूजर': 'user',
  'यूजर्स': 'users',
  'मोबाइल': 'mobile',
  'फोन': 'phone',
  'नेटवर्क': 'network',
  'मैसेज': 'message',
  'चैट': 'chat',
  'फाइल': 'file',
  'फोल्डर': 'folder',
  'स्टूडियो': 'studio',
  'सबटाइटल': 'subtitle',
  'सबटाइटल्स': 'subtitles',
  'कैप्शन': 'caption',
  'कैप्शंस': 'captions',
  'सब्सक्राइब': 'subscribe',
  'चैनल': 'channel',
  'फॉलो': 'follow',
  'लाइक': 'like',
  'कमेंट': 'comment',
  'शेयर': 'share',
  'कंटेंट': 'content',
  'क्रिएटर': 'creator',
  'व्यूज': 'views'
};

// Reverse map for quick lookup: standard English word (lowercase) -> Devanagari spelling
export const REVERSE_LOANWORD_MAP: Record<string, string> = {};
for (const [deva, eng] of Object.entries(ENGLISH_LOANWORD_MAP)) {
  REVERSE_LOANWORD_MAP[eng.toLowerCase()] = deva;
}

// Independent Devanagari vowels
const DEVA_VOWELS: Record<string, string> = {
  'अ': 'a',
  'आ': 'aa',
  'इ': 'i',
  'ई': 'ee',
  'उ': 'u',
  'ऊ': 'oo',
  'ऋ': 'ri',
  'ए': 'e',
  'ऐ': 'ai',
  'ओ': 'o',
  'औ': 'au',
};

// Devanagari matras (vowel signs)
const DEVA_MATRAS: Record<string, string> = {
  'ा': 'aa',
  'ि': 'i',
  'ी': 'ee',
  'ु': 'u',
  'ू': 'oo',
  'ृ': 'ri',
  'े': 'e',
  'ै': 'ai',
  'ो': 'o',
  'ौ': 'au',
};

// Devanagari consonants (default implicit 'a')
const DEVA_CONSONANTS: Record<string, string> = {
  'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ng',
  'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'ny',
  'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
  'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
  'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
  'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v',
  'श': 'sh', 'ष': 'sh', 'स': 's', 'ह': 'h',
  'क़': 'q', 'ख़': 'kh', 'ग़': 'gh', 'ज़': 'z', 'ड़': 'r', 'ढ़': 'rh', 'फ़': 'f',
};

// Virama (halant)
const VIRAMA = '्';
// Anusvara & Chandrabindu
const ANUSVARA = 'ं';
const CHANDRABINDU = 'ँ';
const VISARGA = 'ः';
const NUKTA = '़';

/**
 * Transliterates a single Devanagari word into Roman script.
 * Preserves English loanword spelling if matched in dictionary.
 */
export function devanagariWordToRoman(word: string): string {
  // 1. Check direct English loanword dictionary
  const cleanWord = word.replace(/[^\u0900-\u097F]/g, '');
  if (ENGLISH_LOANWORD_MAP[cleanWord]) {
    return ENGLISH_LOANWORD_MAP[cleanWord];
  }

  // Also check without trailing punctuation
  const lowerWord = word.trim();
  if (ENGLISH_LOANWORD_MAP[lowerWord]) {
    return ENGLISH_LOANWORD_MAP[lowerWord];
  }

  let result = '';
  const len = word.length;

  for (let i = 0; i < len; i++) {
    const ch = word[i];
    const nextCh = i + 1 < len ? word[i + 1] : '';

    // Independent Vowel
    if (DEVA_VOWELS[ch]) {
      result += DEVA_VOWELS[ch];
      continue;
    }

    // Consonant
    if (DEVA_CONSONANTS[ch]) {
      const base = DEVA_CONSONANTS[ch];

      if (nextCh === VIRAMA) {
        result += base;
        i++; // Skip virama
      } else if (DEVA_MATRAS[nextCh]) {
        result += base + DEVA_MATRAS[nextCh];
        i++; // Skip matra
      } else if (nextCh === NUKTA) {
        // Nukta handled if combined
        result += base + 'a';
      } else if (i === len - 1) {
        // Schwa deletion at word boundary in conversational Hindi
        result += base;
      } else {
        result += base + 'a';
      }
      continue;
    }

    // Special signs
    if (ch === ANUSVARA || ch === CHANDRABINDU) {
      result += 'n';
    } else if (ch === VISARGA) {
      result += 'h';
    } else if (ch === '।') {
      result += '.';
    } else {
      result += ch;
    }
  }

  return result;
}

/**
 * Transliterates a complete string of Devanagari text into Roman Hinglish.
 */
export function devanagariToRoman(text: string): string {
  if (!text) return '';

  return text
    .split(/(\s+|[.,!?;:"'()\[\]{}]+)/)
    .map((token) => {
      // Check if token contains Devanagari
      if (/[\u0900-\u097F]/.test(token)) {
        return devanagariWordToRoman(token);
      }
      return token;
    })
    .join('');
}

// Common conversational Roman words to Devanagari mapping
const ROMAN_TO_DEVA_MAP: Record<string, string> = {
  'ye': 'ये', 'yeh': 'यह', 'woh': 'वह', 'wo': 'वो',
  'hai': 'है', 'hain': 'हैं', 'tha': 'था', 'thi': 'थी', 'the': 'थे',
  'kya': 'क्या', 'kyun': 'क्यों', 'kaise': 'कैसे', 'kahan': 'कहाँ', 'kab': 'कब',
  'aur': 'और', 'lekin': 'लेकिन', 'agar': 'अगर', 'toh': 'तो', 'to': 'तो',
  'nahi': 'नहीं', 'nahin': 'नहीं', 'na': 'ना', 'matlab': 'मतलब', 'achha': 'अच्छा',
  'accha': 'अच्छा', 'yaar': 'यार', 'bhai': 'भाई', 'karo': 'करो', 'karna': 'करना',
  'karenge': 'करेंगे', 'kar': 'कर', 'hoga': 'होगा', 'hogi': 'होगी', 'honge': 'होंगे',
  'ho': 'हो', 'kiya': 'किया', 'gaya': 'गया', 'gayi': 'गयी', 'gaye': 'गए',
  'rahe': 'रहे', 'rahi': 'रही', 'raha': 'रहा', 'mujhe': 'मुझे', 'tumhe': 'तुम्हें',
  'aapko': 'आपको', 'hume': 'हमें', 'hum': 'हम', 'tum': 'तुम', 'aap': 'आप',
  'apna': 'अपना', 'apni': 'अपनी', 'apne': 'अपने', 'mera': 'मेरा', 'meri': 'मेरी',
  'mere': 'मेरे', 'tera': 'तेरा', 'teri': 'तेरी', 'tere': 'तेरे', 'uska': 'उसका',
  'uski': 'उसकी', 'uske': 'उसके', 'unka': 'उनका', 'unki': 'उनकी', 'unke': 'उनके',
  'par': 'पर', 'pe': 'पे', 'se': 'से', 'ko': 'को', 'ke': 'के', 'ki': 'की', 'ka': 'का',
  'ek': 'एक', 'do': 'दो', 'teen': 'तीन', 'char': 'चार', 'paanch': 'पाँच',
  'baat': 'बात', 'bol': 'बोल', 'dekh': 'देख', 'samajh': 'समझ', 'bhi': 'भी',
  'ab': 'अब', 'tab': 'तब', 'jab': 'जब', 'sab': 'सब', 'kuch': 'कुछ', 'koi': 'कोई',
  'bahut': 'बहुत', 'bohot': 'बहुत', 'thoda': 'थोड़ा', 'jyada': 'ज्यादा', 'behtar': 'बेहतर',
};

/**
 * Transliterates a Roman Hinglish string into Devanagari script,
 * preserving verified English technical terms in Latin script.
 */
export function romanToDevanagari(text: string): string {
  if (!text) return '';

  return text
    .split(/(\s+|[.,!?;:"'()\[\]{}]+)/)
    .map((token) => {
      const lower = token.toLowerCase();

      // If token is an English technical loanword, preserve it in English!
      if (REVERSE_LOANWORD_MAP[lower]) {
        return token;
      }

      // Check common conversational Hindi vocabulary
      if (ROMAN_TO_DEVA_MAP[lower]) {
        return ROMAN_TO_DEVA_MAP[lower];
      }

      return token;
    })
    .join('');
}

/**
 * Transforms text into the user's requested ScriptMode.
 */
export function transformScript(text: string, mode: ScriptMode): string {
  switch (mode) {
    case 'roman':
      return devanagariToRoman(text);
    case 'devanagari':
      return romanToDevanagari(text);
    case 'exact':
    case 'cleaned':
    default:
      return text;
  }
}
