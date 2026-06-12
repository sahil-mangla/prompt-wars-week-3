const mockGenerateContent = jest.fn();
const mockGetGenerativeModel = jest.fn().mockReturnValue({
  generateContent: mockGenerateContent,
});

jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => {
      return {
        getGenerativeModel: mockGetGenerativeModel,
      };
    }),
  };
});

import { GeminiService, CoachContext } from '../api/services/gemini';

describe('GeminiService generateCoaching Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset defaults for each test
    mockGetGenerativeModel.mockReturnValue({
      generateContent: mockGenerateContent,
    });
  });

  const sampleContext: CoachContext = {
    housingType: 'Apartment',
    userCity: 'Mumbai',
    habitName: 'Cold-Water Laundry',
    completionCount: 5,
    rawCo2Saved: 3.5,
    availableHabitsList: ['Cold-Water Laundry', 'No-Meat Day'],
  };

  it('should successfully return coaching from Gemini API', async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => 'Great job on your Cold-Water Laundry! Keep it up.',
      },
    });

    const result = await GeminiService.generateCoaching(sampleContext);
    expect(result.source).toBe('gemini');
    expect(result.text).toBe('Great job on your Cold-Water Laundry! Keep it up.');
    expect(mockGetGenerativeModel).toHaveBeenCalledTimes(1);
    expect(mockGetGenerativeModel).toHaveBeenCalledWith({
      model: 'gemini-2.5-flash',
      systemInstruction: expect.any(String),
    });
  });

  it('should fall back to rules immediately on first error', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockGenerateContent.mockRejectedValue(new Error('API quota exceeded or network failure'));

    const result = await GeminiService.generateCoaching(sampleContext);
    expect(result.source).toBe('rules');
    expect(result.text).toContain('Cold-Water Laundry');
    expect(mockGetGenerativeModel).toHaveBeenCalledTimes(1); // called exactly once, no retries, no other models
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
