/**
 * Dual-Layer Rate Limiter for Live Roast Teaser (Milestone 3 - Feature 15)
 * Combines Client Layer (LocalStorage + Cookie) and Server Layer (In-Memory LRU + Zero-PII SHA-256 Hashed IP).
 * Strict Quota: Exactly 3 teaser calls per calendar day (UTC window).
 *
 * Zero-PII Invariant:
 * Raw IP addresses are NEVER stored, printed, emitted to console/logs, or retained.
 * Only one-way SHA-256(ClientIP + Salt + DateString) 64-character hashes exist in memory.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { WIPE_DATA_EVENT_NAME } from '@/lib/storage/wipe-data';

// ============================================================================
// Constants & Configuration
// ============================================================================

export const MAX_TEASER_CALLS_PER_DAY = 3;
export const TEASER_STORAGE_KEY = 'airoastcv_teaser_usage';
export const TEASER_COOKIE_NAME = 'rcv_teaser_count';
export const TEASER_USAGE_EVENT_NAME = 'airoastcv:teaser-usage-changed';
export const DEFAULT_LRU_MAX_ENTRIES = 10_000;
export const ENTRY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export const TEASER_RATE_LIMIT_ERROR_MESSAGE =
  'Bạn đã sử dụng hết 3 lượt thử miễn phí hôm nay. Vui lòng quay lại vào ngày mai hoặc nâng cấp gói Pro để mở khóa không giới hạn!';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface StoredTeaserUsage {
  date: string; // 'YYYY-MM-DD'
  count: number;
}

export interface ClientTeaserUsageState {
  date: string;
  count: number;
  remaining: number;
  canSubmit: boolean;
}

export interface TeaserLimiterEntry {
  count: number;
  resetAt: number; // Unix timestamp in seconds
  lastAccessed: number; // Unix timestamp in milliseconds
}

export interface RateLimitCheckResult {
  allowed: boolean;
  status: 200 | 429;
  limit: number;
  remaining: number;
  resetAt: number; // Unix epoch seconds
  headers: Record<string, string>;
  error?: string;
  clientIpHash?: string; // 64-char SHA-256 string for audit/test (Zero-PII)
}

export interface RateLimitCheckOptions {
  customIp?: string;
  now?: number;
  salt?: string;
  consume?: boolean;
}

// ============================================================================
// Zero-PII IP Extraction & Cryptographic Hashing
// ============================================================================

/**
 * Returns salt from environment or safe production fallback.
 */
export function getRateLimitSalt(): string {
  return (
    process.env.TEASER_RATE_LIMIT_SALT ||
    process.env.RATE_LIMIT_SALT ||
    'airoastcv_teaser_salt_2026_secure_seed'
  );
}

/**
 * Extracts client IP from incoming request or headers.
 * Extracts first IP from X-Forwarded-For if comma-separated proxy list.
 * Fallback to standard headers or localhost.
 */
export function extractClientIp(
  req?: Request | Headers | { headers?: Headers | Record<string, string | string[] | undefined> }
): string {
  if (!req) return '127.0.0.1';

  let rawHeader: string | null = null;

  if (typeof (req as Request).headers?.get === 'function') {
    const headers = (req as Request).headers;
    rawHeader =
      headers.get('x-forwarded-for') ||
      headers.get('x-real-ip') ||
      headers.get('cf-connecting-ip');
  } else if ('headers' in req && req.headers) {
    const h = req.headers;
    if (typeof (h as Headers).get === 'function') {
      const hdrs = h as Headers;
      rawHeader =
        hdrs.get('x-forwarded-for') ||
        hdrs.get('x-real-ip') ||
        hdrs.get('cf-connecting-ip');
    } else {
      const rec = h as Record<string, string | string[] | undefined>;
      const fwd = rec['x-forwarded-for'] || rec['X-Forwarded-For'];
      const real = rec['x-real-ip'] || rec['X-Real-IP'];
      const cf = rec['cf-connecting-ip'] || rec['CF-Connecting-IP'];
      const val = fwd || real || cf;
      rawHeader = Array.isArray(val) ? val[0] : (val ?? null);
    }
  }

  if (rawHeader) {
    // If comma-separated, the first IP is the original client IP
    const firstIp = rawHeader.split(',')[0].trim();
    if (firstIp) return firstIp;
  }

  // Next.js request.ip property on Vercel/Node runtime
  if (req && typeof (req as { ip?: string }).ip === 'string') {
    return (req as { ip: string }).ip;
  }

  return '127.0.0.1';
}

