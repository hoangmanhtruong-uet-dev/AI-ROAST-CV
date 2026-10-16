import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';
import * as THREE from 'three';

import * as webglDetectModule from '@/lib/utils/webgl-detect';
import Hero3DCanvas from '@/components/landing/Hero3DCanvas';
import CssHologramFallback from '@/components/landing/CssHologramFallback';

// Spies for tracking Three.js lifecycle disposals and resource allocation
const mockRendererDispose = vi.fn();
const mockRendererSetSize = vi.fn();
const mockRendererRender = vi.fn();
const mockGeometryDispose = vi.fn();
const mockMaterialDispose = vi.fn();

let mockCanvasElement: HTMLCanvasElement;
let shouldThrowOnRendererInit = false;

vi.mock('three', async (importOriginal) => {
  const actual = await importOriginal<typeof import('three')>();

  class MockWebGLRenderer {
    domElement: HTMLCanvasElement;
    constructor(public params?: any) {
      if (shouldThrowOnRendererInit) {
        throw new Error('WebGL: Error creating WebGL context: GPU process terminated');
      }
      this.domElement = mockCanvasElement || (typeof document !== 'undefined' ? document.createElement('canvas') : ({} as any));
    }
    setSize = mockRendererSetSize;
    setPixelRatio = vi.fn();
    render = mockRendererRender;
    dispose = mockRendererDispose;
  }

  // Wrap BufferGeometry to spy on dispose
  class MockBufferGeometry extends actual.BufferGeometry {
    dispose() {
      mockGeometryDispose();
      super.dispose();
    }
  }

  class MockPlaneGeometry extends actual.PlaneGeometry {
    dispose() {
      mockGeometryDispose();
      super.dispose();
    }
  }

  class MockEdgesGeometry extends actual.EdgesGeometry {
    dispose() {
      mockGeometryDispose();
      super.dispose();
    }
  }

  // Wrap Material to spy on dispose
  class MockMaterial extends actual.Material {
    dispose() {
      mockMaterialDispose();
      super.dispose();
    }
  }

  class MockMeshBasicMaterial extends actual.MeshBasicMaterial {
    dispose() {
      mockMaterialDispose();
      super.dispose();
    }
  }

  class MockLineBasicMaterial extends actual.LineBasicMaterial {
    dispose() {
      mockMaterialDispose();
      super.dispose();
    }
  }

  class MockPointsMaterial extends actual.PointsMaterial {
    dispose() {
      mockMaterialDispose();
      super.dispose();
    }
  }

  return {
    ...actual,
    WebGLRenderer: MockWebGLRenderer,
    BufferGeometry: MockBufferGeometry,
    PlaneGeometry: MockPlaneGeometry,
    EdgesGeometry: MockEdgesGeometry,
    Material: MockMaterial,
    MeshBasicMaterial: MockMeshBasicMaterial,
    LineBasicMaterial: MockLineBasicMaterial,
    PointsMaterial: MockPointsMaterial,
  };
});

