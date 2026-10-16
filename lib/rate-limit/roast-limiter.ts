/**
 * Self-Contained Multi-Tier Rate Limiter for /api/roast (Milestone 7 / Requirement R1)
 *
 * Architecture:
 * - Tier 1: Payload Guard (CV text minimum 120 chars, maximum 5,000 chars 1-page CV truncation)
 * - Tier 2: HMAC-SHA256 Signed Cookie Quota Carrier (`rcv_session_quota`)
 * - Tier 3: In-Memory Salted Token Bucket: SHA-256(IP + Salt + Date)
 *   Burst Limit: 2 req / 60s
 *   Daily Quota: 5 req / 24h
 *
 * Zero-PII Invariant:
 * Raw IP addresses are NEVER stored, emitted to console/logs, or retained.
 * Only one-way 64-char SHA-256 hashes exist in memory.
 * No external Redis dependency — operates 100% self-contained.
 */

import crypto from 'crypto';

// ============================================================================
// Constants & Configuration
// ============================================================================

export const ROAST_DAILY_QUOTA = 5;
export const ROAST_BURST_LIMIT = 2;
export const ROAST_BURST_WINDOW_MS = 60 * 1000; // 60 seconds
export const ROAST_MIN_PAYLOAD_CHARS = 120;
export const ROAST_MAX_PAYLOAD_CHARS = 5000;

export const ROAST_QUOTA_COOKIE_NAME = 'rcv_session_quota';
export const DEFAULT_ROAST_LRU_MAX_ENTRIES = 10_000;
export const ROAST_ENTRY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export const ROAST_RATE_LIMIT_ERROR_MESSAGE =
  'Bạn đã sử dụng hết 5 lượt Roast CV miễn phí trong hôm nay. Hãy tối ưu CV thật kỹ rồi quay lại vào ngày mai nhé!';

export const ROAST_BURST_LIMIT_ERROR_MESSAGE =
  'Hệ thống đang xử lý yêu cầu trước đó. Vui lòng đợi 30-60 giây trước khi gửi lượt tiếp theo.';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface SessionQuotaPayload {
  used: number;
  resetAt: number; // Unix epoch seconds
  day: string; // 'YYYY-MM-DD'
}

export interface ClientBucketEntry {
  dailyCount: number;
  dailyResetAt: number; // Unix epoch seconds
  burstTimestamps: number[];
  lastAccessed: number;
}

export interface RoastRateLimitResult {
  allowed: boolean;
  status: 200 | 429;
  limit: number;
  remaining: number;
  resetAt: number; // Unix epoch seconds
  retryAfterSeconds?: number;
  headers: Record<string, string>;
  error?: string;
  clientIpHash?: string;
  quotaCookieValue?: string;
  isPro?: boolean;
}

export interface RoastRateLimitOptions {
  customIp?: string;
  now?: number;
  consume?: boolean;
  store?: RoastMemoryStore;
  forceEnforce?: boolean;
  secret?: string;
  salt?: string;
}

export interface PayloadGuardResult {
  valid: boolean;
  error?: string;
  sanitizedLength?: number;
  truncatedText?: string;
  sanitizedText?: string;
}

// ============================================================================
// Tier 1: Payload Guard & Input Length Limiter
// ============================================================================

export function validateRoastPayload(cvText: string): PayloadGuardResult {
  if (!cvText || typeof cvText !== 'string') {
    return {
      valid: false,
      error: 'Văn bản CV không hợp lệ hoặc bị trống.',
    };
  }

  const trimmed = cvText.trim();
  if (trimmed.length < ROAST_MIN_PAYLOAD_CHARS) {
    return {
      valid: false,
      error:
        'Văn bản CV quá ngắn (tối thiểu 120 ký tự để phân tích đầy đủ, có thể tệp PDF của bạn là file scan ảnh không có chữ). Vui lòng bổ sung thông tin hoặc kiểm tra lại tệp tải lên.',
    };
  }

  // Maximum 5,000 characters for 1-page CV limit
  const truncatedText =
    trimmed.length > ROAST_MAX_PAYLOAD_CHARS
      ? trimmed.slice(0, ROAST_MAX_PAYLOAD_CHARS)
      : trimmed;

  return {
    valid: true,
    sanitizedLength: truncatedText.length,
    truncatedText,
    sanitizedText: truncatedText,
  };
}

// ============================================================================
// Secrets & Cryptographic Primitives
// ============================================================================

