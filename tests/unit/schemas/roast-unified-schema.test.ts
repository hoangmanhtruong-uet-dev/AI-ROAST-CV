import { describe, it, expect } from 'vitest';
import {
  roastResultDataSchema,
  weaknessItemSchema,
  RoastData,
} from '@/lib/schemas/roast';
import {
  geminiRoastResponseSchema,
  geminiUnifiedRoastResponseSchema,
} from '@/lib/gemini/roast-schema';
import { getMockRoastData } from '@/lib/gemini/roast';

describe('Milestone M8: Unified Gemini Schema & Zod Schemas (R2)', () => {
  const sampleWeakness = {
    quote: 'Em là sinh viên chăm chỉ, ham học hỏi và chịu được áp lực cao.',
    issue: 'Dùng văn mẫu sáo rỗng, không cung cấp giá trị hay chứng minh năng lực thực tế.',
    severity: 'Cao' as const,
    rejectionReason: 'Nhà tuyển dụng không đo lường được thành tích cụ thể.',
    rejectReason: 'Nhà tuyển dụng không đo lường được thành tích cụ thể.',
    fixGuideline:
      'Thay bằng: Sinh viên năm cuối định hướng [Frontend], phát triển [X] ứng dụng web với [React/Next.js] và tối ưu hóa [LCP].',
  };

  const sampleInterviewQuestions = [
    {
      questionId: 'cv-q1',
      role: 'custom' as const,
      questionIndex: 1 as const,
      title: 'Xử lý race condition trong thanh toán giỏ hàng',
      scenario: 'Khách hàng bấm thanh toán nhiều lần khi mạng lag, tài khoản bị trừ tiền 2 lần.',
      pressureContext: 'Giám đốc yêu cầu giải trình và xử lý nóng trong 15 phút.',
      timeLimitSeconds: 90,
    },
    {
      questionId: 'cv-q2',
      role: 'custom' as const,
      questionIndex: 2 as const,
      title: 'Bảo vệ quyết định dùng Zustand trước Tech Lead',
      scenario: 'Tech Lead muốn chuyển toàn bộ sang Redux Toolkit để đồng bộ code cũ.',
      pressureContext: 'Bị đặt vào thế xung đột kiến trúc ngay trước toàn team.',
      timeLimitSeconds: 75,
    },
    {
      questionId: 'cv-q3',
      role: 'custom' as const,
      questionIndex: 3 as const,
      title: 'Phát hiện token API ngân hàng bị commit lên GitHub',
      scenario: 'Đồng đội đề xuất xóa commit âm thầm thay vì báo cáo sự cố an ninh.',
      pressureContext: 'Chỉ có 60 giây để quyết định báo cáo hay giấu nhẹm.',
      timeLimitSeconds: 60,
    },
  ];

  const fullUnifiedPayload = {
    overallScore: 65,
    roastScore: 65,
    survivalScore: 58,
    funnyTitle: 'Chiến thần rải CV',
    tone: 'spicy' as const,
    summaryVerdict: 'CV còn sáo rỗng, cần bổ sung nhiều số liệu định lượng.',
    verdict: 'CV còn sáo rỗng, cần bổ sung nhiều số liệu định lượng.',
    topStrengths: ['Có nền tảng Next.js', 'Bố cục 1 trang chuẩn'],
    weaknesses: [sampleWeakness],
    atsRecommendations: [
      {
        category: 'Từ khóa' as const,
        recommendation: 'Bổ sung từ khóa Core Web Vitals',
        impact: 'Quan trọng' as const,
      },
    ],
    interviewQuestions: sampleInterviewQuestions,
    disclaimer: 'Đánh giá AI chỉ mang tính tham khảo luyện tập.',
  };

  describe('1. Gemini Response Schema Structure (geminiRoastResponseSchema)', () => {
    it('defines all required top-level properties including survivalScore, funnyTitle, and interviewQuestions', () => {
      const props = geminiRoastResponseSchema.properties;
      expect(props).toBeDefined();
      expect(props.overallScore).toBeDefined();
      expect(props.roastScore).toBeDefined();
      expect(props.survivalScore).toBeDefined();
      expect(props.funnyTitle).toBeDefined();
      expect(props.tone).toBeDefined();
      expect(props.summaryVerdict).toBeDefined();
      expect(props.verdict).toBeDefined();
      expect(props.topStrengths).toBeDefined();
      expect(props.weaknesses).toBeDefined();
      expect(props.atsRecommendations).toBeDefined();
      expect(props.interviewQuestions).toBeDefined();
      expect(props.disclaimer).toBeDefined();
    });

    it('requires the essential unified fields in the schema', () => {
      const required = geminiRoastResponseSchema.required;
      expect(required).toContain('overallScore');
      expect(required).toContain('survivalScore');
      expect(required).toContain('funnyTitle');
      expect(required).toContain('summaryVerdict');
      expect(required).toContain('weaknesses');
      expect(required).toContain('atsRecommendations');
      expect(required).toContain('interviewQuestions');
      expect(required).toContain('disclaimer');
    });

    it('exports geminiUnifiedRoastResponseSchema as alias for geminiRoastResponseSchema', () => {
      expect(geminiUnifiedRoastResponseSchema).toBe(geminiRoastResponseSchema);
    });

    it('defines interviewQuestions schema with escalating situational properties and timeLimitSeconds', () => {
      const iqSchema = geminiRoastResponseSchema.properties.interviewQuestions;
      expect(iqSchema.type).toBe('ARRAY');
      const itemProps = (iqSchema.items as any).properties;
      expect(itemProps.questionId).toBeDefined();
      expect(itemProps.title).toBeDefined();
      expect(itemProps.scenario).toBeDefined();
      expect(itemProps.pressureContext).toBeDefined();
      expect(itemProps.timeLimitSeconds).toBeDefined();
    });
  });

  describe('2. Zod roastResultDataSchema Validation & Backward Compatibility', () => {
    it('validates a complete unified payload with all R2 fields', () => {
      const parsed = roastResultDataSchema.safeParse(fullUnifiedPayload);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.overallScore).toBe(65);
        expect(parsed.data.survivalScore).toBe(58);
        expect(parsed.data.funnyTitle).toBe('Chiến thần rải CV');
        expect(parsed.data.interviewQuestions).toHaveLength(3);
        expect(parsed.data.interviewQuestions?.[0].timeLimitSeconds).toBe(90);
        expect(parsed.data.interviewQuestions?.[1].timeLimitSeconds).toBe(75);
        expect(parsed.data.interviewQuestions?.[2].timeLimitSeconds).toBe(60);
      }
    });

    it('maintains 100% backward compatibility when survivalScore, funnyTitle, or interviewQuestions are omitted', () => {
      const legacyPayload = {
        overallScore: 72,
        tone: 'constructive' as const,
        summaryVerdict: 'CV tốt nhưng cần trau chuốt hơn.',
        topStrengths: ['Kiến thức vững vàng'],
        weaknesses: [sampleWeakness],
        atsRecommendations: [
          {
            category: 'Cấu trúc' as const,
            recommendation: 'Phân tách rõ mục dự án',
            impact: 'Quan trọng' as const,
          },
        ],
        disclaimer: 'Tham khảo luyện tập.',
      };

      const parsed = roastResultDataSchema.safeParse(legacyPayload);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.overallScore).toBe(72);
        expect(parsed.data.survivalScore).toBeUndefined();
        expect(parsed.data.funnyTitle).toBeUndefined();
        expect(parsed.data.interviewQuestions).toBeUndefined();
      }
    });

    it('enforces survivalScore bounds [0, 100]', () => {
      expect(
        roastResultDataSchema.safeParse({ ...fullUnifiedPayload, survivalScore: 0 }).success
      ).toBe(true);
      expect(
        roastResultDataSchema.safeParse({ ...fullUnifiedPayload, survivalScore: 100 }).success
      ).toBe(true);
      expect(
        roastResultDataSchema.safeParse({ ...fullUnifiedPayload, survivalScore: -1 }).success
      ).toBe(false);
      expect(
        roastResultDataSchema.safeParse({ ...fullUnifiedPayload, survivalScore: 101 }).success
      ).toBe(false);
      expect(
        roastResultDataSchema.safeParse({ ...fullUnifiedPayload, survivalScore: 50.5 }).success
      ).toBe(false);
    });

    it('accepts weaknessItemSchema with rejectReason alias', () => {
      const withRejectReason = {
        quote: 'Kinh nghiệm: 2 năm React',
        issue: 'Không có số liệu',
        severity: 'Cao' as const,
        rejectionReason: 'Thiếu định lượng',
        rejectReason: 'Thiếu định lượng',
        fixGuideline: 'Tối ưu hóa [X%] với [Next.js].',
      };
      const parsed = weaknessItemSchema.safeParse(withRejectReason);
      expect(parsed.success).toBe(true);
    });
  });

  describe('3. getMockRoastData Unified Realistic Output', () => {
    it('returns realistic unified payload for spicy tone', () => {
      const mockSpicy = getMockRoastData('spicy');
      expect(mockSpicy.overallScore).toBe(58);
      expect(mockSpicy.survivalScore).toBe(52);
      expect(mockSpicy.funnyTitle).toBe('Chiến Thần Kỹ Năng Mềm');
      expect(mockSpicy.interviewQuestions).toHaveLength(3);
      expect(mockSpicy.interviewQuestions?.[0].timeLimitSeconds).toBe(90);
      expect(mockSpicy.interviewQuestions?.[1].timeLimitSeconds).toBe(75);
      expect(mockSpicy.interviewQuestions?.[2].timeLimitSeconds).toBe(60);

      // Verify fixGuideline placeholders
      for (const w of mockSpicy.weaknesses) {
        expect(w.fixGuideline).toMatch(/\[.+?\]/);
      }
    });

    it('returns realistic unified payload for constructive tone', () => {
      const mockConstructive = getMockRoastData('constructive');
      expect(mockConstructive.overallScore).toBe(68);
      expect(mockConstructive.survivalScore).toBe(65);
      expect(mockConstructive.funnyTitle).toBe('Hiệp Sĩ Fix Bug Gánh Team');
      expect(mockConstructive.interviewQuestions).toHaveLength(3);
      expect(mockConstructive.interviewQuestions?.[0].timeLimitSeconds).toBe(90);
      expect(mockConstructive.interviewQuestions?.[1].timeLimitSeconds).toBe(75);
      expect(mockConstructive.interviewQuestions?.[2].timeLimitSeconds).toBe(60);
    });

    it('verifies that getMockRoastData passes roastResultDataSchema validation seamlessly', () => {
      const spicyParsed = roastResultDataSchema.safeParse(getMockRoastData('spicy'));
      expect(spicyParsed.success).toBe(true);

      const constructiveParsed = roastResultDataSchema.safeParse(getMockRoastData('constructive'));
      expect(constructiveParsed.success).toBe(true);
    });
  });
});
