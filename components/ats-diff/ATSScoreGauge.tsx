'use client';

import React from 'react';
import { ArrowUpRight, ShieldCheck, Zap } from 'lucide-react';

interface ATSScoreGaugeProps {
  beforeScore: number;
  currentScore: number;
  targetScore: number;
  acceptedCount: number;
  totalPatches: number;
}

export function ATSScoreGauge({
  beforeScore,
  currentScore,
  targetScore,
  acceptedCount,
  totalPatches,
}: ATSScoreGaugeProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10';
    if (score >= 60) return 'text-amber-500 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-500 border-rose-500/30 bg-rose-500/10';
  };

  const getBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500 text-black';
    if (score >= 60) return 'bg-amber-500 text-black';
    return 'bg-rose-500 text-white';
  };

  return (
    <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            ATS Score Matrix
          </h3>
          <p className="text-xs text-neutral-400">
            Chỉ số đo mức độ khớp hồ sơ với thuật toán sàng lọc ATS
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          Zero-PII Active
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Điểm Gốc */}
        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/60 flex flex-col items-center justify-center text-center">
          <span className="text-xs font-medium text-neutral-400 mb-1">Điểm CV Ban Đầu</span>
          <div className="text-3xl font-extrabold text-neutral-400">
            {beforeScore}
            <span className="text-sm font-normal text-neutral-500">/100</span>
          </div>
          <span className="mt-2 text-[11px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-400">
            {beforeScore < 50 ? 'Dễ bị loại tức thì' : 'Cần tối ưu'}
          </span>
        </div>

        {/* Điểm Hiện Tại Sau Khi Sửa */}
        <div
          className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center transition-all duration-300 ${getScoreColor(
            currentScore
          )}`}
        >
          <span className="text-xs font-medium mb-1 flex items-center gap-1">
            Điểm Hiện Tại
            {currentScore > beforeScore && <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />}
          </span>
          <div className="text-3xl font-extrabold">
            {currentScore}
            <span className="text-sm font-normal opacity-70">/100</span>
          </div>
          <span className={`mt-2 text-[11px] font-bold px-2 py-0.5 rounded ${getBadgeColor(currentScore)}`}>
            Tiềm năng: {targetScore}
          </span>
        </div>
      </div>

      {/* Tiến độ áp dụng */}
      <div>
        <div className="flex justify-between text-xs text-neutral-400 mb-2 font-medium">
          <span>Tiến độ cải thiện câu mô tả</span>
          <span>
            {acceptedCount}/{totalPatches} câu đã duyệt
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500"
            style={{
              width: `${totalPatches > 0 ? (acceptedCount / totalPatches) * 100 : 0}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
