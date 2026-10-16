import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RoleChooser } from '@/components/interview/RoleChooser';
import { RubricCard } from '@/components/interview/RubricCard';
import { ReportCard } from '@/components/interview/ReportCard';
import InterviewPage from '@/app/interview/page';
import { SAMPLE_JDS } from '@/lib/data/sample-jds';
import { JOB_MATCH_FIT_CRITERION_NAME } from '@/lib/schemas/interview';

describe('Milestone 8: Custom JD Stress Interview Components & Flow', () => {
  // -------------------------------------------------------------------------
  // 1. RoleChooser Component Tests
  // -------------------------------------------------------------------------
  describe('1. RoleChooser Dual-Tab & Custom JD Form', () => {
    it('renders both navigation tabs and defaults to preset roles tab', () => {
      const handleSelectRole = vi.fn();
      render(React.createElement(RoleChooser, { onSelectRole: handleSelectRole }));

      expect(screen.getByRole('tab', { name: /Chọn vị trí có sẵn/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Nhập JD tùy biến/i })).toBeInTheDocument();

      // In preset tab, IT and Marketing cards are visible
      expect(screen.getByText('IT / Software Engineer')).toBeInTheDocument();
      expect(screen.getByText('Marketing / Business')).toBeInTheDocument();
    });

    it('switches to Custom JD tab when clicked and displays JD form controls', async () => {
      const user = userEvent.setup();
      render(React.createElement(RoleChooser, { onSelectRole: vi.fn() }));

      const customTab = screen.getByRole('tab', { name: /Nhập JD tùy biến/i });
      await user.click(customTab);

      expect(
        screen.getByText(/Dán Job Description \(JD\) Công Ty Bạn Muốn Ứng Tuyển/i)
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/Dán toàn bộ nội dung bản tin tuyển dụng/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/0 \/ 10\.000 ký tự/i)).toBeInTheDocument();
    });

    it('loads sample Vietnamese JD when sample chip is clicked', async () => {
      const user = userEvent.setup();
      render(React.createElement(RoleChooser, { onSelectRole: vi.fn() }));

      await user.click(screen.getByRole('tab', { name: /Nhập JD tùy biến/i }));

      // Find first sample quick-load button
      const sampleBtn = screen.getByRole('button', { name: /Frontend React/i });
      await user.click(sampleBtn);

      const textarea = screen.getByPlaceholderText(
        /Dán toàn bộ nội dung bản tin tuyển dụng/i
      ) as HTMLTextAreaElement;

      expect(textarea.value).toBe(SAMPLE_JDS[0].jdText);
      expect(screen.getByDisplayValue('Frontend React / Next.js Fresher')).toBeInTheDocument();
      expect(screen.getByDisplayValue('FinTech Startup (Hà Nội / Hybrid)')).toBeInTheDocument();
    });

    it('shows validation warning when JD text is under 50 characters and disables submit', async () => {
      const user = userEvent.setup();
      render(React.createElement(RoleChooser, { onSelectRole: vi.fn() }));

      await user.click(screen.getByRole('tab', { name: /Nhập JD tùy biến/i }));

      const textarea = screen.getByPlaceholderText(
        /Dán toàn bộ nội dung bản tin tuyển dụng/i
      );
      await user.type(textarea, 'Tuyển React developer junior');

      expect(
        screen.getByText(/cần tối thiểu 50 ký tự/i)
      ).toBeInTheDocument();

      const submitBtn = screen.getByRole('button', {
        name: /Phân tích JD & Bắt đầu phỏng vấn/i,
      });
      expect(submitBtn).toBeDisabled();
    });

    it('triggers onSelectCustomJd callback with sanitized payload when form is submitted', async () => {
      const user = userEvent.setup();
      const handleSelectCustomJd = vi.fn();

      render(
        React.createElement(RoleChooser, {
          onSelectRole: vi.fn(),
          onSelectCustomJd: handleSelectCustomJd,
        })
      );

      await user.click(screen.getByRole('tab', { name: /Nhập JD tùy biến/i }));

      // Quick fill sample
      const sampleBtn = screen.getByRole('button', { name: /Frontend React/i });
      await user.click(sampleBtn);

      const submitBtn = screen.getByRole('button', {
        name: /Phân tích JD & Bắt đầu phỏng vấn/i,
      });
      expect(submitBtn).not.toBeDisabled();

      await user.click(submitBtn);

      expect(handleSelectCustomJd).toHaveBeenCalledTimes(1);
      expect(handleSelectCustomJd).toHaveBeenCalledWith(
        expect.objectContaining({
          jdText: SAMPLE_JDS[0].jdText,
          targetRole: 'Frontend React / Next.js Fresher',
          company: 'FinTech Startup (Hà Nội / Hybrid)',
        })
      );
    });

    it('clears form inputs when "Xóa trắng" is clicked', async () => {
      const user = userEvent.setup();
      render(React.createElement(RoleChooser, { onSelectRole: vi.fn() }));

      await user.click(screen.getByRole('tab', { name: /Nhập JD tùy biến/i }));
      await user.click(screen.getByRole('button', { name: /Frontend React/i }));

      const clearBtn = screen.getByRole('button', { name: /Xóa trắng/i });
      await user.click(clearBtn);

      const textarea = screen.getByPlaceholderText(
        /Dán toàn bộ nội dung bản tin tuyển dụng/i
      ) as HTMLTextAreaElement;
      expect(textarea.value).toBe('');
    });

    it('supports standard role selection in preset tab (backward compatibility)', async () => {
      const user = userEvent.setup();
      const handleSelectRole = vi.fn();

      render(React.createElement(RoleChooser, { onSelectRole: handleSelectRole }));

      const itBtn = screen.getByRole('button', {
        name: /IT \/ Software Engineer/i,
      });
      await user.click(itBtn);

      expect(handleSelectRole).toHaveBeenCalledWith('it');
    });
  });

  // -------------------------------------------------------------------------
  // 2. RubricCard with 5 Criteria & Custom Badge
  // -------------------------------------------------------------------------
  describe('2. RubricCard Component with 5 Criteria', () => {
    const sample5RubricScores = [
      {
        name: 'Cấu trúc STAR & Mạch lạc' as const,
        score: 8,
        feedback: 'Mạch lạc tốt.',
      },
      {
        name: 'Tính cụ thể & Dẫn chứng' as const,
        score: 7,
        feedback: 'Dẫn chứng cụ thể.',
      },
      {
        name: 'Mức độ liên quan & Đúng trọng tâm' as const,
        score: 8,
        feedback: 'Đúng trọng tâm.',
      },
      {
        name: 'Nhận thức hệ quả & Tư duy xử lý' as const,
        score: 9,
        feedback: 'Tư duy xử lý tốt.',
      },
      {
        name: JOB_MATCH_FIT_CRITERION_NAME,
        score: 9,
        feedback: 'Vận dụng rất tốt kỹ năng React theo yêu cầu JD.',
      },
    ];

    it('renders all 5 criteria cards and highlights 5th criterion with "Tiêu chí JD" badge', () => {
      render(
        React.createElement(RubricCard, {
          questionIndex: 1,
          questionTitle: 'Sự cố Token Auth',
          candidateAnswer: 'Tôi phân tích log và dùng React Query retry...',
          rubricScores: sample5RubricScores,
          averageScore: 8.2,
          strengths: ['Bám sát JD'],
          improvements: ['Cần chi tiết hơn'],
          followUpQuestion: 'Bạn xử lý thế nào tiếp theo?',
          simulatedPressureVerdict: 'Bản lĩnh vững vàng.',
          onNext: vi.fn(),
          isLastQuestion: false,
        })
      );

      // Check all 5 criteria are rendered
      expect(screen.getByText('Cấu trúc STAR & Mạch lạc')).toBeInTheDocument();
      expect(screen.getByText('Tính cụ thể & Dẫn chứng')).toBeInTheDocument();
      expect(screen.getByText('Mức độ liên quan & Đúng trọng tâm')).toBeInTheDocument();
      expect(screen.getByText('Nhận thức hệ quả & Tư duy xử lý')).toBeInTheDocument();
      expect(screen.getByText(JOB_MATCH_FIT_CRITERION_NAME)).toBeInTheDocument();

      // Check "Tiêu chí JD" badge
      expect(screen.getByText('Tiêu chí JD')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // 3. ReportCard Component with 5 Criteria Aggregation
  // -------------------------------------------------------------------------
  describe('3. ReportCard 5-Criteria Matrix Aggregation', () => {
    const sampleEvaluations = [
      {
        questionIndex: 1 as const,
        questionTitle: 'Sự cố Token Auth',
        candidateAnswer: 'Answer 1...',
        rubricScores: [
          {
            name: 'Cấu trúc STAR & Mạch lạc' as const,
            score: 8,
            feedback: 'Tốt',
          },
          {
            name: 'Tính cụ thể & Dẫn chứng' as const,
            score: 7,
            feedback: 'Tốt',
          },
          {
            name: 'Mức độ liên quan & Đúng trọng tâm' as const,
            score: 8,
            feedback: 'Tốt',
          },
          {
            name: 'Nhận thức hệ quả & Tư duy xử lý' as const,
            score: 9,
            feedback: 'Tốt',
          },
          {
            name: JOB_MATCH_FIT_CRITERION_NAME,
            score: 9,
            feedback: 'Khớp JD',
          },
        ],
        averageScore: 8.2,
        strengths: ['Tư duy kỹ thuật tốt'],
        improvements: ['Cần luyện tập thêm'],
        followUpQuestion: 'Follow up 1',
        simulatedPressureVerdict: 'Verdict 1',
      },
    ];

    it('aggregates 5 criteria in comparative matrix and renders custom role badge', () => {
      render(
        React.createElement(ReportCard, {
          role: 'custom',
          evaluations: sampleEvaluations,
          targetRoleTitle: 'Frontend React Fresher',
          onRestart: vi.fn(),
        })
      );

      // Heading should show 5 criteria
      expect(
        screen.getByText(/Năng Lực Theo 5 Tiêu Chí Chuẩn Hóa/i)
      ).toBeInTheDocument();

      // Role badge should show targetRoleTitle
      expect(screen.getByText('Frontend React Fresher')).toBeInTheDocument();

      // 5th criterion in matrix
      expect(
        screen.getAllByText(JOB_MATCH_FIT_CRITERION_NAME).length
      ).toBeGreaterThanOrEqual(1);
    });
  });

  // -------------------------------------------------------------------------
  // 4. End-to-End Custom JD Interview Page Flow
  // -------------------------------------------------------------------------
  describe('4. Full /interview User Journey with Custom JD', () => {
    const sampleQuestions = [
      {
        questionId: 'custom-q1-id',
        role: 'custom' as const,
        questionIndex: 1 as const,
        title: 'Tình huống 1: Lỗi Token Auth (90s)',
        scenario: 'Scenario 1 for custom JD...',
        pressureContext: 'PM giục nộp gấp...',
        timeLimitSeconds: 90,
      },
      {
        questionId: 'custom-q2-id',
        role: 'custom' as const,
        questionIndex: 2 as const,
        title: 'Tình huống 2: Bất đồng Tech Lead (75s)',
        scenario: 'Scenario 2 for custom JD...',
        pressureContext: 'Review thử việc...',
        timeLimitSeconds: 75,
      },
      {
        questionId: 'custom-q3-id',
        role: 'custom' as const,
        questionIndex: 3 as const,
        title: 'Tình huống 3: Rò rỉ Secret Key (60s)',
        scenario: 'Scenario 3 for custom JD...',
        pressureContext: 'Nguy cơ bảo mật...',
        timeLimitSeconds: 60,
      },
    ];

    const sampleEvaluationResponse = {
      questionIndex: 1,
      rubricScores: [
        {
          name: 'Cấu trúc STAR & Mạch lạc',
          score: 8,
          feedback: 'Mạch lạc.',
        },
        {
          name: 'Tính cụ thể & Dẫn chứng',
          score: 8,
          feedback: 'Cụ thể.',
        },
        {
          name: 'Mức độ liên quan & Đúng trọng tâm',
          score: 8,
          feedback: 'Đúng trọng tâm.',
        },
        {
          name: 'Nhận thức hệ quả & Tư duy xử lý',
          score: 8,
          feedback: 'Nhận thức tốt.',
        },
        {
          name: JOB_MATCH_FIT_CRITERION_NAME,
          score: 9,
          feedback: 'Rất phù hợp với JD.',
        },
      ],
      averageScore: 8.2,
      strengths: ['Tư duy kỹ thuật tốt'],
      improvements: ['Nên bổ sung kế hoạch dự phòng'],
      followUpQuestion: 'Nếu khách hàng khiếu nại, bạn làm gì?',
      simulatedPressureVerdict: 'Thể hiện rất ấn tượng dưới áp lực.',
    };

    beforeEach(() => {
      vi.stubGlobal('fetch', vi.fn());
    });

    it('navigates through Custom JD: Generation -> Question 1 (90s) -> Answer -> 5-criteria Rubric -> Question 2 (75s)', async () => {
      const user = userEvent.setup();

      // Mock /api/interview/jd-questions
      (global.fetch as any).mockImplementation((url: string) => {
        if (url === '/api/interview/jd-questions') {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                success: true,
                data: {
                  jobTitle: 'Frontend React Fresher',
                  companyOrIndustry: 'FinTech Startup',
                  extractedSkills: ['React', 'TypeScript'],
                  extractedCulture: ['Agile'],
                  questions: sampleQuestions,
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
                data: sampleEvaluationResponse,
              }),
          });
        }
        return Promise.reject(new Error(`Unhandled URL: ${url}`));
      });

      render(React.createElement(InterviewPage));

      // Switch to Custom JD tab
      await user.click(screen.getByRole('tab', { name: /Nhập JD tùy biến/i }));

      // Click quick sample JD
      await user.click(screen.getByRole('button', { name: /Frontend React/i }));

      // Click start custom JD interview
      await user.click(
        screen.getByRole('button', { name: /Phân tích JD & Bắt đầu phỏng vấn/i })
      );

      // Verify Question 1 is displayed
      await waitFor(() => {
        expect(
          screen.getByText('Tình huống 1: Lỗi Token Auth (90s)')
        ).toBeInTheDocument();
      });

      // Timer should start at 90s (01:30)
      expect(screen.getByText('01:30')).toBeInTheDocument();

      // Type candidate answer
      const answerInput = screen.getByPlaceholderText(/Nhập câu trả lời theo mô hình STAR/i);
      await user.type(answerInput, 'Tôi ngay lập tức cấu hình refresh token flow với Axios interceptor để bảo vệ phiên giao dịch của merchant.');

      // Submit answer
      await user.click(screen.getByRole('button', { name: /Gửi câu trả lời/i }));

      // Verify 5-criteria Rubric is displayed
      await waitFor(() => {
        expect(screen.getByText(JOB_MATCH_FIT_CRITERION_NAME)).toBeInTheDocument();
        expect(screen.getByText('Tiêu chí JD')).toBeInTheDocument();
      });

      // Click continue to Question 2
      const nextBtn = screen.getByRole('button', {
        name: /Tiếp tục câu hỏi tiếp theo/i,
      });
      await user.click(nextBtn);

      // Question 2 displayed with 75s (01:15)
      await waitFor(() => {
        expect(
          screen.getByText('Tình huống 2: Bất đồng Tech Lead (75s)')
        ).toBeInTheDocument();
      });
      expect(screen.getByText('01:15')).toBeInTheDocument();
    });
  });
});
