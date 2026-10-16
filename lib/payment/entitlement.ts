'use client';

import { useState, useEffect, useCallback } from 'react';
import { WIPE_DATA_EVENT_NAME } from '@/lib/storage/wipe-data';

export const PRO_STORAGE_KEY = 'airoastcv:is_pro';
export const PRO_LICENSE_KEY = 'airoastcv:license_key';
export const PRO_STATUS_EVENT = 'airoastcv:pro-status-changed';

export interface ProState {
  isPro: boolean;
  licenseKey: string | null;
}

export function getClientProStatus(): ProState {
  if (typeof window === 'undefined') {
    return { isPro: false, licenseKey: null };
  }
  try {
    const isPro = localStorage.getItem(PRO_STORAGE_KEY) === 'true';
    const licenseKey = localStorage.getItem(PRO_LICENSE_KEY) || null;
    return { isPro, licenseKey };
  } catch {
    return { isPro: false, licenseKey: null };
  }
}

export function setClientProStatus(isPro: boolean, licenseKey?: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (isPro) {
      localStorage.setItem(PRO_STORAGE_KEY, 'true');
      if (licenseKey) {
        localStorage.setItem(PRO_LICENSE_KEY, licenseKey.trim().toUpperCase());
      }
    } else {
      localStorage.removeItem(PRO_STORAGE_KEY);
      localStorage.removeItem(PRO_LICENSE_KEY);
    }
    window.dispatchEvent(new CustomEvent(PRO_STATUS_EVENT, { detail: { isPro, licenseKey } }));
  } catch (err) {
    console.error('Failed to update Pro status in LocalStorage', err);
  }
}

export function useProTier() {
  const [proState, setProState] = useState<ProState>({ isPro: false, licenseKey: null });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initial read
    setProState(getClientProStatus());
    setIsReady(true);

    const handleProChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ isPro: boolean; licenseKey?: string }>;
      if (customEvent.detail) {
        setProState({
          isPro: customEvent.detail.isPro,
          licenseKey: customEvent.detail.licenseKey || null,
        });
      } else {
        setProState(getClientProStatus());
      }
    };

    const handleDataWiped = () => {
      setProState({ isPro: false, licenseKey: null });
    };

    window.addEventListener(PRO_STATUS_EVENT, handleProChange);
    window.addEventListener(WIPE_DATA_EVENT_NAME, handleDataWiped);
    window.addEventListener('storage', handleProChange);

    return () => {
      window.removeEventListener(PRO_STATUS_EVENT, handleProChange);
      window.removeEventListener(WIPE_DATA_EVENT_NAME, handleDataWiped);
      window.removeEventListener('storage', handleProChange);
    };
  }, []);

  const activatePro = useCallback((licenseKey: string) => {
    setClientProStatus(true, licenseKey);
    setProState({ isPro: true, licenseKey });
  }, []);

  const deactivatePro = useCallback(() => {
    setClientProStatus(false, null);
    setProState({ isPro: false, licenseKey: null });
  }, []);

  return {
    isPro: proState.isPro,
    licenseKey: proState.licenseKey,
    isReady,
    activatePro,
    deactivatePro,
  };
}
