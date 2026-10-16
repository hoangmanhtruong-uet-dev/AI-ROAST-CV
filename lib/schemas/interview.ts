import { z } from 'zod';

export const interviewRoleSchema = z.enum(['it', 'marketing', 'custom'], {
  errorMap: () => ({ message: 'Vai trò phải là "it", "marketing" hoặc "custom"' }),
});
export type InterviewRole = z.infer<typeof interviewRoleSchema>;

export const questionIndexSchema = z.union(
  [z.literal(1), z.literal(2), z.literal(3)],
  {
    errorMap: () => ({ message: 'Thứ tự câu hỏi phải là 1, 2 hoặc 3' }),
  }
);
export type QuestionIndex = z.infer<typeof questionIndexSchema>;

// --- POST /api/interview/question Schemas ---
export const interviewQuestionRequestSchema = z.object({
  role: interviewRoleSchema,
  questionIndex: questionIndexSchema,
});
export type InterviewQuestionRequest = z.infer<typeof interviewQuestionRequestSchema>;

export const interviewQuestionDataSchema = z.object({
  questionId: z.string().min(1, 'questionId không được để trống'),
  role: interviewRoleSchema,
  questionIndex: questionIndexSchema,
  title: z.string().min(1, 'title không được để trống'),
  scenario: z.string().min(1, 'scenario không được để trống'),
  pressureContext: z.string().min(1, 'pressureContext không được để trống'),
  timeLimitSeconds: z
    .number()
    .int('Thời gian phải là số nguyên')
    .min(60, 'Thời gian tối thiểu là 60 giây')
    .max(90, 'Thời gian tối đa là 90 giây'),
});
export type InterviewQuestionData = z.infer<typeof interviewQuestionDataSchema>;

export const interviewQuestionResponseSchema = z.object({
  success: z.boolean(),
  data: interviewQuestionDataSchema.optional(),
  error: z.string().optional(),
});
export type InterviewQuestionResponse = z.infer<typeof interviewQuestionResponseSchema>;

// --- Custom JD Question Generation Schemas ---
export const customJdGenerateRequestSchema = z.object({
  jdText: z
    .string()
    .min(50, 'Nội dung JD phải có tối thiểu 50 ký tự để phân tích')
    .max(10000, 'Nội dung JD không được vượt quá 10.000 ký tự'),
  targetRole: z.string().max(100, 'Tên vị trí không được vượt quá 100 ký tự').optional(),
  company: z.string().max(100, 'Tên công ty không được vượt quá 100 ký tự').optional(),
});
export type CustomJdGenerateRequest = z.infer<typeof customJdGenerateRequestSchema>;

export const customJdAnalysisResultSchema = z.object({
  jobTitle: z.string().min(1, 'jobTitle không được để trống'),
  companyOrIndustry: z.string().min(1, 'companyOrIndustry không được để trống'),
  extractedSkills: z.array(z.string().min(1)).min(1, 'Phải trích xuất ít nhất 1 kỹ năng trọng tâm'),
  extractedCulture: z.array(z.string().min(1)).min(1, 'Phải trích xuất ít nhất 1 yếu tố văn hóa/môi trường'),
  questions: z.array(interviewQuestionDataSchema).length(3, 'Phải tạo chính xác 3 câu hỏi áp lực leo thang'),
});
export type CustomJdAnalysisResult = z.infer<typeof customJdAnalysisResultSchema>;

export const customJdGenerateResponseSchema = z.object({
  success: z.boolean(),
  data: customJdAnalysisResultSchema.optional(),
  error: z.string().optional(),
});
export type CustomJdGenerateResponse = z.infer<typeof customJdGenerateResponseSchema>;

// --- Rubric & Evaluate Schemas ---
export const RUBRIC_CRITERIA_NAMES = [
  'Cấu trúc STAR & Mạch lạc',
  'Tính cụ thể & Dẫn chứng',
  'Mức độ liên quan & Đúng trọng tâm',
  'Nhận thức hệ quả & Tư duy xử lý',
] as const;

export const JOB_MATCH_FIT_CRITERION_NAME = 'Độ phù hợp yêu cầu JD (Job Match Fit)' as const;

export const ALL_RUBRIC_CRITERIA_NAMES = [
  ...RUBRIC_CRITERIA_NAMES,
  JOB_MATCH_FIT_CRITERION_NAME,
] as const;

