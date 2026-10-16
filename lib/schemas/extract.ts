import { z } from 'zod';

export const extractJsonRequestSchema = z.object({
  text: z
    .string()
    .min(20, 'Nội dung văn bản CV phải có ít nhất 20 ký tự')
    .max(50000, 'Nội dung văn bản CV vượt quá giới hạn 50.000 ký tự'),
});
export type ExtractJsonRequest = z.infer<typeof extractJsonRequestSchema>;

export const extractApiResponseSchema = z.object({
  success: z.boolean(),
  extractedText: z.string().optional(),
  pageCount: z.number().int().positive().optional(),
  error: z.string().optional(),
});
export type ExtractApiResponse = z.infer<typeof extractApiResponseSchema>;
