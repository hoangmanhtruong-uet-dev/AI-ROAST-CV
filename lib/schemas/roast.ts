import { z } from 'zod';

export const roastRequestSchema = z.object({
  cvText: z
    .string()
    .min(30, 'Nội dung CV quá ngắn (tối thiểu 30 ký tự)')
    .max(50000, 'Nội dung CV vượt quá giới hạn 50.000 ký tự'),
  tone: z.enum(['spicy', 'constructive'], {
    errorMap: () => ({ message: 'Giọng điệu phải là "spicy" hoặc "constructive"' }),
  }),
  targetRole: z.string().max(100, 'Vị trí mục tiêu tối đa 100 ký tự').optional(),
  jdText: z.string().max(10000, 'Nội dung JD vượt quá giới hạn 10.000 ký tự').optional(),
});
export type RoastRequest = z.infer<typeof roastRequestSchema>;
export const roastApiRequestSchema = roastRequestSchema;
export type RoastApiRequest = RoastRequest;

import { interviewQuestionDataSchema, InterviewQuestionData } from '@/lib/schemas/interview';

export const weaknessItemSchema = z.object({
  quote: z.string().min(1, 'Trích đoạn không được để trống'),
  issue: z.string().min(1, 'Vấn đề phát hiện không được để trống'),
  severity: z.enum(['Cao', 'Trung bình', 'Thấp'], {
    errorMap: () => ({ message: 'Mức độ nghiêm trọng phải là "Cao", "Trung bình" hoặc "Thấp"' }),
  }),
  rejectionReason: z.string().min(1, 'Lý do từ chối không được để trống'),
  rejectReason: z.string().min(1, 'Lý do từ chối không được để trống').optional(),
  fixGuideline: z
    .string()
    .min(1, 'Hướng dẫn sửa không được để trống')
    .refine(
      (val) => /\[[^\]]+\]/.test(val),
      'Hướng dẫn sửa phải sử dụng ký hiệu placeholder [...] và không được bịa đặt thành tích'
    ),
});
export type WeaknessItem = z.infer<typeof weaknessItemSchema>;

export const atsRecommendationSchema = z.object({
  category: z.enum(['Cấu trúc', 'Từ khóa', 'Định dạng', 'Độ dài'], {
    errorMap: () => ({ message: 'Danh mục ATS phải là Cấu trúc, Từ khóa, Định dạng hoặc Độ dài' }),
  }),
  recommendation: z.string().min(1, 'Khuyến nghị không được để trống'),
  impact: z.enum(['Quan trọng', 'Nên làm'], {
    errorMap: () => ({ message: 'Mức độ tác động phải là "Quan trọng" hoặc "Nên làm"' }),
  }),
});
export type AtsRecommendation = z.infer<typeof atsRecommendationSchema>;

export const jdMatchBreakdownSchema = z.object({
  hardSkillsMatch: z
    .number({ invalid_type_error: 'Điểm kỹ năng cứng phải là số nguyên' })
    .int('Điểm kỹ năng cứng phải là số nguyên')
    .min(0, 'Điểm kỹ năng cứng nhỏ nhất là 0')
    .max(100, 'Điểm kỹ năng cứng lớn nhất là 100'),
  experienceMatch: z
    .number({ invalid_type_error: 'Điểm kinh nghiệm phải là số nguyên' })
    .int('Điểm kinh nghiệm phải là số nguyên')
    .min(0, 'Điểm kinh nghiệm nhỏ nhất là 0')
    .max(100, 'Điểm kinh nghiệm lớn nhất là 100'),
  cultureMatch: z
    .number({ invalid_type_error: 'Điểm phù hợp văn hóa phải là số nguyên' })
    .int('Điểm phù hợp văn hóa phải là số nguyên')
    .min(0, 'Điểm phù hợp văn hóa nhỏ nhất là 0')
    .max(100, 'Điểm phù hợp văn hóa lớn nhất là 100'),
});
export type JdMatchBreakdown = z.infer<typeof jdMatchBreakdownSchema>;

export const jdMatchDataSchema = z.object({
  matchScore: z
    .number({ invalid_type_error: 'Điểm phù hợp JD phải là số nguyên' })
    .int('Điểm phù hợp JD phải là số nguyên')
    .min(0, 'Điểm phù hợp JD nhỏ nhất là 0')
    .max(100, 'Điểm phù hợp JD lớn nhất là 100'),
  breakdown: jdMatchBreakdownSchema,
  missingKeywords: z.array(z.string()),
  tailoredRecommendations: z.array(z.string()),
});
export type JdMatchData = z.infer<typeof jdMatchDataSchema>;

export const roastResultDataSchema = z.object({
  overallScore: z
    .number({ invalid_type_error: 'Điểm số phải là số nguyên' })
    .int('Điểm số phải là số nguyên')
    .min(0, 'Điểm số nhỏ nhất là 0')
    .max(100, 'Điểm số lớn nhất là 100'),
  roastScore: z
    .number({ invalid_type_error: 'Điểm số phải là số nguyên' })
    .int('Điểm số phải là số nguyên')
    .min(0, 'Điểm số nhỏ nhất là 0')
    .max(100, 'Điểm số lớn nhất là 100')
    .optional(),
  survivalScore: z
    .number({ invalid_type_error: 'Điểm sinh tồn phải là số nguyên' })
    .int('Điểm sinh tồn phải là số nguyên')
    .min(0, 'Điểm sinh tồn nhỏ nhất là 0')
    .max(100, 'Điểm sinh tồn lớn nhất là 100')
    .optional(),
  funnyTitle: z.string().optional(),
  tone: z.enum(['spicy', 'constructive']),
  summaryVerdict: z.string().min(1, 'Phán quyết tổng thể không được để trống'),
  verdict: z.string().min(1, 'Phán quyết không được để trống').optional(),
  topStrengths: z.array(z.string().min(1)).min(1, 'Cần ít nhất 1 điểm mạnh'),
  weaknesses: z.array(weaknessItemSchema).min(1, 'Cần ít nhất 1 điểm yếu'),
  atsRecommendations: z.array(atsRecommendationSchema).min(1, 'Cần ít nhất 1 khuyến nghị ATS'),
  interviewQuestions: z.array(interviewQuestionDataSchema).optional(),
  jdMatch: jdMatchDataSchema.optional(),
  disclaimer: z.string().min(1, 'Cần có tuyên bố miễn trừ trách nhiệm'),
});
export type RoastResultData = z.infer<typeof roastResultDataSchema>;
export const roastDataSchema = roastResultDataSchema;
export type RoastData = RoastResultData;

export const roastApiResponseSchema = z.object({
  success: z.boolean(),
  data: roastResultDataSchema.optional(),
  error: z.string().optional(),
});
export type RoastApiResponse = z.infer<typeof roastApiResponseSchema>;
