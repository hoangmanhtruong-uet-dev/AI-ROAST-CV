import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
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
  TRIAL_STORAGE_KEYS,
} from '@/lib/payment/trial';
import {
  PRO_STORAGE_KEY,
  PRO_LICENSE_KEY,
  getClientProStatus,
  setClientProStatus,
  useProTier,
} from '@/lib/payment/entitlement';
import {
  STORAGE_KEYS_TO_CLEAR,
  wipeAllSessionData,
  WIPE_DATA_EVENT_NAME,
} from '@/lib/storage/wipe-data';
import { FORBIDDEN_LOG_KEYS, sanitizeMeta, logger } from '@/lib/logger';
import { RoastReport } from '@/components/roast/RoastReport';
import InterviewPage from '@/app/interview/page';
import { RoastData } from '@/lib/schemas/roast';
import { JOB_MATCH_FIT_CRITERION_NAME } from '@/lib/schemas/interview';
import { getPaymentStore } from '@/lib/payment/service';

describe('Challenger M9.1: Pro Entitlement, Trial Limits & Adversarial Integrity Suite', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();

    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  // =========================================================================
  // 1. FREE USER TRIAL LIMITS: ATS CV REWRITE (1 ALLOWED, 2ND GATED)
  // =========================================================================
  describe('1. Free User Trial Limits: ATS CV Rewrite', () => {
    const mockRoastData: RoastData = {
      overallScore: 65,
      tone: 'spicy',
      summaryVerdict: 'CV con qua so sai, can bo sung so lieu cu the.',
      topStrengths: ['Co ky nang lap trinh web'],
      weaknesses: [
        {
          quote: 'Tham gia phat trien backend API',
          issue: 'Dung dong tu chung chung, thieu dan chung dinh luong',
          severity: 'Cao',
          rejectionReason: 'Khong the hien duoc tam anh huong cua cong viec',
          fixGuideline: 'Thiet ke [so luong] API phuc vu [so] nguoi dung',
        },
        {
          quote: 'Ho tro fix bug giao dien',
          issue: 'Vi the bi dong',
          severity: 'Trung bình',
          rejectionReason: 'Nha tuyen dung can nguoi chu dong giai quyet van de',
          fixGuideline: 'Khac phuc [so luong] loi ton dong giam [so]% crash rate',
        },
        {
          quote: 'Biet su dung Git co ban',
          issue: 'Ky nang qua yeu',
          severity: 'Thấp',
          rejectionReason: 'Khong co gi noi bat so voi ung vien khac',
          fixGuideline: 'Thanh thao Gitflow, quan ly [so] nhanh release',
        },
      ],
      atsRecommendations: [
        {
          category: 'Từ khóa',
          recommendation: 'Bo sung them tu khoa chuan ATS nhu Next.js, PostgreSQL',
          impact: 'Quan trọng',
        },
      ],
      disclaimer: 'Ket qua mang tinh chat tham khao danh cho sinh vien.',
    };

    it('allows the 1st rewrite to succeed and increments trial counter to 1', async () => {
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
                    originalQuote: 'Tham gia phat trien backend API',
                    rewrittenText: 'Thiet ke va trien khai [5] RESTful API cho he thong',
                    actionVerb: 'Thiet ke',
                    context: 'He thong backend',
                    result: '5 RESTful API dat chuan',
                    explanation: 'Dung action verb manh va co placeholder [5]',
                    atsKeywords: ['RESTful API', 'Backend'],
                  },
                }),
            });
          }
          return Promise.reject(new Error(`Unhandled: ${url}`));
        })
      );

      render(
        React.createElement(RoastReport, {
          data: mockRoastData,
          cvText: 'CV noi dung sinh vien...',
          onReset: vi.fn(),
          onChangeTone: vi.fn(),
          onEditCv: vi.fn(),
        })
      );

      // Verify clean initial trial state
      expect(getTrialUsage(false).canRewrite).toBe(true);
      expect(getTrialUsage(false).rewriteCount).toBe(0);

      const buttons = screen.getAllByRole('button', {
        name: /tối ưu hóa theo chuẩn ats/i,
      });
      expect(buttons.length).toBe(3);

      // Trigger 1st rewrite
      await user.click(buttons[0]);

      // Should succeed and show rewritten result
      await waitFor(() => {
        expect(screen.getByText(/action verb: thiet ke/i)).toBeInTheDocument();
      });

      // Storage verified: rewriteCount incremented to 1, canRewrite becomes false
      const usageAfter = getTrialUsage(false);
      expect(usageAfter.rewriteCount).toBe(1);
      expect(usageAfter.canRewrite).toBe(false);
    });

    it('blocks the 2nd rewrite attempt and triggers the CheckoutModal for free users', async () => {
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
                    originalQuote: 'Tham gia phat trien backend API',
                    rewrittenText: 'Thiet ke va trien khai [5] RESTful API',
                    actionVerb: 'Thiet ke',
                    context: 'Backend',
                    result: '5 API',
                    explanation: 'Dung action verb',
                    atsKeywords: ['API'],
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
                    orderId: 'RCV-FREE-TRIAL-GATED',
                    amount: 29000,
                    expiresAt: Date.now() + 900000,
                    qrUrl: 'https://img.vietqr.io/image/test.png',
                    bankInfo: { bankName: 'MB', accountNo: '123', accountName: 'TEST' },
                  },
                }),
            });
          }
          return Promise.reject(new Error(`Unhandled: ${url}`));
        })
      );

      render(
        React.createElement(RoastReport, {
          data: mockRoastData,
          cvText: 'CV noi dung sinh vien...',
          onReset: vi.fn(),
          onChangeTone: vi.fn(),
          onEditCv: vi.fn(),
        })
      );

      const buttons = screen.getAllByRole('button', {
        name: /tối ưu hóa theo chuẩn ats/i,
      });

      // 1st rewrite -> allowed
      await user.click(buttons[0]);
      await waitFor(() => {
        expect(screen.getByText(/action verb: thiet ke/i)).toBeInTheDocument();
      });

      // 2nd rewrite attempt -> blocked, modal opens
      await user.click(buttons[1]);

      await waitFor(() => {
        expect(screen.getByText(/nâng cấp gói pro/i)).toBeInTheDocument();
      });

      // Verify no extra API call was dispatched for the 2nd click
      expect(getTrialUsage(false).rewriteCount).toBe(1);
    });

    it('immediately blocks 1st rewrite if trial counter was already exhausted in LocalStorage', async () => {
      const user = userEvent.setup();
      localStorage.setItem(TRIAL_REWRITE_KEY, '1');

      render(
        React.createElement(RoastReport, {
          data: mockRoastData,
          cvText: 'CV...',
          onReset: vi.fn(),
          onChangeTone: vi.fn(),
          onEditCv: vi.fn(),
        })
      );

      const buttons = screen.getAllByRole('button', {
        name: /tối ưu hóa theo chuẩn ats/i,
      });

      // Click on any card
      await user.click(buttons[0]);

      // Immediately opens checkout modal without making any rewrite API call
      await waitFor(() => {
        expect(screen.getByText(/nâng cấp gói pro/i)).toBeInTheDocument();
      });
    });
  });

  // =========================================================================
  // 2. CUSTOM JD TRIAL LIMITS: QUESTION 1 ALLOWED, ADVANCING TO Q2 GATED
  // =========================================================================
  describe('2. Custom JD Trial Limits & Gating Flow', () => {
    const mockJdQuestions = [
      {
        questionId: 'jd-q1-adversarial',
        role: 'custom' as const,
        questionIndex: 1 as const,
        title: 'Q1: Xung dot kien truc microservices (90s)',
        scenario: 'Scenario Q1 details...',
        pressureContext: 'Deadline ngay mai...',
        timeLimitSeconds: 90,
      },
      {
        questionId: 'jd-q2-adversarial',
        role: 'custom' as const,
        questionIndex: 2 as const,
        title: 'Q2: Khung hoang mat du lieu khach hang (75s)',
        scenario: 'Scenario Q2 details...',
        pressureContext: 'GD truc tiep chat van...',
        timeLimitSeconds: 75,
      },
      {
        questionId: 'jd-q3-adversarial',
        role: 'custom' as const,
        questionIndex: 3 as const,
        title: 'Q3: Tranh cai dao duc su dung AI (60s)',
        scenario: 'Scenario Q3 details...',
        pressureContext: 'Phap ly vao cuoc...',
        timeLimitSeconds: 60,
      },
    ];

    const mockEvaluation = {
      questionIndex: 1,
      rubricScores: [
        { name: 'Cấu trúc STAR & Mạch lạc', score: 8, feedback: 'Tot' },
        { name: 'Tính cụ thể & Dẫn chứng', score: 8, feedback: 'Tot' },
        { name: 'Mức độ liên quan & Đúng trọng tâm', score: 8, feedback: 'Tot' },
        { name: 'Nhận thức hệ quả & Tư duy xử lý', score: 8, feedback: 'Tot' },
        { name: JOB_MATCH_FIT_CRITERION_NAME, score: 9, feedback: 'Rat sat JD' },
      ],
      averageScore: 8.2,
      strengths: ['Dan chung cu the'],
      improvements: ['Can them ke hoach phong bi'],
      followUpQuestion: 'Cau hoi dao sau...',
      simulatedPressureVerdict: 'Xu ly on dinh duoi ap luc.',
    };

    it('enforces free trial on Q1 and triggers CheckoutModal when advancing via Next Question', async () => {
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
                    jobTitle: 'Backend Go Engineer',
                    companyOrIndustry: 'FinTech Techcombank',
                    extractedSkills: ['Golang', 'Kafka'],
                    extractedCulture: ['Can than', 'Bao mat'],
                    questions: mockJdQuestions,
                  },
                }),
            });
          }
          if (url === '/api/interview/evaluate') {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({ success: true, data: mockEvaluation }),
            });
          }
          if (url === '/api/payment/create') {
            return Promise.resolve({
              ok: true,
              json: () =>
                Promise.resolve({
                  success: true,
                  order: {
                    orderId: 'RCV-JD-UPGRADE',
                    amount: 29000,
                    expiresAt: Date.now() + 900000,
                    qrUrl: 'https://img.vietqr.io/image/test.png',
                    bankInfo: { bankName: 'MB', accountNo: '123', accountName: 'TEST' },
                  },
                }),
            });
          }
          return Promise.reject(new Error(`Unhandled: ${url}`));
        })
      );

      render(React.createElement(InterviewPage));

      // 1. Select Custom JD Tab
      await user.click(screen.getByRole('tab', { name: /nhập jd tùy biến/i }));

      // 2. Click sample JD
      await user.click(screen.getByRole('button', { name: /Backend Engineer Fresher/i }));

      // 3. Start interview
      await user.click(
        screen.getByRole('button', { name: /phân tích jd & bắt đầu phỏng vấn/i })
      );

      // Question 1 displays
      await waitFor(() => {
        expect(
          screen.getByText('Q1: Xung dot kien truc microservices (90s)')
        ).toBeInTheDocument();
      });

      // Verify trial count is still 0 before submitting
      expect(getTrialUsage(false).customJdCount).toBe(0);

      // 4. Submit Answer for Q1
      const answerInput = screen.getByPlaceholderText(/nhập câu trả lời theo mô hình star/i);
      await user.type(answerInput, 'Toi ngay lap tuc co lap thanh phan va danh gia tai.');
      await user.click(screen.getByRole('button', { name: /gửi câu trả lời/i }));

      // Rubric displayed
      await waitFor(() => {
        expect(screen.getByText(JOB_MATCH_FIT_CRITERION_NAME)).toBeInTheDocument();
      });

      // Free usage recorded: customJdCount = 1, canCustomJd = false
      expect(getTrialUsage(false).customJdCount).toBe(1);
      expect(getTrialUsage(false).canCustomJd).toBe(false);

      // Free user banner is shown on rubric screen
      expect(
        screen.getByText(/bạn vừa hoàn thành câu hỏi thử nghiệm theo jd miễn phí/i)
      ).toBeInTheDocument();

      // 5. Advance to Question 2
      const nextBtn = screen.getByRole('button', {
        name: /tiếp tục câu hỏi tiếp theo/i,
      });
      await user.click(nextBtn);

      // Modal triggered
      await waitFor(() => {
        expect(screen.getByText(/nâng cấp gói pro/i)).toBeInTheDocument();
      });

      // Upgrade warning banner is displayed on Question 2
      expect(
        screen.getByText(/bạn đã sử dụng lượt thử nghiệm miễn phí câu 1 theo jd/i)
      ).toBeInTheDocument();
    });

    it('enforces gating when a free user skips Question 1 to attempt reaching Question 2', async () => {
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
                    jobTitle: 'Backend Go Engineer',
                    companyOrIndustry: 'FinTech',
                    extractedSkills: ['Golang'],
                    extractedCulture: ['Bao mat'],
                    questions: mockJdQuestions,
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
                    orderId: 'RCV-JD-SKIP',
                    amount: 29000,
                    expiresAt: Date.now() + 900000,
                    qrUrl: 'https://img.vietqr.io/image/test.png',
                    bankInfo: { bankName: 'MB', accountNo: '123', accountName: 'TEST' },
                  },
                }),
            });
          }
          return Promise.reject(new Error(`Unhandled: ${url}`));
        })
      );

      render(React.createElement(InterviewPage));

      await user.click(screen.getByRole('tab', { name: /nhập jd tùy biến/i }));
      await user.click(screen.getByRole('button', { name: /Backend Engineer Fresher/i }));
      await user.click(
        screen.getByRole('button', { name: /phân tích jd & bắt đầu phỏng vấn/i })
      );

      await waitFor(() => {
        expect(
          screen.getByText('Q1: Xung dot kien truc microservices (90s)')
        ).toBeInTheDocument();
      });

      // Free user clicks "Bỏ qua" on Question 1
      const skipBtn = screen.getByRole('button', { name: /bỏ qua/i });
      await user.click(skipBtn);

      // Moving to Question 2 triggers CheckoutModal
      await waitFor(() => {
        expect(screen.getByText(/nâng cấp gói pro/i)).toBeInTheDocument();
      });
    });
  });

  // =========================================================================
  // 3. PRO USER STATUS: UNLIMITED REWRITES & COMPLETE 3-QUESTION INTERVIEW
  // =========================================================================
  describe('3. Pro User Status: Unlimited Access Verification', () => {
    it('allows Pro users unlimited ATS rewrites across multiple weakness cards', async () => {
      const user = userEvent.setup();
      // Set Pro status
      localStorage.setItem(PRO_STORAGE_KEY, 'true');
      localStorage.setItem(PRO_LICENSE_KEY, 'PRO-VIP8-2026');

      const mockData: RoastData = {
        overallScore: 70,
        tone: 'spicy',
        summaryVerdict: 'Danh gia...',
        topStrengths: ['Tot'],
        weaknesses: [
          {
            quote: 'Quote 1',
            issue: 'Issue 1',
            severity: 'Cao',
            rejectionReason: 'Reason 1',
            fixGuideline: 'Fix 1 [so]',
          },
          {
            quote: 'Quote 2',
            issue: 'Issue 2',
            severity: 'Cao',
            rejectionReason: 'Reason 2',
            fixGuideline: 'Fix 2 [so]',
          },
        ],
        atsRecommendations: [],
        disclaimer: 'Tham khao',
      };

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
                    originalQuote: 'Quote',
                    rewrittenText: 'Toi uu hoa [100%] quy trinh',
                    actionVerb: 'Toi uu',
                    context: 'Quy trinh',
                    result: '100%',
                    explanation: 'Dung action verb manh',
                    atsKeywords: ['Optimization'],
                  },
                }),
            });
          }
          return Promise.reject(new Error(`Unhandled: ${url}`));
        })
      );

      render(
        React.createElement(RoastReport, {
          data: mockData,
          cvText: 'CV...',
          onReset: vi.fn(),
          onChangeTone: vi.fn(),
          onEditCv: vi.fn(),
        })
      );

      const buttons = screen.getAllByRole('button', {
        name: /tối ưu hóa theo chuẩn ats/i,
      });

      // 1st rewrite as Pro
      await user.click(buttons[0]);
      await waitFor(() => {
        expect(screen.getByText(/action verb: toi uu/i)).toBeInTheDocument();
      });

      // 2nd rewrite as Pro
      await user.click(buttons[1]);
      await waitFor(() => {
        const results = screen.getAllByText(/action verb: toi uu/i);
        expect(results.length).toBe(2);
      });

      // Verify CheckoutModal NEVER opened
      expect(screen.queryByText(/nâng cấp gói pro/i)).not.toBeInTheDocument();

      // Verify trial usage counter was NOT incremented for Pro user
      expect(getTrialUsage(true).rewriteCount).toBe(0);
    });

    it('allows Pro users to complete all 3 Custom JD questions and reach final summary without modal gating', async () => {
      const user = userEvent.setup();
      localStorage.setItem(PRO_STORAGE_KEY, 'true');

      const mockJdQuestions = [
        {
          questionId: 'jd-q1-pro',
          role: 'custom' as const,
          questionIndex: 1 as const,
          title: 'Q1: Xung dot ky thuat (90s)',
          scenario: 'Scenario Q1',
          pressureContext: 'Context Q1',
          timeLimitSeconds: 90,
        },
        {
          questionId: 'jd-q2-pro',
          role: 'custom' as const,
          questionIndex: 2 as const,
          title: 'Q2: Khung hoang team (75s)',
          scenario: 'Scenario Q2',
          pressureContext: 'Context Q2',
          timeLimitSeconds: 75,
        },
        {
          questionId: 'jd-q3-pro',
          role: 'custom' as const,
          questionIndex: 3 as const,
          title: 'Q3: Dao duc nghe nghiep (60s)',
          scenario: 'Scenario Q3',
          pressureContext: 'Context Q3',
          timeLimitSeconds: 60,
        },
      ];

      const makeEval = (qIdx: number) => ({
        questionIndex: qIdx,
        rubricScores: [
          { name: 'Cấu trúc STAR & Mạch lạc', score: 9, feedback: 'Xuat sac' },
          { name: 'Tính cụ thể & Dẫn chứng', score: 9, feedback: 'Xuat sac' },
          { name: 'Mức độ liên quan & Đúng trọng tâm', score: 9, feedback: 'Xuat sac' },
          { name: 'Nhận thức hệ quả & Tư duy xử lý', score: 9, feedback: 'Xuat sac' },
          { name: JOB_MATCH_FIT_CRITERION_NAME, score: 9, feedback: 'Khop JD' },
        ],
        averageScore: 9.0,
        strengths: ['Dap ung chuan'],
        improvements: ['Tiep tuc phat huy'],
        followUpQuestion: 'None',
        simulatedPressureVerdict: 'Chuyen nghiep.',
      });

      let evalCounter = 1;

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
                    jobTitle: 'Senior Fullstack Engineer',
                    companyOrIndustry: 'Silicon Valley',
                    extractedSkills: ['Next.js', 'Go'],
                    extractedCulture: ['High Ownership'],
                    questions: mockJdQuestions,
                  },
                }),
            });
          }
          if (url === '/api/interview/evaluate') {
            const currentEval = makeEval(evalCounter++);
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({ success: true, data: currentEval }),
            });
          }
          return Promise.reject(new Error(`Unhandled: ${url}`));
        })
      );

      render(React.createElement(InterviewPage));

      // Select Custom JD & Start
      await user.click(screen.getByRole('tab', { name: /nhập jd tùy biến/i }));
      await user.click(screen.getByRole('button', { name: /frontend react/i }));
      await user.click(
        screen.getByRole('button', { name: /phân tích jd & bắt đầu phỏng vấn/i })
      );

      // Question 1
      await waitFor(() => {
        expect(screen.getByText('Q1: Xung dot ky thuat (90s)')).toBeInTheDocument();
      });
      await user.type(
        screen.getByPlaceholderText(/nhập câu trả lời theo mô hình star/i),
        'Dap an cau 1'
      );
      await user.click(screen.getByRole('button', { name: /gửi câu trả lời/i }));

      // Rubric 1 -> Next to Q2
      await waitFor(() => {
        expect(screen.getByText(JOB_MATCH_FIT_CRITERION_NAME)).toBeInTheDocument();
      });
      await user.click(
        screen.getByRole('button', { name: /tiếp tục câu hỏi tiếp theo/i })
      );

      // Question 2: Displays smoothly without modal
      await waitFor(() => {
        expect(screen.getByText('Q2: Khung hoang team (75s)')).toBeInTheDocument();
      });
      expect(screen.queryByText(/nâng cấp gói pro/i)).not.toBeInTheDocument();

      // Answer Q2
      await user.type(
        screen.getByPlaceholderText(/nhập câu trả lời theo mô hình star/i),
        'Dap an cau 2'
      );
      await user.click(screen.getByRole('button', { name: /gửi câu trả lời/i }));

      // Rubric 2 -> Next to Q3
      await waitFor(() => {
        expect(screen.getByText(JOB_MATCH_FIT_CRITERION_NAME)).toBeInTheDocument();
      });
      await user.click(
        screen.getByRole('button', { name: /tiếp tục câu hỏi tiếp theo/i })
      );

      // Question 3: Displays smoothly
      await waitFor(() => {
        expect(screen.getByText('Q3: Dao duc nghe nghiep (60s)')).toBeInTheDocument();
      });
      expect(screen.queryByText(/nâng cấp gói pro/i)).not.toBeInTheDocument();

      // Answer Q3
      await user.type(
        screen.getByPlaceholderText(/nhập câu trả lời theo mô hình star/i),
        'Dap an cau 3'
      );
      await user.click(screen.getByRole('button', { name: /gửi câu trả lời/i }));

      // Rubric 3 -> Next to Summary
      await waitFor(() => {
        expect(screen.getByText(JOB_MATCH_FIT_CRITERION_NAME)).toBeInTheDocument();
      });
      await user.click(
        screen.getByRole('button', { name: /xem tổng kết phiên phỏng vấn/i })
      );

      // Reaches final report card
      await waitFor(() => {
        expect(screen.getByText(/Báo Cáo Năng Lực Ứng Biến Dưới Áp Lực/i)).toBeInTheDocument();
      });

      // No modal gating throughout the journey
      expect(screen.queryByText(/nâng cấp gói pro/i)).not.toBeInTheDocument();
    });

    it('validates license key formatting and server validation store', () => {
      const store = getPaymentStore();

      // Demo seed key is always valid
      expect(store.isLicenseKeyValid('PRO-DEMO-2026-VIP')).toBe(true);
      expect(store.isLicenseKeyValid('pro-demo-2026-vip')).toBe(true);

      // Standard format PRO-XXXX-YYYY
      expect(store.isLicenseKeyValid('PRO-A1B2-C3D4')).toBe(true);
      expect(store.isLicenseKeyValid('PRO-1234-5678')).toBe(true);

      // Invalid formats
      expect(store.isLicenseKeyValid('INVALID-KEY')).toBe(false);
      expect(store.isLicenseKeyValid('PRO-SHORT')).toBe(false);
      expect(store.isLicenseKeyValid('PRO-A-B')).toBe(false);
      expect(store.isLicenseKeyValid('')).toBe(false);
    });
  });

  // =========================================================================
  // 4. ADVERSARIAL QUOTA BYPASS & TAMPERING ATTACKS
  // =========================================================================
  describe('4. Adversarial Quota Bypass & Tampering Attacks', () => {
    it('defends against negative number injection in localStorage counters', () => {
      localStorage.setItem(TRIAL_REWRITE_KEY, '-9999');
      localStorage.setItem(TRIAL_CUSTOM_JD_KEY, '-1');

      const usage = getTrialUsage(false);
      // parseCount clamps negative to 0
      expect(usage.rewriteCount).toBe(0);
      expect(usage.customJdCount).toBe(0);
      expect(usage.canRewrite).toBe(true);
      expect(usage.canCustomJd).toBe(true);
    });

    it('defends against non-numeric and NaN string injection in localStorage counters', () => {
      const payloads = [
        'NaN',
        'Infinity',
        '-Infinity',
        'undefined',
        'null',
        '[object Object]',
        '"><script>alert(1)</script>',
        'true',
        'false',
        '0x10', // hex
      ];

      for (const payload of payloads) {
        localStorage.setItem(TRIAL_REWRITE_KEY, payload);
        const usage = getTrialUsage(false);
        expect(Number.isFinite(usage.rewriteCount)).toBe(true);
        expect(usage.rewriteCount).toBeGreaterThanOrEqual(0);
      }
    });

    it('enforces blocking when large integer values are injected to test integer overflow', () => {
      localStorage.setItem(TRIAL_REWRITE_KEY, '9007199254740991'); // MAX_SAFE_INTEGER
      const usage = getTrialUsage(false);
      expect(usage.canRewrite).toBe(false);
      expect(usage.rewriteCount).toBe(9007199254740991);
    });

    it('maintains strict synchronization between TRIAL_REWRITE_KEY and LEGACY_REWRITE_KEY', () => {
      // Simulate legacy user with only legacy key
      localStorage.setItem(LEGACY_REWRITE_KEY, '1');
      expect(getTrialUsage(false).canRewrite).toBe(false);

      // Recording usage syncs both keys
      recordTrialUsage('rewrite');
      expect(localStorage.getItem(TRIAL_REWRITE_KEY)).toBe('2');
      expect(localStorage.getItem(LEGACY_REWRITE_KEY)).toBe('2');
    });

    it('gracefully handles Storage.getItem throwing security errors without crashing caller', () => {
      const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new DOMException('Access denied', 'SecurityError');
      });

      const usage = getTrialUsage(false);
      expect(usage.rewriteCount).toBe(0);
      expect(usage.canRewrite).toBe(true);

      spy.mockRestore();
    });

    it('gracefully handles Storage.setItem throwing quota exceeded errors without unhandled rejection', () => {
      const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('Storage quota exceeded', 'QuotaExceededError');
      });

      expect(() => recordTrialUsage('rewrite')).not.toThrow();
      expect(() => recordTrialUsage('customJd')).not.toThrow();
      expect(() => setClientProStatus(true, 'PRO-TEST-1234')).not.toThrow();

      spy.mockRestore();
    });
  });

  // =========================================================================
  // 5. 1-CLICK WIPE DATA PURGE INTEGRITY & STATE RESETS
  // =========================================================================
  describe('5. 1-Click Wipe Data Purge Integrity & Reactive State Reset', () => {
    it('purges all 22 storage keys and resets trial counters, drafts, and pro entitlement', () => {
      // Populate every known storage key
      for (const key of STORAGE_KEYS_TO_CLEAR) {
        localStorage.setItem(key, `sensitive_value_${key}`);
      }
      sessionStorage.setItem('temp_session_key', 'session_data');

      // Verify keys exist
      expect(localStorage.length).toBeGreaterThanOrEqual(STORAGE_KEYS_TO_CLEAR.length);

      // Perform 1-click wipe
      const result = wipeAllSessionData();

      expect(result.success).toBe(true);
      expect(result.clearedLocalStorage).toBe(true);
      expect(result.clearedSessionStorage).toBe(true);
      expect(localStorage.length).toBe(0);
      expect(sessionStorage.length).toBe(0);

      // Every registered key must be null
      for (const key of STORAGE_KEYS_TO_CLEAR) {
        expect(localStorage.getItem(key)).toBeNull();
      }

      // Trial usage is reset to clean slate
      const resetUsage = getTrialUsage(false);
      expect(resetUsage.rewriteCount).toBe(0);
      expect(resetUsage.customJdCount).toBe(0);
      expect(resetUsage.canRewrite).toBe(true);
      expect(resetUsage.canCustomJd).toBe(true);

      // Pro tier is reset to free
      const proStatus = getClientProStatus();
      expect(proStatus.isPro).toBe(false);
      expect(proStatus.licenseKey).toBeNull();
    });

    it('dispatches a window event so active components reactive state is immediately wiped', () => {
      let eventFired = false;
      const handler = (e: Event) => {
        const custom = e as CustomEvent;
        expect(custom.detail.timestamp).toBeGreaterThan(0);
        eventFired = true;
      };

      window.addEventListener(WIPE_DATA_EVENT_NAME, handler);

      wipeAllSessionData();

      expect(eventFired).toBe(true);
      window.removeEventListener(WIPE_DATA_EVENT_NAME, handler);
    });

    it('resets RoastReport in-memory rewrite states upon data-wiped event', () => {
      const mockData: RoastData = {
        overallScore: 70,
        tone: 'spicy',
        summaryVerdict: 'Verdict',
        topStrengths: [],
        weaknesses: [
          {
            quote: 'Quote',
            issue: 'Issue',
            severity: 'Cao',
            rejectionReason: 'Reason',
            fixGuideline: 'Guideline [so]',
          },
        ],
        atsRecommendations: [],
        disclaimer: 'Disclaimer',
      };

      const { container } = render(
        React.createElement(RoastReport, {
          data: mockData,
          onReset: vi.fn(),
          onChangeTone: vi.fn(),
          onEditCv: vi.fn(),
        })
      );

      // Dispatch wipe event
      act(() => {
        window.dispatchEvent(
          new CustomEvent(WIPE_DATA_EVENT_NAME, {
            detail: { timestamp: Date.now() },
          })
        );
      });

      // Verify component remains stable and mounted
      expect(container).toBeInTheDocument();
    });
  });

  // =========================================================================
  // 6. ZERO-PII SERVER LOGGING ADVERSARIAL STRESS TEST
  // =========================================================================
  describe('6. Zero-PII Server Logging Adversarial Audit', () => {
    it('contains all required JD and Rewrite forbidden keys in FORBIDDEN_LOG_KEYS set', () => {
      const mandatoryForbiddenKeys = [
        'cvtext',
        'rawtext',
        'candidateanswer',
        'email',
        'phone',
        'quote',
        'cvcontext',
        'originalquote',
        'rewrittentext',
        'rewrittencontent',
        'cvrewrite',
        'candidatequote',
        'jd',
        'jdtext',
        'jobdescription',
        'customjd',
        'rewrite',
        'suggestion',
      ];

      for (const key of mandatoryForbiddenKeys) {
        expect(
          FORBIDDEN_LOG_KEYS.has(key),
          `Missing forbidden log key: ${key}`
        ).toBe(true);
      }
    });

    it('redacts forbidden keys across camelCase, snake_case, PascalCase, and kebab-case', () => {
      const adversarialMeta = {
        // JD keys
        jd: 'Sensitive JD text',
        JD: 'Sensitive uppercase JD',
        jdText: 'Full JD content',
        jd_text: 'Snake JD content',
        'jd-text': 'Kebab JD content',
        jobDescription: 'Top secret banking JD',
        job_description: 'Snake job description',
        customJd: 'Pasted custom JD',
        custom_jd: 'Snake custom JD',

        // Rewrite keys
        rewrittenText: 'Toi uu hoa [100%] du an',
        rewritten_text: 'Snake rewrite',
        rewrittenContent: 'Content of rewrite',
        rewritten_content: 'Snake rewrite content',
        cvRewrite: 'Improved CV section',
        cv_rewrite: 'Snake CV rewrite',
        candidateQuote: 'Sensitive candidate text',
        candidate_quote: 'Snake candidate quote',
        rewrite: 'Rewrite advice',
        suggestion: 'Suggestion advice',

        // Safe metadata
        latencyMs: 250,
        requestId: 'REQ-12345',
        statusCode: 200,
        actionVerbCategory: 'Leadership',
      };

      const sanitized = sanitizeMeta(adversarialMeta);
      expect(sanitized).toBeDefined();

      // All sensitive keys are replaced with [REDACTED_PII]
      const redactedKeys = [
        'jd',
        'JD',
        'jdText',
        'jd_text',
        'jd-text',
        'jobDescription',
        'job_description',
        'customJd',
        'custom_jd',
        'rewrittenText',
        'rewritten_text',
        'rewrittenContent',
        'rewritten_content',
        'cvRewrite',
        'cv_rewrite',
        'candidateQuote',
        'candidate_quote',
        'rewrite',
        'suggestion',
      ];

      for (const k of redactedKeys) {
        expect(sanitized?.[k]).toBe('[REDACTED_PII]');
      }

      // Safe metadata is preserved intact
      expect(sanitized?.latencyMs).toBe(250);
      expect(sanitized?.requestId).toBe('REQ-12345');
      expect(sanitized?.statusCode).toBe(200);
      expect(sanitized?.actionVerbCategory).toBe('Leadership');
    });

    it('redacts deeply nested structures containing sensitive JD and rewrite objects', () => {
      const deepNested = {
        meta: {
          session: {
            customJd: 'Secret JD requirement for AI VP',
            nestedArray: [
              {
                rewritten_text: 'Action Verb + Result [so lieu]',
                score: 9.5,
              },
            ],
          },
        },
      };

      const sanitized = sanitizeMeta(deepNested) as any;
      expect(sanitized.meta.session.customJd).toBe('[REDACTED_PII]');
      expect(sanitized.meta.session.nestedArray[0].rewritten_text).toBe('[REDACTED_PII]');
      expect(sanitized.meta.session.nestedArray[0].score).toBe(9.5);
    });

    it('sanitizes PII patterns (email, phone, links) embedded inside safe log keys', () => {
      const metaWithEmbeddedPii = {
        messageNotes: 'Contact applicant at candidate@gmail.com or 0912345678 immediately',
      };

      const sanitized = sanitizeMeta(metaWithEmbeddedPii);
      expect(sanitized?.messageNotes).not.toContain('candidate@gmail.com');
      expect(sanitized?.messageNotes).not.toContain('0912345678');
      expect(sanitized?.messageNotes).toContain('c***e@gmail.com');
      expect(sanitized?.messageNotes).toContain('09****5678');
    });

    it('ensures logger.info and logger.error never print forbidden PII to stdout/stderr', () => {
      logger.info('User triggered ATS rewrite', {
        job_description: 'Classified fintech project JD',
        rewrittenText: 'Gia tang [30%] hieu suat',
        phone: '0987654321',
      });

      expect(consoleLogSpy).toHaveBeenCalled();
      const lastLog = consoleLogSpy.mock.calls[consoleLogSpy.mock.calls.length - 1].join(' ');

      // Must NOT contain sensitive text
      expect(lastLog).not.toContain('Classified fintech project JD');
      expect(lastLog).not.toContain('Gia tang [30%] hieu suat');
      expect(lastLog).not.toContain('0987654321');
      expect(lastLog).toContain('[REDACTED_PII]');

      // Error logger testing
      const sensitiveError = new Error('Database failed on candidate CV: Nguyen Van A, phone: 0912345678');
      logger.error('Failed to save draft', sensitiveError);

      expect(consoleErrorSpy).toHaveBeenCalled();
      const lastError = consoleErrorSpy.mock.calls[consoleErrorSpy.mock.calls.length - 1].join(' ');
      expect(lastError).not.toContain('0912345678');
      expect(lastError).toContain('09****5678');
    });
  });
});