export function getRoastRateLimitSalt(): string {
  return (
    process.env.ROAST_RATE_LIMIT_SALT ||
    process.env.RATE_LIMIT_SALT ||
    'airoastcv_salt_roast_limiter_2026_secure'
  );
}

export function getRoastRateLimitSecret(): string {
  return (
    process.env.ROAST_RATE_LIMIT_SECRET ||
    process.env.RATE_LIMIT_SECRET ||
    'airoastcv_roast_hmac_secret_key_2026_super_safe'
  );
}

export function getNextUtcMidnightSeconds(nowMs = Date.now()): number {
  const d = new Date(nowMs);
  const next = Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate() + 1,
    0,
    0,
    0,
    0
  );
  return Math.floor(next / 1000);
}

export function getUtcDayString(nowMs = Date.now()): string {
  return new Date(nowMs).toISOString().split('T')[0];
}

// ============================================================================
// Zero-PII IP Extraction & SHA-256 Hashing
// ============================================================================

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
    const first = rawHeader.split(',')[0].trim();
    if (first) return first;
  }

  if (req && typeof (req as { ip?: string }).ip === 'string') {
    return (req as { ip: string }).ip;
  }

  return '127.0.0.1';
}

export function hashClientIp(
  clientIp: string,
  dateStr: string,
  salt = getRoastRateLimitSalt()
): string {
  const combined = `${clientIp}::${salt}::${dateStr}`;
  return crypto.createHash('sha256').update(combined).digest('hex');
}

// ============================================================================
// Tier 2: HMAC-SHA256 Signed Quota Cookie Carrier
// ============================================================================

export function signQuotaPayload(
  payload: SessionQuotaPayload,
  secret = getRoastRateLimitSecret()
): string {
  const jsonStr = JSON.stringify(payload);
  const dataB64 = Buffer.from(jsonStr, 'utf-8').toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(dataB64).digest('hex');
  return `${dataB64}.${signature}`;
}

export function verifyQuotaCookie(
  cookieRaw: string | undefined | null,
  secret = getRoastRateLimitSecret(),
  nowMs = Date.now()
): SessionQuotaPayload | null {
  if (!cookieRaw || typeof cookieRaw !== 'string') return null;

  const parts = cookieRaw.split('.');
  if (parts.length !== 2) return null;

  const [dataB64, signature] = parts;
  if (
    typeof signature !== 'string' ||
    signature.length !== 64 ||
    !/^[0-9a-f]{64}$/i.test(signature)
  ) {
    return null;
  }
  const expectedSig = crypto.createHmac('sha256', secret).update(dataB64).digest('hex');

  // Constant-time signature comparison to prevent timing attacks
  const sigBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expectedSig, 'hex');
  if (
    sigBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    return null; // Tampered cookie
  }

  try {
    const jsonStr = Buffer.from(dataB64, 'base64url').toString('utf-8');
    const parsed = JSON.parse(jsonStr) as SessionQuotaPayload;

    if (
      typeof parsed.used !== 'number' ||
      !Number.isInteger(parsed.used) ||
      parsed.used < 0 ||
      typeof parsed.resetAt !== 'number' ||
      typeof parsed.day !== 'string'
    ) {
      return null;
    }

    // Check expiration: has the resetAt timestamp passed?
    if (nowMs >= parsed.resetAt * 1000) {
      return null; // Expired, start fresh day
    }

    return parsed;
  } catch {
    return null;
  }
}

export function extractCookieFromHeader(
  cookieHeader: string | null | undefined,
  name: string
): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function buildSetCookieHeader(
  cookieValue: string,
  maxAgeSeconds = 86400
): string {
  return `${ROAST_QUOTA_COOKIE_NAME}=${cookieValue}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}; Secure`;
}

// ============================================================================
// Tier 3: In-Memory Salted Token Bucket & LRU Store
// ============================================================================

export class RoastMemoryStore {
  private entries = new Map<string, ClientBucketEntry>();
  private readonly maxEntries: number;
  private readonly ttlMs: number;

  constructor(maxEntries = DEFAULT_ROAST_LRU_MAX_ENTRIES, ttlMs = ROAST_ENTRY_TTL_MS) {
    this.maxEntries = maxEntries;
    this.ttlMs = ttlMs;
  }

  get(key: string, nowMs = Date.now()): ClientBucketEntry | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;

    // Check TTL
    if (nowMs - entry.lastAccessed > this.ttlMs || entry.dailyResetAt * 1000 <= nowMs) {
      this.entries.delete(key);
      return undefined;
    }

