import { Request, Response } from 'express';
import { CURATED_HABITS } from '../data/habits';
import { getOrFallback, getLocalUser, ensureLocalUser, UserProfile } from '../repository/db';
import { GeminiService, CoachContext, getCityGridIntensity } from '../services/gemini';
import { translateText, SUPPORTED_LANGUAGES } from '../services/translation';
import { admin } from '../services/firebase';

export const getHabits = async (req: Request, res: Response) => {
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
};

export const getLanguages = (_req: Request, res: Response) => {
  res.status(200).json({ languages: SUPPORTED_LANGUAGES });
};

export const updateProfile = async (req: Request, res: Response) => {
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
};

export const getProfile = async (req: Request, res: Response) => {
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
};

export const selectHabit = async (req: Request, res: Response) => {
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
};

export const logHabit = async (req: Request, res: Response) => {
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
      let isNew = false;
      if (!completions.includes(logDate)) {
        completions.push(logDate);
        const habit = CURATED_HABITS.find(h => h.id === activeHabitId)!;
        const co2Delta = habit.co2SavedPerDay;
        totalCo2Saved += co2Delta;
        streakCount += 1;
        await db.collection('users').doc(userId).update({ completionsThisWeek: completions, streakCount, totalCo2Saved });
        isNew = true;
      }
      return { completions, streakCount, totalCo2Saved, activeHabitId, alreadyLogged: !isNew };
    },
    () => {
      const user = ensureLocalUser(userId);
      if (!user.activeHabitId) throw new Error('No active habit selected');
      activeHabitId = user.activeHabitId;
      let isNew = false;
      if (!user.completionsThisWeek.includes(logDate)) {
        user.completionsThisWeek.push(logDate);
        const habit = CURATED_HABITS.find(h => h.id === activeHabitId)!;
        user.totalCo2Saved += habit.co2SavedPerDay;
        user.streakCount += 1;
        isNew = true;
      }
      return {
        completions: user.completionsThisWeek,
        streakCount: user.streakCount,
        totalCo2Saved: user.totalCo2Saved,
        activeHabitId: user.activeHabitId,
        alreadyLogged: !isNew
      };
    }
  );

  const currentHabit = CURATED_HABITS.find(h => h.id === result.activeHabitId);
  if (!currentHabit) {
    return res.status(500).json({ error: 'Active habit not found in catalogue' });
  }

  const alreadyLogged = result.alreadyLogged;

  res.status(200).json({
    message: alreadyLogged ? 'Already logged for today' : 'Habit logged successfully',
    alreadyLogged,
    date: logDate,
    streakCount: result.streakCount,
    totalCo2Saved: result.totalCo2Saved,
    completionsThisWeek: result.completions,
    co2SavedToday: currentHabit.co2SavedPerDay,
  });
};

export const getCoaching = async (req: Request, res: Response) => {
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
};
