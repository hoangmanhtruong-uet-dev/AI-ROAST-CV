import { z } from 'zod';

/**
 * 4 Standardized Vietnamese Action Verb Categories for ATS Optimization
 */
export const ACTION_VERB_CATEGORIES = [
  'Lãnh đạo / Chủ trì',
  'Phát triển / Kỹ thuật',
  'Tối ưu / Cải tiến',
  'Phân tích / Đánh giá',
] as const;

export const actionVerbCategorySchema = z.enum(ACTION_VERB_CATEGORIES, {
  errorMap: () => ({
    message:
      'Danh mục động từ hành động phải thuộc: "Lãnh đạo / Chủ trì", "Phát triển / Kỹ thuật", "Tối ưu / Cải tiến", "Phân tích / Đánh giá"',
  }),
});
export type ActionVerbCategory = z.infer<typeof actionVerbCategorySchema>;

/**
 * Request payload for POST /api/rewrite
 */
export const rewriteRequestSchema = z.object({
  quote: z
    .string({ required_error: 'Trích đoạn cần tối ưu không được để trống' })
    .min(5, 'Trích đoạn cần tối ưu tối thiểu 5 ký tự')
    .max(2000, 'Trích đoạn quá dài (tối đa 2.000 ký tự)'),
  issue: z
    .string()
    .max(500, 'Mô tả vấn đề tối đa 500 ký tự')
    .optional(),
  rejectionReason: z
    .string()
    .max(1000, 'Lý do từ chối tối đa 1.000 ký tự')
    .optional(),
  targetRole: z
    .string()
    .max(100, 'Vị trí mục tiêu tối đa 100 ký tự')
    .optional(),
  cvContext: z
    .string()
    .max(50000, 'Ngữ cảnh CV tối đa 50.000 ký tự')
    .optional(),
});
export type RewriteRequest = z.infer<typeof rewriteRequestSchema>;
export const rewriteApiRequestSchema = rewriteRequestSchema;
export type RewriteApiRequest = RewriteRequest;

/**
 * Structured ATS Rewrite Data Schema (Output of Gemini Flash & in-place state)
 */
export const rewriteResultDataSchema = z.object({
  originalQuote: z
    .string({ required_error: 'Trích đoạn gốc không được để trống' })
    .min(1, 'Trích đoạn gốc không được để trống'),
  rewrittenText: z
    .string({ required_error: 'Đoạn viết lại không được để trống' })
    .min(10, 'Đoạn viết lại phải có ít nhất 10 ký tự')
    .refine(
      (val) => /\[[^\]]+\]/.test(val),
      {
        message:
          'Đoạn viết lại phải chứa placeholder [...] (ví dụ: [số liệu cụ thể]) và không được tự bịa đặt thành tích',
      }
    ),
  actionVerb: z
    .string({ required_error: 'Động từ hành động không được để trống' })
    .min(1, 'Động từ hành động không được để trống'),
  actionVerbCategory: actionVerbCategorySchema.optional(),
  context: z
    .string({ required_error: 'Bối cảnh dự án/kỹ thuật không được để trống' })
    .min(1, 'Bối cảnh dự án/kỹ thuật không được để trống'),
  result: z
    .string({ required_error: 'Kết quả định lượng không được để trống' })
    .min(1, 'Kết quả định lượng không được để trống'),
  explanation: z
    .string({ required_error: 'Giải thích tối ưu ATS không được để trống' })
    .min(1, 'Giải thích tối ưu ATS không được để trống'),
  atsKeywords: z
    .array(z.string().min(1, 'Từ khóa ATS không được để trống'))
    .default([]),
});
export type RewriteResultData = z.infer<typeof rewriteResultDataSchema>;
export const rewriteDataSchema = rewriteResultDataSchema;
export type RewriteData = RewriteResultData;

/**
 * API Response envelope for POST /api/rewrite
 */
export const rewriteApiResponseSchema = z.object({
  success: z.boolean(),
  data: rewriteResultDataSchema.optional(),
  error: z.string().optional(),
});
export type RewriteApiResponse = z.infer<typeof rewriteApiResponseSchema>;
