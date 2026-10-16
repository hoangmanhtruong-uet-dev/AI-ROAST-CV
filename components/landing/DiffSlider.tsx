'use client';

import React, { useState, useRef, useCallback } from 'react';
import { ChevronsLeftRight, XCircle, CheckCircle2, Sparkles, AlertTriangle } from 'lucide-react';
import { soundEngine } from '@/lib/audio/sound-engine';

export interface DiffPreset {
  id: string;
  role: string;
  iconName: string;
  before: {
    badge: string;
    score: number;
    title: string;
    weakVerb: string;
    bulletText: string;
    weakPhrases: string[];
    critique: string;
  };
  after: {
    badge: string;
    score: number;
    title: string;
    actionVerb: string;
    bulletText: string;
    placeholders: string[];
    formula: string;
    impactTags: string[];
  };
}

export const DIFF_PRESETS: DiffPreset[] = [
  {
    id: 'backend',
    role: 'Backend / Software Engineer',
    iconName: 'Server',
    before: {
      badge: 'Bị loại vòng gửi xe',
      score: 28,
      title: 'Mô tả sáo rỗng & thụ động',
      weakVerb: 'Tham gia',
      bulletText: 'Tham gia hỗ trợ nhóm dự án phát triển hệ thống backend, viết API theo yêu cầu của cấp trên và sửa các lỗi phát sinh.',
      weakPhrases: ['Tham gia hỗ trợ', 'theo yêu cầu của cấp trên', 'các lỗi phát sinh'],
      critique: 'Không rõ bạn thực sự làm gì, không có số liệu chứng minh hiệu năng hay quy mô chịu tải.',
    },
    after: {
      badge: 'Qua ải ATS 98/100',
      score: 98,
      title: 'Chuẩn công thức Action Verb + Context + Result',
      actionVerb: 'Chủ trì kiến trúc',
      bulletText: 'Chủ trì kiến trúc hệ thống Microservices xử lý [15.000+] req/s bằng Go và Redis Cluster, tái cấu trúc 18 endpoints giúp rút ngắn [45%] thời gian tải trang p99 và duy trì SLA [99.99%].',
      placeholders: ['[15.000+]', '[45%]', '[99.99%]'],
      formula: 'Action Verb (Chủ trì) + Context (Go/Redis) + Result [45% p99, SLA 99.99%]',
      impactTags: ['+15k req/s', '-45% Latency', 'SLA 99.99%'],
    },
  },
  {
    id: 'frontend',
    role: 'Frontend / Web Developer',
    iconName: 'Layout',
    before: {
      badge: 'Bị loại vòng gửi xe',
      score: 32,
      title: 'Làm việc thụ động, thiếu tác động',
      weakVerb: 'Làm việc',
      bulletText: 'Làm việc trong team frontend, cắt HTML/CSS từ file Figma và hỗ trợ tích hợp API từ backend gửi sang.',
      weakPhrases: ['Làm việc trong team', 'cắt HTML/CSS', 'hỗ trợ tích hợp'],
      critique: 'Cắt HTML/CSS là kỹ năng cơ bản, không thể hiện tư duy kiến trúc UI hay tối ưu trải nghiệm người dùng.',
    },
    after: {
      badge: 'Qua ải ATS 98/100',
      score: 96,
      title: 'Lượng hóa trải nghiệm & Hiệu năng Core Web Vitals',
      actionVerb: 'Tái thiết kế',
      bulletText: 'Tái thiết kế toàn bộ UI Component Library bằng Next.js 15 và Tailwind CSS, áp dụng Dynamic Import và Virtualized List giúp tăng [3.2x] điểm Core Web Vitals (LCP giảm từ [4.2s] xuống [1.1s]).',
      placeholders: ['[3.2x]', '[4.2s]', '[1.1s]'],
      formula: 'Action Verb (Tái thiết kế) + Context (Next.js/Tailwind) + Result [3.2x Web Vitals, LCP 1.1s]',
      impactTags: ['3.2x Performance', 'LCP: 1.1s', 'Next.js 15'],
    },
  },
  {
    id: 'marketing',
    role: 'Marketing / Growth Specialist',
    iconName: 'TrendingUp',
    before: {
      badge: 'Bị loại vòng gửi xe',
      score: 25,
      title: 'Chung chung, không có số đo ROI',
      weakVerb: 'Phụ trách',
      bulletText: 'Phụ trách chạy quảng cáo Facebook Ads, viết bài cho fanpage công ty và hỗ trợ tổ chức các sự kiện online.',
      weakPhrases: ['Phụ trách chạy', 'viết bài', 'hỗ trợ tổ chức'],
      critique: 'Nhà tuyển dụng cần biết bạn tiêu bao nhiêu ngân sách, đem về bao nhiêu chuyển đổi (CPA/ROAS), không cần biết bạn chỉ "viết bài".',
    },
    after: {
      badge: 'Qua ải ATS 98/100',
      score: 95,
      title: 'Tối ưu hóa phễu chuyển đổi & ROAS đo lường được',
      actionVerb: 'Tối ưu hóa',
      bulletText: 'Tối ưu hóa chiến dịch Performance Marketing ngân sách [120 triệu/tháng] trên Meta & TikTok Ads, thử nghiệm 24 biến thể A/B testing giúp giảm [38%] CPA và thu về [1.450+] khách hàng tiềm năng đạt chuẩn.',
      placeholders: ['[120 triệu/tháng]', '[38%]', '[1.450+]'],
      formula: 'Action Verb (Tối ưu hóa) + Context (Meta/TikTok Ads) + Result [-38% CPA, 1.450+ MQLs]',
      impactTags: ['-38% CPA', '1.450+ Leads', 'ROAS 3.8x'],
    },
  },
  {
    id: 'data',
    role: 'Data Analyst / BI',
    iconName: 'BarChart3',
    before: {
      badge: 'Bị loại vòng gửi xe',
      score: 30,
      title: 'Xuất dữ liệu thủ công, thiếu tự động hóa',
      weakVerb: 'Hỗ trợ',
      bulletText: 'Hỗ trợ tổng hợp dữ liệu doanh số từ các phòng ban, làm báo cáo Excel hàng tuần cho ban giám đốc xem.',
      weakPhrases: ['Hỗ trợ tổng hợp', 'làm báo cáo Excel', 'cho ban giám đốc xem'],
      critique: 'Làm Excel thủ công thể hiện năng suất thấp và nguy cơ sai sót cao, không mang lại giá trị ra quyết định theo thời gian thực.',
    },
    after: {
      badge: 'Qua ải ATS 98/100',
      score: 97,
      title: 'Tự động hóa luồng dữ liệu & Ra quyết định tức thì',
      actionVerb: 'Tự động hóa',
      bulletText: 'Tự động hóa luồng trích xuất dữ liệu ETL bằng Python và SQL kết nối BigQuery, xây dựng 6 Dashboard PowerBI thời gian thực phục vụ [12] phòng ban, tiết kiệm [160 giờ/tháng] xử lý thủ công.',
      placeholders: ['[12]', '[160 giờ/tháng]'],
      formula: 'Action Verb (Tự động hóa) + Context (Python/BigQuery) + Result [160h tiết kiệm/tháng]',
      impactTags: ['-160h/tháng', 'Real-time ETL', '12 Phòng ban'],
    },
  },
];