export const getClientIp = extractClientIp;

/**
 * Computes SHA-256(ClientIP + Salt + DateString).
 * Zero-PII Invariant: Raw IP address is IMMEDIATELY hashed and never returned or saved.
 * Cross-environment compatible: Uses Node.js crypto in server runtime without bundling issues.
 */
export function hashClientIp(clientIp: string, dateStr: string, salt = getRateLimitSalt()): string {
  const combined = `${clientIp}::${salt}::${dateStr}`;

  if (typeof window === 'undefined') {
    // Node.js server environment (synchronous, high-speed SHA-256)
    const nodeCrypto = eval('require')('crypto');
    return nodeCrypto.createHash('sha256').update(combined).digest('hex');
  }

  // Fallback for browser testing environments if invoked client-side
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = (hash << 5) - hash + combined.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(64, '0');
}

/**
 * Calculates Unix epoch timestamp (seconds) for next midnight UTC.
 */
export function getNextUtcMidnightSeconds(nowMs = Date.now()): number {
  const date = new Date(nowMs);
  const nextMidnightMs = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate() + 1,
    0,
    0,
    0,
    0
  );
  return Math.floor(nextMidnightMs / 1000);
}

// ============================================================================
// Server-Side Memory-Safe LRU Store (Cap at 10,000 entries)
// ============================================================================

export class TeaserMemoryStore {
  private entries = new Map<string, TeaserLimiterEntry>();
  private readonly maxEntries: number;
  private readonly ttlMs: number;

  constructor(maxEntries = DEFAULT_LRU_MAX_ENTRIES, ttlMs = ENTRY_TTL_MS) {
    this.maxEntries = maxEntries;
    this.ttlMs = ttlMs;
  }

  /**
   * Retrieves entry and promotes it to Most Recently Used (MRU) in iteration order.
   * Purges entry if expired.
   */
  get(key: string, nowMs = Date.now()): TeaserLimiterEntry | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;

    // Check expiration: older than 24h or reset timestamp has arrived
    if (nowMs - entry.lastAccessed > this.ttlMs || entry.resetAt * 1000 <= nowMs) {
      this.entries.delete(key);
      return undefined;
    }

    // Move to end of Map to maintain LRU access order
    this.entries.delete(key);
    this.entries.set(key, entry);
    return entry;
  }

  /**
   * Inserts or updates entry. If capacity exceeds maxEntries, evicts stale items,
   * then evicts the Least Recently Used (LRU) entry.
   */
  set(key: string, entry: TeaserLimiterEntry): void {
    if (this.entries.has(key)) {
      this.entries.delete(key);
    } else if (this.entries.size >= this.maxEntries) {
      this.evictOldest(Date.now());
    }

    this.entries.set(key, entry);
  }

  /**
   * Evicts expired entries first; if still over capacity, drops the oldest key.
   */
  private evictOldest(nowMs: number): void {
    // Pass 1: Clean expired entries
    for (const [k, v] of this.entries.entries()) {
      if (nowMs - v.lastAccessed > this.ttlMs || v.resetAt * 1000 <= nowMs) {
        this.entries.delete(k);
      }
      if (this.entries.size < this.maxEntries) return;
    }

    // Pass 2: Evict oldest in Map insertion order
    while (this.entries.size >= this.maxEntries) {
      const oldestKey = this.entries.keys().next().value;
      if (oldestKey !== undefined) {
        this.entries.delete(oldestKey);
      } else {
        break;
      }
    }
  }

  /**
   * Explicit sweep of all stale entries older than 24h.
   */
  sweepStale(nowMs = Date.now()): number {
    let purged = 0;
    for (const [k, v] of this.entries.entries()) {
      if (nowMs - v.lastAccessed > this.ttlMs || v.resetAt * 1000 <= nowMs) {
        this.entries.delete(k);
        purged++;
      }
    }
    return purged;
  }

  get size(): number {
    return this.entries.size;
  }

  clear(): void {
    this.entries.clear();
  }
}

