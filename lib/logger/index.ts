/**
 * Zero-PII Server-side Logger (Hardened for Milestone 4 - Feature 22)
 * Guarantees that raw CV content, candidate answers, and sensitive PII
 * are NEVER emitted to server stdout or stderr.
 */

import { redactPiiFromText } from '@/lib/utils/pii-redactor';

export const FORBIDDEN_LOG_KEYS = new Set([
  'cvtext',
  'text',
  'extractedtext',
  'rawtext',
  'file',
  'buffer',
  'filebuffer',
  'candidateanswer',
  'answer',
  'email',
  'unmaskedemail',
  'phone',
  'unmaskedphone',
  'prompt',
  'contents',
  'response',
  'body',
  'data',
  'rawpiitext',
  'cvcontent',
  'userinput',
  'originaltext',
  'filename',
  'quote',
  'cvcontext',
  'originalquote',
  'rewrittentext',
  'rewrittencontent',
  'cvrewrite',
  'candidatequote',
  'jd',
  'jdtext',
  'jobdescription',
  'customjd',
  'rewrite',
  'suggestion',
  // Milestone 3 Additions for Live Roast Teaser
  'sentence',
  'teaser',
  'experiencesentence',
  'roastcomment',
  'atsrewrite',
  'originalsentence',
  'teasersentence',
  'roastteaser',
]);

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[-_]/g, '');
}

function sanitizeValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;

  if (typeof value === 'string') {
    // Redact sensitive patterns from arbitrary string values in meta
    return redactPiiFromText(value).sanitizedText;
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (typeof value === 'object') {
    return sanitizeMeta(value as Record<string, unknown>);
  }

  return value;
}

export function sanitizeMeta(meta?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!meta) return undefined;
  const clean: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(meta)) {
    const normalized = normalizeKey(key);
    if (FORBIDDEN_LOG_KEYS.has(normalized)) {
      clean[key] = '[REDACTED_PII]';
    } else {
      clean[key] = sanitizeValue(value);
    }
  }

  return clean;
}

function sanitizeMessage(msg: string): string {
  if (!msg) return '';
  return redactPiiFromText(msg).sanitizedText;
}

function sanitizeError(error?: unknown): string {
  if (!error) return 'None';
  const rawMsg = error instanceof Error ? error.message : String(error);
  // Redact PII from error messages and cap length to prevent payload leakage
  const sanitized = redactPiiFromText(rawMsg).sanitizedText;
  return sanitized.length > 500 ? `${sanitized.slice(0, 500)}... [truncated]` : sanitized;
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();
    const cleanMsg = sanitizeMessage(message);
    const sanitized = sanitizeMeta(meta);
    console.log(`[INFO] ${timestamp} - ${cleanMsg}`, sanitized ? JSON.stringify(sanitized) : '');
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();
    const cleanMsg = sanitizeMessage(message);
    const sanitized = sanitizeMeta(meta);
    console.warn(`[WARN] ${timestamp} - ${cleanMsg}`, sanitized ? JSON.stringify(sanitized) : '');
  },
  error: (message: string, error?: unknown) => {
    const timestamp = new Date().toISOString();
    const cleanMsg = sanitizeMessage(message);
    const cleanDetails = sanitizeError(error);
    console.error(`[ERROR] ${timestamp} - ${cleanMsg} | Details: ${cleanDetails}`);
  },
};
