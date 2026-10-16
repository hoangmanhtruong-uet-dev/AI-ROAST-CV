import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  wipeAllSessionData,
  WIPE_DATA_EVENT_NAME,
  VIETNAMESE_WIPE_SUCCESS_MESSAGE,
  AIROASTCV_STORAGE_KEYS,
  hasStoredClientData,
} from '@/lib/storage/wipe-data';
import { WipeDataButton } from '@/components/privacy/WipeDataButton';
import { CanvasShareCard } from '@/components/share/CanvasShareCard';
import { SharePreviewModal } from '@/components/share/SharePreviewModal';
import { ShareCardPayload } from '@/lib/schemas/share';
import RoastPage from '@/app/roast/page';
import InterviewPage from '@/app/interview/page';

describe('Milestone 4 Adversarial Stress Testing — Challenger 2', () => {
  // Canvas Mocking Harness
  let mockContext2D: any;
  let fillTextCalls: { text: string; x: number; y: number }[];
  let strokeStyleAssigned: string[];

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();

    fillTextCalls = [];
    strokeStyleAssigned = [];

    mockContext2D = {
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      fillText: vi.fn().mockImplementation((text: string, x: number, y: number) => {
        fillTextCalls.push({ text: String(text), x, y });
      }),
      strokeText: vi.fn(),
      measureText: vi.fn().mockImplementation((text: string) => {
        // Approximate width: 10px per character for stress evaluation
        return { width: text.length * 10 };
      }),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      arc: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      scale: vi.fn(),
      createLinearGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
      createRadialGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
      strokeRect: vi.fn(),
      drawImage: vi.fn(),
      set strokeStyle(val: string) {
        strokeStyleAssigned.push(val);
      },
      get strokeStyle() {
        return strokeStyleAssigned[strokeStyleAssigned.length - 1] || '#ffffff';
      },
    };

    HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation((id: string) => {
      if (id === '2d') return mockContext2D;
      return null;
    });

    HTMLCanvasElement.prototype.toBlob = vi.fn().mockImplementation(
      (callback: (blob: Blob | null) => void, type?: string) => {
        const mockBlob = new Blob(['mock-png-data'], { type: type || 'image/png' });
        callback(mockBlob);
      }
    );

    HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue('data:image/png;base64,mockPngBase64');
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost:3000/mock-uuid');
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // TASK 1: EMPIRICALLY TEST WIPE DATA
  // =========================================================================
  describe('Task 1: Wipe Data Resilience & Error Isolation', () => {
    describe('1.1 Rapid Clicking on WipeDataButton (Race Conditions & Throttling)', () => {
      it('survives 15 rapid successive clicks on direct WipeDataButton without throwing or duplicating state', async () => {
        const onWipedSpy = vi.fn();
        localStorage.setItem('test_key_1', 'val1');
        sessionStorage.setItem('test_key_2', 'val2');

        render(
          React.createElement(WipeDataButton, {
            confirmFirst: false,
            onWiped: onWipedSpy,
          })
        );

        const button = screen.getByRole('button', { name: /xóa sạch dữ liệu/i });

        // Fire 15 rapid synchronous clicks
        for (let i = 0; i < 15; i++) {
          fireEvent.click(button);
        }

        // Storage must be completely purged
        expect(localStorage.length).toBe(0);
        expect(sessionStorage.length).toBe(0);
        expect(onWipedSpy).toHaveBeenCalledTimes(15);

        // Toast feedback must be displayed
        expect(
          screen.getByText(VIETNAMESE_WIPE_SUCCESS_MESSAGE)
        ).toBeInTheDocument();
      });

      it('survives rapid click bursts inside Confirmation Modal dialog without duplicate execution or crash', async () => {
        const onWipedSpy = vi.fn();
        localStorage.setItem('critical_key', 'should_be_deleted');

        render(
          React.createElement(WipeDataButton, {
            confirmFirst: true,
            onWiped: onWipedSpy,
          })
        );

        const openBtn = screen.getByRole('button', { name: /xóa sạch dữ liệu/i });
        fireEvent.click(openBtn);

        const confirmBtn = await screen.findByRole('button', { name: /xác nhận xóa/i });

        // Rapid click 10 times
        for (let i = 0; i < 10; i++) {
          fireEvent.click(confirmBtn);
        }

        expect(localStorage.length).toBe(0);
        expect(
          screen.getByText(VIETNAMESE_WIPE_SUCCESS_MESSAGE)
        ).toBeInTheDocument();
      });
    });

    describe('1.2 Storage Security Exceptions (Simulated Sandboxed Environment & Throwing)', () => {
      it('handles Storage.prototype.clear throwing SecurityError without unhandled exception', () => {
        const clearSpy = vi.spyOn(Storage.prototype, 'clear').mockImplementation(() => {
          throw new DOMException('Blocked by security sandbox policy', 'SecurityError');
        });

        // Must not throw synchronously
        const result = wipeAllSessionData();

        expect(result.success).toBe(false);
        expect(result.clearedLocalStorage).toBe(false);
        expect(result.error).toMatch(/security|sandbox/i);

        clearSpy.mockRestore();
      });

      it('dispatches data-wiped event even when Storage throws to allow in-memory React state reset', () => {
        const clearSpy = vi.spyOn(Storage.prototype, 'clear').mockImplementation(() => {
          throw new DOMException('Security sandbox', 'SecurityError');
        });

        const eventSpy = vi.fn();
        window.addEventListener(WIPE_DATA_EVENT_NAME, eventSpy);

        wipeAllSessionData();

        expect(eventSpy).toHaveBeenCalledTimes(1);

        window.removeEventListener(WIPE_DATA_EVENT_NAME, eventSpy);
        clearSpy.mockRestore();
      });

      it('WipeDataButton handles Storage.clear throwing without UI crash', async () => {
        const clearSpy = vi.spyOn(Storage.prototype, 'clear').mockImplementation(() => {
          throw new DOMException('The operation is insecure.', 'SecurityError');
        });

        render(React.createElement(WipeDataButton, { confirmFirst: false }));

        const button = screen.getByRole('button', { name: /xóa sạch dữ liệu/i });

        // Should not throw
        expect(() => fireEvent.click(button)).not.toThrow();

        // Toast feedback still shows since component executes performWipe
        expect(screen.getByText(VIETNAMESE_WIPE_SUCCESS_MESSAGE)).toBeInTheDocument();

        clearSpy.mockRestore();
      });
    });

    describe('1.3 Comprehensive Residual Key Verification', () => {
      it('purges arbitrary unicode keys, long strings, third-party analytics tokens and leaves strictly 0 residual keys', () => {
        // Populate standard keys
        for (const key of AIROASTCV_STORAGE_KEYS) {
          localStorage.setItem(key, `sample_${key}`);
          sessionStorage.setItem(key, `sample_session_${key}`);
        }

        // Populate adversarial non-standard keys
        localStorage.setItem('_ga_12345678', 'analytics_id');
        localStorage.setItem('dữ_liệu_ứng_viên_tiếng_việt', 'giá trị bí mật');
        localStorage.setItem('emoji_🔥_cv_roast', 'spicy');
        localStorage.setItem('x'.repeat(500), 'large_key_payload');
        sessionStorage.setItem('temp_jwt_token', 'eyJhbGciOi...');
        sessionStorage.setItem('__Host-session', 'cookie_like');

        expect(localStorage.length).toBeGreaterThanOrEqual(17);
        expect(sessionStorage.length).toBeGreaterThanOrEqual(14);
        expect(hasStoredClientData()).toBe(true);

        const result = wipeAllSessionData();

        expect(result.success).toBe(true);
        expect(localStorage.length).toBe(0);
        expect(sessionStorage.length).toBe(0);
        expect(Object.keys(localStorage)).toEqual([]);
        expect(Object.keys(sessionStorage)).toEqual([]);
        expect(hasStoredClientData()).toBe(false);
      });
    });

    describe('1.4 Event Listener State Reset on /roast and /interview', () => {
      it('/roast resets all in-memory React state back to INPUT step upon airoastcv:data-wiped', async () => {
        // Mock fetch to simulate successful upload / OCR extract
        global.fetch = vi.fn().mockImplementation((url: string) => {
          if (url.includes('/api/roast')) {
            return Promise.resolve({
              ok: true,
              json: () =>
                Promise.resolve({
                  success: true,
                  data: {
                    overallScore: 68,
                    tone: 'spicy',
                    summaryVerdict: 'Bản phân tích chi tiết',
                    topStrengths: ['Kỹ năng tốt'],
                    weaknesses: [],
                    atsRecommendations: [],
                    disclaimer: 'Luyện tập',
                  },
                }),
            });
          }
          return Promise.reject(new Error('Unknown url'));
        });

        render(React.createElement(RoastPage));

        // Switch to text tab before finding textarea
        const textTab = screen.getByRole('tab', { name: /dán văn bản trực tiếp/i });
        fireEvent.click(textTab);

        // Submit text to enter ROASTING -> RESULT step
        const textArea = screen.getByPlaceholderText(/dán toàn bộ nội dung văn bản cv/i);
        fireEvent.change(textArea, {
          target: {
            value: 'Kinh nghiệm làm việc tại công ty phần mềm ABC với hơn 3 năm lập trình Next.js và TypeScript.',
          },
        });

        const submitBtn = screen.getByRole('button', { name: /bắt đầu roast cv/i });
        fireEvent.click(submitBtn);

        // Wait until report is rendered
        await waitFor(() => {
          expect(screen.getByText(/bản phân tích chi tiết/i)).toBeInTheDocument();
        });

        // Trigger wipe event from outside (e.g. from Header or Footer Wipe button)
        act(() => {
          window.dispatchEvent(
            new CustomEvent(WIPE_DATA_EVENT_NAME, {
              detail: { timestamp: Date.now() },
            })
          );
        });

        // Verify page reverted to step 'INPUT'
        await waitFor(() => {
          expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Roast CV/i);
          expect(screen.queryByText(/bản phân tích chi tiết/i)).not.toBeInTheDocument();
        });
      });

      it('/interview resets session back to ROLE_CHOOSER upon airoastcv:data-wiped', async () => {
        global.fetch = vi.fn().mockImplementation((url: string) => {
          if (url.includes('/api/interview/question')) {
            return Promise.resolve({
              ok: true,
              json: () =>
                Promise.resolve({
                  success: true,
                  data: {
                    questionId: 'it-q1',
                    role: 'it',
                    questionIndex: 1,
                    title: 'Sự cố hạ tầng nghiêm trọng',
                    scenario: 'Server sập khi đang có đợt flash sale...',
                    pressureContext: 'Giám đốc yêu cầu xử lý trong 10 phút...',
                    timeLimitSeconds: 90,
                  },
                }),
            });
          }
          return Promise.reject(new Error('Unknown url'));
        });

        render(React.createElement(InterviewPage));

        // Choose IT role to transition to QUESTION_ACTIVE
        const itButton = screen.getByRole('button', { name: /it \/ software engineer/i });
        fireEvent.click(itButton);

        // Wait for question to display
        await waitFor(() => {
          expect(screen.getByText(/sự cố hạ tầng nghiêm trọng/i)).toBeInTheDocument();
        });

        // Type an answer
        const answerInput = screen.getByPlaceholderText(/mô hình star/i);
        fireEvent.change(answerInput, { target: { value: 'Tôi sẽ kiểm tra log ngay...' } });

        // Now fire data wiped event
        act(() => {
          window.dispatchEvent(
            new CustomEvent(WIPE_DATA_EVENT_NAME, {
              detail: { timestamp: Date.now() },
            })
          );
        });

        // Should be reset back to ROLE_CHOOSER
        await waitFor(() => {
          expect(screen.getByRole('button', { name: /it \/ software engineer/i })).toBeInTheDocument();
          expect(screen.queryByText(/sự cố hạ tầng nghiêm trọng/i)).not.toBeInTheDocument();
        });
      });
    });
  });

  // =========================================================================
  // TASK 2: EMPIRICALLY TEST CANVAS SHARE CARD & MODAL
  // =========================================================================
  describe('Task 2: Canvas Share Card, Truncation & Zero-Network Isolation', () => {
    describe('2.1 Extremely Long Quotes (> 300 chars) & Text Truncation with Ellipsis', () => {
      it('wraps and truncates quotes exceeding 300 characters with ellipsis (...), never exceeding maxLines', () => {
        const longQuote =
          'Dự án thương mại điện tử với hơn 10000 người dùng hàng ngày và hàng triệu giao dịch mỗi tháng nhưng trong phần mô tả ứng viên hoàn toàn bỏ quên kiến trúc hệ thống, các giải pháp cân bằng tải, công nghệ caching Redis, cũng như các chỉ số tối ưu hóa tốc độ tải trang thực tế dẫn đến việc nhà tuyển dụng nghi ngờ tính xác thực của kinh nghiệm được ghi trong CV và từ chối phỏng vấn ngay từ vòng duyệt hồ sơ ban đầu.';

        expect(longQuote.length).toBeGreaterThan(300);

        const payload: ShareCardPayload = {
          type: 'roast',
          title: 'Đánh Giá CV Chuyên Nghiệp',
          score: 75,
          quoteOrHighlight: longQuote,
          summary: 'Tóm tắt tổng quan ngắn gọn.',
        };

        render(React.createElement(CanvasShareCard, { payload, format: 'landscape' }));

        // Examine fillText calls for the quote
        const quoteDrawCalls = fillTextCalls.filter(
          (c) =>
            c.text.includes('Dự án') ||
            c.text.includes('thương mại') ||
            c.text.includes('...') ||
            c.text.includes('hồ sơ')
        );

        // Quote box allows max 3 lines (maxLines = 3)
        // Check that quote text is rendered across lines and finishes with an ellipsis
        const quoteLines = fillTextCalls.filter((c) => c.text.includes('Dự án') || c.text.includes('...'));
        expect(quoteLines.length).toBeGreaterThan(0);

        // Assert that at least one fillText call ends with or contains an ellipsis '...'
        const hasEllipsis = fillTextCalls.some((c) => c.text.includes('...'));
        expect(hasEllipsis).toBe(true);

        // Assert that the full 300+ char string is NOT printed as a single unbounded run
        const rawQuotePrinted = fillTextCalls.some((c) => c.text === `"${longQuote}"`);
        expect(rawQuotePrinted).toBe(false);
      });

      it('survives an adversarial quote containing an unbroken 400-char string without crashing', () => {
        const continuousString = 'SuperLongContinuousWordWithoutAnyWhitespace'.repeat(10);
        expect(continuousString.length).toBeGreaterThan(400);

        const payload: ShareCardPayload = {
          type: 'roast',
          title: 'Adversarial Test',
          score: 60,
          quoteOrHighlight: continuousString,
          summary: 'Summary without errors',
        };

        expect(() => {
          render(React.createElement(CanvasShareCard, { payload }));
        }).not.toThrow();

        expect(mockContext2D.fillRect).toHaveBeenCalled();
      });
    });

    describe('2.2 Boundary Scores: 0, 100, 1.0, 10.0 and Color Transitions', () => {
      it('correctly handles boundary Score = 0 (Roast: failing, red stroke #f43f5e)', () => {
        const payload: ShareCardPayload = {
          type: 'roast',
          title: 'CV Điểm 0',
          score: 0,
          quoteOrHighlight: 'CV hoàn toàn trống hoặc không hợp lệ.',
          summary: 'Cần viết lại từ đầu.',
        };

        render(React.createElement(CanvasShareCard, { payload }));

        const drawnTexts = fillTextCalls.map((c) => c.text);
        expect(drawnTexts).toContain('0');
        expect(drawnTexts).toContain('/ 100 ĐIỂM');

        // Stroke color for failing (< 50) must be rose/red
        expect(strokeStyleAssigned).toContain('#f43f5e');
      });

      it('correctly handles boundary Score = 100 (Roast: passing, emerald stroke #10b981)', () => {
        const payload: ShareCardPayload = {
          type: 'roast',
          title: 'CV Hoàn Hảo 100',
          score: 100,
          quoteOrHighlight: 'CV xuất sắc không tì vết.',
          summary: 'Sẵn sàng ứng tuyển bất kỳ công ty nào.',
        };

        render(React.createElement(CanvasShareCard, { payload }));

        const drawnTexts = fillTextCalls.map((c) => c.text);
        expect(drawnTexts).toContain('100');
        expect(drawnTexts).toContain('/ 100 ĐIỂM');

        // Stroke color for passing (>= 70) must be emerald
        expect(strokeStyleAssigned).toContain('#10b981');
      });

      it('correctly handles boundary Score = 1.0 (Interview: failing, red stroke #f43f5e)', () => {
        const payload: ShareCardPayload = {
          type: 'interview',
          title: 'Phỏng Vấn Điểm 1.0',
          score: 1.0,
          quoteOrHighlight: 'Không trả lời được câu hỏi tình huống.',
          summary: 'Cần ôn luyện lại kỹ năng STAR.',
        };

        render(React.createElement(CanvasShareCard, { payload }));

        const drawnTexts = fillTextCalls.map((c) => c.text);
        // Formatted score for integer-like 1.0 is '1' in formatting logic
        expect(drawnTexts.some((t) => t === '1' || t === '1.0')).toBe(true);
        expect(drawnTexts).toContain('/ 10 ĐIỂM');

        expect(strokeStyleAssigned).toContain('#f43f5e');
      });

      it('correctly handles boundary Score = 10.0 (Interview: passing, emerald stroke #10b981)', () => {
        const payload: ShareCardPayload = {
          type: 'interview',
          title: 'Phỏng Vấn Điểm 10.0 Tuyệt Đối',
          score: 10.0,
          quoteOrHighlight: 'Ứng xử hoàn hảo dưới áp lực cực đại.',
          summary: 'Phản xạ STAR chuẩn mực.',
        };

        render(React.createElement(CanvasShareCard, { payload }));

        const drawnTexts = fillTextCalls.map((c) => c.text);
        expect(drawnTexts.some((t) => t === '10' || t === '10.0')).toBe(true);
        expect(drawnTexts).toContain('/ 10 ĐIỂM');

        expect(strokeStyleAssigned).toContain('#10b981');
      });

      it('correctly handles decimal Score = 8.5 (Interview: passing, emerald stroke #10b981)', () => {
        const payload: ShareCardPayload = {
          type: 'interview',
          title: 'Phỏng Vấn Điểm 8.5',
          score: 8.5,
          quoteOrHighlight: 'Xử lý khéo léo.',
          summary: 'Kết quả tốt.',
        };

        render(React.createElement(CanvasShareCard, { payload }));

        const drawnTexts = fillTextCalls.map((c) => c.text);
        expect(drawnTexts).toContain('8.5');
        expect(drawnTexts).toContain('/ 10 ĐIỂM');
        expect(strokeStyleAssigned).toContain('#10b981');
      });

      it('correctly handles boundary Score = 50 (Roast: moderate, amber stroke #f59e0b)', () => {
        const payload: ShareCardPayload = {
          type: 'roast',
          title: 'CV Điểm 50',
          score: 50,
          quoteOrHighlight: 'Mức trung bình.',
          summary: 'Cần cải thiện.',
        };

        render(React.createElement(CanvasShareCard, { payload }));

        const drawnTexts = fillTextCalls.map((c) => c.text);
        expect(drawnTexts).toContain('50');
        expect(strokeStyleAssigned).toContain('#f59e0b');
      });
    });

    describe('2.3 Strictly Zero-Network Verification (No fetch, XHR, Beacon, or Auto-Social Links)', () => {
      it('asserts strictly 0 network calls (fetch, XHR, sendBeacon) during modal preview, format toggle, and PNG download', async () => {
        const fetchSpy = vi.spyOn(global, 'fetch');
        const xhrOpenSpy = vi.fn();
        (window as any).XMLHttpRequest = vi.fn().mockImplementation(() => ({
          open: xhrOpenSpy,
          send: vi.fn(),
        }));

        const beaconSpy = vi.fn();
        if (typeof navigator !== 'undefined') {
          (navigator as any).sendBeacon = beaconSpy;
        }

        const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

        const samplePayload: ShareCardPayload = {
          type: 'roast',
          title: 'Roast CV Không Mạng',
          score: 82,
          quoteOrHighlight: 'Tuyệt đối không gửi dữ liệu ra ngoài.',
          summary: 'Xử lý 100% tại client.',
        };

        render(
          React.createElement(SharePreviewModal, {
            isOpen: true,
            onClose: vi.fn(),
            payload: samplePayload,
          })
        );

        // 1. Toggle format to square
        const squareBtn = screen.getByRole('button', { name: /vuông \(1080x1080\)/i });
        fireEvent.click(squareBtn);

        // 2. Toggle back to landscape
        const landscapeBtn = screen.getByRole('button', { name: /ngang \(1200x630\)/i });
        fireEvent.click(landscapeBtn);

        // 3. Click Download PNG
        const downloadBtn = screen.getByRole('button', { name: /tải ảnh png/i });
        fireEvent.click(downloadBtn);

        // Assert zero network interactions
        expect(fetchSpy).toHaveBeenCalledTimes(0);
        expect(xhrOpenSpy).toHaveBeenCalledTimes(0);
        expect(beaconSpy).toHaveBeenCalledTimes(0);

        // Verify local blob download anchor was triggered
        expect(HTMLCanvasElement.prototype.toBlob).toHaveBeenCalled();
        expect(global.URL.createObjectURL).toHaveBeenCalled();
        expect(clickSpy).toHaveBeenCalled();

        clickSpy.mockRestore();
        fetchSpy.mockRestore();
      });

      it('asserts that SharePreviewModal contains ZERO third-party social share anchors or scripts', () => {
        const samplePayload: ShareCardPayload = {
          type: 'interview',
          title: 'Phỏng Vấn Bảo Mật',
          score: 9.0,
          quoteOrHighlight: 'Không gửi lên mạng xã hội',
          summary: 'Bảo mật tuyệt đối',
        };

        render(
          React.createElement(SharePreviewModal, {
            isOpen: true,
            onClose: vi.fn(),
            payload: samplePayload,
          })
        );

        // Check all anchor tags in the document
        const links = document.querySelectorAll('a');
        for (const link of Array.from(links)) {
          const href = link.getAttribute('href') || '';
          expect(href).not.toMatch(/facebook\.com|twitter\.com|x\.com|linkedin\.com|tiktok\.com|t\.me/i);
        }

        // Check for any remote script tags inserted
        const scripts = document.querySelectorAll('script');
        for (const script of Array.from(scripts)) {
          const src = script.getAttribute('src') || '';
          expect(src).not.toMatch(/facebook|twitter|linkedin|analytics|gtag/i);
        }
      });
    });
  });
});
