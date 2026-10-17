'use client';

import React, { useState } from 'react';
import { usePIIVault } from '@/lib/security/usePIIVault';
import { ATSScoreGauge } from './ATSScoreGauge';
import { InteractiveDiffCard, DiffPatchData } from './InteractiveDiffCard';
import type { ATSRoastResponse } from '@/lib/schemas/ats-diff';
import { Shield, Sparkles, Copy, CheckCheck, AlertTriangle, FileText, ArrowRight } from 'lucide-react';

interface ATSSimulatorWorkspaceProps {
  initialJobDescription?: string;
  initialCVBullets?: { bulletId: string; text: string }[];
}

export function ATSSimulatorWorkspace({
  initialJobDescription = '',
  initialCVBullets = [
    { bulletId: 'bullet-1', text: 'Chịu trách nhiệm phát triển tính năng frontend cho ứng dụng web.' },
    { bulletId: 'bullet-2', text: 'Tham gia sửa lỗi và cải thiện giao diện cho người dùng.' },
    { bulletId: 'bullet-3', text: 'Hỗ trợ đồng nghiệp trong nhóm hoàn thành các task được giao.' },
  ],
}: ATSSimulatorWorkspaceProps) {
  const { maskText, unmaskText, isScrubbing, stats } = usePIIVault();

  const [jobDescription, setJobDescription] = useState(
    initialJobDescription ||
      'Tuyển dụng Frontend Engineer: Yêu cầu thành thạo Next.js App Router, TypeScript, Tailwind CSS. Có kinh nghiệm tối ưu hiệu năng Web Vitals, xây dựng kiến trúc Web Worker, tư duy bảo mật Zero-Retention PII.'
  );

  const [cvBullets, setCvBullets] = useState(initialCVBullets);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ATSRoastResponse | null>(null);
  const [acceptedBullets, setAcceptedBullets] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  // Tính điểm ATS hiện tại theo số lượng câu người dùng đã chấp nhận
  const currentATSScore = React.useMemo(() => {
    if (!result) return 0;
    const { beforeScore, afterScore } = result.atsMetrics;
    const total = result.patches.length;
    if (total === 0) return beforeScore;
    const acceptedCount = Object.keys(acceptedBullets).length;
    const progress = acceptedCount / total;
    return Math.round(beforeScore + (afterScore - beforeScore) * progress);
  }, [result, acceptedBullets]);

  const handleRunSimulator = async () => {
    setIsLoading(true);
    try {
      // Bước 1: Ẩn danh toàn bộ PII trên trình duyệt bằng Web Worker
      const sanitizedBullets = await Promise.all(
        cvBullets.map(async (b) => ({
          bulletId: b.bulletId,
          sectionTitle: 'Experience',
          originalText: await maskText(b.text),
        }))
      );

      // Bước 2: Gửi dữ liệu đã che PII lên API
      const res = await fetch('/api/ats-roast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobDescription,
          cvBullets: sanitizedBullets,
        }),
      });

      if (!res.ok) {
        throw new Error('API phân tích ATS trả về lỗi');
      }

      const data: ATSRoastResponse = await res.json();

      // Bước 3: Re-hydrate giải mã Token PII về tên thật từ RAM
      const rehydratedPatches = data.patches.map((p) => ({
        ...p,
        suggestedText: unmaskText(p.suggestedText),
      }));

      setResult({
        ...data,
        patches: rehydratedPatches,
      });
      setAcceptedBullets({});
    } catch (err) {
      console.error('Error analyzing ATS:', err);
      alert('Không thể hoàn tất phân tích ATS. Vui lòng thử lại!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptPatch = (bulletId: string, finalText: string) => {
    setAcceptedBullets((prev) => ({ ...prev, [bulletId]: finalText }));
  };

  const handleRejectPatch = (bulletId: string) => {
    setAcceptedBullets((prev) => {
      const next = { ...prev };
      delete next[bulletId];
      return next;
    });
  };

  const handleAutoAcceptAll = () => {
    if (!result) return;
    const all: Record<string, string> = {};
    result.patches.forEach((p) => {
      all[p.bulletId] = p.suggestedText;
    });
    setAcceptedBullets(all);
  };

  const handleCopyCleanCV = () => {
    const text = cvBullets
      .map((b) => acceptedBullets[b.bulletId] || b.text)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Privacy Banner */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 text-xs text-neutral-300">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>
            <b>Cơ chế Zero-Retention PII:</b> Thông tin cá nhân được tách mã định danh tạm thời trong RAM trình duyệt trước khi gửi đi.
          </span>
        </div>
        {stats.totalMasked > 0 && (
          <span className="font-semibold text-emerald-400">
            🛡️ Đã bảo vệ {stats.totalMasked} dữ liệu định danh
          </span>
        )}
      </div>

      {/* Input Section */}
      {!result && (
        <div className="grid md:grid-cols-2 gap-6 bg-neutral-900/50 p-6 rounded-2xl border border-neutral-800">
          <div>
            <label className="block text-sm font-bold text-neutral-200 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              1. Job Description (Mô tả công việc mục tiêu)
            </label>
            <textarea
              rows={6}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm text-neutral-100 focus:outline-none focus:border-amber-400"
              placeholder="Dán nội dung JD vào đây để đối soát từ khóa ATS..."
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-neutral-200 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              2. Các gạch đầu dòng kinh nghiệm trong CV
            </label>
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {cvBullets.map((b, idx) => (
                <div key={b.bulletId} className="flex gap-2">
                  <span className="text-xs font-mono text-neutral-500 pt-2">{idx + 1}.</span>
                  <input
                    type="text"
                    value={b.text}
                    onChange={(e) => {
                      const updated = [...cvBullets];
                      updated[idx].text = e.target.value;
                      setCvBullets(updated);
                    }}
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-emerald-400"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={handleRunSimulator}
              disabled={isLoading || isScrubbing}
              className="w-full mt-4 py-3 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-neutral-950 font-extrabold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg transition"
            >
              {isLoading ? (
                <span>Đang phân tích ATS & Roast từng dòng...</span>
              ) : (
                <>
                  <span>Bắt đầu Quét ATS & Roast</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Kết quả phân tích & Interactive Diff */}
      {result && (
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Cột trái: ATS Gauge & Flags */}
          <div className="lg:col-span-5 space-y-6">
            <ATSScoreGauge
              beforeScore={result.atsMetrics.beforeScore}
              currentScore={currentATSScore}
              targetScore={result.atsMetrics.afterScore}
              acceptedCount={Object.keys(acceptedBullets).length}
              totalPatches={result.patches.length}
            />

            {/* Knockout Flags */}
            {result.atsMetrics.knockoutFlags.length > 0 && (
              <div className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-5">
                <h4 className="text-sm font-bold text-rose-300 flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  Cảnh báo loại hồ sơ (Knockout Flags)
                </h4>
                <ul className="space-y-2 text-xs text-rose-200/90 list-disc list-inside">
                  {result.atsMetrics.knockoutFlags.map((flag, i) => (
                    <li key={i}>{flag}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Missing Keywords */}
            <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-5">
              <h4 className="text-sm font-bold text-neutral-200 mb-3">
                Từ khóa cốt lõi cần bổ sung từ JD
              </h4>
              <div className="flex flex-wrap gap-2">
                {result.atsMetrics.missingKeywords.map((kw, i) => (
                  <span
                    key={i}
                    className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                      kw.importance === 'critical'
                        ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                        : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {kw.importance === 'critical' ? '⚡ ' : ''}
                    {kw.keyword}
                  </span>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleAutoAcceptAll}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                Áp dụng tất cả (89+ điểm)
              </button>
              <button
                onClick={handleCopyCleanCV}
                className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                {copied ? <CheckCheck className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Đã sao chép' : 'Copy CV'}
              </button>
            </div>
          </div>

          {/* Cột phải: Danh sách Interactive Diff Cards */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <h3 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Interactive Diff Viewer
              </h3>
              <span className="text-xs text-neutral-400">
                Nhấn chấp nhận từng câu để điểm ATS tăng tự động
              </span>
            </div>

            <div className="space-y-4">
              {result.patches.map((patch) => {
                const original = cvBullets.find((b) => b.bulletId === patch.bulletId)?.text || '';
                const diffData: DiffPatchData = {
                  ...patch,
                  originalText: original,
                };

                return (
                  <InteractiveDiffCard
                    key={patch.bulletId}
                    patch={diffData}
                    isAccepted={!!acceptedBullets[patch.bulletId]}
                    onAccept={handleAcceptPatch}
                    onReject={handleRejectPatch}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
