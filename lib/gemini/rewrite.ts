import { getGeminiClient, isOfflineOrMockMode, getActiveGeminiModel } from './client';
import { ATS_REWRITE_SYSTEM_PROMPT, buildSanitizedRewritePrompt } from './prompts';
import { geminiRewriteResponseSchema } from './rewrite-schema';
import {
  rewriteResultDataSchema,
  RewriteResultData,
  ACTION_VERB_CATEGORIES,
} from '@/lib/schemas/rewrite';

export function getMockRewriteData(quote: string, targetRole?: string): RewriteResultData {
  const roleContext = targetRole ? `cho vị trí ${targetRole}` : 'cho dự án';
  return {
    originalQuote: quote,
    rewrittenText: `Chủ trì phát triển và tối ưu hóa [tính năng/module cốt lõi] ${roleContext} sử dụng [công nghệ/công cụ], giúp nâng cao hiệu năng [X%] và phục vụ [Y] người dùng ổn định.`,
    actionVerb: 'Chủ trì phát triển và tối ưu hóa',
    actionVerbCategory: 'Lãnh đạo / Chủ trì',
    context: `[tính năng/module cốt lõi] ${roleContext} sử dụng [công nghệ/công cụ]`,
    result: 'nâng cao hiệu năng [X%] và phục vụ [Y] người dùng ổn định',
    explanation:
      'Áp dụng công thức Action Verb + Context + Result giúp ATS nhận diện rõ năng lực chuyên môn và cung cấp số liệu đo lường cụ thể cho nhà tuyển dụng.',
    atsKeywords: ['Chủ trì phát triển', 'Tối ưu hóa', 'Hiệu năng', 'Kiến trúc phần mềm'],
  };
}

export async function generateRewrite(params: {
  quote: string;
  issue?: string;
  rejectionReason?: string;
  targetRole?: string;
  cvContext?: string;
}): Promise<RewriteResultData> {
  if (isOfflineOrMockMode()) {
    return getMockRewriteData(params.quote, params.targetRole);
  }

  const ai = getGeminiClient();
  const prompt = buildSanitizedRewritePrompt(params);

  const response = await ai.models.generateContent({
    model: getActiveGeminiModel(),
    contents: prompt,
    config: {
      systemInstruction: ATS_REWRITE_SYSTEM_PROMPT,
      responseMimeType: 'application/json',
      responseSchema: geminiRewriteResponseSchema,
      temperature: 0.3, // Deterministic ATS compliance
    },
  });

  const rawJson = response.text;
  if (!rawJson) {
    throw new Error('Gemini không phản hồi dữ liệu viết lại CV.');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch (err) {
    throw new Error(
      `Dữ liệu JSON từ AI bị lỗi định dạng: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  const candidate = {
    originalQuote: params.quote,
    ...(typeof parsed === 'object' && parsed !== null ? parsed : {}),
  };

  // Auto-remedy missing placeholder [...] in rewrittenText before validation
  let candidateRewrittenText = String((candidate as any).rewrittenText || '');
  let candidateResult = String((candidate as any).result || '');

  if (!/\[[^\]]+\]/.test(candidateRewrittenText)) {
    candidateRewrittenText = candidateRewrittenText
      ? `${candidateRewrittenText} (Bổ sung kết quả đo lường: [số liệu cụ thể])`
      : 'Tối ưu hóa [hệ thống/quy trình] đạt kết quả [số liệu cụ thể]';
  }

  if (!/\[[^\]]+\]/.test(candidateResult)) {
    candidateResult = candidateResult
      ? `${candidateResult} [số liệu cụ thể]`
      : 'đạt kết quả đo lường [số liệu cụ thể]';
  }

  let actionVerbCategory = (candidate as any).actionVerbCategory;
  if (
    actionVerbCategory &&
    !ACTION_VERB_CATEGORIES.includes(actionVerbCategory as any)
  ) {
    actionVerbCategory = undefined;
  }

  const securedCandidate = {
    ...candidate,
    rewrittenText: candidateRewrittenText,
    result: candidateResult,
    actionVerbCategory,
  };

  return rewriteResultDataSchema.parse(securedCandidate);
}
