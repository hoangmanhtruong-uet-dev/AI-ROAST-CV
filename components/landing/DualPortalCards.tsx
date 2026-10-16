'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import {
  Flame,
  Timer,
  Check,
  ArrowRight,
  Sparkles,
  Heart,
  Sliders,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { soundEngine } from '@/lib/audio/sound-engine';
import { cn } from '@/lib/utils/cn';

export interface DualPortalCardsProps {
  className?: string;
  onRoastClick?: () => void;
  onInterviewClick?: () => void;
}

/**
 * Custom 3D Tilt Hook calculating coordinates and specular glare
 */
function use3DTilt(maxTilt = 9) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [glare, setGlare] = useState<{ x: number; y: number; opacity: number }>({
    x: 50,
    y: 50,
    opacity: 0,
  });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return;
      if (typeof window !== 'undefined') {
        try {
          if (
            window.matchMedia?.('(pointer: coarse)').matches ||
            window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
          ) {
            return;
          }
        } catch {}
      }

      const rect = cardRef.current.getBoundingClientRect();
      const width = rect.width || 1;
      const height = rect.height || 1;
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const normalizedX = (mouseX - width / 2) / (width / 2);
      const normalizedY = (mouseY - height / 2) / (height / 2);

      const rotateX = -normalizedY * maxTilt;
      const rotateY = normalizedX * maxTilt;

      setTilt({ x: rotateX, y: rotateY });
      setGlare({
        x: (mouseX / width) * 100,
        y: (mouseY / height) * 100,
        opacity: 0.22,
      });
    },
    [maxTilt]
  );

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
    setGlare((prev) => ({ ...prev, opacity: 0 }));
  }, []);

  return { cardRef, tilt, glare, handleMouseMove, handleMouseLeave };
}

