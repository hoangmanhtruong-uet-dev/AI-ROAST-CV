'use client';

import React, { useState } from 'react';
import { KeyRound, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useProTier } from '@/lib/payment/entitlement';

interface ActivateKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ActivateKeyModal({ isOpen, onClose, onSuccess }: ActivateKeyModalProps) {
  const [licenseKey, setLicenseKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { activatePro } = useProTier();

  if (!isOpen) return null;

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = licenseKey.trim().toUpperCase();
    if (!clean) {
      setError('Vui lòng nhập mã kích hoạt License Key');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/payment/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey: clean }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'Mã kích hoạt không đúng hoặc không tồn tại');
        return;
      }

      // Save to client LocalStorage
      activatePro(data.licenseKey || clean);
      setSuccessMessage('Kích hoạt thành công gói Pro All-in-One!');

      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch {
      setError('Có lỗi kết nối máy chủ. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md p-6 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-zinc-800 transition-colors"
          aria-label="Đóng modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-100">Kích hoạt License Key</h3>
            <p className="text-xs text-zinc-400">Nhập mã bản quyền dạng PRO-XXXX-YYYY</p>
          </div>
        </div>

        {successMessage ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-3 my-4">
            <CheckCircle2 className="w-6 h-6 shrink-0" />
            <p className="text-sm font-semibold">{successMessage}</p>
          </div>
        ) : (
          <form onSubmit={handleActivate} className="space-y-4">
            <div>
              <label htmlFor="license-key-input" className="block text-xs font-medium text-zinc-300 mb-1.5">
                Mã bản quyền Pro của bạn:
              </label>
              <input
                id="license-key-input"
                type="text"
                value={licenseKey}
                onChange={(e) => {
                  setLicenseKey(e.target.value);
                  setError(null);
                }}
                placeholder="PRO-XXXX-YYYY hoặc PRO-DEMO-2026-VIP"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-100 font-mono text-sm tracking-wide focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 uppercase"
                disabled={isLoading}
              />
              <p className="text-[11px] text-zinc-500 mt-1.5">
                💡 Mã này được cấp sau khi bạn quét mã VietQR thanh toán thành công.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-800/60 hover:bg-zinc-800 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isLoading || !licenseKey.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 hover:from-amber-400 hover:to-orange-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-amber-500/20"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang kiểm tra...</span>
                  </>
                ) : (
                  <span>Kích hoạt ngay</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
