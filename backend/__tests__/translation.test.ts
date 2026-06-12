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

import { translateText } from '../api/services/translation';

describe('TranslationService Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetGenerativeModel.mockReturnValue({
      generateContent: mockGenerateContent,
    });
  });

  it('should translate text successfully when language is not English', async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => 'Hola Mundo',
      },
    });

    const result = await translateText('Hello World', 'es');
    expect(result).toBe('Hola Mundo');
    expect(mockGetGenerativeModel).toHaveBeenCalledTimes(1);
    expect(mockGetGenerativeModel).toHaveBeenCalledWith({
      model: 'gemini-2.5-flash',
    });
  });

  it('should fall back to original text immediately on error', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockGenerateContent.mockRejectedValue(new Error('API quota limit reached'));

    const result = await translateText('Hello World', 'hi');
    expect(result).toBe('Hello World'); // Fallback to original text
    expect(mockGetGenerativeModel).toHaveBeenCalledTimes(1); // called exactly once, no retries, no other models
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
