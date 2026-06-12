export interface Habit {
  id: string;
  name: string;
  co2SavedPerDay: number;
  category: string;
  icon: string;
  description: string;
}

export interface WeeklyMetrics {
  completions: number;
  completionRate: string;
  rawCo2Saved: number;
  streak: number;
  totalLifetimeCo2Saved: number;
}

export interface HabitCardProps {
  userId: string;
  backendUrl: string;
}

export interface UserProfile {
  language: string;
  city: string;
  housingType: string;
  diet: 'mixed' | 'vegetarian' | 'vegan';
}
