/**
 * WebGL Detection Utility (AI Roast CV V2.0 - Milestone 2)
 * Safely evaluates WebGL support across SSR, Node/JSDOM, headless CI, and browser environments.
 */
export function isWebGLSupported(): boolean {
  if (typeof window === 'undefined') return false;
  if (!('WebGLRenderingContext' in window) || !window.WebGLRenderingContext) {
    return false;
  }
  try {
    const canvas = document.createElement('canvas');
    if (!canvas || typeof canvas.getContext !== 'function') {
      return false;
    }
    const gl =
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');

    return Boolean(
      gl &&
        (gl instanceof window.WebGLRenderingContext ||
          typeof (gl as WebGLRenderingContext).createShader === 'function')
    );
  } catch {
    return false;
  }
}
