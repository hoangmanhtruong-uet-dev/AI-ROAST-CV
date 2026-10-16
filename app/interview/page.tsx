'use client';

import * as React from 'react';
import {
  InterviewQuestionData,
  InterviewRole,
  QuestionIndex,
} from '@/lib/schemas/interview';
import { RoleChooser } from '@/components/interview/RoleChooser';
import { QuestionCard } from '@/components/interview/QuestionCard';
import { RubricCard } from '@/components/interview/RubricCard';
import {
  ReportCard,
  SessionSummaryEvaluation,
} from '@/components/interview/ReportCard';
import { QuitConfirmModal } from '@/components/interview/QuitConfirmModal';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, AlertCircle, RotateCcw } from 'lucide-react';
import { SharePreviewModal } from '@/components/share/SharePreviewModal';
import { ShareCardPayload } from '@/lib/schemas/share';
import { WIPE_DATA_EVENT_NAME } from '@/lib/storage/wipe-data';
import { CheckoutModal } from '@/components/payment/CheckoutModal';
import { useProTier } from '@/lib/payment/entitlement';
import { getTrialUsage, recordTrialUsage } from '@/lib/payment/trial';

export type InterviewFlowStep =
  | 'ROLE_CHOOSER'
  | 'QUESTION_ACTIVE'
  | 'EVALUATING'
  | 'RUBRIC_FEEDBACK'
  | 'SESSION_SUMMARY'
  | 'ERROR';

