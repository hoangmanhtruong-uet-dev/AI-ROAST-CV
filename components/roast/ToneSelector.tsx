'use client';

import React from 'react';
import { Flame, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface ToneSelectorProps {
  selectedTone: 'spicy' | 'constructive';
  onSelectTone: (tone: 'spicy' | 'constructive') => void;
  disabled?: boolean;
  className?: string;
}

interface ToneOption {
  id: 'spicy' | 'constructive';
  name: string;
  badge: string;
  description: string;
  icon: React.ElementType;
  accent: 'orange' | 'cyan';
  sampleQuote: string;
}

const TONE_OPTIONS: ToneOption[] = [
  {
    id: 'spicy',
    name: 'Cà khịa / Sát thủ (Spicy Roast)',
    badge: '🔥 Thẳng thắn, không khoan nhượng',
    description:
      'Vạch trần mọi câu sáo rỗng, lỗi ngớ ngẩn và sự mơ hồ khiến CV bị loại sau 5 giây. Thích hợp cho những ai muốn "tỉnh mộng" để lột xác.',
    icon: Flame,
    accent: 'orange',
    sampleQuote:
      '"CV ghi thành thạo Git nhưng không có nổi 1 commit công khai? Nhà tuyển dụng chỉ biết mỉm cười cay đắng."',
  },
  {
    id: 'constructive',
    name: 'Chuyên gia tận tâm (Constructive Review)',
    badge: '👔 Chuyên nghiệp, mang tính xây dựng',
    description:
      'Đánh giá điềm đạm, bài bản từ góc nhìn của Hiring Manager. Tập trung vào lượng hóa thành tích và tối ưu hóa từ khóa ATS.',
    icon: Briefcase,
    accent: 'cyan',
    sampleQuote:
      '"Kinh nghiệm tại vị trí thực tập cần bổ sung số liệu định lượng (ví dụ: tối ưu tốc độ [X]%) để chứng minh năng lực."',
  },
];

export function ToneSelector({
  selectedTone,
  onSelectTone,
  disabled = false,
  className,
}: ToneSelectorProps) {
  return (
    <div
      className={cn('w-full', className)}
      role="radiogroup"
      aria-label="Chọn chế độ giọng điệu phân tích CV"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TONE_OPTIONS.map((opt) => {
          const isActive = selectedTone === opt.id;
          const Icon = opt.icon;

          return (
            <button
              key={opt.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectTone(opt.id)}
              data-active={isActive ? 'true' : 'false'}
              aria-pressed={isActive}
              className={cn(
                'relative flex flex-col items-start p-5 rounded-2xl border text-left transition-all duration-200 outline-none select-none',
                'hover:border-zinc-500 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-orange-500',
                isActive
                  ? opt.accent === 'orange'
                    ? 'border-orange-500/80 bg-orange-950/20 shadow-lg shadow-orange-500/10'
                    : 'border-cyan-500/80 bg-cyan-950/20 shadow-lg shadow-cyan-500/10'
                  : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900/90'
              )}
            >
              {/* Header Badge */}
              <div className="flex items-center justify-between w-full mb-3">
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
                    isActive
                      ? opt.accent === 'orange'
                        ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700/50'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{opt.badge}</span>
                </span>

                <div
                  className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
                    isActive
                      ? opt.accent === 'orange'
                        ? 'border-orange-500 bg-orange-500'
                        : 'border-cyan-500 bg-cyan-500'
                      : 'border-zinc-600'
                  )}
                >
                  {isActive && <div className="w-2 h-2 rounded-full bg-black" />}
                </div>
              </div>

              {/* Title & Description */}
              <h3 className="text-base font-bold text-zinc-100 mb-1.5 flex items-center gap-2">
                {opt.name}
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                {opt.description}
              </p>

              {/* Sample Quote Pill */}
              <div
                className={cn(
                  'mt-auto w-full p-2.5 rounded-xl text-xs italic leading-relaxed border',
                  isActive
                    ? opt.accent === 'orange'
                      ? 'bg-orange-950/40 text-orange-200/90 border-orange-500/20'
                      : 'bg-cyan-950/40 text-cyan-200/90 border-cyan-500/20'
                    : 'bg-zinc-800/50 text-zinc-400 border-zinc-700/40'
                )}
              >
                {opt.sampleQuote}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
