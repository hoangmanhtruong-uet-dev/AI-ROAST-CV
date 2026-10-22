'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Flame, Timer, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import PersonaSwitcher, { PersonaMode } from '@/components/landing/PersonaSwitcher';
import CssHologramFallback from '@/components/landing/CssHologramFallback';
import { soundEngine } from '@/lib/audio/sound-engine';
import { cn } from '@/lib/utils/cn';

export interface HeroSectionProps {
  onOpenFakeDoor?: () => void;
}

const GLYPHS = '!<>-_\\[]{}—=+*^?#01@~';

/**
 * TextScramble with instant synchronous initial text for SSR / JSDOM compliance
 */
function TextScramble({
  text,
  scrambleOnMount = true,
  className,
  as: Component = 'span',
}: {
  text: string;
  scrambleOnMount?: boolean;
  className?: string;
  as?: 'h1' | 'h2' | 'span';
}) {
  const [displayText, setDisplayText] = useState<string>(text);
  const [isGlitching, setIsGlitching] = useState<boolean>(false);
  const frameRef = useRef<number | null>(null);

  const runScramble = useCallback(() => {
    if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
      setDisplayText(text);
      return;
    }

    try {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setDisplayText(text);
        return;
      }
    } catch {}

    setIsGlitching(true);
    let iteration = 0;
    const maxIterations = text.length;

    const tick = () => {
      setDisplayText(
        text
          .split('')
          .map((char, index) => {
            if (char === ' ' || char === '—' || char === '&' || char === '-') return char;
            if (index < iteration) {
              return text[index];
            }
            return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          })
          .join('')
      );

      iteration += 1 / 2;

      if (iteration <= maxIterations) {
        frameRef.current = window.requestAnimationFrame(tick);
      } else {
        setDisplayText(text);
        setIsGlitching(false);
      }
    };

    frameRef.current = window.requestAnimationFrame(tick);
  }, [text]);

  useEffect(() => {
    if (scrambleOnMount) {
      runScramble();
    }
    return () => {
      if (frameRef.current !== null && typeof window !== 'undefined') {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [runScramble, scrambleOnMount]);

  return (
    <Component
      className={cn(
        'transition-all duration-150 inline-block',
        isGlitching && 'text-shadow-glitch animate-pulse',
        className
      )}
    >
      {displayText}
    </Component>
  );
}

/**
 * Magnetic CTA button with cursor tracking & spring physics
 */
function MagneticCta({
  href,
  variant = 'primary',
  children,
  className,
}: {
  href: string;
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
      return;
    }

    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;

    const pullX = (clientX - centerX) * 0.28;
    const pullY = (clientY - centerY) * 0.28;

    setPosition({ x: pullX, y: pullY });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleClick = () => {
    try {
      soundEngine.play('blip');
    } catch {}
  };

  const isPrimary = variant === 'primary';

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 280, damping: 20 }}
      className="inline-block w-full sm:w-auto"
    >
      <Link
        href={href}
        onClick={handleClick}
        className={cn(
          'relative inline-flex items-center justify-center gap-2.5 font-semibold text-base px-7 py-3.5 rounded-xl select-none transition-all duration-200 w-full sm:w-auto text-center',
          isPrimary
            ? 'bg-gradient-to-r from-orange-500 via-rose-500 to-amber-500 text-white shadow-xl shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.02]'
            : 'bg-zinc-900/90 text-cyan-200 border border-zinc-700/80 hover:border-cyan-400 hover:bg-zinc-800/90 shadow-xl shadow-cyan-500/10 hover:shadow-cyan-500/25 hover:scale-[1.02]',
          className
        )}
      >
        {children}
      </Link>
    </motion.div>
  );
}