// Global server singleton instance
export const globalTeaserStore = new TeaserMemoryStore();

export function resetTeaserRateLimits(): void {
  globalTeaserStore.clear();
}

// ============================================================================
// Cookie Extraction Helper
// ============================================================================

/**
 * Extracts teaser count from Cookie header on incoming request.
 */
export function extractCookieCount(
  req?: Request | Headers | { headers?: Headers | Record<string, string | string[] | undefined> }
): number {
  if (!req) return 0;

  let cookieString = '';

  if (typeof (req as Request).headers?.get === 'function') {
    cookieString = (req as Request).headers.get('cookie') || '';
  } else if ('headers' in req && req.headers) {
    const h = req.headers;
    if (typeof (h as Headers).get === 'function') {
      cookieString = (h as Headers).get('cookie') || '';
    } else {
      const rec = h as Record<string, string | string[] | undefined>;
      const val = rec.cookie || rec.Cookie;
      cookieString = Array.isArray(val) ? val.join('; ') : (val || '');
    }
  }

  if (!cookieString) return 0;

  const match = cookieString.match(new RegExp(`(?:^|;\\s*)${TEASER_COOKIE_NAME}=([^;]*)`));
  if (!match) return 0;

  const parsed = parseInt(decodeURIComponent(match[1]), 10);
  return Number.isNaN(parsed) || parsed < 0 ? 0 : parsed;
}

// ============================================================================
// Server Layer Check Engine: checkTeaserRateLimit()
// ============================================================================

/**
 * Checks and updates rate limit for Live Roast Teaser (3 calls/day).
 * Combines cookie inspection with Zero-PII SHA-256 hashed IP in-memory table.
 */
export function checkTeaserRateLimit(
  req?: Request | Headers | { headers?: Headers | Record<string, string | string[] | undefined> } | string,
  options?: RateLimitCheckOptions,
  store: TeaserMemoryStore = globalTeaserStore
): RateLimitCheckResult {
  // Support both checkTeaserRateLimit(req, options) and checkTeaserRateLimit(clientIp, options)
  const isReqString = typeof req === 'string';
  const rawIp = options?.customIp ?? (isReqString ? req : extractClientIp(req as Request));
  const requestObj = isReqString ? undefined : (req as Request | undefined);

  const nowMs = options?.now ?? Date.now();
  const dateStr = new Date(nowMs).toISOString().slice(0, 10);
  const salt = options?.salt ?? getRateLimitSalt();
  const resetAt = getNextUtcMidnightSeconds(nowMs);
  const consume = options?.consume ?? true;

  // 1. Zero-PII IP Extraction & Hashing
  const clientIpHash = hashClientIp(rawIp, dateStr, salt);
  // RAW IP IS NEVER LOGGED, STORED, OR RETAINED BEYOND THIS POINT

  // 2. Cookie Verification (Client Layer Cross-check)
  const cookieCount = extractCookieCount(requestObj);
  if (cookieCount >= MAX_TEASER_CALLS_PER_DAY) {
    const retryAfter = Math.max(1, resetAt - Math.floor(nowMs / 1000));
    return {
      allowed: false,
      status: 429,
      limit: MAX_TEASER_CALLS_PER_DAY,
      remaining: 0,
      resetAt,
      clientIpHash,
      headers: {
        'X-RateLimit-Limit': String(MAX_TEASER_CALLS_PER_DAY),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(resetAt),
        'Retry-After': String(retryAfter),
      },
      error: TEASER_RATE_LIMIT_ERROR_MESSAGE,
    };
  }

  // 3. Server LRU Store Verification
  const existing = store.get(clientIpHash, nowMs);
  const currentCount = existing ? existing.count : 0;

  if (currentCount >= MAX_TEASER_CALLS_PER_DAY) {
    const effectiveResetAt = existing ? existing.resetAt : resetAt;
    const retryAfter = Math.max(1, effectiveResetAt - Math.floor(nowMs / 1000));
    return {
      allowed: false,
      status: 429,
      limit: MAX_TEASER_CALLS_PER_DAY,
      remaining: 0,
      resetAt: effectiveResetAt,
      clientIpHash,
      headers: {
        'X-RateLimit-Limit': String(MAX_TEASER_CALLS_PER_DAY),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(effectiveResetAt),
        'Retry-After': String(retryAfter),
      },
      error: TEASER_RATE_LIMIT_ERROR_MESSAGE,
    };
  }

  // 4. Update In-Memory Store
  const nextCount = consume ? currentCount + 1 : currentCount;
  const remaining = Math.max(0, MAX_TEASER_CALLS_PER_DAY - nextCount);

  if (consume) {
    store.set(clientIpHash, {
      count: nextCount,
      resetAt,
      lastAccessed: nowMs,
    });
  }

  return {
    allowed: true,
    status: 200,
    limit: MAX_TEASER_CALLS_PER_DAY,
    remaining,
    resetAt,
    clientIpHash,
    headers: {
      'X-RateLimit-Limit': String(MAX_TEASER_CALLS_PER_DAY),
      'X-RateLimit-Remaining': String(remaining),
      'X-RateLimit-Reset': String(resetAt),
      'Set-Cookie': `${TEASER_COOKIE_NAME}=${nextCount}; Path=/; Max-Age=${Math.max(60, resetAt - Math.floor(nowMs / 1000))}; SameSite=Lax`,
    },
  };
}

