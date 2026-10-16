import { NextRequest, NextResponse } from 'next/server';
import { validateCvBuffer } from '@/lib/utils/file-validator';
import { extractJsonRequestSchema, ExtractApiResponse } from '@/lib/schemas/extract';
import { extractCvText } from '@/lib/gemini/extract';
import { logger } from '@/lib/logger';

export async function POST(req: Request): Promise<NextResponse<ExtractApiResponse>> {
  const startTime = Date.now();
  const contentType = req.headers.get('content-type') || '';

  try {
    // Mode A: Multipart Form Data (PDF, PNG, JPG file upload)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file');

      if (!file || typeof file === 'string' || typeof (file as any).arrayBuffer !== 'function') {
        logger.warn('Extract API: Missing file in formData');
        return NextResponse.json(
          { success: false, error: 'Không tìm thấy tệp đính kèm trong yêu cầu.' },
          { status: 400 }
        );
      }

      const fileName = file instanceof File ? file.name : 'upload.bin';
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const validation = validateCvBuffer(buffer, fileName, file.type);
      if (!validation.valid || !validation.mimeType) {
        logger.warn('Extract API: File validation rejected', {
          fileSizeBytes: buffer.length,
          error: validation.error,
        });
        return NextResponse.json(
          { success: false, error: validation.error || 'Tệp không hợp lệ.' },
          { status: 400 }
        );
      }

      // Check 1-page restriction for PDF
      if (validation.pageCount && validation.pageCount > 1) {
        logger.warn('Extract API: PDF page limit exceeded', { pageCount: validation.pageCount });
        return NextResponse.json(
          {
            success: false,
            pageCount: validation.pageCount,
            error: `CV vượt quá giới hạn 1 trang (phát hiện ${validation.pageCount} trang). Vui lòng tối ưu CV thành 1 trang để đạt hiệu quả cao nhất.`,
          },
          { status: 400 }
        );
      }

      // Safe metadata logging: ZERO PII
      logger.info('Extract API: Processing file', {
        fileType: validation.fileType,
        fileSizeBytes: validation.sizeBytes,
        pageCount: validation.pageCount,
      });

      const extractedText = await extractCvText({
        buffer,
        mimeType: validation.mimeType,
      });

      logger.info('Extract API: Extraction successful', {
        fileType: validation.fileType,
        charCount: extractedText.length,
        durationMs: Date.now() - startTime,
      });

      return NextResponse.json({
        success: true,
        extractedText,
        pageCount: validation.pageCount || 1,
      });
    }

    // Mode B: JSON Text Input (Direct Paste)
    if (contentType.includes('application/json')) {
      const body = await req.json().catch(() => null);
      if (!body) {
        return NextResponse.json(
          { success: false, error: 'Yêu cầu không chứa dữ liệu JSON hợp lệ.' },
          { status: 400 }
        );
      }

      const parseResult = extractJsonRequestSchema.safeParse(body);
      if (!parseResult.success) {
        const errorMsg = parseResult.error.errors[0]?.message || 'Dữ liệu văn bản không hợp lệ.';
        logger.warn('Extract API: JSON text validation failed', { errorMsg });
        return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
      }

      const { text } = parseResult.data;
      logger.info('Extract API: Direct text processed', {
        charCount: text.length,
        durationMs: Date.now() - startTime,
      });

      return NextResponse.json({
        success: true,
        extractedText: text.trim(),
        pageCount: 1,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error:
          'Định dạng yêu cầu không được hỗ trợ. Vui lòng gửi multipart/form-data hoặc application/json.',
      },
      { status: 415 }
    );
  } catch (error) {
    logger.error('Extract API: Unexpected error', error);
    return NextResponse.json(
      { success: false, error: 'Đã xảy ra lỗi khi trích xuất văn bản. Vui lòng thử lại sau.' },
      { status: 500 }
    );
  }
}
