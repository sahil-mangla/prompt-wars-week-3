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
const geminiApiKey = process.env.GEMINI_API_KEY || '';
if (geminiApiKey) {
  geminiClient = new GoogleGenerativeAI(geminiApiKey);
}

// ─── Cache to avoid redundant API calls ──────────────────────────────────
const translationCache = new Map<string, string>();

/**
 * Translate text to the target language using Gemini.
 * Falls back to passthrough (English) if unavailable.
 */
export async function translateText(
  text: string,
  targetLang: string
): Promise<string> {
  if (!text || targetLang === 'en') return text;

  const cacheKey = `${targetLang}:${text.slice(0, 60)}`;
  if (translationCache.has(cacheKey)) return translationCache.get(cacheKey)!;

  if (geminiClient) {
    try {
      const model = geminiClient.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const langName = SUPPORTED_LANGUAGES[targetLang] ?? targetLang;
      const prompt = `Translate the following text to ${langName}. Return ONLY the translated text with no extra commentary or quotation marks.\n\n${text}`;
      const result = await model.generateContent(prompt);
      const translated = result.response.text().trim();
      translationCache.set(cacheKey, translated);
      return translated;
    } catch (err) {
      console.warn('[TranslationService] Gemini translation failed, returning original:', err);
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
