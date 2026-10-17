'use client';

import { useState, useEffect, useCallback } from 'react';
import { WIPE_DATA_EVENT_NAME } from '@/lib/storage/wipe-data';
import { EntitlementTier } from './types';

export const PRO_STORAGE_KEY = 'airoastcv:is_pro';
export const PRO_LICENSE_KEY = 'airoastcv:license_key';
export const PRO_TIER_KEY = 'airoastcv:tier';
export const PRO_STATUS_EVENT = 'airoastcv:pro-status-changed';

export interface ProState {
  isPro: boolean;
  tier: EntitlementTier;
  isMaster: boolean;
  isStarter: boolean;
  licenseKey: string | null;
}

export function resolveTierFromKey(key: string | null): EntitlementTier {
  if (!key) return 'free';
  const cleanKey = key.trim().toUpperCase();
  if (cleanKey.startsWith('STARTER-') || cleanKey.startsWith('PRO-STRT-')) return 'starter';
  if (cleanKey.startsWith('PRO-') || cleanKey.startsWith('MASTER-')) return 'master';
  return 'master';
}

export function getClientProStatus(): ProState {
  if (typeof window === 'undefined') {
    return { isPro: false, tier: 'free', isMaster: false, isStarter: false, licenseKey: null };
  }
  try {
    const isPro = localStorage.getItem(PRO_STORAGE_KEY) === 'true';
    const licenseKey = localStorage.getItem(PRO_LICENSE_KEY) || null;
    const storedTier = (localStorage.getItem(PRO_TIER_KEY) as EntitlementTier) || null;

    if (!isPro) {
      return { isPro: false, tier: 'free', isMaster: false, isStarter: false, licenseKey: null };
    }

    const tier: EntitlementTier = storedTier || resolveTierFromKey(licenseKey);
    return {
      isPro: true,
      tier,
      isMaster: tier === 'master',
      isStarter: tier === 'starter',
      licenseKey,
    };
  } catch {
    return { isPro: false, tier: 'free', isMaster: false, isStarter: false, licenseKey: null };
  }
}

export function setClientProStatus(isPro: boolean, licenseKey?: string | null, tier?: EntitlementTier): void {
  if (typeof window === 'undefined') return;
  try {
    if (isPro) {
      const resolvedTier: EntitlementTier = tier || resolveTierFromKey(licenseKey || null);
      localStorage.setItem(PRO_STORAGE_KEY, 'true');
      localStorage.setItem(PRO_TIER_KEY, resolvedTier);
      if (licenseKey) {
        localStorage.setItem(PRO_LICENSE_KEY, licenseKey.trim().toUpperCase());
      }
      window.dispatchEvent(
        new CustomEvent(PRO_STATUS_EVENT, {
          detail: { isPro: true, licenseKey, tier: resolvedTier },
        })
      );
    } else {
      localStorage.removeItem(PRO_STORAGE_KEY);
      localStorage.removeItem(PRO_LICENSE_KEY);
      localStorage.removeItem(PRO_TIER_KEY);
      window.dispatchEvent(
        new CustomEvent(PRO_STATUS_EVENT, {
          detail: { isPro: false, licenseKey: null, tier: 'free' },
        })
      );
    }
  } catch (err) {
    console.error('Failed to update Pro status in LocalStorage', err);
  }
}

export function useProTier() {
  const [proState, setProState] = useState<ProState>({
    isPro: false,
    tier: 'free',
    isMaster: false,
    isStarter: false,
    licenseKey: null,
  });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initial read
    setProState(getClientProStatus());
    setIsReady(true);

    const handleProChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ isPro: boolean; licenseKey?: string; tier?: EntitlementTier }>;
      if (customEvent.detail) {
        const isPro = customEvent.detail.isPro;
        const licenseKey = customEvent.detail.licenseKey || null;
        const tier = customEvent.detail.tier || (isPro ? resolveTierFromKey(licenseKey) : 'free');
        setProState({
          isPro,
          tier,
          isMaster: tier === 'master',
          isStarter: tier === 'starter',
          licenseKey,
        });
      } else {
        setProState(getClientProStatus());
      }
    };

    const handleDataWiped = () => {
      setProState({
        isPro: false,
        tier: 'free',
        isMaster: false,
        isStarter: false,
        licenseKey: null,
      });
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

  const activatePro = useCallback((licenseKey: string, tier?: EntitlementTier) => {
    setClientProStatus(true, licenseKey, tier);
    const resolvedTier = tier || resolveTierFromKey(licenseKey);
    setProState({
      isPro: true,
      tier: resolvedTier,
      isMaster: resolvedTier === 'master',
      isStarter: resolvedTier === 'starter',
      licenseKey,
    });
  }, []);

  const deactivatePro = useCallback(() => {
    setClientProStatus(false, null, 'free');
    setProState({
      isPro: false,
      tier: 'free',
      isMaster: false,
      isStarter: false,
      licenseKey: null,
    });
  }, []);

  return {
    isPro: proState.isPro,
    tier: proState.tier,
    isMaster: proState.isMaster,
    isStarter: proState.isStarter,
    licenseKey: proState.licenseKey,
    isReady,
    activatePro,
    deactivatePro,
  };
}
