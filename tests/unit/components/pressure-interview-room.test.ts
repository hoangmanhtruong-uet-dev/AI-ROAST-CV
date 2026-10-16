import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  PressureInterviewRoom,
  PressureQuestion,
} from '@/components/interview/PressureInterviewRoom';

describe('Requirement R3: Continuous 5-Stage Pressure Interview Room', () => {
  const mockApiEvaluation = {
    questionIndex: 1,
    rubricScores: [
      {
        name: 'Cấu trúc STAR & Mạch lạc',
        score: 9,
        feedback: 'Rất mạch lạc, đúng chuẩn STAR.',
      },
      {
        name: 'Tính cụ thể & Dẫn chứng',
        score: 8,
        feedback: 'Nêu rõ công cụ đo lường và tham số p95.',
      },
      {
        name: 'Mức độ liên quan & Đúng trọng tâm',
        score: 9,
        feedback: 'Giải quyết trực diện nút thắt kỹ thuật.',
      },
      {
        name: 'Nhận thức hệ quả & Tư duy xử lý',
        score: 8,
        feedback: 'Đánh giá trade-off bộ nhớ cache hợp lý.',
      },
    ],
    averageScore: 8.5,
    strengths: ['Tư duy kỹ thuật điềm tĩnh', 'Dẫn chứng số liệu rõ ràng'],
    improvements: ['Có thể dự phòng thêm kịch bản cache invalidation'],
    followUpQuestion: 'Nếu Redis sập nguồn, phương án fallback là gì?',
    simulatedPressureVerdict: 'Bản lĩnh vững vàng dưới áp lực thời gian.',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
    localStorage.clear();

    // Mock fetch for /api/interview/evaluate
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/interview/evaluate')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: mockApiEvaluation,
          }),
        });
      }
      return Promise.reject(new Error(`Unhandled mock url: ${url}`));
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    sessionStorage.clear();
  });

  // -------------------------------------------------------------------------
  // 1. Stage 1: LOBBY Screen Verification
  // -------------------------------------------------------------------------
  describe('Stage 1: LOBBY Screen', () => {
    it('renders initial LOBBY screen with rule box, track options, persona toggles, and start CTA', () => {
      render(React.createElement(PressureInterviewRoom));

      // Heading and subtitle
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        /Phòng Phỏng Vấn Áp Lực Cao/i
      );
      expect(screen.getByText(/PRESSURE INTERVIEW SIMULATOR/i)).toBeInTheDocument();

      // Rule box
      expect(screen.getByText(/Quy tắc sinh tồn trong phòng thi/i)).toBeInTheDocument();
      expect(screen.getByText(/5 giây đọc đề/i)).toBeInTheDocument();
      expect(screen.getByText(/90 giây để gõ câu trả lời/i)).toBeInTheDocument();
      expect(screen.getByText(/Cấm Copy-Paste từ ChatGPT/i)).toBeInTheDocument();

      // Persona toggles
      expect(screen.getByText(/Tech Lead "Mỏ Hỗn"/i)).toBeInTheDocument();
      expect(screen.getByText(/HR Chuyên Gia/i)).toBeInTheDocument();

      // Track options
      expect(screen.getByText(/IT \/ Software/i)).toBeInTheDocument();
      expect(screen.getByText(/Marketing \/ Growth/i)).toBeInTheDocument();

      // Start CTA
      const startBtn = screen.getByTestId('start-interview-btn');
      expect(startBtn).toHaveTextContent(/Bước vào phòng phỏng vấn ngay/i);
    });

    it('switches between IT and Marketing tracks in LOBBY', async () => {
      render(React.createElement(PressureInterviewRoom));

      const mktBtn = screen.getByText(/Marketing \/ Growth/i);
      fireEvent.click(mktBtn);

      // Verify track switched
      expect(screen.getByText(/Attribution ROI, xử lý PR Crisis/i)).toBeInTheDocument();

      const itBtn = screen.getByText(/IT \/ Software/i);
      fireEvent.click(itBtn);
      expect(screen.getByText(/Kiểm chứng số liệu, sự cố Prod/i)).toBeInTheDocument();
    });

    it('switches between Savage and Mentor personas', () => {
      render(React.createElement(PressureInterviewRoom));

      const mentorBtn = screen.getByText(/HR Chuyên Gia/i);
      fireEvent.click(mentorBtn);

      // In mentor mode, button has active state
      expect(screen.getByText(/HR Chuyên Gia/i).closest('button')).toHaveClass(
        'border-emerald-500'
      );
    });
  });

  // -------------------------------------------------------------------------
  // 2. Stage 2: READING Phase (5s Countdown) & Keyboard Lock
  // -------------------------------------------------------------------------
  describe('Stage 2: READING Phase (5s Countdown) & Keyboard Lock', () => {
    it('transitions to READING phase on Start, locks textarea and counts down 5s', () => {
      vi.useFakeTimers();
      render(React.createElement(PressureInterviewRoom));

      const startBtn = screen.getByTestId('start-interview-btn');
      act(() => {
        startBtn.click();
      });

      // Now in READING stage
      expect(screen.getByTestId('stage-reading')).toBeInTheDocument();
      expect(screen.getByText(/Đọc kỹ đề: 05s/i)).toBeInTheDocument();

      // Shows question title and CV evidence
      expect(
        screen.getByText(/Kiểm chứng hiệu năng và tối ưu hệ thống Backend/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/Chi tiết trong CV của bạn bị HR soi:/i)).toBeInTheDocument();

      // Textarea must be locked
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea).toBeDisabled();
      expect(screen.getByText(/Hãy đọc kỹ câu hỏi! Bàn phím sẽ mở sau 05s/i)).toBeInTheDocument();

      // Advance by 2 seconds -> countdown displays 03s
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(screen.getByText(/Đọc kỹ đề: 03s/i)).toBeInTheDocument();

      // Advance remaining 3 seconds -> transitions to ANSWERING
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      // Now in ANSWERING stage
      expect(screen.getByTestId('stage-answering')).toBeInTheDocument();
      expect(screen.getByText('01:30')).toBeInTheDocument();
      expect(textarea).not.toBeDisabled();
    });
  });

  // -------------------------------------------------------------------------
  // 3. Stage 3: Danger Zone Indicator when timeLeft < 20s
  // -------------------------------------------------------------------------
  describe('Stage 3: Danger Zone Pulsing Border (< 20s)', () => {
    it('activates pulsing red border and danger warning when timeLeft drops below 20s', () => {
      vi.useFakeTimers();
      render(React.createElement(PressureInterviewRoom));

      // Start interview
      act(() => {
        screen.getByTestId('start-interview-btn').click();
      });

      // Pass 5s reading phase
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      const cardContainer = screen.getByTestId('stage-answering');

      // At 90s: Normal border
      expect(cardContainer).not.toHaveClass('border-red-500/80');
      expect(cardContainer).not.toHaveClass('animate-pulse');
      expect(screen.queryByText(/Sắp hết giờ! Chốt ý nhanh!/i)).not.toBeInTheDocument();

      // Advance 70s -> timeLeft = 20s (boundary)
      act(() => {
        vi.advanceTimersByTime(70000);
      });
      expect(screen.getByText('00:20')).toBeInTheDocument();

      // Advance 1s -> timeLeft = 19s (< 20s Danger Zone)
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByText('00:19')).toBeInTheDocument();

      // Danger zone visual indicators MUST be active
      expect(cardContainer).toHaveClass('border-red-500/80');
      expect(cardContainer).toHaveClass('animate-pulse');
      expect(screen.getByText(/⚠️ Sắp hết giờ! Chốt ý nhanh!/i)).toBeInTheDocument();

      const timerBox = screen.getByTestId('countdown-timer');
      expect(timerBox).toHaveClass('text-red-500');
      expect(timerBox).toHaveClass('animate-bounce');
    });
  });

  // -------------------------------------------------------------------------
  // 4. Anti-Cheat: onPaste Interception & Warning Banner
  // -------------------------------------------------------------------------
  describe('Stage 3: Anti-Cheat onPaste Interception', () => {
    it('allows paste if text length is <= 30 characters', () => {
      vi.useFakeTimers();
      render(React.createElement(PressureInterviewRoom));

      // Enter answering stage
      act(() => {
        screen.getByTestId('start-interview-btn').click();
        vi.advanceTimersByTime(5000);
      });

      const textarea = screen.getByRole('textbox');
      const shortText = 'git commit -m "fix bug"'; // 23 chars <= 30

      const pasteEvent = new Event('paste', { bubbles: true, cancelable: true });
      Object.defineProperty(pasteEvent, 'clipboardData', {
        value: {
          getData: () => shortText,
        },
      });

      act(() => {
        textarea.dispatchEvent(pasteEvent);
      });

      // Should NOT be prevented
      expect(pasteEvent.defaultPrevented).toBe(false);
      expect(screen.queryByTestId('cheat-warning')).not.toBeInTheDocument();
    });

    it('blocks paste > 30 characters, displays HR warning for 4s, and records penalty', () => {
      vi.useFakeTimers();
      render(React.createElement(PressureInterviewRoom));

      // Enter answering stage
      act(() => {
        screen.getByTestId('start-interview-btn').click();
        vi.advanceTimersByTime(5000);
      });

      const textarea = screen.getByRole('textbox');
      const chatGptLongResponse =
        'Theo mô hình STAR, trong tình huống p95 latency cao, tôi đã sử dụng k6 benchmark và tối ưu hóa index.'; // 102 chars > 30

      const pasteEvent = new Event('paste', { bubbles: true, cancelable: true });
      Object.defineProperty(pasteEvent, 'clipboardData', {
        value: {
          getData: () => chatGptLongResponse,
        },
      });

      act(() => {
        textarea.dispatchEvent(pasteEvent);
      });

      // Must be cancelled immediately
      expect(pasteEvent.defaultPrevented).toBe(true);

      // Warning banner must be visible with humorous HR copy
      const warning = screen.getByTestId('cheat-warning');
      expect(warning).toBeInTheDocument();
      expect(warning).toHaveTextContent(
        /Copy từ ChatGPT là HR gửi xe giùm bạn liền đó! Đang phỏng vấn trực tiếp trước mặt HR, không dùng phao cứu trợ từ ChatGPT nhé \(-10 điểm thái độ\)/i
      );

      // Advance by 3.9 seconds -> warning still present
      act(() => {
        vi.advanceTimersByTime(3900);
      });
      expect(screen.getByTestId('cheat-warning')).toBeInTheDocument();

      // Advance past 4 seconds -> warning automatically dismissed
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(screen.queryByTestId('cheat-warning')).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // 5. Auto-Submit on Timeout (90s) & Draft Text Preservation
  // -------------------------------------------------------------------------
  describe('Stage 3: Auto-Submit on Timeout & Draft Text Preservation', () => {
    it('preserves draft text when timer expires at 00:00 and advances smoothly', async () => {
      vi.useFakeTimers();
      render(React.createElement(PressureInterviewRoom));

      // Enter answering stage
      act(() => {
        screen.getByTestId('start-interview-btn').click();
      });
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      const textarea = screen.getByRole('textbox');

      // Candidate types unfinished draft answer
      fireEvent.change(textarea, {
        target: {
          value: 'Em dùng k6 test latency được 420ms, sau đó tối ưu redis...',
        },
      });

      // Countdown runs down completely (90 seconds)
      act(() => {
        vi.advanceTimersByTime(90000);
      });

      // System auto-submits draft and advances to Question 2 READING phase
      expect(screen.getByTestId('stage-reading')).toBeInTheDocument();
      expect(screen.getByText(/Vòng 2\/3 • Xử lý Sự cố Production/i)).toBeInTheDocument();
      expect(screen.getByText(/Đọc kỹ đề: 05s/i)).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // 6. Complete 5-Stage User Flow to RESULT & STAR Breakdown
  // -------------------------------------------------------------------------
  describe('Full 5-Stage User Flow: LOBBY -> READING -> ANSWERING -> EVALUATING -> RESULT', () => {
    it('navigates through all stages, evaluates answers, and renders 10/10 model answers and STAR checklist', async () => {
      vi.useFakeTimers();
      render(React.createElement(PressureInterviewRoom));

      // 1. LOBBY -> Start
      act(() => {
        screen.getByTestId('start-interview-btn').click();
      });

      // --- Question 1 ---
      // Reading 5s -> Answering
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(screen.getByTestId('stage-answering')).toBeInTheDocument();

      fireEvent.change(screen.getByRole('textbox'), {
        target: {
          value:
            'Ở dự án cũ, API bị chậm p95 ~ 400ms. Em phân tích query log phát hiện N+1, sau khi thêm Redis cache thì p95 giảm xuống 50ms.',
        },
      });

      // Submit Q1 early
      act(() => {
        screen.getByRole('button', { name: /Chốt câu trả lời/i }).click();
      });

      // --- Question 2 ---
      // Reading 5s -> Answering
      expect(screen.getByTestId('stage-reading')).toBeInTheDocument();
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      fireEvent.change(screen.getByRole('textbox'), {
        target: {
          value:
            'Trong 15 phút đầu, em kiểm tra Sentry và thực hiện rollback về bản release trước đó để chặn lỗi cho khách hàng.',
        },
      });

      // Submit Q2
      act(() => {
        screen.getByRole('button', { name: /Chốt câu trả lời/i }).click();
      });

      // --- Question 3 ---
      // Reading 5s -> Answering
      expect(screen.getByTestId('stage-reading')).toBeInTheDocument();
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      fireEvent.change(screen.getByRole('textbox'), {
        target: {
          value:
            'Trong 2 tuần đầu, em chủ động đọc repo, dựng môi trường local và nhận sửa các bug Jira tồn đọng.',
        },
      });

      // Submit Q3 (Final question) -> Triggers EVALUATING & RESULT
      act(() => {
        screen.getByRole('button', { name: /Nộp câu cuối/i }).click();
      });

      vi.useRealTimers();

      // Should enter RESULT stage
      await waitFor(() => {
        expect(screen.getByTestId('stage-result')).toBeInTheDocument();
      });

      // Check Verdict & Score
      expect(screen.getByText(/PHÁN QUYẾT CUỐI CÙNG TỪ PHÒNG PHỎNG VẤN/i)).toBeInTheDocument();
      expect(screen.getByText(/Điểm bản lĩnh/i)).toBeInTheDocument();

      // Check STAR breakdown labels
      expect(screen.getAllByText(/Bối cảnh \(Situation\/Task\)/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Hành động kỹ thuật \(Action\)/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Số liệu đo lường \(Result\)/i).length).toBeGreaterThanOrEqual(1);

      // Check 10/10 Model answers
      expect(
        screen.getAllByText(/Cách trả lời mẫu ăn điểm tuyệt đối \(Chuẩn STAR\):/i).length
      ).toBeGreaterThanOrEqual(1);

      // Check restart button returns to LOBBY
      const restartBtn = screen.getByRole('button', { name: /Thử thách lại lần nữa/i });
      act(() => {
        restartBtn.click();
      });
      expect(screen.getByTestId('stage-lobby')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // 7. CV Bridge: Custom Question Loading from sessionStorage
  // -------------------------------------------------------------------------
  describe('CV Bridge: Question Loading from sessionStorage', () => {
    it('detects custom interview questions stored in sessionStorage and displays CV badge', () => {
      const mockCustomQuestions = [
        {
          questionId: 'cv-q1',
          tag: 'Vòng 1/3 • Soi CV',
          title: 'Dự án Fintech 10k CCU trong CV',
          scenario: 'Trong CV ghi chịu tải 10k CCU.',
          pressureContext: 'Tech Lead yêu cầu chứng minh số lượng cluster.',
          question: 'Em đã cấu hình Auto-scaling group với chỉ số CPU metric thế nào?',
          timeLimitSeconds: 90,
          hint: 'Nêu cấu hình Kubernetes HPA hoặc AWS ASG.',
        },
        {
          questionId: 'cv-q2',
          tag: 'Vòng 2/3 • Soi CV',
          title: 'Bảo mật JWT Token trong CV',
          scenario: 'Trong CV ghi triển khai JWT an toàn.',
          pressureContext: 'Nếu Refresh Token bị lộ thì sao?',
          question: 'Em xử lý Token Revocation thế nào?',
          timeLimitSeconds: 90,
          hint: 'Nêu Redis blacklist hoặc Key rotation.',
        },
        {
          questionId: 'cv-q3',
          tag: 'Vòng 3/3 • Soi CV',
          title: 'Kinh nghiệm Lead nhóm 5 người',
          scenario: 'Trong CV ghi Lead nhóm đồ án.',
          pressureContext: 'Có thành viên không làm việc.',
          question: 'Em giải quyết thế nào trước ngày nộp 3 hôm?',
          timeLimitSeconds: 90,
          hint: 'Chia lại task và báo cáo giảng viên minh bạch.',
        },
      ];

      sessionStorage.setItem(
        'airoastcv_custom_interview_questions',
        JSON.stringify(mockCustomQuestions)
      );

      render(React.createElement(PressureInterviewRoom));

      // Verify CV context banner appears
      expect(
        screen.getByText(/Đã nạp 3 câu hỏi áp lực từ CV của bạn!/i)
      ).toBeInTheDocument();

      // Verify "Từ CV Vừa Roast" track option is available and selected
      expect(screen.getByText(/Từ CV Vừa Roast/i)).toBeInTheDocument();

      // Start interview with CV questions
      act(() => {
        screen.getByTestId('start-interview-btn').click();
      });

      // Reading phase shows custom question 1 title
      expect(screen.getByText(/Dự án Fintech 10k CCU trong CV/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Trong CV ghi chịu tải 10k CCU/i).length).toBeGreaterThanOrEqual(1);
    });

    it('also loads from alternative key ai_roast_cv_context', () => {
      sessionStorage.setItem(
        'ai_roast_cv_context',
        JSON.stringify({
          customQuestions: [
            {
              id: 'ctx-q1',
              title: 'Câu hỏi từ context',
              question: 'Tại sao lại ghi thông tin này?',
              scenario: 'Chi tiết trong CV',
              timeLimitSeconds: 90,
            },
          ],
        })
      );

      render(React.createElement(PressureInterviewRoom));

      expect(
        screen.getByText(/Đã nạp 3 câu hỏi áp lực từ CV của bạn!/i)
      ).toBeInTheDocument();
    });
  });
});
