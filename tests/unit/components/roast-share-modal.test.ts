import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RoastShareModal, { FUNNY_ALIASES } from '@/components/roast/RoastShareModal';
import { RoastReport } from '@/components/roast/RoastReport';
import { RoastData } from '@/lib/schemas/roast';
import * as htmlToImage from 'html-to-image';

// Mock html-to-image
vi.mock('html-to-image', () => ({
  toPng: vi.fn(),
  toBlob: vi.fn(),
}));

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe('RoastShareModal & RoastReport Integration (Milestone 10, §R4)', () => {
  const mockReportData: RoastData = {
    overallScore: 42,
    roastScore: 42,
    survivalScore: 38,
    funnyTitle: 'Kẻ Hủy Diệt Vòng Gửi Xe',
    tone: 'spicy',
    summaryVerdict: 'CV thiếu số liệu và mang nặng tính chất học việc.',
    topStrengths: ['Có nền tảng cơ bản về React và HTML/CSS'],
    weaknesses: [
      {
        quote: 'Thành thạo tin học văn phòng và có tinh thần ham học hỏi.',
        issue: 'Kỹ năng văn phòng sáo rỗng',
        severity: 'Cao',
        rejectionReason: 'Biết mở máy tính không phải là lợi thế cạnh tranh của lập trình viên.',
        fixGuideline: 'Thay thế bằng dự án thực tế kèm [số liệu cụ thể].',
      },
      {
        quote: 'SĐT: 0987654321, Email: nguyenvanfresher@gmail.com, CCCD: 001099123456.',
        issue: 'Lộ thông tin cá nhân PII',
        severity: 'Cao',
        rejectionReason: 'Chèn bừa bãi thông tin định danh không cần thiết.',
        fixGuideline: 'Ẩn các trường số định danh với [thông tin bảo mật].',
      },
    ],
    atsRecommendations: [
      {
        category: 'Từ khóa',
        recommendation: 'Bổ sung từ khóa chuyên môn như TypeScript, REST API.',
        impact: 'Quan trọng',
      },
    ],
    disclaimer: 'Kết quả phân tích chỉ mang tính chất tham khảo luyện tập.',
  };

  let mockWrite: any;
  let mockWriteText: any;
  let mockCanShare: any;
  let mockShare: any;
  let mockLinkClick: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock html-to-image methods
    vi.mocked(htmlToImage.toPng).mockResolvedValue('data:image/png;base64,mockPngBase64');
    vi.mocked(htmlToImage.toBlob).mockResolvedValue(
      new Blob(['fake-image-bytes'], { type: 'image/png' })
    );

    // Mock Clipboard API
    mockWrite = vi.fn().mockResolvedValue(undefined);
    mockWriteText = vi.fn().mockResolvedValue(undefined);

    Object.defineProperty(navigator, 'clipboard', {
      value: {
        write: mockWrite,
        writeText: mockWriteText,
      },
      writable: true,
      configurable: true,
    });

    // Mock ClipboardItem
    (global as any).ClipboardItem = class MockClipboardItem {
      public data: Record<string, any>;
      constructor(data: Record<string, any>) {
        this.data = data;
      }
    };

    // Mock Web Share API
    mockCanShare = vi.fn().mockReturnValue(false);
    mockShare = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'canShare', {
      value: mockCanShare,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(navigator, 'share', {
      value: mockShare,
      writable: true,
      configurable: true,
    });

    // Mock document.createElement('a') click
    mockLinkClick = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const el = originalCreateElement(tagName);
      if (tagName.toLowerCase() === 'a') {
        el.click = mockLinkClick;
      }
      return el;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. Modal Open / Close State
  // =========================================================================
  describe('1. Modal Open / Close Behavior', () => {
    it('does not render when isOpen is false', () => {
      const { container } = render(
        React.createElement(RoastShareModal, {
          isOpen: false,
          onClose: vi.fn(),
          reportData: mockReportData,
        })
      );
      expect(container.firstChild).toBeNull();
      expect(screen.queryByTestId('roast-share-modal')).not.toBeInTheDocument();
    });

    it('renders modal dialog when isOpen is true', () => {
      render(
        React.createElement(RoastShareModal, {
          isOpen: true,
          onClose: vi.fn(),
          reportData: mockReportData,
        })
      );
      expect(screen.getByTestId('roast-share-modal')).toBeInTheDocument();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/Tạo thẻ.*Roast Card/i)).toBeInTheDocument();
    });

    it('triggers onClose when close button is clicked', async () => {
      const onCloseMock = vi.fn();
      render(
        React.createElement(RoastShareModal, {
          isOpen: true,
          onClose: onCloseMock,
          reportData: mockReportData,
        })
      );

      const closeBtn = screen.getByLabelText('Đóng cửa sổ');
      await userEvent.click(closeBtn);
      expect(onCloseMock).toHaveBeenCalledTimes(1);
    });
  });

  // =========================================================================
  // 2. Aspect Ratio Switching (1:1 Square vs 9:16 Vertical Story)
  // =========================================================================
  describe('2. Multi-Ratio Switching (1:1 vs 9:16)', () => {
    it('defaults to 1:1 aspect ratio with square classes', () => {
      render(
        React.createElement(RoastShareModal, {
          isOpen: true,
          onClose: vi.fn(),
          reportData: mockReportData,
        })
      );

      const card = screen.getByTestId('roast-card-capture');
      expect(card.className).toContain('w-[340px]');
      expect(card.className).toContain('min-h-[400px]');
    });

    it('switches to 9:16 story ratio when button is clicked', async () => {
      render(
        React.createElement(RoastShareModal, {
          isOpen: true,
          onClose: vi.fn(),
          reportData: mockReportData,
        })
      );

      const storyBtn = screen.getByTestId('ratio-9-16-btn');
      await userEvent.click(storyBtn);

      const card = screen.getByTestId('roast-card-capture');
      expect(card.className).toContain('w-[310px]');
      expect(card.className).toContain('min-h-[560px]');
    });

    it('switches back to 1:1 square ratio when square button is clicked', async () => {
      render(
        React.createElement(RoastShareModal, {
          isOpen: true,
          onClose: vi.fn(),
          reportData: mockReportData,
        })
      );

      const storyBtn = screen.getByTestId('ratio-9-16-btn');
      await userEvent.click(storyBtn);

      const squareBtn = screen.getByTestId('ratio-1-1-btn');
      await userEvent.click(squareBtn);

      const card = screen.getByTestId('roast-card-capture');
      expect(card.className).toContain('w-[340px]');
      expect(card.className).toContain('min-h-[400px]');
    });
  });

  // =========================================================================
  // 3. Anonymous Persona & Rotating Funny Aliases
  // =========================================================================
  describe('3. Anonymous Mode & Funny Alias Rotation', () => {
    it('enables anonymous mode by default with the first alias', () => {
      render(
        React.createElement(RoastShareModal, {
          isOpen: true,
          onClose: vi.fn(),
          reportData: mockReportData,
          candidateName: 'Trần Văn Thật',
        })
      );

      const displayName = screen.getByTestId('share-display-name');
      expect(displayName.textContent).toBe(FUNNY_ALIASES[0]); // 'Fresher Hệ Tâm Linh'
      expect(screen.getByText('Chế độ ẩn danh')).toBeInTheDocument();
      expect(displayName.textContent).not.toContain('Trần Văn Thật');
    });

    it('cycles through all humorous aliases in order when button is clicked', async () => {
      render(
        React.createElement(RoastShareModal, {
          isOpen: true,
          onClose: vi.fn(),
          reportData: mockReportData,
          candidateName: 'Trần Văn Thật',
        })
      );

      const cycleBtn = screen.getByTestId('cycle-alias-btn');
      const displayName = screen.getByTestId('share-display-name');

      expect(displayName.textContent).toBe(FUNNY_ALIASES[0]);

      // Cycle 1
      await userEvent.click(cycleBtn);
      expect(displayName.textContent).toBe(FUNNY_ALIASES[1]); // 'Chiến Thần Rải CV'

      // Cycle 2
      await userEvent.click(cycleBtn);
      expect(displayName.textContent).toBe(FUNNY_ALIASES[2]); // 'Kẻ Hủy Diệt Vòng Gửi Xe'

      // Cycle 3
      await userEvent.click(cycleBtn);
      expect(displayName.textContent).toBe(FUNNY_ALIASES[3]); // 'Chiến Thần Kỹ Năng Mềm'

      // Cycle 4
      await userEvent.click(cycleBtn);
      expect(displayName.textContent).toBe(FUNNY_ALIASES[4]); // 'Hiệp Sĩ Fix Bug Gánh Team'

      // Cycle 5 (wraps around)
      await userEvent.click(cycleBtn);
      expect(displayName.textContent).toBe(FUNNY_ALIASES[0]);
    });

    it('toggles between anonymous alias and real candidate name', async () => {
      render(
        React.createElement(RoastShareModal, {
          isOpen: true,
          onClose: vi.fn(),
          reportData: mockReportData,
          candidateName: 'Nguyễn Hoàng Nam',
        })
      );

      const toggleBtn = screen.getByTestId('toggle-anonymous-btn');
      const displayName = screen.getByTestId('share-display-name');

      // Initially anonymous
      expect(displayName.textContent).toBe(FUNNY_ALIASES[0]);

      // Turn off anonymous -> shows real name
      await userEvent.click(toggleBtn);
      expect(displayName.textContent).toBe('Nguyễn Hoàng Nam');

      // Turn on anonymous -> restores alias
      await userEvent.click(toggleBtn);
      expect(displayName.textContent).toBe(FUNNY_ALIASES[0]);
    });
  });

  // =========================================================================
  // 4. PII Sanitization on Candidate Quote & Name
  // =========================================================================
  describe('4. PII Decontamination on Quote and Name', () => {
    it('decontaminates raw phone, email, and ID before rendering quote onto card', async () => {
      render(
        React.createElement(RoastShareModal, {
          isOpen: true,
          onClose: vi.fn(),
          reportData: mockReportData,
        })
      );

      // Navigate to second weakness containing PII
      const nextBtn = screen.getByLabelText('Câu tiếp theo');
      await userEvent.click(nextBtn);

      const quoteBlock = screen.getByTestId('share-sanitized-quote');
      const text = quoteBlock.textContent || '';

      // Must NOT contain raw PII
      expect(text).not.toContain('0987654321');
      expect(text).not.toContain('nguyenvanfresher@gmail.com');
      expect(text).not.toContain('001099123456');

      // Must contain redacted tokens
      expect(text).toContain('[PHONE_REDACTED]');
      expect(text).toContain('[EMAIL_REDACTED]');
      expect(text).toContain('[ID_REDACTED]');
    });

    it('sanitizes real candidate name if it contains leaked email/phone when anonymous is false', async () => {
      render(
        React.createElement(RoastShareModal, {
          isOpen: true,
          onClose: vi.fn(),
          reportData: mockReportData,
          candidateName: '0912345678',
        })
      );

      const toggleBtn = screen.getByTestId('toggle-anonymous-btn');
      await userEvent.click(toggleBtn);

      const displayName = screen.getByTestId('share-display-name');
      expect(displayName.textContent).not.toContain('0912345678');
      expect(displayName.textContent).toContain('[PHONE_REDACTED]');
    });
  });

  // =========================================================================
  // 5. Sharing Capabilities (Clipboard Copy, Mobile Share, PNG Download)
  // =========================================================================
  describe('5. Sharing Capabilities & Fallbacks', () => {
    it('copies card image to desktop clipboard using ClipboardItem', async () => {
      render(
        React.createElement(RoastShareModal, {
          isOpen: true,
          onClose: vi.fn(),
          reportData: mockReportData,
        })
      );

      const copyBtn = screen.getByTestId('copy-image-btn');
      await userEvent.click(copyBtn);

      await waitFor(() => {
        expect(htmlToImage.toBlob).toHaveBeenCalled();
        expect(mockWrite).toHaveBeenCalled();
        expect(screen.getByText(/Đã sao chép ảnh/i)).toBeInTheDocument();
      });
    });

    it('smoothly falls back to downloading PNG if ClipboardItem write rejects', async () => {
      mockWrite.mockRejectedValue(new Error('Clipboard write permission denied'));

      render(
        React.createElement(RoastShareModal, {
          isOpen: true,
          onClose: vi.fn(),
          reportData: mockReportData,
        })
      );

      const copyBtn = screen.getByTestId('copy-image-btn');
      await userEvent.click(copyBtn);

      await waitFor(() => {
        expect(htmlToImage.toBlob).toHaveBeenCalled();
        expect(htmlToImage.toPng).toHaveBeenCalled();
        expect(mockLinkClick).toHaveBeenCalled();
      });
    });

    it('triggers PNG download with correct filename pattern', async () => {
      render(
        React.createElement(RoastShareModal, {
          isOpen: true,
          onClose: vi.fn(),
          reportData: mockReportData,
        })
      );

      const downloadBtn = screen.getByTestId('download-png-btn');
      await userEvent.click(downloadBtn);

      await waitFor(() => {
        expect(htmlToImage.toPng).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            pixelRatio: 3,
            backgroundColor: '#09090b',
          })
        );
        expect(mockLinkClick).toHaveBeenCalled();
      });
    });

    it('invokes navigator.share on mobile when canShare with files is available', async () => {
      mockCanShare.mockReturnValue(true);

      render(
        React.createElement(RoastShareModal, {
          isOpen: true,
          onClose: vi.fn(),
          reportData: mockReportData,
        })
      );

      const nativeShareBtn = screen.getByTestId('native-share-btn');
      await userEvent.click(nativeShareBtn);

      await waitFor(() => {
        expect(mockShare).toHaveBeenCalledWith(
          expect.objectContaining({
            title: expect.stringContaining('AI Roast CV'),
            text: expect.stringContaining('Điểm ATS 42/100'),
          })
        );
      });
    });

    it('copies viral caption to clipboard with quote and score', async () => {
      render(
        React.createElement(RoastShareModal, {
          isOpen: true,
          onClose: vi.fn(),
          reportData: mockReportData,
        })
      );

      const copyCaptionBtn = screen.getByTestId('copy-caption-btn');
      await userEvent.click(copyCaptionBtn);

      expect(mockWriteText).toHaveBeenCalledWith(
        expect.stringContaining('42/100')
      );
      expect(screen.getByText('Đã copy!')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // 6. Card Styling & Brand Details
  // =========================================================================
  describe('6. Glassmorphism Card Details & Watermark', () => {
    it('renders ATS score, survival score, funny title, and watermark', () => {
      render(
        React.createElement(RoastShareModal, {
          isOpen: true,
          onClose: vi.fn(),
          reportData: mockReportData,
        })
      );

      expect(screen.getByText('42/100')).toBeInTheDocument();
      expect(screen.getByText('38/100')).toBeInTheDocument();
      expect(screen.getByText(/Kẻ Hủy Diệt Vòng Gửi Xe/i)).toBeInTheDocument();
      expect(screen.getByText(/AI Roast CV • airoastcv.vn/i)).toBeInTheDocument();
      expect(screen.getAllByText(/100% Client-Side Privacy/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  // =========================================================================
  // 7. Integration with RoastReport
  // =========================================================================
  describe('7. RoastReport Action Toolbar Integration', () => {
    it('opens RoastShareModal when "Tạo ảnh chia sẻ" button is clicked in RoastReport', async () => {
      render(
        React.createElement(RoastReport, {
          data: mockReportData,
          onReset: vi.fn(),
          onChangeTone: vi.fn(),
          onEditCv: vi.fn(),
        })
      );

      // Modal should initially not be open
      expect(screen.queryByTestId('roast-share-modal')).not.toBeInTheDocument();

      // Click "Tạo ảnh chia sẻ" button in Action Toolbar
      const openShareBtn = screen.getByTestId('open-share-modal-btn');
      expect(openShareBtn).toBeInTheDocument();
      await userEvent.click(openShareBtn);

      // Modal is now opened
      await waitFor(() => {
        expect(screen.getByTestId('roast-share-modal')).toBeInTheDocument();
        expect(screen.getByText(/Tạo thẻ.*Roast Card/i)).toBeInTheDocument();
      });
    });
  });
});
