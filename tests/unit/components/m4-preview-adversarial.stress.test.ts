import React, { useState } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import {
  RpgShareCard,
  calculateRpgProfile,
  RpgShareCardProps,
} from '@/components/share/RpgShareCard';
import {
  LenisProvider,
  useLenisScroll,
  isLenisSupported,
  LenisProviderProps,
} from '@/components/providers/LenisProvider';
import { ShareCardPayload, SanitizedShareCardData } from '@/lib/schemas/share';

// ============================================================================
// Canvas 2D Mocking Utilities for Adversarial Audit
// ============================================================================
interface CanvasAuditLog {
  fillTextCalls: { text: string; x: number; y: number }[];
  strokeTextCalls: { text: string; x: number; y: number }[];
  fillRectCalls: { x: number; y: number; w: number; h: number }[];
  scaleCalls: { x: number; y: number }[];
}

function setupCanvasMock(): CanvasAuditLog {
  const audit: CanvasAuditLog = {
    fillTextCalls: [],
    strokeTextCalls: [],
    fillRectCalls: [],
    scaleCalls: [],
  };

  const mockContext2D: any = {
    fillRect: vi.fn((x, y, w, h) => {
      audit.fillRectCalls.push({ x, y, w, h });
    }),
    clearRect: vi.fn(),
    fillText: vi.fn((text, x, y) => {
      audit.fillTextCalls.push({ text: String(text), x, y });
    }),
    strokeText: vi.fn((text, x, y) => {
      audit.strokeTextCalls.push({ text: String(text), x, y });
    }),
    measureText: vi.fn((text: string) => ({ width: text.length * 10 })),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    scale: vi.fn((x, y) => {
      audit.scaleCalls.push({ x, y });
    }),
    createLinearGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
    createRadialGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
    strokeRect: vi.fn(),
    drawImage: vi.fn(),
    font: '',
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    textAlign: 'left',
  };

  HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation((id: string) => {
    if (id === '2d') return mockContext2D;
    return null;
  });

  return audit;
}

