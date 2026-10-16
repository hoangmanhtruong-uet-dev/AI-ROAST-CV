'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type PersonaMode = 'spicy' | 'expert' | 'stress';

export interface CssHologramFallbackProps {
  mode?: PersonaMode;
  className?: string;
}

export default function CssHologramFallback({
  mode = 'spicy',
  className,
}: CssHologramFallbackProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // Mouse Parallax Calculation (3D Tilt)
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const tiltX = ((y - centerY) / centerY) * -12; // -12deg to +12deg
    const tiltY = ((x - centerX) / centerX) * 12;

    setTilt({ x: tiltX, y: tiltY });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  }, []);

  // Theme palettes based on active Persona
  const themes = {
    spicy: {
      neonBorder: 'border-orange-500/50 shadow-[0_0_30px_rgba(249,115,22,0.25)]',
      laserBeam: 'from-orange-500/0 via-orange-400 to-rose-500/0 shadow-[0_0_15px_#f97316]',
      hudColor: 'text-orange-400',
      badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
      emberColor: 'bg-orange-400 shadow-[0_0_8px_#f97316]',
      label: 'MỎ HỖN ROAST // V2.0',
      clichéText: '"Có khả năng làm việc nhóm tốt, chịu áp lực công việc cao."',
      atsText: '"Tối ưu 35% thông lượng dữ liệu Redis, giảm p95 latency từ 120ms xuống 45ms."',
    },
    expert: {
      neonBorder: 'border-cyan-400/50 shadow-[0_0_30px_rgba(6,182,212,0.25)]',
      laserBeam: 'from-cyan-400/0 via-cyan-300 to-blue-500/0 shadow-[0_0_15px_#06b6d4]',
      hudColor: 'text-cyan-300',
      badgeBg: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40',
      emberColor: 'bg-cyan-300 shadow-[0_0_8px_#06b6d4]',
      label: 'ATS DIRECTOR // V2.0',
      clichéText: '"Chăm chỉ, ham học hỏi và luôn hoàn thành nhiệm vụ được giao."',
      atsText: '"Triển khai CI/CD pipeline tự động hóa với Docker & GitHub Actions, giảm 50% thời gian release."',
    },
    stress: {
      neonBorder: 'border-violet-500/50 shadow-[0_0_30px_rgba(139,92,246,0.25)]',
      laserBeam: 'from-violet-500/0 via-violet-300 to-amber-400/0 shadow-[0_0_15px_#8b5cf6]',
      hudColor: 'text-violet-300',
      badgeBg: 'bg-violet-500/20 text-violet-200 border-violet-400/40',
      emberColor: 'bg-violet-400 shadow-[0_0_8px_#8b5cf6]',
      label: 'STRESS SIMULATOR // 00:59',
      clichéText: '"Em tự tin có thể thích nghi nhanh với mọi môi trường công nghệ."',
      atsText: '"Xử lý sự cố downtime production trong 15 phút bằng phương pháp phân tích root-cause có kiểm chứng."',
    },
  };

  const theme = themes[mode] || themes.spicy;

  return (
    <div
      role="img"
      aria-label="Mô phỏng CV Hologram 3D (CSS Fallback)"
      data-testid="hero-hologram-fallback"
      className={cn(
        'relative w-full max-w-[440px] aspect-[1/1.38] perspective-[1000px] select-none mx-auto',
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      {/* Embedded scoped keyframes for standalone reliability */}
      <style>{`
        @keyframes hologramScanKeyframes {
          0% { top: -5%; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { top: 105%; opacity: 0; }
        }
        @keyframes emberFloatKeyframes {
          0% { transform: translateY(0) scale(0.6); opacity: 0; }
          30% { opacity: 0.85; }
          80% { opacity: 0.6; }
          100% { transform: translateY(-280px) scale(1.1); opacity: 0; }
        }
        .animate-hologram-scan {
          animation: hologramScanKeyframes 3.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .animate-ember-float {
          animation: emberFloatKeyframes 4s ease-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-hologram-scan,
          .animate-ember-float {
            animation: none !important;
          }
        }
      `}</style>

      {/* 3D Tilted Sheet */}
      <div
        ref={cardRef}
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(${isHovered ? 1.02 : 1}, ${isHovered ? 1.02 : 1}, 1)`,
          transformStyle: 'preserve-3d',
          transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s ease-out',
        }}
        className={cn(
          'relative w-full h-full rounded-2xl p-6 sm:p-7 flex flex-col justify-between overflow-hidden',
          'bg-gradient-to-b from-zinc-900/90 via-zinc-950/95 to-black/95',
          'backdrop-blur-xl border',
          theme.neonBorder
        )}
      >
        {/* Sci-fi HUD Corner Brackets */}
        <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 border-white/40 pointer-events-none" />
        <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 border-white/40 pointer-events-none" />
        <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 border-white/40 pointer-events-none" />
        <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 border-white/40 pointer-events-none" />

        {/* Continuous Animated Laser Scanline */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 h-10 pointer-events-none z-20 animate-hologram-scan"
        >
          <div className={cn('w-full h-1 bg-gradient-to-r', theme.laserBeam)} />
          <div className="w-full h-8 bg-gradient-to-b from-white/10 to-transparent blur-sm" />
        </div>

        {/* Top HUD Header */}
        <div className="relative z-10 flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className={cn('text-[11px] font-mono tracking-widest uppercase font-semibold', theme.hudColor)}>
              {theme.label}
            </span>
          </div>
          <span className={cn('text-[10px] font-mono px-2 py-0.5 rounded-full border', theme.badgeBg)}>
            AI SCANNED
          </span>
        </div>

        {/* Hologram Candidate Profile Section */}
        <div className="relative z-10 my-4 flex items-center gap-3.5 bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/60">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-950 border border-zinc-700 flex items-center justify-center text-lg font-bold text-zinc-300 shadow-inner">
            CV
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-zinc-100 truncate">Ứng viên Fresher</h3>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">
                ATS: 88/100
              </span>
            </div>
            <p className="text-xs text-zinc-400 truncate">Software Engineer • Frontend / Fullstack</p>
          </div>
        </div>

        {/* Holographic Transformation Body: Cliché Disintegration -> Emerald ATS Bars */}
        <div className="relative z-10 space-y-3.5 text-left font-sans">
          {/* Cliché phrase before laser */}
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30">
            <div className="flex items-center gap-1.5 text-xs text-rose-300 font-medium mb-1">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>Phát hiện câu chữ sáo rỗng (Cliché):</span>
            </div>
            <p className="text-xs text-zinc-400 line-through decoration-rose-500/80 italic pl-5">
              {theme.clichéText}
            </p>
          </div>

          {/* Reassembled ATS Emerald Bar */}
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <div className="flex items-center justify-between text-xs text-emerald-300 font-semibold mb-1">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Viết lại chuẩn ATS (Action + Metric):</span>
              </div>
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            </div>
            <p className="text-xs text-emerald-100 font-mono pl-5">
              {theme.atsText}
            </p>
          </div>

          {/* Score breakdown metrics */}
          <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[10px]">
            <div className="p-2 rounded bg-zinc-900/60 border border-zinc-800 text-center">
              <div className="text-zinc-400">Impact</div>
              <div className="text-emerald-400 font-bold mt-0.5">92%</div>
            </div>
            <div className="p-2 rounded bg-zinc-900/60 border border-zinc-800 text-center">
              <div className="text-zinc-400">ATS Keywords</div>
              <div className="text-cyan-400 font-bold mt-0.5">85%</div>
            </div>
            <div className="p-2 rounded bg-zinc-900/60 border border-zinc-800 text-center">
              <div className="text-zinc-400">Zero Cliché</div>
              <div className="text-amber-400 font-bold mt-0.5">88%</div>
            </div>
          </div>
        </div>

        {/* Hologram Bottom Watermark */}
        <div className="relative z-10 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[10px] font-mono text-zinc-500">
          <span>AI ROAST ENGINE 2.0</span>
          <span>100% CLIENT VERIFIED</span>
        </div>

        {/* Ambient CSS Ember Particles */}
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          {[...Array(12)].map((_, i) => (
            <span
              key={i}
              style={{
                left: `${i * 8.3 + 4}%`,
                animationDelay: `${(i * 0.45).toFixed(2)}s`,
                animationDuration: `${(3 + (i % 3) * 1.2).toFixed(2)}s`,
              }}
              className={cn(
                'absolute bottom-0 w-1.5 h-1.5 rounded-full animate-ember-float opacity-0',
                theme.emberColor
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
