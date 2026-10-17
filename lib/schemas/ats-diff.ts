import { z } from 'zod';

export const CVBulletInputSchema = z.object({
  bulletId: z.string(),
  sectionTitle: z.string().default('Experience'),
  originalText: z.string().min(5, 'Câu mô tả quá ngắn'),
});

export const ATSRoastRequestSchema = z.object({
  jobDescription: z.string().min(20, 'Job Description quá ngắn (tối thiểu 20 ký tự)'),
  cvBullets: z.array(CVBulletInputSchema).min(1, 'Cần ít nhất 1 dòng gạch đầu dòng').max(50),
});

export const ATSRoastResponseSchema = z.object({
  atsMetrics: z.object({
    beforeScore: z.number().min(0).max(100),
    afterScore: z.number().min(0).max(100),
    knockoutFlags: z.array(z.string()),
    missingKeywords: z.array(
      z.object({
        keyword: z.string(),
        importance: z.enum(['critical', 'recommended']),
        category: z.enum(['hard_skill', 'tool', 'domain', 'soft_skill']).default('hard_skill'),
      })
    ),
  }),
  patches: z.array(
    z.object({
      bulletId: z.string(),
      roastComment: z.string(),
      suggestedText: z.string(),
      addedKeywords: z.array(z.string()).default([]),
      impactLevel: z.enum(['high', 'medium', 'low']),
    })
  ),
});

export type ATSRoastRequest = z.infer<typeof ATSRoastRequestSchema>;
export type ATSRoastResponse = z.infer<typeof ATSRoastResponseSchema>;
