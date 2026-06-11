import { Router, Request, Response } from 'express';
import { GeminiService, CoachContext, getCityGridIntensity } from '../services/gemini';
import { translateText, SUPPORTED_LANGUAGES } from '../services/translation';
import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

const router = Router();

// ─── Curated Habits Catalogue ─────────────────────────────────────────────
export const CURATED_HABITS = [
  { id: 'h1', name: 'Cold-Water Laundry', co2SavedPerDay: 0.8, category: 'Home Energy', icon: '🧺', description: 'Washing clothes in cold water uses 90% less energy.' },
  { id: 'h2', name: 'Unplug Standby Devices', co2SavedPerDay: 0.3, category: 'Home Energy', icon: '🔌', description: 'Standby power accounts for up to 10% of home electricity use.' },
  { id: 'h3', name: 'No-Meat Day', co2SavedPerDay: 2.1, category: 'Diet', icon: '🥗', description: 'One meatless day per week can cut your diet footprint by 15%.' },
  { id: 'h4', name: 'Short Showers (Under 5 mins)', co2SavedPerDay: 0.6, category: 'Water Heating', icon: '🚿', description: 'Cutting shower time saves water heating energy and water.' },
  { id: 'h5', name: 'Walk or Cycle Short Trips', co2SavedPerDay: 1.5, category: 'Transport', icon: '🚴', description: 'Replacing car trips under 2km with walking or cycling.' },
];

// ─── Firebase Initialization ───────────────────────────────────────────────
let isFirebaseInitialized = false;
try {
  if (process.env.NODE_ENV !== 'test' && admin.apps.length === 0) {
    const serviceAccountPath = path.join(__dirname, '../../service-account.json');
    if (fs.existsSync(serviceAccountPath)) {
      admin.initializeApp({ credential: admin.credential.cert(serviceAccountPath) });
    } else {
      admin.initializeApp();
    }
    isFirebaseInitialized = true;
    console.log('[Firestore] Firebase Admin initialized.');
  }
} catch (e) {
  console.warn('[Firestore] Firebase init failed. Using in-memory fallback.');
}

// ─── In-Memory Fallback DB ────────────────────────────────────────────────
interface UserProfile {
  uid: string;
  activeHabitId: string;
  housingType: string;
  city: string;
  diet: 'mixed' | 'vegetarian' | 'vegan';
  language: string;
  completionsThisWeek: string[];
  streakCount: number;
  totalCo2Saved: number;
  weeklyLogs: { weekStart: string; habitId: string; completions: number; co2Saved: number }[];
}

const localDb: { users: Record<string, UserProfile> } = {
  users: {
    'test-user': {
      uid: 'test-user',
      activeHabitId: 'h1',
      housingType: 'Apartment Renter',
      city: 'Mumbai',
      diet: 'mixed',
      language: 'en',
      completionsThisWeek: [],
      streakCount: 0,
      totalCo2Saved: 0,
      weeklyLogs: [],
    },
  },
};

function getLocalUser(userId: string): UserProfile | null {
  return localDb.users[userId] ?? null;
}

function ensureLocalUser(userId: string): UserProfile {
  if (!localDb.users[userId]) {
    localDb.users[userId] = {
      uid: userId,
      activeHabitId: 'h1',
      housingType: 'Apartment Renter',
      city: 'Mumbai',
      diet: 'mixed',
      language: 'en',
      completionsThisWeek: [],
      streakCount: 0,
      totalCo2Saved: 0,
      weeklyLogs: [],
    };
  }
  return localDb.users[userId];
}

// ─── Helper: Firestore with local fallback ────────────────────────────────
async function getOrFallback<T>(
  firestoreOp: () => Promise<T>,
  fallback: () => T
): Promise<T> {
  if (isFirebaseInitialized) {
    try {
      return await firestoreOp();
    } catch (e: any) {
      console.warn('[Firestore] Op failed, using in-memory:', e.message);
      isFirebaseInitialized = false;
    }
  }
  return fallback();
}

// ─── GET /api/habits ───────────────────────────────────────────────────────
router.get('/habits', async (req: Request, res: Response) => {
  const lang = (req.query.lang as string) || 'en';
  if (lang !== 'en') {
    const translated = await Promise.all(
      CURATED_HABITS.map(async h => ({
        ...h,
        name: await translateText(h.name, lang),
        category: await translateText(h.category, lang),
        description: await translateText(h.description, lang),
      }))
    );
    return res.status(200).json({ habits: translated });
  }
  res.status(200).json({ habits: CURATED_HABITS });
});

// ─── GET /api/languages ───────────────────────────────────────────────────
router.get('/languages', (_req: Request, res: Response) => {
  res.status(200).json({ languages: SUPPORTED_LANGUAGES });
});

// ─── POST /api/user/profile ───────────────────────────────────────────────
router.post('/user/profile', async (req: Request, res: Response) => {
  const { userId, housingType, city, diet, language } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  const update: Partial<UserProfile> = {};
  if (housingType) update.housingType = housingType;
  if (city) update.city = city;
  if (diet) update.diet = diet;
  if (language && SUPPORTED_LANGUAGES[language]) update.language = language;

  await getOrFallback(
    async () => {
      const db = admin.firestore();
      await db.collection('users').doc(userId).set(update, { merge: true });
    },
    () => {
      const user = ensureLocalUser(userId);
      Object.assign(user, update);
    }
  );

  res.status(200).json({ message: 'Profile updated', profile: update });
});

