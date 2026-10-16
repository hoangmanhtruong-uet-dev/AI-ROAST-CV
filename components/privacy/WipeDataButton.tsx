'use client';

import React, { useState } from 'react';
import { Trash2, Check, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import {
  wipeAllSessionData,
  VIETNAMESE_WIPE_SUCCESS_MESSAGE,
} from '@/lib/storage/wipe-data';

export interface WipeDataButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  confirmFirst?: boolean;
  skipConfirmation?: boolean;
  showLabel?: boolean;
  showIconOnly?: boolean;
  onWiped?: () => void;
  onWipe?: () => void;
  redirectHome?: boolean;
  className?: string;
  label?: string;
}

export function WipeDataButton({
  variant = 'ghost',
  size = 'sm',
  confirmFirst = false,
  skipConfirmation = false,
  showLabel = true,
  showIconOnly = false,
  onWiped,
  onWipe,
  redirectHome = false,
  className = '',
  label = 'Xóa sạch dữ liệu',
}: WipeDataButtonProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isWiped, setIsWiped] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const performWipe = () => {
    wipeAllSessionData();

    if (onWiped) onWiped();
    if (onWipe) onWipe();

    setIsWiped(true);
    setShowToast(true);

    setTimeout(() => {
      setIsWiped(false);
    }, 2500);

    setTimeout(() => {
      setShowToast(false);
      if (redirectHome && typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }, 3500);
  };

  const handleClick = () => {
    if (confirmFirst && !skipConfirmation) {
      setIsConfirmOpen(true);
    } else {
      performWipe();
    }
  };

  const handleConfirmWipe = () => {
    setIsConfirmOpen(false);
    performWipe();
  };

  const isIconOnly = showIconOnly || !showLabel;
  const accessibleName = isIconOnly
    ? 'Xóa sạch dữ liệu phiên (Wipe data)'
    : label;

  return (
    <>
      <Button
        type="button"
        variant={variant === 'danger' ? 'primary' : variant}
        size={size}
        onClick={handleClick}
        className={className}
        aria-label={accessibleName}
        title="Xóa toàn bộ dữ liệu phiên trên trình duyệt"
      >
        {isWiped ? (
          <>
            <Check className="w-4 h-4 text-emerald-400" />
            {!isIconOnly && (
              <span className="text-emerald-400 font-medium ml-1.5">
                Đã xóa sạch dữ liệu
              </span>
            )}
          </>
        ) : (
          <>
            <Trash2 className="w-4 h-4" />
            {!isIconOnly && <span className="ml-1.5">{label}</span>}
          </>
        )}
      </Button>

      {/* Confirmation Dialog */}
      <Dialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title="Xác nhận xóa sạch toàn bộ dữ liệu"
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-5 text-rose-400">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <h3 className="text-xl font-bold text-white mb-2">
            Bạn có chắc chắn muốn xóa sạch toàn bộ dữ liệu?
          </h3>

          <p className="text-sm text-zinc-300 leading-relaxed max-w-sm mb-6">
            Hệ thống sẽ lập tức xóa sạch văn bản CV, câu trả lời phỏng vấn và kết quả chấm điểm đã lưu tạm trên trình duyệt này. Quyền riêng tư của bạn được đảm bảo tuyệt đối.
          </p>

          <div className="flex flex-col-reverse sm:flex-row items-center gap-3 w-full">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-1/2 border-zinc-700 text-zinc-300 hover:text-white"
              onClick={() => setIsConfirmOpen(false)}
            >
              <span>Hủy</span>
            </Button>

            <Button
              type="button"
              className="w-full sm:w-1/2 bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20"
              onClick={handleConfirmWipe}
            >
              <span>Xác nhận xóa</span>
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Toast Feedback */}
      {showToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-zinc-900 border border-emerald-500/50 text-emerald-300 shadow-2xl animate-fade-in"
        >
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-medium">
            {VIETNAMESE_WIPE_SUCCESS_MESSAGE}
          </span>
        </div>
      )}
    </>
  );
}