    // Move to end for LRU order
    this.entries.delete(key);
    this.entries.set(key, entry);
    return entry;
  }

  set(key: string, entry: ClientBucketEntry): void {
    if (this.entries.has(key)) {
      this.entries.delete(key);
    } else if (this.entries.size >= this.maxEntries) {
      this.evictOldest(Date.now());
    }
    this.entries.set(key, entry);
  }

  private evictOldest(nowMs: number): void {
    for (const [k, v] of this.entries.entries()) {
      if (nowMs - v.lastAccessed > this.ttlMs || v.dailyResetAt * 1000 <= nowMs) {
        this.entries.delete(k);
      }
      if (this.entries.size < this.maxEntries) return;
    }

    while (this.entries.size >= this.maxEntries) {
      const oldestKey = this.entries.keys().next().value;
      if (oldestKey !== undefined) {
        this.entries.delete(oldestKey);
      } else {
        break;
      }
    }
  }

  clear(): void {
    this.entries.clear();
  }

  size(): number {
    return this.entries.size;
  }
}

// Global default memory store for server lifecycle
export const defaultRoastMemoryStore = new RoastMemoryStore();

export function resetRoastLimiterForTesting(): void {
  defaultRoastMemoryStore.clear();
}

// ============================================================================
// Pro Exemption Check
// ============================================================================

export function isProRequest(req?: Request): boolean {
  if (!req) return false;

  let headers: Headers | undefined;
  if (typeof (req as Request).headers?.get === 'function') {
    headers = (req as Request).headers;
  }

  if (headers) {
    const proKeyHeader = headers.get('x-pro-license-key');
    if (proKeyHeader && proKeyHeader.trim().startsWith('PRO-')) return true;

    const authHeader = headers.get('authorization');
    if (authHeader && authHeader.includes('PRO-')) return true;

    const cookieHeader = headers.get('cookie');
    if (cookieHeader && cookieHeader.includes('rcv_pro_key=PRO-')) return true;
  }

  return false;
}

// ============================================================================
// Core Check Rate Limit Function
// ============================================================================

