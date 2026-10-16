import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  wipeAllSessionData,
  STORAGE_KEYS_TO_CLEAR,
  WIPE_DATA_EVENT_NAME,
} from '@/lib/storage/wipe-data';

describe('Milestone 4: Wipe Data Utility (Feature 23 & §R4)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  describe('1. Purging localStorage and sessionStorage', () => {
    it('clears all known AI Roast CV keys from localStorage', () => {
      // Pre-populate storage
      localStorage.setItem('airoastcv_recent_cv', 'Văn bản CV mẫu...');
      localStorage.setItem('airoastcv_roast_result', JSON.stringify({ score: 75 }));
      localStorage.setItem('airoastcv_interview_state', JSON.stringify({ step: 2 }));
      localStorage.setItem('airoastcv_selected_tone', 'spicy');
      localStorage.setItem('airoastcv_role', 'it');

      expect(localStorage.length).toBe(5);

      const result = wipeAllSessionData();

      expect(result.success).toBe(true);
      expect(localStorage.length).toBe(0);
      expect(localStorage.getItem('airoastcv_recent_cv')).toBeNull();
      expect(localStorage.getItem('airoastcv_roast_result')).toBeNull();
      expect(localStorage.getItem('airoastcv_interview_state')).toBeNull();
    });

    it('clears all known AI Roast CV keys from sessionStorage', () => {
      sessionStorage.setItem('airoastcv_ocr_cache', 'OCR raw text...');
      sessionStorage.setItem('airoastcv_timer_state', '60');
      sessionStorage.setItem('airoastcv_active_modal', 'true');

      expect(sessionStorage.length).toBe(3);

      const result = wipeAllSessionData();

      expect(result.success).toBe(true);
      expect(sessionStorage.length).toBe(0);
      expect(sessionStorage.getItem('airoastcv_ocr_cache')).toBeNull();
    });

    it('clears arbitrary third-party or unknown storage keys on total wipe', () => {
      localStorage.setItem('arbitrary_user_key', 'token_123');
      localStorage.setItem('theme_preference', 'dark');
      sessionStorage.setItem('session_temp_flag', 'abc');

      const result = wipeAllSessionData();

      expect(result.success).toBe(true);
      expect(localStorage.length).toBe(0);
      expect(sessionStorage.length).toBe(0);
      expect(localStorage.getItem('arbitrary_user_key')).toBeNull();
    });
  });

  describe('2. Residual Keys Verification', () => {
    it('verifies that no residual keys exist in localStorage or sessionStorage keys array', () => {
      localStorage.setItem('key1', 'val1');
      localStorage.setItem('key2', 'val2');
      sessionStorage.setItem('skey1', 'sval1');

      wipeAllSessionData();

      const remainingLocalKeys = Object.keys(localStorage);
      const remainingSessionKeys = Object.keys(sessionStorage);

      expect(remainingLocalKeys).toEqual([]);
      expect(remainingSessionKeys).toEqual([]);
      expect(remainingLocalKeys.length).toBe(0);
      expect(remainingSessionKeys.length).toBe(0);
    });
  });

  describe('3. Event Dispatching & React State Synchronization', () => {
    it('dispatches custom event "airoastcv:data-wiped" to notify mounted components', () => {
      const eventSpy = vi.fn();
      window.addEventListener(WIPE_DATA_EVENT_NAME, eventSpy);

      wipeAllSessionData();

      expect(eventSpy).toHaveBeenCalledTimes(1);
      const eventArg = eventSpy.mock.calls[0][0];
      expect(eventArg.type).toBe('airoastcv:data-wiped');

      window.removeEventListener(WIPE_DATA_EVENT_NAME, eventSpy);
    });
  });

  describe('4. Error Handling & Security Sandbox Resilience', () => {
    it('gracefully handles SecurityError when localStorage.clear() throws (e.g. sandboxed iframe)', () => {
      const clearSpy = vi.spyOn(Storage.prototype, 'clear').mockImplementation(() => {
        throw new DOMException('The operation is insecure.', 'SecurityError');
      });

      const result = wipeAllSessionData();

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/insecure|SecurityError/i);

      clearSpy.mockRestore();
    });
  });
});
