'use client';

import React, { useState } from 'react';
import { CanvasShareCard } from './CanvasShareCard';
import { ShareCardPayload } from '@/lib/schemas/share';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, ShieldCheck, Check } from 'lucide-react';

export interface SharePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  payload: ShareCardPayload;
  fileName?: string;
}

export function SharePreviewModal({
  isOpen,
  onClose,
  payload,
  fileName,
}: SharePreviewModalProps) {
  const [readyCanvas, setReadyCanvas] = useState<HTMLCanvasElement | null>(null);
  const [format, setFormat] = useState<'landscape' | 'square'>('landscape');
  const [isDownloaded, setIsDownloaded] = useState(false);

  const handleDownload = () => {
    if (!readyCanvas) return;

    const downloadFileName =
      fileName ||
      `airoastcv-${payload.type}-score-${Date.now()}.png`;

    if (typeof readyCanvas.toBlob === 'function') {
      readyCanvas.toBlob((blob) => {
        if (!blob) {
          triggerDataUrlDownload(readyCanvas, downloadFileName);
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = downloadFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setIsDownloaded(true);
        setTimeout(() => setIsDownloaded(false), 3000);
      }, 'image/png');
    } else {
      triggerDataUrlDownload(readyCanvas, downloadFileName);
    }
  };

  const triggerDataUrlDownload = (canvas: HTMLCanvasElement, name: string) => {
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsDownloaded(true);
    setTimeout(() => setIsDownloaded(false), 3000);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Xem trước thẻ chia sẻ (Share Card)"
      className="max-w-3xl"
    >
      <div className="flex flex-col gap-4">
        {/* Header Information */}
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Xem trước thẻ chia sẻ (Share Card)</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
            Xem trước ảnh kết quả trước khi tải về. Toàn bộ thông tin cá nhân (SĐT, Email, Tên, Link cá nhân) đã được che an toàn tuyệt đối.
          </p>
        </div>

        {/* Format Selector */}
        <div className="flex items-center gap-2 pt-1">
          <span className="text-xs text-zinc-400 font-medium">Định dạng ảnh:</span>
          <button
            type="button"
            onClick={() => setFormat('landscape')}
            className={`px-3 py-1 text-xs rounded-lg border transition-colors ${
              format === 'landscape'
                ? 'bg-orange-500/20 border-orange-500/50 text-orange-300 font-semibold'
                : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Ngang (1200x630)
          </button>
          <button
            type="button"
            onClick={() => setFormat('square')}
            className={`px-3 py-1 text-xs rounded-lg border transition-colors ${
              format === 'square'
                ? 'bg-orange-500/20 border-orange-500/50 text-orange-300 font-semibold'
                : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Vuông (1080x1080)
          </button>
        </div>

        {/* Canvas Preview Container */}
        <div className="my-2 max-h-[55vh] overflow-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-2">
          <CanvasShareCard
            payload={payload}
            format={format}
            onCanvasReady={setReadyCanvas}
          />
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-zinc-800">
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Xử lý 100% tại trình duyệt • Không tự động đăng tải bất kỳ đâu</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto border-zinc-700 text-zinc-300 hover:text-white"
            >
              <span>Đóng</span>
            </Button>

            <Button
              type="button"
              variant="primary"
              onClick={handleDownload}
              className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold"
            >
              {isDownloaded ? (
                <>
                  <Check className="w-4 h-4 mr-2 text-emerald-300" />
                  <span>Đã tải ảnh PNG</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  <span>Tải ảnh PNG</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
