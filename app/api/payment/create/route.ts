import { NextRequest, NextResponse } from 'next/server';
import { createPaymentOrder, MASTER_PACKAGE_PRICE, STARTER_PACKAGE_PRICE } from '@/lib/payment/service';
import { PackageTier } from '@/lib/payment/types';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    let tier: PackageTier | undefined;
    let customAmount: number | undefined;

    try {
      const body = await req.json();
      if (body) {
        if (body.tier === 'starter' || body.tier === 'master') {
          tier = body.tier;
        }
        if (typeof body.amount === 'number' && body.amount > 0) {
          customAmount = body.amount;
        }
      }
    } catch {
      // Body is optional
    }

    const order = createPaymentOrder(customAmount, tier);

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error) {
    logger.error('Failed to create payment order', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Không thể tạo đơn thanh toán. Vui lòng thử lại sau ít phút.',
      },
      { status: 500 }
    );
  }
}
