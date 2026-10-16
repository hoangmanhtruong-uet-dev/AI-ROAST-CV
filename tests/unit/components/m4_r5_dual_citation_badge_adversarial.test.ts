import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import {
  PressureInterviewRoom,
  PressureQuestion,
} from '@/components/interview/PressureInterviewRoom';
import { WIPE_DATA_EVENT_NAME } from '@/lib/storage/wipe-data';

describe('Milestone 4 Adversarial Challenge: Dual-Citation & Badge Verification', () => {
  const BADGE_TEXT = '🎯 Phỏng vấn xoáy theo JD mục tiêu';

  const mockApiEvaluation = {
    questionIndex: 1,
    rubricScores: [
      { name: 'Cấu trúc STAR & Mạch lạc', score: 9, feedback: 'Rất tốt' },
      { name: 'Tính cụ thể & Dẫn chứng', score: 8, feedback: 'Cụ thể' },
      { name: 'Mức độ liên quan & Đúng trọng tâm', score: 9, feedback: 'Đúng trọng tâm' },
      { name: 'Nhận thức hệ quả & Tư duy xử lý', score: 8, feedback: 'Tư duy tốt' },
    ],
    averageScore: 8.5,
    strengths: ['Tư duy kỹ thuật tốt'],
    improvements: ['Bổ sung thêm metrics'],
    followUpQuestion: 'Phương án mở rộng tiếp theo là gì?',
    simulatedPressureVerdict: 'Vượt ải xuất sắc.',
  };

  const mockJdFullContext = {
    hasJdTarget: true,
    targetRole: 'Senior Backend Engineer',
    jdMatch: {
      matchScore: 72,
      breakdown: { hardSkillsMatch: 70, experienceMatch: 65, cultureMatch: 80 },
      missingKeywords: ['Kafka', 'Redis', 'Docker'],
      tailoredRecommendations: ['Bổ sung kiến trúc event-driven với Kafka.'],
    },
    customQuestions: [
      {
        questionId: 'jd-c1',
        tag: 'Vòng 1/3 • Xoáy JD & CV',
        title: 'Chất vấn tải cao Redis/Kafka',
        cvEvidence: 'Chỉ có kinh nghiệm làm đồ án monolith với MySQL đơn lẻ.',
        jdEvidence: 'JD bắt buộc 2 năm thiết kế hệ thống Microservices chịu tải cao với Redis và Kafka.',
        scenario: 'JD yêu cầu Microservices tải cao nhưng CV chỉ có MySQL.',
        pressureContext: 'Tech Lead yêu cầu chứng minh kiến trúc chịu tải 50k RPS.',
        question: 'Tại sao lại tự tin ứng tuyển khi thiếu hẳn kinh nghiệm Redis và Kafka?',
        timeLimitSeconds: 90,
        hint: 'Nêu giải pháp cache-aside và event stream buffer.',
        sampleBestAnswer: 'Em áp dụng Redis Cluster và Kafka event-driven để chia tải MySQL.',
      },
      {
        questionId: 'jd-c2',
        tag: 'Vòng 2/3 • Xoáy JD & CV',
        title: 'Kiểm thử và CI/CD tự động',
        cvEvidence: 'Chưa từng thiết lập pipeline CI/CD trên GitHub Actions.',
        jdEvidence: 'JD bắt buộc có quy trình tự động hóa kiểm thử Vitest và CI/CD.',
        scenario: 'JD đòi hỏi CI/CD tự động.',
        pressureContext: 'Đội ngũ DevOps không chấp nhận deploy thủ công.',
        question: 'Nếu không biết CI/CD, em làm sao đảm bảo code không phá hủy production?',
        timeLimitSeconds: 90,
        hint: 'Nêu quy trình pre-commit hook và GitHub Actions workflow.',
        sampleBestAnswer: 'Em dựng workflow yaml với lint -> test -> build tự động trước merge.',
      },
      {
        questionId: 'jd-c3',
        tag: 'Vòng 3/3 • Xoáy JD & CV',
        title: 'Containerization Docker & Kubernetes',
        cvEvidence: 'Chỉ chạy ứng dụng trực tiếp bằng npm run dev trên máy cá nhân.',
        jdEvidence: 'JD yêu cầu thành thạo Docker compose và triển khai Kubernetes cluster.',
        scenario: 'JD yêu cầu thành thạo Docker và K8s.',
        pressureContext: 'Môi trường prod hoàn toàn chạy trên K8s.',
        question: 'Làm thế nào em đóng gói Docker multi-stage tối ưu dung lượng dưới 100MB?',
        timeLimitSeconds: 90,
        hint: 'Nêu Alpine base image và tách biệt build stage.',
        sampleBestAnswer: 'Em sử dụng node:alpine và multi-stage build để tối ưu image.',
      },
    ],
  };

  const mockCvOnlyContext = {
    hasJdTarget: false,
    customQuestions: [
      {
        questionId: 'cv-only-1',
        tag: 'Vòng 1/3 • Soi CV Cá Nhân',
        title: 'Số liệu p95 trong CV',
        cvEvidence: 'Tối ưu hệ thống giảm thời gian phản hồi.',
        scenario: 'CV ghi tối ưu nhưng không có con số.',
        pressureContext: 'Bắt bẻ số liệu thực tế.',
        question: 'Con số cụ thể là bao nhiêu ms?',
        timeLimitSeconds: 90,
      },
      {
        questionId: 'cv-only-2',
        tag: 'Vòng 2/3 • Soi CV Cá Nhân',
        title: 'Khủng hoảng đêm thứ 6',
        cvEvidence: 'Chịu được áp lực công việc cao.',
        scenario: 'Sự cố đêm thứ 6.',
        pressureContext: 'Lead đi vắng.',
        question: 'Em xử lý sự cố thế nào?',
        timeLimitSeconds: 90,
      },
      {
        questionId: 'cv-only-3',
        tag: 'Vòng 3/3 • Soi CV Cá Nhân',
        title: 'Giá trị trong 2 tuần đầu',
        cvEvidence: 'Ham học hỏi và cầu tiến.',
        scenario: 'Công ty cần người tạo giá trị ngay.',
        pressureContext: 'Không có người cầm tay chỉ việc.',
        question: 'Em đóng góp được gì trong 2 tuần?',
        timeLimitSeconds: 90,
      },
    ],
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
  });

  // =========================================================================
  // TASK 1: VERIFY WHEN JD IS PRESENT -> BADGE APPEARS IN ALL 4 STAGES
  // =========================================================================
  describe('Task 1: JD is Present -> Badge "🎯 Phỏng vấn xoáy theo JD mục tiêu" in LOBBY, READING, ANSWERING, RESULT', () => {
    it('shows exact badge in LOBBY, READING, ANSWERING, and RESULT stages in unbroken sequence', async () => {
      vi.useFakeTimers();
      sessionStorage.setItem('ai_roast_cv_context', JSON.stringify(mockJdFullContext));

      render(React.createElement(PressureInterviewRoom));

      // --- STAGE 1: LOBBY ---
      expect(screen.getByTestId('stage-lobby')).toBeInTheDocument();
      const lobbyBadge = screen.getByTestId('lobby-jd-badge');
      expect(lobbyBadge).toBeInTheDocument();
      expect(lobbyBadge.textContent?.trim()).toBe(BADGE_TEXT);

      // Track button also reflects JD mode
      expect(screen.getByText(/🎯 Theo JD/i)).toBeInTheDocument();

      // Click CTA to enter interview
      act(() => {
        screen.getByTestId('start-interview-btn').click();
      });

      // --- STAGE 2: READING ---
      expect(screen.getByTestId('stage-reading')).toBeInTheDocument();
      const readingBadge = screen.getByTestId('stage-jd-badge');
      expect(readingBadge).toBeInTheDocument();
      expect(readingBadge.textContent?.trim()).toBe(BADGE_TEXT);

      // Verify Dual-Citation block is active during READING
      expect(screen.getByTestId('dual-citation-block')).toBeInTheDocument();
      expect(screen.getByTestId('cv-evidence-card')).toBeInTheDocument();
      expect(screen.getByTestId('jd-evidence-card')).toBeInTheDocument();
      expect(screen.queryByTestId('single-citation-block')).not.toBeInTheDocument();

      // Textarea is locked during READING
      expect(screen.getByRole('textbox')).toBeDisabled();

      // Advance reading countdown (5 seconds) -> transitions to ANSWERING
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // --- STAGE 3: ANSWERING ---
      expect(screen.getByTestId('stage-answering')).toBeInTheDocument();
      const answeringBadge = screen.getByTestId('stage-jd-badge');
      expect(answeringBadge).toBeInTheDocument();
      expect(answeringBadge.textContent?.trim()).toBe(BADGE_TEXT);

      // Verify Dual-Citation block persists during ANSWERING
      expect(screen.getByTestId('dual-citation-block')).toBeInTheDocument();
      expect(screen.getByTestId('cv-evidence-card')).toBeInTheDocument();
      expect(screen.getByTestId('jd-evidence-card')).toBeInTheDocument();
      expect(screen.queryByTestId('single-citation-block')).not.toBeInTheDocument();

      // Textarea unlocked for answering
      const textarea = screen.getByRole('textbox');
      expect(textarea).not.toBeDisabled();

      // Submit Q1
      fireEvent.change(textarea, {
        target: {
          value: 'Em dùng Redis cache-aside và Kafka buffer 50000 req/s để giảm tải cho MySQL.',
        },
      });
      act(() => {
        screen.getByRole('button', { name: /Chốt câu trả lời/i }).click();
      });

      // --- Q2: Reading 5s -> Answering -> Submit
      expect(screen.getByTestId('stage-reading')).toBeInTheDocument();
      expect(screen.getByTestId('stage-jd-badge')).toHaveTextContent(BADGE_TEXT);
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(screen.getByTestId('stage-answering')).toBeInTheDocument();
      expect(screen.getByTestId('stage-jd-badge')).toHaveTextContent(BADGE_TEXT);
      fireEvent.change(screen.getByRole('textbox'), {
        target: {
          value: 'Em thiết lập GitHub Actions với 4 luồng lint test build deploy staging.',
        },
      });
      act(() => {
        screen.getByRole('button', { name: /Chốt câu trả lời/i }).click();
      });

      // --- Q3: Reading 5s -> Answering -> Submit final
      expect(screen.getByTestId('stage-reading')).toBeInTheDocument();
      expect(screen.getByTestId('stage-jd-badge')).toHaveTextContent(BADGE_TEXT);
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(screen.getByTestId('stage-answering')).toBeInTheDocument();
      expect(screen.getByTestId('stage-jd-badge')).toHaveTextContent(BADGE_TEXT);
      fireEvent.change(screen.getByRole('textbox'), {
        target: {
          value: 'Em cấu hình Docker multi-stage build với Alpine để image dưới 80MB.',
        },
      });
      act(() => {
        screen.getByRole('button', { name: /Nộp câu cuối/i }).click();
      });

      vi.useRealTimers();

      // --- STAGE 5: RESULT ---
      await waitFor(() => {
        expect(screen.getByTestId('stage-result')).toBeInTheDocument();
      });

      const resultBadge = screen.getByTestId('result-jd-badge');
      expect(resultBadge).toBeInTheDocument();
      expect(resultBadge.textContent?.trim()).toBe(BADGE_TEXT);
    });
  });

  // =========================================================================
  // TASK 2: VERIFY WHEN JD IS ABSENT -> BADGE ABSENT EVERYWHERE & SINGLE CITATION
  // =========================================================================
  describe('Task 2: JD is Absent -> Badge DOES NOT appear anywhere & Dual-Citation replaced by Single-Citation', () => {
    it('Subcase 2.1: Default track (Zero Context) -> No badges anywhere, Single-Citation block rendered in Reading/Answering', async () => {
      vi.useFakeTimers();
      // Completely empty sessionStorage
      render(React.createElement(PressureInterviewRoom));

      // 1. LOBBY
      expect(screen.getByTestId('stage-lobby')).toBeInTheDocument();
      expect(screen.queryByTestId('lobby-jd-badge')).not.toBeInTheDocument();
      expect(screen.queryByTestId('stage-jd-badge')).not.toBeInTheDocument();
      expect(screen.queryByTestId('result-jd-badge')).not.toBeInTheDocument();
      expect(screen.queryByText(BADGE_TEXT)).not.toBeInTheDocument();
      expect(screen.queryByText(/🎯 Theo JD/i)).not.toBeInTheDocument();

      // Start interview
      act(() => {
        screen.getByTestId('start-interview-btn').click();
      });

      // 2. READING
      expect(screen.getByTestId('stage-reading')).toBeInTheDocument();
      expect(screen.queryByTestId('stage-jd-badge')).not.toBeInTheDocument();
      expect(screen.queryByText(BADGE_TEXT)).not.toBeInTheDocument();

      // Dual-Citation block must NOT exist
      expect(screen.queryByTestId('dual-citation-block')).not.toBeInTheDocument();
      expect(screen.queryByTestId('jd-evidence-card')).not.toBeInTheDocument();
      expect(screen.queryByText(/Soi chiếu lỗ hổng: CV vs JD Mục Tiêu/i)).not.toBeInTheDocument();

      // Single-Citation block MUST exist
      const singleBlockReading = screen.getByTestId('single-citation-block');
      expect(singleBlockReading).toBeInTheDocument();
      expect(singleBlockReading).toHaveTextContent(/Chi tiết trong CV của bạn bị HR soi:/i);
      expect(singleBlockReading).toHaveTextContent(/Tối ưu hiệu năng hệ thống Backend/i);

      // Advance 5s reading
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // 3. ANSWERING
      expect(screen.getByTestId('stage-answering')).toBeInTheDocument();
      expect(screen.queryByTestId('stage-jd-badge')).not.toBeInTheDocument();
      expect(screen.queryByText(BADGE_TEXT)).not.toBeInTheDocument();
      expect(screen.queryByTestId('dual-citation-block')).not.toBeInTheDocument();
      expect(screen.getByTestId('single-citation-block')).toBeInTheDocument();

      // Submit Q1
      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: 'Em tối ưu database indexing p95 latency từ 400ms xuống 40ms.' },
      });
      act(() => {
        screen.getByRole('button', { name: /Chốt câu trả lời/i }).click();
      });

      // Q2
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(screen.queryByTestId('stage-jd-badge')).not.toBeInTheDocument();
      expect(screen.queryByTestId('dual-citation-block')).not.toBeInTheDocument();
      expect(screen.getByTestId('single-citation-block')).toBeInTheDocument();
      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: 'Em rollback version cũ trong 5 phút để bảo vệ khách hàng.' },
      });
      act(() => {
        screen.getByRole('button', { name: /Chốt câu trả lời/i }).click();
      });

      // Q3
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(screen.queryByTestId('stage-jd-badge')).not.toBeInTheDocument();
      expect(screen.queryByTestId('dual-citation-block')).not.toBeInTheDocument();
      expect(screen.getByTestId('single-citation-block')).toBeInTheDocument();
      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: 'Em đọc repo, nhận sửa bug nhỏ Jira và bổ sung unit test.' },
      });
      act(() => {
        screen.getByRole('button', { name: /Nộp câu cuối/i }).click();
      });

      vi.useRealTimers();

      // 4. RESULT
      await waitFor(() => {
        expect(screen.getByTestId('stage-result')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('result-jd-badge')).not.toBeInTheDocument();
      expect(screen.queryByText(BADGE_TEXT)).not.toBeInTheDocument();
    });

    it('Subcase 2.2: CV context Present from Roast WITHOUT JD -> No JD badge anywhere, Single-Citation rendered', async () => {
      vi.useFakeTimers();
      sessionStorage.setItem('ai_roast_cv_context', JSON.stringify(mockCvOnlyContext));

      render(React.createElement(PressureInterviewRoom));

      // 1. LOBBY
      expect(screen.getByTestId('stage-lobby')).toBeInTheDocument();
      // Banner for CV questions is shown
      expect(screen.getByText(/Đã nạp 3 câu hỏi áp lực từ CV của bạn!/i)).toBeInTheDocument();
      // BUT JD badge must NOT be present
      expect(screen.queryByTestId('lobby-jd-badge')).not.toBeInTheDocument();
      expect(screen.queryByText(BADGE_TEXT)).not.toBeInTheDocument();
      expect(screen.queryByText(/🎯 Theo JD/i)).not.toBeInTheDocument();

      // Start interview
      act(() => {
        screen.getByTestId('start-interview-btn').click();
      });

      // 2. READING
      expect(screen.getByTestId('stage-reading')).toBeInTheDocument();
      expect(screen.queryByTestId('stage-jd-badge')).not.toBeInTheDocument();
      expect(screen.queryByText(BADGE_TEXT)).not.toBeInTheDocument();
      expect(screen.queryByTestId('dual-citation-block')).not.toBeInTheDocument();

      // Single citation must show CV evidence
      const singleBlock = screen.getByTestId('single-citation-block');
      expect(singleBlock).toBeInTheDocument();
      expect(singleBlock).toHaveTextContent(/Tối ưu hệ thống giảm thời gian phản hồi/i);

      // Advance 5s reading -> ANSWERING
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(screen.getByTestId('stage-answering')).toBeInTheDocument();
      expect(screen.queryByTestId('stage-jd-badge')).not.toBeInTheDocument();
      expect(screen.queryByText(BADGE_TEXT)).not.toBeInTheDocument();
      expect(screen.queryByTestId('dual-citation-block')).not.toBeInTheDocument();
      expect(screen.getByTestId('single-citation-block')).toBeInTheDocument();

      // Submit through all questions
      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: 'Latency giảm từ 300ms xuống 35ms qua Redis.' },
      });
      act(() => {
        screen.getByRole('button', { name: /Chốt câu trả lời/i }).click();
      });

      act(() => {
        vi.advanceTimersByTime(5000);
      });
      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: 'Rollback và viết integration test.' },
      });
      act(() => {
        screen.getByRole('button', { name: /Chốt câu trả lời/i }).click();
      });

      act(() => {
        vi.advanceTimersByTime(5000);
      });
      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: 'Dựng local dev và fix UI bug Jira.' },
      });
      act(() => {
        screen.getByRole('button', { name: /Nộp câu cuối/i }).click();
      });

      vi.useRealTimers();

      // RESULT stage
      await waitFor(() => {
        expect(screen.getByTestId('stage-result')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('result-jd-badge')).not.toBeInTheDocument();
      expect(screen.queryByText(BADGE_TEXT)).not.toBeInTheDocument();
    });
  });

  // =========================================================================
  // TASK 3: ADVERSARIAL STRESS TESTING & EDGE CASES
  // =========================================================================
  describe('Adversarial Stress Testing & Edge Cases', () => {
    it('Stress Test 1: extractEvidenceFromQuestion scenario regex parsing activates Dual-Citation when jdEvidence field is omitted', () => {
      vi.useFakeTimers();
      // Context has hasJdTarget=true, but questions only have scenario text with standard regex pattern
      const contextWithRegexScenario = {
        hasJdTarget: true,
        customQuestions: [
          {
            id: 'regex-q1',
            tag: 'Vòng 1/3 • Xoáy JD & CV',
            title: 'Chất vấn regex',
            scenario: 'JD yêu cầu kinh nghiệm tải cao với Redis. Tuy nhiên, trong CV bạn chỉ có đồ án SQLite.',
            question: 'Em giải thích sao?',
            timeLimitSeconds: 90,
          },
        ],
      };
      sessionStorage.setItem('ai_roast_cv_context', JSON.stringify(contextWithRegexScenario));

      render(React.createElement(PressureInterviewRoom));

      act(() => {
        screen.getByTestId('start-interview-btn').click();
      });

      // Dual-Citation should be extracted from scenario
      expect(screen.getByTestId('dual-citation-block')).toBeInTheDocument();
      const jdCard = screen.getByTestId('jd-evidence-card');
      expect(jdCard).toHaveTextContent(/kinh nghiệm tải cao với Redis\./i);
      const cvCard = screen.getByTestId('cv-evidence-card');
      expect(cvCard).toHaveTextContent(/bạn chỉ có đồ án SQLite\./i);
      expect(screen.getByTestId('stage-jd-badge')).toBeInTheDocument();
    });

    it('Stress Test 2: Fallback to missingKeywords from jdMatch when question has no evidence fields or scenario regex', () => {
      vi.useFakeTimers();
      const contextWithMissingKeywords = {
        hasJdTarget: true,
        targetRole: 'DevOps Specialist',
        jdMatch: {
          missingKeywords: ['Terraform', 'Ansible'],
        },
        customQuestions: [
          {
            id: 'kw-q1',
            tag: 'Vòng 1/3 • Xoáy JD & CV',
            title: 'Chất vấn thiếu từ khóa',
            scenario: 'Công ty cần tuyển vị trí này gấp.',
            question: 'Em đã dùng Terraform chưa?',
            timeLimitSeconds: 90,
          },
        ],
      };
      sessionStorage.setItem('ai_roast_cv_context', JSON.stringify(contextWithMissingKeywords));

      render(React.createElement(PressureInterviewRoom));

      act(() => {
        screen.getByTestId('start-interview-btn').click();
      });

      expect(screen.getByTestId('dual-citation-block')).toBeInTheDocument();
      const jdCard = screen.getByTestId('jd-evidence-card');
      expect(jdCard).toHaveTextContent(/Yêu cầu vị trí DevOps Specialist: Bắt buộc có kinh nghiệm thực chiến với Terraform\./i);
      expect(screen.getByTestId('stage-jd-badge')).toBeInTheDocument();
    });

    it('Stress Test 3: Wipe Data event immediately strips JD context, resets stage to LOBBY, and removes all badges', () => {
      vi.useFakeTimers();
      sessionStorage.setItem('ai_roast_cv_context', JSON.stringify(mockJdFullContext));

      render(React.createElement(PressureInterviewRoom));

      // Verify JD badge initially present in LOBBY
      expect(screen.getByTestId('lobby-jd-badge')).toBeInTheDocument();

      // Enter reading phase
      act(() => {
        screen.getByTestId('start-interview-btn').click();
      });
      expect(screen.getByTestId('stage-reading')).toBeInTheDocument();
      expect(screen.getByTestId('stage-jd-badge')).toBeInTheDocument();

      // Trigger Wipe Data
      act(() => {
        window.dispatchEvent(new CustomEvent(WIPE_DATA_EVENT_NAME));
      });

      // Must be returned to LOBBY
      expect(screen.getByTestId('stage-lobby')).toBeInTheDocument();

      // Badges must be eradicated
      expect(screen.queryByTestId('lobby-jd-badge')).not.toBeInTheDocument();
      expect(screen.queryByTestId('stage-jd-badge')).not.toBeInTheDocument();
      expect(screen.queryByText(BADGE_TEXT)).not.toBeInTheDocument();
    });

    it('Stress Test 4: Explicit hasJdTarget={false} prop prevents badge even if questions carry stray jdEvidence', () => {
      vi.useFakeTimers();
      // Questions carry jdEvidence, but parent explicitly passed hasJdTarget={false}
      // Note: when no sessionStorage is set, hasJdTarget prop controls hasJdContext
      render(React.createElement(PressureInterviewRoom, { hasJdTarget: false }));

      expect(screen.queryByTestId('lobby-jd-badge')).not.toBeInTheDocument();
      expect(screen.queryByText(BADGE_TEXT)).not.toBeInTheDocument();

      act(() => {
        screen.getByTestId('start-interview-btn').click();
      });

      expect(screen.queryByTestId('stage-jd-badge')).not.toBeInTheDocument();
      expect(screen.queryByText(BADGE_TEXT)).not.toBeInTheDocument();
    });
  });
});
