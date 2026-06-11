import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

// ─── City CO₂ Grid Intensity (gCO₂e/kWh) ─────────────────────────────────
// Source: Our World in Data / Carbon Intensity UK DEFRA 2023
const CITY_GRID_INTENSITY: Record<string, number> = {
  'Mumbai': 820,
  'Delhi': 920,
  'Bangalore': 720,
  'Chennai': 700,
  'Kolkata': 900,
  'Hyderabad': 760,
  'San Francisco': 250,
  'New York': 280,
  'London': 210,
  'Berlin': 350,
  'default': 750, // India national average
};

// ─── Deterministic Fallback Analogies ────────────────────────────────────
export const DETERMINISTIC_FALLBACKS: Record<string, string[]> = {
  default: [
    'equivalent to charging your smartphone 800 times.',
    'the same carbon footprint as driving an average gas car for 25 miles.',
  ],
  'Cold-Water Laundry': [
    'the same energy savings as running your laptop continuously for 120 hours.',
    'equivalent to avoiding burning 2.5 pounds of coal.',
  ],
  'Unplug Standby Devices': [
    'equivalent to switching off a standard LED bulb for 300 hours.',
    'the carbon offset of charging your tablet 400 times.',
  ],
  'No-Meat Day': [
    'equivalent to saving 15 miles of driving emissions.',
    'equivalent to planting 0.6 new tree saplings and letting them grow for 10 years.',
  ],
  'Short Showers (Under 5 mins)': [
    'equivalent to saving emissions from boiling a kettle 40 times.',
    'the carbon offset of keeping a refrigerator running for 3 days.',
  ],
  'Walk or Cycle Short Trips': [
    'equivalent to not burning 350ml of petrol.',
    'the same as powering your home router for 10 days.',
  ],
};

export interface CoachContext {
  housingType: string;
  userCity: string;
  habitName: string;
  completionCount: number;
  rawCo2Saved: number;
  availableHabitsList: string[];
  diet?: 'mixed' | 'vegetarian' | 'vegan';
  weekNumber?: number;
  totalLifetimeCo2Saved?: number;
}

// ─── Gemini AI Client ─────────────────────────────────────────────────────
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// ─── Retry with Exponential Backoff ──────────────────────────────────────
async function retryWithBackoff<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    // Abort retries immediately if we hit a 429 / quota limit error
    if (error && (error.status === 429 || error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('Quota'))) {
      console.warn(`[GeminiService] API call failed with quota/rate limit error (429). Skipping retries.`);
      throw error;
    }
    if (retries <= 0) throw error;
    console.warn(`[GeminiService] API call failed. Retrying in ${delay}ms... (${retries} retries left)`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryWithBackoff(fn, retries - 1, delay * 2);
  }
}


/**
 * Resolve grid intensity factor for city-aware CO₂ calculations.
 */
export function getCityGridIntensity(city: string): number {
  return CITY_GRID_INTENSITY[city] ?? CITY_GRID_INTENSITY['default'];
}

// ─── Gemini Service ───────────────────────────────────────────────────────
export class GeminiService {
  /**
   * Generates context-injected AI coaching with graceful fallback.
   * Response is tagged with `source` field: 'gemini' | 'rules'.
   */
  static async generateCoaching(context: CoachContext): Promise<{ text: string; source: 'gemini' | 'rules' }> {
    if (!ai) {
      console.warn('[GeminiService] No API key. Using deterministic fallback.');
      return { text: this.getFallbackCoaching(context), source: 'rules' };
    }

    const systemPrompt = `You are HabitLoop's expert carbon coach helping users in ${context.userCity} reduce their carbon footprint.
Your job: make CO₂ metrics relatable, celebrate progress, and recommend the next weekly habit.
Tone: friendly, encouraging, specific to their city's environmental context.
Format: plain text only (no markdown). Under 150 words.
DO NOT use titles or headers.`;

    const dietContext = context.diet ? `, following a ${context.diet} diet` : '';
    const lifetimeContext = context.totalLifetimeCo2Saved
      ? ` Over all time, they have saved ${context.totalLifetimeCo2Saved.toFixed(2)} kg CO₂ total.`
      : '';

    const userMessage = `The user is a ${context.housingType} living in ${context.userCity}${dietContext}.
They completed their active habit "${context.habitName}" ${context.completionCount} out of 7 days this week, saving ${context.rawCo2Saved.toFixed(2)} kg of CO₂.${lifetimeContext}

Provide:
1. An encouraging congratulatory opening (1-2 sentences).
2. Two highly relatable real-world comparisons of this carbon savings (e.g. charging devices, hours of laptop use, miles driven, lightbulb hours, cups of tea boiled).
3. A personalized recommendation for their next weekly habit, chosen from: [${context.availableHabitsList.join(', ')}]. Explain briefly why this habit suits them.`;

    try {
      // Try gemini-2.0-flash first, fallback to gemini-1.5-flash
      let responseText = '';
      const modelsToTry = ['gemini-2.0-flash', 'gemini-1.5-flash'];
      
      for (const modelName of modelsToTry) {
        try {
          const model = ai.getGenerativeModel({ model: modelName, systemInstruction: systemPrompt });
          responseText = await retryWithBackoff(async () => {
            const result = await model.generateContent({
              contents: [{ role: 'user', parts: [{ text: userMessage }] }],
              generationConfig: { temperature: 0.7, maxOutputTokens: 300 },
            });
            return result.response.text();
          });
          break; // success, stop trying models
        } catch (modelErr) {
          console.warn(`[GeminiService] Model ${modelName} failed, trying next...`);
        }
      }

      if (!responseText) throw new Error('All models failed');
      return { text: responseText.trim(), source: 'gemini' };
    } catch (e) {
      console.error('[GeminiService] All models failed after retries:', e);
      return { text: this.getFallbackCoaching(context), source: 'rules' };
    }
  }

  /**
   * Deterministic rule-based fallback with ranked analogy selection.
   */
  static getFallbackCoaching(context: CoachContext): string {
    const habitKey = context.habitName in DETERMINISTIC_FALLBACKS
      ? context.habitName
      : 'default';
    const analogies = DETERMINISTIC_FALLBACKS[habitKey];

    const nextHabit =
      context.availableHabitsList.find(h => h !== context.habitName) ??
      'Walk or Cycle Short Trips';

    const completionRate = context.completionCount > 0
      ? `${context.completionCount}/7 days`
      : 'getting started';

    return `Great work completing your "${context.habitName}" habit ${completionRate} this week! You saved ${context.rawCo2Saved.toFixed(2)} kg of CO₂ — that's ${analogies[0]} and ${analogies[1]}\n\nFor next week, we recommend: ${nextHabit}. Keep the momentum going — every action counts!`;
  }
}
