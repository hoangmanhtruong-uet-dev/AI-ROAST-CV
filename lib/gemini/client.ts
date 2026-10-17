import { GoogleGenAI } from '@google/genai';

let cachedClient: GoogleGenAI | null = null;

/**
 * Returns a singleton instance of the Google Gen AI client.
 * Falls back to a dummy key during tests if GEMINI_API_KEY is not defined.
 */
export function getGeminiClient(): GoogleGenAI {
  if (cachedClient && process.env.NODE_ENV !== 'test') return cachedClient;

  const apiKey =
    process.env.GEMINI_API_KEY ||
    (process.env.NODE_ENV === 'test' ? 'test-mock-api-key' : '');
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not defined');
  }

  const client = new GoogleGenAI({ apiKey });
  if (process.env.NODE_ENV !== 'test') {
    cachedClient = client;
  }
  return client;
}

/**
 * Checks whether the environment is operating in offline or mock fallback mode.
 */
export function isOfflineOrMockMode(): boolean {
  return (
    process.env.GEMINI_MOCK === 'true' ||
    (!process.env.GEMINI_API_KEY && process.env.NODE_ENV !== 'test')
  );
}

/**
 * Returns a valid Gemini model name, automatically normalizing deprecated or non-existent models.
 */
export function getActiveGeminiModel(): string {
  const model = (process.env.GEMINI_MODEL || '').trim();
  if (!model || model === 'gemini-2.5-flash') {
    return 'gemini-2.0-flash';
  }
  return model;
}