export function getRateLimitHeaders(result: RateLimitCheckResult): Record<string, string> {
  return result.headers;
}

// ============================================================================
// Client Layer Storage Helpers (LocalStorage + Cookie)
// ============================================================================

export function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getClientCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function setClientCookie(name: string, value: string, maxAgeSeconds: number): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`;
}

/**
 * Reads teaser usage from client LocalStorage and Cookie.
 * Automatically rolls over to 0 if calendar date has changed.
 */
export function getClientTeaserUsage(): ClientTeaserUsageState {
  const today = getTodayDateString();

  if (typeof window === 'undefined') {
    return {
      date: today,
      count: 0,
      remaining: MAX_TEASER_CALLS_PER_DAY,
      canSubmit: true,
    };
  }

  let localCount = 0;

  try {
    const raw = localStorage.getItem(TEASER_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredTeaserUsage;
      if (parsed && parsed.date === today && typeof parsed.count === 'number') {
        localCount = Math.max(0, parsed.count);
      } else {
        // Date changed: reset count for the new day
        localStorage.setItem(TEASER_STORAGE_KEY, JSON.stringify({ date: today, count: 0 }));
        localCount = 0;
      }
    }
  } catch {
    localCount = 0;
  }

  // Cross-reference with cookie
  let cookieCount = 0;
  try {
    const cookieVal = getClientCookie(TEASER_COOKIE_NAME);
    if (cookieVal) {
      const parsed = parseInt(cookieVal, 10);
      if (!Number.isNaN(parsed) && parsed >= 0) {
        cookieCount = parsed;
      }
    }
  } catch {
    cookieCount = 0;
  }

  // Defense-in-depth: Effective count is the maximum of localStorage and Cookie
  const effectiveCount = Math.max(localCount, cookieCount);
  const remaining = Math.max(0, MAX_TEASER_CALLS_PER_DAY - effectiveCount);

  return {
    date: today,
    count: effectiveCount,
    remaining,
    canSubmit: remaining > 0,
  };
}

/**
 * Increments teaser usage in LocalStorage and sets Cookie with midnight expiry.
 */
export function recordClientTeaserUsage(overrideRemaining?: number): ClientTeaserUsageState {
  if (typeof window === 'undefined') {
    return {
      date: getTodayDateString(),
      count: 0,
      remaining: MAX_TEASER_CALLS_PER_DAY,
      canSubmit: true,
    };
  }

  const today = getTodayDateString();
  const current = getClientTeaserUsage();

  let nextCount = current.count + 1;
  if (overrideRemaining !== undefined) {
    nextCount = Math.max(0, MAX_TEASER_CALLS_PER_DAY - overrideRemaining);
  }

  try {
    localStorage.setItem(
      TEASER_STORAGE_KEY,
      JSON.stringify({ date: today, count: nextCount })
    );

    const now = new Date();
    const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
    const secondsUntilMidnight = Math.max(60, Math.floor((midnight.getTime() - now.getTime()) / 1000));

    setClientCookie(TEASER_COOKIE_NAME, String(nextCount), secondsUntilMidnight);

    window.dispatchEvent(
      new CustomEvent(TEASER_USAGE_EVENT_NAME, {
        detail: { count: nextCount, remaining: Math.max(0, MAX_TEASER_CALLS_PER_DAY - nextCount) },
      })
    );
  } catch (err) {
    console.warn('Failed to record client teaser usage', err);
  }

  return getClientTeaserUsage();
}

/**
 * Resets client teaser usage.
 */
export function resetClientTeaserUsage(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(TEASER_STORAGE_KEY);
    setClientCookie(TEASER_COOKIE_NAME, '0', 0);
    window.dispatchEvent(new CustomEvent(TEASER_USAGE_EVENT_NAME, { detail: { count: 0, remaining: MAX_TEASER_CALLS_PER_DAY } }));
  } catch (err) {
    console.warn('Failed to reset client teaser usage', err);
  }
}

// ============================================================================
// React Hook: useTeaserUsage()
// ============================================================================

export interface UseTeaserUsageReturn {
  remaining: number;
  canSubmit: boolean;
  count: number;
  isReady: boolean;
  recordUsage: () => void;
  syncRemaining: (serverRemaining: number) => void;
  resetUsage: () => void;
}

/**
 * Client-side React hook for tracking Live Roast Teaser daily quota (3 calls/day).
 * Automatically reacts to LocalStorage changes, multi-tab sync, and 1-Click Wipe Data.
 */
export function useTeaserUsage(): UseTeaserUsageReturn {
  const [state, setState] = useState<ClientTeaserUsageState>(() => getClientTeaserUsage());
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 1. Initial hydration from client storage
    const initial = getClientTeaserUsage();
    setState(initial);
    setIsReady(true);

    // 2. Custom Event Listener (intra-page / inter-component sync)
    const handleUsageChange = () => {
      setState(getClientTeaserUsage());
    };

    // 3. 1-Click Wipe Data Event Listener
    const handleDataWiped = () => {
      resetClientTeaserUsage();
      setState({
        date: getTodayDateString(),
        count: 0,
        remaining: MAX_TEASER_CALLS_PER_DAY,
        canSubmit: true,
      });
    };

    // 4. Cross-tab Storage Synchronization
    const handleStorage = (e: StorageEvent) => {
      if (e.key === TEASER_STORAGE_KEY) {
        setState(getClientTeaserUsage());
      }
    };

    window.addEventListener(TEASER_USAGE_EVENT_NAME, handleUsageChange);
    window.addEventListener(WIPE_DATA_EVENT_NAME, handleDataWiped);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(TEASER_USAGE_EVENT_NAME, handleUsageChange);
      window.removeEventListener(WIPE_DATA_EVENT_NAME, handleDataWiped);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const recordUsage = useCallback(() => {
    const updated = recordClientTeaserUsage();
    setState(updated);
  }, []);

  const syncRemaining = useCallback((serverRemaining: number) => {
    const updated = recordClientTeaserUsage(serverRemaining);
    setState(updated);
  }, []);

  const resetUsage = useCallback(() => {
    resetClientTeaserUsage();
    setState({
      date: getTodayDateString(),
      count: 0,
      remaining: MAX_TEASER_CALLS_PER_DAY,
      canSubmit: true,
    });
  }, []);

  return {
    remaining: state.remaining,
    canSubmit: state.canSubmit,
    count: state.count,
    isReady,
    recordUsage,
    syncRemaining,
    resetUsage,
  };
}
