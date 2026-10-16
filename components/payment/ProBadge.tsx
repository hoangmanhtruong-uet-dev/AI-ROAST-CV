import React from 'react';
import { Crown, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ProBadgeProps {
  size?: 'sm' | 'md';
  className?: string;
  showIcon?: boolean;
}

export function ProBadge({ size = 'sm', className, showIcon = true }: ProBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-full shadow-sm',
        'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-zinc-950 border border-amber-300/40 shadow-amber-500/20',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs',
        className
      )}
    >
      {showIcon && <Crown className={cn('fill-zinc-950', size === 'sm' ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5')} />}
      <span>PRO MEMBER</span>
      <Sparkles className={cn(size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5')} />
    </span>
  );
}
