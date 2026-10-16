import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  TargetRoleSelector,
  sanitizeJdText,
  TargetRoleSelectorChange,
} from '@/components/roast/TargetRoleSelector';
import RoastPage from '@/app/roast/page';
import { SAMPLE_JDS } from '@/lib/data/sample-jds';
import { maskPii } from '@/lib/utils/pii-masker';

describe('Adversarial Challenger M2: Client-Side PII Sanitization & Technical Preservation', () => {
  let onChangeMock: (value: TargetRoleSelectorChange) => void;

  beforeEach(() => {
    vi.restoreAllMocks();
    onChangeMock = vi.fn();
  });

  describe('Adversarial JD Input Sanitization in TargetRoleSelector', () => {
    const rawAdversarialJd = `
      CÔNG TY CÔNG NGHỆ TECHCORP VIỆT NAM
      VỊ TRÍ: KỸ SƯ FULLSTACK (React 19, Docker, 100.000 users)

      THÔNG TIN LIÊN HỆ TUYỂN DỤNG:
      - Email nhà tuyển dụng: hr@company.vn
      - Hotline HR: 0912345678
      - Số điện thoại quốc tế HR: +84988776655
      - Người đại diện pháp lý (CCCD): 001202012345
      - Hồ sơ ứng tuyển qua LinkedIn: https://linkedin.com/in/recruiter-lead
      - Repo dự án mẫu: github.com/techcorp-official/starter-kit
      - Website nộp đơn: https://company.vn/careers/apply?job=12345

      YÊU CẦU KỸ THUẬT & CHỈ SỐ HỆ THỐNG:
      - Thành thạo React 19 và Next.js 15 App Router.
      - Thành thạo Docker và Kubernetes containerization.
      - Kinh nghiệm tối ưu hóa hệ thống phục vụ 100.000 users đồng thời.
      - Độ trễ phản hồi API mục tiêu dưới 500ms.
      - Mức lương dự kiến: 25.000.000 VNĐ - 40.000.000 VNĐ.
      - Cam kết uptime hệ thống đạt 99.9% SLA.
    `.trim();

    it('redacts recruiter email, phone numbers (+84 and 09x), CCCD, and personal URLs in onChange', () => {
      render(React.createElement(TargetRoleSelector, { mode: 'custom', onChange: onChangeMock }));

      const textarea = screen.getByPlaceholderText(/dán toàn bộ nội dung job description/i);
      fireEvent.change(textarea, { target: { value: rawAdversarialJd } });

      expect(onChangeMock).toHaveBeenCalled();
      const lastCall = (onChangeMock as any).mock.calls.at(-1)[0];
      const sanitized = lastCall.jdText;

      // 1. Recruiter email redacted
      expect(sanitized).not.toContain('hr@company.vn');
      expect(sanitized).toContain('[EMAIL_REDACTED]');

      // 2. Domestic phone (0912345678) redacted
      expect(sanitized).not.toContain('0912345678');
      expect(sanitized).toContain('[PHONE_REDACTED]');

      // 3. International phone (+84988776655) redacted
      expect(sanitized).not.toContain('+84988776655');
      expect(sanitized).toContain('[PHONE_REDACTED]');

      // 4. 12-digit CCCD (001202012345) redacted
      expect(sanitized).not.toContain('001202012345');
      expect(sanitized).toContain('[ID_REDACTED]');

      // 5. Personal / portfolio / career URLs redacted
      expect(sanitized).not.toContain('https://linkedin.com/in/recruiter-lead');
      expect(sanitized).not.toContain('github.com/techcorp-official/starter-kit');
      expect(sanitized).not.toContain('https://company.vn/careers/apply?job=12345');
      expect(sanitized).toContain('[URL_REDACTED]');
    });

    it('100% PRESERVES technical requirements and system metrics without false redactions', () => {
      render(React.createElement(TargetRoleSelector, { mode: 'custom', onChange: onChangeMock }));

      const textarea = screen.getByPlaceholderText(/dán toàn bộ nội dung job description/i);
      fireEvent.change(textarea, { target: { value: rawAdversarialJd } });

      const lastCall = (onChangeMock as any).mock.calls.at(-1)[0];
      const sanitized = lastCall.jdText;

      // React 19 preserved
      expect(sanitized).toContain('React 19');
      // Docker preserved
      expect(sanitized).toContain('Docker');
      // 100.000 users preserved
      expect(sanitized).toContain('100.000 users');
      // Next.js 15 preserved
      expect(sanitized).toContain('Next.js 15');
      // Kubernetes preserved
      expect(sanitized).toContain('Kubernetes');
      // 500ms preserved
      expect(sanitized).toContain('500ms');
      // 25.000.000 VNĐ and 40.000.000 VNĐ preserved
      expect(sanitized).toContain('25.000.000 VNĐ');
      expect(sanitized).toContain('40.000.000 VNĐ');
      // 99.9% SLA preserved
      expect(sanitized).toContain('99.9% SLA');
    });

    it('accurately counts PII entities in the detection badge and applies 1-click masking', async () => {
      const user = userEvent.setup();
      render(React.createElement(TargetRoleSelector, { mode: 'custom', onChange: onChangeMock }));

      const textarea = screen.getByPlaceholderText(/dán toàn bộ nội dung job description/i) as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: rawAdversarialJd } });

      // Badge must detect: 1 email + 2 phones + 1 CCCD + 3 URLs = 7 PII items
      const piiBadge = await screen.findByRole('button', { name: /đã phát hiện 7 thông tin pii/i });
      expect(piiBadge).toBeInTheDocument();

      // Click to apply mask directly into textarea
      await user.click(piiBadge);

      expect(textarea.value).toContain('[EMAIL_REDACTED]');
      expect(textarea.value).toContain('[PHONE_REDACTED]');
      expect(textarea.value).toContain('[ID_REDACTED]');
      expect(textarea.value).toContain('[URL_REDACTED]');
      expect(textarea.value).not.toContain('hr@company.vn');
      expect(textarea.value).not.toContain('0912345678');
      expect(textarea.value).not.toContain('+84988776655');
      expect(textarea.value).not.toContain('001202012345');
    });
  });

  describe('End-to-End Payload Transmission from app/roast/page.tsx', () => {
    it('verifies that the fetch payload sent to /api/roast has PII fully masked and technical metrics preserved', async () => {
      const user = userEvent.setup();

      let capturedPayload: any = null;
      const fetchMock = vi.fn().mockImplementation((url: string, options: any) => {
        if (url.includes('/api/roast')) {
          capturedPayload = JSON.parse(options.body);
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              success: true,
              data: {
                overallScore: 85,
                tone: 'spicy',
                summaryVerdict: 'Bản phân tích thử nghiệm thành công.',
                topStrengths: ['Kỹ năng React tốt'],
                weaknesses: [
                  {
                    quote: 'Dự án demo',
                    issue: 'Thiếu số liệu',
                    severity: 'Cao',
                    rejectionReason: 'Thiếu bằng chứng',
                    fixGuideline: 'Bổ sung [X%] số liệu thực tế.',
                  },
                ],
                atsRecommendations: [
                  { category: 'Từ khóa', recommendation: 'Thêm Docker', impact: 'Quan trọng' },
                ],
                disclaimer: 'Bản thử nghiệm.',
              },
            }),
          });
        }
        return Promise.reject(new Error(`Unhandled URL: ${url}`));
      });
      global.fetch = fetchMock;

      render(React.createElement(RoastPage));

      // 1. Switch to Custom JD Tab in TargetRoleSelector
      const customJdTab = screen.getByRole('tab', { name: /dán toàn bộ jd/i });
      await user.click(customJdTab);

      // 2. Input JD with PII and technical specs
      const jdTextarea = screen.getByPlaceholderText(/dán toàn bộ nội dung job description/i);
      const jdWithPii = `
        Tuyển dụng Senior Frontend (React 19, Docker, 100.000 users).
        Gửi CV về hr@company.vn hoặc hotline 0912345678 (+84988776655).
        CCCD phụ trách: 001202012345.
        Portfolio: https://linkedin.com/in/recruiter-profile
      `;
      fireEvent.change(jdTextarea, { target: { value: jdWithPii } });

      // 3. Switch to CV text paste tab in FileUploader
      const cvTab = screen.getByRole('tab', { name: /dán văn bản|nhập trực tiếp/i });
      await user.click(cvTab);

      // 4. Input CV text
      const cvTextarea = screen.getByRole('textbox', { name: /nội dung cv/i });
      const mockCv = `
        Nguyễn Văn B - Lập trình viên React 19 và Docker với kinh nghiệm phục vụ 100.000 users.
        Dự án quản lý microservices đạt hiệu năng 300ms latency.
      `.trim();
      await user.type(cvTextarea, mockCv);

      // 5. Submit Roast via FileUploader form
      const submitBtn = screen.getByRole('button', { name: /^bắt đầu roast cv$/i });
      fireEvent.click(submitBtn);

      // 6. Wait for /api/roast fetch to be called
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith('/api/roast', expect.anything());
      });

      expect(capturedPayload).not.toBeNull();

      // Check captured payload jdText
      const payloadJd = capturedPayload.jdText;
      expect(payloadJd).toBeDefined();

      // PII must be completely sanitized in network payload
      expect(payloadJd).not.toContain('hr@company.vn');
      expect(payloadJd).not.toContain('0912345678');
      expect(payloadJd).not.toContain('+84988776655');
      expect(payloadJd).not.toContain('001202012345');
      expect(payloadJd).not.toContain('https://linkedin.com/in/recruiter-profile');

      expect(payloadJd).toContain('[EMAIL_REDACTED]');
      expect(payloadJd).toContain('[PHONE_REDACTED]');
      expect(payloadJd).toContain('[ID_REDACTED]');
      expect(payloadJd).toContain('[URL_REDACTED]');

      // Technical criteria must be intact
      expect(payloadJd).toContain('React 19');
      expect(payloadJd).toContain('Docker');
      expect(payloadJd).toContain('100.000 users');
    });
  });

  describe('Curated Sample JDs Integrity Verification', () => {
    it('verifies all sample JDs from SAMPLE_JDS are clean of PII', () => {
      for (const sample of SAMPLE_JDS) {
        const maskResult = maskPii(sample.jdText);
        expect(maskResult.stats.emails, `Email found in sample ${sample.id}`).toBe(0);
        expect(maskResult.stats.phones, `Phone found in sample ${sample.id}`).toBe(0);
        expect(maskResult.stats.ids, `ID found in sample ${sample.id}`).toBe(0);
        expect(maskResult.stats.urls, `URL found in sample ${sample.id}`).toBe(0);
        expect(maskResult.sanitizedText).toBe(sample.jdText);
      }
    });
  });

  describe('sanitizeJdText Helper Direct Stress Tests', () => {
    it('handles null, undefined, empty, and whitespace strings gracefully', () => {
      expect(sanitizeJdText('')).toBe('');
      expect(sanitizeJdText('   ')).toBe('   ');
      expect(sanitizeJdText(null as any)).toBe('');
      expect(sanitizeJdText(undefined as any)).toBe('');
    });

    it('sanitizes multiple occurrences of PII within tight sentence boundaries', () => {
      const denseInput = 'Hotline: 0912345678, 0987654321, email: hr@corp.vn, support@corp.vn';
      const output = sanitizeJdText(denseInput);

      expect(output).toBe('Hotline: [PHONE_REDACTED], [PHONE_REDACTED], email: [EMAIL_REDACTED], [EMAIL_REDACTED]');
      expect(output).not.toContain('0912345678');
      expect(output).not.toContain('0987654321');
      expect(output).not.toContain('hr@corp.vn');
      expect(output).not.toContain('support@corp.vn');
    });

    it('correctly handles Vietnamese CCCDs with various prefix variations', () => {
      const input = 'Số CCCD: 001202012345, Căn cước công dân: 079201012345, CMND cũ: 012345678';
      const output = sanitizeJdText(input);

      expect(output).toContain('[ID_REDACTED]');
      expect(output).not.toContain('001202012345');
      expect(output).not.toContain('079201012345');
      expect(output).not.toContain('012345678');
    });
  });
});
