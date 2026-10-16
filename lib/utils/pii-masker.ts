/**
 * Client-Side PII Masking Engine (Milestone 7 / Requirement R1)
 *
 * Masks Vietnamese mobile numbers, Email addresses, 12-digit Citizen IDs (CCCD 001-096),
 * 9-digit CMND with explicit prefixes, and portfolio / social links before payload transmission.
 *
 * Guaranteed Invariants:
 * 1. Sanitizes personal PII into structured redacted tokens:
 *    [PHONE_REDACTED], [EMAIL_REDACTED], [ID_REDACTED], [URL_REDACTED].
 * 2. Never masks factual technical metrics or business numbers:
 *    "100.000 users", "15.000.000 VNĐ", "35%", "2022-2026", "500ms".
 * 3. Provides clean preview strings (e.g. "ngu***@gmail.com", "098****123", "001099******")
 *    for user review in UI chips.
 */

export type PiiType = 'phone' | 'email' | 'id' | 'url';

export interface MaskingStats {
  phones: number;
  emails: number;
  ids: number;
  urls: number;
  total: number;
}

export interface DetectedPiiItem {
  type: PiiType;
  preview: string;
  count: number;
}

export interface MaskingResult {
  sanitizedText: string;
  stats: MaskingStats;
  detectedItems: DetectedPiiItem[];
}

// ============================================================================
// Regular Expressions
// ============================================================================