export interface DiffSliderProps {
  initialPercentage?: number;
  presets?: DiffPreset[];
  className?: string;
}

function renderFormattedAfterText(text: string, actionVerb: string) {
  // Strip actionVerb from the beginning if already rendered
  let remaining = text.startsWith(actionVerb) ? text.slice(actionVerb.length).trim() : text;
  // Replace [...] with styled badges
  const parts = remaining.split(/(\[[^\]]+\])/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('[') && part.endsWith(']')) {
          return (
            <span
              key={i}
              className="inline-block mx-1 px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono font-bold text-xs border border-emerald-500/40 shadow-sm"
            >
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

export function DiffSlider({
  initialPercentage = 50,
  presets = DIFF_PRESETS,
  className = '',
}: DiffSliderProps) {
  const [sliderPos, setSliderPos] = useState<number>(initialPercentage);
  const [activePresetIndex, setActivePresetIndex] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const activePreset = presets[activePresetIndex] || presets[0];

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width || 1;
    const rawPct = ((clientX - rect.left) / width) * 100;
    const clamped = Math.max(5, Math.min(95, rawPct));
    setSliderPos(clamped);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {}
    setIsDragging(true);
    updatePosition(e.clientX);
    try {
      soundEngine.playBlip();
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    updatePosition(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      try {
        e.currentTarget.releasePointerCapture?.(e.pointerId);
      } catch {}
      setIsDragging(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    let next = sliderPos;
    if (e.key === 'ArrowLeft') next = Math.max(5, sliderPos - 5);
    else if (e.key === 'ArrowRight') next = Math.min(95, sliderPos + 5);
    else if (e.key === 'Home') next = 5;
    else if (e.key === 'End') next = 95;
    else if (e.key === 'PageUp') next = Math.max(5, sliderPos - 15);
    else if (e.key === 'PageDown') next = Math.min(95, sliderPos + 15);
    else return;

    e.preventDefault();
    setSliderPos(next);
    try {
      soundEngine.playBlip();
    } catch {}
  };

  return (
    <section className={`w-full max-w-5xl mx-auto py-12 px-4 sm:px-6 ${className}`}>
      {/* Section Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Interactive Diff Slider</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          So Sánh Trực Quan: <span className="text-red-400 line-through decoration-red-500/50">Văn Mẫu Bị Loại</span> vs{' '}
          <span className="text-emerald-400 font-extrabold">Chuẩn ATS 98/100</span>
        </h2>
        <p className="text-sm text-zinc-400 mt-2 max-w-2xl mx-auto">
          Kéo thanh trượt để chứng kiến sức mạnh của việc thay thế từ ngữ bị động bằng động từ hành động và số liệu lượng hóa có thể đo lường.
        </p>

        {/* Preset Selector Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
          {presets.map((preset, idx) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                setActivePresetIndex(idx);
                try {
                  soundEngine.playBlip();
                } catch {}
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                activePresetIndex === idx
                  ? 'bg-gradient-to-r from-orange-500/20 to-emerald-500/20 border border-orange-500/40 text-white shadow-lg'
                  : 'bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              {preset.role}
            </button>
          ))}
        </div>
      </div>

      {/* Main Diff Slider Box */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative w-full min-h-[360px] sm:min-h-[320px] rounded-3xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl select-none cursor-ew-resize touch-pan-y"
      >
        {/* Layer 1: Left / Before (Full size behind) */}
        <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-between bg-gradient-to-br from-red-950/25 via-zinc-950 to-zinc-900/60 text-zinc-200">
          <div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold uppercase tracking-wider">
                <XCircle className="w-4 h-4 text-red-400" />
                {activePreset.before.badge}
              </span>
              <span className="text-xs font-mono font-bold text-red-400 bg-red-950/40 px-2.5 py-0.5 rounded border border-red-900/50">
                ATS: {activePreset.before.score}/100
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-red-200 mb-2">
              {activePreset.before.title}
            </h3>

            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed font-normal bg-red-950/15 p-4 rounded-2xl border border-red-900/20">
              <span className="line-through decoration-red-500/70 decoration-2 text-red-300 font-medium">
                {activePreset.before.bulletText}
              </span>
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-red-900/30 flex items-start gap-2 text-xs text-red-300/80">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{activePreset.before.critique}</span>
          </div>
        </div>

        {/* Layer 2: Right / After (Clipped Overlay) */}
        <div
          style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
          className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-between bg-gradient-to-br from-emerald-950/30 via-zinc-950 to-zinc-900/80 text-zinc-100 pointer-events-none"
        >
          <div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                {activePreset.after.badge}
              </span>
              <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-950/60 px-2.5 py-0.5 rounded border border-emerald-800/60">
                ATS: {activePreset.after.score}/100
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-emerald-200 mb-2">
              {activePreset.after.title}
            </h3>

            <div className="text-sm sm:text-base text-zinc-100 leading-relaxed font-normal bg-emerald-950/20 p-4 rounded-2xl border border-emerald-800/30 shadow-inner">
              {/* Highlight Action Verb + [Placeholder] chips */}
              <span className="text-emerald-300 font-bold underline decoration-emerald-500/40">
                {activePreset.after.actionVerb}
              </span>{' '}
              {renderFormattedAfterText(activePreset.after.bulletText, activePreset.after.actionVerb)}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-emerald-800/30 flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-emerald-400 font-mono">
              ⚡ {activePreset.after.formula}
            </div>
            <div className="flex items-center gap-1.5">
              {activePreset.after.impactTags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono text-emerald-300 font-semibold"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Divider Bar & Draggable Handle */}
        <div
          style={{ left: `${sliderPos}%` }}
          className="absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-orange-400 via-white to-emerald-400 shadow-[0_0_12px_rgba(255,255,255,0.6)] pointer-events-none"
        >
          {/* Centered Thumb Button */}
          <div
            role="slider"
            tabIndex={0}
            onKeyDown={handleKeyDown}
            aria-label="Thanh trượt so sánh CV Trước và Sau"
            aria-valuenow={Math.round(sliderPos)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuetext={`${Math.round(sliderPos)}% tối ưu ATS`}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-zinc-900 border-2 border-white shadow-[0_0_20px_rgba(255,255,255,0.4)] flex items-center justify-center pointer-events-auto cursor-grab active:cursor-grabbing hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <ChevronsLeftRight className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      {/* Instructional Footer */}
      <div className="flex items-center justify-between mt-3 text-xs text-zinc-500 px-2">
        <span>← Kéo sang trái để xem bản gốc</span>
        <span className="hidden sm:inline">Dùng phím mũi tên ← → để điều chỉnh</span>
        <span>Kéo sang phải để xem bản tối ưu →</span>
      </div>
    </section>
  );
}

export default DiffSlider;
