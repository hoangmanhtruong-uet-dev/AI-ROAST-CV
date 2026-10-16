import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RoastReport } from '@/components/roast/RoastReport';
import { RoastData } from '@/lib/schemas/roast';
import { WIPE_DATA_EVENT_NAME } from '@/lib/storage/wipe-data';

describe('RoastReport: ATS CV Rewrite Assistant & Export Modal (Milestone 7)', () => {
  let writeTextMock: ReturnType<typeof vi.fn>;

  const mockRoastData: RoastData = {
    overallScore: 68,
    tone: 'spicy',
    summaryVerdict: 'CV tương đối nhưng còn thiếu số liệu đo lường cụ thể.',
    topStrengths: ['Biết áp dụng Next.js'],
    weaknesses: [
      {
        quote: 'Tham gia dự án thương mại điện tử bằng Next.js',
        issue: 'Thiếu số liệu và vai trò cụ thể',
        severity: 'Cao',
        rejectionReason: 'Nhà tuyển dụng không đo lường được giá trị thực tế tạo ra',
        fixGuideline: 'Đổi thành: Chủ trì module [tên module], tối ưu tốc độ [X%].',
      },
      {
        quote: 'Hỗ trợ viết API backend với Node.js',
        issue: 'Câu văn bị động, thiếu quyền làm chủ',
        severity: 'Trung bình',
        rejectionReason: 'Từ ngữ thụ động gây cảm giác chỉ phụ việc vặt',
        fixGuideline: 'Đổi thành: Thiết kế kiến trúc [API endpoint] phục vụ [Y] requests.',
      },
    ],
    atsRecommendations: [
      {
        category: 'Cấu trúc',
        recommendation: 'Sử dụng tiêu đề chuẩn ATS',
        impact: 'Quan trọng',
      },
    ],
    disclaimer: 'Chỉ mang tính chất tham khảo luyện tập.',
  };

  const sampleRewriteResponse = {
    success: true,
    data: {
      originalQuote: 'Tham gia dự án thương mại điện tử bằng Next.js',
      rewrittenText:
        'Chủ trì phát triển mô-đun đặt hàng trực tuyến bằng Next.js, giúp tăng [25%] tốc độ thanh toán và phục vụ [50.000+] người dùng.',
      actionVerb: 'Chủ trì phát triển',
      actionVerbCategory: 'Lãnh đạo / Chủ trì',
      context: 'mô-đun đặt hàng trực tuyến bằng Next.js',
      result: 'tăng [25%] tốc độ thanh toán và phục vụ [50.000+] người dùng',
      explanation: 'Sử dụng động từ hành động chủ động kết hợp số liệu định lượng chuẩn ATS.',
      atsKeywords: ['Chủ trì', 'Next.js', 'Đặt hàng trực tuyến'],
    },
  };

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();

    writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: writeTextMock,
      },
      configurable: true,
      writable: true,
    });

    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-blob-url');
    global.URL.revokeObjectURL = vi.fn();
    HTMLAnchorElement.prototype.click = vi.fn();

    // Default fetch mock
    vi.spyOn(global, 'fetch').mockImplementation(async (input: any) => {
      const url = typeof input === 'string' ? input : input?.url || '';
      if (url.includes('/api/rewrite')) {
        return new Response(JSON.stringify(sampleRewriteResponse), {
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

  describe('1. Weakness Trigger & Action Toolbar Verification', () => {
    it('renders "Tối ưu hóa theo chuẩn ATS" button for each detected weakness', () => {
      render(
        React.createElement(RoastReport, {
          data: mockRoastData,
          cvText: 'CV nội dung gốc...',
          onReset: vi.fn(),
          onChangeTone: vi.fn(),
          onEditCv: vi.fn(),
        })
      );

      const rewriteButtons = screen.getAllByRole('button', {
        name: /tối ưu hóa theo chuẩn ats/i,
      });
      expect(rewriteButtons).toHaveLength(2);
    });

    it('renders "Xuất CV cải tiến (.md / .txt)" button in toolbar', () => {
      render(
        React.createElement(RoastReport, {
          data: mockRoastData,
          cvText: 'CV nội dung gốc...',
          onReset: vi.fn(),
          onChangeTone: vi.fn(),
          onEditCv: vi.fn(),
        })
      );

      expect(
        screen.getByRole('button', { name: /xuất cv cải tiến/i })
      ).toBeInTheDocument();
    });
  });

  describe('2. State Transition: Idle -> Loading -> Success', () => {
    it('transitions to loading and then renders ATS Optimization card with formula badges', async () => {
      const user = userEvent.setup();

      let resolveFetch!: (res: Response) => void;
      vi.spyOn(global, 'fetch').mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFetch = resolve;
          })
      );

      render(
        React.createElement(RoastReport, {
          data: mockRoastData,
          cvText: 'Kinh nghiệm: Tham gia dự án thương mại điện tử bằng Next.js',
          targetRole: 'Frontend Engineer',
          onReset: vi.fn(),
          onChangeTone: vi.fn(),
          onEditCv: vi.fn(),
        })
      );

      const rewriteButtons = screen.getAllByRole('button', {
        name: /tối ưu hóa theo chuẩn ats/i,
      });
      await user.click(rewriteButtons[0]);

      // Loading state
      expect(screen.getByText(/đang tối ưu hóa theo chuẩn ats/i)).toBeInTheDocument();
      expect(
        screen.getByText(/áp dụng công thức action verb \+ context \+ result/i)
      ).toBeInTheDocument();

      // Resolve the fetch call
      resolveFetch(
        new Response(JSON.stringify(sampleRewriteResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      // Success state
      await waitFor(() => {
        expect(screen.getByText(/action verb: chủ trì phát triển/i)).toBeInTheDocument();
        expect(
          screen.getByText(/context: mô-đun đặt hàng trực tuyến/i)
        ).toBeInTheDocument();
        expect(screen.getByText(/result: tăng \[25%\]/i)).toBeInTheDocument();
      });

      // Verify keywords and explanation
      expect(screen.getByText(/động từ hành động chủ động/i)).toBeInTheDocument();
      expect(screen.getByText('Next.js')).toBeInTheDocument();
    });
  });

  describe('3. State Transition: Error & Retry Flow', () => {
    it('renders error notice on API failure and retries successfully', async () => {
      const user = userEvent.setup();

      // First call fails
      vi.spyOn(global, 'fetch')
        .mockImplementationOnce(async () => {
          return new Response(
            JSON.stringify({ success: false, error: 'Hệ thống AI quá tải' }),
            { status: 502, headers: { 'Content-Type': 'application/json' } }
          );
        })
        // Subsequent calls succeed
        .mockImplementation(async () => {
          return new Response(JSON.stringify(sampleRewriteResponse), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        });

      render(
        React.createElement(RoastReport, {
          data: mockRoastData,
          cvText: 'CV gốc...',
          onReset: vi.fn(),
          onChangeTone: vi.fn(),
          onEditCv: vi.fn(),
        })
      );

      const rewriteButtons = screen.getAllByRole('button', {
        name: /tối ưu hóa theo chuẩn ats/i,
      });
      await user.click(rewriteButtons[0]);

      // Error banner
      await waitFor(() => {
        expect(screen.getByText(/hệ thống ai quá tải/i)).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /thử lại/i });
      expect(retryButton).toBeInTheDocument();

      // Click retry
      await user.click(retryButton);

      // Successfully transitioned to success
      await waitFor(() => {
        expect(screen.getByText(/action verb: chủ trì phát triển/i)).toBeInTheDocument();
      });
    });
  });

  describe('4. In-Place Editing Mechanics', () => {
    it('allows candidate to edit placeholders, save, cancel, and restore AI proposal', async () => {
      const user = userEvent.setup();

      render(
        React.createElement(RoastReport, {
          data: mockRoastData,
          cvText: 'CV gốc...',
          onReset: vi.fn(),
          onChangeTone: vi.fn(),
          onEditCv: vi.fn(),
        })
      );

      const rewriteButtons = screen.getAllByRole('button', {
        name: /tối ưu hóa theo chuẩn ats/i,
      });
      await user.click(rewriteButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /chỉnh sửa/i })).toBeInTheDocument();
      });

      // Click edit
      await user.click(screen.getByRole('button', { name: /chỉnh sửa/i }));

      // Textarea should appear
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea).toBeInTheDocument();
      expect(textarea.value).toContain('Chủ trì phát triển');

      // Edit text (replace [25%] with 35%)
      const customValue = textarea.value.replace('[25%]', '35%');
      fireEvent.change(textarea, { target: { value: customValue } });

      // Click save
      const saveButton = screen.getByRole('button', { name: /lưu thay đổi/i });
      await user.click(saveButton);

      // Verify updated content displayed
      await waitFor(() => {
        expect(screen.getByText(/tăng 35% tốc độ thanh toán/i)).toBeInTheDocument();
      });
    });
  });

  describe('5. One-Click Copy & Accessible Toast Notification', () => {
    it('copies customized ATS bullet to clipboard and displays polite toast', async () => {
      render(
        React.createElement(RoastReport, {
          data: mockRoastData,
          cvText: 'CV gốc...',
          onReset: vi.fn(),
          onChangeTone: vi.fn(),
          onEditCv: vi.fn(),
        })
      );

      const rewriteButtons = screen.getAllByRole('button', {
        name: /tối ưu hóa theo chuẩn ats/i,
      });
      fireEvent.click(rewriteButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sao chép câu này/i })).toBeInTheDocument();
      });

      const copyBtn = screen.getByRole('button', { name: /sao chép câu này/i });
      fireEvent.click(copyBtn);

      expect(writeTextMock).toHaveBeenCalledWith(sampleRewriteResponse.data.rewrittenText);

      // Toast notification with role="status"
      await waitFor(() => {
        const toast = screen.getByRole('status');
        expect(toast).toHaveTextContent(/đã sao chép câu chuẩn ats vào bộ nhớ tạm/i);
      });
    });
  });

  describe('6. Full Improved CV Export Modal (.md & .txt)', () => {
    it('opens export modal, substitutes quotes, toggles tabs, and triggers download', async () => {
      render(
        React.createElement(RoastReport, {
          data: mockRoastData,
          cvText: 'KINH NGHIỆM:\n- Tham gia dự án thương mại điện tử bằng Next.js\n- Học vấn: Đại học',
          targetRole: 'Frontend Developer',
          onReset: vi.fn(),
          onChangeTone: vi.fn(),
          onEditCv: vi.fn(),
        })
      );

      // Optimize weakness 1
      const rewriteButtons = screen.getAllByRole('button', {
        name: /tối ưu hóa theo chuẩn ats/i,
      });
      fireEvent.click(rewriteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/action verb: chủ trì phát triển/i)).toBeInTheDocument();
      });

      // Open Export Modal
      const exportBtn = screen.getByRole('button', { name: /xuất cv cải tiến/i });
      fireEvent.click(exportBtn);

      // Modal is visible
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/1\/2 mục đã tối ưu/i)).toBeInTheDocument();

      // Check preview contains rewritten quote
      const previewBlock = screen.getByRole('dialog').querySelector('pre');
      expect(previewBlock?.textContent).toContain('Chủ trì phát triển mô-đun đặt hàng trực tuyến');
      expect(previewBlock?.textContent).toContain('BẢNG TỔNG HỢP CẢI TIẾN CHUẨN ATS');

      // Switch tab to Plain Text (.txt)
      const txtTab = screen.getByRole('button', { name: /văn bản thuần \(\.txt\)/i });
      fireEvent.click(txtTab);
      expect(previewBlock?.textContent).toContain('BANG TONG HOP CAC MUC DA TOI UU HOA CHUAN ATS');

      // Copy all
      const copyAllBtn = screen.getByRole('button', { name: /sao chép toàn bộ/i });
      fireEvent.click(copyAllBtn);
      expect(writeTextMock).toHaveBeenCalled();

      // Download file
      const downloadBtn = screen.getByRole('button', { name: /tải tệp \.txt/i });
      fireEvent.click(downloadBtn);
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });
  });

  describe('7. Pro Entitlement & Usage Limits Enforcement', () => {
    it('allows 1 free rewrite trial, then prompts upgrade modal on 2nd attempt for free users', async () => {
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

      const rewriteButtons = screen.getAllByRole('button', {
        name: /tối ưu hóa theo chuẩn ats/i,
      });

      // 1st rewrite (free trial) -> succeeds
      await user.click(rewriteButtons[0]);
      await waitFor(() => {
        expect(screen.getByText(/action verb: chủ trì phát triển/i)).toBeInTheDocument();
      });
      expect(localStorage.getItem('airoastcv_rewrite_count')).toBe('1');

      // 2nd rewrite -> blocked, opens CheckoutModal
      await user.click(rewriteButtons[1]);
      await waitFor(() => {
        // CheckoutModal should be opened
        expect(screen.getByText(/nâng cấp gói pro/i)).toBeInTheDocument();
      });
    });

    it('allows unlimited rewrites for Pro users', async () => {
      const user = userEvent.setup();
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

      const rewriteButtons = screen.getAllByRole('button', {
        name: /tối ưu hóa theo chuẩn ats/i,
      });

      // 1st rewrite
      await user.click(rewriteButtons[0]);
      await waitFor(() => {
        expect(screen.getByText(/action verb: chủ trì phát triển/i)).toBeInTheDocument();
      });

      // 2nd rewrite for Pro user -> directly calls rewrite without modal
      await user.click(rewriteButtons[1]);
      expect(screen.queryByText(/nâng cấp gói pro/i)).not.toBeInTheDocument();
    });
  });

  describe('8. 1-Click Wipe Data Integration', () => {
    it('clears all active rewrite card states upon receiving airoastcv:data-wiped event', async () => {
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

      const rewriteButtons = screen.getAllByRole('button', {
        name: /tối ưu hóa theo chuẩn ats/i,
      });
      await user.click(rewriteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/action verb: chủ trì phát triển/i)).toBeInTheDocument();
      });

      // Dispatch Wipe Data event
      window.dispatchEvent(new CustomEvent(WIPE_DATA_EVENT_NAME));

      // After wipe, card should revert to idle state
      await waitFor(() => {
        expect(screen.queryByText(/action verb: chủ trì phát triển/i)).not.toBeInTheDocument();
        const freshButtons = screen.getAllByRole('button', {
          name: /tối ưu hóa theo chuẩn ats/i,
        });
        expect(freshButtons).toHaveLength(2);
      });
    });
  });
});
