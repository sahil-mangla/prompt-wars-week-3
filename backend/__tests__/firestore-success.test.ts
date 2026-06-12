import request from 'supertest';
import app from '../api/index';
import { CURATED_HABITS } from '../api/data/habits';
import { translateText } from '../api/services/translation';
import { GeminiService, getCityGridIntensity } from '../api/services/gemini';

jest.mock('../api/services/translation');
jest.mock('../api/services/gemini');

jest.mock('../api/services/firebase', () => {
  const mockData: Record<string, any> = {};

  const firestoreMock = () => {
    return {
      collection: () => {
        return {
          doc: (id: string) => {
            return {
              set: (data: any, options?: any) => {
                mockData[id] = options?.merge ? { ...mockData[id], ...data } : data;
                return Promise.resolve();
              },
              get: () => {
                const exists = mockData[id] !== undefined;
                return Promise.resolve({
                  exists,
                  data: () => mockData[id],
                });
              },
              update: (data: any) => {
                mockData[id] = { ...mockData[id], ...data };
                return Promise.resolve();
              },
            };
          },
        };
      },
    };
  };

  (firestoreMock as any).FieldValue = {
    serverTimestamp: () => new Date().toISOString(),
  };

  return {
    isFirebaseInitialized: true,
    admin: {
      firestore: firestoreMock,
    },
  };
});

describe('Firestore Success Paths Integration Tests', () => {
  const userId = 'firestore-success-user';

  beforeEach(() => {
    jest.clearAllMocks();

    jest.mocked(translateText).mockImplementation(async (text) => text);
    jest.mocked(GeminiService.generateCoaching).mockResolvedValue({
      text: 'Mocked coaching feedback from Gemini',
      source: 'gemini',
    });
    jest.mocked(getCityGridIntensity).mockReturnValue(450);
  });

  it('should successfully perform profile creation, habit selection, logging and coaching', async () => {
    // 1. Write profile
    await request(app)
      .post('/api/user/profile')
      .send({
        userId,
        housingType: 'Homeowner',
        city: 'Mumbai',
        diet: 'vegan',
        language: 'en',
      })
      .expect(200);

    // 2. Read profile
    const getRes = await request(app)
      .get(`/api/user/profile/${userId}`)
      .expect(200);

    expect(getRes.body.profile.housingType).toBe('Homeowner');
    expect(getRes.body.profile.city).toBe('Mumbai');
    expect(getRes.body.profile.diet).toBe('vegan');

    // 3. Select Habit
    const selectRes = await request(app)
      .post('/api/habits/select')
      .send({ userId, habitId: 'h1' })
      .expect(200);

    expect(selectRes.body.activeHabit.id).toBe('h1');

    // 4. Log Habit
    const logRes = await request(app)
      .post('/api/habits/log')
      .send({ userId, date: '2026-06-12' })
      .expect(200);

    expect(logRes.body.alreadyLogged).toBe(false);
    expect(logRes.body.streakCount).toBe(1);
    expect(logRes.body.totalCo2Saved).toBe(0.8); // h1 co2SavedPerDay is 0.8

    // 5. Get Coaching
    const coachRes = await request(app)
      .post('/api/habits/coach')
      .send({ userId })
      .expect(200);

    expect(coachRes.body.coachingFeedback).toBe('Mocked coaching feedback from Gemini');
    expect(coachRes.body.metrics.completions).toBe(1);
  });
});
