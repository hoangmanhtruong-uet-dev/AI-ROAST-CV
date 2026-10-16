import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LiveRoastTeaser, {
  PRESET_TEASER_SAMPLES,
  STORAGE_KEY_TEASER_USAGE,
  MAX_TEASER_LENGTH,
  MIN_TEASER_LENGTH,
} from '@/components/landing/LiveRoastTeaser';
import { soundEngine } from '@/lib/audio/sound-engine';

// Mock framer-motion for stable headless test execution
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) =>
      React.createElement('div', { className, ...props }, children),
    button: ({ children, className, ...props }: any) =>
      React.createElement('button', { className, ...props }, children),
  },
  AnimatePresence: ({ children }: any) => React.createElement(React.Fragment, null, children),
}));

describe('Live Roast Teaser UI Component (Milestone 3)', () => {
  beforeEach(() => {
    if (typeof document !== 'undefined') {
      document.cookie = 'rcv_teaser_count=; Path=/; Max-Age=0';
    }
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
    soundEngine.resetForTesting();
  });

  afterEach(() => {
    if (typeof document !== 'undefined') {
      document.cookie = 'rcv_teaser_count=; Path=/; Max-Age=0';
    }
    soundEngine.resetForTesting();
  });

  describe('1. Initial Rendering & Accessibility', () => {
    it('renders heading, description, character counter, and remaining quota', () => {
      render(React.createElement(LiveRoastTeaser));

      // Main Section Heading
      expect(
        screen.getByRole('heading', { name: /test thử 1 câu cv/i })
      ).toBeInTheDocument();

      // Input field with placeholder
      const input = screen.getByPlaceholderText(/dán 1 câu kinh nghiệm của bạn vào đây/i);
      expect(input).toBeInTheDocument();

      // Initial character counter
      expect(screen.getByText(`0/${MAX_TEASER_LENGTH} ký tự`)).toBeInTheDocument();

      // Default remaining quota
      expect(screen.getByText(/còn 3\/3 lượt thử miễn phí hôm nay/i)).toBeInTheDocument();

      // Submit button is disabled initially
      const submitBtn = screen.getByRole('button', { name: /bấm để roast câu này/i });
      expect(submitBtn).toBeDisabled();
    });

    it('renders all 4 instant-click preset sample pills', () => {
      render(React.createElement(LiveRoastTeaser));

      for (const preset of PRESET_TEASER_SAMPLES) {
        const presetBtn = screen.getByRole('button', {
          name: new RegExp(`Thử câu mẫu: ${preset.pillLabel}`, 'i'),
        });
        expect(presetBtn).toBeInTheDocument();
      }
    });
  });

  describe('2. Input Typing, Validation & Counter', () => {
    it('updates character count and toggles submit button based on length', async () => {
      const user = userEvent.setup();
      render(React.createElement(LiveRoastTeaser));

      const input = screen.getByPlaceholderText(/dán 1 câu kinh nghiệm của bạn vào đây/i);
      const submitBtn = screen.getByRole('button', { name: /bấm để roast câu này/i });

      // Type 5 chars (less than min 10)
      await user.type(input, '12345');
      expect(screen.getByText(`5/${MAX_TEASER_LENGTH} ký tự`)).toBeInTheDocument();
      expect(submitBtn).toBeDisabled();

      // Type 15 more chars -> total 20
      await user.type(input, ' - làm việc tốt');
      expect(screen.getByText(`20/${MAX_TEASER_LENGTH} ký tự`)).toBeInTheDocument();
      expect(submitBtn).not.toBeDisabled();
    });

    it('clears input and resets counter when clear button is clicked', async () => {
      const user = userEvent.setup();
      render(React.createElement(LiveRoastTeaser));

      const input = screen.getByPlaceholderText(/dán 1 câu kinh nghiệm của bạn vào đây/i);
      await user.type(input, 'Tham gia phát triển dự án');

      const clearBtn = screen.getByRole('button', { name: /xóa nội dung đã nhập/i });
      expect(clearBtn).toBeInTheDocument();

      await user.click(clearBtn);
      expect((input as HTMLTextAreaElement).value).toBe('');
      expect(screen.getByText(`0/${MAX_TEASER_LENGTH} ký tự`)).toBeInTheDocument();
    });
  });

  describe('3. Preset Sample Pills Click & Instant Analysis', () => {
    it('populates input and presents roast + ATS bullet when clicking preset pill', async () => {
      const user = userEvent.setup();
      render(React.createElement(LiveRoastTeaser));

      const preset = PRESET_TEASER_SAMPLES[0];
      const presetBtn = screen.getByRole('button', {
        name: new RegExp(`Thử câu mẫu: ${preset.pillLabel}`, 'i'),
      });

      await user.click(presetBtn);

      // Verify input value populated
      const input = screen.getByPlaceholderText(/dán 1 câu kinh nghiệm của bạn vào đây/i);
      expect((input as HTMLTextAreaElement).value).toBe(preset.sentence);

      // Verify result appears with spicy comment & ATS rewrite
      await waitFor(() => {
        expect(screen.getByText(new RegExp(preset.roastComment, 'i'))).toBeInTheDocument();
      });

      // Verify ATS bullet contains [...] placeholder
      expect(screen.getByText(/\[tính năng giỏ hàng \/ thanh toán\]/i)).toBeInTheDocument();

      // Verify quota was decremented from 3 to 2
      expect(screen.getByText(/còn 2\/3 lượt thử miễn phí hôm nay/i)).toBeInTheDocument();
    });
  });

  describe('4. Custom Input Submission & API Integration', () => {
    it('calls POST /api/roast/teaser and displays remote AI response', async () => {
      const user = userEvent.setup();
      const mockApiResponse = {
        success: true,
        data: {
          roastComment: 'Ghi thế này thì nhà tuyển dụng đọc xong ngáp ngắn ngáp dài!',
          atsRewrite:
            'Chủ trì tối ưu hóa module [hệ thống API] giúp giảm [30%] độ trễ truy vấn.',
          actionVerb: 'Chủ trì tối ưu hóa',
        },
      };

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockApiResponse,
      });
      global.fetch = fetchMock;

      render(React.createElement(LiveRoastTeaser));

      const input = screen.getByPlaceholderText(/dán 1 câu kinh nghiệm của bạn vào đây/i);
      await user.type(input, 'Tôi phụ trách làm API cho hệ thống đặt hàng.');

      const submitBtn = screen.getByRole('button', { name: /bấm để roast câu này/i });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          '/api/roast/teaser',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ sentence: 'Tôi phụ trách làm API cho hệ thống đặt hàng.' }),
          })
        );
      });

      // Assert result is in DOM
      await waitFor(() => {
        expect(
          screen.getByText(/ghi thế này thì nhà tuyển dụng đọc xong ngáp ngắn ngáp dài/i)
        ).toBeInTheDocument();
      });
      expect(screen.getByText(/\[hệ thống api\]/i)).toBeInTheDocument();
    });

    it('falls back gracefully to deterministic response when API fails', async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      render(React.createElement(LiveRoastTeaser));

      const input = screen.getByPlaceholderText(/dán 1 câu kinh nghiệm của bạn vào đây/i);
      await user.type(input, 'Em là sinh viên chăm chỉ học hỏi.');

      const submitBtn = screen.getByRole('button', { name: /bấm để roast câu này/i });
      await user.click(submitBtn);

      // Verify deterministic fallback response appears without throwing
      await waitFor(() => {
        expect(screen.getByText(/chăm chỉ và ham học hỏi là tiêu chuẩn/i)).toBeInTheDocument();
      });
      expect(screen.getByText(/\[công nghệ \/ kỹ năng mới\]/i)).toBeInTheDocument();
    });
  });

  describe('5. Copy to Clipboard & CTA Link', () => {
    it('copies ATS bullet to clipboard and shows confirmation', async () => {
      const user = userEvent.setup();
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        writable: true,
        configurable: true,
      });

      render(React.createElement(LiveRoastTeaser));

      // Click preset to populate results
      await user.click(
        screen.getByRole('button', { name: new RegExp(PRESET_TEASER_SAMPLES[0].pillLabel, 'i') })
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sao chép/i })).toBeInTheDocument();
      });

      const copyBtn = screen.getByRole('button', { name: /sao chép/i });
      await user.click(copyBtn);

      expect(writeTextMock).toHaveBeenCalledWith(PRESET_TEASER_SAMPLES[0].atsRewrite);
      expect(screen.getByText(/đã sao chép!/i)).toBeInTheDocument();
    });

    it('renders a CTA link pointing to /roast', async () => {
      const user = userEvent.setup();
      render(React.createElement(LiveRoastTeaser));

      await user.click(
        screen.getByRole('button', { name: new RegExp(PRESET_TEASER_SAMPLES[1].pillLabel, 'i') })
      );

      await waitFor(() => {
        const fullRoastLink = screen.getByRole('link', { name: /roast toàn bộ cv của bạn/i });
        expect(fullRoastLink).toBeInTheDocument();
        expect(fullRoastLink.getAttribute('href')).toBe('/roast');
      });
    });
  });

  describe('6. Rate Limit Exhaustion (0/3 Quota)', () => {
    it('disables submit and displays warning when daily quota reaches 0', () => {
      const today = new Date().toISOString().slice(0, 10);
      localStorage.setItem(
        STORAGE_KEY_TEASER_USAGE,
        JSON.stringify({ date: today, count: 3 })
      );

      render(React.createElement(LiveRoastTeaser));

      expect(screen.getByText(/còn 0\/3 lượt thử miễn phí hôm nay/i)).toBeInTheDocument();
      const submitBtn = screen.getByRole('button', { name: /bấm để roast câu này/i });
      expect(submitBtn).toBeDisabled();
    });
  });
});
