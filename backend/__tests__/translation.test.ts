import { GoogleGenerativeAI } from '@google/generative-ai';
import { translateText } from '../api/services/translation';

const mockGenerateContent = jest.fn();
const mockGetGenerativeModel = jest.fn().mockReturnValue({
  generateContent: mockGenerateContent,
});

jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn(),
  };
});

describe('TranslationService Tests', () => {
  beforeAll(() => {
    process.env.GEMINI_API_KEY = 'test-api-key';
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetGenerativeModel.mockReturnValue({
      generateContent: mockGenerateContent,
    });
    jest.mocked(GoogleGenerativeAI).mockImplementation(() => {
      return {
        getGenerativeModel: mockGetGenerativeModel,
      } as any;
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
