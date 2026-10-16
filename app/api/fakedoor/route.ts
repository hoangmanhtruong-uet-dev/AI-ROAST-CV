import { NextResponse } from 'next/server';
import { FakeDoorRequestSchema, type FakeDoorResponse } from '@/lib/schemas/fakedoor';
import { logger } from '@/lib/logger';
import { saveFakeDoorLead, getLeadsCount } from '@/lib/storage';

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json<FakeDoorResponse>(
        {
          success: false,
          message: 'Dữ liệu yêu cầu không hợp lệ (JSON required).',
          error: 'Dữ liệu yêu cầu không hợp lệ.',
        },
        { status: 400 }
      );
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json<FakeDoorResponse>(
        {
          success: false,
          message: 'Dữ liệu yêu cầu không hợp lệ.',
          error: 'Dữ liệu yêu cầu không hợp lệ.',
        },
        { status: 400 }
      );
    }

    const parseResult = FakeDoorRequestSchema.safeParse(body);
    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0]?.message || 'Dữ liệu email không hợp lệ.';
      return NextResponse.json<FakeDoorResponse>(
        {
          success: false,
          message: firstError,
          error: firstError,
        },
        { status: 400 }
      );
    }

    const { email, tier, featureInterest } = parseResult.data;
    const { lead, duplicated } = saveFakeDoorLead(email, tier, featureInterest);

    // Zero-PII server logging: only log masked email, never raw email
    logger.info('Fake Door Lead Captured', {
      tier,
      featureInterest,
      maskedEmail: lead.maskedEmail,
      duplicated,
      totalLeads: getLeadsCount(),
    });

    return NextResponse.json<FakeDoorResponse>(
      {
        success: true,
        message: 'Cảm ơn bạn đã quan tâm! Chúng tôi đã ghi nhận email quan tâm gói Pro 29.000đ.',
      },
      { status: 200 }
    );
  } catch (err) {
    logger.error('Failed to process fake door registration', err);
    return NextResponse.json<FakeDoorResponse>(
      {
        success: false,
        message: 'Đã có lỗi xảy ra trên hệ thống. Vui lòng thử lại sau.',
        error: 'Lỗi hệ thống',
      },
      { status: 500 }
    );
  }
}
