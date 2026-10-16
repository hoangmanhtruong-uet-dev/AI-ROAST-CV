/**
 * PII Redaction Engine (Milestone 4 - Features 22 & 24, Requirement R4)
 * Masks Vietnamese mobile phone numbers, email addresses, personal candidate names,
 * and portfolio / social URLs before data is exported, previewed, or logged.
 */

// 1. Vietnamese Phone Regex: Matches domestic (03x, 05x, 07x, 08x, 09x) & international (+84, 84, (+84), 0084)
export const VIETNAMESE_PHONE_REGEX =
  /(?:\+84|\(\+84\)|0084|\b84)(?:[\s.-]*(?:\(0\)|0))?[\s.-]*[35789][0-9](?:[\s.-]*[0-9]){7}\b|\b0[35789][0-9](?:[\s.-]*[0-9]){7}\b/g;

// 2. Email Regex: RFC-compliant standard email pattern
// Uses negative lookbehind to ensure already-masked emails (e.g. s***t@domain.com) are not re-masked
export const EMAIL_REGEX =
  /(?<![A-Za-z0-9._%*+-])[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

// 3. Full URL Regex (http / https)
export const FULL_URL_REGEX =
  /https?:\/\/[^\s<>"'{}|\\^`]+[^\s<>"'{}|\\^`.,;:?!()]/gi;

// 4. Portfolio / Social Profile Domain Regex (without http/https)
// Negative lookahead (?!@) ensures emails like user.dev@gmail.com are not mistaken for portfolio links
export const PROFILE_DOMAIN_REGEX =
  /\b(?:(?:github|linkedin|facebook|gitlab|behance|dribbble)\.com(?:\/(?:in\/)?[a-zA-Z0-9_.-]+)*|[a-zA-Z0-9_-]+\.(?:github\.io|vercel\.app|netlify\.app|dev)(?:\/[^\s<>"'{}|\\^`.,;:?!()]+)?|www\.[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s<>"'{}|\\^`.,;:?!()]+)?)\b(?!@)/gi;

// Combined URL Regex for general URL matching
export const URL_REGEX =
  /https?:\/\/[^\s<>"'{}|\\^`]+[^\s<>"'{}|\\^`.,;:?!()]|\b(?:(?:github|linkedin|facebook|gitlab|behance|dribbble)\.com(?:\/(?:in\/)?[a-zA-Z0-9_.-]+)*|[a-zA-Z0-9_-]+\.(?:github\.io|vercel\.app|netlify\.app|dev)(?:\/[^\s<>"'{}|\\^`.,;:?!()]+)?|www\.[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s<>"'{}|\\^`.,;:?!()]+)?)\b(?!@)/gi;

// 5. Common Vietnamese Surnames for Name Detection Heuristics
export const COMMON_VN_SURNAMES = new Set([
  'nguyễn', 'nguyen', 'trần', 'tran', 'lê', 'le', 'phạm', 'pham',
  'hoàng', 'hoang', 'huỳnh', 'huynh', 'phan', 'vũ', 'vu', 'võ', 'vo',
  'đặng', 'dang', 'bùi', 'bui', 'đỗ', 'do', 'hồ', 'ho', 'ngô', 'ngo',
  'dương', 'duong', 'lý', 'ly', 'đinh', 'dinh', 'đoàn', 'doan', 'lâm',
  'lam', 'mai', 'trịnh', 'trinh', 'lương', 'luong', 'thái', 'thai', 'hà', 'ha'
]);

// 6. Name Label Regex (Explicit field prefix in CV with optional colon or space)
export const NAME_LABEL_REGEX =
  /(?:(?:Họ\s*(?:và|&)?\s*tên|Họ\s*tên|Full\s*name|Name|Ứng\s*viên|Candidate)(?:\s*[:：\-]\s*|\s+))([A-ZÀ-Ỹ][a-zà-ỹA-ZÀ-Ỹ]+(?:\s+[A-ZÀ-Ỹ][a-zà-ỹA-ZÀ-Ỹ]+){1,4})/gi;

// 7. Self-intro phrase regex
export const NAME_INTRO_REGEX =
  /(?:(?:Tôi|Em|Mình)\s+(?:là|tên là)|Tên\s+(?:tôi|em|mình)\s+là|My name is|I am|I'm)\s+([A-ZÀ-Ỹ][a-zà-ỹA-ZÀ-Ỹ]+(?:\s+[A-ZÀ-Ỹ][a-zà-ỹA-ZÀ-Ỹ]+){1,3})/gi;

export interface RedactionSummary {
  phones: number;
  emails: number;
  urls: number;
  names: number;
  phone?: number;
  email?: number;
  url?: number;
  name?: number;
  [key: string]: number | undefined;
}

export interface RedactionResult {
  sanitizedText: string;
  redactedCount: number;
  redactionSummary: RedactionSummary;
}

/**
 * Masks a Vietnamese phone number to format 09****4567, 84****4321, or +84****5678
 */
export function maskPhoneNumber(phoneRaw: string): string {
  const digits = phoneRaw.replace(/\D/g, '');
  const last4 = digits.slice(-4);
  const trimmed = phoneRaw.trim();

  if (trimmed.startsWith('+84') || trimmed.startsWith('(+84)') || trimmed.startsWith('0084')) {
    return `+84****${last4}`;
  }
  if (trimmed.startsWith('84')) {
    return `84****${last4}`;
  }

  const prefix = digits.startsWith('0') ? digits.slice(0, 2) : '0' + digits.slice(0, 1);
  return `${prefix}****${last4}`;
}

/**
 * Masks an email to format n***a@gmail.com
 */
export function maskEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return '***@***';
  const [localPart, domain] = parts;

  if (localPart.length <= 1) {
    return `${localPart}***@${domain}`;
  }
  if (localPart.length === 2) {
    return `${localPart[0]}***${localPart[1]}@${domain}`;
  }
  return `${localPart[0]}***${localPart[localPart.length - 1]}@${domain}`;
}

/**
 * Masks a URL or profile domain to format [Link ẩn danh]
 */
export function maskUrl(_url: string): string {
  return '[Link ẩn danh]';
}

/**
 * Masks a candidate name to format [Họ tên ẩn danh]
 */
export function maskCandidateName(_name: string): string {
  return '[Họ tên ẩn danh]';
}

/**
 * Core PII redaction function.
 * Executes in strict safe order: URLs -> Emails -> Phones -> Names.
 */
export function redactPiiFromText(text: string): RedactionResult {
  if (!text || typeof text !== 'string') {
    const summary: RedactionSummary = {
      phones: 0,
      emails: 0,
      urls: 0,
      names: 0,
    };
    Object.defineProperties(summary, {
      phone: { get() { return this.phones; }, enumerable: false },
      email: { get() { return this.emails; }, enumerable: false },
      url: { get() { return this.urls; }, enumerable: false },
      name: { get() { return this.names; }, enumerable: false },
    });
    return {
      sanitizedText: '',
      redactedCount: 0,
      redactionSummary: summary,
    };
  }

  let sanitized = text;
  let urlCount = 0;
  let emailCount = 0;
  let phoneCount = 0;
  let nameCount = 0;
  const detectedNames = new Set<string>();

  // Step 1: Redact URLs (Full URLs & Profile Domains)
  sanitized = sanitized.replace(FULL_URL_REGEX, () => {
    urlCount++;
    return '[Link ẩn danh]';
  });
  sanitized = sanitized.replace(PROFILE_DOMAIN_REGEX, () => {
    urlCount++;
    return '[Link ẩn danh]';
  });

  // Step 2: Redact Emails
  sanitized = sanitized.replace(EMAIL_REGEX, (match) => {
    emailCount++;
    return maskEmail(match);
  });

  // Step 3: Redact Vietnamese Phone Numbers
  sanitized = sanitized.replace(VIETNAMESE_PHONE_REGEX, (match) => {
    phoneCount++;
    return maskPhoneNumber(match);
  });

  // Step 4: Redact Names via Explicit Labels (e.g. "Họ và tên: Nguyễn Văn An" or "Ứng viên Nguyễn Văn An")
  sanitized = sanitized.replace(NAME_LABEL_REGEX, (match, capturedName) => {
    const trimmedName = capturedName.trim();
    if (!trimmedName) return match;
    detectedNames.add(trimmedName);
    nameCount++;
    const prefix = match.slice(0, match.indexOf(capturedName));
    return `${prefix}[Họ tên ẩn danh]`;
  });

  // Step 5: Redact Names via Self-Introduction Phrases (e.g. "Tôi là Nguyễn Văn An, sinh viên...")
  sanitized = sanitized.replace(NAME_INTRO_REGEX, (match, capturedName) => {
    const trimmedName = capturedName.trim();
    if (!trimmedName) return match;
    detectedNames.add(trimmedName);
    nameCount++;
    const prefix = match.slice(0, match.indexOf(capturedName));
    return `${prefix}[Họ tên ẩn danh]`;
  });

  // Step 6: CV Header Line Heuristic (Inspect first 3 non-empty lines for candidate name banner)
  const lines = sanitized.split('\n');
  let checkedLines = 0;
  for (let i = 0; i < lines.length && checkedLines < 3; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;
    checkedLines++;

    const words = trimmed.split(/\s+/);
    if (words.length >= 2 && words.length <= 5) {
      const firstWordLower = words[0].toLowerCase();
      const isVnSurname = COMMON_VN_SURNAMES.has(firstWordLower);
      const isAllTitleOrUpper = words.every(
        (w) => /^[A-ZÀ-Ỹ]/.test(w) || w === w.toUpperCase()
      );
      const isNotKeyword = !/(?:CV|RESUME|CURRICULUM|DEVELOPER|ENGINEER|INTERN|FRESHER|MARKETING|DESIGNER|THÔNG TIN|MỤC TIÊU|HỌC VẤN|KINH NGHIỆM)/i.test(
        trimmed
      );

      if (isVnSurname && isAllTitleOrUpper && isNotKeyword) {
        detectedNames.add(trimmed);
        lines[i] = lines[i].replace(trimmed, '[Họ tên ẩn danh]');
        nameCount++;
        break; // Only mask top candidate name banner once
      }
    }
  }
  sanitized = lines.join('\n');

  // Step 7: Secondary sweep - Scrub any remaining occurrences of detected candidate names
  for (const name of detectedNames) {
    if (name.length >= 4 && !/\[Họ tên ẩn danh\]/i.test(name)) {
      // Escape for regex
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const namePattern = new RegExp(`\\b${escaped}\\b`, 'gi');
      if (namePattern.test(sanitized)) {
        sanitized = sanitized.replace(namePattern, '[Họ tên ẩn danh]');
      }
    }
  }

  const redactedCount = urlCount + emailCount + phoneCount + nameCount;

  const summary: RedactionSummary = {
    phones: phoneCount,
    emails: emailCount,
    urls: urlCount,
    names: nameCount,
  };

  Object.defineProperties(summary, {
    phone: { get() { return this.phones; }, enumerable: false },
    email: { get() { return this.emails; }, enumerable: false },
    url: { get() { return this.urls; }, enumerable: false },
    name: { get() { return this.names; }, enumerable: false },
  });

  return {
    sanitizedText: sanitized,
    redactedCount,
    redactionSummary: summary,
  };
}
