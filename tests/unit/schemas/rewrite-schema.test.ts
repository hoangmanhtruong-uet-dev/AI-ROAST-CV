import { describe, it, expect } from 'vitest';
import {
  rewriteRequestSchema,
  rewriteResultDataSchema,
  rewriteApiResponseSchema,
  actionVerbCategorySchema,
  ACTION_VERB_CATEGORIES,
} from '@/lib/schemas/rewrite';

describe('ATS CV Rewrite Zod Schemas (Milestone 7)', () => {
  const validRewriteData = {
    originalQuote: 'Tham gia phát triển module đăng ký',
    rewrittenText:
      'Chủ trì phát triển mô-đun đăng ký và xác thực hai lớp bằng Next.js, giúp tăng [25%] tỷ lệ chuyển đổi và phục vụ [10.000+] người dùng.',
    actionVerb: 'Chủ trì phát triển',
    actionVerbCategory: 'Lãnh đạo / Chủ trì' as const,
    context: 'mô-đun đăng ký và xác thực hai lớp bằng Next.js',
    result: 'tăng [25%] tỷ lệ chuyển đổi và phục vụ [10.000+] người dùng',
    explanation: 'Sử dụng động từ hành động chủ trì kết hợp số liệu định lượng chuẩn ATS.',
    atsKeywords: ['Chủ trì', 'Next.js', 'Xác thực hai lớp'],
  };

  describe('1. rewriteRequestSchema Validation', () => {
    it('accepts minimum valid quote of exactly 5 characters', () => {
      const parsed = rewriteRequestSchema.safeParse({ quote: 'React' });
      expect(parsed.success).toBe(true);
    });

    it('accepts typical quote with optional fields', () => {
      const parsed = rewriteRequestSchema.safeParse({
        quote: 'Em có làm qua dự án thương mại điện tử bằng React và Node.js',
        issue: 'Câu văn quá chung chung, thiếu vai trò cụ thể',
        rejectionReason: 'Nhà tuyển dụng không thấy được năng lực chủ động',
        targetRole: 'Frontend Developer',
        cvContext: 'Kinh nghiệm: Dự án bán hàng online...',
      });
      expect(parsed.success).toBe(true);
    });

    it('accepts boundary quote of exactly 2,000 characters', () => {
      const parsed = rewriteRequestSchema.safeParse({ quote: 'A'.repeat(2000) });
      expect(parsed.success).toBe(true);
    });

    it('rejects quote shorter than 5 characters (4 chars)', () => {
      const parsed = rewriteRequestSchema.safeParse({ quote: 'Java' });
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues[0].message).toMatch(/tối thiểu 5 ký tự/i);
      }
    });

    it('rejects empty quote ("")', () => {
      const parsed = rewriteRequestSchema.safeParse({ quote: '' });
      expect(parsed.success).toBe(false);
    });

    it('rejects quote exceeding 2,000 characters (2001 chars)', () => {
      const parsed = rewriteRequestSchema.safeParse({ quote: 'A'.repeat(2001) });
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues[0].message).toMatch(/tối đa 2\.000 ký tự/i);
      }
    });

    it('rejects targetRole exceeding 100 characters', () => {
      const parsed = rewriteRequestSchema.safeParse({
        quote: 'Học React và viết landing page',
        targetRole: 'A'.repeat(101),
      });
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues[0].message).toMatch(/tối đa 100 ký tự/i);
      }
    });

    it('rejects issue exceeding 500 characters', () => {
      const parsed = rewriteRequestSchema.safeParse({
        quote: 'Học React và viết landing page',
        issue: 'A'.repeat(501),
      });
      expect(parsed.success).toBe(false);
    });

    it('rejects rejectionReason exceeding 1,000 characters', () => {
      const parsed = rewriteRequestSchema.safeParse({
        quote: 'Học React và viết landing page',
        rejectionReason: 'A'.repeat(1001),
      });
      expect(parsed.success).toBe(false);
    });

    it('rejects cvContext exceeding 50,000 characters', () => {
      const parsed = rewriteRequestSchema.safeParse({
        quote: 'Học React và viết landing page',
        cvContext: 'A'.repeat(50001),
      });
      expect(parsed.success).toBe(false);
    });
  });

  describe('2. rewriteResultDataSchema Placeholder Refinement (Anti-Fabrication)', () => {
    it('accepts rewrittenText containing single valid placeholder [25%]', () => {
      const parsed = rewriteResultDataSchema.safeParse(validRewriteData);
      expect(parsed.success).toBe(true);
    });

    it('accepts rewrittenText containing multiple placeholders: [X%], [số lượng], [thời gian]', () => {
      const item = {
        ...validRewriteData,
        rewrittenText:
          'Tối ưu hóa [API latency] giảm [40%] cho [50.000+] người dùng trong vòng [3 tuần].',
      };
      const parsed = rewriteResultDataSchema.safeParse(item);
      expect(parsed.success).toBe(true);
    });

    it('rejects rewrittenText that fabricates metrics without [...] brackets', () => {
      const item = {
        ...validRewriteData,
        rewrittenText:
          'Chủ trì phát triển mô-đun đăng ký giúp tăng 25% tỷ lệ chuyển đổi cho 10.000 người dùng.',
      };
      const parsed = rewriteResultDataSchema.safeParse(item);
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues[0].message).toMatch(/placeholder|\[\.\.\.\]/i);
      }
    });

    it('rejects empty square brackets [] without content', () => {
      const item = {
        ...validRewriteData,
        rewrittenText: 'Chủ trì tối ưu hóa hệ thống giảm [] latency và phục vụ [] users.',
      };
      const parsed = rewriteResultDataSchema.safeParse(item);
      expect(parsed.success).toBe(false);
    });

    it('rejects unclosed bracket [số liệu', () => {
      const item = {
        ...validRewriteData,
        rewrittenText: 'Chủ trì tối ưu hóa hệ thống giảm [25% latency cho dự án.',
      };
      const parsed = rewriteResultDataSchema.safeParse(item);
      expect(parsed.success).toBe(false);
    });

    it('rejects rewrittenText shorter than 10 characters', () => {
      const item = {
        ...validRewriteData,
        rewrittenText: '[12345]', // 7 chars
      };
      const parsed = rewriteResultDataSchema.safeParse(item);
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues[0].message).toMatch(/ít nhất 10 ký tự/i);
      }
    });
  });

  describe('3. rewriteResultDataSchema Required Fields Validation', () => {
    it('rejects empty originalQuote', () => {
      expect(
        rewriteResultDataSchema.safeParse({ ...validRewriteData, originalQuote: '' }).success
      ).toBe(false);
    });

    it('rejects empty actionVerb', () => {
      expect(
        rewriteResultDataSchema.safeParse({ ...validRewriteData, actionVerb: '' }).success
      ).toBe(false);
    });

    it('rejects empty context', () => {
      expect(
        rewriteResultDataSchema.safeParse({ ...validRewriteData, context: '' }).success
      ).toBe(false);
    });

    it('rejects empty result', () => {
      expect(
        rewriteResultDataSchema.safeParse({ ...validRewriteData, result: '' }).success
      ).toBe(false);
    });

    it('rejects empty explanation', () => {
      expect(
        rewriteResultDataSchema.safeParse({ ...validRewriteData, explanation: '' }).success
      ).toBe(false);
    });

    it('accepts empty atsKeywords array by default', () => {
      const { atsKeywords, ...withoutKeywords } = validRewriteData;
      const parsed = rewriteResultDataSchema.safeParse(withoutKeywords);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.atsKeywords).toEqual([]);
      }
    });
  });

  describe('4. Action Verb Taxonomy Schema', () => {
    it('accepts all 4 valid categories', () => {
      for (const cat of ACTION_VERB_CATEGORIES) {
        expect(actionVerbCategorySchema.safeParse(cat).success).toBe(true);
      }
    });

    it('rejects invalid action verb categories', () => {
      expect(actionVerbCategorySchema.safeParse('Giao tiếp').success).toBe(false);
      expect(actionVerbCategorySchema.safeParse('Management').success).toBe(false);
    });
  });

  describe('5. rewriteApiResponseSchema Validation', () => {
    it('validates successful response envelope with data', () => {
      const res = {
        success: true,
        data: validRewriteData,
      };
      const parsed = rewriteApiResponseSchema.safeParse(res);
      expect(parsed.success).toBe(true);
    });

    it('validates error response envelope without data', () => {
      const res = {
        success: false,
        error: 'Trích đoạn không hợp lệ',
      };
      const parsed = rewriteApiResponseSchema.safeParse(res);
      expect(parsed.success).toBe(true);
    });

    it('rejects malformed inner data inside success response', () => {
      const res = {
        success: true,
        data: {
          ...validRewriteData,
          rewrittenText: 'No placeholder here',
        },
      };
      const parsed = rewriteApiResponseSchema.safeParse(res);
      expect(parsed.success).toBe(false);
    });
  });
});
