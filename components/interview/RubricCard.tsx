'use client';

import * as React from 'react';
import { RubricCriterionScore } from '@/lib/schemas/interview';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export interface RubricCardProps {
  questionIndex: 1 | 2 | 3;
  totalQuestions?: number;
  questionTitle: string;
  candidateAnswer: string;
  rubricScores: RubricCriterionScore[];
  averageScore: number;
  strengths: string[];
  improvements: string[];
  followUpQuestion: string;
  simulatedPressureVerdict: string;
  onNext: () => void;
  isLastQuestion: boolean;
  onQuit?: () => void;
  className?: string;
}

export function RubricCard({
  questionIndex,
  totalQuestions = 3,
  questionTitle,
  candidateAnswer,
  rubricScores,
  averageScore,
  strengths,
  improvements,
  followUpQuestion,
  simulatedPressureVerdict,
  onNext,
  isLastQuestion,
  onQuit,
  className = '',
}: RubricCardProps) {
  const [showAnswer, setShowAnswer] = React.useState(false);

  // Score tier styling
  const scoreBadgeVariant =
    averageScore >= 8.0
      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
      : averageScore >= 6.0
        ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
        : 'bg-rose-500/20 text-rose-400 border-rose-500/40';

  return (
    <div className={`max-w-4xl mx-auto px-4 py-6 ${className}`}>
      {/* Top Banner: Score & Verdict */}
      <Card className="bg-zinc-900/90 border-zinc-800 p-6 sm:p-8 mb-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="cyan">Kết quả Đánh giá Câu hỏi {questionIndex} / {totalQuestions}</Badge>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              {questionTitle}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-xs text-zinc-400 font-medium">Điểm trung bình</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-white">
                  {averageScore.toFixed(1)}
                </span>
                <span className="text-sm text-zinc-500">/ 10</span>
              </div>
            </div>
            <div
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold uppercase tracking-wider ${scoreBadgeVariant}`}
            >
              {averageScore >= 8.0
                ? 'Xuất sắc'
                : averageScore >= 6.0
                  ? 'Đạt yêu cầu'
                  : 'Cần cải thiện'}
            </div>
          </div>
        </div>

        {/* Simulated Pressure Verdict */}
        <div className="rounded-xl border border-zinc-700/80 bg-zinc-950/60 p-4 mb-5">
          <span className="text-xs font-semibold text-zinc-400 block mb-1">
            Phán quyết áp lực từ Hội đồng:
          </span>
          <p className="text-sm sm:text-base font-medium text-zinc-200 italic leading-relaxed">
            &ldquo;{simulatedPressureVerdict}&rdquo;
          </p>
        </div>

        {/* Submitted Answer Toggle */}
        <div className="border-t border-zinc-800 pt-4">
          <button
            type="button"
            onClick={() => setShowAnswer(!showAnswer)}
            className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <span>{showAnswer ? 'Ẩn câu trả lời đã gửi' : 'Xem lại câu trả lời đã gửi'}</span>
            {showAnswer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showAnswer && (
            <div className="mt-3 p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs sm:text-sm text-zinc-300 leading-relaxed font-mono whitespace-pre-wrap">
              {candidateAnswer || '[Không có câu trả lời hoặc đã bấm bỏ qua]'}
            </div>
          )}
        </div>
      </Card>

      {/* 4 or 5 Rubric Criteria Scorecard */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {rubricScores.map((criterion, idx) => {
          const isJdCriterion =
            criterion.name === 'Độ phù hợp yêu cầu JD (Job Match Fit)';
          const scorePercent = (criterion.score / 10) * 100;
          const barColor =
            criterion.score >= 8
              ? 'bg-emerald-500'
              : criterion.score >= 6
                ? 'bg-cyan-500'
                : 'bg-rose-500';

          return (
            <Card
              key={idx}
              className={`p-5 flex flex-col justify-between ${
                isJdCriterion
                  ? 'bg-gradient-to-br from-purple-950/30 to-zinc-900/90 border-purple-500/50 shadow-lg shadow-purple-500/10 md:col-span-2'
                  : 'bg-zinc-900/60 border-zinc-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5 flex-wrap">
                    <Award
                      className={`w-4 h-4 ${
                        isJdCriterion ? 'text-purple-400' : 'text-cyan-400'
                      }`}
                    />
                    <span>{criterion.name}</span>
                    {isJdCriterion && (
                      <Badge variant="spicy" className="text-[10px] px-1.5 py-0">
                        Tiêu chí JD
                      </Badge>
                    )}
                  </h4>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-white">
                      {criterion.score}
                    </span>
                    <span className="text-xs text-zinc-500">/10</span>
                  </div>
                </div>

                {/* Visual Progress Gauge */}
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${scorePercent}%` }}
                  />
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">
                  {criterion.feedback}
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Strengths & Improvements Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Strengths */}
        <Card className="bg-emerald-950/10 border-emerald-500/30 p-5">
          <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4" />
            <span>Điểm mạnh ghi nhận</span>
          </h4>
          <ul className="space-y-2 text-xs sm:text-sm text-zinc-300">
            {strengths.map((str, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">•</span>
                <span className="leading-relaxed">{str}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Improvements */}
        <Card className="bg-amber-950/10 border-amber-500/30 p-5">
          <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4" />
            <span>Điểm cần cải thiện</span>
          </h4>
          <ul className="space-y-2 text-xs sm:text-sm text-zinc-300">
            {improvements.map((imp, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">•</span>
                <span className="leading-relaxed">{imp}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Recruiter Probing Follow-Up Box */}
      {followUpQuestion && (
        <Card className="bg-gradient-to-r from-purple-950/20 via-zinc-900/60 to-cyan-950/20 border-purple-500/30 p-6 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-purple-300 mb-1">
                Câu hỏi đào sâu từ Nhà tuyển dụng:
              </h4>
              <p className="text-sm sm:text-base font-semibold text-white leading-relaxed">
                &ldquo;{followUpQuestion}&rdquo;
              </p>
              <p className="text-xs text-zinc-400 mt-2">
                Hãy dành 30 giây tự suy ngẫm câu hỏi này để trau dồi thêm độ
                nhạy bén trước các buổi phỏng vấn trực tiếp.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Mandatory Non-Hiring Disclaimer */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 mb-6 flex items-start gap-3 text-xs text-zinc-400">
        <ShieldAlert className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Lưu ý: Mô phỏng áp lực</strong> — Kết quả đánh giá này được
          tạo tự động bởi AI nhằm mục đích hỗ trợ sinh viên và fresher tự luyện
          tập phản xạ phỏng vấn, không đại diện cho quyết định tuyển dụng thực
          tế hay cam kết việc làm tại bất kỳ tổ chức nào.
        </p>
      </div>

      {/* Progression Action CTA */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
        {onQuit && (
          <Button
            type="button"
            variant="ghost"
            onClick={onQuit}
            className="text-zinc-400 hover:text-rose-300 hover:bg-rose-950/20"
          >
            Dừng phiên phỏng vấn
          </Button>
        )}

        <Button
          type="button"
          variant="primary"
          onClick={onNext}
          className="w-full sm:w-auto shadow-lg shadow-orange-500/25 ml-auto"
        >
          <span>
            {isLastQuestion
              ? 'Xem tổng kết phiên phỏng vấn'
              : `Tiếp tục câu hỏi tiếp theo (Câu ${questionIndex + 1}/${totalQuestions})`}
          </span>
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
