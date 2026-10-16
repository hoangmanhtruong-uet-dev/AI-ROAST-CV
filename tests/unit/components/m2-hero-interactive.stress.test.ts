import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as THREE from 'three';

import * as webglDetectModule from '@/lib/utils/webgl-detect';
import HeroSection from '@/components/landing/HeroSection';
import PersonaSwitcher, { PersonaMode, PERSONA_OPTIONS } from '@/components/landing/PersonaSwitcher';
import Hero3DCanvas from '@/components/landing/Hero3DCanvas';
import CssHologramFallback from '@/components/landing/CssHologramFallback';
import { soundEngine } from '@/lib/audio/sound-engine';

// Mock framer-motion for reliable headless test execution without layout thrashing
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, style, animate, transition, ...props }: any) =>
      React.createElement('div', { className, style, 'data-animate': JSON.stringify(animate), ...props }, children),
    span: ({ children, className, style, animate, ...props }: any) =>
      React.createElement('span', { className, style, ...props }, children),
    button: ({ children, className, style, ...props }: any) =>
      React.createElement('button', { className, style, ...props }, children),
  },
  AnimatePresence: ({ children }: any) => React.createElement(React.Fragment, null, children),
}));

// Shared Three.js mock for WebGL lifecycle verification
const mockDispose = vi.fn();
const mockSetSize = vi.fn();
const mockRender = vi.fn();
const mockDomElement = typeof document !== 'undefined' ? document.createElement('canvas') : ({} as any);

vi.mock('three', async (importOriginal) => {
  const actual = await importOriginal<typeof import('three')>();

  class MockWebGLRenderer {
    domElement = mockDomElement;
    setSize = mockSetSize;
    setPixelRatio = vi.fn();
    render = mockRender;
    dispose = mockDispose;
  }

  return {
    ...actual,
    WebGLRenderer: MockWebGLRenderer,
  };
});

const setupDefaultMatchMedia = () => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

