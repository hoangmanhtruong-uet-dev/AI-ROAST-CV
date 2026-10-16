import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  getTrialUsage,
  recordTrialUsage,
  resetTrialUsage,
  FREE_LIMITS,
  TRIAL_REWRITE_KEY,
  LEGACY_REWRITE_KEY,
  TRIAL_CUSTOM_JD_KEY,
  CUSTOM_JD_DRAFT_KEY,
  ATS_REWRITES_CACHE_KEY,
} from '@/lib/payment/trial';
import { PRO_STORAGE_KEY } from '@/lib/payment/entitlement';
import { RoastReport } from '@/components/roast/RoastReport';
import InterviewPage from '@/app/interview/page';
import { RoastData } from '@/lib/schemas/roast';
import { JOB_MATCH_FIT_CRITERION_NAME } from '@/lib/schemas/interview';

describe('Milestone 9: Pro Entitlement & Usage Limits (lib/payment/trial.ts)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('1. Free Limits Specification & Defaults', () => {
    it('defines exact free usage quotas as specified in ORIGINAL_REQUEST §Follow-up R3', () => {
      expect(FREE_LIMITS.MAX_REWRITES).toBe(1);
      expect(FREE_LIMITS.MAX_CUSTOM_JD).toBe(1);
    });

    it('returns 0 counts and enabled trial flags on clean state for free users', () => {
      const usage = getTrialUsage(false);

      expect(usage.rewriteCount).toBe(0);
      expect(usage.customJdCount).toBe(0);
      expect(usage.maxFreeRewrites).toBe(1);
      expect(usage.maxFreeCustomJd).toBe(1);
      expect(usage.canRewrite).toBe(true);
      expect(usage.canCustomJd).toBe(true);
    });

    it('falls back to localStorage Pro status if isPro argument is omitted', () => {
      // Free user by default
      expect(getTrialUsage().canRewrite).toBe(true);
      expect(getTrialUsage().canCustomJd).toBe(true);

      // Pro user via localStorage
      localStorage.setItem(PRO_STORAGE_KEY, 'true');
      expect(getTrialUsage().canRewrite).toBe(true);
      expect(getTrialUsage().canCustomJd).toBe(true);
    });
  });

  describe('2. ATS CV Rewrite Limit Enforcement', () => {
    it('permits exactly 1 free trial rewrite, then blocks subsequent rewrites', () => {
      // 0 used: allowed
      expect(getTrialUsage(false).canRewrite).toBe(true);

      // Record 1 trial rewrite
      recordTrialUsage('rewrite');

      const usageAfterOne = getTrialUsage(false);
      expect(usageAfterOne.rewriteCount).toBe(1);
      expect(usageAfterOne.canRewrite).toBe(false);

      // Record 2nd attempt
      recordTrialUsage('rewrite');
      const usageAfterTwo = getTrialUsage(false);
      expect(usageAfterTwo.rewriteCount).toBe(2);
      expect(usageAfterTwo.canRewrite).toBe(false);
    });

    it('synchronizes both new trial key and legacy rewrite key for backward compatibility', () => {
      recordTrialUsage('rewrite');

      expect(localStorage.getItem(TRIAL_REWRITE_KEY)).toBe('1');
      expect(localStorage.getItem(LEGACY_REWRITE_KEY)).toBe('1');

      recordTrialUsage('rewrite');
      expect(localStorage.getItem(TRIAL_REWRITE_KEY)).toBe('2');
      expect(localStorage.getItem(LEGACY_REWRITE_KEY)).toBe('2');
    });

    it('reads rewrite count correctly if only legacy key exists in localStorage', () => {
      localStorage.setItem(LEGACY_REWRITE_KEY, '1');

      const usage = getTrialUsage(false);
      expect(usage.rewriteCount).toBe(1);
      expect(usage.canRewrite).toBe(false);
    });
  });

  describe('3. Custom JD Stress Interview Question Limit Enforcement', () => {
    it('permits Question 1 trial, then blocks subsequent questions for free users', () => {
      // 0 used: allowed
      expect(getTrialUsage(false).canCustomJd).toBe(true);

      // Record 1 custom JD question trial
      recordTrialUsage('customJd');

      const usageAfterOne = getTrialUsage(false);
      expect(usageAfterOne.customJdCount).toBe(1);
      expect(usageAfterOne.canCustomJd).toBe(false);

      // Record further custom JD questions
      recordTrialUsage('customJd');
      const usageAfterTwo = getTrialUsage(false);
      expect(usageAfterTwo.customJdCount).toBe(2);
      expect(usageAfterTwo.canCustomJd).toBe(false);
    });

    it('writes to TRIAL_CUSTOM_JD_KEY in localStorage', () => {
      recordTrialUsage('customJd');
      expect(localStorage.getItem(TRIAL_CUSTOM_JD_KEY)).toBe('1');
    });
  });

  describe('4. Pro Tier Unlimited Access', () => {
    it('allows unlimited rewrites and custom JD questions for Pro users regardless of counters', () => {
      // Set high usage counters
      localStorage.setItem(TRIAL_REWRITE_KEY, '99');
      localStorage.setItem(LEGACY_REWRITE_KEY, '99');
      localStorage.setItem(TRIAL_CUSTOM_JD_KEY, '99');

      // Free check fails
      const freeUsage = getTrialUsage(false);
      expect(freeUsage.canRewrite).toBe(false);
      expect(freeUsage.canCustomJd).toBe(false);

      // Pro check succeeds
      const proUsage = getTrialUsage(true);
      expect(proUsage.rewriteCount).toBe(99);
      expect(proUsage.customJdCount).toBe(99);
      expect(proUsage.canRewrite).toBe(true);
      expect(proUsage.canCustomJd).toBe(true);
    });

    it('detects Pro status from LocalStorage automatically when isPro parameter is undefined', () => {
      localStorage.setItem(TRIAL_REWRITE_KEY, '5');
      localStorage.setItem(TRIAL_CUSTOM_JD_KEY, '5');
      localStorage.setItem(PRO_STORAGE_KEY, 'true');

      const usage = getTrialUsage();
      expect(usage.canRewrite).toBe(true);
      expect(usage.canCustomJd).toBe(true);
    });
  });

  describe('5. Reset Trial Usage', () => {
    it('removes all trial and draft keys when resetTrialUsage() is called', () => {
      localStorage.setItem(TRIAL_REWRITE_KEY, '2');
      localStorage.setItem(LEGACY_REWRITE_KEY, '2');
      localStorage.setItem(TRIAL_CUSTOM_JD_KEY, '3');
      localStorage.setItem(CUSTOM_JD_DRAFT_KEY, 'Draft JD text...');
      localStorage.setItem(ATS_REWRITES_CACHE_KEY, 'Cached rewrites...');

      resetTrialUsage();

      expect(localStorage.getItem(TRIAL_REWRITE_KEY)).toBeNull();
      expect(localStorage.getItem(LEGACY_REWRITE_KEY)).toBeNull();
      expect(localStorage.getItem(TRIAL_CUSTOM_JD_KEY)).toBeNull();
      expect(localStorage.getItem(CUSTOM_JD_DRAFT_KEY)).toBeNull();
      expect(localStorage.getItem(ATS_REWRITES_CACHE_KEY)).toBeNull();

      const freshUsage = getTrialUsage(false);
      expect(freshUsage.rewriteCount).toBe(0);
      expect(freshUsage.customJdCount).toBe(0);
      expect(freshUsage.canRewrite).toBe(true);
      expect(freshUsage.canCustomJd).toBe(true);
    });
  });

  describe('6. Corruption & Edge Case Resilience', () => {
    it('handles non-numeric or corrupted values in LocalStorage gracefully without throwing', () => {
      localStorage.setItem(TRIAL_REWRITE_KEY, 'corrupted_string');
      localStorage.setItem(TRIAL_CUSTOM_JD_KEY, 'invalid_number');

      const usage = getTrialUsage(false);
      expect(usage.rewriteCount).toBe(0);
      expect(usage.customJdCount).toBe(0);
      expect(usage.canRewrite).toBe(true);
      expect(usage.canCustomJd).toBe(true);
    });

    it('handles negative stored numbers by clamping to 0', () => {
      localStorage.setItem(TRIAL_REWRITE_KEY, '-5');
      localStorage.setItem(TRIAL_CUSTOM_JD_KEY, '-10');

      const usage = getTrialUsage(false);
      expect(usage.rewriteCount).toBe(0);
      expect(usage.customJdCount).toBe(0);
    });

    it('fails safely and open when localStorage access throws (security sandbox)', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError: The operation is insecure.');
      });

      const usage = getTrialUsage(false);
      expect(usage.rewriteCount).toBe(0);
      expect(usage.customJdCount).toBe(0);
      expect(usage.canRewrite).toBe(true);
      expect(usage.canCustomJd).toBe(true);
    });

    it('handles recordTrialUsage when localStorage.setItem throws without unhandled crash', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      expect(() => recordTrialUsage('rewrite')).not.toThrow();
      expect(() => recordTrialUsage('customJd')).not.toThrow();
    });
  });

  describe('7. RoastReport Component Trial Limit UI Integration', () => {
    const mockRoastData: RoastData = {
      overallScore: 68,
      tone: 'spicy',
      summaryVerdict: 'CV thiếu dữ liệu thực tế.',
      topStrengths: ['Có kỹ năng React'],
      weaknesses: [
        {
          quote: 'Tham gia xây dựng giao diện người dùng',
          issue: 'Mô tả chung chung thiếu kết quả',
          severity: 'Cao',
          rejectionReason: 'Không chứng minh được năng lực',
          fixGuideline: 'Tối ưu hóa [số lượng] màn hình UI tăng [số]% trải nghiệm',
        },
        {
          quote: 'Hỗ trợ test tính năng thanh toán',
          issue: 'Động từ bị động',
          severity: 'Trung bình',
          rejectionReason: 'Thiếu tính chủ động',
          fixGuideline: 'Chủ trì kiểm thử tự động [số lượng] luồng thanh toán',
        },
      ],
      atsRecommendations: [],
      disclaimer: 'Mang tính tham khảo.',
    };

    it('allows 1 trial rewrite for free users, then opens CheckoutModal on 2nd attempt', async () => {
      const user = userEvent.setup();

      vi.stubGlobal(
        'fetch',
        vi.fn((url: string) => {
          if (url === '/api/rewrite') {
            return Promise.resolve({
              ok: true,
              json: () =>
                Promise.resolve({
                  success: true,
                  data: {
                    originalQuote: 'Tham gia xây dựng giao diện người dùng',
                    rewrittenText: 'Phát triển [3] mô-đun giao diện chuẩn ATS',
                    actionVerb: 'Phát triển',
                    context: 'Giao diện',
                    result: 'Chuẩn ATS',
                    explanation: 'Dùng Action Verb mạnh',
                    atsKeywords: ['React', 'TypeScript'],
                  },
                }),
            });
          }
          if (url === '/api/payment/create') {
            return Promise.resolve({
              ok: true,
              json: () =>
                Promise.resolve({
                  success: true,
                  order: {
                    orderId: 'RCV-TEST-ORDER',
                    amount: 29000,
                    expiresAt: Date.now() + 900000,
                    qrUrl: 'https://img.vietqr.io/image/test.png',
                    bankInfo: {
                      bankName: 'MB Bank',
                      accountNo: '0987654321',
                      accountName: 'AI ROAST CV',
                    },
                  },
                }),
            });
          }
          return Promise.reject(new Error(`Unhandled URL: ${url}`));
        })
      );

      render(
        React.createElement(RoastReport, {
          data: mockRoastData,
          cvText: 'CV content...',
          onReset: vi.fn(),
          onChangeTone: vi.fn(),
          onEditCv: vi.fn(),
        })
      );

      const rewriteButtons = screen.getAllByRole('button', {
        name: /tối ưu hóa theo chuẩn ats/i,
      });

      // 1st rewrite -> allowed
      await user.click(rewriteButtons[0]);
      await waitFor(() => {
        expect(screen.getByText(/action verb: phát triển/i)).toBeInTheDocument();
      });

      // Usage counter is incremented
      expect(getTrialUsage(false).rewriteCount).toBe(1);
      expect(getTrialUsage(false).canRewrite).toBe(false);

      // 2nd rewrite -> blocked, CheckoutModal is opened
      await user.click(rewriteButtons[1]);
      await waitFor(() => {
        expect(screen.getByText(/nâng cấp gói pro/i)).toBeInTheDocument();
      });
    });

    it('allows unlimited rewrites for Pro users without triggering CheckoutModal', async () => {
      const user = userEvent.setup();
      localStorage.setItem(PRO_STORAGE_KEY, 'true');

      vi.stubGlobal(
        'fetch',
        vi.fn((url: string) => {
          if (url === '/api/rewrite') {
            return Promise.resolve({
              ok: true,
              json: () =>
                Promise.resolve({
                  success: true,
                  data: {
                    originalQuote: 'Test quote',
                    rewrittenText: 'Chủ trì thiết kế kiến trúc [2] dịch vụ',
                    actionVerb: 'Chủ trì',
                    context: 'Kiến trúc',
                    result: '2 dịch vụ',
                    explanation: 'Giải thích',
                    atsKeywords: ['Microservices'],
                  },
                }),
            });
          }
          return Promise.reject(new Error(`Unhandled URL: ${url}`));
        })
      );

      render(
        React.createElement(RoastReport, {
          data: mockRoastData,
          cvText: 'CV content...',
          onReset: vi.fn(),
          onChangeTone: vi.fn(),
          onEditCv: vi.fn(),
        })
      );

      const rewriteButtons = screen.getAllByRole('button', {
        name: /tối ưu hóa theo chuẩn ats/i,
      });

      // 1st rewrite
      await user.click(rewriteButtons[0]);
      await waitFor(() => {
        expect(screen.getByText(/action verb: chủ trì/i)).toBeInTheDocument();
      });

      // 2nd rewrite for Pro user -> directly triggers rewrite, no checkout modal
      await user.click(rewriteButtons[1]);
      expect(screen.queryByText(/nâng cấp gói pro/i)).not.toBeInTheDocument();
    });
  });

  describe('8. Custom JD Interview Trial Limit UI Integration', () => {
    const mockCustomQuestions = [
      {
        questionId: 'custom-q1-entitlement',
        role: 'custom' as const,
        questionIndex: 1 as const,
        title: 'Q1: Xử lý nghẽn mạng thanh toán (90s)',
        scenario: 'Scenario Q1 details...',
        pressureContext: 'PM yêu cầu gấp...',
        timeLimitSeconds: 90,
      },
      {
        questionId: 'custom-q2-entitlement',
        role: 'custom' as const,
        questionIndex: 2 as const,
        title: 'Q2: Khủng hoảng văn hóa nhóm (75s)',
        scenario: 'Scenario Q2 details...',
        pressureContext: 'Review thử việc...',
        timeLimitSeconds: 75,
      },
      {
        questionId: 'custom-q3-entitlement',
        role: 'custom' as const,
        questionIndex: 3 as const,
        title: 'Q3: Xung đột đạo đức dữ liệu (60s)',
        scenario: 'Scenario Q3 details...',
        pressureContext: 'Rủi ro pháp lý...',
        timeLimitSeconds: 60,
      },
    ];

    const mockEvaluationData = {
      questionIndex: 1,
      rubricScores: [
        { name: 'Cấu trúc STAR & Mạch lạc', score: 8, feedback: 'Mạch lạc tốt' },
        { name: 'Tính cụ thể & Dẫn chứng', score: 8, feedback: 'Dẫn chứng tốt' },
        { name: 'Mức độ liên quan & Đúng trọng tâm', score: 8, feedback: 'Trọng tâm' },
        { name: 'Nhận thức hệ quả & Tư duy xử lý', score: 8, feedback: 'Tư duy tốt' },
        { name: JOB_MATCH_FIT_CRITERION_NAME, score: 9, feedback: 'Khớp JD hoàn hảo' },
      ],
      averageScore: 8.2,
      strengths: ['Tư duy kỹ thuật tốt'],
      improvements: ['Cần kế hoạch dự phòng'],
      followUpQuestion: 'Follow up question...',
      simulatedPressureVerdict: 'Thể hiện vững vàng.',
    };

    it('advancing to Question 2 in Custom JD mode displays CheckoutModal / upgrade prompt for free users', async () => {
      const user = userEvent.setup();

      vi.stubGlobal(
        'fetch',
        vi.fn((url: string) => {
          if (url === '/api/interview/jd-questions') {
            return Promise.resolve({
              ok: true,
              json: () =>
                Promise.resolve({
                  success: true,
                  data: {
                    jobTitle: 'Frontend Engineer',
                    companyOrIndustry: 'FinTech',
                    extractedSkills: ['React', 'TypeScript'],
                    extractedCulture: ['Agile'],
                    questions: mockCustomQuestions,
                  },
                }),
            });
          }
          if (url === '/api/interview/evaluate') {
            return Promise.resolve({
              ok: true,
              json: () =>
                Promise.resolve({
                  success: true,
                  data: mockEvaluationData,
                }),
            });
          }
          if (url === '/api/payment/create') {
            return Promise.resolve({
              ok: true,
              json: () =>
                Promise.resolve({
                  success: true,
                  order: {
                    orderId: 'RCV-PAY-JD',
                    amount: 29000,
                    expiresAt: Date.now() + 900000,
                    qrUrl: 'https://img.vietqr.io/image/test.png',
                    bankInfo: { bankName: 'MB', accountNo: '123', accountName: 'TEST' },
                  },
                }),
            });
          }
          return Promise.reject(new Error(`Unhandled URL: ${url}`));
        })
      );

      render(React.createElement(InterviewPage));

      // 1. Select Custom JD tab
      await user.click(screen.getByRole('tab', { name: /Nhập JD tùy biến/i }));

      // 2. Select sample JD
      await user.click(screen.getByRole('button', { name: /Frontend React/i }));

      // 3. Start interview -> Question 1
      await user.click(
        screen.getByRole('button', { name: /Phân tích JD & Bắt đầu phỏng vấn/i })
      );

      // Verify Question 1 is shown
      await waitFor(() => {
        expect(
          screen.getByText('Q1: Xử lý nghẽn mạng thanh toán (90s)')
        ).toBeInTheDocument();
      });

      // 4. Answer Question 1
      const answerInput = screen.getByPlaceholderText(/Nhập câu trả lời theo mô hình STAR/i);
      await user.type(answerInput, 'Tôi ngay lập tức tách luồng async và ghi log kiểm toán.');
      await user.click(screen.getByRole('button', { name: /Gửi câu trả lời/i }));

      // Verify Rubric is shown
      await waitFor(() => {
        expect(screen.getByText(JOB_MATCH_FIT_CRITERION_NAME)).toBeInTheDocument();
      });

      // Usage counter was recorded
      expect(getTrialUsage(false).customJdCount).toBe(1);
      expect(getTrialUsage(false).canCustomJd).toBe(false);

      // 5. Advance to Question 2 -> displays CheckoutModal / upgrade prompt
      const nextBtn = screen.getByRole('button', {
        name: /Tiếp tục câu hỏi tiếp theo/i,
      });
      await user.click(nextBtn);

      // CheckoutModal is displayed
      await waitFor(() => {
        expect(screen.getByText(/nâng cấp gói pro/i)).toBeInTheDocument();
      });
    });

    it('allows Pro users to advance through all questions without CheckoutModal opening', async () => {
      const user = userEvent.setup();
      localStorage.setItem(PRO_STORAGE_KEY, 'true');

      vi.stubGlobal(
        'fetch',
        vi.fn((url: string) => {
          if (url === '/api/interview/jd-questions') {
            return Promise.resolve({
              ok: true,
              json: () =>
                Promise.resolve({
                  success: true,
                  data: {
                    jobTitle: 'Frontend Engineer',
                    companyOrIndustry: 'FinTech',
                    extractedSkills: ['React'],
                    extractedCulture: ['Agile'],
                    questions: mockCustomQuestions,
                  },
                }),
            });
          }
          if (url === '/api/interview/evaluate') {
            return Promise.resolve({
              ok: true,
              json: () =>
                Promise.resolve({
                  success: true,
                  data: mockEvaluationData,
                }),
            });
          }
          return Promise.reject(new Error(`Unhandled URL: ${url}`));
        })
      );

      render(React.createElement(InterviewPage));

      await user.click(screen.getByRole('tab', { name: /Nhập JD tùy biến/i }));
      await user.click(screen.getByRole('button', { name: /Frontend React/i }));
      await user.click(
        screen.getByRole('button', { name: /Phân tích JD & Bắt đầu phỏng vấn/i })
      );

      await waitFor(() => {
        expect(
          screen.getByText('Q1: Xử lý nghẽn mạng thanh toán (90s)')
        ).toBeInTheDocument();
      });

      const answerInput = screen.getByPlaceholderText(/Nhập câu trả lời theo mô hình STAR/i);
      await user.type(answerInput, 'Tôi cấu hình retry policy.');
      await user.click(screen.getByRole('button', { name: /Gửi câu trả lời/i }));

      await waitFor(() => {
        expect(screen.getByText(JOB_MATCH_FIT_CRITERION_NAME)).toBeInTheDocument();
      });

      // Advance to Q2 as Pro user
      const nextBtn = screen.getByRole('button', {
        name: /Tiếp tục câu hỏi tiếp theo/i,
      });
      await user.click(nextBtn);

      // Question 2 is directly displayed without checkout modal
      await waitFor(() => {
        expect(
          screen.getByText('Q2: Khủng hoảng văn hóa nhóm (75s)')
        ).toBeInTheDocument();
      });

      expect(screen.queryByText(/nâng cấp gói pro/i)).not.toBeInTheDocument();
    });
  });
});
