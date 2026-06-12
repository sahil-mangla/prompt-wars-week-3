import request from 'supertest';
import app from '../api/index';

describe('HabitLoop Core API Routes Integration Tests', () => {
  describe('GET /health', () => {
    it('should return UP and status 200', async () => {
      const res = await request(app)
        .get('/health')
        .expect(200);

      expect(res.body).toEqual({
        status: 'UP',
        timestamp: expect.any(String),
        service: 'habitloop-backend',
        version: '0.1.0'
      });
    });
  });

  describe('GET /api/languages', () => {
    it('should return 200 and a list of supported languages', async () => {
      const res = await request(app)
        .get('/api/languages')
        .expect(200);

      expect(res.body).toHaveProperty('languages');
      expect(typeof res.body.languages).toBe('object');
      expect(res.body.languages).toHaveProperty('en');
      expect(res.body.languages).toHaveProperty('es');
      expect(res.body.languages).toHaveProperty('hi');
    });
  });

  describe('User Profile Workflow', () => {
    const testUserId = 'integration-test-user';
    const profileData = {
      userId: testUserId,
      housingType: 'Apartment Renter',
      city: 'Mumbai',
      diet: 'mixed',
      language: 'en'
    };

    it('should create/update user profile successfully', async () => {
      const res = await request(app)
        .post('/api/user/profile')
        .send(profileData);

      // Support 200 or 201 success codes
      expect([200, 201]).toContain(res.status);
      expect(res.body).toHaveProperty('profile');
      expect(res.body.profile.city).toBe('Mumbai');
      expect(res.body.profile.housingType).toBe('Apartment Renter');
    });

    it('should retrieve the created user profile', async () => {
      const res = await request(app)
        .get(`/api/user/profile/${testUserId}`)
        .expect(200);

      expect(res.body).toHaveProperty('profile');
      expect(res.body.profile.uid).toBe(testUserId);
      expect(res.body.profile.city).toBe('Mumbai');
      expect(res.body.profile.diet).toBe('mixed');
    });

    it('should return 400 validation error if userId is missing', async () => {
      const res = await request(app)
        .post('/api/user/profile')
        .send({
          housingType: 'Apartment Renter',
          city: 'Mumbai'
        })
        .expect(400);

      expect(res.body).toEqual({
        error: 'userId is required'
      });
    });
  });
});