export function DualPortalCards({
  className,
  onRoastClick,
  onInterviewClick,
}: DualPortalCardsProps) {
  // 3D Tilt States
  const roastTilt = use3DTilt(9);
  const interviewTilt = use3DTilt(9);

  // Interactive Mini-Demo State for Card 1 (Roast CV Spice Level)
  const [spiceLevel, setSpiceLevel] = useState<'expert' | 'spicy'>('spicy');

  // Interactive Mini-Demo State for Card 2 (Stress Interview Timer Simulator)
  const [countdown, setCountdown] = useState<number>(59);
  const [isCounting, setIsCounting] = useState<boolean>(false);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  const handleSpiceToggle = (level: 'expert' | 'spicy') => {
    setSpiceLevel(level);
    try {
      soundEngine.playBlip();
    } catch {}
  };

  const startCountdownDemo = () => {
    if (isCounting) return;
    setIsCounting(true);
    setCountdown(59);
    try {
      soundEngine.playHeartbeat();
    } catch {}

    let current = 59;
    timerIntervalRef.current = setInterval(() => {
      current -= 1;
      setCountdown(current);
      if (current <= 56) {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        setIsCounting(false);
      }
    }, 1000);
  };

  const handleRoastCtaClick = () => {
    try {
      soundEngine.playFlame();
    } catch {}
    if (onRoastClick) onRoastClick();
  };

  const handleInterviewCtaClick = () => {
    try {
      soundEngine.playLaser();
    } catch {}
    if (onInterviewClick) onInterviewClick();
  };

  const roastFeatures = [
    'Hỗ trợ tệp PDF, PNG, JPG (≤ 5MB) hoặc dán trực tiếp văn bản CV.',
    'Chấm điểm ATS tức thì, phơi bày câu chữ sáo rỗng & lỗi nghiêm trọng.',
    '2 Chế độ giọng điệu: "Cà khịa / Mỏ hỗn" và "Chuyên gia tận tâm".',
    'Gợi ý viết lại Action Verb + [Số liệu] (tuyệt đối không bịa đặt thành tích).',
    'Tối ưu hóa cấu trúc, từ khóa ngành và tỷ lệ vượt qua bộ lọc ATS.',
  ];

  const interviewFeatures = [
    '2 Vai trò khởi đầu: IT / Software Engineer hoặc Marketing / Business.',
    'Tùy biến bộ câu hỏi bám sát Job Description (JD) của công ty mục tiêu.',
    '3 Câu hỏi tình huống hóc búa liên tiếp rèn luyện phản xạ ứng biến.',
    'Đồng hồ đếm ngược (60s - 90s) & mô phỏng áp lực phòng thi thực tế.',
    'Chấm điểm theo Rubric 5 tiêu chí công khai kèm nhận xét sâu sắc.',
  ];

  return (
    <section
      id="features"
      className={cn('my-16 max-w-6xl mx-auto px-4 sm:px-6', className)}
    >
      {/* Section Header */}
      <div className="text-center mb-12">
        <Badge variant="spicy" className="mb-3 px-3 py-1">
          <Sparkles className="w-3.5 h-3.5 text-orange-400" />
          Trải Nghiệm Thực Chiến 3D
        </Badge>
        <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
          Chọn Cánh Cổng Trải Nghiệm Của Bạn
        </h2>
        <p className="mt-3 text-sm sm:text-base text-zinc-400 max-w-xl mx-auto">
          Hoàn toàn miễn phí, xử lý dữ liệu in-memory an toàn tuyệt đối và không cần đăng ký tài khoản.
        </p>
      </div>

      {/* Dual 3D Tilt Portal Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" style={{ perspective: 1200 }}>
        {/* ========================================================= */}
        {/* PORTAL 1: 🔥 ROAST CV SIÊU CAY */}
        {/* ========================================================= */}
        <div
          ref={roastTilt.cardRef}
          onMouseMove={roastTilt.handleMouseMove}
          onMouseLeave={roastTilt.handleMouseLeave}
          style={{
            transform: `rotateX(${roastTilt.tilt.x}deg) rotateY(${roastTilt.tilt.y}deg)`,
            transformStyle: 'preserve-3d',
            transition: 'transform 0.15s ease-out',
          }}
          className="relative rounded-2xl group"
        >
          {/* Specular Glare Overlay */}
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300 z-20"
            style={{
              opacity: roastTilt.glare.opacity,
              background: `radial-gradient(circle 350px at ${roastTilt.glare.x}% ${roastTilt.glare.y}%, rgba(249, 115, 22, 0.25), transparent 70%)`,
            }}
          />

          <Card
            id="feature-roast"
            glow="spicy"
            className="h-full flex flex-col justify-between p-6 sm:p-8 bg-zinc-900/80 border-orange-500/30 hover:border-orange-500/70 shadow-xl hover:shadow-orange-500/10 transition-all duration-300"
          >
            <div>
              {/* Card Header & Badges */}
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500 shadow-inner">
                  <Flame className="w-6 h-6 fill-orange-500/20" />
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="spicy">🔥 Miễn phí 1 trang</Badge>
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700">
                    ATS Audit
                  </span>
                </div>
              </div>

              {/* Title & Tagline */}
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 group-hover:text-orange-400 transition-colors">
                Roast CV Siêu Cay (Mỏ Hỗn &amp; Chuyên Gia)
              </h3>
              <p className="text-sm text-zinc-300 mb-6 leading-relaxed">
                Vạch trần mọi câu từ sáo rỗng trong CV, chỉ ra điểm chết khiến HR loại hồ sơ và đề xuất câu viết lại chuẩn ATS.
              </p>

              {/* Interactive Mini-Demo: Spice Level Switcher */}
              <div className="mb-6 p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800 text-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                    <Sliders className="w-3 h-3 text-orange-400" />
                    Đọc thử 1 câu nhận xét mẫu:
                  </span>
                  <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
                    <button
                      type="button"
                      onClick={() => handleSpiceToggle('expert')}
                      className={cn(
                        'px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer',
                        spiceLevel === 'expert'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : 'text-zinc-400 hover:text-zinc-200'
                      )}
                    >
                      🧊 Chuyên gia
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSpiceToggle('spicy')}
                      className={cn(
                        'px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer',
                        spiceLevel === 'spicy'
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                          : 'text-zinc-400 hover:text-zinc-200'
                      )}
                    >
                      🔥 Mỏ hỗn
                    </button>
                  </div>
                </div>

                <div className="italic text-zinc-200">
                  {spiceLevel === 'spicy' ? (
                    <span>
                      &ldquo;Ghi &lsquo;thành thạo Word, Excel&rsquo; năm 2026 thì khác gì khoe mình biết thở? -50 điểm ATS, HR đóng tab sau 2s!&rdquo;
                    </span>
                  ) : (
                    <span>
                      &ldquo;Kỹ năng tin học văn phòng nên được cụ thể hóa bằng các dự án số liệu, ví dụ: Phân tích báo cáo dữ liệu 10.000 dòng bằng Excel VBA.&rdquo;
                    </span>
                  )}
                </div>
              </div>

              {/* Checklist */}
              <ul className="space-y-3 mb-8">
                {roastFeatures.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-zinc-300">
                    <div className="w-4 h-4 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center mt-0.5 shrink-0">
                      <Check className="w-3 h-3" />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA Button Preserving Link & Text Invariant */}
            <Link
              href="/roast"
              onClick={handleRoastCtaClick}
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold transition-all shadow-lg shadow-orange-600/25 hover:scale-[1.02] cursor-pointer"
            >
              <span>🔥 Bắt đầu Roast CV ngay (Miễn phí)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Card>
        </div>

        {/* ========================================================= */}
        {/* PORTAL 2: ⚡ PHỎNG VẤN ÁP LỰC */}
        {/* ========================================================= */}
        <div
          ref={interviewTilt.cardRef}
          onMouseMove={interviewTilt.handleMouseMove}
          onMouseLeave={interviewTilt.handleMouseLeave}
          style={{
            transform: `rotateX(${interviewTilt.tilt.x}deg) rotateY(${interviewTilt.tilt.y}deg)`,
            transformStyle: 'preserve-3d',
            transition: 'transform 0.15s ease-out',
          }}
          className="relative rounded-2xl group"
        >
          {/* Specular Glare Overlay */}
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300 z-20"
            style={{
              opacity: interviewTilt.glare.opacity,
              background: `radial-gradient(circle 350px at ${interviewTilt.glare.x}% ${interviewTilt.glare.y}%, rgba(6, 182, 212, 0.25), transparent 70%)`,
            }}
          />

          <Card
            id="feature-interview"
            glow="cyan"
            className="h-full flex flex-col justify-between p-6 sm:p-8 bg-zinc-900/80 border-cyan-500/30 hover:border-cyan-500/70 shadow-xl hover:shadow-cyan-500/10 transition-all duration-300"
          >
            <div>
              {/* Card Header & Badges */}
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
                  <Timer className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="cyan">⏱️ Thử thách bản lĩnh</Badge>
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700">
                    JD Simulation
                  </span>
                </div>
              </div>

              {/* Title & Tagline */}
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                Phỏng Vấn Áp Lực (Stress Interview)
              </h3>
              <p className="text-sm text-zinc-300 mb-6 leading-relaxed">
                Mô phỏng áp lực phòng thi thực tế với 3 câu hỏi tình huống hóc búa, đếm ngược thời gian và chấm điểm Rubric 5 tiêu chí.
              </p>

              {/* Interactive Mini-Demo: Countdown & Heartbeat Simulator */}
              <div className="mb-6 p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800 text-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                    <Heart className="w-3 h-3 text-rose-400 animate-pulse" />
                    Đồng hồ áp lực &amp; nhịp tim:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/30">
                      00:{countdown < 10 ? `0${countdown}` : countdown}
                    </span>
                    <button
                      type="button"
                      onClick={startCountdownDemo}
                      disabled={isCounting}
                      className={cn(
                        'px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer',
                        isCounting
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                          : 'bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700'
                      )}
                    >
                      {isCounting ? 'Đang đo nhịp tim...' : 'Thử đếm 3s'}
                    </button>
                  </div>
                </div>

                <div className="text-zinc-300 leading-snug">
                  <span className="text-zinc-500">Câu hỏi thử thách:</span> &ldquo;Nếu sếp trực tiếp làm sai quy trình nghiêm trọng gây thất thoát, bạn báo cáo ai đầu tiên?&rdquo;
                </div>
              </div>

              {/* Checklist */}
              <ul className="space-y-3 mb-8">
                {interviewFeatures.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-zinc-300">
                    <div className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center mt-0.5 shrink-0">
                      <Check className="w-3 h-3" />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA Button Preserving Link & Text Invariant */}
            <Link
              href="/interview"
              onClick={handleInterviewCtaClick}
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition-all shadow-lg shadow-cyan-600/25 hover:scale-[1.02] cursor-pointer"
            >
              <span>⏱️ Vào phỏng vấn áp lực ngay</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Card>
        </div>
      </div>
    </section>
  );
}

export default DualPortalCards;
