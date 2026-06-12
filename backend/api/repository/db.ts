import { admin, isFirebaseInitialized } from '../services/firebase';

export interface UserProfile {
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

export function getLocalUser(userId: string): UserProfile | null {
  return localDb.users[userId] ?? null;
}

export function ensureLocalUser(userId: string): UserProfile {
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

export async function getOrFallback<T>(
  firestoreOp: () => Promise<T>,
  fallback: () => T
): Promise<T> {
  if (isFirebaseInitialized) {
    try {
      return await firestoreOp();
    } catch (e: any) {
      console.warn('[Firestore] Op failed, using in-memory fallback for this request:', e.message);
    }
  }
  return fallback();
}
