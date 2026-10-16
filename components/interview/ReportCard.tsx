'use client';

import * as React from 'react';
import Link from 'next/link';
import { RubricCriterionScore } from '@/lib/schemas/interview';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Trophy,
  Award,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  Flame,
  Trash2,
} from 'lucide-react';
import { WipeDataButton } from '@/components/privacy/WipeDataButton';

export interface SessionSummaryEvaluation {
  questionIndex: 1 | 2 | 3;
  questionTitle: string;
  candidateAnswer: string;
  rubricScores: RubricCriterionScore[];
  averageScore: number;
  strengths: string[];
  improvements: string[];
  followUpQuestion: string;
  simulatedPressureVerdict: string;
}

export interface ReportCardProps {
  role: 'it' | 'marketing' | 'custom';
  evaluations: SessionSummaryEvaluation[];
  targetRoleTitle?: string;
  onRestart: () => void;
  onTryRoastCv?: () => void;
  onWipeData?: () => void;
  onShareCard?: () => void;
  className?: string;
}

export function ReportCard({
  role,
  evaluations,
  targetRoleTitle,
  onRestart,
  onTryRoastCv,
  onWipeData,
  onShareCard,
  className = '',
}: ReportCardProps) {
  // Calculate overall average score
  const totalScore = evaluations.reduce((acc, e) => acc + e.averageScore, 0);
  const overallAverage =
    evaluations.length > 0
      ? Math.round((totalScore / evaluations.length) * 10) / 10
      : 0;

  // Calculate dynamic criteria averages across questions (supporting 4 or 5 criteria)
  const dynamicCriteriaNames = React.useMemo(() => {
    const namesSet = new Set<string>();
    evaluations.forEach((e) => {
      e.rubricScores.forEach((r) => namesSet.add(r.name));
    });

    const standardOrder = [
      'Cấu trúc STAR & Mạch lạc',
      'Tính cụ thể & Dẫn chứng',
      'Mức độ liên quan & Đúng trọng tâm',
      'Nhận thức hệ quả & Tư duy xử lý',
      'Độ phù hợp yêu cầu JD (Job Match Fit)',
    ];

    const ordered = standardOrder.filter((n) => namesSet.has(n));
    namesSet.forEach((n) => {
      if (!ordered.includes(n)) ordered.push(n);
    });

    return ordered.length > 0 ? ordered : standardOrder.slice(0, 4);
  }, [evaluations]);

  const criteriaAverages = dynamicCriteriaNames.map((name) => {
    let sum = 0;
    let count = 0;
    evaluations.forEach((e) => {
      const match = e.rubricScores.find((r) => r.name === name);
      if (match) {
        sum += match.score;
        count += 1;
      }
    });
    return {
      name,
      avg: count > 0 ? Math.round((sum / count) * 10) / 10 : 0,
    };
  });

  // Consolidate unique strengths and improvements
  const allStrengths = Array.from(
    new Set(evaluations.flatMap((e) => e.strengths))
  ).slice(0, 4);

  const allImprovements = Array.from(
    new Set(evaluations.flatMap((e) => e.improvements))
  ).slice(0, 4);

  const followUpQuestions = evaluations
    .map((e) => ({
      index: e.questionIndex,
      title: e.questionTitle,
      question: e.followUpQuestion,
    }))
    .filter((q) => Boolean(q.question));

  return (
    <div className={`max-w-4xl mx-auto px-4 py-8 ${className}`}>
      {/* Holistic Session Header */}
      <Card className="bg-gradient-to-b from-zinc-900 to-zinc-950 border-zinc-800 p-6 sm:p-8 mb-8 shadow-2xl text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-cyan-500/10 blur-3xl pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold mb-4">
          <Trophy className="w-3.5 h-3.5" />
          <span>Tổng kết Phiên Phỏng Vấn Áp Lực</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
          Báo Cáo Năng Lực Ứng Biến Dưới Áp Lực
        </h1>

        <div className="flex items-center justify-center gap-2 mb-6">
          <Badge
            variant={
              role === 'it' ? 'cyan' : role === 'custom' ? 'spicy' : 'amber'
            }
          >
            {role === 'custom'
              ? targetRoleTitle || 'Tùy biến theo JD'
              : role === 'it'
                ? 'IT / Software Engineer'
                : 'Marketing / Business'}
          </Badge>
          <span className="text-xs text-zinc-400">
            • Hoàn thành {evaluations.length}/3 câu hỏi tình huống
          </span>
        </div>

        {/* Big Overall Metric */}
        <div className="inline-flex flex-col items-center justify-center p-6 rounded-2xl bg-zinc-900/80 border border-zinc-700/80 mb-6 shadow-inner">
          <span className="text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wider">
            Điểm Đánh Giá Tổng Thể
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-rose-500 to-cyan-400">
              {overallAverage.toFixed(1)}
            </span>
            <span className="text-lg text-zinc-500 font-bold">/ 10</span>
          </div>
          <span className="text-xs font-semibold text-zinc-300 mt-2 px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700">
            {overallAverage >= 8.0
              ? 'Ứng viên xuất sắc — Bình tĩnh & Sắc bén'
              : overallAverage >= 6.0
                ? 'Ứng viên tiềm năng — Tư duy phản xạ tốt'
                : 'Cần trau dồi thêm cấu trúc & phương án dự phòng'}
          </span>
        </div>
      </Card>

      {/* Rubric Criteria Comparative Matrix */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-cyan-400" />
          <span>Năng Lực Theo {dynamicCriteriaNames.length} Tiêu Chí Chuẩn Hóa</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {criteriaAverages.map((crit, idx) => {
            const pct = (crit.avg / 10) * 100;
            const barClass =
              crit.avg >= 8
                ? 'bg-emerald-500'
                : crit.avg >= 6
                  ? 'bg-cyan-500'
                  : 'bg-rose-500';

            return (
              <Card key={idx} className="bg-zinc-900/60 border-zinc-800 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-zinc-200">
                    {crit.name}
                  </span>
                  <span className="text-sm font-bold text-white">
                    {crit.avg.toFixed(1)}/10
                  </span>
                </div>
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${barClass}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Question-by-Question Accordion/Grid */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
          <Flame className="w-5 h-5 text-orange-400" />
          <span>Chi Tiết Từng Câu Hỏi Tình Huống</span>
        </h3>

        <div className="space-y-4">
          {evaluations.map((evalItem, i) => (
            <Card
              key={i}
              className="bg-zinc-900/50 border-zinc-800 p-5 hover:border-zinc-700 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="cyan">Câu {evalItem.questionIndex}</Badge>
                  <h4 className="font-bold text-white text-base">
                    {evalItem.questionTitle}
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400">Điểm câu:</span>
                  <span className="font-extrabold text-white text-base">
                    {evalItem.averageScore.toFixed(1)}/10
                  </span>
                </div>
              </div>

              <p className="text-xs text-zinc-400 italic mb-3">
                &ldquo;{evalItem.simulatedPressureVerdict}&rdquo;
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-zinc-800/80 text-xs text-zinc-300">
                {evalItem.rubricScores.map((score, sIdx) => (
                  <div key={sIdx} className="p-2 rounded bg-zinc-950/50 border border-zinc-800">
                    <span className="text-[11px] text-zinc-500 block truncate">
                      {score.name.split('&')[0]}
                    </span>
                    <span className="font-bold text-zinc-200">
                      {score.score}/10
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Systemic Growth Blueprint */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Strengths */}
        <Card className="bg-emerald-950/10 border-emerald-500/30 p-6">
          <h4 className="text-base font-bold text-emerald-400 flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5" />
            <span>Điểm sáng nổi trội của bạn</span>
          </h4>
          <ul className="space-y-3 text-xs sm:text-sm text-zinc-300">
            {allStrengths.map((str, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="text-emerald-400 mt-0.5">•</span>
                <span className="leading-relaxed">{str}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Improvements */}
        <Card className="bg-amber-950/10 border-amber-500/30 p-6">
          <h4 className="text-base font-bold text-amber-400 flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5" />
            <span>Kế hoạch hành động cải thiện</span>
          </h4>
          <ul className="space-y-3 text-xs sm:text-sm text-zinc-300">
            {allImprovements.map((imp, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="text-amber-400 mt-0.5">•</span>
                <span className="leading-relaxed">{imp}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Probing Questions Bank */}
      {followUpQuestions.length > 0 && (
        <Card className="bg-purple-950/10 border-purple-500/30 p-6 mb-8">
          <h4 className="text-base font-bold text-purple-300 flex items-center gap-2 mb-4">
            <HelpCircle className="w-5 h-5" />
            <span>Thư viện câu hỏi đào sâu để tự rèn luyện thêm</span>
          </h4>

          <div className="space-y-3 text-xs sm:text-sm text-zinc-300">
            {followUpQuestions.map((fq, i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl bg-zinc-950/60 border border-purple-500/20"
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 mb-1">
                  <span>Câu {fq.index}: {fq.title}</span>
                </div>
                <p className="italic text-zinc-200">&ldquo;{fq.question}&rdquo;</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Mandatory Non-Hiring Disclaimer */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 mb-8 flex items-start gap-3 text-xs sm:text-sm text-zinc-400">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Lưu ý: Mô phỏng áp lực</strong> — Kết quả đánh giá này được
          tạo tự động bởi AI nhằm mục đích hỗ trợ sinh viên và người tìm việc
          tự luyện tập phản xạ phỏng vấn. Đây không đại diện cho quyết định
          tuyển dụng thực tế hay cam kết việc làm tại bất kỳ doanh nghiệp nào.
        </p>
      </div>

      {/* Actions Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onRestart}
          className="w-full sm:w-auto"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          <span>Luyện tập lại</span>
        </Button>

        <Link href="/roast" className="w-full sm:w-auto">
          <Button
            type="button"
            variant="primary"
            className="w-full shadow-lg shadow-orange-500/20"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            <span>Thử chế độ Roast CV</span>
          </Button>
        </Link>

        {onShareCard && (
          <Button
            type="button"
            variant="secondary"
            onClick={onShareCard}
            className="w-full sm:w-auto text-cyan-300 border-cyan-500/30 hover:border-cyan-500/60"
          >
            <Sparkles className="w-4 h-4 mr-2 text-cyan-400" />
            <span>Tạo ảnh chia sẻ</span>
          </Button>
        )}

        <WipeDataButton
          confirmFirst={false}
          onWiped={onWipeData}
          className="w-full sm:w-auto text-zinc-400 hover:text-rose-400"
        />
      </div>
    </div>
  );
}
