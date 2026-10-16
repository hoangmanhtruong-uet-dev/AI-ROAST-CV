import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import {
  PressureInterviewRoom,
  PressureQuestion,
} from '@/components/interview/PressureInterviewRoom';

describe('Adversarial Challenge: Milestone 4 PressureInterviewRoom Stress Harness', () => {
  const mockApiEvaluation = {
    questionIndex: 1,
    rubricScores: [
      { name: 'Cấu trúc STAR & Mạch lạc', score: 8, feedback: 'Tốt' },
      { name: 'Tính cụ thể & Dẫn chứng', score: 8, feedback: 'Tốt' },
      { name: 'Mức độ liên quan & Đúng trọng tâm', score: 8, feedback: 'Tốt' },
      { name: 'Nhận thức hệ quả & Tư duy xử lý', score: 8, feedback: 'Tốt' },
    ],
    averageScore: 8.0,
    strengths: ['Tư duy kỹ thuật tốt'],
    improvements: ['Bổ sung số liệu'],
    followUpQuestion: 'Câu hỏi đào sâu?',
    simulatedPressureVerdict: 'Đạt yêu cầu tối thiểu.',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
    localStorage.clear();

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
    localStorage.clear();
  });

  // =========================================================================
  // Challenge Dimension 1: Corrupted or Partial sessionStorage Data
  // =========================================================================
  describe('Dimension 1: Corrupted or Partial sessionStorage Data Resilience', () => {
    it('gracefully handles malformed JSON in both sessionStorage keys without crashing', () => {
      sessionStorage.setItem('ai_roast_cv_context', '{malformed_json: true, unterminated');
      sessionStorage.setItem('airoastcv_custom_interview_questions', '[{bad_array:');

      expect(() => {
        render(React.createElement(PressureInterviewRoom));
      }).not.toThrow();

      // Defaults to LOBBY with standard IT questions
      expect(screen.getByTestId('stage-lobby')).toBeInTheDocument();
      expect(screen.getByText(/PRESSURE INTERVIEW SIMULATOR/i)).toBeInTheDocument();
      expect(screen.getByText(/Kiểm chứng số liệu, sự cố Prod, văn hóa Fresher/i)).toBeInTheDocument();
    });

    it('gracefully handles empty object context {} (missing questions, missing jdMatch)', () => {
      sessionStorage.setItem('ai_roast_cv_context', JSON.stringify({}));

      expect(() => {
        render(React.createElement(PressureInterviewRoom));
      }).not.toThrow();

      expect(screen.getByTestId('stage-lobby')).toBeInTheDocument();
      // Should not show JD badge or CV tailored track
      expect(screen.queryByTestId('lobby-jd-badge')).not.toBeInTheDocument();
      expect(screen.queryByText(/Từ CV Vừa Roast/i)).not.toBeInTheDocument();
    });

    it('gracefully handles missing jdMatch when hasJdTarget is true', () => {
      sessionStorage.setItem(
        'ai_roast_cv_context',
        JSON.stringify({
          hasJdTarget: true,
          targetRole: 'DevOps Engineer',
          // jdMatch is explicitly undefined/missing
          customQuestions: [
            {
              questionId: 'q-partial-1',
              question: 'Làm sao giải quyết race condition?',
              scenario: 'Hệ thống bị nghẽn.',
            },
          ],
        })
      );

      render(React.createElement(PressureInterviewRoom));

      // Badge should render because hasJdTarget is true
      expect(screen.getByTestId('lobby-jd-badge')).toBeInTheDocument();
      expect(screen.getByText(/DevOps Engineer/i)).toBeInTheDocument();
    });

    it('gracefully handles questions with empty strings for all fields', () => {
      vi.useFakeTimers();
      sessionStorage.setItem(
        'ai_roast_cv_context',
        JSON.stringify({
          hasJdTarget: true,
          targetRole: 'Tester',
          customQuestions: [
            {
              questionId: '',
              tag: '',
              title: '',
              question: '',
              scenario: '',
              cvEvidence: '',
              jdEvidence: '',
              pressureContext: '',
              hint: '',
              sampleBestAnswer: '',
            },
          ],
        })
      );

      expect(() => {
        render(React.createElement(PressureInterviewRoom));
      }).not.toThrow();

      // Start interview
      act(() => {
        screen.getByTestId('start-interview-btn').click();
      });

      // READING stage should render without crashing
      expect(screen.getByTestId('stage-reading')).toBeInTheDocument();

      // Advance to ANSWERING
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(screen.getByTestId('stage-answering')).toBeInTheDocument();
    });

    it('gracefully handles questions without scenario or evidence fields', () => {
      vi.useFakeTimers();
      sessionStorage.setItem(
        'ai_roast_cv_context',
        JSON.stringify({
          hasJdTarget: false,
          customQuestions: [
            {
              questionId: 'q-no-scenario',
              question: 'Tại sao bạn chọn công ty chúng tôi?',
              // scenario, cvEvidence, jdEvidence omitted entirely
            },
          ],
        })
      );

      render(React.createElement(PressureInterviewRoom));

      act(() => {
        screen.getByTestId('start-interview-btn').click();
      });

      expect(screen.getByTestId('stage-reading')).toBeInTheDocument();
      expect(screen.getByText(/Tại sao bạn chọn công ty chúng tôi\?/i)).toBeInTheDocument();
      // Falls back to single citation with default placeholder text
      expect(screen.getByTestId('single-citation-block')).toBeInTheDocument();
    });

    it('handles jdMatch with empty arrays (empty missingKeywords and tailoredRecommendations)', () => {
      vi.useFakeTimers();
      sessionStorage.setItem(
        'ai_roast_cv_context',
        JSON.stringify({
          hasJdTarget: true,
          targetRole: 'Data Analyst',
          jdMatch: {
            matchScore: 50,
            breakdown: { hardSkillsMatch: 50, experienceMatch: 50, cultureMatch: 50 },
            missingKeywords: [],
            tailoredRecommendations: [],
          },
          customQuestions: [
            {
              questionId: 'q-empty-jdmatch',
              question: 'Dữ liệu bị lệch phân phối, bạn xử lý sao?',
              scenario: 'Bảng số liệu không chuẩn.',
            },
          ],
        })
      );

      expect(() => {
        render(React.createElement(PressureInterviewRoom));
      }).not.toThrow();

      act(() => {
        screen.getByTestId('start-interview-btn').click();
      });

      expect(screen.getByTestId('stage-reading')).toBeInTheDocument();
      expect(screen.getByTestId('stage-jd-badge')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Challenge Dimension 2: Questions with null/undefined items in storage
  // =========================================================================
  describe('Dimension 2: Corrupted Question Array Items (null / undefined / primitives)', () => {
    it('does not crash component when customQuestions array contains null or non-object elements', () => {
      sessionStorage.setItem(
        'ai_roast_cv_context',
        JSON.stringify({
          hasJdTarget: true,
          targetRole: 'Backend Engineer',
          // Corrupted array containing null, undefined, primitive string
          customQuestions: [null, undefined, 'not-an-object'],
        })
      );

      // Should safely catch any TypeError during normalization and fall back to default questions
      expect(() => {
        render(React.createElement(PressureInterviewRoom));
      }).not.toThrow();

      expect(screen.getByTestId('stage-lobby')).toBeInTheDocument();
    });

    it('recovers safely and falls back to default questions when a question item is null', () => {
      sessionStorage.setItem(
        'airoastcv_custom_interview_questions',
        JSON.stringify([null])
      );

      expect(() => {
        render(React.createElement(PressureInterviewRoom));
      }).not.toThrow();

      // Component should be intact in LOBBY
      expect(screen.getByTestId('stage-lobby')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Challenge Dimension 3: 5-Stage Loop, 90s Countdown Expiration & Auto-Submit
  // =========================================================================
  describe('Dimension 3: 5-Stage Loop, 90s Countdown Expiration & Auto-Submit', () => {
    const singleQuestionContext = {
      hasJdTarget: false,
      customQuestions: [
        {
          questionId: 'auto-submit-q1',
          tag: 'Vòng 1/1 • Áp Lực Thời Gian',
          title: 'Khủng hoảng thời gian',
          cvEvidence: 'Kinh nghiệm xử lý sự cố nhanh.',
          scenario: 'Hệ thống sập, bạn chỉ có 90 giây để phản hồi.',
          pressureContext: 'Countdown đang đếm lùi về 00:00.',
          question: 'Em xử lý sự cố này từng bước như thế nào?',
          timeLimitSeconds: 90,
          hint: 'Nêu công cụ và bước làm.',
          sampleBestAnswer: 'Rollback ngay lập tức.',
        },
      ],
    };

    it('auto-submits when 90s countdown expires (timeLeft reaches 0), preserving candidate draft', async () => {
      vi.useFakeTimers();
      sessionStorage.setItem('ai_roast_cv_context', JSON.stringify(singleQuestionContext));

      render(React.createElement(PressureInterviewRoom));

      // Stage 1: LOBBY -> Start
      act(() => {
        screen.getByTestId('start-interview-btn').click();
      });

      // Stage 2: READING (5s countdown)
      expect(screen.getByTestId('stage-reading')).toBeInTheDocument();
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // Stage 3: ANSWERING (90s countdown)
      expect(screen.getByTestId('stage-answering')).toBeInTheDocument();
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

      // Candidate types partial draft
      fireEvent.change(textarea, {
        target: {
          value: 'Em đang gõ dở câu trả lời thì đồng hồ đếm ngược hết giờ...',
        },
      });

      // Danger zone verification: advance 71s (leaving 19s remaining)
      act(() => {
        vi.advanceTimersByTime(71000);
      });
      // Container should have danger zone styling (pulse / red border)
      const answeringContainer = screen.getByTestId('stage-answering');
      expect(answeringContainer.className).toMatch(/animate-pulse/);

      // Now advance the remaining 19s so timer reaches 0
      act(() => {
        vi.advanceTimersByTime(19000);
      });

      vi.useRealTimers();

      // Stage 4 & 5: Auto-submit should have fired automatically!
      // Transitions through EVALUATING to RESULT stage
      await waitFor(() => {
        expect(screen.getByTestId('stage-result')).toBeInTheDocument();
      });

      // Verify that candidate draft text was evaluated
      expect(screen.getByText(/PHÁN QUYẾT CUỐI CÙNG TỪ PHÒNG PHỎNG VẤN/i)).toBeInTheDocument();
    });

    it('transitions across all 3 questions via countdown auto-submit without manual button clicks', async () => {
      vi.useFakeTimers();
      // Use default IT questions (3 questions)
      render(React.createElement(PressureInterviewRoom));

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
        target: { value: 'Trả lời câu 1: Em rollback hệ thống ngay lập tức.' },
      });
      // Expire 90s on Q1
      act(() => {
        vi.advanceTimersByTime(90000);
      });

      // --- Question 2 ---
      // Automatically moves to READING for Q2
      expect(screen.getByTestId('stage-reading')).toBeInTheDocument();
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(screen.getByTestId('stage-answering')).toBeInTheDocument();
      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: 'Trả lời câu 2: Em kiểm tra Sentry log và phân tích stack trace.' },
      });
      // Expire 90s on Q2
      act(() => {
        vi.advanceTimersByTime(90000);
      });

      // --- Question 3 ---
      // Automatically moves to READING for Q3
      expect(screen.getByTestId('stage-reading')).toBeInTheDocument();
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(screen.getByTestId('stage-answering')).toBeInTheDocument();
      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: 'Trả lời câu 3: Em viết unit test và fix ticket tồn đọng.' },
      });
      // Expire 90s on Q3 -> triggers evaluateInterview
      act(() => {
        vi.advanceTimersByTime(90000);
      });

      vi.useRealTimers();

      // Automatically arrives at RESULT stage
      await waitFor(() => {
        expect(screen.getByTestId('stage-result')).toBeInTheDocument();
      });
      expect(screen.getByText(/PHÁN QUYẾT CUỐI CÙNG TỪ PHÒNG PHỎNG VẤN/i)).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Challenge Dimension 4: Anti-Paste Interceptor & Cheat Detection
  // =========================================================================
  describe('Dimension 4: Anti-Paste Interceptor Stress Testing', () => {
    it('allows pasting short snippets (<= 30 characters) without trigger warning or penalty', () => {
      vi.useFakeTimers();
      render(React.createElement(PressureInterviewRoom));

      act(() => {
        screen.getByTestId('start-interview-btn').click();
      });
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

      // Paste short text <= 30 chars
      const shortPaste = 'git checkout -b fix';
      const pasteEv = new Event('paste', { bubbles: true, cancelable: true });
      Object.defineProperty(pasteEv, 'clipboardData', {
        value: { getData: () => shortPaste },
      });

      act(() => {
        textarea.dispatchEvent(pasteEv);
      });

      // Should NOT prevent default
      expect(pasteEv.defaultPrevented).toBe(false);
      // Should NOT show cheat warning
      expect(screen.queryByTestId('cheat-warning')).not.toBeInTheDocument();
    });

    it('intercepts long paste (> 30 characters), prevents default, and displays HR warning', () => {
      vi.useFakeTimers();
      render(React.createElement(PressureInterviewRoom));

      act(() => {
        screen.getByTestId('start-interview-btn').click();
      });
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

      // Paste long text > 30 chars
      const longText = 'As an AI language model, I recommend implementing Redis caching with write-through policy...';
      const pasteEv = new Event('paste', { bubbles: true, cancelable: true });
      Object.defineProperty(pasteEv, 'clipboardData', {
        value: { getData: () => longText },
      });

      act(() => {
        textarea.dispatchEvent(pasteEv);
      });

      // MUST prevent default paste
      expect(pasteEv.defaultPrevented).toBe(true);
      // MUST show cheat warning alert
      const warning = screen.getByTestId('cheat-warning');
      expect(warning).toBeInTheDocument();
      expect(warning).toHaveTextContent(/Copy từ ChatGPT là HR gửi xe giùm bạn liền đó/i);

      // Warning automatically hides after 4 seconds
      act(() => {
        vi.advanceTimersByTime(4000);
      });
      expect(screen.queryByTestId('cheat-warning')).not.toBeInTheDocument();
    });

    it('deducts attitude points when candidate repeatedly attempts pasting', async () => {
      vi.useFakeTimers();
      render(React.createElement(PressureInterviewRoom));

      act(() => {
        screen.getByTestId('start-interview-btn').click();
      });
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      const longText = 'Paragraph generated by ChatGPT to cheat on technical pressure interview...';

      // Attempt 1
      const paste1 = new Event('paste', { bubbles: true, cancelable: true });
      Object.defineProperty(paste1, 'clipboardData', { value: { getData: () => longText } });
      act(() => { textarea.dispatchEvent(paste1); });

      // Attempt 2
      const paste2 = new Event('paste', { bubbles: true, cancelable: true });
      Object.defineProperty(paste2, 'clipboardData', { value: { getData: () => longText } });
      act(() => { textarea.dispatchEvent(paste2); });

      // Candidate then types manually
      fireEvent.change(textarea, {
        target: { value: 'Em tự viết câu trả lời sử dụng Redis cache và rollback hệ thống.' },
      });

      // Submit Q1, Q2, Q3
      act(() => {
        screen.getByRole('button', { name: /Chốt câu trả lời/i }).click();
      });

      // Q2
      act(() => { vi.advanceTimersByTime(5000); });
      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: 'Câu 2: Kiểm tra log và metric trên hệ thống giám sát.' },
      });
      act(() => {
        screen.getByRole('button', { name: /Chốt câu trả lời/i }).click();
      });

      // Q3
      act(() => { vi.advanceTimersByTime(5000); });
      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: 'Câu 3: Đóng góp ngay ticket nhỏ và cải thiện test coverage.' },
      });
      act(() => {
        screen.getByRole('button', { name: /Nộp câu cuối/i }).click();
      });

      vi.useRealTimers();

      await waitFor(() => {
        expect(screen.getByTestId('stage-result')).toBeInTheDocument();
      });

      // Result screen should mention paste penalty in HR comment
      expect(screen.getByText(/Bị trừ 20 điểm thái độ vì phát hiện cố tình copy/i)).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Challenge Dimension 5: Restart & Data Wipe Reset
  // =========================================================================
  describe('Dimension 5: Restart & Data Wipe Integration', () => {
    it('resets to LOBBY stage when "Làm lại từ đầu" is clicked on RESULT screen', async () => {
      vi.useFakeTimers();
      render(React.createElement(PressureInterviewRoom));

      act(() => {
        screen.getByTestId('start-interview-btn').click();
      });
      // Q1
      act(() => { vi.advanceTimersByTime(5000); });
      act(() => { screen.getByRole('button', { name: /Chốt câu trả lời/i }).click(); });
      // Q2
      act(() => { vi.advanceTimersByTime(5000); });
      act(() => { screen.getByRole('button', { name: /Chốt câu trả lời/i }).click(); });
      // Q3
      act(() => { vi.advanceTimersByTime(5000); });
      act(() => { screen.getByRole('button', { name: /Nộp câu cuối/i }).click(); });

      vi.useRealTimers();

      await waitFor(() => {
        expect(screen.getByTestId('stage-result')).toBeInTheDocument();
      });

      const restartBtn = screen.getByRole('button', { name: /Thử thách lại/i });
      act(() => {
        restartBtn.click();
      });

      expect(screen.getByTestId('stage-lobby')).toBeInTheDocument();
    });

    it('resets all state when WIPE_DATA_EVENT_NAME window event is dispatched', () => {
      vi.useFakeTimers();
      sessionStorage.setItem(
        'ai_roast_cv_context',
        JSON.stringify({
          hasJdTarget: true,
          targetRole: 'Data Engineer',
          customQuestions: [{ question: 'Big data question' }],
        })
      );

      render(React.createElement(PressureInterviewRoom));

      // Initially has JD context
      expect(screen.getByTestId('lobby-jd-badge')).toBeInTheDocument();

      // Trigger Wipe Data via official event name
      act(() => {
        window.dispatchEvent(new CustomEvent('airoastcv:data-wiped'));
      });

      // JD context and CV context should be cleared
      expect(screen.queryByTestId('lobby-jd-badge')).not.toBeInTheDocument();
      expect(screen.getByTestId('stage-lobby')).toBeInTheDocument();
    });
  });
});
