import request from 'supertest';
import app from '../api/index';
import { CURATED_HABITS } from '../api/data/habits';
import { translateText } from '../api/services/translation';
import { GeminiService, getCityGridIntensity } from '../api/services/gemini';

jest.mock('../api/services/gemini');
jest.mock('../api/services/translation');

describe('Habits Controller REST API Tests', () => {
  const testUserId = 'controller-test-user';

  beforeEach(() => {
    jest.clearAllMocks();

    jest.mocked(translateText).mockImplementation(async (text, lang) => {
      if (lang === 'es') return `Translated to es: ${text}`;
      return text;
    });

    jest.mocked(GeminiService.generateCoaching).mockResolvedValue({
      text: 'Mocked coaching feedback from Gemini',
      source: 'gemini',
    });

    jest.mocked(getCityGridIntensity).mockReturnValue(450);
  });

  describe('GET /api/habits', () => {
    it('should return habits in English by default', async () => {
      const res = await request(app)
        .get('/api/habits')
        .expect(200);

      expect(res.body).toHaveProperty('habits');
      expect(res.body.habits).toHaveLength(CURATED_HABITS.length);
      expect(res.body.habits[0].name).toBe(CURATED_HABITS[0].name);
    });

    it('should return translated habits if lang is specified and not en', async () => {
      const res = await request(app)
        .get('/api/habits?lang=es')
        .expect(200);

      expect(res.body).toHaveProperty('habits');
      expect(res.body.habits[0].name).toBe(`Translated to es: ${CURATED_HABITS[0].name}`);
    });
  });

  describe('GET /api/user/profile/:userId', () => {
    it('should return 404 if user profile is not found', async () => {
      const res = await request(app)
        .get('/api/user/profile/non-existent-user')
        .expect(404);

      expect(res.body).toEqual({ error: 'User not found' });
    });
  });

  describe('POST /api/habits/select', () => {
    it('should return 400 if userId or habitId is missing', async () => {
      const res = await request(app)
        .post('/api/habits/select')
        .send({ userId: testUserId })
        .expect(400);

      expect(res.body).toEqual({ error: 'userId and habitId are required' });
    });

    it('should return 404 if habit is not found in catalog', async () => {
      const res = await request(app)
        .post('/api/habits/select')
        .send({ userId: testUserId, habitId: 'h999' })
        .expect(404);

      expect(res.body).toEqual({ error: 'Habit not found' });
    });

    it('should select active habit successfully', async () => {
      const res = await request(app)
        .post('/api/habits/select')
        .send({ userId: testUserId, habitId: 'h2' })
        .expect(200);

      expect(res.body).toHaveProperty('activeHabit');
      expect(res.body.activeHabit.id).toBe('h2');
    });
  });

  describe('POST /api/habits/log', () => {
    it('should return 400 if userId is missing', async () => {
      const res = await request(app)
        .post('/api/habits/log')
        .send({ date: '2026-06-12' })
        .expect(400);

      expect(res.body).toEqual({ error: 'userId is required' });
    });

    it('should log habit completion successfully', async () => {
      // Setup: select habit h2 for test user
      await request(app)
        .post('/api/habits/select')
        .send({ userId: testUserId, habitId: 'h2' });

      const res = await request(app)
        .post('/api/habits/log')
        .send({ userId: testUserId, date: '2026-06-12' })
        .expect(200);

      expect(res.body.alreadyLogged).toBe(false);
      expect(res.body.streakCount).toBe(1);
      expect(res.body.totalCo2Saved).toBe(0.3); // h2 co2SavedPerDay is 0.3
    });

    it('should return alreadyLogged: true if logged again on same day', async () => {
      const res = await request(app)
        .post('/api/habits/log')
        .send({ userId: testUserId, date: '2026-06-12' })
        .expect(200);

      expect(res.body.alreadyLogged).toBe(true);
    });
  });

  describe('POST /api/habits/coach', () => {
    it('should return 400 if userId is missing', async () => {
      const res = await request(app)
        .post('/api/habits/coach')
        .send({})
        .expect(400);

      expect(res.body).toEqual({ error: 'userId is required' });
    });

    it('should return 400 if no active habit is selected for user', async () => {
      const res = await request(app)
        .post('/api/habits/coach')
        .send({ userId: 'another-new-user' })
        .expect(400);

      expect(res.body).toEqual({ error: 'No active habit selected to analyze' });
    });

    it('should return coaching feedback successfully', async () => {
      // Setup: update profile to non-English (es) and select habit
      await request(app)
        .post('/api/user/profile')
        .send({ userId: testUserId, language: 'es' });

      const res = await request(app)
        .post('/api/habits/coach')
        .send({ userId: testUserId })
        .expect(200);

      expect(res.body).toHaveProperty('coachingFeedback');
      expect(res.body.coachingFeedback).toContain('Translated to es');
      expect(res.body).toHaveProperty('source');
      expect(res.body.metrics.totalLifetimeCo2Saved).toBe(0.3);
    });
  });
});
