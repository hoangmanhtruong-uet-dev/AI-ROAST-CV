/**
 * Centralized Trial Usage & Pro Entitlement Limits Engine
 * Follows ORIGINAL_REQUEST §Follow-up R3 and SCOPE.md
 *
 * Usage Rules:
 * - Free users: Exactly 1 trial ATS sample rewrite and 1 custom JD interview question.
 * - Pro users (License key `PRO-XXXX-YYYY` or VietQR verified): Unlimited rewrites and custom JD interviews.
 */

import { getClientProStatus } from './entitlement';

export const TRIAL_REWRITE_KEY = 'airoastcv_trial_rewrite_count';
export const LEGACY_REWRITE_KEY = 'airoastcv_rewrite_count';
export const TRIAL_CUSTOM_JD_KEY = 'airoastcv_trial_custom_jd_count';
export const CUSTOM_JD_DRAFT_KEY = 'airoastcv_custom_jd_text';
export const ATS_REWRITES_CACHE_KEY = 'airoastcv_ats_rewrites';

export const TRIAL_STORAGE_KEYS = [
  TRIAL_REWRITE_KEY,
  LEGACY_REWRITE_KEY,
  TRIAL_CUSTOM_JD_KEY,
  CUSTOM_JD_DRAFT_KEY,
  ATS_REWRITES_CACHE_KEY,
] as const;

export const FREE_LIMITS = {
  MAX_REWRITES: 1,
  MAX_CUSTOM_JD: 1,
} as const;

export interface TrialUsageState {
  rewriteCount: number;
  customJdCount: number;
  maxFreeRewrites: number;
  maxFreeCustomJd: number;
  canRewrite: boolean;
  canCustomJd: boolean;
}

/**
 * Safely parses counter integer from localStorage, guaranteeing non-negative numeric output.
 */
function parseCount(value: string | null): number {
  if (!value) return 0;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) || parsed < 0 ? 0 : parsed;
}

/**
 * Retrieves the current trial usage state for both ATS rewrites and custom JD questions.
 * Pro tier users always have unlimited access (`canRewrite: true`, `canCustomJd: true`).
 *
 * @param isPro Optional override for user's Pro status. If omitted, checks client LocalStorage status.
 */
export function getTrialUsage(isPro?: boolean): TrialUsageState {
  if (typeof window === 'undefined') {
    return {
      rewriteCount: 0,
      customJdCount: 0,
      maxFreeRewrites: FREE_LIMITS.MAX_REWRITES,
      maxFreeCustomJd: FREE_LIMITS.MAX_CUSTOM_JD,
      canRewrite: true,
      canCustomJd: true,
    };
  }

  const effectivePro = isPro !== undefined ? isPro : getClientProStatus().isPro;

  let rewriteCount = 0;
  let customJdCount = 0;

  try {
    const rawRewrite =
      localStorage.getItem(TRIAL_REWRITE_KEY) ||
      localStorage.getItem(LEGACY_REWRITE_KEY);
    rewriteCount = parseCount(rawRewrite);

    const rawJd = localStorage.getItem(TRIAL_CUSTOM_JD_KEY);
    customJdCount = parseCount(rawJd);
  } catch {
    // If localStorage read fails (e.g. security sandboxing), fail open for 1st trial
    rewriteCount = 0;
    customJdCount = 0;
  }

  return {
    rewriteCount,
    customJdCount,
    maxFreeRewrites: FREE_LIMITS.MAX_REWRITES,
    maxFreeCustomJd: FREE_LIMITS.MAX_CUSTOM_JD,
    canRewrite: Boolean(effectivePro || rewriteCount < FREE_LIMITS.MAX_REWRITES),
    canCustomJd: Boolean(effectivePro || customJdCount < FREE_LIMITS.MAX_CUSTOM_JD),
  };
}

/**
 * Increments trial usage counter for a given feature in LocalStorage.
 */
export function recordTrialUsage(feature: 'rewrite' | 'customJd'): void {
  if (typeof window === 'undefined') return;

  try {
    if (feature === 'rewrite') {
      const current = getTrialUsage().rewriteCount;
      const next = current + 1;
      localStorage.setItem(TRIAL_REWRITE_KEY, String(next));
      localStorage.setItem(LEGACY_REWRITE_KEY, String(next));
    } else if (feature === 'customJd') {
      const current = getTrialUsage().customJdCount;
      const next = current + 1;
      localStorage.setItem(TRIAL_CUSTOM_JD_KEY, String(next));
    }
  } catch (err) {
    console.error('Failed to record trial usage in LocalStorage', err);
  }
}

/**
 * Resets all trial counters back to 0.
 * Invoked during 1-Click Wipe Data or sandbox reset.
 */
export function resetTrialUsage(): void {
  if (typeof window === 'undefined') return;

  try {
    for (const key of TRIAL_STORAGE_KEYS) {
      localStorage.removeItem(key);
    }
  } catch (err) {
    console.error('Failed to reset trial usage in LocalStorage', err);
  }
}
