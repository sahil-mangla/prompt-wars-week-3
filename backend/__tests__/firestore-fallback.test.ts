import request from 'supertest';
import app from '../api/index';

// Mock the Firebase service to simulate initialized Firebase with Firestore failures
jest.mock('../api/services/firebase', () => {
  return {
    isFirebaseInitialized: true,
    admin: {
      firestore: () => {
        return {
          collection: () => {
            return {
              doc: () => {
                return {
                  set: () => Promise.reject(new Error('Mocked Firestore Write Failure')),
                  get: () => Promise.reject(new Error('Mocked Firestore Read Failure'))
                };
              }
            };
          }
        };
      }
    }
  };
});

describe('Firestore Failure Fallback - Read-After-Write Verification', () => {
  const userId = 'fallback-test-user';

  it('should fallback to localDb on write (POST) and retrieve updated data on read (GET)', async () => {
    // 1. Write updated profile data via POST
    const updatePayload = {
      userId,
      housingType: 'Homeowner',
      city: 'Berlin',
      diet: 'vegan',
      language: 'de'
    };

    const postRes = await request(app)
      .post('/api/user/profile')
      .send(updatePayload);

    // Accept either 200 or 201 success code
    expect([200, 201]).toContain(postRes.status);
    expect(postRes.body).toHaveProperty('profile');
    expect(postRes.body.profile.city).toBe('Berlin');

    // 2. Read profile data via GET and verify it reflects the written changes from fallback localDb
    const getRes = await request(app)
      .get(`/api/user/profile/${userId}`);

    expect([200, 201]).toContain(getRes.status);
    expect(getRes.body).toHaveProperty('profile');
    expect(getRes.body.profile.uid).toBe(userId);
    expect(getRes.body.profile.housingType).toBe('Homeowner');
    expect(getRes.body.profile.city).toBe('Berlin');
    expect(getRes.body.profile.diet).toBe('vegan');
    expect(getRes.body.profile.language).toBe('de');
  });
});
