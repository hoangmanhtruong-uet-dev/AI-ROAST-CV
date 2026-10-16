import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: 'none' | 'spicy' | 'cyan' | 'emerald';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, glow = 'none', children, ...props }, ref) => {
    const glowStyles = {
      none: 'border-zinc-800 bg-zinc-900/60',
      spicy:
        'border-orange-500/30 bg-zinc-900/70 hover:border-orange-500/70 hover:shadow-lg hover:shadow-orange-500/10',
      cyan:
        'border-cyan-500/30 bg-zinc-900/70 hover:border-cyan-500/70 hover:shadow-lg hover:shadow-cyan-500/10',
      emerald:
        'border-emerald-500/30 bg-zinc-900/70 hover:border-emerald-500/70 hover:shadow-lg hover:shadow-emerald-500/10',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl border p-6 transition-all duration-300 backdrop-blur-sm',
          glowStyles[glow],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';
