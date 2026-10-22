'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useMemo } from 'react';
import Lenis, { LenisOptions } from 'lenis';

export interface LenisContextValue {
  lenis: Lenis | null;
  isStopped: boolean;
  pause: () => void;
  resume: () => void;
  scrollTo: (
    target: number | string | HTMLElement,
    options?: { offset?: number; immediate?: boolean }
  ) => void;
}

const LenisContext = createContext<LenisContextValue>({
  lenis: null,
  isStopped: false,
  pause: () => {},
  resume: () => {},
  scrollTo: () => {},
});

export function useLenisScroll() {
  return useContext(LenisContext);
}

const DEFAULT_LENIS_OPTIONS: Partial<LenisOptions> = {};

export interface LenisProviderProps {
  children?: React.ReactNode;
  options?: Partial<LenisOptions>;
  disabled?: boolean;
}

export function isLenisSupported(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  if (typeof window.matchMedia !== 'function') return false;
  if (typeof window.requestAnimationFrame !== 'function') return false;
  if (typeof window.ResizeObserver === 'undefined' && typeof ResizeObserver === 'undefined') return false;
  return true;
}

export function LenisProvider({
  children,
  options = DEFAULT_LENIS_OPTIONS,
  disabled = false,
}: LenisProviderProps) {
  const [lenisInstance, setLenisInstance] = useState<Lenis | null>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const [isStopped, setIsStopped] = useState(false);

  useEffect(() => {
    if (disabled || !isLenisSupported()) {
      setLenisInstance(null);
      lenisRef.current = null;
      return;
    }

    let instance: Lenis | null = null;
    let rafId: number | null = null;
    let observer: MutationObserver | null = null;

    try {
      const prefersReducedMotion =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      instance = new Lenis({
        duration: prefersReducedMotion ? 0.1 : 0.7,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: !prefersReducedMotion,
        syncTouch: false,
        autoRaf: false,
        autoToggle: true,
        respectReducedMotion: true,
        prevent: (node: HTMLElement) => {
          return Boolean(
            node?.hasAttribute?.('data-lenis-prevent') ||
            node?.closest?.('[data-lenis-prevent]') ||
            node?.closest?.('[role="dialog"]')
          );
        },
        ...options,
      });

      lenisRef.current = instance;
      setLenisInstance(instance);

      // Custom RAF loop
      const raf = (time: number) => {
        if (instance && !instance.isStopped) {
          instance.raf(time);
        }
        rafId = requestAnimationFrame(raf);
      };
      rafId = requestAnimationFrame(raf);

      // Automated Body Overflow / Modal Detection:
      // When any modal opens, Dialog sets `document.body.style.overflow = 'hidden'`.
      // We observe mutations on document.body and pause/resume Lenis automatically!
      if (typeof MutationObserver !== 'undefined') {
        observer = new MutationObserver(() => {
          if (!instance) return;
          const bodyOverflow = document.body.style.overflow;
          const isModalOpen =
            bodyOverflow === 'hidden' || document.querySelector('[role="dialog"]') !== null;

          if (isModalOpen) {
            instance.stop();
            setIsStopped(true);
          } else {
            instance.start();
            setIsStopped(false);
          }
        });

        observer.observe(document.body, {
          attributes: true,
          attributeFilter: ['style', 'class'],
          childList: true,
          subtree: true,
        });
      }
    } catch {
      // Fallback gracefully without throwing in non-standard environments
      lenisRef.current = null;
      setLenisInstance(null);
    }

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (observer) observer.disconnect();
      if (instance) {
        try {
          instance.destroy();
        } catch {}
      }
      lenisRef.current = null;
      setLenisInstance(null);
    };
  }, [disabled, options]);

  const contextValue = useMemo<LenisContextValue>(() => ({
    lenis: lenisInstance,
    isStopped,
    pause: () => {
      const active = lenisInstance || lenisRef.current;
      if (active) {
        active.stop();
        setIsStopped(true);
      }
    },
    resume: () => {
      const active = lenisInstance || lenisRef.current;
      if (active) {
        active.start();
        setIsStopped(false);
      }
    },
    scrollTo: (target, opts) => {
      const active = lenisInstance || lenisRef.current;
      if (active) {
        active.scrollTo(target, opts);
      } else if (typeof window !== 'undefined') {
        if (typeof target === 'number') {
          window.scrollTo({ top: target, behavior: 'smooth' });
        } else if (typeof target === 'string') {
          const el = document.querySelector(target);
          el?.scrollIntoView({ behavior: 'smooth' });
        } else if (target instanceof HTMLElement) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }
    },
  }), [lenisInstance, isStopped]);

  return (
    <LenisContext.Provider value={contextValue}>
      {children}
    </LenisContext.Provider>
  );
}

export default LenisProvider;
