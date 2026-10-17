'use client';

import React, { useState, useMemo } from 'react';
import { diffWords, Change } from 'diff';
import { Check, X, Edit3, MessageSquareQuote, Flame, Tag, CheckCircle2 } from 'lucide-react';

export interface DiffPatchData {
  bulletId: string;
  originalText: string;
  suggestedText: string;
  roastComment: string;
  addedKeywords: string[];
  impactLevel: 'high' | 'medium' | 'low';
}

interface InteractiveDiffCardProps {
  patch: DiffPatchData;
  isAccepted: boolean;
  onAccept: (bulletId: string, finalText: string) => void;
  onReject: (bulletId: string) => void;
}

export function InteractiveDiffCard({
  patch,
  isAccepted,
  onAccept,
  onReject,
}: InteractiveDiffCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [customText, setCustomText] = useState(patch.suggestedText);

  // Tính toán word-level diff giữa câu gốc và câu gợi ý
  const diffParts = useMemo<Change[]>(() => {
    return diffWords(patch.originalText, isEditing ? customText : patch.suggestedText);
  }, [patch.originalText, patch.suggestedText, isEditing, customText]);

  const handleSaveCustom = () => {
    setIsEditing(false);
    onAccept(patch.bulletId, customText);
  };

  return (
    <div
      className={`border rounded-2xl p-5 transition-all duration-300 relative overflow-hidden ${
        isAccepted
          ? 'bg-emerald-950/20 border-emerald-500/40 shadow-lg shadow-emerald-500/5'
          : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
      }`}
    >
      {/* Header dòng: Tag & Impact level */}
      <div className="flex items-center justify-between mb-3.5 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-400">
            #{patch.bulletId}
          </span>
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
              patch.impactLevel === 'high'
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}
          >
            {patch.impactLevel === 'high' ? '🔥 Tác động lớn' : '⚡ Tác động vừa'}
          </span>
        </div>

        {isAccepted && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Đã áp dụng
          </div>
        )}
      </div>

      {/* Lời Roast sâu cay của AI */}
      <div className="bg-neutral-950/80 border border-amber-500/20 rounded-xl p-3.5 mb-4 text-xs text-amber-200/90 flex items-start gap-2.5">
        <Flame className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-300 block mb-0.5">Lời phê bình của AI:</span>
          {patch.roastComment}
        </div>
      </div>

      {/* Vùng so sánh từ ngữ (Word Diff Viewer) */}
      <div className="bg-neutral-950/90 rounded-xl p-4 border border-neutral-800/80 mb-4 font-sans text-sm leading-relaxed">
        {isEditing ? (
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">
              Chỉnh sửa trực tiếp trước khi áp dụng:
            </label>
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              rows={3}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2.5 text-neutral-100 text-sm focus:outline-none focus:border-amber-400"
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1 text-xs text-neutral-400 hover:text-white"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveCustom}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold"
              >
                Lưu & Chấp nhận
              </button>
            </div>
          </div>
        ) : (
          <div>
            {diffParts.map((part, index) => {
              if (part.added) {
                return (
                  <span
                    key={index}
                    className="bg-emerald-500/20 text-emerald-300 font-semibold px-1 py-0.5 rounded mx-0.5 border border-emerald-500/30"
                  >
                    {part.value}
                  </span>
                );
              }
              if (part.removed) {
                return (
                  <span
                    key={index}
                    className="bg-rose-500/20 text-rose-400 line-through px-1 py-0.5 rounded mx-0.5 opacity-60"
                  >
                    {part.value}
                  </span>
                );
              }
              return (
                <span key={index} className="text-neutral-300">
                  {part.value}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Từ khóa ATS được thêm vào */}
      {patch.addedKeywords.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap mb-4">
          <Tag className="w-3.5 h-3.5 text-neutral-400" />
          <span className="text-[11px] text-neutral-400">Từ khóa ATS mới:</span>
          {patch.addedKeywords.map((kw, i) => (
            <span
              key={i}
              className="text-[11px] font-medium bg-neutral-800 text-neutral-200 px-2 py-0.5 rounded-full border border-neutral-700"
            >
              +{kw}
            </span>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800/60">
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-300 hover:bg-neutral-800 border border-neutral-700 transition"
        >
          <Edit3 className="w-3.5 h-3.5" />
          Tự sửa
        </button>

        {isAccepted ? (
          <button
            onClick={() => onReject(patch.bulletId)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 border border-neutral-800 transition"
          >
            <X className="w-3.5 h-3.5" />
            Hoàn tác về gốc
          </button>
        ) : (
          <button
            onClick={() => onAccept(patch.bulletId, patch.suggestedText)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-900/30 transition"
          >
            <Check className="w-3.5 h-3.5" />
            Chấp nhận sửa
          </button>
        )}
      </div>
    </div>
  );
}
