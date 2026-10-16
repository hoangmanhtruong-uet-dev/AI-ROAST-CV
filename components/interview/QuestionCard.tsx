'use client';

import * as React from 'react';
import { InterviewQuestionData } from '@/lib/schemas/interview';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TimerCountdown } from './TimerCountdown';
import {
  Flame,
  Send,
  SkipForward,
  Octagon,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export interface QuestionCardProps {
  question: InterviewQuestionData;
  currentIndex: 1 | 2 | 3;
  totalQuestions?: number;
  timeRemaining: number;
  timeLimit: number;
  answer: string;
  onChangeAnswer: (val: string) => void;
  onSubmit: () => void;
  onSkip: () => void;
  onQuit: () => void;
  isSubmitting: boolean;
  className?: string;
}

export function QuestionCard({
  question,
  currentIndex,
  totalQuestions = 3,
  timeRemaining,
  timeLimit,
  answer,
  onChangeAnswer,
  onSubmit,
  onSkip,
  onQuit,
  isSubmitting,
  className = '',
}: QuestionCardProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Auto-focus textarea when question index changes
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [question.questionId]);

  // Handle Ctrl+Enter / Cmd+Enter shortcut
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isSubmitting) {
        onSubmit();
      }
    }
  };

  const isShort = answer.trim().length > 0 && answer.trim().length < 30;

  return (
    <div className={`max-w-4xl mx-auto px-4 py-6 ${className}`}>
      {/* Session Progress Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Badge variant={question.role === 'it' ? 'cyan' : 'spicy'}>
            {question.role === 'it'
              ? 'IT / Software Engineer'
              : 'Marketing / Business'}
          </Badge>
          <span className="text-sm font-semibold text-zinc-300">
            Câu hỏi {currentIndex} / {totalQuestions}
          </span>
        </div>

        {/* Precision Wall-Clock Timer */}
        <TimerCountdown
          timeRemaining={timeRemaining}
          totalDuration={timeLimit}
        />
      </div>

      {/* Main Dilemma Scenario Card */}
      <Card className="bg-zinc-900/80 border-zinc-800 p-6 sm:p-8 mb-6 shadow-xl">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug">
              {question.title}
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Thời gian giải quyết: {question.timeLimitSeconds} giây
            </p>
          </div>
        </div>

        {/* Scenario Background */}
        <p className="text-zinc-300 text-sm sm:text-base leading-relaxed mb-5">
          {question.scenario}
        </p>

        {/* High-Stakes Pressure Context Box */}
        <div className="rounded-xl border border-rose-500/40 bg-rose-950/20 p-4 text-sm text-rose-200 flex items-start gap-3">
          <span className="font-bold text-rose-400 uppercase tracking-wide text-xs px-2 py-0.5 rounded bg-rose-500/20 shrink-0 mt-0.5">
            Áp lực trực tiếp
          </span>
          <p className="leading-relaxed font-medium italic">
            {question.pressureContext}
          </p>
        </div>
      </Card>

      {/* Answer Input Section */}
      <Card className="bg-zinc-900/60 border-zinc-800 p-6 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <label
            htmlFor="candidate-answer-textarea"
            className="text-sm font-medium text-zinc-200 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Câu trả lời của bạn</span>
          </label>
          <span
            className={`text-xs ${
              answer.length > 1800
                ? 'text-rose-400 font-bold'
                : 'text-zinc-400'
            }`}
          >
            {answer.length} / 2000 ký tự
          </span>
        </div>

        <textarea
          id="candidate-answer-textarea"
          ref={textareaRef}
          value={answer}
          onChange={(e) => onChangeAnswer(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSubmitting}
          maxLength={2000}
          rows={6}
          placeholder="Nhập câu trả lời theo mô hình STAR (Tình huống -> Nhiệm vụ -> Hành động -> Kết quả & Phương án dự phòng)..."
          className="w-full bg-zinc-950/80 border border-zinc-700/80 rounded-xl p-4 text-zinc-100 placeholder-zinc-500 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all resize-y disabled:opacity-60 leading-relaxed"
        />

        {isShort && (
          <p className="text-xs text-amber-400 mt-2 flex items-center gap-1.5">
            <span>
              💡 Câu trả lời dưới 30 ký tự. Bạn còn thời gian để bổ sung dẫn
              chứng hoặc các bước thực hiện cụ thể.
            </span>
          </p>
        )}

        {/* Actions Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-6 pt-4 border-t border-zinc-800">
          {/* Emergency Controls (Left) */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isSubmitting}
              onClick={onQuit}
              className="text-zinc-400 hover:text-rose-300 hover:bg-rose-950/20"
            >
              <Octagon className="w-4 h-4 mr-1.5 text-rose-400" />
              <span>Dừng phỏng vấn</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={onSkip}
              className="border-zinc-700 text-zinc-300 hover:text-white"
            >
              <SkipForward className="w-4 h-4 mr-1.5 text-amber-400" />
              <span>Bỏ qua</span>
            </Button>
          </div>

          {/* Submission Controls (Right) */}
          <div className="flex items-center gap-3">
            <span className="hidden md:inline-block text-xs text-zinc-400">
              Nhấn Ctrl + Enter để gửi
            </span>

            <Button
              type="button"
              variant="primary"
              disabled={isSubmitting}
              onClick={onSubmit}
              className="shadow-lg shadow-orange-500/20"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  <span>Đang đánh giá...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  <span>Gửi câu trả lời</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
