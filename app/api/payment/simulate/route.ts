import { NextRequest, NextResponse } from 'next/server';
import { simulateSandboxPayment } from '@/lib/payment/service';

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();

    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Thiếu mã đơn hàng orderId hợp lệ' },
        { status: 400 }
      );
    }

    const result = simulateSandboxPayment(orderId);

    if (!result.success || !result.order) {
      return NextResponse.json(
        { success: false, error: result.error || 'Không thể mô phỏng thanh toán' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Mô phỏng thanh toán thành công (Sandbox Mode)',
      orderId: result.order.orderId,
      status: result.order.status,
      licenseKey: result.order.licenseKey,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Lỗi hệ thống',
      },
      { status: 500 }
    );
  }
}
