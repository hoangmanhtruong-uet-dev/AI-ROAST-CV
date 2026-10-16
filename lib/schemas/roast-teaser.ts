import { z } from 'zod';

/**
 * Request payload for POST /api/roast/teaser
 * Restricts input to a single work experience sentence between 10 and 250 characters.
 */
export const roastTeaserRequestSchema = z.object({
  sentence: z
    .string({ required_error: 'Vui lòng nhập một câu mô tả kinh nghiệm từ CV.' })
    .trim()
    .min(10, 'Câu kinh nghiệm cần tối thiểu 10 ký tự.')
    .max(250, 'Câu kinh nghiệm tối đa 250 ký tự để phân tích siêu tốc.'),
});

export type RoastTeaserRequest = z.infer<typeof roastTeaserRequestSchema>;

/**
 * Structured result produced by Gemini Flash or the deterministic fallback engine.
 */
export const roastTeaserResultSchema = z.object({
  originalSentence: z.string().max(250),
  roastComment: z.string().min(1, 'Lời chê không được để trống.'),
  actionVerb: z.string().min(1, 'Động từ hành động không được để trống.'),
  atsRewrite: z
    .string({ required_error: 'Câu viết lại ATS không được để trống.' })
    .min(10, 'Câu viết lại ATS phải có ít nhất 10 ký tự.')
    .refine(
      (val) => /\[[^\]]+\]/.test(val),
      'Câu viết lại ATS bắt buộc phải chứa placeholder [...] (ví dụ: [số liệu cụ thể])'
    ),
});

export type RoastTeaserResult = z.infer<typeof roastTeaserResultSchema>;

/**
 * API Response envelope for POST /api/roast/teaser
 */
export const roastTeaserApiResponseSchema = z.object({
  success: z.boolean(),
  data: roastTeaserResultSchema.optional(),
  error: z.string().optional(),
  isFallback: z.boolean().optional(),
  isPreset: z.boolean().optional(),
  remainingCalls: z.number().int().min(0).max(3).optional(),
  durationMs: z.number().optional(),
  resetAt: z.number().optional(),
});

export type RoastTeaserApiResponse = z.infer<typeof roastTeaserApiResponseSchema>;
