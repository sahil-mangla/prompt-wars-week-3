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

// ─── Expanded Deterministic Fallback Analogies ────────────────────────────
// 5+ entries per habit so random selection produces meaningfully different text.
export const DETERMINISTIC_FALLBACKS: Record<string, string[]> = {
  default: [
    'equivalent to charging your smartphone 800 times.',
    'the same carbon footprint as driving an average gas car for 25 miles.',
    'like skipping 3 short car trips across the city.',
    'the same as keeping a 60W bulb lit for an entire week.',
    'equivalent to planting a tree sapling and letting it grow for a full month.',
    'the same energy as streaming HD video for 18 hours.',
  ],
  'Cold-Water Laundry': [
    'the same energy savings as running your laptop continuously for 120 hours.',
    'equivalent to avoiding burning 2.5 pounds of coal.',
    'like powering your Wi-Fi router for an entire month.',
    'the same as charging a tablet computer 300 times over.',
    'equivalent to boiling 60 kettles of water — heat you did not have to generate.',
    'like skipping a 10-minute hot shower every day for two weeks.',
  ],
  'Unplug Standby Devices': [
    'equivalent to switching off a standard LED bulb for 300 hours.',
    'the carbon offset of charging your tablet 400 times.',
    'like eliminating a phantom load that silently drains your meter all night.',
    'the same as not running your TV in standby for an entire month.',
    'equivalent to 2 hours of avoided coal combustion at a power plant.',
    'like giving back the electricity equivalent of 150 smartphone charges to the grid.',
  ],
  'No-Meat Day': [
    'equivalent to saving 15 miles of driving emissions.',
    'equivalent to planting 0.6 new tree saplings and letting them grow for 10 years.',
    'the same as taking a small car completely off the road for an entire afternoon.',
    'like skipping 4 kg of beef production — some of the most carbon-intensive food on earth.',
    'equivalent to avoiding 200 liters of water use on top of the CO₂ savings.',
    'the same carbon benefit as cycling instead of driving for 30 km.',
  ],
  'Short Showers (Under 5 mins)': [
    'equivalent to saving emissions from boiling a kettle 40 times.',
    'the carbon offset of keeping a refrigerator running for 3 days.',
    'like not heating 80 liters of water that would otherwise pour down the drain.',
    'the same as powering a laptop for 8 full working hours.',
    'equivalent to switching off your bathroom heater for an entire week.',
    'like saving the energy used to run a dishwasher through 2 complete cycles.',
  ],
  'Walk or Cycle Short Trips': [
    'equivalent to not burning 350 ml of petrol.',
    'the same as powering your home router for 10 days.',
    'like removing your car from the road for half a day.',
    'equivalent to keeping a ceiling fan running for an entire month.',
    'the same as avoiding 1.2 kg of tailpipe CO₂ from a typical sedan.',
    'like recharging an electric scooter battery 12 times over.',
  ],
};

// ─── Rotating opener templates (5 tiers) ─────────────────────────────────
// Chosen based on completionCount so early, mid, and full-week efforts are celebrated differently.
const OPENER_TEMPLATES = [
  (habit: string, days: string) =>
    `Amazing effort on your "${habit}" habit ${days} this week! Every day you show up counts.`,
  (habit: string, days: string) =>
    `Solid progress! You stayed consistent with "${habit}" ${days} — that's the kind of habit that stacks up into real climate impact.`,
  (habit: string, days: string) =>
    `You're building momentum! "${habit}" completed ${days} is no small feat — well done.`,
  (habit: string, days: string) =>
    `Great work this week! "${habit}" ${days} puts you firmly in the top tier of eco-conscious habit-builders.`,
  (habit: string, days: string) =>
    `Incredible — a full streak on "${habit}" ${days}! You're making a measurable difference. Keep it going.`,
];

// ─── Rotating recommendation framings ─────────────────────────────────────
const RECOMMENDATION_FRAMINGS = [
  (next: string) => `For next week, we recommend trying: **${next}**. It pairs perfectly with your current progress.`,
  (next: string) => `Ready for your next challenge? Consider adding **${next}** to your weekly routine — it's a high-impact choice.`,
  (next: string) => `Next week's suggestion: **${next}**. Small daily shifts here can compound into serious CO₂ savings over time.`,
];

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
      // Call gemini-2.5-flash exactly once, with no retries or fallback models
      const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash', systemInstruction: systemPrompt });
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 300 },
      });
      const responseText = result.response.text();
      if (!responseText) {
        throw new Error('Empty response from model');
      }
      return { text: responseText.trim(), source: 'gemini' };
    } catch (e: any) {
      console.error('[GeminiService] Gemini API call failed. Falling back to rules immediately. Error:', e.message || e);
      return { text: this.getFallbackCoaching(context), source: 'rules' };
    }
  }

  /**
   * Deterministic rule-based fallback with randomized analogy selection.
   * Picks 2 distinct analogies from the expanded pool each call.
   * Rotates opener and recommendation framing based on completionCount.
   */
  static getFallbackCoaching(context: CoachContext): string {
    const habitKey = context.habitName in DETERMINISTIC_FALLBACKS
      ? context.habitName
      : 'default';
    const pool = DETERMINISTIC_FALLBACKS[habitKey];

    // Pick 2 distinct random analogies from the pool
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const [analogy1, analogy2] = shuffled;

    const nextHabit =
      context.availableHabitsList.find(h => h !== context.habitName) ??
      'Walk or Cycle Short Trips';

    const completionRate = context.completionCount > 0
      ? `${context.completionCount}/7 days`
      : 'getting started';

    // Rotate opener by completionCount tier (0–2, 3–4, 5, 6, 7)
    const openerTier = Math.min(
      Math.floor(context.completionCount / 1.5),
      OPENER_TEMPLATES.length - 1
    );
    const opener = OPENER_TEMPLATES[openerTier](context.habitName, completionRate);

    // Rotate recommendation framing randomly
    const framing = RECOMMENDATION_FRAMINGS[Math.floor(Math.random() * RECOMMENDATION_FRAMINGS.length)];

    return `${opener}\n\nYou saved ${context.rawCo2Saved.toFixed(2)} kg of CO₂ — that's ${analogy1} And also ${analogy2}\n\n${framing(nextHabit)} Every action counts!`;
  }
}
