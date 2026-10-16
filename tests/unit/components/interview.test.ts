import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InterviewPage from '@/app/interview/page';

describe('Milestone 3 UI Flow: /interview Experience', () => {
  const mockQuestion1 = {
    questionId: 'it-q1',
    role: 'it',
    questionIndex: 1,
    title: 'Bug nghiêm trọng sát giờ Release',
    scenario:
      '17:30 chiều thứ Sáu, phát hiện race condition module thanh toán...',
    pressureContext: 'PM đe dọa trừ KPI cả team nếu không release kịp...',
    timeLimitSeconds: 90,
  };

  const mockQuestion2 = {
    questionId: 'it-q2',
    role: 'it',
    questionIndex: 2,
    title: 'Xung đột kiến trúc & Đổ lỗi từ Senior',
    scenario: 'Server sập liên tục do memory leak...',
    pressureContext: 'Senior review hợp đồng thử việc của bạn...',
    timeLimitSeconds: 75,
  };

  const mockEvaluationResult = {
    questionIndex: 1,
    rubricScores: [
      {
        name: 'Cấu trúc STAR & Mạch lạc',
        score: 8,
        feedback: 'Mạch lạc, có bài học.',
      },
      {
        name: 'Tính cụ thể & Dẫn chứng',
        score: 7,
        feedback: 'Nêu công cụ trace log.',
      },
      {
        name: 'Mức độ liên quan & Đúng trọng tâm',
        score: 8,
        feedback: 'Giải quyết trực diện.',
      },
      {
        name: 'Nhận thức hệ quả & Tư duy xử lý',
        score: 9,
        feedback: 'Lường trước rủi ro tài chính.',
      },
    ],
    averageScore: 8.0,
    strengths: ['Tư duy kỹ thuật điềm tĩnh', 'Bảo vệ giá trị cốt lõi'],
    improvements: ['Cần chuẩn bị phương án dự phòng chi tiết hơn'],
    followUpQuestion: 'Nếu đối tác khiếu nại, bạn sẽ trình bày dữ liệu gì?',
    simulatedPressureVerdict: 'Vượt qua tình huống áp lực đầu tiên xuất sắc.',
  };

  beforeEach(() => {
    vi.restoreAllMocks();

    // Mock global.fetch
    global.fetch = vi.fn().mockImplementation((url: string, options: any) => {
      const body = options?.body ? JSON.parse(options.body) : {};

      if (url.includes('/api/interview/question')) {
        if (body.questionIndex === 1) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ success: true, data: mockQuestion1 }),
          });
        }
        if (body.questionIndex === 2) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ success: true, data: mockQuestion2 }),
          });
        }
      }

      if (url.includes('/api/interview/evaluate')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: mockEvaluationResult }),
        });
      }

      return Promise.reject(new Error(`Unhandled mock fetch URL: ${url}`));
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // -------------------------------------------------------------------------
  // 1. Role Selection Transitions to Question 1
  // -------------------------------------------------------------------------
  it('renders role chooser and transitions to Question 1 upon selecting IT role', async () => {
    const user = userEvent.setup();
    render(React.createElement(InterviewPage));

    // Step 1: Displays Role Chooser
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /phỏng vấn áp lực/i
    );
    const itRoleBtn = screen.getByRole('button', {
      name: /it.*software engineer/i,
    });
    const marketingRoleBtn = screen.getByRole('button', {
      name: /marketing.*business/i,
    });

    expect(itRoleBtn).toBeInTheDocument();
    expect(marketingRoleBtn).toBeInTheDocument();

    // Step 2: Click IT role
    await user.click(itRoleBtn);

    // Step 3: Displays Question 1 screen
    await waitFor(() => {
      expect(screen.getByText(/câu hỏi 1 \/ 3/i)).toBeInTheDocument();
      expect(
        screen.getByText(/bug nghiêm trọng sát giờ release/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/pm đe dọa trừ kpi/i)).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/nhập câu trả lời theo mô hình star/i)
      ).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // 2. Timer Countdown Ticking and Auto-Submit at 0s
  // -------------------------------------------------------------------------
  it('ticks countdown timer and triggers auto-submit when timer reaches 0s', async () => {
    vi.useFakeTimers();
    render(React.createElement(InterviewPage));

    // Transition to IT Question 1
    const itBtn = screen.getByRole('button', {
      name: /it.*software engineer/i,
    });
    await act(async () => {
      itBtn.click();
    });

    // Check initial timer display (90s)
    expect(screen.getByText(/90s|01:30/i)).toBeInTheDocument();

    // Advance timer by 30 seconds -> 60s remaining
    act(() => {
      vi.advanceTimersByTime(30000);
    });
    expect(screen.getByText(/60s|01:00/i)).toBeInTheDocument();

    // Advance timer by remaining 60 seconds -> 0s auto-submit
    await act(async () => {
      vi.advanceTimersByTime(60000);
    });

    // Auto-submit triggers API call
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/interview/evaluate'),
      expect.objectContaining({
        method: 'POST',
      })
    );
  });

  // -------------------------------------------------------------------------
  // 3. Skip Button Advances Question Immediately
  // -------------------------------------------------------------------------
  it('advances to Question 2 immediately when user clicks "Bỏ qua"', async () => {
    const user = userEvent.setup();
    render(React.createElement(InterviewPage));

    // Select IT track
    await user.click(
      screen.getByRole('button', { name: /it.*software engineer/i })
    );

    // Wait for Question 1
    await screen.findByText(/câu hỏi 1 \/ 3/i);

    // Click "Bỏ qua" (Skip) button
    const skipBtn = screen.getByRole('button', { name: /bỏ qua/i });
    await user.click(skipBtn);

    // Advances to Question 2
    await waitFor(() => {
      expect(screen.getByText(/câu hỏi 2 \/ 3/i)).toBeInTheDocument();
      expect(
        screen.getByText(/xung đột kiến trúc & đổ lỗi từ senior/i)
      ).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // 4. Quit Button Opens Confirmation Modal
  // -------------------------------------------------------------------------
  it('opens confirmation modal on Quit click, cancels, then confirms exit', async () => {
    const user = userEvent.setup();
    render(React.createElement(InterviewPage));

    // Select IT track
    await user.click(
      screen.getByRole('button', { name: /it.*software engineer/i })
    );
    await screen.findByText(/câu hỏi 1 \/ 3/i);

    // Click "Dừng phỏng vấn"
    const quitBtn = screen.getByRole('button', { name: /dừng phỏng vấn/i });
    await user.click(quitBtn);

    // Modal dialog opens
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getByText(/bạn có chắc chắn muốn dừng phỏng vấn/i)
    ).toBeInTheDocument();

    // Cancel quit -> resumes interview
    const cancelBtn = screen.getByRole('button', {
      name: /tiếp tục làm bài|hủy/i,
    });
    await user.click(cancelBtn);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText(/câu hỏi 1 \/ 3/i)).toBeInTheDocument();

    // Reopen and confirm quit
    await user.click(quitBtn);
    const confirmQuitBtn = screen.getByRole('button', {
      name: /xác nhận dừng/i,
    });
    await user.click(confirmQuitBtn);

    // Returns to initial role selection screen
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /it.*software engineer/i })
      ).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // 5. Rubric Display & Session Summary Disclaimer Presence
  // -------------------------------------------------------------------------
  it('renders 4 rubric criteria scores and mandatory simulation disclaimer on results screen', async () => {
    const user = userEvent.setup();
    render(React.createElement(InterviewPage));

    // Start interview
    await user.click(
      screen.getByRole('button', { name: /it.*software engineer/i })
    );
    await screen.findByText(/câu hỏi 1 \/ 3/i);

    // Type answer and submit
    const textarea = screen.getByPlaceholderText(
      /nhập câu trả lời theo mô hình star/i
    );
    await user.type(
      textarea,
      'Tôi sẽ áp dụng mô hình STAR để giải quyết sự cố.'
    );

    const submitBtn = screen.getByRole('button', { name: /gửi câu trả lời/i });
    await user.click(submitBtn);

    // Verify Rubric Breakdown rendered
    await waitFor(() => {
      expect(screen.getByText(/cấu trúc star & mạch lạc/i)).toBeInTheDocument();
      expect(screen.getByText(/tính cụ thể & dẫn chứng/i)).toBeInTheDocument();
      expect(
        screen.getByText(/mức độ liên quan & đúng trọng tâm/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/nhận thức hệ quả & tư duy xử lý/i)
      ).toBeInTheDocument();
    });

    // Verify Strengths, Improvements, and Follow-up question
    expect(screen.getByText(/tư duy kỹ thuật điềm tĩnh/i)).toBeInTheDocument();
    expect(screen.getByText(/nếu đối tác khiếu nại/i)).toBeInTheDocument();

    // Verify Mandatory Simulation Disclaimer
    expect(screen.getByText(/mô phỏng áp lực/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /không đại diện cho quyết định tuyển dụng thực tế|không cam kết việc làm/i
      )
    ).toBeInTheDocument();
  });
});