export const rubricCriterionNameSchema = z.enum(ALL_RUBRIC_CRITERIA_NAMES, {
  errorMap: () => ({
    message:
      'Tên tiêu chí phải thuộc danh mục tiêu chí chuẩn hóa: "Cấu trúc STAR & Mạch lạc", "Tính cụ thể & Dẫn chứng", "Mức độ liên quan & Đúng trọng tâm", "Nhận thức hệ quả & Tư duy xử lý", hoặc "Độ phù hợp yêu cầu JD (Job Match Fit)"',
  }),
});
export type RubricCriterionName = z.infer<typeof rubricCriterionNameSchema>;

export const rubricCriterionScoreSchema = z.object({
  name: rubricCriterionNameSchema,
  score: z
    .number()
    .int('Điểm số phải là số nguyên')
    .min(1, 'Điểm số tối thiểu là 1')
    .max(10, 'Điểm số tối đa là 10'),
  feedback: z.string().min(1, 'Nhận xét không được để trống'),
});
export type RubricCriterionScore = z.infer<typeof rubricCriterionScoreSchema>;

export const interviewEvaluateRequestSchema = z.object({
  role: interviewRoleSchema,
  questionId: z.string().min(1, 'questionId không được để trống'),
  questionIndex: questionIndexSchema,
  questionScenario: z.string().min(1, 'questionScenario không được để trống'),
  candidateAnswer: z
    .string()
    .max(5000, 'Câu trả lời không được vượt quá 5.000 ký tự'),
  timeSpentSeconds: z
    .number()
    .int('Thời gian trả lời phải là số nguyên')
    .min(0, 'Thời gian trả lời không thể âm'),
  customJd: z.string().max(10000, 'Nội dung JD không được vượt quá 10.000 ký tự').optional(),
});
export type InterviewEvaluateRequest = z.infer<typeof interviewEvaluateRequestSchema>;

export const interviewEvaluateDataSchema = z.object({
  questionIndex: questionIndexSchema,
  rubricScores: z
    .array(rubricCriterionScoreSchema)
    .min(4, 'Phải có ít nhất 4 tiêu chí đánh giá')
    .max(5, 'Tối đa 5 tiêu chí đánh giá')
    .superRefine((scores, ctx) => {
      const names = scores.map((s) => s.name);
      const uniqueNames = new Set(names);
      if (uniqueNames.size !== names.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Các tiêu chí đánh giá không được trùng lặp',
        });
      }
      if (scores.length === 4) {
        const hasAllStandard = RUBRIC_CRITERIA_NAMES.every((name) =>
          uniqueNames.has(name)
        );
        if (!hasAllStandard) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Đánh giá 4 tiêu chí phải chứa đúng 4 tiêu chí chuẩn hóa',
          });
        }
      } else if (scores.length === 5) {
        const hasAllCustom = ALL_RUBRIC_CRITERIA_NAMES.every((name) =>
          uniqueNames.has(name)
        );
        if (!hasAllCustom) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              'Đánh giá 5 tiêu chí phải chứa đầy đủ 5 tiêu chí chuẩn hóa bao gồm Độ phù hợp yêu cầu JD',
          });
        }
      }
    }),
  averageScore: z
    .number()
    .min(0, 'Điểm trung bình không thể âm')
    .max(10, 'Điểm trung bình tối đa là 10'),
  strengths: z
    .array(z.string().min(1, 'Điểm mạnh không được để trống'))
    .min(1, 'Phải có ít nhất 1 điểm mạnh'),
  improvements: z
    .array(z.string().min(1, 'Điểm cải thiện không được để trống'))
    .min(1, 'Phải có ít nhất 1 điểm cần cải thiện'),
  followUpQuestion: z.string().min(1, 'Câu hỏi đào sâu không được để trống'),
  simulatedPressureVerdict: z
    .string()
    .min(1, 'Phán quyết áp lực không được để trống'),
});
export type InterviewEvaluateData = z.infer<typeof interviewEvaluateDataSchema>;

export const interviewEvaluateResponseSchema = z.object({
  success: z.boolean(),
  data: interviewEvaluateDataSchema.optional(),
  error: z.string().optional(),
});
export type InterviewEvaluateResponse = z.infer<typeof interviewEvaluateResponseSchema>;
