import { describe, it, expect } from 'vitest';
import {
  maskPii,
  maskCVPII,
  previewEmail,
  previewPhone,
  previewId,
  previewUrl,
} from '@/lib/utils/pii-masker';

describe('Client-Side PII Masker (Milestone 7 / Requirement R1)', () => {
  describe('1. Phone Number Masking (Vietnamese Mobile Formats)', () => {
    it('masks standard 10-digit domestic phone numbers starting with 03x, 05x, 07x, 08x, 09x', () => {
      const input = 'Liên hệ: 0987654321 hoặc 0391234567 hoặc 0779998888';
      const result = maskPii(input);

      expect(result.sanitizedText).toBe('Liên hệ: [PHONE_REDACTED] hoặc [PHONE_REDACTED] hoặc [PHONE_REDACTED]');
      expect(result.stats.phones).toBe(3);
      expect(result.detectedItems.some((item) => item.preview === '098****321')).toBe(true);
      expect(result.detectedItems.some((item) => item.preview === '039****567')).toBe(true);
      expect(result.detectedItems.some((item) => item.preview === '077****888')).toBe(true);
    });

    it('masks international format +84 and 84 with spaces or hyphens', () => {
      const input = 'Call me at +84 912 345 678 or 84-987-654-321';
      const result = maskPii(input);

      expect(result.sanitizedText).toContain('[PHONE_REDACTED]');
      expect(result.stats.phones).toBe(2);
      expect(result.detectedItems.some((item) => item.preview.startsWith('+84'))).toBe(true);
    });
  });

  describe('2. Email Address Masking', () => {
    it('masks standard email addresses and produces preview ngu***@gmail.com', () => {
      const input = 'Gửi CV về email nguyenvana@gmail.com hoặc hoang.le@hust.edu.vn';
      const result = maskPii(input);

      expect(result.sanitizedText).toBe('Gửi CV về email [EMAIL_REDACTED] hoặc [EMAIL_REDACTED]');
      expect(result.stats.emails).toBe(2);
      expect(result.detectedItems.some((item) => item.preview === 'ngu***@gmail.com')).toBe(true);
      expect(result.detectedItems.some((item) => item.preview === 'hoa***@hust.edu.vn')).toBe(true);
    });

    it('handles short email local parts gracefully', () => {
      expect(previewEmail('ab@domain.com')).toBe('ab***@domain.com');
      expect(previewEmail('a@domain.com')).toBe('a***@domain.com');
    });
  });

  describe('3. Citizen ID (CCCD 12 Digits & CMND 9 Digits) Masking', () => {
    it('masks standalone 12-digit CCCD with valid Vietnamese province code', () => {
      // 001: Hanoi, 0: male 20th cent, 99: 1999, 123456
      const input = 'Số CCCD: 001099123456 gắn chip';
      const result = maskPii(input);

      expect(result.sanitizedText).toContain('[ID_REDACTED]');
      expect(result.stats.ids).toBe(1);
      expect(result.detectedItems.some((item) => item.preview === '001099******')).toBe(true);
    });

    it('masks CMND 9 digits when prefixed with identification labels', () => {
      const input = 'CMND: 123456789 cấp tại Hà Nội';
      const result = maskPii(input);

      expect(result.sanitizedText).toContain('[ID_REDACTED]');
      expect(result.stats.ids).toBe(1);
      expect(result.detectedItems.some((item) => item.preview === '123****789')).toBe(true);
    });
  });

  describe('4. Portfolio & Social URL Masking', () => {
    it('masks GitHub, LinkedIn, and personal portfolio links', () => {
      const input = 'Portfolio: https://github.com/nguyenvana và linkedin.com/in/nguyenvana';
      const result = maskPii(input);

      expect(result.sanitizedText).toBe('Portfolio: [URL_REDACTED] và [URL_REDACTED]');
      expect(result.stats.urls).toBe(2);
    });
  });

  describe('5. Numerical Facts & Metrics Preservation (Anti-False-Positive Invariants)', () => {
    it('does NOT mask project metrics, user counts, or currency amounts', () => {
      const input = `
        Kinh nghiệm:
        - Xây dựng hệ thống phục vụ 100.000 users đồng thời, giảm latency từ 500ms xuống 120ms.
        - Quản lý ngân sách dự án 15.000.000 VNĐ, tối ưu chi phí 35%.
        - Tốt nghiệp Đại học Bách Khoa giai đoạn 2022-2026 với GPA 3.8/4.0.
        - Đạt điểm ATS Score: 85/100.
      `.trim();

      const result = maskPii(input);

      // Must remain completely intact
      expect(result.sanitizedText).toContain('100.000 users');
      expect(result.sanitizedText).toContain('500ms');
      expect(result.sanitizedText).toContain('120ms');
      expect(result.sanitizedText).toContain('15.000.000 VNĐ');
      expect(result.sanitizedText).toContain('35%');
      expect(result.sanitizedText).toContain('2022-2026');
      expect(result.sanitizedText).toContain('GPA 3.8/4.0');
      expect(result.sanitizedText).toContain('85/100');

      expect(result.stats.total).toBe(0);
      expect(result.detectedItems.length).toBe(0);
    });
  });

  describe('6. Comprehensive CV Realistic Payload Test', () => {
    it('accurately redacts personal info while keeping professional experience intact', () => {
      const cvText = `
        HỌ VÀ TÊN: NGUYỄN VĂN AN
        Email: nguyenvanan.dev@gmail.com
        SĐT: 0912.345.678 | CCCD: 001202012345
        GitHub: https://github.com/an-nguyen
        LinkedIn: linkedin.com/in/an-nguyen-dev

        KINH NGHIỆM LÀM VIỆC:
        Frontend Engineer tại Công ty XYZ (2023 - 2026):
        - Tối ưu hóa Web Vitals tăng 40% điểm Lighthouse.
        - Phục vụ hơn 50.000 người dùng hoạt động mỗi ngày.
        - Tiết kiệm 25.000.000 VNĐ chi phí server mỗi tháng.
      `;

      const result = maskPii(cvText);

      expect(result.sanitizedText).not.toContain('nguyenvanan.dev@gmail.com');
      expect(result.sanitizedText).not.toContain('0912.345.678');
      expect(result.sanitizedText).not.toContain('001202012345');
      expect(result.sanitizedText).not.toContain('https://github.com/an-nguyen');

      expect(result.sanitizedText).toContain('[EMAIL_REDACTED]');
      expect(result.sanitizedText).toContain('[PHONE_REDACTED]');
      expect(result.sanitizedText).toContain('[ID_REDACTED]');
      expect(result.sanitizedText).toContain('[URL_REDACTED]');

      // Metrics preserved
      expect(result.sanitizedText).toContain('40%');
      expect(result.sanitizedText).toContain('50.000 người dùng');
      expect(result.sanitizedText).toContain('25.000.000 VNĐ');

      expect(result.stats.emails).toBe(1);
      expect(result.stats.phones).toBe(1);
      expect(result.stats.ids).toBe(1);
      expect(result.stats.urls).toBe(2);
      expect(result.stats.total).toBe(5);
    });

    it('aliases maskCVPII identically to maskPii', () => {
      const sample = 'Email: test@example.com';
      expect(maskCVPII(sample)).toEqual(maskPii(sample));
    });

    it('handles empty or non-string input safely', () => {
      expect(maskPii('')).toEqual({
        sanitizedText: '',
        stats: { phones: 0, emails: 0, ids: 0, urls: 0, total: 0 },
        detectedItems: [],
      });
      // @ts-expect-error test non-string
      expect(maskPii(null)).toEqual({
        sanitizedText: '',
        stats: { phones: 0, emails: 0, ids: 0, urls: 0, total: 0 },
        detectedItems: [],
      });
    });
  });
});
