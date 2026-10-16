import { NextResponse } from 'next/server';
import { rewriteRequestSchema, RewriteApiResponse } from '@/lib/schemas/rewrite';
import { generateRewrite } from '@/lib/gemini/rewrite';
import { logger } from '@/lib/logger';

export async function POST(req: Request): Promise<NextResponse<RewriteApiResponse>> {
  const startTime = Date.now();

  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: 'Yêu cầu không chứa dữ liệu JSON hợp lệ.' },
        { status: 400 }
      );
    }

    const parseResult = rewriteRequestSchema.safeParse(body);
    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0]?.message || 'Dữ liệu yêu cầu không hợp lệ.';
      logger.warn('Rewrite API: Validation failed', { error: firstError });
      return NextResponse.json({ success: false, error: firstError }, { status: 400 });
    }

    const { quote, issue, rejectionReason, targetRole, cvContext } = parseResult.data;

    // Zero-PII Server Logging: NEVER log raw quote or cvContext
    logger.info('Rewrite API: Starting ATS rewrite generation', {
      quoteLength: quote.length,
      hasIssue: Boolean(issue),
      hasRejectionReason: Boolean(rejectionReason),
      hasTargetRole: Boolean(targetRole),
      cvContextLength: cvContext ? cvContext.length : 0,
    });

    let rewriteData;
    try {
      rewriteData = await generateRewrite({
        quote,
        issue,
        rejectionReason,
        targetRole,
        cvContext,
      });
    } catch (aiError) {
      logger.error('Rewrite API: Gemini generation error', aiError);
      return NextResponse.json(
        {
          success: false,
          error:
            'Hệ thống AI không thể tạo đoạn viết lại CV hoặc phản hồi không hợp lệ. Vui lòng thử lại sau.',
        },
        { status: 502 }
      );
    }

    logger.info('Rewrite API: Rewrite generated successfully', {
      durationMs: Date.now() - startTime,
      atsKeywordCount: rewriteData.atsKeywords.length,
    });

    return NextResponse.json({
      success: true,
      data: rewriteData,
    });
  } catch (error) {
    logger.error('Rewrite API: Unexpected fatal error', error);
    return NextResponse.json(
      {
        success: false,
        error:
          'Đã xảy ra lỗi máy chủ trong quá trình xử lý yêu cầu viết lại CV. Vui lòng thử lại sau.',
      },
      { status: 500 }
    );
  }
}