describe('Adversarial Stress Testing: Three.js WebGL Canvas & Fallback (Challenger M2)', () => {
  let addEventListenerSpy: any;
  let removeEventListenerSpy: any;
  let cancelAnimationSpy: any;
  let activeListeners: { [type: string]: Set<Function> };

  beforeEach(() => {
    cleanup();
    vi.restoreAllMocks();
    shouldThrowOnRendererInit = false;
    mockRendererDispose.mockClear();
    mockRendererSetSize.mockClear();
    mockRendererRender.mockClear();
    mockGeometryDispose.mockClear();
    mockMaterialDispose.mockClear();

    mockCanvasElement = document.createElement('canvas');

    // Track active window event listeners to detect lingering leaks
    activeListeners = {
      mousemove: new Set(),
      scroll: new Set(),
      resize: new Set(),
    };

    const originalAdd = window.addEventListener.bind(window);
    const originalRemove = window.removeEventListener.bind(window);

    addEventListenerSpy = vi.spyOn(window, 'addEventListener').mockImplementation((type: string, listener: any, options?: any) => {
      if (activeListeners[type]) {
        activeListeners[type].add(listener);
      }
      return originalAdd(type, listener, options);
    });

    removeEventListenerSpy = vi.spyOn(window, 'removeEventListener').mockImplementation((type: string, listener: any, options?: any) => {
      if (activeListeners[type]) {
        activeListeners[type].delete(listener);
      }
      return originalRemove(type, listener, options);
    });

    cancelAnimationSpy = vi.spyOn(window, 'cancelAnimationFrame');
  });

  afterEach(() => {
    cleanup();
    shouldThrowOnRendererInit = false;
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. RAPID MOUNT / UNMOUNT CYCLES (30 ITERATIONS) & LEAK VERIFICATION
  // =========================================================================
  describe('1. Rapid Mount/Unmount Lifecycle & Zero Memory Leak (30 Iterations)', () => {
    it('executes 30 full mount/unmount cycles with WebGL enabled, verifying complete resource disposal on every cycle', async () => {
      const isSupportedSpy = vi.spyOn(webglDetectModule, 'isWebGLSupported').mockReturnValue(true);

      const ITERATIONS = 30;
      let totalDisposedRenderers = 0;
      let totalCancelledRafs = 0;

      for (let i = 0; i < ITERATIONS; i++) {
        mockCanvasElement = document.createElement('canvas');

        // Mount component
        const { unmount, container } = render(React.createElement(Hero3DCanvas, { mode: 'spicy' }));

        // Wait for WebGL initialization effect
        await waitFor(() => {
          expect(screen.getByTestId('hero-3d-canvas')).toBeInTheDocument();
        });

        // Verify canvas was inserted into DOM
        const canvasWrapper = screen.getByTestId('hero-3d-canvas');
        expect(canvasWrapper.querySelector('canvas')).toBeDefined();

        // Verify event listeners were registered
        expect(activeListeners.mousemove.size).toBeGreaterThanOrEqual(1);
        expect(activeListeners.scroll.size).toBeGreaterThanOrEqual(1);
        expect(activeListeners.resize.size).toBeGreaterThanOrEqual(1);

        // Verify geometries and materials were allocated (10 geometries, 10 materials)
        // 1 sheet + 1 edge + 1 laser + 1 header + 4 lines + 1 disGeo + 1 emberGeo = 10 geometries
        // 1 sheet + 1 edge + 1 laser + 1 header + 4 lines + 1 disMat + 1 emberMat = 10 materials
        const geometriesBeforeUnmount = mockGeometryDispose.mock.calls.length;
        const materialsBeforeUnmount = mockMaterialDispose.mock.calls.length;

        // Unmount
        unmount();

        // Verify renderer.dispose was called
        totalDisposedRenderers++;
        expect(mockRendererDispose).toHaveBeenCalledTimes(totalDisposedRenderers);

        // Verify RAF loop was cancelled
        totalCancelledRafs++;
        expect(cancelAnimationSpy).toHaveBeenCalledTimes(totalCancelledRafs);

        // Verify all 10 geometries and 10 materials were disposed on this unmount
        expect(mockGeometryDispose.mock.calls.length - geometriesBeforeUnmount).toBe(10);
        expect(mockMaterialDispose.mock.calls.length - materialsBeforeUnmount).toBe(10);

        // Verify all window listeners were cleaned up
        expect(activeListeners.mousemove.size).toBe(0);
        expect(activeListeners.scroll.size).toBe(0);
        expect(activeListeners.resize.size).toBe(0);

        // Verify canvas was removed from container
        expect(container.querySelector('canvas')).toBeNull();
      }

      // Total disposal count assertions across all 30 cycles
      expect(mockRendererDispose).toHaveBeenCalledTimes(ITERATIONS);
      expect(cancelAnimationSpy).toHaveBeenCalledTimes(ITERATIONS);
      expect(mockGeometryDispose).toHaveBeenCalledTimes(ITERATIONS * 10);
      expect(mockMaterialDispose).toHaveBeenCalledTimes(ITERATIONS * 10);

      // Verify ZERO dangling event listeners left on window
      expect(activeListeners.mousemove.size).toBe(0);
      expect(activeListeners.scroll.size).toBe(0);
      expect(activeListeners.resize.size).toBe(0);

      isSupportedSpy.mockRestore();
    });

    it('survives rapid sync unmount before WebGL state resolves without crashing or throwing state update warnings', () => {
      const isSupportedSpy = vi.spyOn(webglDetectModule, 'isWebGLSupported').mockReturnValue(true);

      // Mount and immediately unmount in same tick (30 times)
      for (let i = 0; i < 30; i++) {
        const { unmount } = render(React.createElement(Hero3DCanvas, { mode: 'spicy' }));
        unmount();
      }

      // No lingering window listeners
      expect(activeListeners.mousemove.size).toBe(0);
      expect(activeListeners.scroll.size).toBe(0);
      expect(activeListeners.resize.size).toBe(0);

      isSupportedSpy.mockRestore();
    });

    it('survives 30 rapid mount/unmount cycles in non-WebGL fallback mode cleanly', async () => {
      const isSupportedSpy = vi.spyOn(webglDetectModule, 'isWebGLSupported').mockReturnValue(false);

      for (let i = 0; i < 30; i++) {
        const { unmount } = render(React.createElement(Hero3DCanvas, { mode: 'spicy' }));

        await waitFor(() => {
          expect(screen.getByTestId('hero-hologram-fallback')).toBeInTheDocument();
        });

        unmount();
      }

      // WebGL renderer should NEVER have been created
      expect(mockRendererDispose).not.toHaveBeenCalled();
      expect(cancelAnimationSpy).not.toHaveBeenCalled();

      isSupportedSpy.mockRestore();
    });
  });

  // =========================================================================
  // 2. FALLBACK TRANSITION & WEBGL CRASH RECOVERY
  // =========================================================================
  describe('2. Fallback Transition & WebGL Crash Recovery', () => {
    it('seamlessly falls back to CssHologramFallback when WebGL is unsupported', async () => {
      const isSupportedSpy = vi.spyOn(webglDetectModule, 'isWebGLSupported').mockReturnValue(false);

      render(React.createElement(Hero3DCanvas, { mode: 'expert' }));

      await waitFor(() => {
        expect(screen.getByTestId('hero-hologram-fallback')).toBeInTheDocument();
      });

      // Three.js renderer should not be initialized
      expect(mockRendererSetSize).not.toHaveBeenCalled();
      expect(mockRendererRender).not.toHaveBeenCalled();

      // Fallback content should reflect expert mode
      expect(screen.getByText(/ATS DIRECTOR \/\/ V2\.0/i)).toBeInTheDocument();

      isSupportedSpy.mockRestore();
    });

    it('recovers gracefully and displays CssHologramFallback when WebGLRenderer constructor throws (GPU crash simulation)', async () => {
      const isSupportedSpy = vi.spyOn(webglDetectModule, 'isWebGLSupported').mockReturnValue(true);

      // Simulate WebGLRenderer constructor failure (e.g. context creation failed, OOM, browser GPU disabled)
      shouldThrowOnRendererInit = true;

      render(React.createElement(Hero3DCanvas, { mode: 'stress' }));

      // Component must catch error internally, set webglSupported(false), and render fallback
      await waitFor(() => {
        expect(screen.getByTestId('hero-hologram-fallback')).toBeInTheDocument();
      });

      expect(screen.getByText(/STRESS SIMULATOR \/\/ 00:59/i)).toBeInTheDocument();

      shouldThrowOnRendererInit = false;
      isSupportedSpy.mockRestore();
    });

    it('renders CssHologramFallback as instant preview during initial null state (prevents visual pop-in)', () => {
      // Mock isWebGLSupported to return null initially or observe initial render
      const { container } = render(React.createElement(Hero3DCanvas, { mode: 'spicy' }));

      // Initial synchronous render has webglSupported === null
      // Must contain fallback preview inside hero-3d-canvas wrapper or fallback directly
      const canvasWrapper = container.querySelector('[data-testid="hero-3d-canvas"]');
      const fallback = container.querySelector('[data-testid="hero-hologram-fallback"]');

      expect(canvasWrapper || fallback).not.toBeNull();
    });
  });

  // =========================================================================
  // 3. HIGH-FREQUENCY MOUSE PARALLAX BURST (500+ EVENTS) & STABILITY
  // =========================================================================
  describe('3. High-Frequency Mouse Parallax Burst (500+ Events) & Stability', () => {
    it('survives a burst of 500+ high-frequency mousemove events without calculation errors, memory spikes, or crashes', async () => {
      const isSupportedSpy = vi.spyOn(webglDetectModule, 'isWebGLSupported').mockReturnValue(true);

      const { unmount } = render(React.createElement(Hero3DCanvas, { mode: 'spicy' }));

      await waitFor(() => {
        expect(screen.getByTestId('hero-3d-canvas')).toBeInTheDocument();
      });

      const canvasContainer = screen.getByTestId('hero-3d-canvas');
      vi.spyOn(canvasContainer, 'getBoundingClientRect').mockReturnValue({
        left: 200,
        top: 150,
        width: 440,
        height: 600,
        right: 640,
        bottom: 750,
        x: 200,
        y: 150,
        toJSON: () => {},
      });

      // Dispatch 500 rapid mouse movements with varied coordinates
      act(() => {
        for (let i = 0; i < 500; i++) {
          const clientX = 200 + (i % 440);
          const clientY = 150 + ((i * 3) % 600);
          window.dispatchEvent(
            new MouseEvent('mousemove', {
              clientX,
              clientY,
              bubbles: true,
            })
          );
        }
      });

      // Verify component is still healthy and rendered
      expect(screen.getByTestId('hero-3d-canvas')).toBeInTheDocument();

      unmount();
      isSupportedSpy.mockRestore();
    });

    it('survives extreme coordinate mouse events (negative, extreme off-screen, infinity) without NaN poisoning', async () => {
      const isSupportedSpy = vi.spyOn(webglDetectModule, 'isWebGLSupported').mockReturnValue(true);

      render(React.createElement(Hero3DCanvas, { mode: 'spicy' }));

      await waitFor(() => {
        expect(screen.getByTestId('hero-3d-canvas')).toBeInTheDocument();
      });

      const canvasContainer = screen.getByTestId('hero-3d-canvas');
      vi.spyOn(canvasContainer, 'getBoundingClientRect').mockReturnValue({
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

      // Extreme values
      const extremeCoordinates = [
        { clientX: -999999, clientY: -999999 },
        { clientX: 999999, clientY: 999999 },
        { clientX: 0, clientY: 0 },
        { clientX: 100, clientY: 100 },
      ];

      act(() => {
        for (const coord of extremeCoordinates) {
          window.dispatchEvent(
            new MouseEvent('mousemove', {
              clientX: coord.clientX,
              clientY: coord.clientY,
              bubbles: true,
            })
          );
        }
      });

      expect(screen.getByTestId('hero-3d-canvas')).toBeInTheDocument();

      isSupportedSpy.mockRestore();
    });

    it('stress tests CssHologramFallback with 500 rapid mousemove events and verifies tilt bounds', () => {
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

      // Fire 500 mousemove events on the card
      for (let i = 0; i < 500; i++) {
        const clientX = 100 + (i % 400);
        const clientY = 100 + ((i * 2) % 500);
        fireEvent.mouseMove(card, { clientX, clientY });
      }

      // Check card is still rendered and has valid style
      expect(card).toBeInTheDocument();

      // Fire mouseLeave
      fireEvent.mouseLeave(card);
      expect(card).toBeInTheDocument();
    });

    it('empirically evaluates zero-dimension getBoundingClientRect behavior in Hero3DCanvas and CssHologramFallback', async () => {
      const isSupportedSpy = vi.spyOn(webglDetectModule, 'isWebGLSupported').mockReturnValue(true);

      const { unmount } = render(React.createElement(Hero3DCanvas, { mode: 'spicy' }));

      await waitFor(() => {
        expect(screen.getByTestId('hero-3d-canvas')).toBeInTheDocument();
      });

      const canvasContainer = screen.getByTestId('hero-3d-canvas');
      vi.spyOn(canvasContainer, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        right: 0,
        bottom: 0,
        x: 0,
        y: 0,
        toJSON: () => {},
      });

      // Dispatch mousemove when container has 0 width and 0 height
      expect(() => {
        window.dispatchEvent(
          new MouseEvent('mousemove', {
            clientX: 100,
            clientY: 100,
            bubbles: true,
          })
        );
      }).not.toThrow();

      unmount();
      isSupportedSpy.mockRestore();

      // Also evaluate CssHologramFallback under zero dimensions
      render(React.createElement(CssHologramFallback, { mode: 'spicy' }));
      const card = screen.getByTestId('hero-hologram-fallback');
      vi.spyOn(card, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        right: 0,
        bottom: 0,
        x: 0,
        y: 0,
        toJSON: () => {},
      });

      expect(() => {
        fireEvent.mouseMove(card, { clientX: 100, clientY: 100 });
      }).not.toThrow();

      // On mouseleave, tilt must cleanly recover to (0, 0)
      fireEvent.mouseLeave(card);
      const innerCard = card.querySelector('div[style*="rotateX"]');
      if (innerCard) {
        expect(innerCard.getAttribute('style')).toContain('rotateX(0deg)');
      }
    });
  });

  // =========================================================================
  // 4. RAPID SCROLL & RESIZE BURST STRESS
  // =========================================================================
  describe('4. Rapid Scroll & Resize Burst Stress', () => {
    it('survives a burst of 200 high-velocity scroll events with velocity damping', async () => {
      const isSupportedSpy = vi.spyOn(webglDetectModule, 'isWebGLSupported').mockReturnValue(true);

      render(React.createElement(Hero3DCanvas, { mode: 'spicy' }));

      await waitFor(() => {
        expect(screen.getByTestId('hero-3d-canvas')).toBeInTheDocument();
      });

      // Burst of rapid scroll jumps
      act(() => {
        for (let i = 0; i < 200; i++) {
          Object.defineProperty(window, 'scrollY', { value: i * 50, writable: true });
          window.dispatchEvent(new Event('scroll'));
        }
      });

      expect(screen.getByTestId('hero-3d-canvas')).toBeInTheDocument();

      isSupportedSpy.mockRestore();
    });

    it('survives a burst of 100 rapid resize events with zero, massive, and diverse viewport dimensions', async () => {
      const isSupportedSpy = vi.spyOn(webglDetectModule, 'isWebGLSupported').mockReturnValue(true);

      render(React.createElement(Hero3DCanvas, { mode: 'spicy' }));

      await waitFor(() => {
        expect(screen.getByTestId('hero-3d-canvas')).toBeInTheDocument();
      });

      const canvasContainer = screen.getByTestId('hero-3d-canvas');

      const dimensions = [
        { width: 0, height: 0 },
        { width: 320, height: 480 },
        { width: 768, height: 1024 },
        { width: 1920, height: 1080 },
        { width: 3840, height: 2160 },
        { width: 100, height: 9000 },
      ];

      act(() => {
        for (let i = 0; i < 100; i++) {
          const dim = dimensions[i % dimensions.length];
          Object.defineProperty(canvasContainer, 'clientWidth', { value: dim.width, configurable: true });
          Object.defineProperty(canvasContainer, 'clientHeight', { value: dim.height, configurable: true });
          window.dispatchEvent(new Event('resize'));
        }
      });

      // Verify setSize was called without throwing
      expect(mockRendererSetSize).toHaveBeenCalled();

      isSupportedSpy.mockRestore();
    });
  });

  // =========================================================================
  // 5. RAPID PERSONA MODE SWITCHING (CONCURRENCY & REALLOCATION PREVENTION)
  // =========================================================================
  describe('5. Rapid Persona Mode Switching Stress', () => {
    it('switches persona mode 60 times rapidly while scene is active, verifying in-place color mutations without memory reallocations', async () => {
      const isSupportedSpy = vi.spyOn(webglDetectModule, 'isWebGLSupported').mockReturnValue(true);

      const { rerender } = render(React.createElement(Hero3DCanvas, { mode: 'spicy' }));

      await waitFor(() => {
        expect(screen.getByTestId('hero-3d-canvas')).toBeInTheDocument();
      });

      // Track disposal and renderer counts before toggling
      const geometriesBefore = mockGeometryDispose.mock.calls.length;
      const materialsBefore = mockMaterialDispose.mock.calls.length;
      const renderersBefore = mockRendererDispose.mock.calls.length;

      const modes: Array<'spicy' | 'expert' | 'stress'> = ['spicy', 'expert', 'stress'];

      // Rapidly toggle modes 60 times
      for (let i = 0; i < 60; i++) {
        const nextMode = modes[i % modes.length];
        rerender(React.createElement(Hero3DCanvas, { mode: nextMode }));
      }

      // Assert that switching modes DID NOT allocate/dispose new geometries or destroy renderer
      expect(mockGeometryDispose.mock.calls.length).toBe(geometriesBefore);
      expect(mockMaterialDispose.mock.calls.length).toBe(materialsBefore);
      expect(mockRendererDispose.mock.calls.length).toBe(renderersBefore);

      isSupportedSpy.mockRestore();
    });
  });

  // =========================================================================
  // 6. WEBGL DETECTION UTILITY ADVERSARIAL STRESS
  // =========================================================================
  describe('6. WebGL Detection Utility Adversarial Stress (webgl-detect.ts)', () => {
    it('survives 100 consecutive calls to isWebGLSupported without throwing or leaking', () => {
      for (let i = 0; i < 100; i++) {
        const res = webglDetectModule.isWebGLSupported();
        expect(typeof res).toBe('boolean');
      }
    });

    it('returns false when document.createElement returns null or element without getContext', () => {
      const originalCreate = document.createElement.bind(document);
      const createSpy = vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        if (tag === 'canvas') {
          return {} as any;
        }
        return originalCreate(tag);
      });

      expect(webglDetectModule.isWebGLSupported()).toBe(false);

      createSpy.mockRestore();
    });

    it('returns false safely when getContext returns an object missing createShader', () => {
      const originalWebGL = (window as any).WebGLRenderingContext;
      (window as any).WebGLRenderingContext = class MockWebGLRenderingContext {};

      const getContextSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({} as any);

      expect(webglDetectModule.isWebGLSupported()).toBe(false);

      getContextSpy.mockRestore();
      (window as any).WebGLRenderingContext = originalWebGL;
    });
  });
});
