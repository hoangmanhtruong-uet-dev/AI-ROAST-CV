import { getGeminiClient, isOfflineOrMockMode } from './client';
import {
  SPICY_SYSTEM_PROMPT,
  CONSTRUCTIVE_SYSTEM_PROMPT,
  buildSanitizedRoastPrompt,
} from './prompts';
import { geminiRoastResponseSchema } from './roast-schema';
import { roastDataSchema, RoastData } from '@/lib/schemas/roast';
import { getMockRoastData } from './mock-data';

export { getMockRoastData } from './mock-data';

/**
 * Scans fixGuideline for naked fabricated metrics (e.g., "giảm 40%", "tăng 200%", "từ 500ms xuống 100ms")
 * that are not present in the candidate's CV quote, and wraps/normalizes them into [X]% or [A]ms → [B]ms format.
 * Also guarantees that at least one bracketed placeholder [...] exists.
 */
export function sanitizeFixGuidelineMetrics(fixGuideline: string, quote = ''): string {
  let result = fixGuideline;

  // 1. Scan and normalize naked latency transitions e.g. "từ 500ms xuống 100ms", "500ms -> 100ms", "500ms → 100ms"
  const latencyRegex =
    /(?:từ\s+)?(\d+(?:\.\d+)?\s*(?:ms|s|giây|phút))\s*(?:xuống|thành|->|→|còn|về|đến|sang)\s*(\d+(?:\.\d+)?\s*(?:ms|s|giây|phút))/gi;
  result = result.replace(latencyRegex, (match, fromVal, toVal) => {
    if (quote && quote.includes(fromVal) && quote.includes(toVal)) {
      return match;
    }
    return `[A]ms → [B]ms`;
  });

  // 2. Scan and normalize action + percentage e.g. "giảm 40%", "tăng 200%", "đạt 50%"
  const actionPercentRegex = /(?<!\[)\b(tăng|giảm|cắt giảm|nâng cao|đạt|cải thiện)\s+(\d+(?:\.\d+)?%)(?!\])/gi;
  result = result.replace(actionPercentRegex, (match, action, pct) => {
    if (quote && quote.includes(pct)) {
      return match;
    }
    return `${action} [X]%`;
  });

  // 3. Scan and normalize any remaining naked percentages not bracketed e.g. "40%"
  const nakedPercentRegex = /(?<!\[)\b(\d+(?:\.\d+)?%)(?!\])/g;
  result = result.replace(nakedPercentRegex, (match, pct) => {
    if (quote && quote.includes(pct)) {
      return match;
    }
    return `[X]%`;
  });

  // 4. Guarantee placeholder [...] enforcement: if no bracketed placeholder exists, append fallback
  if (!/\[[^\]]+\]/.test(result)) {
    result = `${result} (Bổ sung số liệu thực tế: [X]% hoặc [A]ms → [B]ms)`;
  }

  return result;
}

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

  const score = validated.overallScore;
  const survivalScore =
    validated.survivalScore ?? Math.max(0, Math.min(100, score - 6));
  const funnyTitle =
    validated.funnyTitle ||
    (score >= 80
      ? 'Hiệp Sĩ Fix Bug Gánh Team'
      : score >= 60
      ? 'Chiến Thần Rải CV'
      : 'Fresher Hệ Tâm Linh');
  const roastScore = validated.roastScore ?? score;
  const verdict = validated.verdict || validated.summaryVerdict;
  const interviewQuestions =
    validated.interviewQuestions && validated.interviewQuestions.length === 3
      ? validated.interviewQuestions
      : getMockRoastData(params.tone).interviewQuestions;

  // Guarantee placeholder [...] enforcement and anti-hallucination metric normalization (R2)
  const securedWeaknesses = validated.weaknesses.map((w) => {
    const sanitizedGuideline = sanitizeFixGuidelineMetrics(w.fixGuideline, w.quote);
    const reason = w.rejectionReason || w.rejectReason || 'Không đạt tiêu chuẩn tuyển dụng';
    return {
      ...w,
      rejectionReason: reason,
      rejectReason: reason,
      fixGuideline: sanitizedGuideline,
    };
  });

  return {
    ...validated,
    overallScore: score,
    roastScore,
    survivalScore,
    funnyTitle,
    summaryVerdict: validated.summaryVerdict,
    verdict,
    weaknesses: securedWeaknesses,
    interviewQuestions,
  };
}
