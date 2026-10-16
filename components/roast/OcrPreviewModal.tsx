'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { RotateCcw, Check, Copy, ArrowRight, ArrowLeft, FileText, Sparkles, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { maskPii } from '@/lib/utils/pii-masker';

export interface OcrPreviewModalProps {
  isOpen: boolean;
  extractedText: string;
  fileName?: string;
  fileSize?: number;
  onClose: () => void;
  onConfirm: (finalEditedText: string) => void;
  onReUpload?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function OcrPreviewModal({
  isOpen,
  extractedText,
  fileName,
  fileSize,
  onClose,
  onConfirm,
  onReUpload,
  isLoading = false,
  className,
}: OcrPreviewModalProps) {
  const [currentText, setCurrentText] = useState(extractedText);
  const [copied, setCopied] = useState(false);
  const [resetNotice, setResetNotice] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [consentAgreed, setConsentAgreed] = useState<boolean>(true);

  useEffect(() => {
    setCurrentText(extractedText);
  }, [extractedText]);

  if (!isOpen) return null;

  const maskingResult = maskPii(currentText);

  const wordCount = currentText
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const charCount = currentText.length;
  const hasChanged = currentText.trim() !== extractedText.trim();

  const handleReset = () => {
    setCurrentText(extractedText);
    setResetNotice(true);
    setValidationError(null);
    setTimeout(() => setResetNotice(false), 2000);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleConfirm = () => {
    const trimmed = currentText.trim();
    if (!consentAgreed) {
      setValidationError('Bạn cần đồng ý với chính sách quyền riêng tư trước khi tiếp tục.');
      return;
    }
    if (trimmed.length < 30) {
      setValidationError('Văn bản CV quá ngắn (tối thiểu 30 ký tự). Vui lòng bổ sung thông tin.');
      return;
    }
    setValidationError(null);
    onConfirm(maskingResult.sanitizedText);
  };

  return (
    <div className={cn('w-full flex flex-col gap-4', className)}>
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-zinc-900 border border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <span>Rà soát & Chỉnh sửa văn bản CV</span>
              {hasChanged && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Đã chỉnh sửa
                </span>
              )}
            </h3>
            <p className="text-xs text-zinc-400">
              {fileName ? `${fileName} (${fileSize ? (fileSize / 1024).toFixed(0) + ' KB' : ''})` : 'Văn bản đã trích xuất'}
              {' • '}
              <span className="text-zinc-300 font-medium">{wordCount} từ</span>
              {' • '}
              <span className="text-zinc-300 font-medium">{charCount.toLocaleString()} ký tự</span>
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {hasChanged && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              title="Khôi phục văn bản OCR gốc"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Khôi phục gốc</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Đã sao chép</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Sao chép</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Advisory Callout */}
      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
        <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
        <p className="leading-relaxed">
          <strong>Mẹo nhỏ:</strong> Hãy kiểm tra kỹ tên công nghệ, liên kết GitHub/Portfolio và các số liệu dự án. Bạn có thể sửa trực tiếp vào ô bên dưới trước khi AI bắt đầu phân tích.
        </p>
      </div>

      {resetNotice && (
        <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
          Đã khôi phục lại văn bản trích xuất ban đầu.
        </div>
      )}

      {/* Editable Textarea with aria-label for accessibility & testing */}
      <div className="relative">
        <textarea
          id="ocr-preview-textarea"
          aria-label="Xem trước và chỉnh sửa nội dung CV"
          rows={12}
          spellCheck={false}
          disabled={isLoading}
          value={currentText}
          onChange={(e) => {
            setCurrentText(e.target.value);
            setValidationError(null);
          }}
          className={cn(
            'w-full p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600',
            'focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-sans text-sm leading-relaxed resize-y min-h-[300px]',
            isLoading ? 'opacity-60' : ''
          )}
        />
      </div>

      {validationError && (
        <p className="text-xs text-rose-400 font-medium">{validationError}</p>
      )}

      {/* Khiên bảo mật PII Client & Chip Previews */}
      <div className="p-4 rounded-xl bg-zinc-900/90 border border-emerald-500/30 space-y-3 shadow-inner">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                <span>Khiên bảo mật PII Client</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                  Tự động che mờ thông tin cá nhân
                </span>
              </h4>
              <p className="text-[11px] text-zinc-400">
                Lọc SĐT, Email, CCCD trước khi payload được chuyển tiếp tới Google Gemini.
              </p>
            </div>
          </div>
          {maskingResult.stats.total > 0 && (
            <span className="self-start sm:self-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-900/40 border border-emerald-500/30 text-emerald-300">
              {maskingResult.stats.total} mục đã ẩn danh
            </span>
          )}
        </div>

        {/* Chip Previews */}
        {maskingResult.detectedItems.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {maskingResult.detectedItems.map((item, idx) => (
              <span
                key={`${item.type}-${item.preview}-${idx}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono bg-zinc-800/90 border border-emerald-500/40 text-emerald-300 shadow-sm"
              >
                <span>
                  {item.type === 'phone'
                    ? '📱'
                    : item.type === 'email'
                    ? '✉️'
                    : item.type === 'id'
                    ? '🪪'
                    : '🔗'}
                </span>
                <span className="font-semibold">{item.preview}</span>
                {item.count > 1 && (
                  <span className="text-[10px] px-1 rounded bg-zinc-700 text-zinc-300">
                    x{item.count}
                  </span>
                )}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-zinc-400 italic pt-1 flex items-center gap-1.5">
            <span className="text-emerald-400">✓</span>
            <span>Không phát hiện SĐT, Email hay CCCD cá nhân trong văn bản này.</span>
          </p>
        )}

        {/* Mandatory Consent Checkbox */}
        <div className="pt-2 border-t border-zinc-800/80">
          <label className="flex items-start gap-2.5 cursor-pointer text-xs text-zinc-300 select-none">
            <input
              type="checkbox"
              id="consent-checkbox"
              aria-label="Tôi đồng ý gửi nội dung CV đã ẩn danh tới Google Gemini để phân tích theo Chính sách Quyền riêng tư"
              checked={consentAgreed}
              onChange={(e) => {
                setConsentAgreed(e.target.checked);
                if (e.target.checked) setValidationError(null);
              }}
              className="mt-0.5 w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-orange-500 focus:ring-orange-500 focus:ring-offset-zinc-900 cursor-pointer"
            />
            <span className="leading-snug">
              Tôi đồng ý gửi nội dung CV đã ẩn danh tới Google Gemini để phân tích theo{' '}
              <Link href="/privacy" target="_blank" className="text-orange-400 hover:underline inline-flex items-center gap-0.5">
                Chính sách Quyền riêng tư
              </Link>
              .
            </span>
          </label>
        </div>
      </div>

      {/* Bottom Action Controls */}
      <div className="flex items-center justify-between pt-2">
        {onReUpload ? (
          <button
            type="button"
            onClick={onReUpload}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Tải tệp khác</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại</span>
          </button>
        )}

        <button
          type="button"
          disabled={isLoading || currentText.trim().length < 30 || !consentAgreed}
          onClick={handleConfirm}
          className={cn(
            'inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md',
            currentText.trim().length >= 30 && consentAgreed
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600'
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
          )}
        >
          <span>Xác nhận & Chọn giọng điệu</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
