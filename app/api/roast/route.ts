import { NextRequest, NextResponse } from 'next/server';
import { roastRequestSchema, RoastApiResponse } from '@/lib/schemas/roast';
import { generateRoast } from '@/lib/gemini/roast';
import { logger } from '@/lib/logger';

export async function POST(req: Request): Promise<NextResponse<RoastApiResponse>> {
  const startTime = Date.now();

  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: 'Yêu cầu không chứa dữ liệu JSON hợp lệ.' },
        { status: 400 }
      );
    }

    const parseResult = roastRequestSchema.safeParse(body);
    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0]?.message || 'Dữ liệu yêu cầu không hợp lệ.';
      logger.warn('Roast API: Validation failed', { error: firstError });
      return NextResponse.json({ success: false, error: firstError }, { status: 400 });
    }

    const { cvText, tone, targetRole } = parseResult.data;

    // Zero-PII Server Logging: NEVER log raw cvText
    logger.info('Roast API: Starting roast generation', {
      tone,
      cvLength: cvText.length,
      hasTargetRole: Boolean(targetRole),
    });

    let roastData;
    try {
      roastData = await generateRoast({
        cvText,
        tone,
        targetRole,
      });
    } catch (aiError) {
      logger.error('Roast API: Gemini generation error', aiError);
      return NextResponse.json(
        {
          success: false,
          error: 'Hệ thống AI phản hồi không hợp lệ hoặc xảy ra lỗi xử lý. Vui lòng thử lại sau.',
        },
        { status: 502 }
      );
    }

    logger.info('Roast API: Roast generated successfully', {
      tone,
      overallScore: roastData.overallScore,
      weaknessCount: roastData.weaknesses.length,
      durationMs: Date.now() - startTime,
    });

    return NextResponse.json({
      success: true,
      data: roastData,
    });
  } catch (error) {
    logger.error('Roast API: Unexpected fatal error', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Đã xảy ra lỗi máy chủ trong quá trình xử lý yêu cầu. Vui lòng thử lại sau.',
      },
      { status: 500 }
    );
  }
}
