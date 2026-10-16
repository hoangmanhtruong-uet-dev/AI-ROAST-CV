import { NextResponse } from 'next/server';
import {
  roastTeaserRequestSchema,
  RoastTeaserApiResponse,
} from '@/lib/schemas/roast-teaser';
import { generateRoastTeaser } from '@/lib/gemini/teaser';
import {
  checkTeaserRateLimit,
  getClientIp,
  getRateLimitHeaders,
} from '@/lib/rate-limit/teaser-limiter';
import { findPresetMatch } from '@/lib/data/teaser-presets';
import { logger } from '@/lib/logger';

export async function POST(req: Request): Promise<NextResponse<RoastTeaserApiResponse>> {
  const startTime = Date.now();
  const clientIp = getClientIp(req);

  try {
    // 1. Parse JSON body
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: 'Yêu cầu không chứa dữ liệu JSON hợp lệ.' },
        { status: 400 }
      );
    }

    // 2. Validate input schema (10 - 250 characters)
    const parseResult = roastTeaserRequestSchema.safeParse(body);
    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0]?.message || 'Dữ liệu yêu cầu không hợp lệ.';
      logger.warn('Roast Teaser API: Validation failed', { error: firstError });
      return NextResponse.json({ success: false, error: firstError }, { status: 400 });
    }

    const { sentence } = parseResult.data;
    const isPreset = Boolean(findPresetMatch(sentence));

    // 3. Check Dual-Layer Rate Limit (3 calls / day)
    const rateLimit = checkTeaserRateLimit(req, { customIp: clientIp, consume: true });

    if (!rateLimit.allowed) {
      logger.warn('Roast Teaser API: Rate limit exceeded', {
        remainingCalls: 0,
      });

      return NextResponse.json(
        {
          success: false,
          error:
            rateLimit.error ||
            'Bạn đã sử dụng hết 3 lượt thử nghiệm miễn phí hôm nay. Vui lòng quay lại vào ngày mai hoặc nâng cấp Pro để mở khóa toàn bộ tính năng!',
          remainingCalls: 0,
          resetAt: rateLimit.resetAt,
        },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimit),
        }
      );
    }

    // 4. Zero-PII Server Logging: NEVER log sentence or candidate text
    logger.info('Roast Teaser API: Request received', {
      sentenceLength: sentence.length,
      isPreset,
      remainingCalls: rateLimit.remaining,
    });

    // 5. Generate Teaser (Instant cache, remote Gemini, or deterministic fallback)
    const result = await generateRoastTeaser(sentence);

    const durationMs = Date.now() - startTime;

    logger.info('Roast Teaser API: Completed successfully', {
      isPreset: result.isPreset,
      isFallback: result.isFallback,
      durationMs,
      remainingCalls: rateLimit.remaining,
    });

    return NextResponse.json(
      {
        success: true,
        data: result.data,
        isFallback: result.isFallback,
        isPreset: result.isPreset,
        remainingCalls: rateLimit.remaining,
        durationMs,
      },
      {
        status: 200,
        headers: getRateLimitHeaders(rateLimit),
      }
    );
  } catch (error) {
    logger.error('Roast Teaser API: Unexpected fatal error', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Đã xảy ra lỗi hệ thống trong quá trình phân tích câu kinh nghiệm. Vui lòng thử lại sau.',
      },
      { status: 500 }
    );
  }
}
