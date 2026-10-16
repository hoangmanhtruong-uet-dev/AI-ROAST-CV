'use client';

import * as React from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertOctagon, RotateCcw } from 'lucide-react';

export interface QuitConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmQuit: () => void;
  completedCount?: number;
}

export function QuitConfirmModal({
  isOpen,
  onClose,
  onConfirmQuit,
  completedCount = 0,
}: QuitConfirmModalProps) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Xác nhận dừng phỏng vấn">
      <div className="flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-5 text-rose-400">
          <AlertOctagon className="w-7 h-7" />
        </div>

        <h3 className="text-xl font-bold text-white mb-2">
          Bạn có chắc chắn muốn dừng phỏng vấn?
        </h3>

        <p className="text-sm text-zinc-300 leading-relaxed max-w-sm mb-6">
          {completedCount > 0
            ? `Bạn đã hoàn thành ${completedCount}/3 câu hỏi tình huống. Nếu dừng ngay bây giờ, phiên phỏng vấn sẽ kết thúc và đưa bạn quay về màn hình chọn vị trí.`
            : 'Bạn đang ở giữa câu hỏi tình huống áp lực. Nếu thoát ngay bây giờ, tiến trình của phiên sẽ được đặt lại hoàn toàn.'}
        </p>

        <div className="flex flex-col-reverse sm:flex-row items-center gap-3 w-full">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-1/2 border-zinc-700 text-zinc-300 hover:text-white"
            onClick={onClose}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            <span>Tiếp tục làm bài</span>
          </Button>

          <Button
            type="button"
            className="w-full sm:w-1/2 bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20"
            onClick={onConfirmQuit}
          >
            <span>Xác nhận dừng</span>
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
