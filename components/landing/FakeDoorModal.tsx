'use client';

import React, { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Sparkles, Loader2, ShieldCheck } from 'lucide-react';

export interface FakeDoorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FakeDoorModal({ isOpen, onClose }: FakeDoorModalProps) {
  const [email, setEmail] = useState('');
  const [featureInterest, setFeatureInterest] = useState<'deep_interview' | 'ats_rewrite' | 'general'>('general');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateEmail = (val: string): boolean => {
    const trimmed = val.trim();
    if (!trimmed) {
      setError('Vui lòng nhập địa chỉ email của bạn');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setError('Email không hợp lệ. Vui lòng nhập đúng định dạng (ví dụ: name@example.com)');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/fakedoor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          tier: 'pro_29k',
          ...(featureInterest !== 'general' ? { featureInterest } : {}),
        }),
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.success) {
        setIsSubmitted(true);
      } else {
        setError(data?.message || data?.error || 'Đã xảy ra lỗi, vui lòng thử lại.');
      }
    } catch {
      setError('Không thể kết nối máy chủ. Vui lòng kiểm tra đường truyền và thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalClose = () => {
    onClose();
    // Reset state after dialog animation
    setTimeout(() => {
      setEmail('');
      setError('');
      setIsSubmitted(false);
      setIsLoading(false);
    }, 200);
  };

  return (
    <Dialog isOpen={isOpen} onClose={handleModalClose} title="Nâng cấp Gói Pro 29.000đ">
      {!isSubmitted ? (
        <div className="space-y-5">
          <div>
            <Badge variant="spicy" className="mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Ưu đãi người dùng sớm
            </Badge>
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              Nâng cấp Gói Pro 29.000đ
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-zinc-400">
              Mở khóa toàn bộ tính năng chuyên sâu giúp bạn sẵn sàng chinh phục mọi nhà tuyển dụng.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs sm:text-sm text-orange-200">
            🔥 <span className="font-semibold">Chỉ 29.000đ / tháng</span> (Tiết kiệm 60% so với giá gốc 75.000đ).
          </div>

          <ul className="space-y-2 text-xs sm:text-sm text-zinc-300">
            <li className="flex items-start gap-2">
              <span className="text-orange-400 font-bold">•</span>
              <span>Phân tích CV không giới hạn số trang & so khớp trực tiếp với mô tả công việc (JD).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-400 font-bold">•</span>
              <span>Kho 50+ câu hỏi tình huống áp lực chuyên sâu theo từng vị trí tuyển dụng.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-400 font-bold">•</span>
              <span>Gợi ý viết lại toàn bộ CV chuẩn cấu trúc STAR và bộ lọc ATS từ chuyên gia.</span>
            </li>
          </ul>

          <form noValidate onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div>
              <label htmlFor="fakedoor-email" className="block text-xs font-medium text-zinc-300 mb-1.5">
                Nhập email của bạn để nhận voucher giảm 50% khi ra mắt:
              </label>
              <Input
                id="fakedoor-email"
                type="email"
                placeholder="Nhập email của bạn (ví dụ: name@example.com)"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) validateEmail(e.target.value);
                }}
                error={error}
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Tính năng bạn quan tâm nhất:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'general', label: 'Tất cả' },
                  { id: 'deep_interview', label: 'Phỏng vấn sâu' },
                  { id: 'ats_rewrite', label: 'Viết lại ATS' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFeatureInterest(item.id as typeof featureInterest)}
                    className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      featureInterest === item.id
                        ? 'bg-orange-500/20 border-orange-500 text-orange-300'
                        : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-3 gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang gửi thông tin...</span>
                </>
              ) : (
                <span>Đăng ký nhận thông báo ưu đãi</span>
              )}
            </Button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cam kết bảo mật 100%, không spam thư rác.</span>
            </div>
          </form>
        </div>
      ) : (
        /* Thank-you Confirmation State */
        <div className="py-4 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h3 className="text-xl sm:text-2xl font-bold text-white">
            Cảm ơn bạn đã quan tâm!
          </h3>

          <p className="text-sm text-zinc-300 leading-relaxed max-w-sm mx-auto">
            Chúng tôi đã ghi nhận sự quan tâm của bạn dành cho <span className="font-semibold text-orange-400">Gói Pro 29.000đ</span>. 
            Mã voucher ưu đãi giảm 50% sẽ được gửi tới email của bạn ngay khi tính năng chính thức mở cổng!
          </p>

          <div className="pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleModalClose}
              className="w-full py-2.5 text-sm"
            >
              Tiếp tục trải nghiệm miễn phí
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
