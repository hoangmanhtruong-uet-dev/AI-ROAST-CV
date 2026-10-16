'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Cpu,
  Terminal,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { soundEngine } from '@/lib/audio/sound-engine';
import { cn } from '@/lib/utils/cn';

export interface SecurityBentoGridProps {
  className?: string;
}

export function SecurityBentoGrid({ className }: SecurityBentoGridProps) {
  // Cell 3: Thanos Snap Demo State
  const [isSnapped, setIsSnapped] = useState<boolean>(false);
  const [isSnapping, setIsSnapping] = useState<boolean>(false);

  // Cell 4: Hover / Focus PII Blur State
  const [isPiiMasked, setIsPiiMasked] = useState<boolean>(false);

  // Cell 2: Simulated Terminal Log Stream
  const terminalLogs = [
    { time: '07:14:01', level: 'INFO', msg: 'POST /api/roast inbound payload: 342 KB' },
    { time: '07:14:01', level: 'SEC', msg: 'Sanitizing candidate memory buffer in RAM' },
    { time: '07:14:02', level: 'WARN', msg: "Key 'cvText' suppressed -> [REDACTED_BY_ZERO_RETENTION]" },
    { time: '07:14:02', level: 'WARN', msg: "Key 'candidateAnswer' -> [REDACTED_BY_ZERO_RETENTION]" },
    { time: '07:14:02', level: 'API', msg: 'Google Gemini 2.5 Flash response: 200 OK' },
    { time: '07:14:02', level: 'PURGE', msg: 'RAM buffer zeroed. Disk writes: 0 bytes.' },
    { time: '07:14:03', level: 'AUDIT', msg: 'ZERO_RETENTION_VERIFIED. Retention: 0ms.' },
  ];

  const handleThanosSnap = () => {
    setIsSnapping(true);
    soundEngine.playLaser();
    setTimeout(() => {
      setIsSnapped(true);
      setIsSnapping(false);
    }, 600);
  };

  const handleRestoreSnap = () => {
    soundEngine.playBlip();
    setIsSnapped(false);
  };

  return (
    <section
      id="privacy-commitment"
      className={cn('my-16 max-w-6xl mx-auto px-4 sm:px-6', className)}
    >
      {/* Section Header */}
      <div className="text-center mb-6">
        <Badge variant="emerald" className="mb-3 px-3 py-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          Cam kết an toàn thông tin
        </Badge>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Quyền riêng tư là ưu tiên số 1 của chúng tôi
        </h2>
        <p className="text-sm text-zinc-400 mt-2 max-w-xl mx-auto">
          Chúng tôi xây dựng kiến trúc Zero-Retention: Không lưu trữ vĩnh viễn, bảo vệ tối đa dữ
          liệu ứng viên và minh bạch hoàn toàn.
        </p>
      </div>

      {/* Primary Mandatory Privacy Commitment Statement (Exact string for landing_stress.test.ts) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 font-medium text-center text-sm sm:text-base mb-8 shadow-inner shadow-emerald-950">
        🛡️{' '}
        <span className="font-semibold">
          Cam kết không lưu trữ CV hay câu trả lời trên máy chủ, xử lý an toàn tuyệt đối.
        </span>
      </div>

      {/* Dynamic 4-Cell Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
        {/* CELL 1: Animated SVG Data Pipeline (lg:col-span-7) */}
        <Card
          glow="emerald"
          className="lg:col-span-7 p-6 flex flex-col justify-between bg-zinc-900/60 border-zinc-800"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <Cpu className="w-4 h-4 text-emerald-400" />
              </div>
              <h3 className="text-base font-bold text-zinc-100">
                Xử lý bộ nhớ tạm (in-memory)
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 mb-6 leading-relaxed">
              Tệp CV và câu trả lời chỉ được phân tích tạm thời qua API Google Gemini Flash và giải
              phóng bộ nhớ ngay sau khi trả kết quả. Hoàn toàn không có cơ sở dữ liệu lưu trữ hồ sơ.
            </p>

            {/* Animated SVG Pipeline Diagram */}
            <div className="relative p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 overflow-hidden">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center">
                {/* Stage 1: CV Upload */}
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-emerald-400 mb-1.5 shadow-md">
                    <span className="text-lg">📄</span>
                  </div>
                  <span className="text-xs font-semibold text-zinc-200">CV Upload</span>
                  <span className="text-[10px] text-zinc-500">PDF / PNG / Text</span>
                </div>

                {/* Flow Arrow 1 */}
                <div className="hidden sm:flex flex-1 items-center justify-center px-1">
                  <div className="w-full border-t border-dashed border-emerald-500/40 relative">
                    <div className="absolute -top-1 right-0 w-2 h-2 border-t-2 border-r-2 border-emerald-400 rotate-45" />
                  </div>
                </div>

                {/* Stage 2: RAM Server */}
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-xl bg-emerald-950/40 border border-emerald-500/50 flex items-center justify-center text-emerald-400 mb-1.5 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                    <Cpu className="w-6 h-6 text-emerald-400 animate-pulse" />
                  </div>
                  <span className="text-xs font-semibold text-emerald-300">RAM Server</span>
                  <span className="text-[10px] text-emerald-400/80">In-Memory 0.1s TTL</span>
                </div>

                {/* Flow Arrow 2 */}
                <div className="hidden sm:flex flex-1 items-center justify-center px-1">
                  <div className="w-full border-t border-dashed border-emerald-500/40 relative">
                    <div className="absolute -top-1 right-0 w-2 h-2 border-t-2 border-r-2 border-emerald-400 rotate-45" />
                  </div>
                </div>

                {/* Stage 3: Gemini Flash */}
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-xl bg-purple-950/40 border border-purple-500/50 flex items-center justify-center text-purple-400 mb-1.5 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                    <Sparkles className="w-6 h-6 text-purple-400" />
                  </div>
                  <span className="text-xs font-semibold text-purple-300">Gemini Flash</span>
                  <span className="text-[10px] text-purple-400/80">AI Multimodal</span>
                </div>

                {/* Flow Arrow 3 */}
                <div className="hidden sm:flex flex-1 items-center justify-center px-1">
                  <div className="w-full border-t border-dashed border-rose-500/40 relative">
                    <div className="absolute -top-1 right-0 w-2 h-2 border-t-2 border-r-2 border-rose-400 rotate-45" />
                  </div>
                </div>

                {/* Stage 4: Self Destruct */}
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-xl bg-rose-950/40 border border-rose-500/50 flex items-center justify-center text-rose-400 mb-1.5 shadow-[0_0_15px_rgba(244,63,94,0.2)]">
                    <Trash2 className="w-6 h-6 text-rose-400" />
                  </div>
                  <span className="text-xs font-semibold text-rose-300">Tự hủy</span>
                  <span className="text-[10px] text-rose-400/80">Sau 0.1s</span>
                </div>
              </div>

              {/* Tagline requirement */}
              <div className="mt-4 pt-3 border-t border-zinc-800/80 text-center text-[11px] text-zinc-400">
                🔒 Quy trình xử lý: <strong>CV ➔ RAM Server ➔ Gemini Flash ➔ Tự hủy sau 0.1s, không qua ổ cứng</strong>.
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-zinc-400">
            <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">Ổ cứng: 0 KB</span>
            <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">Cơ sở dữ liệu: Không</span>
            <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
              RAM tự giải phóng sau 100ms
            </span>
          </div>
        </Card>

        {/* CELL 2: Simulated Live Security Terminal (lg:col-span-5) */}
        <Card
          glow="cyan"
          className="lg:col-span-5 p-6 flex flex-col justify-between bg-zinc-900/60 border-zinc-800"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                <Terminal className="w-4 h-4 text-cyan-400" />
              </div>
              <h3 className="text-base font-bold text-zinc-100">
                Không ghi nội dung vào log
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 mb-4 leading-relaxed">
              Hệ thống máy chủ áp dụng bộ lọc bảo mật nghiêm ngặt: Tuyệt đối không ghi nội dung văn
              bản CV, câu trả lời phỏng vấn hay thông tin liên hệ vào server log.
            </p>

            {/* Terminal Window Mockup */}
            <div className="rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-[11px] overflow-hidden shadow-2xl">
              {/* Window Header */}
              <div className="flex items-center justify-between px-3 py-2 bg-zinc-900/80 border-b border-zinc-800">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-[10px] text-zinc-500">zero-retention-monitor.log</span>
                <div className="w-8" />
              </div>

              {/* Terminal Output */}
              <div className="p-3 space-y-1.5 text-zinc-300 max-h-44 overflow-y-auto">
                {terminalLogs.map((log, index) => (
                  <div key={index} className="leading-tight flex items-start gap-1.5">
                    <span className="text-zinc-600 shrink-0">[{log.time}]</span>
                    <span
                      className={cn(
                        'font-bold shrink-0',
                        log.level === 'WARN'
                          ? 'text-amber-400'
                          : log.level === 'PURGE'
                          ? 'text-rose-400'
                          : log.level === 'SEC'
                          ? 'text-cyan-400'
                          : 'text-emerald-400'
                      )}
                    >
                      [{log.level}]
                    </span>
                    <span className="text-zinc-300 break-all">{log.msg}</span>
                  </div>
                ))}
                <div className="flex items-center gap-1 text-emerald-400 pt-1">
                  <span>❯ audit-daemon: listening for memory events</span>
                  <span className="inline-block w-2 h-3.5 bg-emerald-400 animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 text-[11px] text-zinc-500 italic">
            * Mọi trường văn bản nhạy cảm được thay thế bằng thẻ <code className="text-cyan-300">[REDACTED_BY_ZERO_RETENTION]</code> trước khi đến stdout.
          </div>
        </Card>

        {/* CELL 3: Interactive Thanos Snap Demo (lg:col-span-6) */}
        <Card
          glow="spicy"
          className="lg:col-span-6 p-6 flex flex-col justify-between bg-zinc-900/60 border-zinc-800"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
                <Trash2 className="w-4 h-4 text-rose-400" />
              </div>
              <h3 className="text-base font-bold text-zinc-100">
                Xóa dữ liệu một chạm
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 mb-4 leading-relaxed">
              Mọi bản nháp và kết quả đánh giá chỉ lưu tạm tại trình duyệt của bạn (LocalStorage).
              Nút &quot;Xóa sạch dữ liệu&quot; cho phép bạn xóa sổ toàn bộ phiên chỉ bằng một cú nhấp.
            </p>

            {/* Interactive Thanos Snap Playground */}
            <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 min-h-[160px] flex flex-col justify-center">
              {!isSnapped ? (
                <div
                  className={cn(
                    'p-3.5 rounded-lg bg-zinc-900 border border-zinc-700/80 transition-all duration-700',
                    isSnapping ? 'blur-lg opacity-0 scale-95 translate-y-1' : 'opacity-100 scale-100'
                  )}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-zinc-200">
                      📄 Bản nháp CV: Lê Minh Tuấn (Frontend)
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                      LocalStorage (14 KB)
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Kỹ năng: React, Next.js, TypeScript • Điểm Roast gần nhất: 7.8/10
                  </p>
                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-zinc-800">
                    <span className="text-[11px] text-zinc-500">Trạng thái: Đang lưu cục bộ</span>
                    <button
                      type="button"
                      disabled={isSnapping}
                      onClick={handleThanosSnap}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 active:scale-95 transition-all flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                      <span>Thử xóa dữ liệu (Thanos Snap)</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center space-y-2">
                  <div className="inline-flex p-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-1">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-emerald-300">
                    ✨ Dữ liệu đã tan biến hoàn toàn khỏi bộ nhớ trình duyệt! LocalStorage: 0 bytes.
                  </p>
                  <button
                    type="button"
                    onClick={handleRestoreSnap}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-all mt-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Khôi phục demo</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 text-[11px] text-zinc-500">
            * Ứng dụng cung cấp nút Wipe Data 1-chạm đồng bộ trên thanh điều hướng Navbar.
          </div>
        </Card>

        {/* CELL 4: Automatic PII Blur Preview on Hover (lg:col-span-6) */}
        <Card
          glow="cyan"
          className="lg:col-span-6 p-6 flex flex-col justify-between bg-zinc-900/60 border-zinc-800"
          onMouseEnter={() => setIsPiiMasked(true)}
          onMouseLeave={() => setIsPiiMasked(false)}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                  <EyeOff className="w-4 h-4 text-cyan-400" />
                </div>
                <h3 className="text-base font-bold text-zinc-100">
                  Ẩn danh thông tin cá nhân
                </h3>
              </div>
              {/* Touch Device Toggle */}
              <button
                type="button"
                onClick={() => setIsPiiMasked((prev) => !prev)}
                className="text-[11px] px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700 sm:hidden flex items-center gap-1"
              >
                {isPiiMasked ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                <span>{isPiiMasked ? 'Hiện rõ' : 'Che mờ'}</span>
              </button>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 mb-4 leading-relaxed">
              Thẻ chia sẻ kết quả (Share Card) được dựng 100% bằng HTML5 Canvas tại trình duyệt, tự
              động che mờ số điện thoại, email và liên kết cá nhân trước khi tải ảnh về.
            </p>

            {/* PII Masking Preview Mock Card */}
            <div
              className={cn(
                'p-4 rounded-xl border transition-all duration-300 relative overflow-hidden',
                isPiiMasked
                  ? 'bg-zinc-950/90 border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
                  : 'bg-zinc-950/60 border-zinc-800'
              )}
            >
              {isPiiMasked && (
                <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-semibold border border-cyan-500/40 animate-pulse">
                  <Lock className="w-3 h-3" />
                  <span>Lá chắn PII kích hoạt</span>
                </div>
              )}

              <div className="text-xs text-zinc-400 mb-2 font-mono uppercase tracking-wider">
                Xem trước Share Card:
              </div>

              <div className="space-y-1.5 text-xs sm:text-sm font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Họ và tên:</span>
                  <span className={cn('font-medium', isPiiMasked ? 'text-cyan-400 blur-[1px]' : 'text-zinc-200')}>
                    {isPiiMasked ? '[Họ tên ẩn danh]' : 'Nguyễn Hoàng Nam'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Số điện thoại:</span>
                  <span className={cn('font-medium', isPiiMasked ? 'text-cyan-400 blur-[2px]' : 'text-zinc-200')}>
                    {isPiiMasked ? '09****4321' : '0987 654 321'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Email:</span>
                  <span className={cn('font-medium', isPiiMasked ? 'text-cyan-400 blur-[2px]' : 'text-zinc-200')}>
                    {isPiiMasked ? 'h***m@gmail.com' : 'hoangnam.dev@gmail.com'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Portfolio:</span>
                  <span className={cn('font-medium', isPiiMasked ? 'text-cyan-400 blur-[1px]' : 'text-zinc-200')}>
                    {isPiiMasked ? '[Link ẩn danh]' : 'github.com/hoangnam'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 text-[11px] text-zinc-500">
            * Rê chuột hoặc chạm vào thẻ để kích hoạt hiệu ứng lá chắn bảo vệ danh tính.
          </div>
        </Card>
      </div>
    </section>
  );
}

export default SecurityBentoGrid;
