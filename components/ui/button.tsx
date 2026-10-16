import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'emerald';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer';

    const variants = {
      primary:
        'bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.02] focus:ring-orange-500',
      secondary:
        'bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border border-zinc-700 hover:border-zinc-500 hover:scale-[1.02] focus:ring-zinc-600',
      outline:
        'bg-transparent border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-900 text-zinc-200 focus:ring-zinc-600',
      ghost: 'bg-transparent hover:bg-zinc-800 text-zinc-300 hover:text-white',
      emerald:
        'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 hover:scale-[1.02] focus:ring-emerald-500',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs sm:text-sm',
      md: 'px-4 py-2.5 text-sm sm:text-base',
      lg: 'px-6 py-3.5 text-base sm:text-lg',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
