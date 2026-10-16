import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as THREE from 'three';

import * as webglDetectModule from '@/lib/utils/webgl-detect';
import CssHologramFallback from '@/components/landing/CssHologramFallback';
import Hero3DCanvas from '@/components/landing/Hero3DCanvas';
import PersonaSwitcher from '@/components/landing/PersonaSwitcher';
import HeroSection from '@/components/landing/HeroSection';
import { soundEngine } from '@/lib/audio/sound-engine';

// Mock framer-motion for headless/JSDOM stability
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, style, layoutId, ...props }: any) =>
      React.createElement('div', { className, style, ...props }, children),
    span: ({ children, className, style, layoutId, ...props }: any) =>
      React.createElement('span', { className, style, ...props }, children),
    button: ({ children, className, style, layoutId, ...props }: any) =>
      React.createElement('button', { className, style, ...props }, children),
  },
  AnimatePresence: ({ children }: any) => React.createElement(React.Fragment, null, children),
}));

// Shared spies for Three.js WebGLRenderer lifecycle verification
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

describe('Hero 3D Interactive Experience & Persona Switcher (Milestone 2)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockDispose.mockClear();
    mockSetSize.mockClear();
    mockRender.mockClear();
    soundEngine.resetForTesting();
  });

  afterEach(() => {
    soundEngine.resetForTesting();
    vi.restoreAllMocks();
  });

  /* ----------------------------------------------------------------------- */
  /* 1. WebGL Detection Utility                                              */
  /* ----------------------------------------------------------------------- */
  describe('1. WebGL Detection Utility (webgl-detect.ts)', () => {
    it('returns false in standard JSDOM where WebGLRenderingContext is undefined or canvas context returns null', () => {
      const supported = webglDetectModule.isWebGLSupported();
      expect(typeof supported).toBe('boolean');
      expect(supported).toBe(false);
    });

    it('returns true when WebGLRenderingContext is present and canvas.getContext returns valid context', () => {
      const originalWebGL = (window as any).WebGLRenderingContext;
      const fakeContext = {
        createShader: vi.fn(),
        createProgram: vi.fn(),
      };

      class MockWebGLRenderingContext {}
      (window as any).WebGLRenderingContext = MockWebGLRenderingContext;

      const getContextSpy = vi
        .spyOn(HTMLCanvasElement.prototype, 'getContext')
        .mockImplementation((type: string) => {
          if (type === 'webgl' || type === 'experimental-webgl') {
            return fakeContext as unknown as RenderingContext;
          }
          return null;
        });

      expect(webglDetectModule.isWebGLSupported()).toBe(true);

      getContextSpy.mockRestore();
      (window as any).WebGLRenderingContext = originalWebGL;
    });

    it('returns false safely when getContext throws an unexpected error', () => {
      const originalWebGL = (window as any).WebGLRenderingContext;
      (window as any).WebGLRenderingContext = class MockWebGLRenderingContext {};

      const getContextSpy = vi
        .spyOn(HTMLCanvasElement.prototype, 'getContext')
        .mockImplementation(() => {
          throw new Error('GPU process crashed');
        });

      expect(webglDetectModule.isWebGLSupported()).toBe(false);

      getContextSpy.mockRestore();
      (window as any).WebGLRenderingContext = originalWebGL;
    });
  });

  /* ----------------------------------------------------------------------- */
  /* 2. High-Fidelity CSS 3D Hologram Fallback                               */
  /* ----------------------------------------------------------------------- */
  describe('2. CSS 3D Hologram Fallback (CssHologramFallback.tsx)', () => {
    it('renders fallback card with role="img" and accessible label', () => {
      render(React.createElement(CssHologramFallback, { mode: 'spicy' }));

      const card = screen.getByRole('img', {
        name: /mô phỏng cv hologram 3d \(css fallback\)/i,
      });
      expect(card).toBeInTheDocument();
      expect(screen.getByTestId('hero-hologram-fallback')).toBeInTheDocument();
    });

    it('renders HUD header, cliché detection, and ATS transformed content for spicy mode', () => {
      render(React.createElement(CssHologramFallback, { mode: 'spicy' }));

      expect(screen.getByText(/MỎ HỖN ROAST \/\/ V2\.0/i)).toBeInTheDocument();
      expect(screen.getByText(/AI SCANNED/i)).toBeInTheDocument();
      expect(screen.getByText(/Ứng viên Fresher/i)).toBeInTheDocument();
      expect(screen.getByText(/ATS: 88\/100/i)).toBeInTheDocument();

      // Cliché phrase vs ATS emerald transformation
      expect(screen.getByText(/Phát hiện câu chữ sáo rỗng \(Cliché\):/i)).toBeInTheDocument();
      expect(
        screen.getByText(/"Có khả năng làm việc nhóm tốt, chịu áp lực công việc cao\."/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/Viết lại chuẩn ATS \(Action \+ Metric\):/i)).toBeInTheDocument();
      expect(
        screen.getByText(/"Tối ưu 35% thông lượng dữ liệu Redis, giảm p95 latency từ 120ms xuống 45ms\."/i)
      ).toBeInTheDocument();

      // Metric pills
      expect(screen.getByText('Impact')).toBeInTheDocument();
      expect(screen.getByText('92%')).toBeInTheDocument();
      expect(screen.getByText('ATS Keywords')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('Zero Cliché')).toBeInTheDocument();
      expect(screen.getByText('88%')).toBeInTheDocument();
    });

    it('adapts theme labels and text when switching to expert and stress modes', () => {
      const { rerender } = render(React.createElement(CssHologramFallback, { mode: 'expert' }));
      expect(screen.getByText(/ATS DIRECTOR \/\/ V2\.0/i)).toBeInTheDocument();
      expect(screen.getByText(/Triển khai CI\/CD pipeline/i)).toBeInTheDocument();

      rerender(React.createElement(CssHologramFallback, { mode: 'stress' }));
      expect(screen.getByText(/STRESS SIMULATOR \/\/ 00:59/i)).toBeInTheDocument();
      expect(screen.getByText(/Xử lý sự cố downtime production/i)).toBeInTheDocument();
    });

    it('handles mouse movements and mouse leave for 3D tilt calculation without errors', () => {
      render(React.createElement(CssHologramFallback, { mode: 'spicy' }));
      const card = screen.getByTestId('hero-hologram-fallback');

      vi.spyOn(card, 'getBoundingClientRect').mockReturnValue({
        left: 100,
        top: 100,
        width: 400,
        height: 500,
        right: 500,
        bottom: 600,
        x: 100,
        y: 100,
        toJSON: () => {},
      });

      fireEvent.mouseMove(card, { clientX: 150, clientY: 150 });
      fireEvent.mouseMove(card, { clientX: 450, clientY: 550 });
      fireEvent.mouseLeave(card);

      expect(card).toBeInTheDocument();
    });
  });

  /* ----------------------------------------------------------------------- */
  /* 3. Hero3DCanvas Component & Resource Lifecycle                          */
  /* ----------------------------------------------------------------------- */
  describe('3. Hero3DCanvas Component & Three.js Lifecycle', () => {
    it('seamlessly renders CssHologramFallback when WebGL is unsupported (JSDOM default)', async () => {
      render(React.createElement(Hero3DCanvas, { mode: 'spicy' }));

      // In JSDOM, WebGL returns null, so CssHologramFallback is rendered
      await waitFor(() => {
        expect(screen.getByTestId('hero-hologram-fallback')).toBeInTheDocument();
      });
    });

    it('mounts WebGL canvas and cleans up resources on unmount when WebGL is supported', async () => {
      const isSupportedSpy = vi
        .spyOn(webglDetectModule, 'isWebGLSupported')
        .mockReturnValue(true);

      const cancelAnimationSpy = vi.spyOn(window, 'cancelAnimationFrame');

      const { unmount } = render(React.createElement(Hero3DCanvas, { mode: 'spicy' }));

      await waitFor(() => {
        expect(screen.getByTestId('hero-3d-canvas')).toBeInTheDocument();
      });

      expect(mockSetSize).toHaveBeenCalled();

      // Trigger scroll and resize events
      fireEvent.scroll(window);
      fireEvent(window, new Event('resize'));
      fireEvent.mouseMove(window, { clientX: 200, clientY: 200 });

      // Unmount component -> must trigger Three.js cleanup
      unmount();

      expect(mockDispose).toHaveBeenCalled();
      expect(cancelAnimationSpy).toHaveBeenCalled();

      isSupportedSpy.mockRestore();
      cancelAnimationSpy.mockRestore();
    });
  });

  /* ----------------------------------------------------------------------- */
  /* 4. Interactive Persona Switcher                                         */
  /* ----------------------------------------------------------------------- */
  describe('4. Interactive Persona Switcher (PersonaSwitcher.tsx)', () => {
    it('renders 3 mode tabs with accessible tablist role', () => {
      const handleModeChange = vi.fn();
      render(
        React.createElement(PersonaSwitcher, {
          currentMode: 'spicy',
          onModeChange: handleModeChange,
        })
      );

      const tablist = screen.getByRole('tablist', {
        name: /chọn chế độ trải nghiệm ai roast cv/i,
      });
      expect(tablist).toBeInTheDocument();

      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(3);

      expect(tabs[0]).toHaveTextContent(/🔥 Chế độ Mỏ Hỗn/i);
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true');

      expect(tabs[1]).toHaveTextContent(/🧊 Chế độ Chuyên Gia/i);
      expect(tabs[1]).toHaveAttribute('aria-selected', 'false');

      expect(tabs[2]).toHaveTextContent(/⚡ Áp Lực Phòng Thi/i);
      expect(tabs[2]).toHaveAttribute('aria-selected', 'false');
    });

    it('triggers sound cues and onModeChange callback when clicking different modes', async () => {
      const user = userEvent.setup();
      const handleModeChange = vi.fn();

      const playSpy = vi.spyOn(soundEngine, 'play');
      const playLaserSpy = vi.spyOn(soundEngine, 'playLaser');
      const playHeartbeatSpy = vi.spyOn(soundEngine, 'playHeartbeat');

      render(
        React.createElement(PersonaSwitcher, {
          currentMode: 'spicy',
          onModeChange: handleModeChange,
        })
      );

      const tabs = screen.getAllByRole('tab');

      // Click "Chế độ Chuyên Gia"
      await user.click(tabs[1]);
      expect(handleModeChange).toHaveBeenCalledWith('expert');
      expect(playSpy).toHaveBeenCalledWith('blip');
      expect(playLaserSpy).toHaveBeenCalled();

      // Click "Áp Lực Phòng Thi"
      await user.click(tabs[2]);
      expect(handleModeChange).toHaveBeenCalledWith('stress');
      expect(playHeartbeatSpy).toHaveBeenCalled();

      // Click already active tab ("spicy" in initial props) -> should not trigger callback
      handleModeChange.mockClear();
      await user.click(tabs[0]);
      expect(handleModeChange).not.toHaveBeenCalled();
    });
  });

  /* ----------------------------------------------------------------------- */
  /* 5. Refactored HeroSection Regression & Invariants                       */
  /* ----------------------------------------------------------------------- */
  describe('5. HeroSection Refactoring & Invariants', () => {
    it('renders <h1> containing "AI Roast CV" and value proposition', () => {
      render(React.createElement(HeroSection));

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent(/AI Roast CV/i);
      expect(heading).toHaveTextContent(/Mổ xẻ CV & Phỏng vấn áp lực/i);
      expect(heading).toHaveTextContent(/CV của bạn có đủ sức sống sót trước nhà tuyển dụng khó tính\?/i);
    });

    it('satisfies mandatory AI limitation disclaimer invariant with exact copy', () => {
      render(React.createElement(HeroSection));

      const alertContainer = screen.getByRole('alert', {
        name: /tuyên bố miễn trừ trách nhiệm/i,
      });
      expect(alertContainer).toBeInTheDocument();

      const expectedDisclaimer =
        'Chỉ mang tính chất tham khảo luyện tập, không cam kết việc làm hay đỗ ATS.';
      const expectedNotice =
        'Quyết định tuyển dụng thực tế phụ thuộc hoàn toàn vào doanh nghiệp';

      expect(alertContainer.textContent).toContain(expectedDisclaimer);
      expect(alertContainer.textContent).toContain(expectedNotice);
    });

    it('renders 2 Magnetic CTA buttons with required target hrefs and regex-compliant text', () => {
      render(React.createElement(HeroSection));

      const allLinks = screen.getAllByRole('link');

      // Check /roast CTA
      const roastCta = allLinks.find((l) => l.getAttribute('href') === '/roast');
      expect(roastCta).toBeDefined();
      expect(roastCta?.textContent).toMatch(/roast cv/i);

      // Check /interview CTA
      const interviewCta = allLinks.find((l) => l.getAttribute('href') === '/interview');
      expect(interviewCta).toBeDefined();
      expect(interviewCta?.textContent).toMatch(/phỏng vấn áp lực|thử thách phỏng vấn/i);
    });

    it('integrates PersonaSwitcher and toggles mode without crashing', async () => {
      const user = userEvent.setup();
      render(React.createElement(HeroSection));

      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(3);

      // Switch to expert mode
      await user.click(tabs[1]);
      expect(tabs[1]).toHaveAttribute('aria-selected', 'true');

      // Switch to stress mode
      await user.click(tabs[2]);
      expect(tabs[2]).toHaveAttribute('aria-selected', 'true');
    });

    it('magnetic CTA triggers sound on click and tracks mouse move', () => {
      const playSpy = vi.spyOn(soundEngine, 'play');
      render(React.createElement(HeroSection));

      const roastLink = screen.getByRole('link', { name: /thử roast cv ngay/i });
      fireEvent.mouseMove(roastLink, { clientX: 120, clientY: 150 });
      fireEvent.mouseLeave(roastLink);
      fireEvent.click(roastLink);

      expect(playSpy).toHaveBeenCalledWith('blip');
    });
  });
});
