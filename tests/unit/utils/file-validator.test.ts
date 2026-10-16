import { describe, it, expect } from 'vitest';
import {
  validateCvBuffer,
  validateCvFile,
  MAX_FILE_SIZE_BYTES,
  detectMagicBytes,
} from '@/lib/utils/file-validator';

describe('File Validator Utility (Feature 8 & §R2)', () => {
  // Helper to construct binary buffers with specific magic bytes
  const createBuffer = (magicBytes: number[], totalLength: number = 64): Uint8Array => {
    const buffer = new Uint8Array(totalLength);
    buffer.set(magicBytes, 0);
    return buffer;
  };

  // Magic byte constants
  const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46]; // %PDF
  const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]; // \x89PNG\r\n\x1a\n
  const JPG_MAGIC_JFIF = [0xff, 0xd8, 0xff, 0xe0]; // JPEG JFIF
  const JPG_MAGIC_EXIF = [0xff, 0xd8, 0xff, 0xe1]; // JPEG EXIF

  describe('1. Valid Files <= 5MB', () => {
    it('accepts valid PDF file under 5MB', () => {
      const buffer = createBuffer(PDF_MAGIC, 1024);
      const result = validateCvBuffer(buffer, 'resume.pdf', 'application/pdf');

      expect(result.isValid).toBe(true);
      expect(result.fileType).toBe('pdf');
      expect(result.error).toBeUndefined();
    });

    it('accepts valid PNG image under 5MB', () => {
      const buffer = createBuffer(PNG_MAGIC, 2048);
      const result = validateCvBuffer(buffer, 'cv_screenshot.png', 'image/png');

      expect(result.isValid).toBe(true);
      expect(result.fileType).toBe('png');
      expect(result.error).toBeUndefined();
    });

    it('accepts valid JPG image under 5MB (JFIF and EXIF)', () => {
      const bufferJfif = createBuffer(JPG_MAGIC_JFIF, 4096);
      const resultJfif = validateCvBuffer(bufferJfif, 'photo.jpg', 'image/jpeg');
      expect(resultJfif.isValid).toBe(true);
      expect(resultJfif.fileType).toBe('jpeg');

      const bufferExif = createBuffer(JPG_MAGIC_EXIF, 4096);
      const resultExif = validateCvBuffer(bufferExif, 'scan.jpeg', 'image/jpeg');
      expect(resultExif.isValid).toBe(true);
      expect(resultExif.fileType).toBe('jpeg');
    });

    it('accepts file with case-insensitive extensions (.PDF, .PNG, .JPG, .JPEG)', () => {
      const pdfBuf = createBuffer(PDF_MAGIC, 100);
      expect(validateCvBuffer(pdfBuf, 'MY_CV.PDF', 'application/pdf').isValid).toBe(true);

      const pngBuf = createBuffer(PNG_MAGIC, 100);
      expect(validateCvBuffer(pngBuf, 'SCAN.Png', 'image/png').isValid).toBe(true);

      const jpgBuf = createBuffer(JPG_MAGIC_JFIF, 100);
      expect(validateCvBuffer(jpgBuf, 'PHOTO.JPG', 'image/jpeg').isValid).toBe(true);
    });
  });

  describe('2. File Size Boundary Limits (<= 5MB)', () => {
    it('accepts a file of exactly 5MB (5,242,880 bytes)', () => {
      const buffer = createBuffer(PDF_MAGIC, MAX_FILE_SIZE_BYTES);
      const result = validateCvBuffer(buffer, 'exact_5mb.pdf', 'application/pdf');

      expect(result.isValid).toBe(true);
      expect(result.sizeBytes).toBe(5242880);
    });

    it('rejects a file of 5MB + 1 byte (5,242,881 bytes)', () => {
      const oversizedBuffer = createBuffer(PDF_MAGIC, MAX_FILE_SIZE_BYTES + 1);
      const result = validateCvBuffer(oversizedBuffer, 'oversized.pdf', 'application/pdf');

      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/5MB/i);
    });

    it('rejects a large 10MB file', () => {
      const largeBuffer = createBuffer(PDF_MAGIC, 10 * 1024 * 1024);
      const result = validateCvBuffer(largeBuffer, 'large_cv.pdf', 'application/pdf');

      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/5MB/i);
    });

    it('rejects a 0-byte empty file', () => {
      const emptyBuffer = new Uint8Array(0);
      const result = validateCvBuffer(emptyBuffer, 'empty.pdf', 'application/pdf');

      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/rỗng|0 byte/i);
    });
  });

  describe('3. Magic Bytes Detection & Extension Spoofing Rejection', () => {
    it('detects magic bytes accurately with detectMagicBytes', () => {
      expect(detectMagicBytes(createBuffer(PDF_MAGIC))).toBe('pdf');
      expect(detectMagicBytes(createBuffer(PNG_MAGIC))).toBe('png');
      expect(detectMagicBytes(createBuffer(JPG_MAGIC_JFIF))).toBe('jpeg');
      expect(detectMagicBytes(new Uint8Array([0x00, 0x01]))).toBeNull();
    });

    it('rejects plain text file renamed to .pdf', () => {
      const textBuffer = new TextEncoder().encode('This is my plain text resume without PDF header');
      const result = validateCvBuffer(textBuffer, 'fake_resume.pdf', 'application/pdf');

      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/định dạng|magic byte|không hợp lệ/i);
    });

    it('rejects Windows executable (.exe) renamed to .pdf (MZ header)', () => {
      const exeBuffer = createBuffer([0x4d, 0x5a, 0x90, 0x00], 512); // MZ header
      const result = validateCvBuffer(exeBuffer, 'malicious.pdf', 'application/pdf');

      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/định dạng|không hỗ trợ|magic byte/i);
    });

    it('rejects corrupt header bytes (all zeros)', () => {
      const corruptBuffer = createBuffer([0x00, 0x00, 0x00, 0x00], 512);
      const result = validateCvBuffer(corruptBuffer, 'corrupt.pdf', 'application/pdf');

      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/không đúng định dạng|lỗi/i);
    });

    it('rejects extension mismatch (PDF bytes inside a .png file)', () => {
      const pdfBuffer = createBuffer(PDF_MAGIC, 512);
      const result = validateCvBuffer(pdfBuffer, 'misleading.png', 'image/png');

      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/không khớp/i);
    });

    it('rejects extension mismatch (PNG bytes inside a .pdf file)', () => {
      const pngBuffer = createBuffer(PNG_MAGIC, 512);
      const result = validateCvBuffer(pngBuffer, 'misleading.pdf', 'application/pdf');

      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/không khớp/i);
    });

    it('rejects unsupported extensions (.docx, .txt, .svg, .zip, .html)', () => {
      const dummyBuffer = createBuffer(PDF_MAGIC, 512);
      const unsupported = ['cv.docx', 'cv.txt', 'image.svg', 'archive.zip', 'page.html'];

      for (const fileName of unsupported) {
        const result = validateCvBuffer(dummyBuffer, fileName);
        expect(result.isValid).toBe(false);
        expect(result.error).toMatch(/hỗ trợ|định dạng/i);
      }
    });

    it('rejects SVG files with XML/SVG headers to prevent stored XSS', () => {
      const svgBuffer = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
      const result = validateCvBuffer(svgBuffer, 'xss.png', 'image/png');

      expect(result.isValid).toBe(false);
    });
  });

  describe('4. Async validateCvFile with Browser File API', () => {
    it('validates a browser File instance successfully', async () => {
      const buffer = createBuffer(PDF_MAGIC, 2048);
      const file = new File([buffer as unknown as BlobPart], 'browser_cv.pdf', { type: 'application/pdf' });

      const result = await validateCvFile(file);
      expect(result.isValid).toBe(true);
      expect(result.fileType).toBe('pdf');
    });

    it('rejects an oversized browser File instance', async () => {
      const largeBuffer = createBuffer(PNG_MAGIC, MAX_FILE_SIZE_BYTES + 100);
      const file = new File([largeBuffer as unknown as BlobPart], 'large_photo.png', { type: 'image/png' });

      const result = await validateCvFile(file);
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/5MB/i);
    });
  });
});
