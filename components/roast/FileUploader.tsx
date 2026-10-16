'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, FileUp, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { MAX_FILE_SIZE_BYTES } from '@/lib/utils/file-validator';

export interface FileUploaderProps {
  onFileSelected: (file: File) => void;
  onTextSubmit: (text: string) => void;
  isExtracting?: boolean;
  error?: string | null;
  disabled?: boolean;
  className?: string;
}

export function FileUploader({
  onFileSelected,
  onTextSubmit,
  isExtracting = false,
  error = null,
  disabled = false,
  className,
}: FileUploaderProps) {
  const [activeTab, setActiveTab] = useState<'file' | 'text'>('file');
  const [isDragOver, setIsDragOver] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayError = error || clientError;

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    setClientError(null);

    if (file.size === 0) {
      setClientError('Tệp tải lên không có dữ liệu (0 byte). Vui lòng kiểm tra lại.');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setClientError(
        `Dung lượng tệp vượt quá 5MB (${(file.size / (1024 * 1024)).toFixed(2)}MB). Vui lòng nén tệp hoặc dùng bản CV 1 trang.`
      );
      return;
    }

    const validExtensions = ['.pdf', '.png', '.jpg', '.jpeg'];
    const lowerName = file.name.toLowerCase();
    const hasValidExt = validExtensions.some((ext) => lowerName.endsWith(ext));
    if (!hasValidExt) {
      setClientError('Định dạng tệp không được hỗ trợ. Chỉ chấp nhận tệp PDF, PNG hoặc JPG/JPEG.');
      return;
    }

    onFileSelected(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled || isExtracting) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled && !isExtracting) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setClientError(null);

    const trimmed = pastedText.trim();
    if (trimmed.length < 30) {
      setClientError('Văn bản CV quá ngắn (tối thiểu 30 ký tự). Vui lòng nhập đầy đủ thông tin CV.');
      return;
    }

    if (trimmed.length > 50000) {
      setClientError('Văn bản vượt quá giới hạn 50.000 ký tự. Vui lòng rút gọn nội dung.');
      return;
    }

    onTextSubmit(trimmed);
  };

  return (
    <div className={cn('w-full flex flex-col', className)}>
      {/* Tabs Switcher */}
      <div
        role="tablist"
        aria-label="Chọn cách nhập CV"
        className="flex items-center gap-2 p-1.5 bg-zinc-900/90 border border-zinc-800 rounded-xl mb-4 w-fit"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'file'}
          onClick={() => {
            setActiveTab('file');
            setClientError(null);
          }}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            activeTab === 'file'
              ? 'bg-zinc-800 text-zinc-100 shadow'
              : 'text-zinc-400 hover:text-zinc-200'
          )}
        >
          <FileUp className="w-4 h-4" />
          <span>Tải tệp CV lên</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'text'}
          onClick={() => {
            setActiveTab('text');
            setClientError(null);
          }}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            activeTab === 'text'
              ? 'bg-zinc-800 text-zinc-100 shadow'
              : 'text-zinc-400 hover:text-zinc-200'
          )}
        >
          <FileText className="w-4 h-4" />
          <span>Dán văn bản trực tiếp</span>
        </button>
      </div>

      {/* Tab 1: File Upload Dropzone */}
      {activeTab === 'file' && (
        <div className="flex flex-col gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
            className="hidden"
            disabled={disabled || isExtracting}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileChange(e.target.files[0]);
              }
            }}
          />

          <div
            role="button"
            tabIndex={0}
            aria-label="Khu vực tải lên tệp CV"
            onClick={() => {
              if (!disabled && !isExtracting) {
                fileInputRef.current?.click();
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={cn(
              'group relative flex flex-col items-center justify-center p-8 sm:p-12 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 select-none text-center',
              isDragOver
                ? 'border-orange-500 bg-orange-500/10'
                : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/70',
              disabled || isExtracting ? 'opacity-60 pointer-events-none' : ''
            )}
          >
            <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center mb-4 text-orange-400 group-hover:scale-105 transition-transform">
              <Upload className="w-7 h-7" />
            </div>

            <h3 className="text-base font-semibold text-zinc-100 mb-1">
              Kéo thả tệp tin hoặc chọn tệp từ máy tính
            </h3>

            <p className="text-xs text-zinc-400 max-w-sm mb-3">
              Hỗ trợ PDF, PNG, JPG (dung lượng tối đa 5MB). Khuyến nghị tải CV 1 trang để kết quả phân tích chuẩn xác nhất.
            </p>

            <div className="inline-flex items-center gap-2 text-xs text-zinc-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Bảo mật 100%: CV chỉ lưu tạm trong RAM, không ghi vào cơ sở dữ liệu</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Direct Plain Text Paste */}
      {activeTab === 'text' && (
        <form onSubmit={handleTextSubmit} className="flex flex-col gap-3">
          <div className="relative">
            <textarea
              id="cv-text-input"
              aria-label="Nội dung CV"
              rows={8}
              disabled={disabled || isExtracting}
              value={pastedText}
              onChange={(e) => {
                setPastedText(e.target.value);
                setClientError(null);
              }}
              placeholder="Dán toàn bộ nội dung văn bản CV của bạn vào đây (Họ tên, Mục tiêu, Học vấn, Kinh nghiệm dự án, Kỹ năng)..."
              className={cn(
                'w-full p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600',
                'focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-sans text-sm leading-relaxed resize-y min-h-[200px]',
                disabled ? 'opacity-60' : ''
              )}
            />
            <div className="flex items-center justify-between mt-2 text-xs text-zinc-400 px-1">
              <span>Tối thiểu 30 ký tự</span>
              <span>{pastedText.length.toLocaleString()} / 50.000 ký tự</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={disabled || isExtracting || pastedText.trim().length < 30}
            className={cn(
              'self-end inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-md',
              pastedText.trim().length >= 30
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            )}
          >
            <span>Bắt đầu Roast CV</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* Error Message Alert */}
      {displayError && (
        <div className="mt-3 flex items-center gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{displayError}</span>
        </div>
      )}
    </div>
  );
}
