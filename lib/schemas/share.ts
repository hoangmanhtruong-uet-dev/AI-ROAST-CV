import { z } from 'zod';
import { redactPiiFromText } from '@/lib/utils/pii-redactor';

export interface ShareCardPayload {
  type: 'roast' | 'interview';
  title: string;
  score: number;
  quoteOrHighlight: string;
  summary: string;
  rawPiiText?: string;
  candidateName?: string;
  toneOrRole?: string;
  topStrengths?: string[];
  disclaimer?: string;
}

export const shareCardPayloadSchema = z.object({
  type: z.enum(['roast', 'interview']),
  title: z.string().min(1),
  score: z.number().min(0).max(100),
  quoteOrHighlight: z.string().default(''),
  summary: z.string().default(''),
  rawPiiText: z.string().optional(),
  candidateName: z.string().optional(),
  toneOrRole: z.string().optional(),
  topStrengths: z.array(z.string()).optional(),
  disclaimer: z.string().optional(),
});

export interface SanitizedShareCardData {
  type: 'roast' | 'interview';
  title: string;
  score: number;
  quoteOrHighlight: string;
  summary: string;
  sanitizedQuote: string;
  sanitizedSummary: string;
  maskedName: string;
  badgeLabel: string;
  generatedDate: string;
  toneOrRole?: string;
  topStrengths?: string[];
  disclaimer?: string;
}

/**
 * Unconditionally sanitizes candidateName to prevent raw PII (names, phones, emails)
 * from ever being rendered into Canvas draw calls or exported.
 */
export function sanitizeCandidateName(name: string | undefined | null): string {
  if (!name || typeof name !== 'string') {
    return 'Ứng viên ẩn danh';
  }
  const trimmed = name.trim();
  if (!trimmed) {
    return 'Ứng viên ẩn danh';
  }

  // 1. Already masked tokens, placeholders, or initials
  if (
    trimmed === '[Họ tên ẩn danh]' ||
    trimmed === 'Ứng viên ẩn danh' ||
    trimmed === '[Link ẩn danh]' ||
    trimmed.includes('***') ||
    trimmed.includes('****')
  ) {
    return trimmed;
  }

  // 2. Pure phone numbers (e.g. '0987654321', '+84988776655')
  const phoneCheck = redactPiiFromText(trimmed);
  const digitsOnly = trimmed.replace(/[\s\-\+\(\)\.]/g, '');
  if (phoneCheck.redactionSummary.phones > 0 && /^\d{9,13}$/.test(digitsOnly)) {
    return phoneCheck.sanitizedText;
  }

  // 3. Pure emails (e.g. 'user@domain.com')
  if (phoneCheck.redactionSummary.emails > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return phoneCheck.sanitizedText;
  }

  // 4. Any raw candidate name (Vietnamese lowercase/uppercase, foreign/English, etc.)
  // Unconditionally mask to prevent raw PII leakage
  return '[Họ tên ẩn danh]';
}

export function prepareShareCardData(payload: ShareCardPayload): SanitizedShareCardData {
  const sanitizedQuoteResult = redactPiiFromText(payload.quoteOrHighlight || '');
  const sanitizedSummaryResult = redactPiiFromText(payload.summary || '');
  const sanitizedTitleResult = redactPiiFromText(payload.title || '');

  let maskedName = 'Ứng viên ẩn danh';
  if (payload.candidateName) {
    maskedName = sanitizeCandidateName(payload.candidateName);
  } else if (payload.rawPiiText) {
    const rawResult = redactPiiFromText(payload.rawPiiText);
    if (rawResult.sanitizedText.includes('[Họ tên ẩn danh]')) {
      maskedName = '[Họ tên ẩn danh]';
    }
  }

  const badgeLabel =
    payload.type === 'roast'
      ? 'AI ROAST CV • KẾT QUẢ PHÂN TÍCH'
      : 'AI ROAST CV • PHỎNG VẤN ÁP LỰC STAR';

  const dateStr = new Date().toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return {
    type: payload.type,
    title: sanitizedTitleResult.sanitizedText,
    score: payload.type === 'interview' ? payload.score : Math.min(100, Math.max(0, Math.round(payload.score))),
    quoteOrHighlight: payload.quoteOrHighlight,
    summary: payload.summary,
    sanitizedQuote: sanitizedQuoteResult.sanitizedText,
    sanitizedSummary: sanitizedSummaryResult.sanitizedText,
    maskedName,
    badgeLabel,
    generatedDate: dateStr,
    toneOrRole: payload.toneOrRole,
    topStrengths: payload.topStrengths,
    disclaimer: payload.disclaimer,
  };
}
