'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  QrCode,
  Copy,
  Check,
  CheckCircle2,
  Sparkles,
  Zap,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Crown,
  CheckCheck,
} from 'lucide-react';
import { PackageTier, PaymentOrder } from '@/lib/payment/types';
import { useProTier } from '@/lib/payment/entitlement';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenActivateModal?: () => void;
  initialTier?: PackageTier;
}

export function CheckoutModal({
  isOpen,
  onClose,
  onOpenActivateModal,
  initialTier = 'starter',
}: CheckoutModalProps) {
  const [selectedTier, setSelectedTier] = useState<PackageTier>(initialTier);
  const [order, setOrder] = useState<PaymentOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(900); // 15 mins
  const [isSimulating, setIsSimulating] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [issuedKey, setIssuedKey] = useState<string | null>(null);

  const { activatePro } = useProTier();
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const createOrderForTier = useCallback(async (tier: PackageTier) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier,
          amount: tier === 'master' ? 99000 : 29000,
        }),
      });
      const data = await res.json();
      if (data.success && data.order) {
        setOrder(data.order);
        setTimeLeft(Math.max(0, Math.floor((data.order.expiresAt - Date.now()) / 1000)));
      } else {
        setError(data.error || 'Không thể tạo mã thanh toán VietQR');
      }
    } catch {
      setError('Lỗi kết nối khi khởi tạo thanh toán');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize or fetch order when modal opens or initialTier changes
  useEffect(() => {
    if (!isOpen) {
      if (pollingRef.current) clearInterval(pollingRef.current);
      setOrder(null);
      setIsPaid(false);
      setIssuedKey(null);
      return;
    }

    setSelectedTier(initialTier);
    createOrderForTier(initialTier);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [isOpen, initialTier, createOrderForTier]);

  const handleSelectTier = (tier: PackageTier) => {
    if (tier === selectedTier) return;
    setSelectedTier(tier);
    createOrderForTier(tier);
  };

  // Polling order status
  useEffect(() => {
    if (!order || isPaid) return;

    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/payment/status?orderId=${order.orderId}`);
        const data = await res.json();
        if (data.success && data.status === 'PAID') {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setIsPaid(true);
          const key = data.licenseKey || 'PRO-MEMBER-VIP';
          setIssuedKey(key);
          activatePro(key, order.tier);
        }
      } catch {
        // Silently retry on next poll
      }
    }, 2500);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [order, isPaid, activatePro]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || isPaid || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, isPaid, timeLeft]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(field);
    setTimeout(() => setIsCopied(null), 2000);
  };

  const handleSimulatePayment = async () => {
    if (!order) return;
    setIsSimulating(true);
    try {
      const res = await fetch('/api/payment/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.orderId }),
      });
      const data = await res.json();
      if (data.success) {
        setIsPaid(true);
        const key = data.order?.licenseKey || data.licenseKey || 'PRO-DEMO-2026-VIP';
        setIssuedKey(key);
        activatePro(key, order.tier);
      }
    } catch {
      alert('Không thể mô phỏng thanh toán');
    } finally {
      setIsSimulating(false);
    }
  };

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const isMaster = (order?.tier || selectedTier) === 'master';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl p-5 sm:p-7">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-zinc-400 hover:text-zinc-100 rounded-xl hover:bg-zinc-800 transition-colors"
          aria-label="Đóng modal"
        >
          <X className="w-5 h-5" />
        </button>

        {isPaid ? (
          /* SUCCESS SCREEN */
          <div className="text-center py-6 space-y-6 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-500/20 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 border border-amber-500/30 text-amber-400 uppercase tracking-wider inline-flex items-center gap-1.5 mb-2">
                <Crown className="w-3.5 h-3.5" />{' '}
                {isMaster ? 'Gói Pro Master 30 Ngày Đã Mở Khóa' : 'Gói Starter Đã Mở Khóa'}
              </span>
              <h2 className="text-2xl font-extrabold text-white">Thanh toán thành công!</h2>
              <p className="text-sm text-zinc-400 mt-1 max-w-md mx-auto">
                Cảm ơn bạn đã ủng hộ AI Roast CV. Tất cả tính năng cao cấp đã sẵn sàng ngay bây giờ.
              </p>
            </div>

            {issuedKey && (
              <div className="p-4 rounded-2xl bg-zinc-950 border border-amber-500/30 text-left max-w-md mx-auto space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-400">Mã kích hoạt bản quyền (License Key):</span>
                  <button
                    onClick={() => copyToClipboard(issuedKey, 'key')}
                    className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                  >
                    {isCopied === 'key' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied === 'key' ? 'Đã sao chép' : 'Sao chép'}</span>
                  </button>
                </div>
                <div className="px-3 py-2 bg-zinc-900 rounded-xl font-mono text-sm font-bold text-amber-400 border border-zinc-800 tracking-wider text-center select-all">
                  {issuedKey}
                </div>
                <p className="text-[11px] text-zinc-500 text-center">
                  💡 Hãy lưu lại mã này để kích hoạt lại nếu bạn chuyển sang máy tính khác hoặc dọn dẹp trình duyệt.
                </p>
              </div>
            )}

            <div className="pt-2">
              <button
                onClick={onClose}
                className="w-full py-3.5 rounded-2xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5 fill-zinc-950" />
                <span>Bắt đầu trải nghiệm ngay</span>
              </button>
            </div>
          </div>
        ) : (
          /* CHECKOUT SCREEN */
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-1">
                  <Sparkles className="w-3 h-3" /> ĐẦU TƯ SỰ NGHIỆP - TỰ ĐỘNG KÍCH HOẠT
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                  Nâng Cấp Gói Pro
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Chọn gói dịch vụ phù hợp và quét mã VietQR tự động mở khóa.
                </p>
              </div>
            </div>

            {/* Plan Tier Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Starter Tier */}
              <button
                type="button"
                onClick={() => handleSelectTier('starter')}
                className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                  selectedTier === 'starter'
                    ? 'bg-amber-500/10 border-amber-500 text-white shadow-lg shadow-amber-500/10 ring-1 ring-amber-500'
                    : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-200">Gói Starter</span>
                  <span className="text-sm font-extrabold text-amber-400">29.000đ</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-snug">
                  1 CV Roast chuyên sâu + Viết lại bullet point + Phỏng vấn câu 1.
                </p>
              </button>

              {/* Master Tier */}
              <button
                type="button"
                onClick={() => handleSelectTier('master')}
                className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden ${
                  selectedTier === 'master'
                    ? 'bg-gradient-to-br from-amber-500/15 to-orange-500/15 border-amber-400 text-white shadow-lg shadow-amber-500/20 ring-1 ring-amber-400'
                    : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
                }`}
              >
                <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-orange-500 text-zinc-950 text-[9px] font-black px-2 py-0.5 rounded-bl-lg uppercase tracking-wider">
                  BÁN CHẠY NHẤT ⭐
                </div>
                <div className="flex items-center justify-between mb-1 pt-0.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5 text-amber-400" /> Pro Master (30 Ngày)
                  </span>
                  <span className="text-sm font-extrabold text-amber-300">99.000đ</span>
                </div>
                <p className="text-[11px] text-zinc-300 leading-snug">
                  30 Ngày không giới hạn + ATS Simulator + Trọn bộ 3 câu phỏng vấn.
                </p>
              </button>
            </div>

            {/* Feature Highlights of Selected Tier */}
            <div className="p-3 bg-zinc-950/80 rounded-2xl border border-zinc-800/80 text-[11px] space-y-1.5">
              <span className="font-semibold text-zinc-300 block">
                {selectedTier === 'master' ? '💎 Quyền lợi Gói Pro Master (30 Ngày):' : '⚡ Quyền lợi Gói Starter:'}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{selectedTier === 'master' ? '30 Ngày Roast & Viết lại không giới hạn' : '1 Lần Roast CV & Báo cáo điểm số'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{selectedTier === 'master' ? 'Trọn bộ 3 câu hỏi phỏng vấn áp lực + Rubric' : 'Thử sức câu hỏi phỏng vấn đầu tiên'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{selectedTier === 'master' ? 'Mở khóa 100% từ khóa thiếu & Gợi ý dự án' : '1 Lượt viết lại Bullet point chuẩn ATS'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{selectedTier === 'master' ? 'ATS Simulator & Interactive Diff Viewer' : 'Hỗ trợ quét VietQR tự động qua SePay'}</span>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-zinc-400">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                <span className="text-sm font-medium">Đang tạo mã VietQR động ({selectedTier === 'master' ? '99.000đ' : '29.000đ'})...</span>
              </div>
            ) : error || !order ? (
              <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center space-y-3">
                <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
                <p className="text-sm text-rose-300 font-medium">{error || 'Không tải được thông tin đơn'}</p>
                <button
                  onClick={() => createOrderForTier(selectedTier)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-200 text-xs font-semibold hover:bg-zinc-700 transition"
                >
                  Thử lại
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
                {/* QR Display */}
                <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-inner border border-zinc-200 relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={order.bankInfo.qrUrl}
                    alt={`VietQR thanh toán ${order.amount}đ`}
                    className="w-52 h-52 object-contain rounded-lg"
                  />
                  <div className="mt-2 text-[11px] font-bold text-zinc-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Quét bằng App Ngân Hàng / MoMo</span>
                  </div>
                </div>

                {/* Transfer Info */}
                <div className="space-y-2.5 text-xs">
                  <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-800 space-y-1">
                    <span className="text-zinc-500 text-[11px]">Ngân hàng nhận:</span>
                    <p className="font-bold text-zinc-200">{order.bankInfo.bankName}</p>
                  </div>

                  <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between">
                    <div>
                      <span className="text-zinc-500 text-[11px]">Số tài khoản:</span>
                      <p className="font-mono font-bold text-zinc-200 text-sm">{order.bankInfo.accountNo}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(order.bankInfo.accountNo, 'acc')}
                      className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-amber-400 transition"
                      title="Sao chép số tài khoản"
                    >
                      {isCopied === 'acc' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between">
                    <div>
                      <span className="text-zinc-500 text-[11px]">Chủ tài khoản:</span>
                      <p className="font-semibold text-zinc-200">{order.bankInfo.accountName}</p>
                    </div>
                  </div>

                  <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between">
                    <div>
                      <span className="text-zinc-500 text-[11px]">Số tiền chính xác:</span>
                      <p className="font-bold text-amber-400 text-sm">{order.amount.toLocaleString('vi-VN')} đ</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(String(order.amount), 'amount')}
                      className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-amber-400 transition"
                      title="Sao chép số tiền"
                    >
                      {isCopied === 'amount' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/30 flex items-center justify-between">
                    <div>
                      <span className="text-amber-400/80 text-[11px] font-semibold">Nội dung chuyển khoản (Bắt buộc):</span>
                      <p className="font-mono font-extrabold text-amber-300 text-sm tracking-wide">{order.description}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(order.description, 'content')}
                      className="p-1.5 hover:bg-amber-500/20 rounded-lg text-amber-400 transition"
                      title="Sao chép nội dung chuyển khoản"
                    >
                      {isCopied === 'content' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Live Polling Status & Countdown */}
            {!isLoading && order && (
              <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                <div className="flex items-center gap-2.5 text-zinc-300">
                  <RefreshCw className="w-4 h-4 text-amber-500 animate-spin" />
                  <span>Hệ thống đang tự động đợi tiền về qua SePay...</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-zinc-400 shrink-0">
                  <span>Hết hạn trong:</span>
                  <span className="font-bold text-amber-400">{timeFormatted}</span>
                </div>
              </div>
            )}

            {/* Sandbox Simulation Bar (Dev & Test Mode) */}
            <div className="pt-2 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleSimulatePayment}
                disabled={isSimulating || !order}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all shadow-sm"
              >
                {isSimulating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                <span>⚡ Giả lập thanh toán thành công (Sandbox Dev)</span>
              </button>

              {onOpenActivateModal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenActivateModal();
                  }}
                  className="text-xs text-zinc-400 hover:text-amber-400 underline underline-offset-4 transition-colors"
                >
                  Đã có mã License Key? Nhập tại đây
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