// ============================================================================
// PART 1: ADVERSARIAL STRESS TESTING - RpgShareCard.tsx
// ============================================================================
describe('Adversarial Stress Testing: RpgShareCard.tsx', () => {
  let audit: CanvasAuditLog;

  beforeEach(() => {
    audit = setupCanvasMock();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Extreme Score Boundaries & Normalization Matrix', () => {
    const extremeScores = [
      { input: 0, type: 'roast' as const, expectedTier: 'F', expectedScore: 0, title: 'Phù Thủy Văn Mẫu' },
      { input: 1, type: 'roast' as const, expectedTier: 'F', expectedScore: 1, title: 'Phù Thủy Văn Mẫu' },
      { input: 44, type: 'roast' as const, expectedTier: 'F', expectedScore: 44, title: 'Phù Thủy Văn Mẫu' },
      { input: 45, type: 'roast' as const, expectedTier: 'C', expectedScore: 45, title: 'Chiến Thần Tham Gia' },
      { input: 59, type: 'roast' as const, expectedTier: 'C', expectedScore: 59, title: 'Chiến Thần Tham Gia' },
      { input: 60, type: 'roast' as const, expectedTier: 'B', expectedScore: 60, title: 'Chiến Thần Kỹ Năng Mềm' },
      { input: 74, type: 'roast' as const, expectedTier: 'B', expectedScore: 74, title: 'Chiến Thần Kỹ Năng Mềm' },
      { input: 75, type: 'roast' as const, expectedTier: 'A', expectedScore: 75, title: 'Hiệp Sĩ Fix Bug Gánh Team' },
      { input: 89, type: 'roast' as const, expectedTier: 'A', expectedScore: 89, title: 'Hiệp Sĩ Fix Bug Gánh Team' },
      { input: 90, type: 'roast' as const, expectedTier: 'SSR', expectedScore: 90, title: 'Kẻ Hủy Diệt Vòng Gửi Xe' },
      { input: 99, type: 'roast' as const, expectedTier: 'SSR', expectedScore: 99, title: 'Kẻ Hủy Diệt Vòng Gửi Xe' },
      { input: 100, type: 'roast' as const, expectedTier: 'SSR', expectedScore: 100, title: 'Kẻ Hủy Diệt Vòng Gửi Xe' },
      { input: -1, type: 'roast' as const, expectedTier: 'F', expectedScore: 0, title: 'Phù Thủy Văn Mẫu' },
      { input: -50, type: 'roast' as const, expectedTier: 'F', expectedScore: 0, title: 'Phù Thủy Văn Mẫu' },
      { input: 150, type: 'roast' as const, expectedTier: 'SSR', expectedScore: 100, title: 'Kẻ Hủy Diệt Vòng Gửi Xe' },
      { input: 9999, type: 'roast' as const, expectedTier: 'SSR', expectedScore: 100, title: 'Kẻ Hủy Diệt Vòng Gửi Xe' },
    ];

    extremeScores.forEach(({ input, type, expectedTier, expectedScore, title }) => {
      it(`evaluates roast score ${input} -> tier ${expectedTier}, score ${expectedScore}`, () => {
        const profile = calculateRpgProfile(input, type);
        expect(profile.tier).toBe(expectedTier);
        expect(profile.survivalScore).toBe(expectedScore);
        expect(profile.title).toBe(title);
      });
    });

    describe('Interview 10-point Scale Normalization', () => {
      it('correctly maps 10-point scale: 0 -> 0 (F), 8.5 -> 85 (A), 10 -> 100 (SSR)', () => {
        const p0 = calculateRpgProfile(0, 'interview');
        expect(p0.tier).toBe('F');
        expect(p0.survivalScore).toBe(0);

        const p85 = calculateRpgProfile(8.5, 'interview');
        expect(p85.tier).toBe('A');
        expect(p85.survivalScore).toBe(85);

        const p10 = calculateRpgProfile(10, 'interview');
        expect(p10.tier).toBe('SSR');
        expect(p10.survivalScore).toBe(100);
      });

      it('correctly handles interview score > 10 treated as 100-point scale', () => {
        const p88 = calculateRpgProfile(88, 'interview');
        expect(p88.tier).toBe('A');
        expect(p88.survivalScore).toBe(88);

        const p150 = calculateRpgProfile(150, 'interview');
        expect(p150.tier).toBe('SSR');
        expect(p150.survivalScore).toBe(100);
      });

      it('observes negative interview score behavior under calculateRpgProfile', () => {
        // Empirical observation: score <= 10 branches into Math.round(score * 10)
        const profile = calculateRpgProfile(-1, 'interview');
        // Survival score should never be negative on a share card
        expect(profile.tier).toBe('F');
        expect(typeof profile.survivalScore).toBe('number');
        expect(profile.survivalScore).toBeGreaterThanOrEqual(0);
      });
    });

    it('renders on canvas correctly for score = 0, score = 100, and score = 150 without crashing', () => {
      const payload0: ShareCardPayload = {
        type: 'roast',
        title: 'CV Điểm 0',
        score: 0,
        quoteOrHighlight: 'Hoàn toàn trống',
        summary: 'Cần làm lại',
      };
      const { unmount: u1 } = render(React.createElement(RpgShareCard, { payload: payload0 }));
      expect(audit.fillTextCalls.some((c) => c.text === '0')).toBe(true);
      u1();

      audit.fillTextCalls = [];
      const payload100: ShareCardPayload = {
        type: 'roast',
        title: 'CV Điểm 100',
        score: 100,
        quoteOrHighlight: 'Hoàn hảo',
        summary: 'Xuất sắc',
      };
      const { unmount: u2 } = render(React.createElement(RpgShareCard, { payload: payload100 }));
      expect(audit.fillTextCalls.some((c) => c.text === '100')).toBe(true);
      u2();

      audit.fillTextCalls = [];
      const payload150: ShareCardPayload = {
        type: 'roast',
        title: 'CV Siêu Điểm 150',
        score: 150,
        quoteOrHighlight: 'Vượt trần',
        summary: 'Vượt trần',
      };
      render(React.createElement(RpgShareCard, { payload: payload150 }));
      // Clamped to 100
      expect(audit.fillTextCalls.some((c) => c.text === '100')).toBe(true);
    });
  });

  describe('2. Missing Attributes, Undefined & Malformed Props Resiliency', () => {
    it('survives completely empty props <RpgShareCard /> using internal fallback payload', () => {
      expect(() => {
        render(React.createElement(RpgShareCard));
      }).not.toThrow();

      const drawn = audit.fillTextCalls.map((c) => c.text).join(' ');
      expect(drawn).toContain('ĐIỂM SINH TỒN CV');
      expect(drawn).toContain('75');
      expect(drawn).toContain('Hiệp Sĩ Fix Bug Gánh Team');
    });

    it('survives payload with missing strings (empty or undefined title, quote, summary)', () => {
      const sparsePayload: any = {
        type: 'roast',
        score: 65,
        title: undefined,
        quoteOrHighlight: undefined,
        summary: undefined,
      };

      expect(() => {
        render(React.createElement(RpgShareCard, { payload: sparsePayload }));
      }).not.toThrow();

      const drawn = audit.fillTextCalls.map((c) => c.text).join(' ');
      expect(drawn).toContain('Chiến Thần Kỹ Năng Mềm');
      expect(drawn).toContain('65');
    });

    it('survives directData prop passing sanitized data format', () => {
      const directData: SanitizedShareCardData = {
        type: 'interview',
        title: 'Phỏng Vấn STAR',
        score: 9.5,
        quoteOrHighlight: 'Phản xạ tốt',
        summary: 'Rất ấn tượng',
        sanitizedQuote: 'Phản xạ tốt',
        sanitizedSummary: 'Rất ấn tượng',
        maskedName: 'Ứng viên ẩn danh',
        badgeLabel: 'AI ROAST CV • PHỎNG VẤN ÁP LỰC STAR',
        generatedDate: '15/10/2026',
      };

      expect(() => {
        render(React.createElement(RpgShareCard, { data: directData }));
      }).not.toThrow();

      const drawn = audit.fillTextCalls.map((c) => c.text).join(' ');
      expect(drawn).toContain('Kẻ Hủy Diệt Vòng Gửi Xe');
      expect(drawn).toContain('95');
    });

    it('handles NaN score gracefully without throwing runtime error', () => {
      const nanPayload: any = {
        type: 'roast',
        title: 'Score NaN',
        score: NaN,
        quoteOrHighlight: 'Invalid score',
        summary: 'NaN score',
      };

      expect(() => {
        render(React.createElement(RpgShareCard, { payload: nanPayload }));
      }).not.toThrow();
    });
  });

  describe('3. Unicode, Diacritics, Emojis & Extreme String Stress', () => {
    it('renders candidate title with emojis and Vietnamese diacritics without crashing', () => {
      const emojiPayload: ShareCardPayload = {
        type: 'roast',
        title: '🔥 Senior Bug Hunter 🚀✨ [Nguyễn Đặng Hoàng Yến Phượng] 👑',
        score: 82,
        quoteOrHighlight: '💡 Kinh nghiệm cày đêm fix bug siêu hạng ☕ bug everywhere ⚡',
        summary: '🌟 Tóm tắt hồ sơ sinh tồn thần tốc 🎉',
        candidateName: 'Nguyễn Đặng Hoàng Yến Phượng',
      };

      expect(() => {
        render(React.createElement(RpgShareCard, { payload: emojiPayload }));
      }).not.toThrow();

      const drawn = audit.fillTextCalls.map((c) => c.text).join(' ');
      expect(drawn).toContain('Hiệp Sĩ Fix Bug Gánh Team');
      expect(drawn).toContain('82');
    });

    it('renders non-Latin scripts (CJK, Arabic, Cyrillic) and zalgo strings safely', () => {
      const multiScriptPayload: ShareCardPayload = {
        type: 'roast',
        title: '李雷 👨‍💻 مرحبا Алексей',
        score: 92,
        quoteOrHighlight: 'Zalgo: H̸e̵l̵l̵o̵ ̶W̷o̷r̸l̶d̶',
        summary: 'Special chars: ⚡🔥🚀🎯💡✨',
      };

      expect(() => {
        render(React.createElement(RpgShareCard, { payload: multiScriptPayload }));
      }).not.toThrow();

      expect(audit.fillTextCalls.length).toBeGreaterThan(0);
    });

    it('handles 500-character long strings in payload without layout or canvas crash', () => {
      const hugeString = 'SiêuThànhTíchDàiVôTậnKhôngCóDấuCách'.repeat(15);
      const hugePayload: ShareCardPayload = {
        type: 'roast',
        title: hugeString,
        score: 77,
        quoteOrHighlight: hugeString,
        summary: hugeString,
      };

      expect(() => {
        render(React.createElement(RpgShareCard, { payload: hugePayload }));
      }).not.toThrow();
    });
  });

  describe('4. PII Leakage Audit During Canvas Draw Calls', () => {
    it('STRICT PRIVACY: Verifies raw phone numbers and emails NEVER appear in any canvas draw calls', () => {
      const leakAttemptPayload: ShareCardPayload = {
        type: 'roast',
        title: 'CV của user.leaks@secretcompany.com',
        score: 85,
        quoteOrHighlight: 'Gọi ngay cho tôi tại 0912345678 hoặc +84988776655 để phỏng vấn.',
        summary: 'Email cá nhân: victim_applicant_2026@gmail.com',
        candidateName: 'Nguyễn Văn A',
        rawPiiText: 'Nguyễn Văn A - 0912345678 - victim_applicant_2026@gmail.com',
      };

      render(React.createElement(RpgShareCard, { payload: leakAttemptPayload }));

      const allRenderedText = audit.fillTextCalls
        .map((c) => c.text)
        .concat(audit.strokeTextCalls.map((c) => c.text))
        .join(' ');

      // 1. Raw Phone Numbers MUST NOT be rendered
      expect(allRenderedText).not.toContain('0912345678');
      expect(allRenderedText).not.toContain('+84988776655');
      expect(allRenderedText).not.toContain('0988776655');

      // 2. Raw Emails MUST NOT be rendered
      expect(allRenderedText).not.toContain('user.leaks@secretcompany.com');
      expect(allRenderedText).not.toContain('victim_applicant_2026@gmail.com');

      // 3. Raw Vietnamese Candidate Name MUST NOT be rendered
      expect(allRenderedText).not.toContain('Nguyễn Văn A');

      // 4. Must render masked placeholder instead
      expect(allRenderedText).toMatch(/\[Họ tên ẩn danh\]|Ứng viên ẩn danh/i);
    });

    it('scrubs PII when candidateName contains phone number or email directly', () => {
      const piiInNamePayload: ShareCardPayload = {
        type: 'roast',
        title: 'Testing PII in Name Field',
        score: 70,
        quoteOrHighlight: 'Valid quote',
        summary: 'Valid summary',
        candidateName: '0987654321',
      };

      render(React.createElement(RpgShareCard, { payload: piiInNamePayload }));

      const allRenderedText = audit.fillTextCalls.map((c) => c.text).join(' ');
      expect(allRenderedText).not.toContain('0987654321');
      expect(allRenderedText).toContain('09****4321');
    });

    it('evaluates lowercase Vietnamese name handling in candidateName field', () => {
      const lowercasePayload: ShareCardPayload = {
        type: 'roast',
        title: 'Testing Lowercase Name',
        score: 80,
        quoteOrHighlight: 'Good project work',
        summary: 'Solid performance',
        candidateName: 'nguyễn văn an',
      };
      const { unmount: uLower } = render(React.createElement(RpgShareCard, { payload: lowercasePayload }));
      const lowercaseRendered = audit.fillTextCalls.map((c) => c.text).join(' ');
      uLower();
      expect(lowercaseRendered).not.toContain('nguyễn văn an');
    });

    it('evaluates non-Vietnamese raw name handling in candidateName field (e.g. John Doe)', () => {
      const englishNamePayload: ShareCardPayload = {
        type: 'roast',
        title: 'Testing English Name',
        score: 85,
        quoteOrHighlight: 'Solid engineering experience',
        summary: 'Strong backend focus',
        candidateName: 'John Doe',
      };
      const { unmount: uEnglish } = render(React.createElement(RpgShareCard, { payload: englishNamePayload }));
      const englishRendered = audit.fillTextCalls.map((c) => c.text).join(' ');
      uEnglish();
      expect(englishRendered).not.toContain('John Doe');
    });
  });

  describe('5. High-Resolution Export Stability & DPR Scaling', () => {
    it('scales canvas dimensions accurately for standard DPR = 1', () => {
      const onReady = vi.fn();
      render(
        React.createElement(RpgShareCard, {
          format: 'landscape',
          onCanvasReady: onReady,
        })
      );

      const canvas = screen.getByTestId('rpg-share-canvas') as HTMLCanvasElement;
      expect(canvas.width).toBe(1200);
      expect(canvas.height).toBe(630);
      expect(onReady).toHaveBeenCalledWith(canvas);
    });

    it('scales canvas buffer proportionally for Retina DPR = 2 (2400x1260 landscape)', () => {
      const origDpr = window.devicePixelRatio;
      window.devicePixelRatio = 2;

      render(React.createElement(RpgShareCard, { format: 'landscape' }));
      const canvas = screen.getByTestId('rpg-share-canvas') as HTMLCanvasElement;

      expect(canvas.width).toBe(2400);
      expect(canvas.height).toBe(1260);
      expect(audit.scaleCalls).toContainEqual({ x: 2, y: 2 });

      window.devicePixelRatio = origDpr;
    });

    it('scales canvas buffer for Ultra HD DPR = 3 (3600x1890 landscape, 3240x3240 square)', () => {
      const origDpr = window.devicePixelRatio;
      window.devicePixelRatio = 3;

      const { unmount } = render(React.createElement(RpgShareCard, { format: 'landscape' }));
      let canvas = screen.getByTestId('rpg-share-canvas') as HTMLCanvasElement;
      expect(canvas.width).toBe(3600);
      expect(canvas.height).toBe(1890);
      unmount();

      render(React.createElement(RpgShareCard, { format: 'square' }));
      canvas = screen.getByTestId('rpg-share-canvas') as HTMLCanvasElement;
      expect(canvas.width).toBe(3240);
      expect(canvas.height).toBe(3240);

      window.devicePixelRatio = origDpr;
    });

    it('handles DPR <= 0 or undefined defensively by falling back to minimum 1', () => {
      const origDpr = window.devicePixelRatio;
      (window as any).devicePixelRatio = 0;

      render(React.createElement(RpgShareCard, { format: 'landscape' }));
      const canvas = screen.getByTestId('rpg-share-canvas') as HTMLCanvasElement;

      expect(canvas.width).toBe(1200);
      expect(canvas.height).toBe(630);

      window.devicePixelRatio = origDpr;
    });

    it('survives rapid successive prop re-renders (25 cycles) without throwing or leaking', () => {
      function RapidWrapper() {
        const [score, setScore] = useState(50);
        return React.createElement(
          'div',
          null,
          React.createElement('button', {
            'data-testid': 'increment-score',
            onClick: () => setScore((s) => (s + 5) % 100),
          }),
          React.createElement(RpgShareCard, {
            payload: {
              type: 'roast',
              title: `Iterative Score ${score}`,
              score,
              quoteOrHighlight: 'Iterative quote',
              summary: 'Iterative summary',
            },
          })
        );
      }

      render(React.createElement(RapidWrapper));
      const btn = screen.getByTestId('increment-score');

      act(() => {
        for (let i = 0; i < 25; i++) {
          btn.click();
        }
      });

      const canvas = screen.getByTestId('rpg-share-canvas') as HTMLCanvasElement;
      expect(canvas).toBeInTheDocument();
    });
  });
});