export default function InterviewPage() {
  const [step, setStep] = React.useState<InterviewFlowStep>('ROLE_CHOOSER');
  const [role, setRole] = React.useState<InterviewRole | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] =
    React.useState<QuestionIndex>(1);
  const [currentQuestion, setCurrentQuestion] =
    React.useState<InterviewQuestionData | null>(null);

  // Custom JD State
  const [customJdText, setCustomJdText] = React.useState<string | null>(null);
  const [customQuestions, setCustomQuestions] = React.useState<
    InterviewQuestionData[] | null
  >(null);
  const [customJobTitle, setCustomJobTitle] = React.useState<string | null>(null);

  const [timeRemaining, setTimeRemaining] = React.useState<number>(90);
  const [timeLimit, setTimeLimit] = React.useState<number>(90);
  const [answer, setAnswer] = React.useState<string>('');

  const [evaluations, setEvaluations] = React.useState<
    SessionSummaryEvaluation[]
  >([]);
  const [latestEvaluation, setLatestEvaluation] =
    React.useState<SessionSummaryEvaluation | null>(null);

  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [isQuitModalOpen, setIsQuitModalOpen] = React.useState<boolean>(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = React.useState<boolean>(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = React.useState<boolean>(false);

  const { isPro } = useProTier();

  // Listen for data wipe event to reset interview state across components
  React.useEffect(() => {
    const handleDataWiped = () => {
      handleRestart();
    };
    window.addEventListener(WIPE_DATA_EVENT_NAME, handleDataWiped);
    return () => window.removeEventListener(WIPE_DATA_EVENT_NAME, handleDataWiped);
  }, []);

  // Refs to avoid stale closures in timer interval
  const answerRef = React.useRef(answer);
  answerRef.current = answer;

  const isSubmittingRef = React.useRef(isSubmitting);
  isSubmittingRef.current = isSubmitting;

  const currentQuestionRef = React.useRef(currentQuestion);
  currentQuestionRef.current = currentQuestion;

  const roleRef = React.useRef(role);
  roleRef.current = role;

  const timeLimitRef = React.useRef(timeLimit);
  timeLimitRef.current = timeLimit;

  const timeRemainingRef = React.useRef(timeRemaining);
  timeRemainingRef.current = timeRemaining;

  const customJdTextRef = React.useRef(customJdText);
  customJdTextRef.current = customJdText;

  const customQuestionsRef = React.useRef(customQuestions);
  customQuestionsRef.current = customQuestions;

  // Fetch question from /api/interview/question or customQuestions store
  const fetchQuestion = React.useCallback(
    async (targetRole: InterviewRole, targetIndex: QuestionIndex) => {
      try {
        setErrorMessage(null);
        setIsSubmitting(true);

        if (targetRole === 'custom') {
          const storedQuestions = customQuestionsRef.current;
          if (!storedQuestions || !storedQuestions[targetIndex - 1]) {
            throw new Error('Không tìm thấy câu hỏi tùy biến theo JD.');
          }

          const qData = storedQuestions[targetIndex - 1];
          setCurrentQuestion(qData);
          setCurrentQuestionIndex(targetIndex);
          setTimeLimit(qData.timeLimitSeconds);
          setTimeRemaining(qData.timeLimitSeconds);
          setAnswer('');
          setStep('QUESTION_ACTIVE');
          return;
        }

        const res = await fetch('/api/interview/question', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: targetRole,
            questionIndex: targetIndex,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(
            errData.error || 'Không thể tải câu hỏi phỏng vấn. Vui lòng thử lại.'
          );
        }

        const json = await res.json();
        if (!json.success || !json.data) {
          throw new Error(json.error || 'Dữ liệu câu hỏi không hợp lệ.');
        }

        const qData: InterviewQuestionData = json.data;
        setCurrentQuestion(qData);
        setCurrentQuestionIndex(targetIndex);
        setTimeLimit(qData.timeLimitSeconds);
        setTimeRemaining(qData.timeLimitSeconds);
        setAnswer('');
        setStep('QUESTION_ACTIVE');
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : 'Lỗi không xác định khi tải câu hỏi.'
        );
        setStep('ERROR');
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  // Handle standard role selection -> starts question 1
  const handleSelectRole = (selectedRole: InterviewRole) => {
    setRole(selectedRole);
    setCustomJdText(null);
    setCustomQuestions(null);
    setCustomJobTitle(null);
    setEvaluations([]);
    setLatestEvaluation(null);
    fetchQuestion(selectedRole, 1);
  };

  // Handle custom JD selection -> fetches 3 escalating questions upfront
  const handleSelectCustomJd = async (data: {
    jdText: string;
    targetRole?: string;
    company?: string;
  }) => {
    try {
      setErrorMessage(null);
      setIsSubmitting(true);
      setEvaluations([]);
      setLatestEvaluation(null);

      const res = await fetch('/api/interview/jd-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData.error || 'Không thể tạo bộ câu hỏi theo JD. Vui lòng thử lại.'
        );
      }

      const json = await res.json();
      if (!json.success || !json.data || !json.data.questions?.length) {
        throw new Error(json.error || 'Dữ liệu câu hỏi JD không hợp lệ.');
      }

      const qList: InterviewQuestionData[] = json.data.questions;
      setCustomJdText(data.jdText);
      setCustomQuestions(qList);
      setCustomJobTitle(json.data.jobTitle || data.targetRole || null);
      setRole('custom');

      const firstQ = qList[0];
      setCurrentQuestion(firstQ);
      setCurrentQuestionIndex(1);
      setTimeLimit(firstQ.timeLimitSeconds);
      setTimeRemaining(firstQ.timeLimitSeconds);
      setAnswer('');
      setStep('QUESTION_ACTIVE');
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Lỗi không xác định khi khởi tạo phỏng vấn theo JD.'
      );
      setStep('ERROR');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit candidate answer to /api/interview/evaluate
  const handleSubmitAnswer = React.useCallback(
    async (submittedAnswer?: string) => {
      if (isSubmittingRef.current || !currentQuestionRef.current || !roleRef.current) {
        return;
      }

      const activeQuestion = currentQuestionRef.current;
      const activeRole = roleRef.current;
      const finalAnswer =
        typeof submittedAnswer === 'string'
          ? submittedAnswer
          : answerRef.current;
      const timeSpent = Math.max(
        1,
        timeLimitRef.current - timeRemainingRef.current
      );

      try {
        setIsSubmitting(true);
        setStep('EVALUATING');
        setErrorMessage(null);

        const res = await fetch('/api/interview/evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: activeRole,
            questionId: activeQuestion.questionId,
            questionIndex: activeQuestion.questionIndex,
            questionScenario: activeQuestion.scenario,
            candidateAnswer: finalAnswer,
            timeSpentSeconds: timeSpent,
            customJd: customJdTextRef.current || undefined,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(
            errData.error || 'Không thể hoàn thành đánh giá. Vui lòng thử lại.'
          );
        }

        const json = await res.json();
        if (!json.success || !json.data) {
          throw new Error(json.error || 'Dữ liệu đánh giá không hợp lệ.');
        }

        const evalData = json.data;
        const newSummaryItem: SessionSummaryEvaluation = {
          questionIndex: activeQuestion.questionIndex,
          questionTitle: activeQuestion.title,
          candidateAnswer: finalAnswer,
          rubricScores: evalData.rubricScores,
          averageScore: evalData.averageScore,
          strengths: evalData.strengths,
          improvements: evalData.improvements,
          followUpQuestion: evalData.followUpQuestion,
          simulatedPressureVerdict: evalData.simulatedPressureVerdict,
        };

        setLatestEvaluation(newSummaryItem);
        setEvaluations((prev) => {
          const filtered = prev.filter(
            (p) => p.questionIndex !== activeQuestion.questionIndex
          );
          return [...filtered, newSummaryItem];
        });

        // Record trial usage if answering Question 1 in custom JD mode as free user
        if (activeRole === 'custom' && activeQuestion.questionIndex === 1 && !isPro) {
          recordTrialUsage('customJd');
        }

        setStep('RUBRIC_FEEDBACK');
      } catch (err) {
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'Đã xảy ra lỗi khi chấm điểm. Câu trả lời của bạn vẫn được lưu.'
        );
        setStep('ERROR');
      } finally {
        setIsSubmitting(false);
      }
    },
    [isPro]
  );

  // Timer countdown hook using 1-second interval
  React.useEffect(() => {
    if (step !== 'QUESTION_ACTIVE' || isSubmitting) {
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Trigger auto-submit at 0s
          handleSubmitAnswer(answerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step, isSubmitting, handleSubmitAnswer]);

  // Handle Skip ("Bỏ qua")
  const handleSkipQuestion = () => {
    if (!role) return;

    if (currentQuestionIndex < 3) {
      const nextIndex = (currentQuestionIndex + 1) as QuestionIndex;
      fetchQuestion(role, nextIndex);
      if (role === 'custom' && nextIndex >= 2 && !isPro) {
        setIsCheckoutModalOpen(true);
      }
    } else {
      setStep('SESSION_SUMMARY');
    }
  };

  // Handle advancing from Rubric to next question or session summary
  const handleNextFromRubric = () => {
    if (!role) return;

    if (currentQuestionIndex < 3) {
      const nextIndex = (currentQuestionIndex + 1) as QuestionIndex;
      fetchQuestion(role, nextIndex);
      if (role === 'custom' && nextIndex >= 2 && !isPro) {
        setIsCheckoutModalOpen(true);
      }
    } else {
      setStep('SESSION_SUMMARY');
    }
  };

  // Reset entire session
  const handleRestart = () => {
    setStep('ROLE_CHOOSER');
    setRole(null);
    setCustomJdText(null);
    setCustomQuestions(null);
    setCustomJobTitle(null);
    setCurrentQuestionIndex(1);
    setCurrentQuestion(null);
    setAnswer('');
    setEvaluations([]);
    setLatestEvaluation(null);
    setErrorMessage(null);
    setIsCheckoutModalOpen(false);
  };

  // Emergency Quit
  const handleConfirmQuit = () => {
    setIsQuitModalOpen(false);
    handleRestart();
  };

  return (
    <main className="min-h-screen bg-[#0a0f1d] text-zinc-100 flex flex-col justify-between">
      <div className="flex-1 py-8">
        {/* Step 1: Role Chooser */}
        {step === 'ROLE_CHOOSER' && (
          <RoleChooser
            selectedRole={role}
            onSelectRole={handleSelectRole}
            onSelectCustomJd={handleSelectCustomJd}
            isLoading={isSubmitting}
          />
        )}

        {/* Step 2: Active Question */}
        {step === 'QUESTION_ACTIVE' && currentQuestion && (
          <>
            {role === 'custom' && currentQuestionIndex >= 2 && !isPro && (
              <div className="max-w-3xl mx-auto mb-4 px-4">
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-orange-500/15 to-amber-500/15 border border-orange-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-orange-200 shadow-md">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-orange-400 shrink-0" />
                    <span>
                      <strong>Nâng cấp Pro:</strong> Bạn đã sử dụng lượt thử nghiệm miễn phí Câu 1 theo JD. Nâng cấp Pro để mở khóa không giới hạn toàn bộ phiên phỏng vấn.
                    </span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="primary"
                    onClick={() => setIsCheckoutModalOpen(true)}
                    className="shrink-0 text-xs py-1.5 px-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold"
                  >
                    Mở gói Pro 29k
                  </Button>
                </div>
              </div>
            )}
            <QuestionCard
              question={currentQuestion}
              currentIndex={currentQuestionIndex}
              totalQuestions={3}
              timeRemaining={timeRemaining}
              timeLimit={timeLimit}
              answer={answer}
              onChangeAnswer={setAnswer}
              onSubmit={() => handleSubmitAnswer(answer)}
              onSkip={handleSkipQuestion}
              onQuit={() => setIsQuitModalOpen(true)}
              isSubmitting={isSubmitting}
            />
          </>
        )}

        {/* Evaluating Interstitial Screen */}
        {step === 'EVALUATING' && (
          <div className="max-w-xl mx-auto px-4 py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto mb-6">
              <div className="w-8 h-8 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
              Hội Đồng AI Đang Đánh Giá Câu Trả Lời...
            </h2>

            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
              Phân tích độ mạch lạc STAR, tính cụ thể của dẫn chứng và nhận thức
              rủi ro trong phương án xử lý của bạn.
            </p>

            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400 inline-flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                Mẹo: Trong các câu hỏi áp lực, luôn nêu rõ công cụ và kế hoạch dự
                phòng để ghi điểm cao.
              </span>
            </div>
          </div>
        )}

        {/* Step 3: Rubric Feedback */}
        {step === 'RUBRIC_FEEDBACK' && latestEvaluation && (
          <>
            {role === 'custom' && currentQuestionIndex === 1 && !isPro && (
              <div className="max-w-3xl mx-auto mb-4 px-4">
                <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-cyan-200">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>
                      Bạn vừa hoàn thành câu hỏi thử nghiệm theo JD miễn phí (Câu 1). Nâng cấp Pro để mở khóa Câu 2 & Câu 3.
                    </span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setIsCheckoutModalOpen(true)}
                    className="shrink-0 text-xs border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10"
                  >
                    Xem gói Pro
                  </Button>
                </div>
              </div>
            )}
            <RubricCard
              questionIndex={latestEvaluation.questionIndex}
              totalQuestions={3}
              questionTitle={latestEvaluation.questionTitle}
              candidateAnswer={latestEvaluation.candidateAnswer}
              rubricScores={latestEvaluation.rubricScores}
              averageScore={latestEvaluation.averageScore}
              strengths={latestEvaluation.strengths}
              improvements={latestEvaluation.improvements}
              followUpQuestion={latestEvaluation.followUpQuestion}
              simulatedPressureVerdict={latestEvaluation.simulatedPressureVerdict}
              onNext={handleNextFromRubric}
              isLastQuestion={currentQuestionIndex === 3}
              onQuit={() => setIsQuitModalOpen(true)}
            />
          </>
        )}

        {/* Step 4: Final Session Summary Report */}
        {step === 'SESSION_SUMMARY' && role && (
          <>
            <ReportCard
              role={role}
              evaluations={evaluations}
              targetRoleTitle={customJobTitle || undefined}
              onRestart={handleRestart}
              onWipeData={handleRestart}
              onShareCard={() => setIsShareModalOpen(true)}
            />

            <SharePreviewModal
              isOpen={isShareModalOpen}
              onClose={() => setIsShareModalOpen(false)}
              payload={(() => {
                const totalScore = evaluations.reduce((acc, e) => acc + e.averageScore, 0);
                const overallAverage = evaluations.length > 0
                  ? Math.round((totalScore / evaluations.length) * 10) / 10
                  : 0;

                const roleTitleDisplay =
                  role === 'custom'
                    ? (customJobTitle ? `Tùy biến: ${customJobTitle}` : 'Theo Job Description (Custom JD)')
                    : (role === 'it' ? 'IT / Software Engineer' : 'Marketing / Business');

                const shareTitle =
                  role === 'custom'
                    ? `Phỏng Vấn Tình Huống Áp Lực (Theo JD: ${customJobTitle || 'Tùy biến'})`
                    : `Phỏng Vấn Tình Huống Áp Lực (${role === 'it' ? 'IT' : 'Marketing'})`;

                return {
                  type: 'interview',
                  title: shareTitle,
                  score: overallAverage,
                  quoteOrHighlight: evaluations[0]?.candidateAnswer || evaluations[0]?.simulatedPressureVerdict || 'Phản xạ STAR mạch lạc dưới áp lực thời gian.',
                  summary: evaluations[0]?.simulatedPressureVerdict || 'Hoàn thành phiên phỏng vấn tình huống áp lực.',
                  toneOrRole: roleTitleDisplay,
                  topStrengths: evaluations[0]?.strengths,
                };
              })()}
            />
          </>
        )}

        {/* Error Recovery State */}
        {step === 'ERROR' && (
          <div className="max-w-md mx-auto px-4 py-20 text-center">
            <Card className="bg-zinc-900/80 border-rose-500/40 p-8 shadow-xl">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-4 text-rose-400">
                <AlertCircle className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-bold text-white mb-2">
                Không thể xử lý yêu cầu
              </h3>

              <p className="text-sm text-zinc-300 leading-relaxed mb-6">
                {errorMessage ||
                  'Đã xảy ra lỗi kết nối với máy chủ hoặc hệ thống AI. Vui lòng thử lại.'}
              </p>

              <div className="flex items-center justify-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('QUESTION_ACTIVE')}
                  className="border-zinc-700 text-zinc-300"
                >
                  Quay lại câu hỏi
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  onClick={() => handleSubmitAnswer(answer)}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  <span>Thử lại</span>
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Emergency Quit Confirmation Modal */}
      <QuitConfirmModal
        isOpen={isQuitModalOpen}
        onClose={() => setIsQuitModalOpen(false)}
        onConfirmQuit={handleConfirmQuit}
        completedCount={evaluations.length}
      />

      {/* Pro Upgrade Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
      />
    </main>
  );
}
