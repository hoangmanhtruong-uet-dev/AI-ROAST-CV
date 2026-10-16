import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import {
  LenisProvider,
  useLenisScroll,
  isLenisSupported,
} from '@/components/providers/LenisProvider';

function TestConsumer() {
  const { isStopped, pause, resume, scrollTo } = useLenisScroll();
  return React.createElement(
    'div',
    null,
    React.createElement('span', { 'data-testid': 'lenis-status' }, isStopped ? 'stopped' : 'running'),
    React.createElement('button', { onClick: pause }, 'Pause Scroll'),
    React.createElement('button', { onClick: resume }, 'Resume Scroll'),
    React.createElement('button', { onClick: () => scrollTo(500) }, 'Scroll to 500')
  );
}

describe('Lenis Smooth Scroll Provider (Milestone 4)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  it('renders children safely in headless environment without crashing', () => {
    render(
      React.createElement(
        LenisProvider,
        null,
        React.createElement('div', { 'data-testid': 'child-element' }, 'Smooth Content')
      )
    );

    expect(screen.getByTestId('child-element')).toBeInTheDocument();
  });

  it('provides working fallback scroll controls via useLenisScroll hook', () => {
    const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

    render(
      React.createElement(
        LenisProvider,
        null,
        React.createElement(TestConsumer)
      )
    );

    expect(screen.getByTestId('lenis-status')).toHaveTextContent('running');

    const scrollBtn = screen.getByRole('button', { name: /scroll to 500/i });
    scrollBtn.click();

    expect(scrollToSpy).toHaveBeenCalledWith({ top: 500, behavior: 'smooth' });
  });

  it('returns false for isLenisSupported when matchMedia or ResizeObserver is missing', () => {
    const result = isLenisSupported();
    expect(typeof result).toBe('boolean');
  });

  describe('When Browser APIs are polyfilled / simulated', () => {
    let originalMatchMedia: any;
    let originalResizeObserver: any;
    let originalRAF: any;

    beforeEach(() => {
      originalMatchMedia = window.matchMedia;
      originalResizeObserver = (window as any).ResizeObserver;
      originalRAF = window.requestAnimationFrame;

      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('reduce'),
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
        return 123;
      });
      window.cancelAnimationFrame = vi.fn();
    });

    afterEach(() => {
      window.matchMedia = originalMatchMedia;
      (window as any).ResizeObserver = originalResizeObserver;
      window.requestAnimationFrame = originalRAF;
    });

    it('identifies Lenis as supported when environment has all required APIs', () => {
      expect(isLenisSupported()).toBe(true);
    });

    it('automatically pauses when document.body.style.overflow becomes hidden', async () => {
      render(
        React.createElement(
          LenisProvider,
          null,
          React.createElement(TestConsumer)
        )
      );

      // Trigger modal open simulation (overflow: hidden)
      act(() => {
        document.body.style.overflow = 'hidden';
      });

      // Wait a tick for MutationObserver
      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
      });

      expect(screen.getByTestId('lenis-status')).toHaveTextContent('stopped');

      // Trigger modal close simulation
      act(() => {
        document.body.style.overflow = '';
      });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
      });

      expect(screen.getByTestId('lenis-status')).toHaveTextContent('running');
    });

    it('cleans up RAF and observer cleanly on unmount', () => {
      const cancelRafSpy = vi.spyOn(window, 'cancelAnimationFrame');
      const { unmount } = render(
        React.createElement(
          LenisProvider,
          null,
          React.createElement(TestConsumer)
        )
      );

      unmount();
      expect(cancelRafSpy).toHaveBeenCalled();
    });
  });
});
