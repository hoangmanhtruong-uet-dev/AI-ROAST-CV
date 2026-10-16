/**
 * File validation utility for CV uploads.
 * Enforces <= 5MB file size limit, allowed extensions (.pdf, .png, .jpg, .jpeg),
 * and validates binary magic-byte signatures to prevent spoofing and stored XSS.
 */

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB (5,242,880 bytes)

export const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg'] as const;
export type AllowedExtension = (typeof ALLOWED_EXTENSIONS)[number];

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
] as const;

export interface FileValidationResult {
  valid: boolean;
  isValid: boolean; // Compatibility alias
  fileType?: 'pdf' | 'png' | 'jpeg';
  mimeType?: string;
  sizeBytes: number;
  pageCount?: number;
  error?: string;
}

/**
 * Detect file format via binary magic bytes.
 */
export function detectMagicBytes(
  buffer: Uint8Array | Buffer
): 'pdf' | 'png' | 'jpeg' | null {
  if (!buffer || buffer.length < 3) {
    return null;
  }

  // PDF: %PDF (0x25, 0x50, 0x44, 0x46)
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return 'pdf';
  }

  // PNG: \x89PNG\r\n\x1a\n (0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A)
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'png';
  }

  // JPEG: 0xFF, 0xD8, 0xFF
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return 'jpeg';
  }

  return null;
}

/**
 * Check if the buffer contains SVG/XML headers to prevent stored XSS attacks disguised as images.
 */
function isPotentialSvgOrHtml(buffer: Uint8Array | Buffer): boolean {
  try {
    const headLength = Math.min(buffer.length, 512);
    const headSlice = buffer.slice(0, headLength);
    const text = new TextDecoder('utf-8', { fatal: false }).decode(headSlice).toLowerCase();
    return (
      text.includes('<svg') ||
      text.includes('xmlns="http://www.w3.org/2000/svg"') ||
      text.includes('<html') ||
      text.includes('<script')
    );
  } catch {
    return false;
  }
}

/**
 * Estimate page count from PDF binary buffer using standard /Type /Page token search.
 */
export function estimatePdfPageCount(buffer: Uint8Array | Buffer): number {
  try {
    const binaryStr = Buffer.isBuffer(buffer)
      ? buffer.toString('latin1')
      : new TextDecoder('latin1').decode(buffer);
    const pageMatches = binaryStr.match(/\/Type\s*\/Page\b/g);
    return pageMatches ? Math.max(1, pageMatches.length) : 1;
  } catch {
    return 1;
  }
}

/**
 * Validates a CV buffer synchronously against size, extension, and magic-byte constraints.
 */
export function validateCvBuffer(
  buffer: Uint8Array | Buffer,
  fileName?: string,
  clientMimeType?: string
): FileValidationResult {
  const sizeBytes = buffer.length;

  if (sizeBytes === 0) {
    return {
      valid: false,
      isValid: false,
      sizeBytes: 0,
      error: 'Tệp tải lên rỗng (0 bytes). Vui lòng chọn tệp hợp lệ.',
    };
  }

  if (sizeBytes > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      isValid: false,
      sizeBytes,
      error: `Dung lượng tệp (${(sizeBytes / (1024 * 1024)).toFixed(2)}MB) vượt quá giới hạn tối đa 5MB.`,
    };
  }

  // Detect SVG or HTML payload spoofing
  if (isPotentialSvgOrHtml(buffer)) {
    return {
      valid: false,
      isValid: false,
      sizeBytes,
      error: 'Tệp chứa nội dung mã nguồn SVG hoặc HTML không an toàn.',
    };
  }

  // Validate extension if filename is provided
  let normalizedExt: string | null = null;
  if (fileName) {
    const lastDotIndex = fileName.lastIndexOf('.');
    if (lastDotIndex === -1) {
      return {
        valid: false,
        isValid: false,
        sizeBytes,
        error: 'Tệp không có phần mở rộng. Chỉ hỗ trợ định dạng PDF, PNG hoặc JPG/JPEG.',
      };
    }
    normalizedExt = fileName.substring(lastDotIndex).toLowerCase();
    const isAllowedExt = ALLOWED_EXTENSIONS.includes(normalizedExt as AllowedExtension);
    if (!isAllowedExt) {
      return {
        valid: false,
        isValid: false,
        sizeBytes,
        error: `Phần mở rộng "${normalizedExt}" không được hỗ trợ. Chỉ hỗ trợ định dạng PDF, PNG hoặc JPG/JPEG.`,
      };
    }
  }

  // Detect magic bytes
  const magicType = detectMagicBytes(buffer);
  if (!magicType) {
    return {
      valid: false,
      isValid: false,
      sizeBytes,
      error: 'Tệp không đúng định dạng hoặc bị lỗi magic byte. Chỉ chấp nhận tệp PDF, PNG hoặc JPG/JPEG.',
    };
  }

  // Cross-verify detected magic type with extension if provided
  if (normalizedExt) {
    const isPdfExt = normalizedExt === '.pdf';
    const isPngExt = normalizedExt === '.png';
    const isJpgExt = normalizedExt === '.jpg' || normalizedExt === '.jpeg';

    if (
      (magicType === 'pdf' && !isPdfExt) ||
      (magicType === 'png' && !isPngExt) ||
      (magicType === 'jpeg' && !isJpgExt)
    ) {
      return {
        valid: false,
        isValid: false,
        sizeBytes,
        error: `Chữ ký nhị phân của tệp (${magicType.toUpperCase()}) không khớp với phần mở rộng tệp (${normalizedExt}).`,
      };
    }
  }

  let mimeType: string;
  let pageCount = 1;

  if (magicType === 'pdf') {
    mimeType = 'application/pdf';
    pageCount = estimatePdfPageCount(buffer);
  } else if (magicType === 'png') {
    mimeType = 'image/png';
  } else {
    mimeType = 'image/jpeg';
  }

  return {
    valid: true,
    isValid: true,
    fileType: magicType,
    mimeType,
    sizeBytes,
    pageCount,
  };
}

/**
 * Flexible validateCvFile that accepts either a browser File instance or raw buffer.
 */
export async function validateCvFile(
  input: File | Uint8Array | Buffer,
  clientMimeTypeOrFileName?: string,
  fileName?: string
): Promise<FileValidationResult> {
  // If input is a browser File or Blob
  if (typeof (input as File).arrayBuffer === 'function') {
    const file = input as File;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    return validateCvBuffer(buffer, file.name, file.type);
  }

  // Otherwise, input is Buffer or Uint8Array
  const buffer = input as Uint8Array | Buffer;
  const mime = typeof clientMimeTypeOrFileName === 'string' && clientMimeTypeOrFileName.includes('/')
    ? clientMimeTypeOrFileName
    : undefined;
  const name = fileName || (typeof clientMimeTypeOrFileName === 'string' && !clientMimeTypeOrFileName.includes('/') ? clientMimeTypeOrFileName : undefined);

  return validateCvBuffer(buffer, name, mime);
}