export function checkRoastRateLimit(
  req?: Request,
  options?: RoastRateLimitOptions
): RoastRateLimitResult {
  const nowMs = options?.now ?? Date.now();
  const consume = options?.consume ?? true;
  const store = options?.store ?? defaultRoastMemoryStore;
  const secret = options?.secret ?? getRoastRateLimitSecret();
  const salt = options?.salt ?? getRoastRateLimitSalt();

  // Test bypass condition: In test runs, bypass unless forced or customIp specified
  const isTestEnv = process.env.NODE_ENV === 'test';
  const hasEnforceHeader =
    typeof (req as Request)?.headers?.get === 'function' &&
    (req as Request).headers.get('x-enforce-rate-limit') === 'true';

  if (isTestEnv && !options?.forceEnforce && !hasEnforceHeader && !options?.customIp) {
    return {
      allowed: true,
      status: 200,
      limit: ROAST_DAILY_QUOTA,
      remaining: ROAST_DAILY_QUOTA,
      resetAt: getNextUtcMidnightSeconds(nowMs),
      headers: {
        'X-RateLimit-Limit': String(ROAST_DAILY_QUOTA),
        'X-RateLimit-Remaining': String(ROAST_DAILY_QUOTA),
        'X-RateLimit-Reset': String(getNextUtcMidnightSeconds(nowMs)),
      },
    };
  }

  // 1. Check Pro User status
  if (isProRequest(req)) {
    return {
      allowed: true,
      status: 200,
      limit: 9999,
      remaining: 9999,
      resetAt: getNextUtcMidnightSeconds(nowMs),
      isPro: true,
      headers: {
        'X-RateLimit-Limit': '9999',
        'X-RateLimit-Remaining': '9999',
        'X-RateLimit-Reset': String(getNextUtcMidnightSeconds(nowMs)),
      },
    };
  }

  const rawIp = options?.customIp ?? extractClientIp(req);
  const dayStr = getUtcDayString(nowMs);
  const nextMidnightSec = getNextUtcMidnightSeconds(nowMs);
  const ipHash = hashClientIp(rawIp, dayStr, salt);

  // 2. Read and verify Tier 2 Cookie Quota
  let cookieHeader: string | null = null;
  if (typeof (req as Request)?.headers?.get === 'function') {
    cookieHeader = (req as Request).headers.get('cookie');
  }
  const rawCookie = extractCookieFromHeader(cookieHeader, ROAST_QUOTA_COOKIE_NAME);
  const verifiedCookiePayload = verifyQuotaCookie(rawCookie, secret, nowMs);

  // 3. Read In-Memory Token Bucket Entry
  let memoryEntry = store.get(ipHash, nowMs);
  if (!memoryEntry) {
    memoryEntry = {
      dailyCount: 0,
      dailyResetAt: nextMidnightSec,
      burstTimestamps: [],
      lastAccessed: nowMs,
    };
  }

  // Synchronize Quota: take the maximum count between memory and signed cookie
  // (Prevents bypassing via incognito tab or clearing cookies)
  const currentDailyUsed = Math.max(
    memoryEntry.dailyCount,
    verifiedCookiePayload?.used ?? 0
  );

  // Clean stale burst timestamps older than 60s
  const recentBurstTimestamps = memoryEntry.burstTimestamps.filter(
    (ts) => nowMs - ts < ROAST_BURST_WINDOW_MS
  );

  // 4. Evaluate Limits
  // Check A: Burst Limit (2 req / 60s)
  if (recentBurstTimestamps.length >= ROAST_BURST_LIMIT) {
    const oldestBurst = recentBurstTimestamps[0];
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((ROAST_BURST_WINDOW_MS - (nowMs - oldestBurst)) / 1000)
    );

    return {
      allowed: false,
      status: 429,
      limit: ROAST_BURST_LIMIT,
      remaining: 0,
      resetAt: Math.floor((oldestBurst + ROAST_BURST_WINDOW_MS) / 1000),
      retryAfterSeconds,
      error: ROAST_BURST_LIMIT_ERROR_MESSAGE,
      clientIpHash: ipHash,
      headers: {
        'X-RateLimit-Limit': String(ROAST_BURST_LIMIT),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.floor((oldestBurst + ROAST_BURST_WINDOW_MS) / 1000)),
        'Retry-After': String(retryAfterSeconds),
      },
    };
  }

  // Check B: Daily Quota (5 req / 24h)
  if (currentDailyUsed >= ROAST_DAILY_QUOTA) {
    const retryAfterSeconds = Math.max(1, nextMidnightSec - Math.floor(nowMs / 1000));

    return {
      allowed: false,
      status: 429,
      limit: ROAST_DAILY_QUOTA,
      remaining: 0,
      resetAt: nextMidnightSec,
      retryAfterSeconds,
      error: ROAST_RATE_LIMIT_ERROR_MESSAGE,
      clientIpHash: ipHash,
      headers: {
        'X-RateLimit-Limit': String(ROAST_DAILY_QUOTA),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(nextMidnightSec),
        'Retry-After': String(retryAfterSeconds),
      },
    };
  }

  // 5. Consume Quota
  const newDailyUsed = consume ? currentDailyUsed + 1 : currentDailyUsed;
  const newBurstTimestamps = consume
    ? [...recentBurstTimestamps, nowMs]
    : recentBurstTimestamps;

  if (consume) {
    memoryEntry.dailyCount = newDailyUsed;
    memoryEntry.dailyResetAt = nextMidnightSec;
    memoryEntry.burstTimestamps = newBurstTimestamps;
    memoryEntry.lastAccessed = nowMs;
    store.set(ipHash, memoryEntry);
  }

  // Create new signed quota cookie
  const updatedQuotaPayload: SessionQuotaPayload = {
    used: newDailyUsed,
    resetAt: nextMidnightSec,
    day: dayStr,
  };
  const newSignedCookie = signQuotaPayload(updatedQuotaPayload, secret);
  const remaining = Math.max(0, ROAST_DAILY_QUOTA - newDailyUsed);

  return {
    allowed: true,
    status: 200,
    limit: ROAST_DAILY_QUOTA,
    remaining,
    resetAt: nextMidnightSec,
    clientIpHash: ipHash,
    quotaCookieValue: newSignedCookie,
    headers: {
      'X-RateLimit-Limit': String(ROAST_DAILY_QUOTA),
      'X-RateLimit-Remaining': String(remaining),
      'X-RateLimit-Reset': String(nextMidnightSec),
      'Set-Cookie': buildSetCookieHeader(newSignedCookie),
    },
  };
}

export function getRoastRateLimitHeaders(
  result: RoastRateLimitResult
): Record<string, string> {
  return result.headers;
}
