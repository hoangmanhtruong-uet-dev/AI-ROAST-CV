import { describe, it, expect } from 'vitest';
import {
  roastRequestSchema,
  weaknessItemSchema,
  atsRecommendationSchema,
  roastResultDataSchema,
  roastApiResponseSchema,
} from '@/lib/schemas/roast';

describe('Roast CV Zod Schemas (Feature 13, 14 & Interface Contract 3)', () => {
  const validWeakness = {
    quote: 'Tham gia phát triển dự án thương mại điện tử bằng React',
    issue: 'Chưa thể hiện vai trò cá nhân và số liệu đo lường kết quả',
    severity: 'Cao' as const,
    rejectionReason: 'Nhà tuyển dụng không thấy được đóng góp định lượng thực tế',
    fixGuideline:
      'Thay bằng: Đảm nhận vị trí [Frontend Developer], tối ưu hóa [Core Web Vitals] giúp tăng [25%] tốc độ tải trang cho [50.000] người dùng.',
  };

  const validAts = {
    category: 'Cấu trúc' as const,
    recommendation: 'Đổi tiêu đề mục "Các thứ đã làm" thành tiêu đề chuẩn ATS "Kinh nghiệm làm việc"',
    impact: 'Quan trọng' as const,
  };

  const validRoastData = {
    overallScore: 68,
    tone: 'spicy' as const,
    summaryVerdict:
      'CV trình bày quá chung chung, liệt kê công việc như mô tả JD thay vì thành tích cá nhân.',
    topStrengths: [
      'Nắm vững cú pháp TypeScript và React',
      'Có dự án cá nhân hoàn chỉnh triển khai thực tế',
    ],
    weaknesses: [validWeakness],
    atsRecommendations: [validAts],
    disclaimer: 'Kết quả chỉ mang tính tham khảo luyện tập, không cam kết việc làm hay đỗ ATS.',
  };

  describe('1. roastResultDataSchema Structure & Full Payload', () => {
    it('successfully parses valid roast output data', () => {
      const parsed = roastResultDataSchema.safeParse(validRoastData);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.overallScore).toBe(68);
        expect(parsed.data.tone).toBe('spicy');
        expect(parsed.data.weaknesses).toHaveLength(1);
      }
    });

    it('successfully validates full roastApiResponseSchema wrapper', () => {
      const fullResponse = {
        success: true,
        data: validRoastData,
      };
      const parsed = roastApiResponseSchema.safeParse(fullResponse);
      expect(parsed.success).toBe(true);
    });

    it('accepts error response without data in roastApiResponseSchema', () => {
      const errorResponse = {
        success: false,
        error: 'Tệp tải lên không đúng định dạng',
      };
      const parsed = roastApiResponseSchema.safeParse(errorResponse);
      expect(parsed.success).toBe(true);
    });
  });

  describe('2. Score Range Boundaries (0 to 100)', () => {
    it('accepts boundary score 0', () => {
      const parsed = roastResultDataSchema.safeParse({ ...validRoastData, overallScore: 0 });
      expect(parsed.success).toBe(true);
    });

    it('accepts boundary score 100', () => {
      const parsed = roastResultDataSchema.safeParse({ ...validRoastData, overallScore: 100 });
      expect(parsed.success).toBe(true);
    });

    it('rejects score less than 0 (-1)', () => {
      const parsed = roastResultDataSchema.safeParse({ ...validRoastData, overallScore: -1 });
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues[0].message).toMatch(/>= 0|nhỏ nhất là 0/i);
      }
    });

    it('rejects score greater than 100 (101)', () => {
      const parsed = roastResultDataSchema.safeParse({ ...validRoastData, overallScore: 101 });
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues[0].message).toMatch(/<= 100|lớn nhất là 100/i);
      }
    });

    it('rejects non-numeric score string ("85")', () => {
      const parsed = roastResultDataSchema.safeParse({ ...validRoastData, overallScore: '85' });
      expect(parsed.success).toBe(false);
    });
  });

  describe('3. Tone Enum Validation', () => {
    it('accepts "spicy" and "constructive" tones', () => {
      expect(roastResultDataSchema.safeParse({ ...validRoastData, tone: 'spicy' }).success).toBe(
        true
      );
      expect(
        roastResultDataSchema.safeParse({ ...validRoastData, tone: 'constructive' }).success
      ).toBe(true);
    });

    it('rejects unsupported tones ("neutral", "sarcastic", "harsh")', () => {
      expect(roastResultDataSchema.safeParse({ ...validRoastData, tone: 'neutral' }).success).toBe(
        false
      );
      expect(
        roastResultDataSchema.safeParse({ ...validRoastData, tone: 'sarcastic' }).success
      ).toBe(false);
      expect(roastResultDataSchema.safeParse({ ...validRoastData, tone: 'harsh' }).success).toBe(
        false
      );
    });
  });

  describe('4. Weakness Severity Levels (Vietnamese Rubric)', () => {
    it('accepts valid Vietnamese severity levels: "Cao", "Trung bình", "Thấp"', () => {
      expect(weaknessItemSchema.safeParse({ ...validWeakness, severity: 'Cao' }).success).toBe(
        true
      );
      expect(
        weaknessItemSchema.safeParse({ ...validWeakness, severity: 'Trung bình' }).success
      ).toBe(true);
      expect(weaknessItemSchema.safeParse({ ...validWeakness, severity: 'Thấp' }).success).toBe(
        true
      );
    });

    it('rejects English or non-standard severity levels ("High", "Medium", "Low", "Critical")', () => {
      expect(weaknessItemSchema.safeParse({ ...validWeakness, severity: 'High' }).success).toBe(
        false
      );
      expect(weaknessItemSchema.safeParse({ ...validWeakness, severity: 'Medium' }).success).toBe(
        false
      );
      expect(weaknessItemSchema.safeParse({ ...validWeakness, severity: 'Low' }).success).toBe(
        false
      );
      expect(
        weaknessItemSchema.safeParse({ ...validWeakness, severity: 'Critical' }).success
      ).toBe(false);
    });
  });

  describe('5. Placeholder Notation [...] Enforcement (Feature 13)', () => {
    it('accepts fixGuideline containing valid placeholder notation [số liệu cụ thể]', () => {
      const item = {
        ...validWeakness,
        fixGuideline:
          'Tăng trưởng doanh số [số liệu %] nhờ triển khai chiến dịch [tên chiến dịch].',
      };
      expect(weaknessItemSchema.safeParse(item).success).toBe(true);
    });

    it('accepts fixGuideline containing multiple placeholders: [X%], [tên công cụ], [thời gian]', () => {
      const item = {
        ...validWeakness,
        fixGuideline:
          'Giảm [X%] thời gian build bằng cách áp dụng [Turbopack] trong vòng [2 tuần].',
      };
      expect(weaknessItemSchema.safeParse(item).success).toBe(true);
    });

    it('rejects fixGuideline that fabricates metrics without [...] placeholders', () => {
      const item = {
        ...validWeakness,
        // Fabricated achievement with real numbers and no placeholders
        fixGuideline:
          'Đã tối ưu hóa hệ thống giảm 45% latency và tăng 100.000 người dùng hoạt động hàng tháng.',
      };
      const parsed = weaknessItemSchema.safeParse(item);
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues[0].message).toMatch(/\[\.\.\.\]|placeholder|ký hiệu giữ chỗ/i);
      }
    });

    it('rejects empty brackets [] without placeholder name', () => {
      const item = {
        ...validWeakness,
        fixGuideline: 'Tăng trưởng doanh thu [] trong vòng [].',
      };
      const parsed = weaknessItemSchema.safeParse(item);
      expect(parsed.success).toBe(false);
    });
  });

  describe('6. ATS Recommendations Category & Impact Enums', () => {
    it('accepts all 4 valid ATS categories', () => {
      const categories = ['Cấu trúc', 'Từ khóa', 'Định dạng', 'Độ dài'] as const;
      for (const category of categories) {
        expect(atsRecommendationSchema.safeParse({ ...validAts, category }).success).toBe(true);
      }
    });

    it('rejects invalid ATS categories ("Nội dung", "Kỹ năng")', () => {
      expect(atsRecommendationSchema.safeParse({ ...validAts, category: 'Nội dung' }).success).toBe(
        false
      );
      expect(atsRecommendationSchema.safeParse({ ...validAts, category: 'Kỹ năng' }).success).toBe(
        false
      );
    });

    it('accepts both ATS impact levels ("Quan trọng", "Nên làm")', () => {
      expect(atsRecommendationSchema.safeParse({ ...validAts, impact: 'Quan trọng' }).success).toBe(
        true
      );
      expect(atsRecommendationSchema.safeParse({ ...validAts, impact: 'Nên làm' }).success).toBe(
        true
      );
    });

    it('rejects invalid ATS impact ("Bắt buộc", "Tùy chọn")', () => {
      expect(atsRecommendationSchema.safeParse({ ...validAts, impact: 'Bắt buộc' }).success).toBe(
        false
      );
    });
  });

  describe('7. roastRequestSchema Validation', () => {
    it('accepts valid request with minimum 30 characters and valid tone', () => {
      const validReq = {
        cvText:
          'Nguyễn Văn A - Sinh viên năm cuối ngành Công nghệ thông tin Đại học Bách Khoa Hà Nội. Có kinh nghiệm làm việc với React và TypeScript.',
        tone: 'spicy' as const,
        targetRole: 'Frontend Developer',
      };
      const parsed = roastRequestSchema.safeParse(validReq);
      expect(parsed.success).toBe(true);
    });

    it('accepts valid request without optional targetRole', () => {
      const validReq = {
        cvText:
          'Nguyễn Văn A - Sinh viên năm cuối ngành Công nghệ thông tin Đại học Bách Khoa Hà Nội. Có kinh nghiệm làm việc với React và TypeScript.',
        tone: 'constructive' as const,
      };
      const parsed = roastRequestSchema.safeParse(validReq);
      expect(parsed.success).toBe(true);
    });

    it('rejects cvText shorter than 30 characters', () => {
      const shortReq = {
        cvText: 'CV quá ngắn',
        tone: 'spicy' as const,
      };
      const parsed = roastRequestSchema.safeParse(shortReq);
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues[0].message).toMatch(/quá ngắn|tối thiểu 30 ký tự/i);
      }
    });

    it('rejects cvText exceeding 50,000 characters', () => {
      const longReq = {
        cvText: 'A'.repeat(50001),
        tone: 'spicy' as const,
      };
      const parsed = roastRequestSchema.safeParse(longReq);
      expect(parsed.success).toBe(false);
    });

    it('rejects missing tone in request', () => {
      const noToneReq = {
        cvText:
          'Nguyễn Văn A - Sinh viên năm cuối ngành Công nghệ thông tin Đại học Bách Khoa Hà Nội.',
      };
      const parsed = roastRequestSchema.safeParse(noToneReq);
      expect(parsed.success).toBe(false);
    });
  });
});
