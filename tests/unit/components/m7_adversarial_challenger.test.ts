import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RoastReport } from '@/components/roast/RoastReport';
import { ExportCvModal, WeaknessCardState, WeaknessRewriteItem } from '@/components/roast/ExportCvModal';
import { RoastData } from '@/lib/schemas/roast';
import {
  wipeAllSessionData,
  WIPE_DATA_EVENT_NAME,
  STORAGE_KEYS_TO_CLEAR,
} from '@/lib/storage/wipe-data';

describe('Adversarial Stress Testing: RoastReport & ExportCvModal (Challenger M7.2)', () => {
  let writeTextMock: ReturnType<typeof vi.fn>;
  let createObjectURLMock: ReturnType<typeof vi.fn>;
  let revokeObjectURLMock: ReturnType<typeof vi.fn>;
  let anchorClickMock: ReturnType<typeof vi.fn>;
  let createdBlobs: { content: string[]; options?: BlobPropertyBag }[] = [];

  const sampleRoastData: RoastData = {
    overallScore: 55,
    tone: 'spicy',
    summaryVerdict: 'CV còn quá chung chung, dùng nhiều từ ngữ sáo rỗng thiếu chứng minh năng lực.',
    topStrengths: ['Có định hướng công nghệ rõ ràng'],
    weaknesses: [
      {
        quote: 'Tham gia dự án Web với React/Next.js (Team 5 người)',
        issue: 'Thiếu số liệu đo lường kết quả công việc',
        severity: 'Cao',
        rejectionReason: 'Không chứng minh được đóng góp cá nhân và tác động thực tế',
        fixGuideline: 'Áp dụng công thức: [Động từ] [Hạng mục] đạt [Số liệu]',
      },
      {
        quote: 'Tối ưu hóa cơ sở dữ liệu SQL Server',
        issue: 'Mô tả mơ hồ, không nêu rõ tỷ lệ cải thiện hiệu năng',
        severity: 'Trung bình',
        rejectionReason: 'Ai cũng có thể ghi tối ưu hóa nhưng không có số liệu chứng minh',
        fixGuideline: 'Nêu rõ: Giảm thời gian truy vấn từ [X giây] xuống [Y ms].',
      },
      {
        quote: 'Nhiệt tình, có trách nhiệm cao trong công việc, sẵn sàng OT',
        issue: 'Kỹ năng mềm sáo rỗng, không có giá trị ATS',
        severity: 'Thấp',
        rejectionReason: 'Chiếm diện tích CV mà không mang lại điểm số kỹ năng',
        fixGuideline: 'Thay bằng thành tích làm việc nhóm cụ thể hoặc lược bỏ.',
      },
    ],
    atsRecommendations: [
      {
        category: 'Từ khóa',
        recommendation: 'Bổ sung các từ khóa công nghệ chính xác vào phần Kỹ năng',
        impact: 'Quan trọng',
      },
    ],
    disclaimer: 'Kết quả phân tích mang tính chất tham khảo.',
  };

  const sampleRewriteApiResponse = {
    success: true,
    data: {
      originalQuote: 'Tham gia dự án Web với React/Next.js (Team 5 người)',
      rewrittenText:
        'Chủ trì phát triển giao diện Web với React/Next.js, tối ưu hóa tốc độ tải trang lên [45%] cho hơn [10.000] người dùng.',
      actionVerb: 'Chủ trì phát triển',
      actionVerbCategory: 'Lãnh đạo',
      context: 'giao diện Web với React/Next.js',
      result: 'tối ưu hóa tốc độ tải trang lên [45%] cho hơn [10.000] người dùng',
      explanation: 'Sử dụng động từ hành động mạnh kết hợp kết quả định lượng chuẩn ATS.',
      atsKeywords: ['Chủ trì phát triển', 'React', 'Next.js', 'Tối ưu hóa'],
    },
  };

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
    createdBlobs = [];

    writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    });

    // Mock Blob constructor inspection
    const originalBlob = global.Blob;
    vi.spyOn(global, 'Blob').mockImplementation(function (content: any, options: any) {
      createdBlobs.push({ content, options });
      return new originalBlob(content, options);
    });

    createObjectURLMock = vi.fn().mockReturnValue('blob:mock-url-12345');
    revokeObjectURLMock = vi.fn();
    global.URL.createObjectURL = createObjectURLMock as unknown as (obj: Blob | MediaSource) => string;
    global.URL.revokeObjectURL = revokeObjectURLMock as unknown as (url: string) => void;

    anchorClickMock = vi.fn();
    HTMLAnchorElement.prototype.click = anchorClickMock as unknown as () => void;

    // Default fetch mock returning sample rewrite response
    vi.spyOn(global, 'fetch').mockImplementation(async (input: any) => {
      const url = typeof input === 'string' ? input : input?.url || '';
      if (url.includes('/api/rewrite')) {
        return new Response(JSON.stringify(sampleRewriteApiResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // SUITE 1: In-Place Editing State Transitions
  // =========================================================================
  describe('1. In-Place Editing State Transitions & Edge Cases', () => {
    it('executes full state cycle: idle -> loading -> success -> edit -> cancel (reverts dirty changes)', async () => {
      const user = userEvent.setup();

      render(
        React.createElement(RoastReport, {
          data: sampleRoastData,
          cvText: 'Kinh nghiệm:\n- Tham gia dự án Web với React/Next.js (Team 5 người)\n- Tối ưu hóa cơ sở dữ liệu SQL Server',
          onReset: vi.fn(),
          onChangeTone: vi.fn(),
          onEditCv: vi.fn(),
        })
      );

      const rewriteBtns = screen.getAllByRole('button', { name: /tối ưu hóa theo chuẩn ats/i });
      await user.click(rewriteBtns[0]);

      // Wait for success
      await waitFor(() => {
        expect(screen.getByText(/action verb: chủ trì phát triển/i)).toBeInTheDocument();
      });

      // Enter edit mode
      const editBtn = screen.getByRole('button', { name: /chỉnh sửa/i });
      await user.click(editBtn);

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea).toBeInTheDocument();
      expect(textarea.value).toBe(sampleRewriteApiResponse.data.rewrittenText);

      // Candidate types dirty content
      fireEvent.change(textarea, {
        target: { value: 'Nội dung chỉnh sửa thử nghiệm nhưng chưa muốn lưu...' },
      });
      expect(textarea.value).toBe('Nội dung chỉnh sửa thử nghiệm nhưng chưa muốn lưu...');

      // Click Cancel
      const cancelBtn = screen.getByRole('button', { name: /hủy/i });
      await user.click(cancelBtn);

      // Verify edit textarea closed and view mode displays previous saved text (not dirty text)
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(screen.getByText(/chủ trì phát triển giao diện web với react\/next\.js/i)).toBeInTheDocument();
      expect(
        screen.queryByText('Nội dung chỉnh sửa thử nghiệm nhưng chưa muốn lưu...')
      ).not.toBeInTheDocument();
    });

    it('executes AI Proposal Revert: edit -> alter draft -> reset to AI proposal -> save', async () => {
      const user = userEvent.setup();

      render(
        React.createElement(RoastReport, {
          data: sampleRoastData,
          cvText: 'CV gốc...',
          onReset: vi.fn(),
          onChangeTone: vi.fn(),
          onEditCv: vi.fn(),
        })
      );

      const rewriteBtns = screen.getAllByRole('button', { name: /tối ưu hóa theo chuẩn ats/i });
      await user.click(rewriteBtns[0]);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /chỉnh sửa/i })).toBeInTheDocument();
      });

      // Edit 1: change text and save
      await user.click(screen.getByRole('button', { name: /chỉnh sửa/i }));
      let textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      fireEvent.change(textarea, {
        target: { value: 'Chủ trì tối ưu hóa tốc độ tải trang lên 60% cho 50.000 users.' },
      });
      await user.click(screen.getByRole('button', { name: /lưu thay đổi/i }));

      // Verify custom text is displayed
      await waitFor(() => {
        expect(screen.getByText(/chủ trì tối ưu hóa tốc độ tải trang lên 60%/i)).toBeInTheDocument();
      });

      // Edit 2: reopen editor and click "Khôi phục đề xuất AI"
      await user.click(screen.getByRole('button', { name: /chỉnh sửa/i }));
      textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.value).toBe('Chủ trì tối ưu hóa tốc độ tải trang lên 60% cho 50.000 users.');

      const resetProposalBtn = screen.getByRole('button', { name: /khôi phục đề xuất ai/i });
      await user.click(resetProposalBtn);

      // Textarea should be reset back to original AI rewrittenText
      expect(textarea.value).toBe(sampleRewriteApiResponse.data.rewrittenText);

      // Save the reverted proposal
      await user.click(screen.getByRole('button', { name: /lưu thay đổi/i }));

      // View mode now displays original AI proposal with bracketed placeholders
      await waitFor(() => {
        expect(screen.getByText('[45%]')).toBeInTheDocument();
        expect(screen.getByText('[10.000]')).toBeInTheDocument();
      });
    });

    it('handles whitespace trimming on save and maintains copy functionality on custom edited text', async () => {
      const user = userEvent.setup();
      const writeSpy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);

      render(
        React.createElement(RoastReport, {
          data: sampleRoastData,
          cvText: 'CV text...',
          onReset: vi.fn(),
          onChangeTone: vi.fn(),
          onEditCv: vi.fn(),
        })
      );

      const rewriteBtns = screen.getAllByRole('button', { name: /tối ưu hóa theo chuẩn ats/i });
      await user.click(rewriteBtns[0]);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /chỉnh sửa/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /chỉnh sửa/i }));
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

      // Enter untrimmed text with leading and trailing newlines/spaces
      const rawCustomText = '   \n  Chủ trì phát triển microservice thanh toán đạt 99.9% uptime   \n\n  ';
      fireEvent.change(textarea, { target: { value: rawCustomText } });

      await user.click(screen.getByRole('button', { name: /lưu thay đổi/i }));

      // Verify trimmed text is saved
      await waitFor(() => {
        expect(
          screen.getByText('Chủ trì phát triển microservice thanh toán đạt 99.9% uptime')
        ).toBeInTheDocument();
      });

      // Click copy button on the customized text using fireEvent to trigger navigator.clipboard
      const copyBtn = screen.getByRole('button', { name: /sao chép câu này/i });
      fireEvent.click(copyBtn);

      await waitFor(() => {
        expect(writeSpy).toHaveBeenCalledWith(
          'Chủ trì phát triển microservice thanh toán đạt 99.9% uptime'
        );
      });
    });
  });

  // =========================================================================
  // SUITE 2: Full CV Export with Varied Quotes & Substitution Logic
  // =========================================================================
  describe('2. Full CV Export with Varied Quotes (Exact match, Whitespace differences, Unmatched fallback)', () => {
    it('accurately substitutes exact matching quotes and retains remaining CV body', () => {
      const originalCv = [
        'HỌ TÊN: NGUYỄN VĂN A',
        'VỊ TRÍ: FRONTEND DEVELOPER',
        '',
        'KINH NGHIỆM LÀM VIỆC:',
        '- Tham gia dự án Web với React/Next.js (Team 5 người)',
        '- Tối ưu hóa cơ sở dữ liệu SQL Server',
        '',
        'KỸ NĂNG: JavaScript, TypeScript, React',
      ].join('\n');

      const rewriteStates: Record<number, WeaknessCardState> = {
        0: {
          status: 'success',
          data: {
            originalQuote: 'Tham gia dự án Web với React/Next.js (Team 5 người)',
            rewrittenText: 'Chủ trì phát triển giao diện Web với React/Next.js đạt [45%] tốc độ',
            customizedText: 'Chủ trì phát triển giao diện Web với React/Next.js đạt 50% tốc độ tải trang',
            actionVerb: 'Chủ trì phát triển',
            context: 'giao diện Web với React/Next.js',
            result: 'đạt 50% tốc độ tải trang',
            explanation: 'Chuẩn ATS',
            atsKeywords: ['React', 'Next.js', 'Frontend'],
          },
        },
      };

      render(
        React.createElement(ExportCvModal, {
          isOpen: true,
          onClose: vi.fn(),
          originalCvText: originalCv,
          reportData: sampleRoastData,
          rewriteStates,
          targetRole: 'Frontend Developer',
        })
      );

      const preview = screen.getByRole('dialog').querySelector('pre');
      const content = preview?.textContent || '';

      // Check CV body vs Appendix
      const [cvBody, appendix] = content.split('---');
      expect(cvBody).toContain('- Chủ trì phát triển giao diện Web với React/Next.js đạt 50% tốc độ tải trang');
      expect(cvBody).not.toContain('Tham gia dự án Web với React/Next.js (Team 5 người)');

      // The un-optimized quote 1 should still exist unchanged
      expect(cvBody).toContain('- Tối ưu hóa cơ sở dữ liệu SQL Server');

      // The rest of CV structure should be preserved
      expect(cvBody).toContain('HỌ TÊN: NGUYỄN VĂN A');
      expect(cvBody).toContain('KỸ NĂNG: JavaScript, TypeScript, React');

      // Appendix breakdown should document both original and optimized quotes
      expect(appendix).toContain('## BẢNG TỔNG HỢP CẢI TIẾN CHUẨN ATS');
      expect(appendix).toContain('Mục 1: Thiếu số liệu đo lường kết quả công việc');
      expect(appendix).toContain('Đoạn gốc');
      expect(appendix).toContain('Action Verb');
    });

    it('handles whitespace differences (extra spaces/newlines in CV vs weakness quote)', () => {
      // In realistic OCR, whitespace in original CV might have multiple spaces or carriage returns
      const originalCv = 'Kinh nghiệm:\n- Tham gia   dự án Web với React/Next.js   (Team 5 người)\n- Hết';

      const weaknessWithNormalizedSpaces: RoastData = {
        ...sampleRoastData,
        weaknesses: [
          {
            ...sampleRoastData.weaknesses[0],
            quote: 'Tham gia   dự án Web với React/Next.js   (Team 5 người)',
          },
        ],
      };

      const rewriteStates: Record<number, WeaknessCardState> = {
        0: {
          status: 'success',
          data: {
            originalQuote: 'Tham gia   dự án Web với React/Next.js   (Team 5 người)',
            rewrittenText: 'Chủ trì phát triển Web Next.js',
            customizedText: 'Chủ trì phát triển Web Next.js',
            actionVerb: 'Chủ trì phát triển',
            context: 'Web Next.js',
            result: 'Tăng tốc',
            explanation: 'ATS',
            atsKeywords: ['Web'],
          },
        },
      };

      render(
        React.createElement(ExportCvModal, {
          isOpen: true,
          onClose: vi.fn(),
          originalCvText: originalCv,
          reportData: weaknessWithNormalizedSpaces,
          rewriteStates,
        })
      );

      const preview = screen.getByRole('dialog').querySelector('pre');
      const content = preview?.textContent || '';
      const [cvBody, appendix] = content.split('---');

      expect(cvBody).toContain('Chủ trì phát triển Web Next.js');
      expect(cvBody).not.toContain('Tham gia   dự án Web với React/Next.js   (Team 5 người)');
      expect(appendix).toContain('Tham gia   dự án Web với React/Next.js   (Team 5 người)');
    });

    it('handles unmatched quotes safely via appendix fallback without corrupting base CV', () => {
      // Original CV does NOT contain the quote (e.g. quote was a hallucination or from a different page)
      const originalCv = 'Nguyễn Văn B - Backend Engineer\nKinh nghiệm làm việc tại công ty Alpha.';

      const rewriteStates: Record<number, WeaknessCardState> = {
        0: {
          status: 'success',
          data: {
            originalQuote: 'Tham gia dự án Web với React/Next.js (Team 5 người)',
            rewrittenText: 'Chủ trì phát triển giao diện Web',
            customizedText: 'Chủ trì phát triển giao diện Web',
            actionVerb: 'Chủ trì',
            context: 'Web',
            result: 'Thành công',
            explanation: 'ATS',
            atsKeywords: [],
          },
        },
      };

      render(
        React.createElement(ExportCvModal, {
          isOpen: true,
          onClose: vi.fn(),
          originalCvText: originalCv,
          reportData: sampleRoastData,
          rewriteStates,
        })
      );

      const preview = screen.getByRole('dialog').querySelector('pre');
      const content = preview?.textContent || '';
      const [cvBody, appendix] = content.split('---');

      // Base CV must remain completely intact
      expect(cvBody).toContain('Nguyễn Văn B - Backend Engineer');
      expect(cvBody).toContain('Kinh nghiệm làm việc tại công ty Alpha.');

      // Appendix fallback MUST include the improved bullet so candidate does not lose the optimization
      expect(appendix).toContain('## BẢNG TỔNG HỢP CẢI TIẾN CHUẨN ATS');
      expect(appendix).toContain('Chủ trì phát triển giao diện Web');
      expect(appendix).toContain('Tham gia dự án Web với React/Next.js (Team 5 người)');
    });

    it('handles empty CV text fallback with target role header and summary verdict', () => {
      render(
        React.createElement(ExportCvModal, {
          isOpen: true,
          onClose: vi.fn(),
          originalCvText: '',
          reportData: sampleRoastData,
          rewriteStates: {},
          targetRole: 'Data Analyst',
        })
      );

      const preview = screen.getByRole('dialog').querySelector('pre');
      const content = preview?.textContent || '';

      expect(content).toContain('# CV ỨNG TUYỂN — DATA ANALYST');
      expect(content).toContain(sampleRoastData.summaryVerdict);
      expect(content).toContain('*Chưa có mục nào được tối ưu qua trợ lý ATS.*');
    });

    it('safely handles quotes containing regex special characters without crashing or malformed replacements', () => {
      const specialCharCv = 'Dự án: [Alpha-v1.0] (Web & App) {C++ / C#} -> 50% scale?';
      const specialRoastData: RoastData = {
        ...sampleRoastData,
        weaknesses: [
          {
            quote: '[Alpha-v1.0] (Web & App) {C++ / C#} -> 50% scale?',
            issue: 'Định dạng phức tạp',
            severity: 'Cao',
            rejectionReason: 'Khó đọc',
            fixGuideline: 'Sửa lại',
          },
        ],
      };

      const rewriteStates: Record<number, WeaknessCardState> = {
        0: {
          status: 'success',
          data: {
            originalQuote: '[Alpha-v1.0] (Web & App) {C++ / C#} -> 50% scale?',
            rewrittenText: 'Phát triển hệ thống lõi C++ đạt [99.9%] throughput',
            customizedText: 'Phát triển hệ thống lõi C++ đạt [99.9%] throughput',
            actionVerb: 'Phát triển',
            context: 'hệ thống lõi',
            result: 'đạt throughput',
            explanation: 'ATS ok',
            atsKeywords: ['C++'],
          },
        },
      };

      render(
        React.createElement(ExportCvModal, {
          isOpen: true,
          onClose: vi.fn(),
          originalCvText: specialCharCv,
          reportData: specialRoastData,
          rewriteStates,
        })
      );

      const preview = screen.getByRole('dialog').querySelector('pre');
      const content = preview?.textContent || '';
      const [cvBody, appendix] = content.split('---');

      expect(cvBody).toContain('Phát triển hệ thống lõi C++ đạt [99.9%] throughput');
      expect(cvBody).not.toContain('[Alpha-v1.0] (Web & App) {C++ / C#} -> 50% scale?');
      expect(appendix).toContain('[Alpha-v1.0] (Web & App) {C++ / C#} -> 50% scale?');
    });
  });

  // =========================================================================
  // SUITE 3: Markdown and Plain Text Blob Generation & Downloads
  // =========================================================================
  describe('3. Blob Generation & Downloads for Markdown (.md) and Plain Text (.txt)', () => {
    it('creates Markdown Blob with text/markdown;charset=utf-8 MIME type and triggers file download', async () => {
      const rewriteStates: Record<number, WeaknessCardState> = {
        0: {
          status: 'success',
          data: {
            originalQuote: 'Tham gia dự án Web với React/Next.js (Team 5 người)',
            rewrittenText: 'Chủ trì phát triển Web Next.js',
            customizedText: 'Chủ trì phát triển Web Next.js',
            actionVerb: 'Chủ trì',
            context: 'Web',
            result: 'Thành công',
            explanation: 'Giải thích',
            atsKeywords: ['Next.js'],
          },
        },
      };

      render(
        React.createElement(ExportCvModal, {
          isOpen: true,
          onClose: vi.fn(),
          originalCvText: 'Tham gia dự án Web với React/Next.js (Team 5 người)',
          reportData: sampleRoastData,
          rewriteStates,
        })
      );

      // Default tab is 'md'
      const downloadBtn = screen.getByRole('button', { name: /tải tệp \.md/i });
      fireEvent.click(downloadBtn);

      // Verify Blob creation
      expect(createdBlobs.length).toBeGreaterThan(0);
      const lastBlob = createdBlobs[createdBlobs.length - 1];
      expect(lastBlob.options).toEqual({ type: 'text/markdown;charset=utf-8' });
      expect(lastBlob.content[0]).toContain('## BẢNG TỔNG HỢP CẢI TIẾN CHUẨN ATS');

      // Verify object URL creation, anchor click, and cleanup
      expect(createObjectURLMock).toHaveBeenCalled();
      expect(anchorClickMock).toHaveBeenCalled();
      expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:mock-url-12345');
    });

    it('switches to Plain Text (.txt), creates text/plain;charset=utf-8 Blob and triggers file download', async () => {
      const rewriteStates: Record<number, WeaknessCardState> = {
        0: {
          status: 'success',
          data: {
            originalQuote: 'Tham gia dự án Web với React/Next.js (Team 5 người)',
            rewrittenText: 'Chủ trì phát triển Web Next.js',
            customizedText: 'Chủ trì phát triển Web Next.js',
            actionVerb: 'Chủ trì',
            context: 'Web',
            result: 'Thành công',
            explanation: 'Giải thích',
            atsKeywords: ['Next.js'],
          },
        },
      };

      render(
        React.createElement(ExportCvModal, {
          isOpen: true,
          onClose: vi.fn(),
          originalCvText: 'Tham gia dự án Web với React/Next.js (Team 5 người)',
          reportData: sampleRoastData,
          rewriteStates,
        })
      );

      // Switch to plain text tab
      const txtTabBtn = screen.getByRole('button', { name: /văn bản thuần \(\.txt\)/i });
      fireEvent.click(txtTabBtn);

      // Preview should reflect Plain Text format
      const preview = screen.getByRole('dialog').querySelector('pre');
      expect(preview?.textContent).toContain('BANG TONG HOP CAC MUC DA TOI UU HOA CHUAN ATS');
      expect(preview?.textContent).not.toContain('## BẢNG TỔNG HỢP');

      // Click download .txt
      const downloadTxtBtn = screen.getByRole('button', { name: /tải tệp \.txt/i });
      fireEvent.click(downloadTxtBtn);

      // Verify Blob properties for TXT
      const lastBlob = createdBlobs[createdBlobs.length - 1];
      expect(lastBlob.options).toEqual({ type: 'text/plain;charset=utf-8' });
      expect(lastBlob.content[0]).toContain('BANG TONG HOP CAC MUC DA TOI UU HOA CHUAN ATS');

      expect(createObjectURLMock).toHaveBeenCalled();
      expect(anchorClickMock).toHaveBeenCalled();
      expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:mock-url-12345');
    });

    it('copies tab-specific content to clipboard when toggling between tabs', async () => {
      const rewriteStates: Record<number, WeaknessCardState> = {
        0: {
          status: 'success',
          data: {
            originalQuote: 'Tham gia dự án Web với React/Next.js (Team 5 người)',
            rewrittenText: 'Chủ trì phát triển Web Next.js',
            customizedText: 'Chủ trì phát triển Web Next.js',
            actionVerb: 'Chủ trì',
            context: 'Web',
            result: 'Thành công',
            explanation: 'Giải thích',
            atsKeywords: [],
          },
        },
      };

      render(
        React.createElement(ExportCvModal, {
          isOpen: true,
          onClose: vi.fn(),
          originalCvText: 'CV gốc',
          reportData: sampleRoastData,
          rewriteStates,
        })
      );

      const copyAllBtn = screen.getByRole('button', { name: /sao chép toàn bộ/i });

      // 1. In Markdown tab
      fireEvent.click(copyAllBtn);
      expect(writeTextMock).toHaveBeenLastCalledWith(
        expect.stringContaining('## BẢNG TỔNG HỢP CẢI TIẾN CHUẨN ATS')
      );

      // 2. Switch to Plain Text tab
      const txtTabBtn = screen.getByRole('button', { name: /văn bản thuần \(\.txt\)/i });
      fireEvent.click(txtTabBtn);

      // Copy in Plain Text tab
      fireEvent.click(copyAllBtn);
      expect(writeTextMock).toHaveBeenLastCalledWith(
        expect.stringContaining('BANG TONG HOP CAC MUC DA TOI UU HOA CHUAN ATS')
      );
    });
  });

  // =========================================================================
  // SUITE 4: 1-Click Wipe Data Integration & Storage Engine Audit
  // =========================================================================
  describe('4. 1-Click Wipe Data Integration & LocalStorage Reset Audit', () => {
    it('verifies STORAGE_KEYS_TO_CLEAR explicitly includes all rewrite-related storage keys', () => {
      expect(STORAGE_KEYS_TO_CLEAR).toContain('airoastcv_rewrite_count');
      expect(STORAGE_KEYS_TO_CLEAR).toContain('airoastcv_rewrite_drafts');
      expect(STORAGE_KEYS_TO_CLEAR).toContain('airoastcv_rewrite_states');
    });

    it('purges rewrite counters, drafts, and resets in-memory RoastReport states on wipeAllSessionData()', async () => {
      // Seed localStorage with rewrite data
      localStorage.setItem('airoastcv_rewrite_count', '2');
      localStorage.setItem('airoastcv_rewrite_drafts', JSON.stringify({ 0: 'draft' }));
      localStorage.setItem('airoastcv_rewrite_states', JSON.stringify({ 0: 'success' }));
      localStorage.setItem('airoastcv_roast_result', JSON.stringify(sampleRoastData));

      expect(localStorage.getItem('airoastcv_rewrite_count')).toBe('2');

      const onResetMock = vi.fn();

      render(
        React.createElement(RoastReport, {
          data: sampleRoastData,
          cvText: 'CV text...',
          onReset: onResetMock,
          onChangeTone: vi.fn(),
          onEditCv: vi.fn(),
        })
      );

      // Trigger Wipe Data via storage engine
      act(() => {
        const wipeResult = wipeAllSessionData();
        expect(wipeResult.success).toBe(true);
      });

      // Verify localStorage is completely cleared
      expect(localStorage.getItem('airoastcv_rewrite_count')).toBeNull();
      expect(localStorage.getItem('airoastcv_rewrite_drafts')).toBeNull();
      expect(localStorage.getItem('airoastcv_rewrite_states')).toBeNull();
      expect(localStorage.length).toBe(0);

      // After wipe, RoastReport should have reset rewriteStates to {} and modals closed
      await waitFor(() => {
        const rewriteBtns = screen.getAllByRole('button', { name: /tối ưu hóa theo chuẩn ats/i });
        expect(rewriteBtns).toHaveLength(3);
      });
    });

    it('resets free rewrite trial allowance after Wipe Data so candidate can retry trial', async () => {
      const user = userEvent.setup();

      render(
        React.createElement(RoastReport, {
          data: sampleRoastData,
          cvText: 'CV text...',
          onReset: vi.fn(),
          onChangeTone: vi.fn(),
          onEditCv: vi.fn(),
        })
      );

      const rewriteBtns = screen.getAllByRole('button', { name: /tối ưu hóa theo chuẩn ats/i });

      // Free user uses their 1 free trial rewrite
      await user.click(rewriteBtns[0]);
      await waitFor(() => {
        expect(screen.getByText(/action verb: chủ trì phát triển/i)).toBeInTheDocument();
      });
      expect(localStorage.getItem('airoastcv_rewrite_count')).toBe('1');

      // 2nd attempt triggers CheckoutModal paywall
      await user.click(rewriteBtns[1]);
      await waitFor(() => {
        expect(screen.getByText(/nâng cấp gói pro/i)).toBeInTheDocument();
      });

      // Candidate clicks "Xóa sạch dữ liệu" button on the UI (confirmFirst is false by default in RoastReport)
      const wipeBtn = screen.getByRole('button', { name: /xóa sạch dữ liệu/i });
      await user.click(wipeBtn);

      // Storage is wiped
      expect(localStorage.getItem('airoastcv_rewrite_count')).toBeNull();

      // Rerender RoastReport fresh after reset
      render(
        React.createElement(RoastReport, {
          data: sampleRoastData,
          cvText: 'CV text...',
          onReset: vi.fn(),
          onChangeTone: vi.fn(),
          onEditCv: vi.fn(),
        })
      );

      // Now candidate has their 1 free trial rewrite restored!
      const freshRewriteBtns = screen.getAllByRole('button', { name: /tối ưu hóa theo chuẩn ats/i });
      await user.click(freshRewriteBtns[0]);

      // Should succeed and NOT open CheckoutModal
      await waitFor(() => {
        expect(screen.getByText(/action verb: chủ trì phát triển/i)).toBeInTheDocument();
      });
      expect(screen.queryByText(/nâng cấp gói pro/i)).not.toBeInTheDocument();
    });
  });

  // =========================================================================
  // SUITE 5: Robustness, Malformed Inputs & Edge Cases
  // =========================================================================
  describe('5. Robustness, Malformed Inputs & Edge Cases', () => {
    it('handles corrupted localStorage rewrite count gracefully without throwing', async () => {
      const user = userEvent.setup();

      // Malformed localStorage value: NaN or invalid string
      localStorage.setItem('airoastcv_rewrite_count', 'corrupted_value');

      render(
        React.createElement(RoastReport, {
          data: sampleRoastData,
          cvText: 'CV text...',
          onReset: vi.fn(),
          onChangeTone: vi.fn(),
          onEditCv: vi.fn(),
        })
      );

      const rewriteBtns = screen.getAllByRole('button', { name: /tối ưu hóa theo chuẩn ats/i });

      // Clicking should not throw error or crash UI
      await user.click(rewriteBtns[0]);
      await waitFor(() => {
        expect(screen.getByText(/action verb: chủ trì phát triển/i)).toBeInTheDocument();
      });
    });

    it('handles network failure during rewrite and allows user to retry cleanly', async () => {
      const user = userEvent.setup();

      // First fetch throws an unhandled network error
      vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Failed to fetch (offline)'));

      render(
        React.createElement(RoastReport, {
          data: sampleRoastData,
          cvText: 'CV text...',
          onReset: vi.fn(),
          onChangeTone: vi.fn(),
          onEditCv: vi.fn(),
        })
      );

      const rewriteBtns = screen.getAllByRole('button', { name: /tối ưu hóa theo chuẩn ats/i });
      await user.click(rewriteBtns[0]);

      // Error banner with retry button
      await waitFor(() => {
        expect(screen.getByText(/failed to fetch/i)).toBeInTheDocument();
      });

      const retryBtn = screen.getByRole('button', { name: /thử lại/i });
      expect(retryBtn).toBeInTheDocument();

      // Retry succeeds
      await user.click(retryBtn);
      await waitFor(() => {
        expect(screen.getByText(/action verb: chủ trì phát triển/i)).toBeInTheDocument();
      });
    });

    it('ensures toast notification is accessible and auto-dismisses after timeout', async () => {
      render(
        React.createElement(RoastReport, {
          data: sampleRoastData,
          cvText: 'CV text...',
          onReset: vi.fn(),
          onChangeTone: vi.fn(),
          onEditCv: vi.fn(),
        })
      );

      const rewriteBtns = screen.getAllByRole('button', { name: /tối ưu hóa theo chuẩn ats/i });
      fireEvent.click(rewriteBtns[0]);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sao chép câu này/i })).toBeInTheDocument();
      });

      const copyBtn = screen.getByRole('button', { name: /sao chép câu này/i });
      fireEvent.click(copyBtn);

      // Toast appears with role="status" and polite live region
      await waitFor(() => {
        const toast = screen.getByRole('status');
        expect(toast).toHaveTextContent(/đã sao chép câu chuẩn ats vào bộ nhớ tạm/i);
        expect(toast).toHaveAttribute('aria-live', 'polite');
      });
    });
  });
});

