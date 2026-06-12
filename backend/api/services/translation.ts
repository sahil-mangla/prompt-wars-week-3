import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

// ─── Supported Languages ───────────────────────────────────────────────────
export const SUPPORTED_LANGUAGES: Record<string, string> = {
  en: 'English',
  hi: 'Hindi',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  mr: 'Marathi',
  pt: 'Portuguese',
  ta: 'Tamil',
};

// ─── Gemini Translation Client ────────────────────────────────────────────
let geminiClient: GoogleGenerativeAI | null = null;
function getTranslationClient(): GoogleGenerativeAI | null {
  if (!geminiClient) {
    const geminiApiKey = process.env.GEMINI_API_KEY || '';
    if (geminiApiKey) {
      geminiClient = new GoogleGenerativeAI(geminiApiKey);
    }
  }
  return geminiClient;
}

// ─── Cache to avoid redundant API calls ──────────────────────────────────
const translationCache = new Map<string, string>();

/**
 * Lightweight string hash (djb2) for stable cache keys.
 * Avoids collisions that would occur when using only the first 60 chars
 * of similar coaching messages.
 */
function hashString(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash = hash >>> 0; // convert to unsigned 32-bit
  }
  return hash.toString(36);
}

/**
 * Translate text to the target language using Gemini.
 * Falls back to passthrough (English) if unavailable.
 */
export async function translateText(
  text: string,
  targetLang: string
): Promise<string> {
  if (!text || targetLang === 'en') return text;

  const cacheKey = `${targetLang}:${hashString(text)}`;
  if (translationCache.has(cacheKey)) return translationCache.get(cacheKey)!;

  const client = getTranslationClient();
  if (client) {
    const modelName = 'gemini-2.5-flash';
    try {
      const model = client.getGenerativeModel({ model: modelName });
      const langName = SUPPORTED_LANGUAGES[targetLang] ?? targetLang;
      const prompt = `Translate the following text to ${langName}. Return ONLY the translated text with no extra commentary or quotation marks.\n\n${text}`;
      const result = await model.generateContent(prompt);
      const translated = result.response.text().trim();
      translationCache.set(cacheKey, translated);
      return translated;
    } catch (err: any) {
      console.error(`[TranslationService] Gemini translation failed with ${modelName}:`, err.message || err);
    }
  }

  return text;
}

/**
 * Bulk translate a record of key→value strings.
 */
export async function translateRecord(
  record: Record<string, string>,
  targetLang: string
): Promise<Record<string, string>> {
  if (targetLang === 'en') return record;
  const entries = Object.entries(record);
  const translated = await Promise.all(
    entries.map(async ([key, value]) => [key, await translateText(value, targetLang)])
  );
  return Object.fromEntries(translated);
}
