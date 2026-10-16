import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RoastPage from '@/app/roast/page';
import { RoastReport } from '@/components/roast/RoastReport';
import { OcrPreviewModal } from '@/components/roast/OcrPreviewModal';
import { ToneSelector } from '@/components/roast/ToneSelector';
import { FileUploader } from '@/components/roast/FileUploader';
import { RoastData } from '@/lib/schemas/roast';
import { maskPii } from '@/lib/utils/pii-masker';

describe('Adversarial Stress Testing: /roast User Journey & State Machine (Challenger 2)', () => {
  const mockValidCvText = `
    Nguyễn Văn A - Fresher Fullstack Developer
    Email: nguyenvana@example.com | Phone: 0912345678
    Mục tiêu: Tìm kiếm cơ hội làm việc tại vị trí Frontend / Fullstack.
    Kỹ năng: React, Next.js, TypeScript, Node.js, Tailwind CSS, PostgreSQL.
    Kinh nghiệm: Dự án E-commerce cá nhân với Next.js và Tailwind CSS.
  `.trim();

  const mockRoastResponse: { success: boolean; data: RoastData } = {
    success: true,
    data: {
      overallScore: 68,
      tone: 'spicy',
      summaryVerdict: 'CV còn mang tính liệt kê chung chung, thiếu số liệu định lượng về hiệu năng và quy mô người dùng.',
      topStrengths: [
        'Stack công nghệ hiện đại phù hợp với thị trường (Next.js, TypeScript)',
        'Bố cục trình bày các phần rõ ràng, dễ theo dõi',
      ],
      weaknesses: [
        {
          quote: 'Dự án E-commerce cá nhân với Next.js và Tailwind CSS',
          issue: 'Mô tả dự án quá sơ sài, không có số liệu kỹ thuật chứng minh',
          severity: 'Cao',
          rejectionReason: 'Nhà tuyển dụng không thấy được độ phức tạp kỹ thuật và giá trị thực tế của dự án',
          fixGuideline: 'Viết lại: Xây dựng nền tảng E-commerce với [Next.js 14], tối ưu điểm Lighthouse lên [95/100] và phục vụ [500] người dùng thử nghiệm.',
        },
        {
          quote: 'Kỹ năng: React, Next.js, TypeScript...',
          issue: 'Liệt kê kỹ năng dạng danh sách không có mức độ thành thạo',
          severity: 'Trung bình',
          rejectionReason: 'Không phân biệt được kỹ năng thực chiến hay chỉ mới học qua tutorial',
          fixGuideline: 'Phân nhóm kỹ năng theo: Thành thạo ([React], [TypeScript]) và Đã có kinh nghiệm làm việc ([PostgreSQL]).',
        },
        {
          quote: 'Mục tiêu: Tìm kiếm cơ hội làm việc...',
          issue: 'Mục tiêu nghề nghiệp sáo rỗng, chỉ nói về điều mình muốn nhận thay vì đóng góp',
          severity: 'Thấp',
          rejectionReason: 'Tạo cảm giác thụ động và thiếu định hướng phát triển rõ ràng',
          fixGuideline: 'Điều chỉnh thành: Đóng góp năng lực phát triển giao diện responsive và [tối ưu trải nghiệm người dùng] cho đội ngũ sản phẩm.',
        },
      ],
      atsRecommendations: [
        {
          category: 'Cấu trúc',
          recommendation: 'Sử dụng tiêu đề mục chuẩn ATS: "Kinh nghiệm làm việc", "Dự án cá nhân", "Kỹ năng chuyên môn".',
          impact: 'Quan trọng',
        },
        {
          category: 'Từ khóa',
          recommendation: 'Bổ sung các từ khóa kỹ thuật chuyên sâu như RESTful API, State Management, CI/CD.',
          impact: 'Nên làm',
        },
      ],
      disclaimer: 'Kết quả chỉ mang tính tham khảo luyện tập, không cam kết việc làm hay đỗ ATS.',
    },
  };

  let writeTextMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.restoreAllMocks();
    writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: writeTextMock,
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // =========================================================================
  // TASK 1A: Text paste tab with short text (< 50 chars) vs valid text
  // =========================================================================
  describe('1. Text Paste Tab: Length Boundaries & Validation (< 50 chars vs Valid)', () => {
    it('blocks submission and keeps submit button disabled for empty or whitespace text', async () => {
      const user = userEvent.setup();
      render(React.createElement(RoastPage));

      // Switch to text paste tab
      const textTab = screen.getByRole('tab', { name: /dán văn bản/i });
      await user.click(textTab);

      const textarea = screen.getByRole('textbox', { name: /nội dung cv/i });
      const submitBtn = screen.getByRole('button', { name: /bắt đầu roast cv/i });

      // Initially empty: button disabled
      expect(submitBtn).toBeDisabled();
      expect(screen.getByText('0 / 50.000 ký tự')).toBeInTheDocument();

      // Enter only spaces and newlines (10 characters total)
      fireEvent.change(textarea, { target: { value: '     \n\n   ' } });
      // Trimmed length is 0, so button must remain disabled
      expect(submitBtn).toBeDisabled();
      expect(screen.getByText('10 / 50.000 ký tự')).toBeInTheDocument();
    });

    it('blocks text shorter than 30 characters and shows Vietnamese error on direct form submit', async () => {
      render(React.createElement(RoastPage));

      const textTab = screen.getByRole('tab', { name: /dán văn bản/i });
      fireEvent.click(textTab);

      const textarea = screen.getByRole('textbox', { name: /nội dung cv/i });
      const submitBtn = screen.getByRole('button', { name: /bắt đầu roast cv/i });

      // Type 15 characters: "Fresher IT Dev!"
      fireEvent.change(textarea, { target: { value: 'Fresher IT Dev!' } });
      expect(submitBtn).toBeDisabled();
      expect(submitBtn).toHaveClass('cursor-not-allowed');

      // Verify character count indicator
      expect(screen.getByText(/15 \/ 50\.000 ký tự/i)).toBeInTheDocument();
    });

    it('enforces boundary at exactly 29 chars (invalid) vs 30 chars (valid boundary)', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockRoastResponse,
      });
      global.fetch = fetchMock;

      render(React.createElement(RoastPage));

      const textTab = screen.getByRole('tab', { name: /dán văn bản/i });
      fireEvent.click(textTab);

      const textarea = screen.getByRole('textbox', { name: /nội dung cv/i });
      const submitBtn = screen.getByRole('button', { name: /bắt đầu roast cv/i });

      // Exactly 29 characters
      const text29 = 'a'.repeat(29);
      fireEvent.change(textarea, { target: { value: text29 } });
      expect(submitBtn).toBeDisabled();
      expect(screen.getByText(/29 \/ 50\.000 ký tự/i)).toBeInTheDocument();

      // Exactly 30 characters
      const text30 = text29 + 'b';
      fireEvent.change(textarea, { target: { value: text30 } });
      expect(submitBtn).not.toBeDisabled();
      expect(screen.getByText(/30 \/ 50\.000 ký tự/i)).toBeInTheDocument();

      // Submitting 30 characters succeeds and triggers /api/roast
      fireEvent.click(submitBtn);
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          '/api/roast',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              cvText: text30,
              tone: 'spicy',
            }),
          })
        );
      });
    });

    it('accepts valid text between 30 and 50 characters (e.g. 45 chars) and submits correctly', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockRoastResponse,
      });
      global.fetch = fetchMock;

      render(React.createElement(RoastPage));

      const textTab = screen.getByRole('tab', { name: /dán văn bản/i });
      fireEvent.click(textTab);

      const textarea = screen.getByRole('textbox', { name: /nội dung cv/i });
      const text45 = 'Nguyen Van A - Sinh vien Cong nghe Thong tin!'; // exactly 45 chars
      expect(text45.length).toBe(45);

      fireEvent.change(textarea, { target: { value: text45 } });

      const submitBtn = screen.getByRole('button', { name: /bắt đầu roast cv/i });
      expect(submitBtn).not.toBeDisabled();

      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          '/api/roast',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              cvText: text45,
              tone: 'spicy',
            }),
          })
        );
      });
    });

    it('FileUploader rejects text exceeding 50,000 characters with client error', () => {
      const handleTextSubmit = vi.fn();
      render(
        React.createElement(FileUploader, {
          onFileSelected: vi.fn(),
          onTextSubmit: handleTextSubmit,
        })
      );

      // Switch to text tab
      const textTab = screen.getByRole('tab', { name: /dán văn bản/i });
      fireEvent.click(textTab);

      const textarea = screen.getByRole('textbox', { name: /nội dung cv/i });
      const hugeText = 'x'.repeat(50001);

      fireEvent.change(textarea, { target: { value: hugeText } });

      const form = textarea.closest('form');
      expect(form).not.toBeNull();
      if (form) {
        fireEvent.submit(form);
      }

      expect(handleTextSubmit).not.toHaveBeenCalled();
      expect(screen.getByText(/vượt quá giới hạn 50\.000 ký tự/i)).toBeInTheDocument();
    });
  });

  // =========================================================================
  // TASK 1B: Editable OCR preview modal
  // =========================================================================
  describe('2. Editable OCR Preview Modal (R2): Editing, Counts & Payload Integrity', () => {
    it('updates character count and word count dynamically as user types in preview modal', () => {
      const initialText = 'Nguyen Van A - Frontend Developer with React and Next.js';
      const onConfirm = vi.fn();
      const onClose = vi.fn();

      render(
        React.createElement(OcrPreviewModal, {
          isOpen: true,
          extractedText: initialText,
          fileName: 'resume.pdf',
          fileSize: 102400,
          onClose,
          onConfirm,
        })
      );

      // Check initial word and character counts (10 words, 56 characters)
      expect(screen.getByText(/10 từ/i)).toBeInTheDocument();
      expect(screen.getByText(/56 ký tự/i)).toBeInTheDocument();

      const textarea = screen.getByRole('textbox', { name: /xem trước và chỉnh sửa/i });
      expect(textarea).toHaveValue(initialText);

      // Append new text via fireEvent.change
      const updatedText = initialText + ' and TypeScript.';
      fireEvent.change(textarea, { target: { value: updatedText } });

      // 56 + 16 = 72 chars, 10 + 2 = 12 words
      expect(screen.getByText(/12 từ/i)).toBeInTheDocument();
      expect(screen.getByText(/72 ký tự/i)).toBeInTheDocument();

      // Modified badge should now be visible
      expect(screen.getByText(/đã chỉnh sửa/i)).toBeInTheDocument();
    });

    it('allows restoring original OCR text with "Khôi phục gốc" button', () => {
      const initialText = 'Original OCR text that was extracted accurately.';

      render(
        React.createElement(OcrPreviewModal, {
          isOpen: true,
          extractedText: initialText,
          onClose: vi.fn(),
          onConfirm: vi.fn(),
        })
      );

      const textarea = screen.getByRole('textbox', { name: /xem trước và chỉnh sửa/i });

      // User modifies text
      fireEvent.change(textarea, { target: { value: 'MODIFIED CORRUPT DATA' } });
      expect(screen.getByText(/đã chỉnh sửa/i)).toBeInTheDocument();

      // Reset button should now be visible
      const resetBtn = screen.getByRole('button', { name: /khôi phục gốc/i });
      fireEvent.click(resetBtn);

      // Textarea must be restored to original
      expect(textarea).toHaveValue(initialText);
      expect(screen.getByText(/đã khôi phục lại văn bản trích xuất ban đầu/i)).toBeInTheDocument();
    });

    it('supports copying text from preview modal via clipboard API', async () => {
      const textToCopy = 'Testing clipboard copy inside OCR preview screen.';

      render(
        React.createElement(OcrPreviewModal, {
          isOpen: true,
          extractedText: textToCopy,
          onClose: vi.fn(),
          onConfirm: vi.fn(),
        })
      );

      const copyBtn = screen.getByRole('button', { name: /sao chép/i });
      fireEvent.click(copyBtn);

      expect(writeTextMock).toHaveBeenCalledWith(textToCopy);
      expect(await screen.findByText(/đã sao chép/i)).toBeInTheDocument();
    });

    it('prevents confirmation if text in preview modal is reduced below 30 characters', () => {
      const onConfirm = vi.fn();

      render(
        React.createElement(OcrPreviewModal, {
          isOpen: true,
          extractedText: 'Initial valid text with more than 30 characters in it.',
          onClose: vi.fn(),
          onConfirm,
        })
      );

      const textarea = screen.getByRole('textbox', { name: /xem trước và chỉnh sửa/i });
      const confirmBtn = screen.getByRole('button', { name: /xác nhận & chọn giọng điệu/i });

      // Clear textarea and set to 10 chars
      fireEvent.change(textarea, { target: { value: 'Too short!' } });

      expect(confirmBtn).toBeDisabled();
      expect(onConfirm).not.toHaveBeenCalled();
    });

    it('CRITICAL: Verifies edited OCR text is what actually gets transmitted to /api/roast (NOT raw OCR)', async () => {
      const user = userEvent.setup();
      const rawOcrText = 'Bùi Văn B - Đang tim viec lam IT web (OCR loi phong chu)';
      const correctedText = 'Bùi Văn B - Kỹ sư phần mềm Fullstack, thành thạo React, Next.js và Go.';

      const fetchMock = vi.fn().mockImplementation((url: string) => {
        if (url.includes('/api/extract')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              success: true,
              extractedText: rawOcrText,
            }),
          });
        }
        if (url.includes('/api/roast')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => mockRoastResponse,
          });
        }
        return Promise.reject(new Error(`Unhandled URL: ${url}`));
      });
      global.fetch = fetchMock;

      render(React.createElement(RoastPage));

      // 1. Upload mock PDF file
      const pdfBuffer = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x31]);
      const mockFile = new File([pdfBuffer], 'candidate_cv.pdf', { type: 'application/pdf' });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(fileInput, mockFile);

      // 2. Wait for preview modal to appear
      const textarea = await screen.findByRole('textbox', { name: /xem trước|nội dung cv/i });
      expect(textarea).toHaveValue(rawOcrText);

      // 3. User edits the text to correct typos
      fireEvent.change(textarea, { target: { value: correctedText } });
      expect(textarea).toHaveValue(correctedText);

      // 4. User clicks confirm
      const confirmBtn = screen.getByRole('button', { name: /xác nhận & chọn giọng điệu/i });
      fireEvent.click(confirmBtn);

      // 5. Verify /api/roast payload contains correctedText, NOT rawOcrText
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          '/api/roast',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              cvText: correctedText,
              tone: 'spicy',
            }),
          })
        );
      });

      // Ensure rawOcrText was never sent to /api/roast
      const roastCall = fetchMock.mock.calls.find((call) => call[0] === '/api/roast');
      expect(roastCall).toBeDefined();
      expect(roastCall?.[1]?.body).toBeDefined();
      const sentPayload = JSON.parse(roastCall![1].body);
      expect(sentPayload.cvText).toBe(correctedText);
      expect(sentPayload.cvText).not.toBe(rawOcrText);
    });
  });

  // =========================================================================
  // TASK 1C: Tone switching between "spicy" and "constructive"
  // =========================================================================
  describe('3. Tone Switching State Machine ("spicy" vs "constructive")', () => {
    it('toggles tone on input screen and correctly passes selected tone to /api/roast', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          ...mockRoastResponse,
          data: { ...mockRoastResponse.data, tone: 'constructive' },
        }),
      });
      global.fetch = fetchMock;

      render(React.createElement(RoastPage));

      const spicyBtn = screen.getByRole('button', { name: /cà khịa|sát thủ/i });
      const constructiveBtn = screen.getByRole('button', { name: /chuyên gia tận tâm/i });

      // Default tone is spicy
      expect(spicyBtn).toHaveAttribute('data-active', 'true');
      expect(constructiveBtn).toHaveAttribute('data-active', 'false');

      // Click constructive
      fireEvent.click(constructiveBtn);
      expect(constructiveBtn).toHaveAttribute('data-active', 'true');
      expect(spicyBtn).toHaveAttribute('data-active', 'false');

      // Submit text via paste tab
      const textTab = screen.getByRole('tab', { name: /dán văn bản/i });
      fireEvent.click(textTab);
      const textarea = screen.getByRole('textbox', { name: /nội dung cv/i });
      fireEvent.change(textarea, { target: { value: mockValidCvText } });

      const submitBtn = screen.getByRole('button', { name: /bắt đầu roast cv/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          '/api/roast',
          expect.objectContaining({
            body: JSON.stringify({
              cvText: maskPii(mockValidCvText).sanitizedText,
              tone: 'constructive',
            }),
          })
        );
      });
    });

    it('preserves target role across tone selection and sends it to /api/roast', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockRoastResponse,
      });
      global.fetch = fetchMock;

      render(React.createElement(RoastPage));

      // Enter target role
      const roleInput = screen.getByPlaceholderText(/frontend developer/i);
      fireEvent.change(roleInput, { target: { value: 'Senior Frontend Engineer' } });

      // Switch to text tab and paste
      const textTab = screen.getByRole('tab', { name: /dán văn bản/i });
      fireEvent.click(textTab);
      const textarea = screen.getByRole('textbox', { name: /nội dung cv/i });
      fireEvent.change(textarea, { target: { value: mockValidCvText } });

      const submitBtn = screen.getByRole('button', { name: /bắt đầu roast cv/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          '/api/roast',
          expect.objectContaining({
            body: JSON.stringify({
              cvText: maskPii(mockValidCvText).sanitizedText,
              tone: 'spicy',
              targetRole: 'Senior Frontend Engineer',
            }),
          })
        );
      });
    });

    it('allows quick tone switching directly from Results screen, firing a new roast request', async () => {
      let callCount = 0;
      const fetchMock = vi.fn().mockImplementation((url: string) => {
        if (url.includes('/api/roast')) {
          callCount++;
          const currentTone = callCount === 1 ? 'spicy' : 'constructive';
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              success: true,
              data: {
                ...mockRoastResponse.data,
                tone: currentTone,
                summaryVerdict:
                  currentTone === 'spicy'
                    ? 'CV quá mơ hồ, vứt sọt rác sau 3 giây.'
                    : 'CV có cấu trúc tốt, cần lượng hóa thêm thành tích thực tế.',
              },
            }),
          });
        }
        return Promise.reject(new Error(`Unhandled URL: ${url}`));
      });
      global.fetch = fetchMock;

      render(React.createElement(RoastPage));

      // Paste text and submit with initial 'spicy' tone
      const textTab = screen.getByRole('tab', { name: /dán văn bản/i });
      fireEvent.click(textTab);
      const textarea = screen.getByRole('textbox', { name: /nội dung cv/i });
      fireEvent.change(textarea, { target: { value: mockValidCvText } });

      const submitBtn = screen.getByRole('button', { name: /bắt đầu roast cv/i });
      fireEvent.click(submitBtn);

      // Wait for Result page
      await screen.findByText('CV quá mơ hồ, vứt sọt rác sau 3 giây.');

      // Click "Đổi sang giọng Chuyên gia tận tâm"
      const switchToneBtn = screen.getByRole('button', {
        name: /đổi sang giọng.*chuyên gia tận tâm/i,
      });
      expect(switchToneBtn).toBeInTheDocument();
      fireEvent.click(switchToneBtn);

      // Verify second call to /api/roast with 'constructive'
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(fetchMock).toHaveBeenLastCalledWith(
          '/api/roast',
          expect.objectContaining({
            body: JSON.stringify({
              cvText: maskPii(mockValidCvText).sanitizedText,
              tone: 'constructive',
            }),
          })
        );
      });

      // Verify updated verdict rendered
      expect(
        await screen.findByText('CV có cấu trúc tốt, cần lượng hóa thêm thành tích thực tế.')
      ).toBeInTheDocument();
    });
  });

  // =========================================================================
  // TASK 1D: Loading state behavior with rotating Vietnamese hints
  // =========================================================================
  describe('4. Loading State Behavior & Rotating Vietnamese Hints', () => {
    it('displays loading indicator and rotates through Vietnamese hints periodically', async () => {
      vi.useFakeTimers();

      // Slow response to keep it in ROASTING step
      let resolvePromise: (value: any) => void;
      const fetchPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      global.fetch = vi.fn().mockImplementation(() => fetchPromise);

      render(React.createElement(RoastPage));

      // Paste text tab
      const textTab = screen.getByRole('tab', { name: /dán văn bản/i });
      fireEvent.click(textTab);
      const textarea = screen.getByRole('textbox', { name: /nội dung cv/i });
      fireEvent.change(textarea, { target: { value: mockValidCvText } });

      const form = textarea.closest('form');
      if (form) fireEvent.submit(form);

      // Loading state heading
      expect(
        screen.getByText(/ai đang mổ xẻ từng dòng trong cv của bạn/i)
      ).toBeInTheDocument();

      // Zero-PII guarantee note
      expect(
        screen.getByText(/cam kết zero-pii: dữ liệu cv không bao giờ lưu trữ trên máy chủ/i)
      ).toBeInTheDocument();

      // Hint 0 is displayed initially
      expect(
        screen.getByText(/đang bật chế độ cà khịa sát thủ, chuẩn bị vạch trần văn mẫu/i)
      ).toBeInTheDocument();

      // Advance by 2500ms -> Hint 1
      act(() => {
        vi.advanceTimersByTime(2500);
      });
      expect(
        screen.getByText(/đang soi từng lỗi ngớ ngẩn khiến cv bị ném vào sọt rác sau 5 giây/i)
      ).toBeInTheDocument();

      // Advance by 2500ms -> Hint 2
      act(() => {
        vi.advanceTimersByTime(2500);
      });
      expect(
        screen.getByText(/đang soi kính lúp tìm số liệu chứng minh trong đống từ ngữ mơ hồ/i)
      ).toBeInTheDocument();

      // Advance by 2500ms -> Hint 3
      act(() => {
        vi.advanceTimersByTime(2500);
      });
      expect(
        screen.getByText(/đang đếm số lần bạn dùng từ "nhiệt tình, ham học hỏi, chịu áp lực cao"/i)
      ).toBeInTheDocument();

      // Cleanly resolve fetch and transition to RESULT
      await act(async () => {
        resolvePromise!({
          ok: true,
          status: 200,
          json: async () => mockRoastResponse,
        });
      });

      // Loading state should be gone, Result rendered
      expect(screen.getByText(mockRoastResponse.data.summaryVerdict)).toBeInTheDocument();
    });
  });

  // =========================================================================
  // TASK 1E: Results rendering, severity badges, and placeholder copy button
  // =========================================================================
  describe('5. Results Rendering, Severity Badges, and Placeholder Copy Button', () => {
    it('renders overall score with appropriate color badge across different score ranges', () => {
      // 1. Low score (< 50) -> rose theme "Nguy cơ cao bị loại"
      const lowScoreData: RoastData = {
        ...mockRoastResponse.data,
        overallScore: 35,
      };
      const { unmount } = render(
        React.createElement(RoastReport, {
          data: lowScoreData,
          onReset: vi.fn(),
          onChangeTone: vi.fn(),
          onEditCv: vi.fn(),
        })
      );
      expect(screen.getByText('35')).toHaveClass('text-rose-400');
      expect(screen.getByText('Nguy cơ cao bị loại')).toBeInTheDocument();
      unmount();

      // 2. Medium score (50-74) -> amber theme "Tạm ổn, cần tối ưu số liệu"
      const midScoreData: RoastData = {
        ...mockRoastResponse.data,
        overallScore: 68,
      };
      const { unmount: unmount2 } = render(
        React.createElement(RoastReport, {
          data: midScoreData,
          onReset: vi.fn(),
          onChangeTone: vi.fn(),
          onEditCv: vi.fn(),
        })
      );
      expect(screen.getByText('68')).toHaveClass('text-amber-400');
      expect(screen.getByText('Tạm ổn, cần tối ưu số liệu')).toBeInTheDocument();
      unmount2();

      // 3. High score (>= 75) -> emerald theme "Sẵn sàng chinh chiến phỏng vấn"
      const highScoreData: RoastData = {
        ...mockRoastResponse.data,
        overallScore: 88,
      };
      render(
        React.createElement(RoastReport, {
          data: highScoreData,
          onReset: vi.fn(),
          onChangeTone: vi.fn(),
          onEditCv: vi.fn(),
        })
      );
      expect(screen.getByText('88')).toHaveClass('text-emerald-400');
      expect(screen.getByText('Sẵn sàng chinh chiến phỏng vấn')).toBeInTheDocument();
    });

    it('renders all three severity badges (Cao, Trung bình, Thấp) with distinct styling', () => {
      render(
        React.createElement(RoastReport, {
          data: mockRoastResponse.data,
          onReset: vi.fn(),
          onChangeTone: vi.fn(),
          onEditCv: vi.fn(),
        })
      );

      // Severity "Cao"
      const caoBadge = screen.getByText('Cao');
      expect(caoBadge).toBeInTheDocument();
      expect(caoBadge).toHaveClass('text-rose-300');

      // Severity "Trung bình"
      const trungBinhBadge = screen.getByText('Trung bình');
      expect(trungBinhBadge).toBeInTheDocument();
      expect(trungBinhBadge).toHaveClass('text-amber-300');

      // Severity "Thấp"
      const thapBadge = screen.getByText('Thấp');
      expect(thapBadge).toBeInTheDocument();
      expect(thapBadge).toHaveClass('text-zinc-300');
    });

    it('highlights [...] placeholder notation within fix guidelines', () => {
      render(
        React.createElement(RoastReport, {
          data: mockRoastResponse.data,
          onReset: vi.fn(),
          onChangeTone: vi.fn(),
          onEditCv: vi.fn(),
        })
      );

      // Check placeholder tag elements
      const placeholderNext = screen.getByText('[Next.js 14]');
      expect(placeholderNext).toBeInTheDocument();
      expect(placeholderNext).toHaveClass('font-mono', 'bg-orange-500/20');

      const placeholderScore = screen.getByText('[95/100]');
      expect(placeholderScore).toBeInTheDocument();

      const placeholderUsers = screen.getByText('[500]');
      expect(placeholderUsers).toBeInTheDocument();
    });

    it('copies fix guideline with placeholder template to clipboard and shows feedback', async () => {
      render(
        React.createElement(RoastReport, {
          data: mockRoastResponse.data,
          onReset: vi.fn(),
          onChangeTone: vi.fn(),
          onEditCv: vi.fn(),
        })
      );

      const copyButtons = screen.getAllByRole('button', { name: /sao chép mẫu/i });
      expect(copyButtons.length).toBe(3);

      // Click first copy button
      fireEvent.click(copyButtons[0]);

      // Expect writeTextMock called with exact fixGuideline string
      expect(writeTextMock).toHaveBeenCalledWith(
        mockRoastResponse.data.weaknesses[0].fixGuideline
      );

      // Button feedback changes to "Đã chép"
      expect(await screen.findByText('Đã chép')).toBeInTheDocument();
    });

    it('renders ATS recommendations with categories and impact badges (Quan trọng vs Nên làm)', () => {
      render(
        React.createElement(RoastReport, {
          data: mockRoastResponse.data,
          onReset: vi.fn(),
          onChangeTone: vi.fn(),
          onEditCv: vi.fn(),
        })
      );

      // Category titles
      expect(screen.getByText('Cấu trúc')).toBeInTheDocument();
      expect(screen.getByText('Từ khóa')).toBeInTheDocument();

      // Impacts
      const importantBadge = screen.getByText('Quan trọng');
      expect(importantBadge).toBeInTheDocument();
      expect(importantBadge).toHaveClass('text-rose-300');

      const recommendedBadge = screen.getByText('Nên làm');
      expect(recommendedBadge).toBeInTheDocument();
      expect(recommendedBadge).toHaveClass('text-cyan-300');
    });

    it('resets workflow when "Tải lên CV khác" is clicked', () => {
      const onReset = vi.fn();

      render(
        React.createElement(RoastReport, {
          data: mockRoastResponse.data,
          onReset,
          onChangeTone: vi.fn(),
          onEditCv: vi.fn(),
        })
      );

      const resetBtn = screen.getByRole('button', { name: /tải lên cv khác/i });
      fireEvent.click(resetBtn);

      expect(onReset).toHaveBeenCalledTimes(1);
    });

    it('triggers onEditCv to return to preview screen when "Sửa lại văn bản CV" is clicked', () => {
      const onEditCv = vi.fn();

      render(
        React.createElement(RoastReport, {
          data: mockRoastResponse.data,
          onReset: vi.fn(),
          onChangeTone: vi.fn(),
          onEditCv,
        })
      );

      const editBtn = screen.getByRole('button', { name: /sửa lại văn bản cv/i });
      fireEvent.click(editBtn);

      expect(onEditCv).toHaveBeenCalledTimes(1);
    });
  });

  // =========================================================================
  // TASK 1F: Error recovery state machine
  // =========================================================================
  describe('6. Error Recovery State Machine', () => {
    it('transitions to ERROR state when /api/roast fails and allows retry', async () => {
      let attempt = 0;
      const fetchMock = vi.fn().mockImplementation((url: string) => {
        if (url.includes('/api/roast')) {
          attempt++;
          if (attempt === 1) {
            return Promise.resolve({
              ok: false,
              status: 502,
              json: async () => ({
                success: false,
                error: 'Máy chủ AI đang quá tải. Vui lòng thử lại sau giây lát.',
              }),
            });
          }
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => mockRoastResponse,
          });
        }
        return Promise.reject(new Error(`Unhandled URL: ${url}`));
      });
      global.fetch = fetchMock;

      render(React.createElement(RoastPage));

      // Paste text and submit
      const textTab = screen.getByRole('tab', { name: /dán văn bản/i });
      fireEvent.click(textTab);
      const textarea = screen.getByRole('textbox', { name: /nội dung cv/i });
      fireEvent.change(textarea, { target: { value: mockValidCvText } });

      const submitBtn = screen.getByRole('button', { name: /bắt đầu roast cv/i });
      fireEvent.click(submitBtn);

      // Verify ERROR state is rendered
      expect(
        await screen.findByText('Máy chủ AI đang quá tải. Vui lòng thử lại sau giây lát.')
      ).toBeInTheDocument();
      expect(screen.getByText('Không thể phân tích CV')).toBeInTheDocument();

      // Click "Thử phân tích lại"
      const retryBtn = screen.getByRole('button', { name: /thử phân tích lại/i });
      fireEvent.click(retryBtn);

      // Verify retry succeeded and report is shown
      await waitFor(() => {
        expect(screen.getByText(mockRoastResponse.data.summaryVerdict)).toBeInTheDocument();
      });
    });
  });
});