// 1. URLs & Social / Portfolio Domains
export const FULL_URL_REGEX =
  /https?:\/\/[^\s<>"'{}|\\^`]+[^\s<>"'{}|\\^`.,;:?!()]/gi;

export const PORTFOLIO_DOMAIN_REGEX =
  /(?<!@)\b(?:(?:github|linkedin|facebook|gitlab|behance|dribbble)\.com(?:\/(?:in\/)?[a-zA-Z0-9_.-]+)*|[a-zA-Z0-9_-]+\.(?:github\.io|vercel\.app|netlify\.app|dev)(?:\/[^\s<>"'{}|\\^`.,;:?!()]+)?|www\.[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s<>"'{}|\\^`.,;:?!()]+)?)\b(?!@)/gi;

// 2. Email Regex (Negative lookbehind avoids re-masking [EMAIL_REDACTED] or already masked strings)
export const EMAIL_REGEX =
  /(?<![A-Za-z0-9._%*+-])[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/gi;

// 3. Citizen IDs (CCCD 12 digits: 001-096 province code, [0-3] century/gender, 2-digit birth year, 6 random digits)
export const CCCD_12_DIGIT_REGEX =
  /(?<!\d)(0(?:0[1-9]|[1-8][0-9]|9[0-6])[0-3]\d{8})(?!\d)/g;

// 3b. CMND/CCCD with explicit identification prefix and optional modifiers (9 to 12 digits)
export const ID_WITH_PREFIX_REGEX =
  /(?:(?:số\s+)?(?:cmnd|cccd|căn\s*cước(?:\s*công\s*dân)?|chứng\s*minh|định\s*danh|id\s*card|passport)(?:\s*(?:\([^)]*\)|cũ|mới|gốc|tạm|nhân\s*dân|số))?\s*[:\-–—.]?\s*)(\d{9,12})\b/gi;

// 4. Vietnamese Mobile Phone Numbers
// Prefixes: 03[2-9], 05[25689], 07[06-9], 08[1-9], 09[0-46-9]
// International: +84, (+84), 0084, 84 followed by same prefixes without leading 0
export const VN_PHONE_REGEX =
  /(?<!\d)(?:(?:\+84|\(\+84\)|0084|\b84)(?:[\s.-]*(?:\(0\)|0))?[\s.-]*(?:3[2-9]|5[25689]|7[06-9]|8[1-9]|9[0-46-9])(?:[\s.-]*\d){7}\b|\b0(?:3[2-9]|5[25689]|7[06-9]|8[1-9]|9[0-46-9])(?:[\s.-]*\d){7}\b)(?!\d)/g;

// ============================================================================
// Preview Formatters
// ============================================================================

export function previewEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return '***@***';
  const [local, domain] = parts;
  if (local.length <= 2) {
    return `${local}***@${domain}`;
  }
  if (local.length <= 4) {
    return `${local.slice(0, 2)}***@${domain}`;
  }
  return `${local.slice(0, 3)}***@${domain}`;
}

export function previewPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const trimmed = phone.trim();
  const isIntl = trimmed.startsWith('+84') || trimmed.startsWith('0084') || trimmed.startsWith('(+84)');

  if (digits.length >= 9) {
    const prefix = isIntl ? '+84' : digits.slice(0, 3);
    const suffix = digits.slice(-3);
    return `${prefix}****${suffix}`;
  }
  return '098****123';
}

export function previewId(idStr: string): string {
  const digits = idStr.replace(/\D/g, '');
  if (digits.length === 12) {
    return `${digits.slice(0, 6)}******`;
  }
  if (digits.length >= 9) {
    return `${digits.slice(0, 3)}****${digits.slice(-3)}`;
  }
  return 'ID_REDACTED';
}

export function previewUrl(urlStr: string): string {
  const clean = urlStr.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
  if (clean.length > 24) {
    return `${clean.slice(0, 20)}...`;
  }
  return clean;
}

// ============================================================================
// Core Masking Function
// ============================================================================

export function maskPii(text: string): MaskingResult {
  if (!text || typeof text !== 'string') {
    return {
      sanitizedText: '',
      stats: { phones: 0, emails: 0, ids: 0, urls: 0, total: 0 },
      detectedItems: [],
    };
  }

  let sanitized = text;
  const itemsMap = new Map<string, DetectedPiiItem>();

  const recordItem = (type: PiiType, preview: string) => {
    const key = `${type}::${preview}`;
    const existing = itemsMap.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      itemsMap.set(key, { type, preview, count: 1 });
    }
  };

  // Step 1: Mask Full URLs (https?://)
  sanitized = sanitized.replace(FULL_URL_REGEX, (match) => {
    recordItem('url', previewUrl(match));
    return '[URL_REDACTED]';
  });

  // Step 2: Mask Emails (Processed BEFORE PORTFOLIO_DOMAIN_REGEX to avoid username leakage)
  sanitized = sanitized.replace(EMAIL_REGEX, (match) => {
    recordItem('email', previewEmail(match));
    return '[EMAIL_REDACTED]';
  });

  // Step 3: Mask Portfolio Domains
  sanitized = sanitized.replace(PORTFOLIO_DOMAIN_REGEX, (match) => {
    recordItem('url', previewUrl(match));
    return '[URL_REDACTED]';
  });

  // Step 4: Mask CMND/CCCD with Prefix
  sanitized = sanitized.replace(ID_WITH_PREFIX_REGEX, (match, digits) => {
    recordItem('id', previewId(digits));
    // Keep prefix label to preserve syntactic context for ATS parsing
    const prefix = match.slice(0, match.length - digits.length);
    return `${prefix}[ID_REDACTED]`;
  });

  // Step 5: Mask Standalone 12-digit CCCD
  sanitized = sanitized.replace(CCCD_12_DIGIT_REGEX, (match) => {
    recordItem('id', previewId(match));
    return '[ID_REDACTED]';
  });

  // Step 6: Mask Vietnamese Mobile Phones
  sanitized = sanitized.replace(VN_PHONE_REGEX, (match) => {
    recordItem('phone', previewPhone(match));
    return '[PHONE_REDACTED]';
  });

  const detectedItems = Array.from(itemsMap.values());

  const stats: MaskingStats = {
    phones: detectedItems.filter((i) => i.type === 'phone').reduce((acc, i) => acc + i.count, 0),
    emails: detectedItems.filter((i) => i.type === 'email').reduce((acc, i) => acc + i.count, 0),
    ids: detectedItems.filter((i) => i.type === 'id').reduce((acc, i) => acc + i.count, 0),
    urls: detectedItems.filter((i) => i.type === 'url').reduce((acc, i) => acc + i.count, 0),
    total: 0,
  };
  stats.total = stats.phones + stats.emails + stats.ids + stats.urls;

  return {
    sanitizedText: sanitized,
    stats,
    detectedItems,
  };
}

// Functional Alias for compatibility
export const maskCVPII = maskPii;
