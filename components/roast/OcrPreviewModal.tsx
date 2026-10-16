'use client';

import React, { useState, useEffect } from 'react';
import { RotateCcw, Check, Copy, ArrowRight, ArrowLeft, FileText, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

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

  useEffect(() => {
    setCurrentText(extractedText);
  }, [extractedText]);

  if (!isOpen) return null;

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
    if (trimmed.length < 30) {
      setValidationError('Văn bản CV quá ngắn (tối thiểu 30 ký tự). Vui lòng bổ sung thông tin.');
      return;
    }
    setValidationError(null);
    onConfirm(trimmed);
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
          disabled={isLoading || currentText.trim().length < 30}
          onClick={handleConfirm}
          className={cn(
            'inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md',
            currentText.trim().length >= 30
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
