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
} from '@/components/providers/LenisProvider';
import {
  ShareCardPayload,
  SanitizedShareCardData,
  sanitizeCandidateName,
  prepareShareCardData,
} from '@/lib/schemas/share';

// ============================================================================
// Canvas 2D Mocking Setup
// ============================================================================
interface CanvasAuditLog {
  fillTextCalls: { text: string; x: number; y: number }[];
  strokeTextCalls: { text: string; x: number; y: number }[];
}

function setupCanvasMock(): CanvasAuditLog {
  const audit: CanvasAuditLog = {
    fillTextCalls: [],
    strokeTextCalls: [],
  };

  const mockContext2D: any = {
    fillRect: vi.fn(),
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
    scale: vi.fn(),
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

describe('Challenger Iteration 2: Empirical Stress Harness for M4-2 Remediation', () => {
  let audit: CanvasAuditLog;

  beforeEach(() => {
    audit = setupCanvasMock();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // VECTOR 1: PII Leakage Adversarial Verification
  // ==========================================================================
  describe('Vector 1: Zero-PII Leakage Verification (Names, Phones, Emails)', () => {
    const rawNamesToTest = [
      // 1. Lowercase Vietnamese names
      { raw: 'nguyễn văn an', desc: 'all-lowercase standard Vietnamese name' },
      { raw: 'trần thị thảo', desc: 'all-lowercase female Vietnamese name' },
      { raw: 'lê hoàng đức', desc: 'all-lowercase 3-word Vietnamese name' },
      { raw: 'nguyễn đặng hoàng yến phượng', desc: 'all-lowercase 5-word compound Vietnamese name' },

      // 2. English & Foreign names
      { raw: 'John Doe', desc: 'standard Title Case English name' },
      { raw: 'john doe', desc: 'lowercase English name' },
      { raw: 'Alice Smith', desc: 'female English name' },
      { raw: 'Michael Johnson', desc: 'multi-syllable foreign name' },
      { raw: 'Jean-Luc Picard', desc: 'hyphenated foreign name' },

      // 3. Mixed casing / SpongeBob mock casing
      { raw: 'nGuYễN vĂn aN', desc: 'sponge-bob mixed case Vietnamese name' },
      { raw: 'jOhN dOe', desc: 'sponge-bob mixed case English name' },
      { raw: 'aLiCe SmItH', desc: 'sponge-bob mixed case Alice' },
      { raw: 'NGUYỄN VĂN AN', desc: 'ALL-UPPERCASE Vietnamese name' },
      { raw: 'JOHN DOE', desc: 'ALL-UPPERCASE English name' },

      // 4. Names with surrounding whitespace or punctuation
      { raw: '   nguyễn văn an   ', desc: 'name with leading and trailing spaces' },
      { raw: 'Nguyễn Văn A.', desc: 'name with trailing period' },
      { raw: 'Candidate: John Doe', desc: 'name with label prefix' },
    ];

    rawNamesToTest.forEach(({ raw, desc }) => {
      it(`guarantees raw candidateName "${raw}" (${desc}) NEVER leaks to canvas fillText`, () => {
        const payload: ShareCardPayload = {
          type: 'roast',
          title: 'CV Kiểm Thử PII',
          score: 80,
          quoteOrHighlight: 'Trích dẫn an toàn',
          summary: 'Tóm tắt an toàn',
          candidateName: raw,
        };

        const { unmount } = render(React.createElement(RpgShareCard, { payload }));
        const allDrawnText = audit.fillTextCalls
          .map((c) => c.text)
          .concat(audit.strokeTextCalls.map((c) => c.text))
          .join(' ');

        // Check against raw name, trimmed raw name, and lowercase variants
        const trimmed = raw.trim();
        expect(allDrawnText).not.toContain(trimmed);
        expect(allDrawnText.toLowerCase()).not.toContain('nguyễn văn an');
        expect(allDrawnText.toLowerCase()).not.toContain('john doe');
        expect(allDrawnText.toLowerCase()).not.toContain('alice smith');

        // Verify that masked placeholder is present
        expect(allDrawnText).toMatch(/\[Họ tên ẩn danh\]|Ứng viên ẩn danh/i);
        unmount();
      });
    });

    it('sanitizes direct candidateName helper across adversarial variations', () => {
      expect(sanitizeCandidateName('nguyễn văn an')).toBe('[Họ tên ẩn danh]');
      expect(sanitizeCandidateName('John Doe')).toBe('[Họ tên ẩn danh]');
      expect(sanitizeCandidateName('nGuYễN vĂn aN')).toBe('[Họ tên ẩn danh]');
      expect(sanitizeCandidateName('jOhN dOe')).toBe('[Họ tên ẩn danh]');
      expect(sanitizeCandidateName('ALICE SMITH')).toBe('[Họ tên ẩn danh]');
      expect(sanitizeCandidateName('')).toBe('Ứng viên ẩn danh');
      expect(sanitizeCandidateName('   ')).toBe('Ứng viên ẩn danh');
      expect(sanitizeCandidateName(null)).toBe('Ứng viên ẩn danh');
      expect(sanitizeCandidateName(undefined)).toBe('Ứng viên ẩn danh');

      // Preserves existing masks
      expect(sanitizeCandidateName('[Họ tên ẩn danh]')).toBe('[Họ tên ẩn danh]');
      expect(sanitizeCandidateName('Ứng viên ẩn danh')).toBe('Ứng viên ẩn danh');
      expect(sanitizeCandidateName('09****1234')).toBe('09****1234');

      // Phone numbers become masked
      expect(sanitizeCandidateName('0987654321')).toBe('09****4321');
      expect(sanitizeCandidateName('+84988776655')).toBe('+84****6655');

      // Emails become masked
      expect(sanitizeCandidateName('user@domain.com')).toBe('u***r@domain.com');
    });

    it('scrubs PII when raw candidate name is embedded in title or quote', () => {
      const payload: ShareCardPayload = {
        type: 'roast',
        title: 'CV của John Doe tại Hà Nội',
        score: 75,
        quoteOrHighlight: 'Liên hệ nguyễn văn an qua 0912345678',
        summary: 'Gửi về test@example.com',
        candidateName: 'nguyễn văn an',
      };

      render(React.createElement(RpgShareCard, { payload }));
      const allDrawnText = audit.fillTextCalls.map((c) => c.text).join(' ');

      expect(allDrawnText).not.toContain('0912345678');
      expect(allDrawnText).not.toContain('test@example.com');
      expect(allDrawnText).not.toContain('nguyễn văn an');
    });
  });

  // ==========================================================================
  // VECTOR 2: Score Boundary Clamping in calculateRpgProfile
  // ==========================================================================
  describe('Vector 2: Score Boundary Clamping in calculateRpgProfile', () => {
    it('strictly clamps negative interview score -1 to survivalScore >= 0', () => {
      const profile = calculateRpgProfile(-1, 'interview');
      expect(profile.survivalScore).toBe(0);
      expect(profile.tier).toBe('F');
      expect(profile.title).toBe('Phù Thủy Văn Mẫu');
    });

    it('strictly clamps extreme negative interview scores (-10, -50, -999, -Infinity) to 0', () => {
      const testCases = [-0.1, -1, -10, -50, -999, -Infinity];
      testCases.forEach((val) => {
        const profile = calculateRpgProfile(val, 'interview');
        expect(profile.survivalScore).toBe(0);
        expect(profile.tier).toBe('F');
      });
    });

    it('strictly clamps negative roast scores (-1, -100) to 0', () => {
      const p1 = calculateRpgProfile(-1, 'roast');
      expect(p1.survivalScore).toBe(0);
      expect(p1.tier).toBe('F');

      const p2 = calculateRpgProfile(-100, 'roast');
      expect(p2.survivalScore).toBe(0);
      expect(p2.tier).toBe('F');
    });

    it('strictly clamps overflow interview scores (> 100, Infinity) to 100', () => {
      const p105 = calculateRpgProfile(105, 'interview');
      expect(p105.survivalScore).toBe(100);
      expect(p105.tier).toBe('SSR');

      const pInf = calculateRpgProfile(Infinity, 'interview');
      expect(pInf.survivalScore).toBe(100);
      expect(pInf.tier).toBe('SSR');
    });

    it('strictly clamps overflow roast scores (> 100, Infinity) to 100', () => {
      const p150 = calculateRpgProfile(150, 'roast');
      expect(p150.survivalScore).toBe(100);
      expect(p150.tier).toBe('SSR');
    });

    it('verifies exact threshold boundaries for interview (10-point scale * 10)', () => {
      // 0 -> 0 (F)
      expect(calculateRpgProfile(0, 'interview').survivalScore).toBe(0);
      expect(calculateRpgProfile(0, 'interview').tier).toBe('F');

      // 4.4 -> 44 (F)
      expect(calculateRpgProfile(4.4, 'interview').survivalScore).toBe(44);
      expect(calculateRpgProfile(4.4, 'interview').tier).toBe('F');

      // 4.5 -> 45 (C)
      expect(calculateRpgProfile(4.5, 'interview').survivalScore).toBe(45);
      expect(calculateRpgProfile(4.5, 'interview').tier).toBe('C');

      // 5.9 -> 59 (C)
      expect(calculateRpgProfile(5.9, 'interview').survivalScore).toBe(59);
      expect(calculateRpgProfile(5.9, 'interview').tier).toBe('C');

      // 6.0 -> 60 (B)
      expect(calculateRpgProfile(6.0, 'interview').survivalScore).toBe(60);
      expect(calculateRpgProfile(6.0, 'interview').tier).toBe('B');

      // 7.4 -> 74 (B)
      expect(calculateRpgProfile(7.4, 'interview').survivalScore).toBe(74);
      expect(calculateRpgProfile(7.4, 'interview').tier).toBe('B');

      // 7.5 -> 75 (A)
      expect(calculateRpgProfile(7.5, 'interview').survivalScore).toBe(75);
      expect(calculateRpgProfile(7.5, 'interview').tier).toBe('A');

      // 8.9 -> 89 (A)
      expect(calculateRpgProfile(8.9, 'interview').survivalScore).toBe(89);
      expect(calculateRpgProfile(8.9, 'interview').tier).toBe('A');

      // 9.0 -> 90 (SSR)
      expect(calculateRpgProfile(9.0, 'interview').survivalScore).toBe(90);
      expect(calculateRpgProfile(9.0, 'interview').tier).toBe('SSR');

      // 10.0 -> 100 (SSR)
      expect(calculateRpgProfile(10.0, 'interview').survivalScore).toBe(100);
      expect(calculateRpgProfile(10.0, 'interview').tier).toBe('SSR');
    });

    it('verifies RpgShareCard never draws a negative score string on canvas for score = -1', () => {
      const payload: ShareCardPayload = {
        type: 'interview',
        title: 'Phỏng Vấn Điểm Âm',
        score: -1,
        quoteOrHighlight: 'Thử nghiệm điểm âm',
        summary: 'Kiểm tra clamping',
      };

      render(React.createElement(RpgShareCard, { payload }));
      const allDrawnText = audit.fillTextCalls.map((c) => c.text);

      expect(allDrawnText).not.toContain('-10');
      expect(allDrawnText).not.toContain('-1');
      expect(allDrawnText).toContain('0');
      expect(allDrawnText).toContain('Phù Thủy Văn Mẫu');
    });
  });

  // ==========================================================================
  // VECTOR 3: Lenis Lifecycle Stability & Parent Re-renders
  // ==========================================================================
  describe('Vector 3: Lenis Lifecycle Stability Across Parent Re-renders', () => {
    let originalRAF: any;
    let originalCancelRAF: any;
    let originalMatchMedia: any;
    let originalResizeObserver: any;

    beforeEach(() => {
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

      window.requestAnimationFrame = vi.fn().mockImplementation(() => 101);
      window.cancelAnimationFrame = vi.fn();
    });

    afterEach(() => {
      window.matchMedia = originalMatchMedia;
      (window as any).ResizeObserver = originalResizeObserver;
      window.requestAnimationFrame = originalRAF;
      window.cancelAnimationFrame = originalCancelRAF;
    });

    it('guarantees 50 parent re-renders do NOT re-instantiate Lenis or duplicate RAF loops', () => {
      function ParentHarness() {
        const [counter, setCounter] = useState(0);
        return React.createElement(
          'div',
          null,
          React.createElement('button', {
            'data-testid': 're-render-btn',
            onClick: () => setCounter((c) => c + 1),
          }),
          React.createElement('span', { 'data-testid': 'render-count' }, counter),
          React.createElement(
            LenisProvider,
            null,
            React.createElement('div', { 'data-testid': 'child' }, 'Active')
          )
        );
      }

      render(React.createElement(ParentHarness));
      const btn = screen.getByTestId('re-render-btn');

      const initialRafCallCount = (window.requestAnimationFrame as any).mock.calls.length;
      expect(initialRafCallCount).toBeGreaterThanOrEqual(1);

      act(() => {
        for (let i = 0; i < 50; i++) {
          btn.click();
        }
      });

      expect(screen.getByTestId('render-count')).toHaveTextContent('50');

      const finalRafCallCount = (window.requestAnimationFrame as any).mock.calls.length;
      // Because Lenis is NOT re-instantiated, initial requestAnimationFrame is NOT called again!
      expect(finalRafCallCount).toBe(initialRafCallCount);
    });

    it('cancels animation frame and tears down cleanly when unmounting', () => {
      const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');
      const { unmount } = render(
        React.createElement(
          LenisProvider,
          null,
          React.createElement('div', null, 'Content')
        )
      );

      unmount();
      expect(cancelSpy).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // VECTOR 4: Context Value useLenisScroll().lenis Non-Null Upon Mount
  // ==========================================================================
  describe('Vector 4: useLenisScroll().lenis Context Value Verification', () => {
    let originalMatchMedia: any;
    let originalResizeObserver: any;
    let originalRAF: any;
    let originalCancelRAF: any;

    beforeEach(() => {
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

      window.requestAnimationFrame = vi.fn().mockImplementation(() => 101);
      window.cancelAnimationFrame = vi.fn();
    });

    afterEach(() => {
      window.matchMedia = originalMatchMedia;
      (window as any).ResizeObserver = originalResizeObserver;
      window.requestAnimationFrame = originalRAF;
      window.cancelAnimationFrame = originalCancelRAF;
    });

    it('verifies useLenisScroll().lenis is NOT null upon mount when supported', () => {
      let capturedContext: any = null;

      function Consumer() {
        const ctx = useLenisScroll();
        capturedContext = ctx;
        return React.createElement('div', { 'data-testid': 'status' }, ctx.lenis ? 'READY' : 'NULL');
      }

      render(
        React.createElement(
          LenisProvider,
          null,
          React.createElement(Consumer)
        )
      );

      expect(screen.getByTestId('status')).toHaveTextContent('READY');
      expect(capturedContext).not.toBeNull();
      expect(capturedContext.lenis).not.toBeNull();
      expect(typeof capturedContext.lenis.start).toBe('function');
      expect(typeof capturedContext.lenis.stop).toBe('function');
      expect(typeof capturedContext.lenis.scrollTo).toBe('function');
      expect(capturedContext.isStopped).toBe(false);
    });

    it('verifies pause() and resume() manipulate context state and invoke lenis methods', () => {
      let capturedContext: any = null;

      function Controller() {
        capturedContext = useLenisScroll();
        return React.createElement(
          'div',
          null,
          React.createElement('button', { 'data-testid': 'btn-p', onClick: capturedContext.pause }),
          React.createElement('button', { 'data-testid': 'btn-r', onClick: capturedContext.resume }),
          React.createElement('span', { 'data-testid': 'stop-flag' }, capturedContext.isStopped ? 'STOPPED' : 'ACTIVE')
        );
      }

      render(
        React.createElement(
          LenisProvider,
          null,
          React.createElement(Controller)
        )
      );

      expect(screen.getByTestId('stop-flag')).toHaveTextContent('ACTIVE');

      act(() => {
        screen.getByTestId('btn-p').click();
      });
      expect(screen.getByTestId('stop-flag')).toHaveTextContent('STOPPED');
      expect(capturedContext.isStopped).toBe(true);

      act(() => {
        screen.getByTestId('btn-r').click();
      });
      expect(screen.getByTestId('stop-flag')).toHaveTextContent('ACTIVE');
      expect(capturedContext.isStopped).toBe(false);
    });

    it('provides graceful fallback when disabled=true (lenis is null, functions are safe)', () => {
      let capturedContext: any = null;

      function DisabledConsumer() {
        capturedContext = useLenisScroll();
        return React.createElement('div', null, capturedContext.lenis ? 'PRESENT' : 'NULL');
      }

      render(
        React.createElement(
          LenisProvider,
          { disabled: true },
          React.createElement(DisabledConsumer)
        )
      );

      expect(capturedContext.lenis).toBeNull();
      expect(() => capturedContext.pause()).not.toThrow();
      expect(() => capturedContext.resume()).not.toThrow();
      expect(() => capturedContext.scrollTo(100)).not.toThrow();
    });
  });
});