// ─── GET /api/user/profile ────────────────────────────────────────────────
router.get('/user/profile/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;
  const profile = await getOrFallback(
    async () => {
      const db = admin.firestore();
      const doc = await db.collection('users').doc(userId).get();
      return doc.exists ? doc.data() : null;
    },
    () => getLocalUser(userId)
  );

  if (!profile) return res.status(404).json({ error: 'User not found' });
  res.status(200).json({ profile });
});

// ─── POST /api/habits/select ──────────────────────────────────────────────
router.post('/habits/select', async (req: Request, res: Response) => {
  const { userId, habitId } = req.body;
  if (!userId || !habitId) return res.status(400).json({ error: 'userId and habitId are required' });

  const habit = CURATED_HABITS.find(h => h.id === habitId);
  if (!habit) return res.status(404).json({ error: 'Habit not found' });

  await getOrFallback(
    async () => {
      const db = admin.firestore();
      await db.collection('users').doc(userId).set(
        { activeHabitId: habitId, completionsThisWeek: [], lastUpdated: admin.firestore.FieldValue.serverTimestamp() },
        { merge: true }
      );
    },
    () => {
      const user = ensureLocalUser(userId);
      user.activeHabitId = habitId;
      user.completionsThisWeek = [];
    }
  );

  res.status(200).json({ message: `Successfully selected: ${habit.name}`, activeHabit: habit });
});

// ─── POST /api/habits/log ─────────────────────────────────────────────────
router.post('/habits/log', async (req: Request, res: Response) => {
  const { userId, date } = req.body;
  const logDate = date || new Date().toISOString().split('T')[0];
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  let streakCount = 0;
  let totalCo2Saved = 0;
  let completions: string[] = [];
  let activeHabitId = '';

  const result = await getOrFallback(
    async () => {
      const db = admin.firestore();
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) throw new Error('User not found');
      const data = userDoc.data()!;
      activeHabitId = data.activeHabitId;
      completions = data.completionsThisWeek || [];
      streakCount = data.streakCount || 0;
      totalCo2Saved = data.totalCo2Saved || 0;

      if (!activeHabitId) throw new Error('No active habit selected');
      if (!completions.includes(logDate)) {
        completions.push(logDate);
        const habit = CURATED_HABITS.find(h => h.id === activeHabitId)!;
        const co2Delta = habit.co2SavedPerDay;
        totalCo2Saved += co2Delta;
        streakCount += 1;
        await db.collection('users').doc(userId).update({ completionsThisWeek: completions, streakCount, totalCo2Saved });
      }
      return { completions, streakCount, totalCo2Saved, activeHabitId };
    },
    () => {
      const user = ensureLocalUser(userId);
      if (!user.activeHabitId) throw new Error('No active habit selected');
      activeHabitId = user.activeHabitId;
      if (!user.completionsThisWeek.includes(logDate)) {
        user.completionsThisWeek.push(logDate);
        const habit = CURATED_HABITS.find(h => h.id === activeHabitId)!;
        user.totalCo2Saved += habit.co2SavedPerDay;
        user.streakCount += 1;
      }
      return {
        completions: user.completionsThisWeek,
        streakCount: user.streakCount,
        totalCo2Saved: user.totalCo2Saved,
        activeHabitId: user.activeHabitId,
      };
    }
  );

  const currentHabit = CURATED_HABITS.find(h => h.id === result.activeHabitId)!;
  res.status(200).json({
    message: 'Habit logged successfully',
    date: logDate,
    streakCount: result.streakCount,
    totalCo2Saved: result.totalCo2Saved,
    completionsThisWeek: result.completions,
    co2SavedToday: currentHabit.co2SavedPerDay,
  });
});

// ─── POST /api/habits/coach ───────────────────────────────────────────────
router.post('/habits/coach', async (req: Request, res: Response) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  const userData = await getOrFallback(
    async () => {
      const db = admin.firestore();
      const doc = await db.collection('users').doc(userId).get();
      if (!doc.exists) return null;
      return doc.data();
    },
    () => getLocalUser(userId)
  );

  if (!userData || !userData.activeHabitId) {
    return res.status(400).json({ error: 'No active habit selected to analyze' });
  }

  const activeHabit = CURATED_HABITS.find(h => h.id === userData.activeHabitId)!;
  const completions: string[] = userData.completionsThisWeek || [];
  const weeklyCo2Saved = completions.length * activeHabit.co2SavedPerDay;
  const gridIntensity = getCityGridIntensity(userData.city || 'default');

  const context: CoachContext = {
    housingType: userData.housingType || 'Apartment Renter',
    userCity: userData.city || 'Mumbai',
    habitName: activeHabit.name,
    completionCount: completions.length,
    rawCo2Saved: weeklyCo2Saved,
    availableHabitsList: CURATED_HABITS.filter(h => h.id !== userData.activeHabitId).map(h => h.name),
    diet: userData.diet || 'mixed',
    totalLifetimeCo2Saved: userData.totalCo2Saved || 0,
  };

  try {
    const { text: coachingText, source } = await GeminiService.generateCoaching(context);
    const lang = userData.language || 'en';
    const translatedCoaching = await translateText(coachingText, lang);

    res.status(200).json({
      coachingFeedback: translatedCoaching,
      source,
      gridIntensity,
      metrics: {
        completions: completions.length,
        completionRate: `${completions.length}/7`,
        rawCo2Saved: weeklyCo2Saved,
        streak: userData.streakCount || 0,
        totalLifetimeCo2Saved: userData.totalCo2Saved || 0,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