export default function HeroSection({ onOpenFakeDoor }: HeroSectionProps) {
  const [currentMode, setCurrentMode] = useState<PersonaMode>('spicy');

  return (
    <section className="relative text-center py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto flex flex-col items-center overflow-hidden">
      {/* Dynamic Ambient Background Glow shifting with Persona */}
      <div
        aria-hidden="true"
        className={cn(
          'absolute inset-0 pointer-events-none transition-colors duration-700 ease-in-out -z-10',
          currentMode === 'spicy' &&
            'bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(249,115,22,0.18),rgba(239,68,68,0.06),transparent_70%)]',
          currentMode === 'expert' &&
            'bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(6,182,212,0.18),rgba(59,130,246,0.06),transparent_70%)]',
          currentMode === 'stress' &&
            'bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(139,92,246,0.20),rgba(245,158,11,0.06),transparent_70%)]'
        )}
      />

      {/* Eyebrow Badge */}
      <Badge variant="spicy" className="mb-6 px-3 py-1.5 text-xs sm:text-sm">
        🔥 Dành riêng cho Sinh viên năm cuối & Fresher tại Việt Nam
      </Badge>

      {/* Main H1 Headline with Text Scramble */}
      <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight max-w-4xl">
        <TextScramble text="AI Roast CV —" as="span" />{' '}
        <span className="bg-gradient-to-r from-orange-400 via-rose-400 to-amber-300 bg-clip-text text-transparent">
          Mổ xẻ CV & Phỏng vấn áp lực
        </span>
        <span className="block mt-2 text-2xl sm:text-4xl text-zinc-200 font-bold">
          CV của bạn có đủ sức sống sót trước nhà tuyển dụng khó tính?
        </span>
      </h1>

      {/* Persona Switcher with instant mood and sound sync */}
      <div className="mt-8 w-full">
        <PersonaSwitcher currentMode={currentMode} onModeChange={setCurrentMode} />
      </div>

      {/* High-Performance 3D Hologram CV (Hardware-Accelerated CSS) */}
      <div id="hero-persona-view" className="mt-8 w-full flex justify-center">
        <CssHologramFallback mode={currentMode} />
      </div>

      {/* Value Proposition Copy */}
      <p className="mt-8 text-base sm:text-lg text-zinc-300 max-w-3xl mx-auto leading-relaxed">
        Hơn 80% CV sinh viên bị loại ngay từ vòng quét đầu vì câu chữ sáo rỗng và thiếu số liệu chứng minh. 
        AI Roast CV giúp bạn mổ xẻ CV không kiêng nể theo 2 góc nhìn (Cà khịa thẳng thắn hoặc Chuyên gia tận tâm), 
        đồng thời rèn luyện phản xạ qua 3 câu hỏi phỏng vấn áp lực sát thực tế.
      </p>

      {/* Mandatory AI Limitation Disclaimer Banner */}
      <div
        role="alert"
        aria-label="Tuyên bố miễn trừ trách nhiệm"
        className="mt-6 inline-flex items-start sm:items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs sm:text-sm text-left backdrop-blur-sm max-w-2xl mx-auto"
      >
        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5 sm:mt-0" />
        <div>
          <span className="font-semibold text-amber-300">Lưu ý quan trọng: </span>
          <span>
            Chỉ mang tính chất tham khảo luyện tập, không cam kết việc làm hay đỗ ATS. Quyết định tuyển dụng thực tế phụ thuộc hoàn toàn vào doanh nghiệp.
          </span>
        </div>
      </div>

      {/* Magnetic CTA Group (Preserving /roast and /interview Links) */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
        <MagneticCta href="/roast" variant="primary">
          <Flame className="w-5 h-5" />
          <span>🔥 Thử Roast CV ngay (Miễn phí 1 trang)</span>
        </MagneticCta>

        <MagneticCta href="/interview" variant="secondary">
          <Timer className="w-5 h-5 text-cyan-400" />
          <span>⏱️ Thử thách phỏng vấn áp lực</span>
        </MagneticCta>
      </div>

      {/* Trust Sub-notes */}
      <div className="mt-6 flex flex-wrap justify-center items-center gap-4 text-xs text-zinc-400">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          Không cần tạo tài khoản
        </span>
        <span>•</span>
        <span>100% không lưu trữ CV trên server</span>
        <span>•</span>
        <span>Xóa sạch dữ liệu trong 1 click</span>
      </div>
    </section>
  );
}
