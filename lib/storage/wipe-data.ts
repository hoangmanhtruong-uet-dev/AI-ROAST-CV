/**
 * Wipe Data Storage Engine (Milestone 4 - Feature 23, Requirement R4)
 * Provides 1-click total purge of localStorage and sessionStorage
 * and cross-component synchronization via custom event dispatching.
 */

export const WIPE_DATA_EVENT_NAME = 'airoastcv:data-wiped';
export const VIETNAMESE_WIPE_SUCCESS_MESSAGE = 'Đã xóa toàn bộ dữ liệu CV và phỏng vấn trên thiết bị này';

export const STORAGE_KEYS_TO_CLEAR = [
  'airoastcv_recent_cv',
  'airoastcv_roast_result',
  'airoastcv_interview_state',
  'airoastcv_selected_tone',
  'airoastcv_role',
  'airoastcv_draft_cv',
  'airoastcv_evaluations',
  'airoastcv_tone_pref',
  'airoastcv_target_role',
  'airoastcv_recent_session',
  'airoastcv_ocr_cache',
  'airoastcv_timer_state',
  'airoastcv_active_modal',
  'airoastcv_rewrite_count',
  'airoastcv_rewrite_drafts',
  'airoastcv_rewrite_states',
  'airoastcv_trial_rewrite_count',
  'airoastcv_trial_custom_jd_count',
  'airoastcv_custom_jd_text',
  'airoastcv_ats_rewrites',
  'airoastcv:is_pro',
  'airoastcv:license_key',
  'ai_roast_cv_context',
  'airoastcv_custom_interview_questions',
] as const;

export const AIROASTCV_STORAGE_KEYS = STORAGE_KEYS_TO_CLEAR;

export interface WipeDataResult {
  success: boolean;
  clearedLocalStorage: boolean;
  clearedSessionStorage: boolean;
  clearedKeysCount: number;
  timestamp: number;
  error?: string;
}

export interface WipeDataOptions {
  clearLocalStorage?: boolean;
  clearSessionStorage?: boolean;
  dispatchEvent?: boolean;
  additionalKeys?: string[];
}

/**
 * Purges client-side localStorage and sessionStorage safely,
 * and broadcasts 'airoastcv:data-wiped' for cross-component synchronization.
 */
export function wipeAllSessionData(options?: WipeDataOptions): WipeDataResult {
  const clearLocal = options?.clearLocalStorage ?? true;
  const clearSession = options?.clearSessionStorage ?? true;
  const shouldDispatch = options?.dispatchEvent ?? true;

  let clearedLocalStorage = false;
  let clearedSessionStorage = false;
  let clearedKeysCount = 0;
  let errorMsg: string | undefined = undefined;

  try {
    if (typeof window !== 'undefined') {
      if (clearLocal && window.localStorage) {
        clearedKeysCount += window.localStorage.length;
        window.localStorage.clear();
        clearedLocalStorage = true;
      }
      if (clearSession && window.sessionStorage) {
        clearedKeysCount += window.sessionStorage.length;
        window.sessionStorage.clear();
        clearedSessionStorage = true;
      }

      // Remove any explicit additional keys
      if (options?.additionalKeys && options.additionalKeys.length > 0) {
        for (const key of options.additionalKeys) {
          try {
            window.localStorage?.removeItem(key);
            window.sessionStorage?.removeItem(key);
          } catch {
            // Ignore individual key removal error
          }
        }
      }

      if (shouldDispatch && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(
          new CustomEvent(WIPE_DATA_EVENT_NAME, {
            detail: { timestamp: Date.now() },
          })
        );
      }
    }

    return {
      success: true,
      clearedLocalStorage,
      clearedSessionStorage,
      clearedKeysCount,
      timestamp: Date.now(),
    };
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : String(err);

    // Attempt event dispatch even upon partial failure to notify active listeners
    try {
      if (typeof window !== 'undefined' && shouldDispatch && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(
          new CustomEvent(WIPE_DATA_EVENT_NAME, {
            detail: { timestamp: Date.now(), error: errorMsg },
          })
        );
      }
    } catch {
      // Ignore secondary event dispatch errors
    }

    return {
      success: false,
      clearedLocalStorage: false,
      clearedSessionStorage: false,
      clearedKeysCount: 0,
      timestamp: Date.now(),
      error: errorMsg,
    };
  }
}

/**
 * Alias of wipeAllSessionData for spec compatibility
 */
export const wipeClientData = wipeAllSessionData;

/**
 * Checks whether any keys exist in browser storage
 */
export function hasStoredClientData(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (window.localStorage && window.localStorage.length > 0) return true;
    if (window.sessionStorage && window.sessionStorage.length > 0) return true;
  } catch {
    return false;
  }
  return false;
}
