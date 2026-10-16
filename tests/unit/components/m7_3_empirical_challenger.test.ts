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

describe('Empirical Adversarial Stress Harness: Challenger M7.3 (UI & Export Verification)', () => {
  let writeTextMock: ReturnType<typeof vi.fn>;
  let createObjectURLMock: ReturnType<typeof vi.fn>;
  let revokeObjectURLMock: ReturnType<typeof vi.fn>;
  let anchorClickMock: ReturnType<typeof vi.fn>;
  let createdBlobs: { content: string[]; options?: BlobPropertyBag }[] = [];

  const mockRoastData: RoastData = {
    overallScore: 62,
    tone: 'spicy',
    summaryVerdict: 'CV có cấu trúc nhưng thiếu các chỉ số đo lường hiệu quả cụ thể.',
    topStrengths: ['Kiến thức React và Next.js rõ ràng', 'Có kinh nghiệm TypeScript'],
    weaknesses: [
      {
        quote: 'Tham gia phát triển dự án E-commerce bằng Next.js',
        issue: 'Thiếu định lượng quy mô và vai trò cụ thể',
        severity: 'Cao',
        rejectionReason: 'Không chứng minh được kết quả đầu ra thực tế',
        fixGuideline: 'Áp dụng công thức: [Hành động] [Dự án] đạt [Số liệu]',
      },
      {
        quote: 'Hỗ trợ đồng nghiệp tối ưu cơ sở dữ liệu MongoDB',
        issue: 'Động từ bị động, thiếu sự chủ động',
        severity: 'Trung bình',
        rejectionReason: 'Gây cảm giác chỉ là người phụ việc',
        fixGuideline: 'Đổi thành: Tái cấu trúc [Module query] giảm latency [X%].',
      },
      {
        quote: 'Năng nổ, nhiệt tình, có khả năng làm việc dưới áp lực',
        issue: 'Sáo rỗng, không thể kiểm chứng',
        severity: 'Thấp',
        rejectionReason: 'Tốn dung lượng nhưng ATS chấm 0 điểm',
        fixGuideline: 'Thay bằng minh chứng dự án chịu tải hoặc loại bỏ.',
      },
    ],
    atsRecommendations: [
      {
        category: 'Từ khóa',
        recommendation: 'Bổ sung từ khóa Action Verbs và chuẩn hóa định dạng ngày tháng',
        impact: 'Quan trọng',
      },
    ],
    disclaimer: 'Phản hồi mang tính chất luyện tập và tham khảo.',
  };

  const sampleRewriteData1 = {
    originalQuote: 'Tham gia phát triển dự án E-commerce bằng Next.js',
    rewrittenText:
      'Chủ trì kiến trúc mô-đun thanh toán E-commerce bằng Next.js, tăng [30%] tốc độ chuyển đổi cho [20.000+] người dùng.',
    actionVerb: 'Chủ trì kiến trúc',
    actionVerbCategory: 'Lãnh đạo / Kỹ thuật',
    context: 'mô-đun thanh toán E-commerce bằng Next.js',
    result: 'tăng [30%] tốc độ chuyển đổi cho [20.000+] người dùng',
    explanation: 'Sử dụng động từ hành động mạnh kết hợp số liệu định lượng chuẩn ATS.',
    atsKeywords: ['Chủ trì', 'Next.js', 'E-commerce', 'Thanh toán'],
  };

  const sampleRewriteData2 = {
    originalQuote: 'Hỗ trợ đồng nghiệp tối ưu cơ sở dữ liệu MongoDB',
    rewrittenText:
      'Tái cấu trúc chỉ mục và truy vấn cơ sở dữ liệu MongoDB, giảm [45%] thời gian phản hồi API.',
    actionVerb: 'Tái cấu trúc',
    actionVerbCategory: 'Tối ưu hóa',
    context: 'chỉ mục và truy vấn cơ sở dữ liệu MongoDB',
    result: 'giảm [45%] thời gian phản hồi API',
    explanation: 'Loại bỏ từ ngữ bị động, nhấn mạnh kỹ năng indexing và profiling.',
    atsKeywords: ['Tái cấu trúc', 'MongoDB', 'Tối ưu hóa API'],
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

    const originalBlob = global.Blob;
    vi.spyOn(global, 'Blob').mockImplementation(function (content: any, options: any) {
      createdBlobs.push({ content, options });
      return new originalBlob(content, options);
    });

    createObjectURLMock = vi.fn().mockReturnValue('blob:mock-url-challenger');
    revokeObjectURLMock = vi.fn();
    global.URL.createObjectURL = createObjectURLMock as any;
    global.URL.revokeObjectURL = revokeObjectURLMock as any;

    anchorClickMock = vi.fn();
    HTMLAnchorElement.prototype.click = anchorClickMock as any;

    // Default mock for /api/rewrite based on quote
    vi.spyOn(global, 'fetch').mockImplementation(async (input: any, init?: any) => {
      const body = init?.body ? JSON.parse(init.body as string) : {};
      if (body.quote && body.quote.includes('MongoDB')) {
        return new Response(JSON.stringify({ success: true, data: sampleRewriteData2 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ success: true, data: sampleRewriteData1 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // SECTION 1: IN-PLACE EDITING STATE TRANSITIONS
  // =========================================================================
  describe('1. In-Place Editing State Transitions: Edit Text, Save, Cancel, Revert to AI Draft', () => {
    it('handles edit -> save cycle: persists customized text and updates preview badges and copy clipboard', async () => {
      const user = userEvent.setup();

      render(
        React.createElement(RoastReport, {
          data: mockRoastData,
          cvText: 'Kinh nghiệm:\n- Tham gia phát triển dự án E-commerce bằng Next.js',
          onReset: vi.fn(),
          onChangeTone: vi.fn(),
          onEditCv: vi.fn(),
        })
      );

      // Trigger rewrite on weakness 0
      const rewriteBtns = screen.getAllByRole('button', { name: /tối ưu hóa theo chuẩn ats/i });
      await user.click(rewriteBtns[0]);

      // Wait for success view
      await waitFor(() => {
        expect(screen.getByText(/action verb: chủ trì kiến trúc/i)).toBeInTheDocument();
      });

      // Enter edit mode
      const editBtn = screen.getByRole('button', { name: /chỉnh sửa/i });
      await user.click(editBtn);

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea).toBeInTheDocument();
      expect(textarea.value).toBe(sampleRewriteData1.rewrittenText);

      // Replace placeholders with real numbers: [30%] -> 35%, [20.000+] -> 50.000+
      const customValue = textarea.value
        .replace('[30%]', '35%')
        .replace('[20.000+]', '50.000+');
      fireEvent.change(textarea, { target: { value: customValue } });

      // Click save
      const saveBtn = screen.getByRole('button', { name: /lưu thay đổi/i });
      await user.click(saveBtn);

      // Verify returned to view mode with updated text
      await waitFor(() => {
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
        expect(screen.getByText(/tăng 35% tốc độ chuyển đổi cho 50\.000\+ người dùng/i)).toBeInTheDocument();
      });

      // Verify toast appeared
      expect(screen.getByRole('status')).toHaveTextContent(/đã lưu chỉnh sửa thành công/i);

      // Verify copy button copies the customized text
      const writeSpy = vi.spyOn(navigator.clipboard, 'writeText');
      const copyBtn = screen.getByRole('button', { name: /sao chép câu này/i });
      fireEvent.click(copyBtn);
      await waitFor(() => {
        expect(writeSpy).toHaveBeenCalledWith(customValue);
      });
    });

    it('handles edit -> cancel cycle: discards dirty edits and maintains previously saved state', async () => {
      const user = userEvent.setup();

      render(
        React.createElement(RoastReport, {
          data: mockRoastData,
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

      // Edit and Cancel
      await user.click(screen.getByRole('button', { name: /chỉnh sửa/i }));
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: 'Dữ liệu chưa lưu sẽ bị hủy bỏ...' } });

      const cancelBtn = screen.getByRole('button', { name: /hủy/i });
      await user.click(cancelBtn);

      // View mode displays original proposal
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(screen.queryByText('Dữ liệu chưa lưu sẽ bị hủy bỏ...')).not.toBeInTheDocument();
      expect(screen.getByText(/chủ trì kiến trúc mô-đun thanh toán/i)).toBeInTheDocument();

      // Re-enter edit mode: verify textarea contains original text, NOT the discarded dirty text
      await user.click(screen.getByRole('button', { name: /chỉnh sửa/i }));
      const reopenedTextarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(reopenedTextarea.value).toBe(sampleRewriteData1.rewrittenText);
    });

    it('handles edit -> revert to AI draft: restores original AI suggestion and persists upon save', async () => {
      const user = userEvent.setup();

      render(
        React.createElement(RoastReport, {
          data: mockRoastData,
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

      // Step 1: Customize text and save
      await user.click(screen.getByRole('button', { name: /chỉnh sửa/i }));
      let textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: 'Chỉnh sửa lần 1 đã lưu' } });
      await user.click(screen.getByRole('button', { name: /lưu thay đổi/i }));

      await waitFor(() => {
        expect(screen.getByText('Chỉnh sửa lần 1 đã lưu')).toBeInTheDocument();
      });

      // Step 2: Open editor again, click "Khôi phục đề xuất AI"
      await user.click(screen.getByRole('button', { name: /chỉnh sửa/i }));
      textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.value).toBe('Chỉnh sửa lần 1 đã lưu');

      const revertBtn = screen.getByRole('button', { name: /khôi phục đề xuất ai/i });
      await user.click(revertBtn);

      // Textarea must now display original AI proposal with bracketed placeholders
      expect(textarea.value).toBe(sampleRewriteData1.rewrittenText);

      // Step 3: Save reverted proposal
      await user.click(screen.getByRole('button', { name: /lưu thay đổi/i }));

      // View mode displays restored AI proposal
      await waitFor(() => {
        expect(screen.getByText('[30%]')).toBeInTheDocument();
        expect(screen.getByText('[20.000+]')).toBeInTheDocument();
      });
    });

    it('maintains strict card isolation when multiple cards are edited simultaneously', async () => {
      const user = userEvent.setup();

      // Set pro user to allow multiple rewrites without paywall
      localStorage.setItem('airoastcv:is_pro', 'true');

      render(
        React.createElement(RoastReport, {
          data: mockRoastData,
          cvText: 'CV text...',
          onReset: vi.fn(),
          onChangeTone: vi.fn(),
          onEditCv: vi.fn(),
        })
      );

      const rewriteBtns = screen.getAllByRole('button', { name: /tối ưu hóa theo chuẩn ats/i });

      // Trigger Card 0 and Card 1
      await user.click(rewriteBtns[0]);
      await waitFor(() => {
        expect(screen.getByText(/action verb: chủ trì kiến trúc/i)).toBeInTheDocument();
      });

      const freshRewriteBtns = screen.getAllByRole('button', { name: /tối ưu hóa theo chuẩn ats/i });
      await user.click(freshRewriteBtns[0]);
      await waitFor(() => {
        expect(screen.getByText(/action verb: tái cấu trúc/i)).toBeInTheDocument();
      });

      // Enter edit mode on Card 0
      const editBtns = screen.getAllByRole('button', { name: /chỉnh sửa/i });
      await user.click(editBtns[0]);

      // Only Card 0 should have a textbox
      const textareas = screen.getAllByRole('textbox');
      expect(textareas).toHaveLength(1);
      fireEvent.change(textareas[0], { target: { value: 'Chỉ sửa đổi Card 0' } });

      // Card 1 must still be in view mode displaying its data
      expect(screen.getByText(/action verb: tái cấu trúc/i)).toBeInTheDocument();

      // Save Card 0
      const saveBtn = screen.getByRole('button', { name: /lưu thay đổi/i });
      await user.click(saveBtn);

      await waitFor(() => {
        expect(screen.getByText('Chỉ sửa đổi Card 0')).toBeInTheDocument();
        expect(screen.getByText(/giảm \[45%\] thời gian phản hồi api/i)).toBeInTheDocument();
      });
    });
  });

  // =========================================================================
  // SECTION 2: FULL CV EXPORT WITH VARIED QUOTES
  // =========================================================================
  describe('2. Full CV Export with Varied Quotes (Exact Match, Whitespace, Unmatched Fallback)', () => {
    it('substitutes exact matching quotes while keeping the rest of CV body intact', () => {
      const cvText = [
        'HỌ VÀ TÊN: LÊ VĂN C',
        'KINH NGHIỆM:',
        '- Tham gia phát triển dự án E-commerce bằng Next.js',
        '- Học vấn: Đại học Bách Khoa',
      ].join('\n');

      const rewriteStates: Record<number, WeaknessCardState> = {
        0: {
          status: 'success',
          data: {
            ...sampleRewriteData1,
            customizedText: 'Chủ trì kiến trúc thanh toán đạt 35% conversion',
          },
        },
      };

      render(
        React.createElement(ExportCvModal, {
          isOpen: true,
          onClose: vi.fn(),
          originalCvText: cvText,
          reportData: mockRoastData,
          rewriteStates,
          targetRole: 'Fullstack Developer',
        })
      );

      const preview = screen.getByRole('dialog').querySelector('pre');
      const content = preview?.textContent || '';
      const [body, appendix] = content.split('---');

      // Exact match in body is substituted
      expect(body).toContain('- Chủ trì kiến trúc thanh toán đạt 35% conversion');
      expect(body).not.toContain('Tham gia phát triển dự án E-commerce bằng Next.js');
      expect(body).toContain('Học vấn: Đại học Bách Khoa');

      // Appendix records both original and customized
      expect(appendix).toContain('Tham gia phát triển dự án E-commerce bằng Next.js');
      expect(appendix).toContain('Chủ trì kiến trúc thanh toán đạt 35% conversion');
      expect(appendix).toContain('Action Verb');
    });

    it('substitutes quotes with irregular whitespace and newlines safely', () => {
      // CV text contains multi-space irregular formatting from OCR
      const cvText = 'KINH NGHIỆM:\n- Tham gia    phát triển   dự án E-commerce   bằng Next.js\n- Hết';

      const roastWithIrregularQuote: RoastData = {
        ...mockRoastData,
        weaknesses: [
          {
            ...mockRoastData.weaknesses[0],
            quote: 'Tham gia    phát triển   dự án E-commerce   bằng Next.js',
          },
        ],
      };

      const rewriteStates: Record<number, WeaknessCardState> = {
        0: {
          status: 'success',
          data: {
            ...sampleRewriteData1,
            customizedText: 'Chủ trì phát triển module thanh toán',
          },
        },
      };

      render(
        React.createElement(ExportCvModal, {
          isOpen: true,
          onClose: vi.fn(),
          originalCvText: cvText,
          reportData: roastWithIrregularQuote,
          rewriteStates,
        })
      );

      const preview = screen.getByRole('dialog').querySelector('pre');
      const content = preview?.textContent || '';
      const [body] = content.split('---');

      expect(body).toContain('Chủ trì phát triển module thanh toán');
      expect(body).not.toContain('Tham gia    phát triển   dự án E-commerce   bằng Next.js');
    });

    it('handles unmatched quotes safely by preserving base CV and listing in ATS appendix fallback', () => {
      // The original CV text completely lacks the quote
      const cvText = 'NGUYỄN VĂN D - DEV\nKinh nghiệm: Lập trình viên tại Công ty ABC.';

      const rewriteStates: Record<number, WeaknessCardState> = {
        0: {
          status: 'success',
          data: {
            ...sampleRewriteData1,
            customizedText: 'Chủ trì kiến trúc microservices chịu tải cao',
          },
        },
      };

      render(
        React.createElement(ExportCvModal, {
          isOpen: true,
          onClose: vi.fn(),
          originalCvText: cvText,
          reportData: mockRoastData,
          rewriteStates,
        })
      );

      const preview = screen.getByRole('dialog').querySelector('pre');
      const content = preview?.textContent || '';
      const [body, appendix] = content.split('---');

      // Base CV is unharmed
      expect(body).toContain('NGUYỄN VĂN D - DEV');
      expect(body).toContain('Kinh nghiệm: Lập trình viên tại Công ty ABC.');

      // Appendix fallback ensures improved text is never lost
      expect(appendix).toContain('## BẢNG TỔNG HỢP CẢI TIẾN CHUẨN ATS');
      expect(appendix).toContain('Chủ trì kiến trúc microservices chịu tải cao');
      expect(appendix).toContain(sampleRewriteData1.originalQuote);
    });

    it('handles special characters, regex punctuation, and dollar metrics ($100K) safely in export', () => {
      const cvText = 'Dự án: [FinTech-v2] (React/Node) {AWS} -> Chi phí $500K?';

      const customRoast: RoastData = {
        ...mockRoastData,
        weaknesses: [
          {
            quote: '[FinTech-v2] (React/Node) {AWS} -> Chi phí $500K?',
            issue: 'Định dạng khó quét ATS',
            severity: 'Cao',
            rejectionReason: 'Dấu câu phức tạp',
            fixGuideline: 'Đơn giản hóa định dạng',
          },
        ],
      };

      const rewriteStates: Record<number, WeaknessCardState> = {
        0: {
          status: 'success',
          data: {
            originalQuote: '[FinTech-v2] (React/Node) {AWS} -> Chi phí $500K?',
            rewrittenText: 'Chủ trì phát triển cổng thanh toán FinTech tiết kiệm $150K chi phí AWS',
            customizedText: 'Chủ trì phát triển cổng thanh toán FinTech tiết kiệm $150K chi phí AWS',
            actionVerb: 'Chủ trì phát triển',
            context: 'cổng thanh toán FinTech',
            result: 'tiết kiệm $150K chi phí AWS',
            explanation: 'ATS ok',
            atsKeywords: ['FinTech', 'AWS'],
          },
        },
      };

      render(
        React.createElement(ExportCvModal, {
          isOpen: true,
          onClose: vi.fn(),
          originalCvText: cvText,
          reportData: customRoast,
          rewriteStates,
        })
      );

      const preview = screen.getByRole('dialog').querySelector('pre');
      const content = preview?.textContent || '';
      const [body, appendix] = content.split('---');

      // Special characters replaced without throw
      expect(body).toContain('Chủ trì phát triển cổng thanh toán FinTech');
      expect(appendix).toContain('FinTech');
      expect(appendix).toContain('AWS');
    });

    it('generates fallback header when originalCvText is completely empty', () => {
      render(
        React.createElement(ExportCvModal, {
          isOpen: true,
          onClose: vi.fn(),
          originalCvText: '',
          reportData: mockRoastData,
          rewriteStates: {},
          targetRole: 'Backend Engineer',
        })
      );

      const preview = screen.getByRole('dialog').querySelector('pre');
      const content = preview?.textContent || '';

      expect(content).toContain('# CV ỨNG TUYỂN — BACKEND ENGINEER');
      expect(content).toContain(mockRoastData.summaryVerdict);
      expect(content).toContain('*Chưa có mục nào được tối ưu qua trợ lý ATS.*');
    });
  });

  // =========================================================================
  // SECTION 3: MARKDOWN (.MD) AND PLAIN TEXT (.TXT) BLOB GENERATION
  // =========================================================================
  describe('3. Markdown (.md) and Plain Text (.txt) Blob Generation & Download Verification', () => {
    const activeRewriteStates: Record<number, WeaknessCardState> = {
      0: {
        status: 'success',
        data: {
          ...sampleRewriteData1,
          customizedText: 'Chủ trì kiến trúc mô-đun E-commerce đạt 35% conversion',
        },
      },
    };

    it('generates clean Markdown Blob with text/markdown;charset=utf-8 MIME type and correct filename', () => {
      render(
        React.createElement(ExportCvModal, {
          isOpen: true,
          onClose: vi.fn(),
          originalCvText: 'Tham gia phát triển dự án E-commerce bằng Next.js',
          reportData: mockRoastData,
          rewriteStates: activeRewriteStates,
        })
      );

      // In MD tab
      const downloadMdBtn = screen.getByRole('button', { name: /tải tệp \.md/i });
      fireEvent.click(downloadMdBtn);

      expect(createdBlobs.length).toBeGreaterThan(0);
      const mdBlob = createdBlobs[createdBlobs.length - 1];
      expect(mdBlob.options).toEqual({ type: 'text/markdown;charset=utf-8' });
      expect(mdBlob.content[0]).toContain('## BẢNG TỔNG HỢP CẢI TIẾN CHUẨN ATS');
      expect(mdBlob.content[0]).toContain('- **Đoạn gốc:**');
      expect(mdBlob.content[0]).toContain('- **Đoạn đã tối ưu ATS:**');

      // Verify ObjectURL creation and revocation
      expect(createObjectURLMock).toHaveBeenCalled();
      expect(anchorClickMock).toHaveBeenCalled();
      expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:mock-url-challenger');
    });

    it('switches to Plain Text (.txt) tab, generates text/plain;charset=utf-8 Blob and downloads clean text', () => {
      render(
        React.createElement(ExportCvModal, {
          isOpen: true,
          onClose: vi.fn(),
          originalCvText: 'Tham gia phát triển dự án E-commerce bằng Next.js',
          reportData: mockRoastData,
          rewriteStates: activeRewriteStates,
        })
      );

      // Switch to TXT tab
      const txtTab = screen.getByRole('button', { name: /văn bản thuần \(\.txt\)/i });
      fireEvent.click(txtTab);

      // Verify preview in TXT format
      const preview = screen.getByRole('dialog').querySelector('pre');
      expect(preview?.textContent).toContain('BANG TONG HOP CAC MUC DA TOI UU HOA CHUAN ATS');
      expect(preview?.textContent).not.toContain('## BẢNG TỔNG HỢP');

      // Download TXT
      const downloadTxtBtn = screen.getByRole('button', { name: /tải tệp \.txt/i });
      fireEvent.click(downloadTxtBtn);

      const txtBlob = createdBlobs[createdBlobs.length - 1];
      expect(txtBlob.options).toEqual({ type: 'text/plain;charset=utf-8' });
      expect(txtBlob.content[0]).toContain('BANG TONG HOP CAC MUC DA TOI UU HOA CHUAN ATS');
      expect(txtBlob.content[0]).toContain('- Doan toi uu ATS:');

      expect(createObjectURLMock).toHaveBeenCalled();
      expect(anchorClickMock).toHaveBeenCalled();
      expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:mock-url-challenger');
    });

    it('copies tab-synchronized content to clipboard on demand', async () => {
      render(
        React.createElement(ExportCvModal, {
          isOpen: true,
          onClose: vi.fn(),
          originalCvText: 'Tham gia phát triển dự án E-commerce bằng Next.js',
          reportData: mockRoastData,
          rewriteStates: activeRewriteStates,
        })
      );

      const copyAllBtn = screen.getByRole('button', { name: /sao chép toàn bộ/i });

      // 1. Copy Markdown
      fireEvent.click(copyAllBtn);
      expect(writeTextMock).toHaveBeenLastCalledWith(
        expect.stringContaining('## BẢNG TỔNG HỢP CẢI TIẾN CHUẨN ATS')
      );

      // 2. Switch to TXT and Copy
      const txtTab = screen.getByRole('button', { name: /văn bản thuần \(\.txt\)/i });
      fireEvent.click(txtTab);

      fireEvent.click(copyAllBtn);
      expect(writeTextMock).toHaveBeenLastCalledWith(
        expect.stringContaining('BANG TONG HOP CAC MUC DA TOI UU HOA CHUAN ATS')
      );
    });
  });

  // =========================================================================
  // SECTION 4: 1-CLICK WIPE DATA PURGING AUDIT
  // =========================================================================
  describe('4. 1-Click Wipe Data: Rewrite Drafts, Counters, and UI Reset', () => {
    it('confirms STORAGE_KEYS_TO_CLEAR explicitly includes all rewrite-related keys', () => {
      expect(STORAGE_KEYS_TO_CLEAR).toContain('airoastcv_rewrite_count');
      expect(STORAGE_KEYS_TO_CLEAR).toContain('airoastcv_rewrite_drafts');
      expect(STORAGE_KEYS_TO_CLEAR).toContain('airoastcv_rewrite_states');
    });

    it('purges all rewrite drafts, usage counters, and resets RoastReport states when data-wiped event is received', async () => {
      // Pre-seed storage with rewrite data and counters
      localStorage.setItem('airoastcv_rewrite_count', '3');
      localStorage.setItem('airoastcv_rewrite_drafts', JSON.stringify({ 0: 'draft content' }));
      localStorage.setItem('airoastcv_rewrite_states', JSON.stringify({ 0: 'success' }));
      sessionStorage.setItem('airoastcv_temp', 'temp');

      expect(localStorage.getItem('airoastcv_rewrite_count')).toBe('3');

      render(
        React.createElement(RoastReport, {
          data: mockRoastData,
          cvText: 'CV text...',
          onReset: vi.fn(),
          onChangeTone: vi.fn(),
          onEditCv: vi.fn(),
        })
      );

      // Perform wipe
      act(() => {
        const wipeRes = wipeAllSessionData();
        expect(wipeRes.success).toBe(true);
      });

      // LocalStorage & SessionStorage are completely empty
      expect(localStorage.getItem('airoastcv_rewrite_count')).toBeNull();
      expect(localStorage.getItem('airoastcv_rewrite_drafts')).toBeNull();
      expect(localStorage.getItem('airoastcv_rewrite_states')).toBeNull();
      expect(localStorage.length).toBe(0);
      expect(sessionStorage.length).toBe(0);

      // UI resets to idle buttons
      await waitFor(() => {
        const rewriteBtns = screen.getAllByRole('button', { name: /tối ưu hóa theo chuẩn ats/i });
        expect(rewriteBtns).toHaveLength(3);
      });
    });

    it('restores free trial rewrite capacity after 1-Click Wipe Data', async () => {
      const user = userEvent.setup();

      render(
        React.createElement(RoastReport, {
          data: mockRoastData,
          cvText: 'CV text...',
          onReset: vi.fn(),
          onChangeTone: vi.fn(),
          onEditCv: vi.fn(),
        })
      );

      const rewriteBtns = screen.getAllByRole('button', { name: /tối ưu hóa theo chuẩn ats/i });

      // 1st rewrite (free trial) succeeds
      await user.click(rewriteBtns[0]);
      await waitFor(() => {
        expect(screen.getByText(/action verb: chủ trì kiến trúc/i)).toBeInTheDocument();
      });
      expect(localStorage.getItem('airoastcv_rewrite_count')).toBe('1');

      // 2nd rewrite attempt is blocked by CheckoutModal
      await user.click(rewriteBtns[1]);
      await waitFor(() => {
        expect(screen.getByText(/nâng cấp gói pro/i)).toBeInTheDocument();
      });

      // Candidate clicks "Xóa sạch dữ liệu"
      const wipeBtn = screen.getByRole('button', { name: /xóa sạch dữ liệu/i });
      await user.click(wipeBtn);

      expect(localStorage.getItem('airoastcv_rewrite_count')).toBeNull();

      // Rerender fresh after reset
      render(
        React.createElement(RoastReport, {
          data: mockRoastData,
          cvText: 'CV text...',
          onReset: vi.fn(),
          onChangeTone: vi.fn(),
          onEditCv: vi.fn(),
        })
      );

      // Free user can now use their free rewrite trial again
      const freshRewriteBtns = screen.getAllByRole('button', { name: /tối ưu hóa theo chuẩn ats/i });
      await user.click(freshRewriteBtns[0]);

      await waitFor(() => {
        expect(screen.getByText(/action verb: chủ trì kiến trúc/i)).toBeInTheDocument();
      });
      expect(screen.queryByText(/nâng cấp gói pro/i)).not.toBeInTheDocument();
    });
  });

  // =========================================================================
  // SECTION 5: ADVANCED ADVERSARIAL EDGE CASES & STRESS CONDITIONS
  // =========================================================================
  describe('5. Advanced Adversarial Stress Conditions & Boundary Cases', () => {
    it('closes open ExportCvModal immediately upon receiving data-wiped event', async () => {
      render(
        React.createElement(RoastReport, {
          data: mockRoastData,
          cvText: 'CV text...',
          onReset: vi.fn(),
          onChangeTone: vi.fn(),
          onEditCv: vi.fn(),
        })
      );

      // Open Export Modal
      const exportBtn = screen.getByRole('button', { name: /xuất cv cải tiến/i });
      fireEvent.click(exportBtn);

      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Dispatch wipe event
      act(() => {
        window.dispatchEvent(new CustomEvent(WIPE_DATA_EVENT_NAME));
      });

      // Dialog should close immediately
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('renders 3/3 fully optimized state and verifies all items in appendix', () => {
      const fullStates: Record<number, WeaknessCardState> = {
        0: {
          status: 'success',
          data: {
            ...sampleRewriteData1,
            customizedText: 'Chủ trì kiến trúc Next.js 1',
          },
        },
        1: {
          status: 'success',
          data: {
            ...sampleRewriteData2,
            customizedText: 'Tái cấu trúc MongoDB 2',
          },
        },
        2: {
          status: 'success',
          data: {
            originalQuote: mockRoastData.weaknesses[2].quote,
            rewrittenText: 'Chứng minh năng lực chịu tải 3',
            customizedText: 'Chứng minh năng lực chịu tải 3',
            actionVerb: 'Chứng minh',
            context: 'năng lực chịu tải',
            result: 'tăng độ tin cậy',
            explanation: 'ATS ok',
            atsKeywords: ['Chịu tải'],
          },
        },
      };

      render(
        React.createElement(ExportCvModal, {
          isOpen: true,
          onClose: vi.fn(),
          originalCvText: 'CV text',
          reportData: mockRoastData,
          rewriteStates: fullStates,
        })
      );

      // Badge check
      expect(screen.getByText('3/3 mục đã tối ưu')).toBeInTheDocument();

      const preview = screen.getByRole('dialog').querySelector('pre');
      const content = preview?.textContent || '';

      expect(content).toContain('Mục 1: Thiếu định lượng quy mô và vai trò cụ thể');
      expect(content).toContain('Mục 2: Động từ bị động, thiếu sự chủ động');
      expect(content).toContain('Mục 3: Sáo rỗng, không thể kiểm chứng');
    });

    it('tests empty or whitespace-only draft edit handling', async () => {
      const user = userEvent.setup();

      render(
        React.createElement(RoastReport, {
          data: mockRoastData,
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

      // Candidate clears input completely
      fireEvent.change(textarea, { target: { value: '' } });

      // Save
      await user.click(screen.getByRole('button', { name: /lưu thay đổi/i }));

      // Because "" is falsy, handleSaveEdit falls back to customizedText
      await waitFor(() => {
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
        expect(screen.getByText(/chủ trì kiến trúc mô-đun thanh toán/i)).toBeInTheDocument();
      });
    });

    it('prevents multiple concurrent fetch requests when trigger button is clicked while loading', async () => {
      const user = userEvent.setup();
      let resolvePromise!: (res: Response) => void;
      const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve;
          })
      );

      render(
        React.createElement(RoastReport, {
          data: mockRoastData,
          cvText: 'CV text...',
          onReset: vi.fn(),
          onChangeTone: vi.fn(),
          onEditCv: vi.fn(),
        })
      );

      const rewriteBtns = screen.getAllByRole('button', { name: /tối ưu hóa theo chuẩn ats/i });

      // First click
      await user.click(rewriteBtns[0]);

      // Button for card 0 is immediately replaced by loader, leaving only 2 buttons for the other cards
      expect(screen.getByText(/đang tối ưu hóa theo chuẩn ats\.\.\./i)).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /tối ưu hóa theo chuẩn ats/i })).toHaveLength(2);

      // Only 1 fetch call was initiated
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      // Resolve fetch
      act(() => {
        resolvePromise(
          new Response(JSON.stringify({ success: true, data: sampleRewriteData1 }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        );
      });

      await waitFor(() => {
        expect(screen.getByText(/action verb: chủ trì kiến trúc/i)).toBeInTheDocument();
      });
    });
  });
});

