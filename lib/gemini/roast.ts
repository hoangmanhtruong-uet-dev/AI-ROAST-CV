import { getGeminiClient, isOfflineOrMockMode } from './client';
import {
  SPICY_SYSTEM_PROMPT,
  CONSTRUCTIVE_SYSTEM_PROMPT,
  buildSanitizedRoastPrompt,
} from './prompts';
import { geminiRoastResponseSchema } from './roast-schema';
import { roastDataSchema, RoastData } from '@/lib/schemas/roast';
import { getMockRoastData } from './mock-data';

export async function generateRoast(params: {
  cvText: string;
  tone: 'spicy' | 'constructive';
  targetRole?: string;
}): Promise<RoastData> {
  if (isOfflineOrMockMode()) {
    return getMockRoastData(params.tone);
  }

  const ai = getGeminiClient();
  const systemInstruction =
    params.tone === 'spicy' ? SPICY_SYSTEM_PROMPT : CONSTRUCTIVE_SYSTEM_PROMPT;
  const prompt = buildSanitizedRoastPrompt(params.cvText, params.targetRole);

  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: geminiRoastResponseSchema,
      temperature: params.tone === 'spicy' ? 0.7 : 0.4,
    },
  });

  const rawJson = response.text;
  if (!rawJson) {
    throw new Error('Gemini không phản hồi dữ liệu phân tích');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch (err) {
    throw new Error(`Dữ liệu JSON từ AI bị lỗi định dạng: ${err instanceof Error ? err.message : String(err)}`);
  }

  const validated = roastDataSchema.parse(parsed);

  // Guarantee placeholder [...] enforcement in each fixGuideline (Feature 13)
  const securedWeaknesses = validated.weaknesses.map((w) => {
    if (!/\[[^\]]+\]/.test(w.fixGuideline)) {
      return {
        ...w,
        fixGuideline: `${w.fixGuideline} (Bổ sung dữ kiện: [số liệu cụ thể])`,
      };
    }
    return w;
  });

  return {
    ...validated,
    weaknesses: securedWeaknesses,
  };
}
