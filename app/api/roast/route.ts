import { NextRequest, NextResponse } from 'next/server';
import { roastRequestSchema, RoastApiResponse } from '@/lib/schemas/roast';
import { generateRoast } from '@/lib/gemini/roast';
import { logger } from '@/lib/logger';
import { checkRoastRateLimit, validateRoastPayload } from '@/lib/rate-limit/roast-limiter';
import { maskPii } from '@/lib/utils/pii-masker';

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

    const { cvText, tone, targetRole, jdText } = parseResult.data;

    // Tier 1: Payload Guard (CV text minimum 120 chars, maximum 5,000 chars 1-page CV truncation)
    const payloadCheck = validateRoastPayload(cvText);
    if (!payloadCheck.valid) {
      logger.warn('Roast API: Payload guard validation failed', { error: payloadCheck.error });
      return NextResponse.json({ success: false, error: payloadCheck.error }, { status: 400 });
    }

    // Rate Limiting Enforcement (Burst 2 req/60s, Daily 5 req/24h)
    const rateLimit = checkRoastRateLimit(req);
    if (!rateLimit.allowed) {
      logger.warn('Roast API: Rate limit exceeded', {
        remaining: rateLimit.remaining,
        resetAt: rateLimit.resetAt,
      });

      return NextResponse.json(
        {
          success: false,
          error:
            rateLimit.error ||
            'Bạn đã sử dụng hết 5 lượt Roast CV miễn phí trong hôm nay. Hãy tối ưu CV thật kỹ rồi quay lại vào ngày mai nhé!',
        },
        {
          status: 429,
          headers: rateLimit.headers,
        }
      );
    }

    // Defense-in-depth: Ensure server-side PII sanitization before prompt generation
    const textToSanitize = payloadCheck.sanitizedText || payloadCheck.truncatedText || cvText;
    const sanitizedCvText = maskPii(textToSanitize).sanitizedText;

    // Defense-in-depth: Ensure server-side PII sanitization on Job Description (JD) text
    let sanitizedJdText: string | undefined = undefined;
    if (jdText && typeof jdText === 'string') {
      const trimmedJd = jdText.trim();
      if (trimmedJd.length > 0) {
        sanitizedJdText = maskPii(trimmedJd).sanitizedText;
      }
    }

    // Zero-PII Server Logging: NEVER log raw cvText or jdText
    logger.info('Roast API: Starting roast generation', {
      tone,
      cvLength: sanitizedCvText.length,
      hasTargetRole: Boolean(targetRole),
      hasJd: Boolean(sanitizedJdText),
      jdLength: sanitizedJdText ? sanitizedJdText.length : 0,
    });

    let roastData;
    try {
      roastData = await generateRoast({
        cvText: sanitizedCvText,
        tone,
        targetRole,
        jdText: sanitizedJdText,
      });
    } catch (aiError) {
      logger.error('Roast API: Gemini generation error', aiError);
      const detail = aiError instanceof Error ? aiError.message : String(aiError);
      return NextResponse.json(
        {
          success: false,
          error: `Hệ thống AI phản hồi không hợp lệ: ${detail}`,
        },
        { status: 502 }
      );
    }

    logger.info('Roast API: Roast generated successfully', {
      tone,
      overallScore: roastData.overallScore,
      weaknessCount: roastData.weaknesses.length,
      hasJdMatch: Boolean(roastData.jdMatch),
      durationMs: Date.now() - startTime,
    });

    const response = NextResponse.json({
      success: true,
      data: roastData,
    });

    // Attach rate limit headers / Set-Cookie to response
    for (const [key, value] of Object.entries(rateLimit.headers)) {
      response.headers.set(key, value);
    }

    return response;
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