// ============================================================================
// PART 2: ADVERSARIAL STRESS TESTING - LenisProvider.tsx
// ============================================================================
describe('Adversarial Stress Testing: LenisProvider.tsx', () => {
  let originalMatchMedia: any;
  let originalResizeObserver: any;
  let originalRAF: any;
  let originalCancelRAF: any;

  function LenisTestConsumer() {
    const { isStopped, pause, resume, scrollTo } = useLenisScroll();
    return React.createElement(
      'div',
      null,
      React.createElement('span', { 'data-testid': 'lenis-state' }, isStopped ? 'STOPPED' : 'RUNNING'),
      React.createElement('button', { 'data-testid': 'btn-pause', onClick: pause }, 'Pause'),
      React.createElement('button', { 'data-testid': 'btn-resume', onClick: resume }, 'Resume'),
      React.createElement('button', { 'data-testid': 'btn-scroll-num', onClick: () => scrollTo(300) }, 'Scroll 300'),
      React.createElement('button', { 'data-testid': 'btn-scroll-selector', onClick: () => scrollTo('#target-section') }, 'Scroll Selector'),
      React.createElement('div', { id: 'target-section', 'data-testid': 'target-section' }, 'Target')
    );
  }

  beforeEach(() => {
    vi.restoreAllMocks();
    document.body.style.overflow = '';
    const oldDialogs = document.querySelectorAll('[role="dialog"]');
    oldDialogs.forEach((d) => d.remove());

    originalMatchMedia = window.matchMedia;
    originalResizeObserver = (window as any).ResizeObserver;
    originalRAF = window.requestAnimationFrame;
    originalCancelRAF = window.cancelAnimationFrame;

    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    (window as any).ResizeObserver = class {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    };

    window.requestAnimationFrame = vi.fn().mockImplementation((cb) => {
      return 999;
    });
    window.cancelAnimationFrame = vi.fn();
  });

  afterEach(() => {
    document.body.style.overflow = '';
    const oldDialogs = document.querySelectorAll('[role="dialog"]');
    oldDialogs.forEach((d) => d.remove());

    window.matchMedia = originalMatchMedia;
    (window as any).ResizeObserver = originalResizeObserver;
    window.requestAnimationFrame = originalRAF;
    window.cancelAnimationFrame = originalCancelRAF;
  });

  describe('1. Rapid Modal Toggle Stress (50x Cycles)', () => {
    it('executes 50 rapid successive modal open/close cycles without race conditions or stuck state', async () => {
      render(
        React.createElement(
          LenisProvider,
          null,
          React.createElement(LenisTestConsumer)
        )
      );

      expect(screen.getByTestId('lenis-state')).toHaveTextContent('RUNNING');

      // Rapidly toggle document.body.style.overflow between 'hidden' and '' 50 times
      for (let i = 0; i < 50; i++) {
        act(() => {
          document.body.style.overflow = 'hidden';
        });
        act(() => {
          document.body.style.overflow = '';
        });
      }

      // Allow MutationObserver microtasks to settle
      await act(async () => {
        await new Promise((r) => setTimeout(r, 20));
      });

      // Final state must accurately reflect modal closed -> RUNNING
      expect(screen.getByTestId('lenis-state')).toHaveTextContent('RUNNING');

      // Now open modal one last time
      act(() => {
        document.body.style.overflow = 'hidden';
      });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 20));
      });

      // Must accurately transition to STOPPED
      expect(screen.getByTestId('lenis-state')).toHaveTextContent('STOPPED');

      // Close modal
      act(() => {
        document.body.style.overflow = '';
      });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 20));
      });

      expect(screen.getByTestId('lenis-state')).toHaveTextContent('RUNNING');
    });

    it('handles 50 rapid DOM insertions and removals of [role="dialog"] elements', async () => {
      render(
        React.createElement(
          LenisProvider,
          null,
          React.createElement(LenisTestConsumer)
        )
      );

      for (let i = 0; i < 50; i++) {
        let dialogEl: HTMLDivElement | null = null;
        act(() => {
          dialogEl = document.createElement('div');
          dialogEl.setAttribute('role', 'dialog');
          dialogEl.textContent = `Modal ${i}`;
          document.body.appendChild(dialogEl);
        });
        act(() => {
          if (dialogEl && dialogEl.parentNode) {
            dialogEl.parentNode.removeChild(dialogEl);
          }
        });
      }

      await act(async () => {
        await new Promise((r) => setTimeout(r, 20));
      });

      expect(screen.getByTestId('lenis-state')).toHaveTextContent('RUNNING');
    });

    it('correctly handles nested dialogs (Dialog 1 remains open when Dialog 2 closes)', async () => {
      render(
        React.createElement(
          LenisProvider,
          null,
          React.createElement(LenisTestConsumer)
        )
      );

      const dialog1 = document.createElement('div');
      dialog1.setAttribute('role', 'dialog');
      dialog1.id = 'dialog-1';

      const dialog2 = document.createElement('div');
      dialog2.setAttribute('role', 'dialog');
      dialog2.id = 'dialog-2';

      // Step 1: Dialog 1 opens
      act(() => {
        document.body.appendChild(dialog1);
      });
      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
      });
      expect(screen.getByTestId('lenis-state')).toHaveTextContent('STOPPED');

      // Step 2: Dialog 2 opens on top
      act(() => {
        document.body.appendChild(dialog2);
      });
      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
      });
      expect(screen.getByTestId('lenis-state')).toHaveTextContent('STOPPED');

      // Step 3: Dialog 2 closes while Dialog 1 is STILL OPEN
      act(() => {
        dialog2.remove();
      });
      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
      });
      // Lenis MUST remain STOPPED because Dialog 1 is still present in DOM!
      expect(screen.getByTestId('lenis-state')).toHaveTextContent('STOPPED');

      // Step 4: Dialog 1 finally closes
      act(() => {
        dialog1.remove();
      });
      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
      });
      expect(screen.getByTestId('lenis-state')).toHaveTextContent('RUNNING');
    });
  });

  describe('2. Reduced Motion Accessibility Behavior', () => {
    it('initializes Lenis with short duration and disables smoothWheel when prefers-reduced-motion is true', () => {
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('prefers-reduced-motion: reduce'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      expect(() => {
        render(
          React.createElement(
            LenisProvider,
            null,
            React.createElement('div', null, 'Reduced Motion Content')
          )
        );
      }).not.toThrow();
    });
  });

  describe('3. JSDOM SSR & Fallback Behavior when Browser APIs are Missing', () => {
    it('isLenisSupported returns false when matchMedia is missing', () => {
      delete (window as any).matchMedia;
      expect(isLenisSupported()).toBe(false);
    });

    it('isLenisSupported returns false when ResizeObserver is missing', () => {
      delete (window as any).ResizeObserver;
      expect(isLenisSupported()).toBe(false);
    });

    it('isLenisSupported returns false when requestAnimationFrame is missing', () => {
      delete (window as any).requestAnimationFrame;
      expect(isLenisSupported()).toBe(false);
    });

    it('renders children smoothly when isLenisSupported is false without crashing', () => {
      delete (window as any).ResizeObserver;

      render(
        React.createElement(
          LenisProvider,
          null,
          React.createElement('div', { 'data-testid': 'fallback-child' }, 'Fallback Content')
        )
      );

      expect(screen.getByTestId('fallback-child')).toBeInTheDocument();
    });

    it('provides graceful no-op / window fallback for useLenisScroll when Lenis is disabled or unsupported', () => {
      delete (window as any).ResizeObserver;
      const windowScrollSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

      render(
        React.createElement(
          LenisProvider,
          { disabled: true },
          React.createElement(LenisTestConsumer)
        )
      );

      // Manual pause and resume should not throw
      const pauseBtn = screen.getByTestId('btn-pause');
      const resumeBtn = screen.getByTestId('btn-resume');
      expect(() => pauseBtn.click()).not.toThrow();
      expect(() => resumeBtn.click()).not.toThrow();

      // scrollTo with numeric target calls window.scrollTo
      const scrollNumBtn = screen.getByTestId('btn-scroll-num');
      scrollNumBtn.click();
      expect(windowScrollSpy).toHaveBeenCalledWith({ top: 300, behavior: 'smooth' });

      // scrollTo with CSS selector calls scrollIntoView
      const targetEl = screen.getByTestId('target-section');
      const scrollIntoViewSpy = vi.fn();
      targetEl.scrollIntoView = scrollIntoViewSpy;

      const scrollSelectorBtn = screen.getByTestId('btn-scroll-selector');
      scrollSelectorBtn.click();
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({ behavior: 'smooth' });
    });
  });

  describe('4. Lifecycle & Unmount Cleanliness', () => {
    it('disconnects MutationObserver and cancels animation frame cleanly on unmount', () => {
      const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');

      const { unmount } = render(
        React.createElement(
          LenisProvider,
          null,
          React.createElement(LenisTestConsumer)
        )
      );

      unmount();

      expect(cancelSpy).toHaveBeenCalled();
    });

    it('does not leak or throw when unmounting while modal is open (overflow hidden)', async () => {
      const { unmount } = render(
        React.createElement(
          LenisProvider,
          null,
          React.createElement(LenisTestConsumer)
        )
      );

      act(() => {
        document.body.style.overflow = 'hidden';
      });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
      });

      expect(() => {
        unmount();
      }).not.toThrow();
    });

    it('measures Lenis instance stability across parent re-renders when options prop is omitted', () => {
      let renderCount = 0;
      function ParentWithState() {
        const [count, setCount] = useState(0);
        return React.createElement(
          'div',
          null,
          React.createElement('button', {
            'data-testid': 'trigger-parent-render',
            onClick: () => setCount((c) => c + 1),
          }),
          React.createElement(
            LenisProvider,
            null,
            React.createElement(LenisTestConsumer)
          )
        );
      }

      render(React.createElement(ParentWithState));
      const triggerBtn = screen.getByTestId('trigger-parent-render');
      const initialRafCalls = (window.requestAnimationFrame as any).mock.calls.length;
      act(() => {
        for (let i = 0; i < 10; i++) {
          triggerBtn.click();
        }
      });
      const subsequentRafCalls = (window.requestAnimationFrame as any).mock.calls.length;
      // Assert that Lenis is not torn down and recreated on every parent re-render
      expect(subsequentRafCalls).toBe(initialRafCalls);
      expect(screen.getByTestId('lenis-state')).toHaveTextContent('RUNNING');
    });

    it('verifies whether useLenisScroll().lenis exposes the active instance after mount', () => {
      let capturedLenis: any = undefined;
      function LenisInstanceInspector() {
        const { lenis } = useLenisScroll();
        capturedLenis = lenis;
        return React.createElement('div', null, lenis ? 'HAS_LENIS' : 'NULL_LENIS');
      }

      render(
        React.createElement(
          LenisProvider,
          null,
          React.createElement(LenisInstanceInspector)
        )
      );

      // In an environment where Lenis is supported and initialized, lenis should be exposed to consumers
      expect(capturedLenis).not.toBeNull();
    });
  });
});

