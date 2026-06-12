import request from 'supertest';
import app from '../api/index';

// Mock the Gemini client to throw a network error when getGenerativeModel is called
jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => {
      return {
        getGenerativeModel: () => {
          throw new Error('Gemini API is down');
        }
      };
    })
  };
});

describe('POST /api/habits/coach - Gemini Failure Fallback', () => {
  it('should fall back to deterministic rule engine when Gemini fails', async () => {
    const res = await request(app)
      .post('/api/habits/coach')
      .send({ userId: 'test-user' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('coachingFeedback');
    expect(res.body.source).toBe('rules');
    expect(res.body).toHaveProperty('gridIntensity');
    expect(res.body).toHaveProperty('metrics');
    
    // Check that we got actual coaching feedback text from deterministic fallback
    expect(res.body.coachingFeedback).toContain('Laundry');
  });
});
