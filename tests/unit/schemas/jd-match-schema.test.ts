import { describe, it, expect } from 'vitest';
import {
  jdMatchBreakdownSchema,
  jdMatchDataSchema,
  roastRequestSchema,
  roastResultDataSchema,
  roastApiResponseSchema,
} from '@/lib/schemas/roast';

describe('Targeted JD Match Schemas (Milestone 1)', () => {
  const validBreakdown = {
    hardSkillsMatch: 85,
    experienceMatch: 70,
    cultureMatch: 90,
  };

  const validJdMatchData = {
    matchScore: 82,
    breakdown: validBreakdown,
    missingKeywords: ['Docker', 'Kafka', 'Redis'],
    tailoredRecommendations: [
      'Bổ sung kinh nghiệm tối ưu truy vấn MySQL và Redis cache vào mục [Kinh nghiệm dự án].',
      'Đề cập các phương pháp container hóa bằng [Docker] trong đồ án e-commerce.',
    ],
  };

  const sampleWeakness = {
    quote: 'Em là sinh viên chăm chỉ, ham học hỏi và chịu được áp lực cao.',
    issue: 'Dùng văn mẫu sáo rỗng, không chứng minh được năng lực thực tế.',
    severity: 'Cao' as const,
    rejectionReason: 'Nhà tuyển dụng không đo lường được thành tích cụ thể.',
    fixGuideline: 'Thay bằng: Sinh viên năm cuối định hướng [Frontend], phát triển [X] ứng dụng web với [React/Next.js].',
  };

  const validRoastData = {
    overallScore: 75,
    tone: 'spicy' as const,
    summaryVerdict: 'CV tạm ổn nhưng còn thiếu số liệu thực chiến.',
    topStrengths: ['Có nền tảng React và Next.js'],
    weaknesses: [sampleWeakness],
    atsRecommendations: [
      {
        category: 'Từ khóa' as const,
        recommendation: 'Bổ sung các từ khóa công nghệ liên quan',
        impact: 'Quan trọng' as const,
      },
    ],
    disclaimer: 'Kết quả chỉ mang tính tham khảo.',
  };

  // ==========================================
  // 1. jdMatchBreakdownSchema
  // ==========================================
  describe('1. jdMatchBreakdownSchema', () => {
    it('accepts valid breakdown scores within [0, 100]', () => {
      const parsed = jdMatchBreakdownSchema.safeParse(validBreakdown);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.hardSkillsMatch).toBe(85);
        expect(parsed.data.experienceMatch).toBe(70);
        expect(parsed.data.cultureMatch).toBe(90);
      }
    });

    it('accepts boundary scores: all 0s', () => {
      const parsed = jdMatchBreakdownSchema.safeParse({
        hardSkillsMatch: 0,
        experienceMatch: 0,
        cultureMatch: 0,
      });
      expect(parsed.success).toBe(true);
    });

    it('accepts boundary scores: all 100s', () => {
      const parsed = jdMatchBreakdownSchema.safeParse({
        hardSkillsMatch: 100,
        experienceMatch: 100,
        cultureMatch: 100,
      });
      expect(parsed.success).toBe(true);
    });

    it('rejects negative scores for hardSkillsMatch (-1)', () => {
      const parsed = jdMatchBreakdownSchema.safeParse({
        ...validBreakdown,
        hardSkillsMatch: -1,
      });
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues[0].message).toMatch(/nhỏ nhất là 0|>= 0/i);
      }
    });

    it('rejects scores exceeding 100 for experienceMatch (101)', () => {
      const parsed = jdMatchBreakdownSchema.safeParse({
        ...validBreakdown,
        experienceMatch: 101,
      });
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues[0].message).toMatch(/lớn nhất là 100|<= 100/i);
      }
    });

    it('rejects non-integer floating point numbers for cultureMatch (85.5)', () => {
      const parsed = jdMatchBreakdownSchema.safeParse({
        ...validBreakdown,
        cultureMatch: 85.5,
      });
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues[0].message).toMatch(/phải là số nguyên/i);
      }
    });

    it('rejects string values ("80") in breakdown fields', () => {
      const parsed = jdMatchBreakdownSchema.safeParse({
        ...validBreakdown,
        hardSkillsMatch: '80',
      });
      expect(parsed.success).toBe(false);
    });

    it('rejects when any breakdown field is missing', () => {
      const incomplete = {
        hardSkillsMatch: 80,
        experienceMatch: 70,
      };
      const parsed = jdMatchBreakdownSchema.safeParse(incomplete);
      expect(parsed.success).toBe(false);
    });
  });

  // ==========================================
  // 2. jdMatchDataSchema
  // ==========================================
  describe('2. jdMatchDataSchema', () => {
    it('successfully parses full valid jdMatchData', () => {
      const parsed = jdMatchDataSchema.safeParse(validJdMatchData);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.matchScore).toBe(82);
        expect(parsed.data.missingKeywords).toHaveLength(3);
        expect(parsed.data.tailoredRecommendations).toHaveLength(2);
      }
    });

    it('accepts boundary matchScore 0', () => {
      const parsed = jdMatchDataSchema.safeParse({
        ...validJdMatchData,
        matchScore: 0,
      });
      expect(parsed.success).toBe(true);
    });

    it('accepts boundary matchScore 100', () => {
      const parsed = jdMatchDataSchema.safeParse({
        ...validJdMatchData,
        matchScore: 100,
      });
      expect(parsed.success).toBe(true);
    });

    it('accepts empty missingKeywords array (candidate satisfies all keywords)', () => {
      const parsed = jdMatchDataSchema.safeParse({
        ...validJdMatchData,
        missingKeywords: [],
      });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.missingKeywords).toEqual([]);
      }
    });

    it('accepts empty tailoredRecommendations array', () => {
      const parsed = jdMatchDataSchema.safeParse({
        ...validJdMatchData,
        tailoredRecommendations: [],
      });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.tailoredRecommendations).toEqual([]);
      }
    });

    it('rejects negative matchScore (-5)', () => {
      const parsed = jdMatchDataSchema.safeParse({
        ...validJdMatchData,
        matchScore: -5,
      });
      expect(parsed.success).toBe(false);
    });

    it('rejects matchScore exceeding 100 (105)', () => {
      const parsed = jdMatchDataSchema.safeParse({
        ...validJdMatchData,
        matchScore: 105,
      });
      expect(parsed.success).toBe(false);
    });

    it('rejects non-integer matchScore (75.2)', () => {
      const parsed = jdMatchDataSchema.safeParse({
        ...validJdMatchData,
        matchScore: 75.2,
      });
      expect(parsed.success).toBe(false);
    });

    it('rejects non-string elements inside missingKeywords array', () => {
      const parsed = jdMatchDataSchema.safeParse({
        ...validJdMatchData,
        missingKeywords: ['Docker', 12345 as unknown as string],
      });
      expect(parsed.success).toBe(false);
    });

    it('rejects missing breakdown object', () => {
      const { breakdown: _, ...withoutBreakdown } = validJdMatchData;
      const parsed = jdMatchDataSchema.safeParse(withoutBreakdown);
      expect(parsed.success).toBe(false);
    });
  });

  // ==========================================
  // 3. roastRequestSchema with optional jdText
  // ==========================================
  describe('3. roastRequestSchema with optional jdText', () => {
    const baseRequest = {
      cvText: 'Nguyễn Văn A - Sinh viên năm cuối ngành Công nghệ thông tin Đại học Bách Khoa Hà Nội có kinh nghiệm làm việc với Next.js và React.',
      tone: 'spicy' as const,
      targetRole: 'Frontend Developer',
    };

    it('accepts valid request with jdText provided', () => {
      const parsed = roastRequestSchema.safeParse({
        ...baseRequest,
        jdText: 'Tuyển dụng Frontend Fresher yêu cầu thành thạo Next.js, React, Tailwind CSS và RESTful API.',
      });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.jdText).toContain('Frontend Fresher');
      }
    });

    it('backward compatibility: accepts request without jdText', () => {
      const parsed = roastRequestSchema.safeParse(baseRequest);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.jdText).toBeUndefined();
      }
    });

    it('backward compatibility: accepts request with neither targetRole nor jdText', () => {
      const parsed = roastRequestSchema.safeParse({
        cvText: baseRequest.cvText,
        tone: 'constructive' as const,
      });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.targetRole).toBeUndefined();
        expect(parsed.data.jdText).toBeUndefined();
      }
    });

    it('accepts boundary empty string for jdText', () => {
      const parsed = roastRequestSchema.safeParse({
        ...baseRequest,
        jdText: '',
      });
      expect(parsed.success).toBe(true);
    });

    it('accepts boundary jdText with exactly 10,000 characters', () => {
      const maxJdText = 'A'.repeat(10000);
      const parsed = roastRequestSchema.safeParse({
        ...baseRequest,
        jdText: maxJdText,
      });
      expect(parsed.success).toBe(true);
    });

    it('rejects jdText exceeding 10,000 characters (10,001 chars)', () => {
      const overlimitJdText = 'A'.repeat(10001);
      const parsed = roastRequestSchema.safeParse({
        ...baseRequest,
        jdText: overlimitJdText,
      });
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues[0].message).toMatch(/10\.000 ký tự/i);
      }
    });

    it('rejects non-string jdText (e.g. number)', () => {
      const parsed = roastRequestSchema.safeParse({
        ...baseRequest,
        jdText: 99999 as unknown as string,
      });
      expect(parsed.success).toBe(false);
    });
  });

  // ==========================================
  // 4. roastResultDataSchema with optional jdMatch
  // ==========================================
  describe('4. roastResultDataSchema with optional jdMatch', () => {
    it('backward compatibility: accepts roast result without jdMatch', () => {
      const parsed = roastResultDataSchema.safeParse(validRoastData);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.jdMatch).toBeUndefined();
      }
    });

    it('accepts roast result with full valid jdMatch', () => {
      const withJdMatch = {
        ...validRoastData,
        jdMatch: validJdMatchData,
      };
      const parsed = roastResultDataSchema.safeParse(withJdMatch);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.jdMatch).toBeDefined();
        expect(parsed.data.jdMatch?.matchScore).toBe(82);
        expect(parsed.data.jdMatch?.breakdown.hardSkillsMatch).toBe(85);
      }
    });

    it('rejects roast result when jdMatch is present but invalid', () => {
      const withInvalidJdMatch = {
        ...validRoastData,
        jdMatch: {
          ...validJdMatchData,
          matchScore: 999, // invalid score
        },
      };
      const parsed = roastResultDataSchema.safeParse(withInvalidJdMatch);
      expect(parsed.success).toBe(false);
    });

    it('validates full roastApiResponseSchema wrapper with jdMatch', () => {
      const response = {
        success: true,
        data: {
          ...validRoastData,
          jdMatch: validJdMatchData,
        },
      };
      const parsed = roastApiResponseSchema.safeParse(response);
      expect(parsed.success).toBe(true);
    });
  });
});
