import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CanvasShareCard } from '@/components/share/CanvasShareCard';
import { SharePreviewModal } from '@/components/share/SharePreviewModal';
import { ShareCardPayload } from '@/lib/schemas/share-card';

describe('Milestone 4: Share Card & Preview Modal (Features 25 & 26, §R4)', () => {
  // Mock 2D Canvas Context
  let mockContext2D: any;
  let fillTextCalls: string[];

  const sampleRoastPayload: ShareCardPayload = {
    type: 'roast',
    title: 'Đánh Giá CV Chuyên Nghiệp',
    score: 72,
    quoteOrHighlight: 'Thiếu số liệu đo lường cụ thể cho các dự án thực tế.',
    summary: 'CV có cấu trúc khá tốt nhưng cần lượng hóa các thành tích.',
    rawPiiText: 'Ứng viên: Nguyễn Văn An - SĐT: 0912345678 - Email: nguyenvana@gmail.com',
  };

  const sampleInterviewPayload: ShareCardPayload = {
    type: 'interview',
    title: 'Phỏng Vấn Tình Huống Áp Lực (IT)',
    score: 8.5,
    quoteOrHighlight: 'Bình tĩnh phân tích nguyên nhân gốc khi gặp sự cố release.',
    summary: 'Phản xạ STAR mạch lạc, nhận thức hệ quả tốt dưới áp lực thời gian.',
  };

  beforeEach(() => {
    fillTextCalls = [];
    mockContext2D = {
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      fillText: vi.fn().mockImplementation((text: string) => {
        fillTextCalls.push(String(text));
      }),
      strokeText: vi.fn(),
      measureText: vi.fn().mockReturnValue({ width: 150 }),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      arc: vi.fn(),
      roundRect: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      scale: vi.fn(),
      createLinearGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
      createRadialGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
      strokeRect: vi.fn(),
      drawImage: vi.fn(),
    };

    // Mock HTMLCanvasElement methods in JSDOM
    HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation((ctxId: string) => {
      if (ctxId === '2d') return mockContext2D;
      return null;
    });

    HTMLCanvasElement.prototype.toBlob = vi.fn().mockImplementation(
      (callback: (blob: Blob | null) => void, type?: string) => {
        const mockBlob = new Blob(['mock-png-data'], { type: type || 'image/png' });
        callback(mockBlob);
      }
    );

    HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue('data:image/png;base64,mockPngBase64');

    // Mock window URL methods
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost:3000/mock-card-uuid');
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. Canvas Rendering & Prop Layout
  // =========================================================================
  describe('1. Canvas Element Rendering with Correct Dimensions & Props', () => {
    it('renders HTML5 canvas element with high-resolution dimensions (1200x630)', () => {
      render(React.createElement(CanvasShareCard, { payload: sampleRoastPayload }));

      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      expect(canvas).toBeInTheDocument();
      expect(canvas.width).toBe(1200);
      expect(canvas.height).toBe(630);
      expect(mockContext2D.fillRect).toHaveBeenCalled();
    });

    it('renders Brand header "AI ROAST CV" and score onto canvas', () => {
      render(React.createElement(CanvasShareCard, { payload: sampleRoastPayload }));

      // Inspect text drawn onto canvas
      const allDrawnText = fillTextCalls.join(' ');
      expect(allDrawnText).toMatch(/AI ROAST CV/i);
      expect(allDrawnText).toContain('72');
      expect(allDrawnText).toMatch(/100/);
    });

    it('renders Interview average score (/10) correctly for interview payload', () => {
      render(React.createElement(CanvasShareCard, { payload: sampleInterviewPayload }));

      const allDrawnText = fillTextCalls.join(' ');
      expect(allDrawnText).toContain('8.5');
      expect(allDrawnText).toMatch(/10/);
      expect(allDrawnText).toMatch(/phỏng vấn áp lực/i);
    });
  });

  // =========================================================================
  // 2. Strict Pre-Render PII Masking Verification
  // =========================================================================
  describe('2. Mandatory PII Redaction Before Canvas Drawing (R4)', () => {
    it('GUARANTEES raw phone, email, and candidate name NEVER appear in canvas draw calls', () => {
      const payloadWithPii: ShareCardPayload = {
        type: 'roast',
        title: 'Đánh Giá CV',
        score: 65,
        quoteOrHighlight: 'SĐT 0912345678 và email tuan.dev@gmail.com cần được ẩn danh.',
        summary: 'Ứng viên Nguyễn Văn An có tiềm năng tốt.',
        rawPiiText: 'Nguyễn Văn An - 0912345678 - tuan.dev@gmail.com',
      };

      render(React.createElement(CanvasShareCard, { payload: payloadWithPii }));

      const drawnText = fillTextCalls.join(' ');

      // Strictly verify unmasked PII is absent from canvas text
      expect(drawnText).not.toContain('0912345678');
      expect(drawnText).not.toContain('tuan.dev@gmail.com');
      expect(drawnText).not.toContain('Nguyễn Văn An');

      // Verify masked variants or badges are drawn instead
      expect(drawnText).toMatch(/09\*\*\*\*5678|t\*\*\*v@gmail\.com|ẩn danh/i);
    });
  });

  // =========================================================================
  // 3. Share Preview Modal & PNG Download Flow
  // =========================================================================
  describe('3. Share Preview Modal & PNG Download Flow', () => {
    it('opens modal, renders preview image, and triggers PNG file download on button click', async () => {
      const user = userEvent.setup();
      const onCloseSpy = vi.fn();

      // Spy on link click
      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

      render(
        React.createElement(SharePreviewModal, {
          isOpen: true,
          onClose: onCloseSpy,
          payload: sampleRoastPayload,
        })
      );

      // Verify modal is visible
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/xem trước thẻ chia sẻ|thẻ kết quả/i)).toBeInTheDocument();

      // Click Download button
      const downloadBtn = screen.getByRole('button', { name: /tải ảnh png|tải về/i });
      expect(downloadBtn).toBeInTheDocument();
      await user.click(downloadBtn);

      // Verify toBlob was called and download anchor was triggered
      await waitFor(() => {
        expect(HTMLCanvasElement.prototype.toBlob).toHaveBeenCalled();
        expect(global.URL.createObjectURL).toHaveBeenCalled();
        expect(clickSpy).toHaveBeenCalled();
      });

      clickSpy.mockRestore();
    });
  });

  // =========================================================================
  // 4. ABSOLUTE ABSENCE OF AUTO-SOCIAL POSTING OR NETWORK UPLOAD
  // =========================================================================
  describe('4. Absolute Absence of Auto-Social Posting & Remote Network Upload (R4 Privacy)', () => {
    it('makes EXACTLY ZERO network requests during render, preview, and download', async () => {
      const user = userEvent.setup();
      const fetchSpy = vi.spyOn(global, 'fetch');

      render(
        React.createElement(SharePreviewModal, {
          isOpen: true,
          onClose: vi.fn(),
          payload: sampleRoastPayload,
        })
      );

      const downloadBtn = screen.getByRole('button', { name: /tải ảnh png|tải về/i });
      await user.click(downloadBtn);

      // Strict privacy check: NO network communication whatsoever
      expect(fetchSpy).toHaveBeenCalledTimes(0);

      fetchSpy.mockRestore();
    });

    it('does NOT contain automatic social sharing links or scripts that post to third parties', () => {
      render(
        React.createElement(SharePreviewModal, {
          isOpen: true,
          onClose: vi.fn(),
          payload: sampleRoastPayload,
        })
      );

      const allLinks = screen.queryAllByRole('link');
      for (const link of allLinks) {
        const href = link.getAttribute('href') || '';
        expect(href).not.toMatch(/facebook\.com\/sharer|twitter\.com\/intent|linkedin\.com\/shareArticle/i);
      }
    });
  });
});