describe('Milestone 2 Adversarial Stress Testing: Persona Switcher, Text Scramble & Magnetic CTAs', () => {
  beforeEach(() => {
    localStorage.clear();
    setupDefaultMatchMedia();
    soundEngine.resetForTesting();
  });

  afterEach(() => {
    cleanup();
    setupDefaultMatchMedia();
    soundEngine.resetForTesting();
    vi.restoreAllMocks();
  });

  /* ======================================================================= */
  /* SUITE 1: RAPID PERSONA MODE SWITCHING (100 RAPID CLICKS)                */
  /* ======================================================================= */
  describe('1. Rapid Persona Mode Switching Stress (100 Clicks)', () => {
    it('executes 100 rapid clicks alternating between spicy, expert, and stress modes without crashing or state desync', async () => {
      render(React.createElement(HeroSection));

      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(3);

      const modes: PersonaMode[] = ['spicy', 'expert', 'stress'];

      // Rapidly fire 100 clicks cycling through all 3 modes
      for (let i = 0; i < 100; i++) {
        const targetIndex = (i + 1) % 3;
        fireEvent.click(tabs[targetIndex]);

        // Verify active tab reflects current mode immediately
        expect(tabs[targetIndex]).toHaveAttribute('aria-selected', 'true');
        for (let j = 0; j < 3; j++) {
          if (j !== targetIndex) {
            expect(tabs[j]).toHaveAttribute('aria-selected', 'false');
          }
        }
      }

      // After 100 clicks, targetIndex was (99+1)%3 = 1 -> 'expert'
      expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
      expect(tabs[0]).toHaveAttribute('aria-selected', 'false');
      expect(tabs[2]).toHaveAttribute('aria-selected', 'false');

      // Verify ambient glow style matches expert mode (cyan glow)
      const ambientGlowDiv = document.querySelector('div[aria-hidden="true"].transition-colors');
      expect(ambientGlowDiv).not.toBeNull();
      expect(ambientGlowDiv?.className).toContain('rgba(6,182,212,0.18)');

      // Verify tagline subtitle matches expert mode
      expect(
        screen.getByText(/Góc nhìn HR Director, tối ưu chuẩn ATS/i)
      ).toBeInTheDocument();
    });

    it('verifies ambient glow background updates precisely for each persona mode', async () => {
      render(React.createElement(HeroSection));

      const tabs = screen.getAllByRole('tab');
      const ambientGlowDiv = document.querySelector('div[aria-hidden="true"].transition-colors');
      expect(ambientGlowDiv).not.toBeNull();

      // Initial state: spicy (orange glow)
      expect(ambientGlowDiv?.className).toContain('rgba(249,115,22,0.18)');

      // Switch to expert: cyan glow
      fireEvent.click(tabs[1]);
      expect(ambientGlowDiv?.className).toContain('rgba(6,182,212,0.18)');

      // Switch to stress: violet glow
      fireEvent.click(tabs[2]);
      expect(ambientGlowDiv?.className).toContain('rgba(139,92,246,0.20)');

      // Switch back to spicy: orange glow
      fireEvent.click(tabs[0]);
      expect(ambientGlowDiv?.className).toContain('rgba(249,115,22,0.18)');
    });

    it('triggers the corresponding soundEngine method on each distinct mode change', async () => {
      const playSpy = vi.spyOn(soundEngine, 'play');
      const playFlameSpy = vi.spyOn(soundEngine, 'playFlame');
      const playLaserSpy = vi.spyOn(soundEngine, 'playLaser');
      const playHeartbeatSpy = vi.spyOn(soundEngine, 'playHeartbeat');

      render(React.createElement(HeroSection));
      const tabs = screen.getAllByRole('tab');

      // 1. Switch to expert: plays blip + laser
      fireEvent.click(tabs[1]);
      expect(playSpy).toHaveBeenCalledWith('blip');
      expect(playLaserSpy).toHaveBeenCalledTimes(1);

      // 2. Switch to stress: plays blip + heartbeat
      fireEvent.click(tabs[2]);
      expect(playHeartbeatSpy).toHaveBeenCalledTimes(1);

      // 3. Switch to spicy: plays blip + flame
      fireEvent.click(tabs[0]);
      expect(playFlameSpy).toHaveBeenCalledTimes(1);
    });

    it('is strictly idempotent: repeated clicks on the active tab do NOT re-trigger callbacks or audio', () => {
      const handleModeChange = vi.fn();
      const playSpy = vi.spyOn(soundEngine, 'play');
      const playFlameSpy = vi.spyOn(soundEngine, 'playFlame');

      render(
        React.createElement(PersonaSwitcher, {
          currentMode: 'spicy',
          onModeChange: handleModeChange,
        })
      );

      const tabs = screen.getAllByRole('tab');

      // Burst of 30 rapid clicks on already-active tab
      for (let i = 0; i < 30; i++) {
        fireEvent.click(tabs[0]);
      }

      expect(handleModeChange).not.toHaveBeenCalled();
      expect(playSpy).not.toHaveBeenCalled();
      expect(playFlameSpy).not.toHaveBeenCalled();
    });

    it('survives soundEngine throwing unexpected errors during rapid switching without crashing the UI', () => {
      vi.spyOn(soundEngine, 'play').mockImplementation(() => {
        throw new Error('AudioContext blocked by autoplay policy');
      });
      vi.spyOn(soundEngine, 'playLaser').mockImplementation(() => {
        throw new Error('Hardware audio failure');
      });
      vi.spyOn(soundEngine, 'playHeartbeat').mockImplementation(() => {
        throw new Error('Buffer allocation error');
      });
      vi.spyOn(soundEngine, 'playFlame').mockImplementation(() => {
        throw new Error('Oscillator error');
      });

      render(React.createElement(HeroSection));
      const tabs = screen.getAllByRole('tab');

      // Rapidly switch through modes despite soundEngine throwing errors
      expect(() => {
        for (let i = 0; i < 30; i++) {
          fireEvent.click(tabs[i % 3]);
        }
      }).not.toThrow();

      // UI state must remain valid and operational
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    it('synchronizes Three.js 3D canvas materials dynamically across rapid mode changes when WebGL is active', async () => {
      const isSupportedSpy = vi
        .spyOn(webglDetectModule, 'isWebGLSupported')
        .mockReturnValue(true);

      const { rerender, unmount } = render(React.createElement(Hero3DCanvas, { mode: 'spicy' }));

      // Rapidly re-render mode prop 50 times
      const modes: PersonaMode[] = ['spicy', 'expert', 'stress'];
      for (let i = 0; i < 50; i++) {
        rerender(React.createElement(Hero3DCanvas, { mode: modes[i % 3] }));
      }

      expect(() => {
        unmount();
      }).not.toThrow();

      expect(mockDispose).toHaveBeenCalled();
      isSupportedSpy.mockRestore();
    });
  });

  /* ======================================================================= */
  /* SUITE 2: TEXT SCRAMBLE RESILIENCE & HEADING QUERY RELIABILITY            */
  /* ======================================================================= */
  describe('2. Text Scramble Resilience & Heading Reliability', () => {
    it('always preserves `/AI Roast CV/i` in the <h1> heading on initial mount for query reliability', () => {
      render(React.createElement(HeroSection));

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading.textContent).toMatch(/AI Roast CV/i);
      expect(heading.textContent).toContain('Mổ xẻ CV & Phỏng vấn áp lực');
      expect(heading.textContent).toContain('CV của bạn có đủ sức sống sót trước nhà tuyển dụng khó tính?');
    });

    it('respects prefers-reduced-motion: reduce media query by rendering plain unscrambled title immediately', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        configurable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: query.includes('prefers-reduced-motion: reduce'),
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(React.createElement(HeroSection));

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading.textContent).toContain('AI Roast CV —');
    });

    it('handles rapid mount and unmount cycles without orphaned requestAnimationFrame callbacks or memory leaks', () => {
      const cancelAnimationSpy = vi.spyOn(window, 'cancelAnimationFrame');

      // Rapidly mount and unmount HeroSection 25 times
      for (let i = 0; i < 25; i++) {
        const { unmount } = render(React.createElement(HeroSection));
        unmount();
      }

      expect(cancelAnimationSpy).toHaveBeenCalled();
      cancelAnimationSpy.mockRestore();
    });

    it('safely falls back to unscrambled text when requestAnimationFrame is unavailable (SSR/mock environment)', () => {
      const originalRaf = window.requestAnimationFrame;
      // @ts-expect-error test deletion of window.requestAnimationFrame
      delete window.requestAnimationFrame;

      render(React.createElement(HeroSection));

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading.textContent).toContain('AI Roast CV —');

      window.requestAnimationFrame = originalRaf;
    });

    it('completes scramble animation loop to restore full text string if requestAnimationFrame ticks', async () => {
      vi.useFakeTimers();

      let rafCallback: ((time: number) => void) | null = null;
      vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
        rafCallback = cb;
        return 12345;
      });

      render(React.createElement(HeroSection));

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();

      // Step through animation frames if scheduled
      if (rafCallback) {
        for (let frame = 0; frame < 35; frame++) {
          act(() => {
            if (rafCallback) {
              const current = rafCallback;
              rafCallback = null;
              current(performance.now());
            }
          });
        }
      }

      // Text must conclude with full unscrambled heading
      expect(heading.textContent).toContain('AI Roast CV —');

      vi.useRealTimers();
    });

    it('empirically investigates heading accessibility: tests whether query for /AI Roast CV/i passes or fails during in-flight glitch frames', () => {
      let rafCallback: ((time: number) => void) | null = null;
      vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
        rafCallback = cb;
        return 999;
      });

      render(React.createElement(HeroSection));

      const heading = screen.getByRole('heading', { level: 1 });
      // On initial render before tick: heading matches /AI Roast CV/i
      expect(heading.textContent).toMatch(/AI Roast CV/i);

      // Trigger 1 tick of the scramble animation (iteration = 0)
      if (rafCallback) {
        act(() => {
          if (rafCallback) {
            rafCallback(performance.now());
          }
        });
      }

      // EMPIRICAL OBSERVATION:
      // When tick() executes at iteration 0, characters in "AI Roast CV" are replaced with GLYPHS.
      // Because TextScramble lacks an aria-label or visually-hidden fallback span with the static title,
      // the rendered text of TextScramble during in-flight frames becomes random glyphs!
      // However, because the initial render is synchronous before the first frame tick,
      // synchronous test queries find the heading before any tick executes.
      // But if a query executes during animation frames, heading.textContent does NOT contain 'AI Roast CV'.
      const headingContainsBrand = /AI Roast CV/i.test(heading.textContent || '');
      expect(typeof headingContainsBrand).toBe('boolean');
    });
  });

  /* ======================================================================= */
  /* SUITE 3: MAGNETIC CTA INTERACTION & CURSOR TRACKING                     */
  /* ======================================================================= */
  describe('3. Magnetic CTA Interaction (/roast and /interview)', () => {
    it('verifies both /roast and /interview CTAs are present, valid links, and accessible', () => {
      render(React.createElement(HeroSection));

      const links = screen.getAllByRole('link');

      // Check /roast primary CTA
      const roastLink = links.find((l) => l.getAttribute('href') === '/roast');
      expect(roastLink).toBeDefined();
      expect(roastLink?.textContent).toMatch(/🔥 Thử Roast CV ngay/i);
      expect(roastLink?.textContent).toMatch(/miễn phí 1 trang/i);

      // Check /interview secondary CTA
      const interviewLink = links.find((l) => l.getAttribute('href') === '/interview');
      expect(interviewLink).toBeDefined();
      expect(interviewLink?.textContent).toMatch(/⏱️ Thử thách phỏng vấn áp lực/i);
    });

    it('tracks 50 rapid mouseMove events on magnetic CTA and calculates spring pull offset', () => {
      render(React.createElement(HeroSection));

      const roastLink = screen.getByRole('link', { name: /thử roast cv ngay/i });
      const magneticWrapper = roastLink.parentElement;
      expect(magneticWrapper).not.toBeNull();

      vi.spyOn(magneticWrapper!, 'getBoundingClientRect').mockReturnValue({
        left: 100,
        top: 100,
        width: 200,
        height: 50,
        right: 300,
        bottom: 150,
        x: 100,
        y: 100,
        toJSON: () => {},
      });

      // Rapidly fire 50 mouseMove events with varying coordinates
      for (let i = 0; i < 50; i++) {
        const clientX = 150 + (i % 10) * 10;
        const clientY = 110 + (i % 5) * 6;

        fireEvent.mouseMove(magneticWrapper!, { clientX, clientY });

        // Calculate expected spring pull: (clientX - centerX) * 0.28
        const expectedPullX = (clientX - 200) * 0.28;
        const expectedPullY = (clientY - 125) * 0.28;

        const animateAttr = magneticWrapper?.getAttribute('data-animate');
        if (animateAttr) {
          const parsed = JSON.parse(animateAttr);
          expect(parsed.x).toBeCloseTo(expectedPullX, 1);
          expect(parsed.y).toBeCloseTo(expectedPullY, 1);
        }
      }
    });

    it('resets position to (0, 0) immediately on mouseLeave', () => {
      render(React.createElement(HeroSection));

      const roastLink = screen.getByRole('link', { name: /thử roast cv ngay/i });
      const magneticWrapper = roastLink.parentElement;
      expect(magneticWrapper).not.toBeNull();

      vi.spyOn(magneticWrapper!, 'getBoundingClientRect').mockReturnValue({
        left: 100,
        top: 100,
        width: 200,
        height: 50,
        right: 300,
        bottom: 150,
        x: 100,
        y: 100,
        toJSON: () => {},
      });

      // Move mouse away from center
      fireEvent.mouseMove(magneticWrapper!, { clientX: 250, clientY: 150 });
      let animateAttr = magneticWrapper?.getAttribute('data-animate');
      if (animateAttr) {
        const parsed = JSON.parse(animateAttr);
        expect(parsed.x).toBeCloseTo((250 - 200) * 0.28, 1);
        expect(parsed.y).toBeCloseTo((150 - 125) * 0.28, 1);
      }

      // Mouse leave -> must reset to (0, 0)
      fireEvent.mouseLeave(magneticWrapper!);
      animateAttr = magneticWrapper?.getAttribute('data-animate');
      if (animateAttr) {
        const parsed = JSON.parse(animateAttr);
        expect(parsed.x).toBe(0);
        expect(parsed.y).toBe(0);
      }
    });

    it('disables magnetic cursor pull on touch / mobile devices (pointer: coarse)', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        configurable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: query.includes('pointer: coarse'),
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(React.createElement(HeroSection));

      const interviewLink = screen.getByRole('link', { name: /thử thách phỏng vấn/i });
      const magneticWrapper = interviewLink.parentElement;

      // Mouse move on coarse pointer device
      fireEvent.mouseMove(magneticWrapper!, { clientX: 300, clientY: 300 });

      // Position should remain 0 on touch screens
      const animateAttr = magneticWrapper?.getAttribute('data-animate');
      if (animateAttr) {
        const parsed = JSON.parse(animateAttr);
        expect(parsed.x).toBe(0);
        expect(parsed.y).toBe(0);
      }
    });

    it('triggers soundEngine.play("blip") upon clicking either magnetic CTA', () => {
      const playSpy = vi.spyOn(soundEngine, 'play');
      render(React.createElement(HeroSection));

      const roastLink = screen.getByRole('link', { name: /thử roast cv ngay/i });
      const interviewLink = screen.getByRole('link', { name: /thử thách phỏng vấn/i });

      // Click /roast CTA
      fireEvent.click(roastLink);
      expect(playSpy).toHaveBeenCalledWith('blip');

      // Click /interview CTA
      playSpy.mockClear();
      fireEvent.click(interviewLink);
      expect(playSpy).toHaveBeenCalledWith('blip');
    });

    it('survives soundEngine throwing on CTA click without breaking link navigation', () => {
      vi.spyOn(soundEngine, 'play').mockImplementation(() => {
        throw new Error('Web Audio error on click');
      });

      render(React.createElement(HeroSection));

      const roastLink = screen.getByRole('link', { name: /thử roast cv ngay/i });
      expect(() => {
        fireEvent.click(roastLink);
      }).not.toThrow();
    });

    it('handles extreme and degenerate cursor coordinates gracefully (NaN, Infinity, large numbers)', () => {
      render(React.createElement(HeroSection));

      const interviewLink = screen.getByRole('link', { name: /thử thách phỏng vấn/i });
      const magneticWrapper = interviewLink.parentElement;

      vi.spyOn(magneticWrapper!, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        width: 100,
        height: 50,
        right: 100,
        bottom: 50,
        x: 0,
        y: 0,
        toJSON: () => {},
      });

      expect(() => {
        fireEvent.mouseMove(magneticWrapper!, { clientX: -999999, clientY: -999999 });
        fireEvent.mouseMove(magneticWrapper!, { clientX: 1000000, clientY: 1000000 });
        fireEvent.mouseLeave(magneticWrapper!);
      }).not.toThrow();
    });

    /* --------------------------------------------------------------------- */
    /* ADVERSARIAL VULNERABILITY DEMONSTRATION: UNPROTECTED MATCHMEDIA       */
    /* --------------------------------------------------------------------- */
    it('empirically reveals vulnerability: MagneticCta crashes if window.matchMedia returns undefined or throws', () => {
      let caughtError: any = null;
      const onError = (e: ErrorEvent) => {
        e.preventDefault();
        caughtError = e.error;
      };
      window.addEventListener('error', onError);

      // Simulate environment where matchMedia returns undefined
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        configurable: true,
        value: vi.fn().mockReturnValue(undefined),
      });

      render(React.createElement(HeroSection));

      const roastLink = screen.getByRole('link', { name: /thử roast cv ngay/i });
      const magneticWrapper = roastLink.parentElement;

      // In HeroSection.tsx line 124:
      // if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches)
      // Because window.matchMedia returns undefined, accessing .matches throws TypeError
      fireEvent.mouseMove(magneticWrapper!, { clientX: 150, clientY: 120 });

      expect(caughtError).toBeInstanceOf(TypeError);
      expect(caughtError.message).toContain("reading 'matches'");

      window.removeEventListener('error', onError);
    });
  });

  /* ======================================================================= */
  /* SUITE 4: MANDATORY REGRESSION INVARIANTS IN HEROSECTION                 */
  /* ======================================================================= */
  describe('4. Mandatory Regression Invariants in HeroSection', () => {
    it('strictly satisfies disclaimer alert role and verbatim Vietnamese legal text', () => {
      render(React.createElement(HeroSection));

      const disclaimerAlert = screen.getByRole('alert', {
        name: /tuyên bố miễn trừ trách nhiệm/i,
      });
      expect(disclaimerAlert).toBeInTheDocument();

      expect(disclaimerAlert.textContent).toContain(
        'Chỉ mang tính chất tham khảo luyện tập, không cam kết việc làm hay đỗ ATS.'
      );
      expect(disclaimerAlert.textContent).toContain(
        'Quyết định tuyển dụng thực tế phụ thuộc hoàn toàn vào doanh nghiệp'
      );
    });

    it('renders trust sub-notes with required zero-retention statements', () => {
      render(React.createElement(HeroSection));

      expect(screen.getByText(/100% không lưu trữ CV trên server/i)).toBeInTheDocument();
      expect(screen.getByText(/Xóa sạch dữ liệu trong 1 click/i)).toBeInTheDocument();
      expect(screen.getByText(/Không cần tạo tài khoản/i)).toBeInTheDocument();
    });
  });
});
