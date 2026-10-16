import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InterviewPage from '@/app/interview/page';
import { RubricCard } from '@/components/interview/RubricCard';
import { ReportCard, SessionSummaryEvaluation } from '@/components/interview/ReportCard';
import { QuitConfirmModal } from '@/components/interview/QuitConfirmModal';
import { TimerCountdown } from '@/components/interview/TimerCountdown';
import { QuestionCard } from '@/components/interview/QuestionCard';
import {
  InterviewQuestionData,
  RubricCriterionScore,
} from '@/lib/schemas/interview';

describe('Adversarial Stress Testing: /interview User Journey & Timer Engine (Challenger 2)', () => {
  const mockQ1: InterviewQuestionData = {
    questionId: 'it-q1',
    role: 'it',
    questionIndex: 1,
    title: 'Bug nghiêm trọng sát giờ Release',
    scenario: '17:30 chiều thứ Sáu, phát hiện race condition module thanh toán...',
    pressureContext: 'PM đe dọa trừ KPI cả team nếu không release kịp...',
    timeLimitSeconds: 90,
  };

  const mockQ2: InterviewQuestionData = {
    questionId: 'it-q2',
    role: 'it',
    questionIndex: 2,
    title: 'Xung đột kiến trúc & Đổ lỗi từ Senior',
    scenario: 'Server sập liên tục do memory leak...',
    pressureContext: 'Senior review hợp đồng thử việc của bạn...',
    timeLimitSeconds: 75,
  };

  const mockQ3: InterviewQuestionData = {
    questionId: 'it-q3',
    role: 'it',
    questionIndex: 3,
    title: 'Lộ rò rỉ dữ liệu Production & Lệnh che giấu',
    scenario: 'Phát hiện dữ liệu 50.000 khách hàng bị lộ...',
    pressureContext: 'Giám đốc yêu cầu xóa log để tránh phạt theo Nghị định 13...',
    timeLimitSeconds: 60,
  };

  const mockEval1 = {
    questionIndex: 1,
    rubricScores: [
      {
        name: 'Cấu trúc STAR & Mạch lạc',
        score: 8,
        feedback: 'Mạch lạc, có cấu trúc rõ ràng.',
      },
      {
        name: 'Tính cụ thể & Dẫn chứng',
        score: 7,
        feedback: 'Nêu công cụ trace log Datadog.',
      },
      {
        name: 'Mức độ liên quan & Đúng trọng tâm',
        score: 8,
        feedback: 'Tập trung xử lý sự cố.',
      },
      {
        name: 'Nhận thức hệ quả & Tư duy xử lý',
        score: 9,
        feedback: 'Đánh giá được rủi ro tài chính.',
      },
    ] as RubricCriterionScore[],
    averageScore: 8.0,
    strengths: ['Tư duy kỹ thuật điềm tĩnh', 'Bảo vệ giá trị cốt lõi'],
    improvements: ['Cần chuẩn bị phương án rollback dự phòng'],
    followUpQuestion: 'Nếu đối tác thanh toán khiếu nại, bạn giải trình thế nào?',
    simulatedPressureVerdict: 'Xử lý khủng hoảng vững vàng.',
  };

  const mockEval2 = {
    questionIndex: 2,
    rubricScores: [
      {
        name: 'Cấu trúc STAR & Mạch lạc',
        score: 6,
        feedback: 'Cần mạch lạc hơn ở phần Action.',
      },
      {
        name: 'Tính cụ thể & Dẫn chứng',
        score: 6,
        feedback: 'Chưa có số liệu profiling bộ nhớ cụ thể.',
      },
      {
        name: 'Mức độ liên quan & Đúng trọng tâm',
        score: 7,
        feedback: 'Tập trung vào giải pháp kỹ thuật.',
      },
      {
        name: 'Nhận thức hệ quả & Tư duy xử lý',
        score: 7,
        feedback: 'Hiểu được tác động lên thời gian thử việc.',
      },
    ] as RubricCriterionScore[],
    averageScore: 6.5,
    strengths: ['Không đối đầu tiêu cực'],
    improvements: ['Cần dẫn chứng log memory heap dump'],
    followUpQuestion: 'Làm thế nào để thuyết phục Senior review lại code?',
    simulatedPressureVerdict: 'Khéo léo nhưng cần chứng cứ kỹ thuật đanh thép hơn.',
  };

  const mockEval3 = {
    questionIndex: 3,
    rubricScores: [
      {
        name: 'Cấu trúc STAR & Mạch lạc',
        score: 9,
        feedback: 'Cấu trúc STAR hoàn hảo.',
      },
      {
        name: 'Tính cụ thể & Dẫn chứng',
        score: 9,
        feedback: 'Dẫn chiếu chuẩn Nghị định 13/2023/NĐ-CP.',
      },
      {
        name: 'Mức độ liên quan & Đúng trọng tâm',
        score: 9,
        feedback: 'Bảo vệ đạo đức nghề nghiệp và pháp lý.',
      },
      {
        name: 'Nhận thức hệ quả & Tư duy xử lý',
        score: 10,
        feedback: 'Nhận thức sâu sắc trách nhiệm hình sự và bảo mật.',
      },
    ] as RubricCriterionScore[],
    averageScore: 9.3,
    strengths: ['Đạo đức nghề nghiệp vững vàng', 'Am hiểu pháp luật an toàn thông tin'],
    improvements: ['Giữ kênh liên lạc với DPO và ban cố vấn pháp chế'],
    followUpQuestion: 'Nếu Giám đốc đe dọa sa thải ngay lập tức, bạn làm gì?',
    simulatedPressureVerdict: 'Bản lĩnh kiên định trước áp lực cấp quản lý.',
  };

  beforeEach(() => {
    vi.restoreAllMocks();

    global.fetch = vi.fn().mockImplementation((url: string, options: any) => {
      const body = options?.body ? JSON.parse(options.body) : {};

      if (url.includes('/api/interview/question')) {
        if (body.questionIndex === 1) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ success: true, data: mockQ1 }),
          });
        }
        if (body.questionIndex === 2) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ success: true, data: mockQ2 }),
          });
        }
        if (body.questionIndex === 3) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ success: true, data: mockQ3 }),
          });
        }
      }

      if (url.includes('/api/interview/evaluate')) {
        if (body.questionIndex === 1) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ success: true, data: mockEval1 }),
          });
        }
        if (body.questionIndex === 2) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ success: true, data: mockEval2 }),
          });
        }
        if (body.questionIndex === 3) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ success: true, data: mockEval3 }),
          });
        }
      }

      return Promise.reject(new Error(`Unhandled URL: ${url}`));
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // =========================================================================
  // 1. TIMER COUNTDOWN & AUTO-SUBMIT AT 0s
  // =========================================================================
  describe('1. Timer Countdown Reaching 0s & Auto-Submit', () => {
    it('ticks down and triggers auto-submit when timer reaches 0s with an empty answer', async () => {
      vi.useFakeTimers();
      render(React.createElement(InterviewPage));

      // Select IT role
      const itBtn = screen.getByRole('button', {
        name: /it.*software engineer/i,
      });
      await act(async () => {
        itBtn.click();
      });

      // Verify timer is displayed with initial 90s (01:30)
      expect(screen.getByText(/01:30/i)).toBeInTheDocument();

      // Tick 30s -> 60s left (01:00)
      act(() => {
        vi.advanceTimersByTime(30000);
      });
      expect(screen.getByText(/01:00/i)).toBeInTheDocument();

      // Tick another 55s -> 5s left (00:05)
      act(() => {
        vi.advanceTimersByTime(55000);
      });
      expect(screen.getByText(/00:05/i)).toBeInTheDocument();

      // Tick last 5s -> reaches 0s and triggers auto-submit
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      // Expect evaluate API to be called with candidateAnswer: ""
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/interview/evaluate'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"candidateAnswer":""'),
        })
      );
    });

    it('auto-submits and preserves partially typed answer when timer reaches 0s', async () => {
      vi.useFakeTimers();
      render(React.createElement(InterviewPage));

      // Select IT role
      const itBtn = screen.getByRole('button', {
        name: /it.*software engineer/i,
      });
      await act(async () => {
        itBtn.click();
      });

      // User types an answer
      const textarea = screen.getByPlaceholderText(
        /nhập câu trả lời theo mô hình star/i
      );
      fireEvent.change(textarea, {
        target: {
          value:
            'Tình huống: Hotfix module thanh toán trước khi mở cổng giao dịch.',
        },
      });

      // Fast-forward 90 seconds to timeout
      await act(async () => {
        vi.advanceTimersByTime(90000);
      });

      // Verifies typed answer was sent in payload
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/interview/evaluate'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining(
            'Hotfix module thanh toán trước khi mở cổng giao dịch'
          ),
        })
      );
    });

    it('displays psychological tension styling across countdown phases in TimerCountdown', () => {
      // Normal phase (> 15s)
      const { rerender } = render(
        React.createElement(TimerCountdown, {
          timeRemaining: 45,
          totalDuration: 90,
        })
      );
      expect(screen.getByText('00:45')).toHaveClass('text-cyan-400');
      expect(screen.queryByText(/sắp hết giờ/i)).not.toBeInTheDocument();

      // Warning phase (5s - 15s)
      rerender(
        React.createElement(TimerCountdown, {
          timeRemaining: 12,
          totalDuration: 90,
        })
      );
      expect(screen.getByText('00:12')).toHaveClass('text-amber-300');
      expect(screen.queryByText(/sắp hết giờ/i)).not.toBeInTheDocument();

      // Critical phase (< 5s)
      rerender(
        React.createElement(TimerCountdown, {
          timeRemaining: 3,
          totalDuration: 90,
        })
      );
      expect(screen.getByText('00:03')).toHaveClass('text-rose-400');
      expect(screen.getByText(/sắp hết giờ/i)).toBeInTheDocument();
    });
  });

  // =========================================================================
  // 2. RAPID CLICKING ON SKIP BUTTON & STATE BOUNDARIES
  // =========================================================================
  describe('2. Rapid Clicking on Skip Button', () => {
    it('survives rapid successive clicks on Skip without skipping out-of-bounds or crashing', async () => {
      const user = userEvent.setup();
      render(React.createElement(InterviewPage));

      // Start IT track
      await user.click(
        screen.getByRole('button', { name: /it.*software engineer/i })
      );
      await screen.findByText(/câu hỏi 1 \/ 3/i);

      // Rapidly click Skip button
      const skipBtn = screen.getByRole('button', { name: /bỏ qua/i });
      await user.click(skipBtn);

      // Transitioned to Question 2
      await waitFor(() => {
        expect(screen.getByText(/câu hỏi 2 \/ 3/i)).toBeInTheDocument();
      });

      // Skip Question 2
      const skipBtn2 = screen.getByRole('button', { name: /bỏ qua/i });
      await user.click(skipBtn2);

      // Transitioned to Question 3
      await waitFor(() => {
        expect(screen.getByText(/câu hỏi 3 \/ 3/i)).toBeInTheDocument();
      });

      // Skip Question 3 -> directly transitions to SESSION_SUMMARY
      const skipBtn3 = screen.getByRole('button', { name: /bỏ qua/i });
      await user.click(skipBtn3);

      await waitFor(() => {
        expect(
          screen.getByRole('heading', {
            name: /báo cáo năng lực ứng biến dưới áp lực/i,
          })
        ).toBeInTheDocument();
      });

      // Verify it handles 0 completed questions cleanly (0/3)
      expect(
        screen.getByText(/hoàn thành 0\/3 câu hỏi tình huống/i)
      ).toBeInTheDocument();
      // Overall score should be 0.0 without NaN
      expect(screen.getByText('0.0')).toBeInTheDocument();
    });

    it('QuestionCard disables emergency buttons while submission is in progress', () => {
      const onSkipMock = vi.fn();
      const onQuitMock = vi.fn();

      render(
        React.createElement(QuestionCard, {
          question: mockQ1,
          currentIndex: 1,
          totalQuestions: 3,
          timeRemaining: 60,
          timeLimit: 90,
          answer: 'test answer',
          onChangeAnswer: vi.fn(),
          onSubmit: vi.fn(),
          onSkip: onSkipMock,
          onQuit: onQuitMock,
          isSubmitting: true, // In-flight submission
        })
      );

      const skipBtn = screen.getByRole('button', { name: /bỏ qua/i });
      const quitBtn = screen.getByRole('button', { name: /dừng phỏng vấn/i });
      const submitBtn = screen.getByRole('button', { name: /đang đánh giá/i });

      expect(skipBtn).toBeDisabled();
      expect(quitBtn).toBeDisabled();
      expect(submitBtn).toBeDisabled();

      fireEvent.click(skipBtn);
      expect(onSkipMock).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 3. QUIT MODAL OPEN / CLOSE / CONFIRM CYCLES
  // =========================================================================
  describe('3. Quit Modal Open/Close/Confirm Cycles', () => {
    it('supports full lifecycle of opening, canceling via button, reopening, and confirming exit', async () => {
      const user = userEvent.setup();
      render(React.createElement(InterviewPage));

      // Enter Question 1
      await user.click(
        screen.getByRole('button', { name: /it.*software engineer/i })
      );
      await screen.findByText(/câu hỏi 1 \/ 3/i);

      // Open quit modal
      const quitBtn = screen.getByRole('button', { name: /dừng phỏng vấn/i });
      await user.click(quitBtn);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(
        screen.getByText(/bạn có chắc chắn muốn dừng phỏng vấn\?/i)
      ).toBeInTheDocument();

      // Cancel via "Tiếp tục làm bài"
      const resumeBtn = screen.getByRole('button', {
        name: /tiếp tục làm bài/i,
      });
      await user.click(resumeBtn);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getByText(/câu hỏi 1 \/ 3/i)).toBeInTheDocument();

      // Reopen modal and close via Escape key
      await user.click(quitBtn);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      // Reopen modal and close via 'X' button
      await user.click(quitBtn);
      const closeXBtn = screen.getByRole('button', {
        name: /đóng hộp thoại/i,
      });
      await user.click(closeXBtn);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      // Reopen modal and confirm quit
      await user.click(quitBtn);
      const confirmQuitBtn = screen.getByRole('button', {
        name: /xác nhận dừng/i,
      });
      await user.click(confirmQuitBtn);

      // Successfully returned to Role Chooser
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /it.*software engineer/i })
        ).toBeInTheDocument();
      });
    });

    it('renders QuitConfirmModal standalone with appropriate completedCount message', () => {
      const onClose = vi.fn();
      const onConfirm = vi.fn();

      // When completedCount === 0
      const { rerender } = render(
        React.createElement(QuitConfirmModal, {
          isOpen: true,
          onClose,
          onConfirmQuit: onConfirm,
          completedCount: 0,
        })
      );
      expect(
        screen.getByText(/tiến trình của phiên sẽ được đặt lại hoàn toàn/i)
      ).toBeInTheDocument();

      // When completedCount > 0
      rerender(
        React.createElement(QuitConfirmModal, {
          isOpen: true,
          onClose,
          onConfirmQuit: onConfirm,
          completedCount: 2,
        })
      );
      expect(
        screen.getByText(/bạn đã hoàn thành 2\/3 câu hỏi tình huống/i)
      ).toBeInTheDocument();
    });
  });

  // =========================================================================
  // 4. VERIFICATION OF 4 RUBRIC CRITERIA SCORES IN RUBRICCARD
  // =========================================================================
  describe('4. Verification of 4 Rubric Criteria Scores in RubricCard', () => {
    it('renders all 4 authorized rubric criteria with correct progress scores', () => {
      const onNext = vi.fn();
      render(
        React.createElement(RubricCard, {
          questionIndex: 1,
          totalQuestions: 3,
          questionTitle: mockQ1.title,
          candidateAnswer: 'Câu trả lời mẫu theo STAR...',
          rubricScores: mockEval1.rubricScores,
          averageScore: mockEval1.averageScore,
          strengths: mockEval1.strengths,
          improvements: mockEval1.improvements,
          followUpQuestion: mockEval1.followUpQuestion,
          simulatedPressureVerdict: mockEval1.simulatedPressureVerdict,
          onNext,
          isLastQuestion: false,
        })
      );

      // Verify all 4 criteria names are rendered
      expect(
        screen.getByText('Cấu trúc STAR & Mạch lạc')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Tính cụ thể & Dẫn chứng')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Mức độ liên quan & Đúng trọng tâm')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Nhận thức hệ quả & Tư duy xử lý')
      ).toBeInTheDocument();

      // Verify scores display
      expect(screen.getByText('8.0')).toBeInTheDocument();
      expect(screen.getByText('Xuất sắc')).toBeInTheDocument();

      // Verify Probing question is present
      expect(
        screen.getByText(/nếu đối tác thanh toán khiếu nại/i)
      ).toBeInTheDocument();

      // Verify Mandatory Disclaimer is present
      expect(screen.getByText(/lưu ý: mô phỏng áp lực/i)).toBeInTheDocument();
      expect(
        screen.getByText(
          /không đại diện cho quyết định tuyển dụng thực tế hay cam kết việc làm/i
        )
      ).toBeInTheDocument();
    });

    it('toggles submitted answer visibility on demand in RubricCard', () => {
      render(
        React.createElement(RubricCard, {
          questionIndex: 1,
          totalQuestions: 3,
          questionTitle: mockQ1.title,
          candidateAnswer: 'Đây là câu trả lời thử nghiệm bí mật 12345.',
          rubricScores: mockEval1.rubricScores,
          averageScore: mockEval1.averageScore,
          strengths: mockEval1.strengths,
          improvements: mockEval1.improvements,
          followUpQuestion: mockEval1.followUpQuestion,
          simulatedPressureVerdict: mockEval1.simulatedPressureVerdict,
          onNext: vi.fn(),
          isLastQuestion: false,
        })
      );

      // Answer is initially hidden
      expect(
        screen.queryByText(/đây là câu trả lời thử nghiệm bí mật 12345/i)
      ).not.toBeInTheDocument();

      // Click to toggle show answer
      const toggleBtn = screen.getByRole('button', {
        name: /xem lại câu trả lời đã gửi/i,
      });
      fireEvent.click(toggleBtn);

      // Answer is now visible
      expect(
        screen.getByText(/đây là câu trả lời thử nghiệm bí mật 12345/i)
      ).toBeInTheDocument();

      // Click again to hide
      fireEvent.click(toggleBtn);
      expect(
        screen.queryByText(/đây là câu trả lời thử nghiệm bí mật 12345/i)
      ).not.toBeInTheDocument();
    });

    it('handles minimum score tier boundary (score 1-5 = Cần cải thiện) in RubricCard', () => {
      const lowScores: RubricCriterionScore[] = [
        {
          name: 'Cấu trúc STAR & Mạch lạc',
          score: 2,
          feedback: 'Thiếu hoàn toàn cấu trúc STAR.',
        },
        {
          name: 'Tính cụ thể & Dẫn chứng',
          score: 1,
          feedback: 'Không có dẫn chứng.',
        },
        {
          name: 'Mức độ liên quan & Đúng trọng tâm',
          score: 3,
          feedback: 'Lạc đề.',
        },
        {
          name: 'Nhận thức hệ quả & Tư duy xử lý',
          score: 2,
          feedback: 'Không lường trước hậu quả.',
        },
      ];

      render(
        React.createElement(RubricCard, {
          questionIndex: 1,
          totalQuestions: 3,
          questionTitle: mockQ1.title,
          candidateAnswer: 'Không biết làm.',
          rubricScores: lowScores,
          averageScore: 2.0,
          strengths: ['Đã tham gia thử thách'],
          improvements: ['Học lại mô hình STAR', 'Đọc kỹ câu hỏi'],
          followUpQuestion: 'Tại sao bạn bỏ qua tình huống này?',
          simulatedPressureVerdict: 'Cần nỗ lực nhiều hơn.',
          onNext: vi.fn(),
          isLastQuestion: false,
        })
      );

      expect(screen.getByText('2.0')).toBeInTheDocument();
      expect(screen.getByText('Cần cải thiện')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // 5. VERIFICATION OF MANDATORY DISCLAIMER IN REPORTCARD
  // =========================================================================
  describe('5. Verification of Mandatory "Mô phỏng áp lực" Disclaimer in ReportCard', () => {
    it('renders mandatory "Mô phỏng áp lực" disclaimer on full 3-question completion', () => {
      const evaluations: SessionSummaryEvaluation[] = [
        {
          questionIndex: 1,
          questionTitle: mockQ1.title,
          candidateAnswer: 'Answer 1',
          rubricScores: mockEval1.rubricScores,
          averageScore: mockEval1.averageScore,
          strengths: mockEval1.strengths,
          improvements: mockEval1.improvements,
          followUpQuestion: mockEval1.followUpQuestion,
          simulatedPressureVerdict: mockEval1.simulatedPressureVerdict,
        },
        {
          questionIndex: 2,
          questionTitle: mockQ2.title,
          candidateAnswer: 'Answer 2',
          rubricScores: mockEval2.rubricScores,
          averageScore: mockEval2.averageScore,
          strengths: mockEval2.strengths,
          improvements: mockEval2.improvements,
          followUpQuestion: mockEval2.followUpQuestion,
          simulatedPressureVerdict: mockEval2.simulatedPressureVerdict,
        },
        {
          questionIndex: 3,
          questionTitle: mockQ3.title,
          candidateAnswer: 'Answer 3',
          rubricScores: mockEval3.rubricScores,
          averageScore: mockEval3.averageScore,
          strengths: mockEval3.strengths,
          improvements: mockEval3.improvements,
          followUpQuestion: mockEval3.followUpQuestion,
          simulatedPressureVerdict: mockEval3.simulatedPressureVerdict,
        },
      ];

      render(
        React.createElement(ReportCard, {
          role: 'it',
          evaluations,
          onRestart: vi.fn(),
        })
      );

      // Verify Header and Role Badge
      expect(screen.getByText(/it \/ software engineer/i)).toBeInTheDocument();
      expect(
        screen.getByText(/hoàn thành 3\/3 câu hỏi tình huống/i)
      ).toBeInTheDocument();

      // Verify Mandatory Disclaimer
      expect(screen.getByText(/lưu ý: mô phỏng áp lực/i)).toBeInTheDocument();
      expect(
        screen.getByText(
          /kết quả đánh giá này được tạo tự động bởi ai nhằm mục đích hỗ trợ sinh viên và người tìm việc tự luyện tập phản xạ phỏng vấn/i
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /không đại diện cho quyết định tuyển dụng thực tế hay cam kết việc làm tại bất kỳ doanh nghiệp nào/i
        )
      ).toBeInTheDocument();

      // Verify 4 criteria averages comparative matrix
      expect(
        screen.getByText('Cấu trúc STAR & Mạch lạc')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Tính cụ thể & Dẫn chứng')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Mức độ liên quan & Đúng trọng tâm')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Nhận thức hệ quả & Tư duy xử lý')
      ).toBeInTheDocument();

      // Overall average: (8.0 + 6.5 + 9.3) / 3 = 23.8 / 3 = 7.9
      expect(screen.getByText('7.9')).toBeInTheDocument();
    });

    it('renders navigation link to Roast CV and triggers restart callback', async () => {
      const user = userEvent.setup();
      const onRestartMock = vi.fn();
      const onWipeDataMock = vi.fn();

      render(
        React.createElement(ReportCard, {
          role: 'marketing',
          evaluations: [],
          onRestart: onRestartMock,
          onWipeData: onWipeDataMock,
        })
      );

      // Role badge reflects marketing
      expect(screen.getByText(/marketing \/ business/i)).toBeInTheDocument();

      // Mandatory disclaimer still present when evaluations is empty
      expect(screen.getByText(/lưu ý: mô phỏng áp lực/i)).toBeInTheDocument();

      // Restart button triggers callback
      const restartBtn = screen.getByRole('button', {
        name: /luyện tập lại/i,
      });
      await user.click(restartBtn);
      expect(onRestartMock).toHaveBeenCalledTimes(1);

      // Wipe data button triggers callback
      const wipeBtn = screen.getByRole('button', {
        name: /xóa sạch dữ liệu/i,
      });
      await user.click(wipeBtn);
      expect(onWipeDataMock).toHaveBeenCalledTimes(1);

      // Roast CV CTA link is present and points to /roast
      const roastLink = screen.getByRole('link', {
        name: /thử chế độ roast cv/i,
      });
      expect(roastLink).toHaveAttribute('href', '/roast');
    });
  });

  // =========================================================================
  // 6. FULL MULTI-QUESTION FLOW ADVANCEMENT
  // =========================================================================
  describe('6. Full End-to-End Multi-Question Flow', () => {
    it('progresses from Q1 -> Rubric -> Q2 -> Rubric -> Q3 -> Rubric -> Summary', async () => {
      const user = userEvent.setup();
      render(React.createElement(InterviewPage));

      // 1. Role chooser -> IT
      await user.click(
        screen.getByRole('button', { name: /it.*software engineer/i })
      );
      await screen.findByText(/câu hỏi 1 \/ 3/i);

      // Submit Q1
      const textarea1 = screen.getByPlaceholderText(
        /nhập câu trả lời theo mô hình star/i
      );
      await user.type(textarea1, 'Giải quyết bug bằng cách rollback và trace logs.');
      await user.click(
        screen.getByRole('button', { name: /gửi câu trả lời/i })
      );

      // Rubric 1
      await screen.findByText(/kết quả đánh giá câu hỏi 1 \/ 3/i);
      const nextBtn1 = screen.getByRole('button', {
        name: /tiếp tục câu hỏi tiếp theo/i,
      });
      await user.click(nextBtn1);

      // Q2 Active
      await screen.findByText(/câu hỏi 2 \/ 3/i);
      const textarea2 = screen.getByPlaceholderText(
        /nhập câu trả lời theo mô hình star/i
      );
      await user.type(textarea2, 'Phân tích memory leak bằng heap dump.');
      await user.click(
        screen.getByRole('button', { name: /gửi câu trả lời/i })
      );

      // Rubric 2
      await screen.findByText(/kết quả đánh giá câu hỏi 2 \/ 3/i);
      const nextBtn2 = screen.getByRole('button', {
        name: /tiếp tục câu hỏi tiếp theo/i,
      });
      await user.click(nextBtn2);

      // Q3 Active
      await screen.findByText(/câu hỏi 3 \/ 3/i);
      const textarea3 = screen.getByPlaceholderText(
        /nhập câu trả lời theo mô hình star/i
      );
      await user.type(
        textarea3,
        'Báo cáo DPO và tuân thủ Nghị định 13/2023/NĐ-CP.'
      );
      await user.click(
        screen.getByRole('button', { name: /gửi câu trả lời/i })
      );

      // Rubric 3 (Last Question)
      await screen.findByText(/kết quả đánh giá câu hỏi 3 \/ 3/i);
      const finishBtn = screen.getByRole('button', {
        name: /xem tổng kết phiên phỏng vấn/i,
      });
      await user.click(finishBtn);

      // Session Summary Report Card
      await screen.findByRole('heading', {
        name: /báo cáo năng lực ứng biến dưới áp lực/i,
      });
      expect(
        screen.getByText(/hoàn thành 3\/3 câu hỏi tình huống/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/lưu ý: mô phỏng áp lực/i)).toBeInTheDocument();
    });
  });
});
