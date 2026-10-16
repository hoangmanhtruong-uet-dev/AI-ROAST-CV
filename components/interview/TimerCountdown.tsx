'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { Clock, AlertTriangle } from 'lucide-react';

export interface TimerCountdownProps {
  timeRemaining: number; // in seconds
  totalDuration: number; // in seconds (e.g. 60, 75, 90)
  size?: 'sm' | 'md' | 'lg';
  showProgressRing?: boolean;
  className?: string;
}

export function TimerCountdown({
  timeRemaining,
  totalDuration,
  size = 'md',
  showProgressRing = true,
  className,
}: TimerCountdownProps) {
  const safeTimeRemaining = Math.max(0, Math.floor(timeRemaining));
  const safeTotalDuration = Math.max(1, totalDuration);

  // Minutes and seconds formatting
  const minutes = Math.floor(safeTimeRemaining / 60);
  const seconds = safeTimeRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Progress percentage (100% at start -> 0% at timeout)
  const progressPercent = Math.min(
    100,
    Math.max(0, (safeTimeRemaining / safeTotalDuration) * 100)
  );

  // Psychological tension levels:
  // > 15s: Normal (Cyan)
  // 5s - 15s: Warning (Amber)
  // < 5s: Critical (Rose Pulse)
  const isCritical = safeTimeRemaining < 5;
  const isWarning = safeTimeRemaining >= 5 && safeTimeRemaining <= 15;

  const colorStyles = isCritical
    ? {
        ring: 'stroke-rose-500',
        text: 'text-rose-400',
        bg: 'bg-rose-500/10 border-rose-500/60 shadow-lg shadow-rose-500/20',
        badge: 'bg-rose-500 text-white animate-pulse',
      }
    : isWarning
      ? {
          ring: 'stroke-amber-400',
          text: 'text-amber-300',
          bg: 'bg-amber-500/10 border-amber-500/40 shadow-md shadow-amber-500/10',
          badge: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
        }
      : {
          ring: 'stroke-cyan-500',
          text: 'text-cyan-400',
          bg: 'bg-cyan-500/10 border-cyan-500/30',
          badge: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
        };

  // SVG circular ring dimensions
  const strokeWidth = 3;
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (progressPercent / 100) * circumference;

  return (
    <div
      role="timer"
      aria-live="polite"
      aria-atomic="true"
      aria-label={`Thời gian còn lại: ${safeTimeRemaining} giây`}
      className={cn(
        'inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border transition-all duration-300 backdrop-blur-sm',
        colorStyles.bg,
        isCritical && 'animate-pulse',
        className
      )}
    >
      {showProgressRing && (
        <div className="relative w-7 h-7 flex items-center justify-center">
          <svg className="w-7 h-7 -rotate-90" viewBox="0 0 44 44">
            <circle
              cx="22"
              cy="22"
              r={radius}
              className="stroke-zinc-800 fill-none"
              strokeWidth={strokeWidth}
            />
            <circle
              cx="22"
              cy="22"
              r={radius}
              className={cn('fill-none transition-all duration-500', colorStyles.ring)}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            {isCritical ? (
              <AlertTriangle className={cn('w-3.5 h-3.5', colorStyles.text)} />
            ) : (
              <Clock className={cn('w-3.5 h-3.5', colorStyles.text)} />
            )}
          </div>
        </div>
      )}

      <div className="flex items-baseline font-mono">
        <span
          className={cn(
            'font-bold tracking-tight',
            size === 'lg' ? 'text-xl' : size === 'sm' ? 'text-sm' : 'text-base',
            colorStyles.text
          )}
        >
          {formattedTime}
        </span>
      </div>

      {isCritical && (
        <span className="hidden sm:inline-block text-[11px] font-semibold text-rose-300 uppercase tracking-wider animate-bounce ml-1">
          Sắp hết giờ!
        </span>
      )}
    </div>
  );
}
