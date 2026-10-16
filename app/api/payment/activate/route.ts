import { NextRequest, NextResponse } from 'next/server';
import { activateLicenseKey } from '@/lib/payment/service';

export async function POST(req: NextRequest) {
  try {
    const { licenseKey } = await req.json();

    if (!licenseKey || typeof licenseKey !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Vui lòng cung cấp mã kích hoạt licenseKey' },
        { status: 400 }
      );
    }

    const result = activateLicenseKey(licenseKey);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      isPro: true,
      licenseKey: result.key,
      message: result.message,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Lỗi hệ thống khi kích hoạt',
      },
      { status: 500 }
    );
  }
}
