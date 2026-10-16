import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  getClientProStatus,
  setClientProStatus,
  useProTier,
  PRO_STORAGE_KEY,
  PRO_LICENSE_KEY,
} from '@/lib/payment/entitlement';
import { WIPE_DATA_EVENT_NAME } from '@/lib/storage/wipe-data';

describe('Pro Entitlement & Hook (Milestone 6)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getClientProStatus and setClientProStatus', () => {
    it('returns false and null when storage is empty', () => {
      const status = getClientProStatus();
      expect(status.isPro).toBe(false);
      expect(status.licenseKey).toBeNull();
    });

    it('sets and retrieves Pro status with license key', () => {
      setClientProStatus(true, 'PRO-TEST-1234');
      const status = getClientProStatus();
      expect(status.isPro).toBe(true);
      expect(status.licenseKey).toBe('PRO-TEST-1234');
      expect(localStorage.getItem(PRO_STORAGE_KEY)).toBe('true');
      expect(localStorage.getItem(PRO_LICENSE_KEY)).toBe('PRO-TEST-1234');
    });

    it('clears Pro status when set to false', () => {
      setClientProStatus(true, 'PRO-KEY-1111');
      setClientProStatus(false, null);
      const status = getClientProStatus();
      expect(status.isPro).toBe(false);
      expect(status.licenseKey).toBeNull();
      expect(localStorage.getItem(PRO_STORAGE_KEY)).toBeNull();
      expect(localStorage.getItem(PRO_LICENSE_KEY)).toBeNull();
    });
  });

  describe('useProTier Hook', () => {
    it('reads initial Pro status from LocalStorage', () => {
      localStorage.setItem(PRO_STORAGE_KEY, 'true');
      localStorage.setItem(PRO_LICENSE_KEY, 'PRO-INIT-KEY');

      const { result } = renderHook(() => useProTier());
      expect(result.current.isPro).toBe(true);
      expect(result.current.licenseKey).toBe('PRO-INIT-KEY');
    });

    it('updates state when activatePro is invoked', () => {
      const { result } = renderHook(() => useProTier());
      expect(result.current.isPro).toBe(false);

      act(() => {
        result.current.activatePro('PRO-NEW-MEMBER');
      });

      expect(result.current.isPro).toBe(true);
      expect(result.current.licenseKey).toBe('PRO-NEW-MEMBER');
      expect(localStorage.getItem(PRO_STORAGE_KEY)).toBe('true');
    });

    it('clears Pro state when deactivatePro is invoked', () => {
      localStorage.setItem(PRO_STORAGE_KEY, 'true');
      localStorage.setItem(PRO_LICENSE_KEY, 'PRO-DEACT');

      const { result } = renderHook(() => useProTier());

      act(() => {
        result.current.deactivatePro();
      });

      expect(result.current.isPro).toBe(false);
      expect(result.current.licenseKey).toBeNull();
    });

    it('resets Pro state when 1-click Wipe Data event fires', () => {
      localStorage.setItem(PRO_STORAGE_KEY, 'true');
      localStorage.setItem(PRO_LICENSE_KEY, 'PRO-WIPED');

      const { result } = renderHook(() => useProTier());
      expect(result.current.isPro).toBe(true);

      act(() => {
        window.dispatchEvent(new CustomEvent(WIPE_DATA_EVENT_NAME, { detail: { timestamp: Date.now() } }));
      });

      expect(result.current.isPro).toBe(false);
      expect(result.current.licenseKey).toBeNull();
    });
  });
});
