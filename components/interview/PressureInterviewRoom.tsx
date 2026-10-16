'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Timer,
  Flame,
  ShieldAlert,
  Send,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Terminal,
  RotateCcw,
  Sparkles,
  Lock,
  UserCheck,
  Briefcase,
  ChevronRight,
  ArrowLeft,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import {
  InterviewQuestionData,
  InterviewRole,
  JOB_MATCH_FIT_CRITERION_NAME,
} from '@/lib/schemas/interview';
import { WIPE_DATA_EVENT_NAME } from '@/lib/storage/wipe-data';

// ==========================================
// 1. INTERFACES & DATA TYPES
// ==========================================

export interface PressureQuestion {
  id: string | number;
  tag: string;
  title: string;
  cvEvidence?: string;
  scenario: string;
  pressureContext: string;
  question: string;
  timeLimitSeconds: number;
  hint: string;
  sampleBestAnswer?: string;
}

export interface AnswerSubmission {
  questionId: string | number;
  answerText: string;
  timeSpentSeconds: number;
  isTimedOut: boolean;
  pasteAttempts: number;
}

export interface QuestionEvaluation {
  questionId: string | number;
  questionTitle: string;
  score: number; // 0 - 100
  hrComment: string;
  starBreakdown: {
    hasSituationTask: boolean;
    hasSpecificAction: boolean;
    hasMeasurableResult: boolean;
  };
  rubricScores?: Array<{
    name: string;
    score: number;
    feedback: string;
  }>;
  strengths?: string[];
  improvements?: string[];
  sampleBestAnswer: string;
}

export interface FinalInterviewReport {
  overallScore: number;
  verdict: 'HIRED' | 'WAITLIST' | 'REJECTED';
  verdictTitle: string;
  summaryRoast: string;
  evaluations: QuestionEvaluation[];
}

export type InterviewStage =
  | 'LOBBY'
  | 'READING'
  | 'ANSWERING'
  | 'EVALUATING'
  | 'RESULT';

export interface PressureInterviewRoomProps {
  initialQuestions?: PressureQuestion[];
  initialRole?: InterviewRole;
  onExit?: () => void;
  className?: string;
}

// Bộ 3 câu hỏi mặc định IT
const DEFAULT_IT_QUESTIONS: PressureQuestion[] = [
  {
    id: 'it-1',
    tag: 'Vòng 1/3 • Kiểm chứng Kỹ thuật & Số liệu',
    title: 'Kiểm chứng hiệu năng và tối ưu hệ thống Backend',
    cvEvidence:
      'Tối ưu hiệu năng hệ thống Backend, giúp tăng tốc độ phản hồi API và chịu tải cao.',
    scenario:
      'Trong CV em ghi "tối ưu hiệu năng và chịu tải cao" rất kêu. Đội ngũ đánh giá cần thấy số liệu thực nghiệm thay vì khẩu hiệu.',
    pressureContext:
      'Tech Lead đối chiếu kiến trúc thực tế và yêu cầu bạn chứng minh phương pháp đo đạc chính xác.',
    question:
      'Cụ thể p95 latency trước và sau khi tối ưu là bao nhiêu ms? Em đã dùng công cụ gì để benchmark và xử lý bottleneck ở tầng Database hay Cache?',
    timeLimitSeconds: 90,
    hint: 'Nêu rõ công cụ đo (k6/JMeter), nguyên nhân gây nghẽn (N+1 query/thiếu index) và con số cải thiện thực tế.',
    sampleBestAnswer:
      'Ở đồ án cuối khóa, API danh sách sản phẩm bị chậm (p95 ~ 420ms khi test bằng k6 với 200 VU). Em kiểm tra Query Plan phát hiện lỗi N+1 query và thiếu Composite Index. Sau khi đánh lại Index trên PostgreSQL và cache kết quả bằng Redis (TTL 5 phút), latency giảm xuống 45ms, giảm 70% tải CPU DB.',
  },
  {
    id: 'it-2',
    tag: 'Vòng 2/3 • Xử lý Sự cố Production',
    title: 'Khủng hoảng thanh toán đêm thứ Sáu',
    cvEvidence:
      'Có khả năng làm việc nhóm tốt, chịu được áp lực công việc cao và giải quyết vấn đề nhanh.',
    scenario:
      'Lúc 11h đêm thứ Sáu, bản deploy của bạn làm lỗi thanh toán của khách hàng trên Production trong khi Tech Lead không nghe máy.',
    pressureContext:
      'Khách hàng liên tục khiếu nại mất tiền, giám đốc kinh doanh yêu cầu giải trình ngay trong 15 phút.',
    question:
      'Giả sử lúc 11h đêm thứ Sáu, bản deploy của em làm lỗi thanh toán của khách hàng trên Production trong khi Tech Lead không nghe máy. Em sẽ xử lý từng bước như thế nào trong 15 phút đầu tiên?',
    timeLimitSeconds: 90,
    hint: 'Ưu tiên cô lập lỗi / Rollback trước khi ngồi debug mò mẫm; thông báo rõ cho các bên liên quan.',
    sampleBestAnswer:
      'Trong 5 phút đầu, em lập tức kiểm tra Error Log trên Sentry/CloudWatch để xác nhận phạm vi lỗi và thực hiện Rollback về bản release ổn định trước đó để chặn thiệt hại cho khách. Sau khi hệ thống chạy lại bình thường, em mới báo cáo lên nhóm trực, dựng lại môi trường Staging để tái hiện bug và viết bổ sung Integration Test trước khi deploy lại.',
  },
  {
    id: 'it-3',
    tag: 'Vòng 3/3 • Đòn Tâm lý & Thái độ',
    title: 'Giá trị đóng góp tức thì của Fresher',
    cvEvidence:
      'Mong muốn học hỏi thêm kinh nghiệm trong môi trường chuyên nghiệp để phát triển bản thân.',
    scenario:
      'Nhà tuyển dụng đầu tư chi phí để chiêu mộ nhân sự tạo ra giá trị, không phải trung tâm đào tạo thiện nguyện.',
    pressureContext:
      'Áp lực chứng minh năng lực tự chủ và tinh thần trách nhiệm ngay trong kỳ thử việc.',
    question:
      'Công ty anh trả lương để em tạo ra giá trị chứ không phải mở lớp dạy học miễn phí. Với kiến thức hiện tại, trong 2 tuần đầu tiên ngồi vào bàn làm việc, em tự tin mình đóng góp được gì ngay mà không cần người cầm tay chỉ việc?',
    timeLimitSeconds: 90,
    hint: 'Chuyển từ tư thế "xin đi học" sang "đóng góp giá trị ngay": viết unit test, fix bug tồn đọng, chuẩn hóa tài liệu...',
    sampleBestAnswer:
      'Trong 2 tuần đầu, em không đợi giao việc thụ động mà sẽ: (1) Tự dựng xong môi trường local và đọc toàn bộ kiến trúc repo trong 2 ngày đầu, (2) Nhận xử lý ngay các ticket bug nhỏ/UI tồn đọng trên Jira để quen luồng CI/CD của team, và (3) Viết bổ sung Unit Test cho các module thiếu coverage.',
  },
];

// Bộ câu hỏi mặc định Marketing
const DEFAULT_MARKETING_QUESTIONS: PressureQuestion[] = [
  {
    id: 'mkt-1',
    tag: 'Vòng 1/3 • Kiểm chứng Số liệu & Attribution',
    title: 'Bóc tách hiệu quả chiến dịch và ROI thực tế',
    cvEvidence:
      'Chủ trì chiến dịch Performance Marketing đa kênh, mang lại ROI 300% và tăng trưởng vượt bậc.',
    scenario:
      'Trong CV ghi ROI 300% nhưng chưa rõ cách bóc tách attribution và tỷ lệ chuyển đổi chéo giữa các nền tảng quảng cáo.',
    pressureContext:
      'CMO yêu cầu chứng minh chỉ số kinh tế đơn vị (Unit Economics) thực tế chứ không chỉ là số liệu vanity metric.',
    question:
      'Em ghi chạy chiến dịch ROI 300%. Chi phí CAC và LTV cụ thể là bao nhiêu? Số liệu lấy từ attribution model nào để đảm bảo không đếm trùng chuyển đổi?',
    timeLimitSeconds: 90,
    hint: 'Nêu rõ CAC, LTV, mô hình phân bổ (Position-based / First-click) và công cụ đo (GA4 / AppsFlyer).',
    sampleBestAnswer:
      'Chiến dịch ra mắt tính năng mới đạt ROI 300% với CAC 85.000 VNĐ và LTV dự phóng 380.000 VNĐ trong 6 tháng. Số liệu được trích xuất từ Google Analytics 4 kết hợp MMP AppsFlyer theo mô hình Position-based Attribution, loại bỏ hoàn toàn các chuyển đổi trùng lặp giữa Meta Ads và TikTok Ads.',
  },
  {
    id: 'mkt-2',
    tag: 'Vòng 2/3 • Khủng hoảng Truyền thông Mạng xã hội',
    title: 'Phản ứng nhanh trước làn sóng chỉ trích thương hiệu',
    cvEvidence:
      'Kỹ năng xử lý khủng hoảng truyền thông tốt, linh hoạt điều phối các kênh mạng xã hội.',
    scenario:
      'Một bài đăng trên fanpage chứa lỗi thông tin nhạy cảm khiến cộng đồng phẫn nộ trong đêm Chủ nhật.',
    pressureContext:
      'Làn sóng tẩy chay đang lan rộng, báo chí bắt đầu liên hệ yêu cầu phỏng vấn trong vòng 30 phút.',
    question:
      'Khủng hoảng truyền thông bùng nổ vì sản phẩm lỗi trong đêm Chủ nhật. Em ứng phó 3 bước đầu ra sao trong 15 phút đầu tiên?',
    timeLimitSeconds: 90,
    hint: 'Ưu tiên tạm dừng ads, lập tức chuẩn bị thông cáo xin lỗi chân thành, không xóa comment gây kích động thêm.',
    sampleBestAnswer:
      'Trong 15 phút đầu, em lập tức: (1) Tạm dừng toàn bộ chiến dịch quảng cáo tự động đang chạy để tránh đổ thêm dầu vào lửa, (2) Báo cáo khẩn cấp cho Trưởng phòng Marketing và chuẩn bị bản FAQ giải trình kỹ thuật cùng đội Dev, và (3) Đăng thông cáo tiếp nhận sự cố trên fanpage chính thức với tinh thần cầu thị, cam kết cập nhật tiến độ sau mỗi 30 phút.',
  },
  {
    id: 'mkt-3',
    tag: 'Vòng 3/3 • Tối ưu Chi phí & Chuyển đổi',
    title: 'Cắt giảm 50% ngân sách nhưng giữ nguyên KPI',
    cvEvidence:
      'Tối ưu ngân sách quảng cáo linh hoạt, đảm bảo hiệu suất chuyển đổi cao trong mọi điều kiện.',
    scenario:
      'Ban giám đốc cắt giảm 50% ngân sách marketing quý tới vì thị trường khó khăn, nhưng KPI doanh số giữ nguyên.',
    pressureContext:
      'Bạn phải bảo vệ mục tiêu kinh doanh và chứng minh tư duy tăng trưởng tinh gọn (Growth Hacking).',
    question:
      'Ngân sách cắt giảm 50% nhưng KPI giữ nguyên. Em lập kế hoạch tối ưu kênh chuyển đổi thế nào để không gãy mục tiêu?',
    timeLimitSeconds: 90,
    hint: 'Tập trung vào tệp khách hàng ấm (Retargeting), kích hoạt kênh chi phí thấp (Email, SEO, Community).',
    sampleBestAnswer:
      'Khi ngân sách giảm 50%, em sẽ tái phân bổ theo nguyên tắc 80/20: Dồn 70% ngân sách còn lại vào 2 ad-sets có tỷ lệ ROAS cao nhất (Retargeting tệp Warm Audience), cắt bỏ các kênh Branding nhận diện tốn kém, đồng thời đẩy mạnh Content SEO Organic và Email Marketing tự động hóa để duy trì tỷ lệ chuyển đổi mà không tốn chi phí media.',
  },
];

export function PressureInterviewRoom({
  initialQuestions,
  initialRole = 'it',
  onExit,
  className,
}: PressureInterviewRoomProps) {
  // States quản lý luồng
  const [stage, setStage] = useState<InterviewStage>('LOBBY');
  const [persona, setPersona] = useState<'savage' | 'mentor'>('savage');
  const [selectedTrack, setSelectedTrack] = useState<'it' | 'marketing' | 'cv_tailored'>('it');
  const [questions, setQuestions] = useState<PressureQuestion[]>(
    initialQuestions || DEFAULT_IT_QUESTIONS
  );
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [hasCvContext, setHasCvContext] = useState<boolean>(false);

  // States bộ đếm & nhập liệu
  const [readingCountdown, setReadingCountdown] = useState<number>(5);
  const [timeLeft, setTimeLeft] = useState<number>(90);
  const [currentAnswer, setCurrentAnswer] = useState<string>('');
  const [pasteAttempts, setPasteAttempts] = useState<number>(0);
  const [cheatWarning, setCheatWarning] = useState<string | null>(null);

  // States lưu trữ bài làm & kết quả chấm
  const [submissions, setSubmissions] = useState<AnswerSubmission[]>([]);
  const [report, setReport] = useState<FinalInterviewReport | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const currentAnswerRef = useRef<string>(currentAnswer);
  currentAnswerRef.current = currentAnswer;

  const pasteAttemptsRef = useRef<number>(pasteAttempts);
  pasteAttemptsRef.current = pasteAttempts;

  const timeLeftRef = useRef<number>(timeLeft);
  timeLeftRef.current = timeLeft;

  const submissionsRef = useRef<AnswerSubmission[]>(submissions);
  submissionsRef.current = submissions;

  const currentIdxRef = useRef<number>(currentIdx);
  currentIdxRef.current = currentIdx;

  const questionsRef = useRef<PressureQuestion[]>(questions);
  questionsRef.current = questions;

  const currentQuestion = questions[currentIdx] || DEFAULT_IT_QUESTIONS[0];

  // ==========================================
  // 2. KHỞI TẠO NGỮ CẢNH TỪ SESSIONSTORAGE
  // ==========================================
  useEffect(() => {
    try {
      // Check both keys supported by CV Bridge
      const cvQuestionsRaw =
        sessionStorage.getItem('airoastcv_custom_interview_questions') ||
        sessionStorage.getItem('ai_roast_cv_context');

      if (cvQuestionsRaw) {
        let loadedQuestions: any[] = [];
        const parsed = JSON.parse(cvQuestionsRaw);
        if (Array.isArray(parsed)) {
          loadedQuestions = parsed;
        } else if (parsed && Array.isArray(parsed.customQuestions)) {
          loadedQuestions = parsed.customQuestions;
        }

        if (loadedQuestions.length > 0) {
          const normalized: PressureQuestion[] = loadedQuestions.map((q, idx) => ({
            id: q.questionId || q.id || `cv-q-${idx + 1}`,
            tag: q.tag || `Vòng ${idx + 1}/${loadedQuestions.length} • Câu hỏi từ CV của bạn`,
            title: q.title || `Câu hỏi áp lực #${idx + 1}`,
            cvEvidence: q.cvEvidence || q.scenario || 'Trích dẫn chi tiết từ CV của bạn',
            scenario: q.scenario || q.question || '',
            pressureContext:
              q.pressureContext ||
              'Nhà tuyển dụng trực tiếp soi chiếu kinh nghiệm thực tế ghi trong CV.',
            question: q.question || q.scenario || '',
            timeLimitSeconds: q.timeLimitSeconds || 90,
            hint:
              q.hint ||
              'Áp dụng công thức STAR: Tình huống -> Hành động cụ thể -> Số liệu kết quả.',
            sampleBestAnswer:
              q.sampleBestAnswer ||
              'Áp dụng quy trình chuẩn: Xác định phạm vi vấn đề, triển khai giải pháp kỹ thuật cụ thể và đo lường kết quả bằng chỉ số định lượng rõ ràng.',
          }));

          setQuestions(normalized);
          setHasCvContext(true);
          setSelectedTrack('cv_tailored');
        }
      }
    } catch {
      // Giữ bộ câu hỏi mặc định
    }
  }, []);

  // Listen for Wipe Data to reset state
  useEffect(() => {
    const handleWiped = () => {
      setHasCvContext(false);
      setSelectedTrack('it');
      setQuestions(DEFAULT_IT_QUESTIONS);
      setStage('LOBBY');
      setSubmissions([]);
      setReport(null);
      setCurrentIdx(0);
      setCurrentAnswer('');
      setPasteAttempts(0);
      setCheatWarning(null);
    };
    window.addEventListener(WIPE_DATA_EVENT_NAME, handleWiped);
    return () => window.removeEventListener(WIPE_DATA_EVENT_NAME, handleWiped);
  }, []);

  // Thay đổi Track
  const handleSelectTrack = (track: 'it' | 'marketing' | 'cv_tailored') => {
    setSelectedTrack(track);
    if (track === 'it') {
      setQuestions(DEFAULT_IT_QUESTIONS);
    } else if (track === 'marketing') {
      setQuestions(DEFAULT_MARKETING_QUESTIONS);
    }
  };

  // ==========================================
  // 3. LOGIC CHẤM ĐIỂM (STAR + API INTEGRATION)
  // ==========================================
  const evaluateInterview = useCallback(
    async (allSubmissions: AnswerSubmission[]) => {
      setStage('EVALUATING');

      try {
        // Evaluate all submissions via /api/interview/evaluate or heuristic fallback
        const evalResults: QuestionEvaluation[] = await Promise.all(
          allSubmissions.map(async (sub, i) => {
            const q = questions[i] || DEFAULT_IT_QUESTIONS[i] || DEFAULT_IT_QUESTIONS[0];
            const cleanText = sub.answerText.trim();
            const wordCount = cleanText ? cleanText.split(/\s+/).length : 0;

            // Heuristic signals
            const hasNumbers = /\d+(%|ms|s|x|k|triệu|phút|giờ|ngày|bug|api)/i.test(cleanText);
            const hasActionVerbs =
              /(tối ưu|sử dụng|triển khai|rollback|kiểm tra|phân tích|cấu hình|log|debug|redis|index|test|fix|chạy|xử lý|đo|báo cáo|lập kế hoạch)/i.test(
                cleanText
              );
            const hasContext = wordCount >= 20;

            let apiEvalData: any = null;
            try {
              const res = await fetch('/api/interview/evaluate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  role: selectedTrack === 'marketing' ? 'marketing' : 'it',
                  questionId: String(q.id),
                  questionIndex: (i + 1) as 1 | 2 | 3,
                  questionScenario: q.scenario || q.question,
                  candidateAnswer: sub.answerText,
                  timeSpentSeconds: sub.timeSpentSeconds,
                }),
              });

              if (res.ok) {
                const json = await res.json();
                if (json.success && json.data) {
                  apiEvalData = json.data;
                }
              }
            } catch {
              // API offline or mocked -> fallback to local heuristic
            }

            // Calculate score (0-100)
            let baseScore = 0;
            if (wordCount === 0) {
              baseScore = 0;
            } else if (apiEvalData?.averageScore) {
              baseScore = Math.round(apiEvalData.averageScore * 10);
            } else {
              baseScore = 30;
              if (hasContext) baseScore += 25;
              if (hasActionVerbs) baseScore += 25;
              if (hasNumbers) baseScore += 20;
              if (sub.isTimedOut && wordCount < 15) baseScore -= 15;
            }

            // Anti-cheat attitude penalty: -10 per paste attempt (max 20 deduction)
            if (sub.pasteAttempts > 0) {
              baseScore -= Math.min(20, sub.pasteAttempts * 10);
            }

            const finalScore = Math.max(0, Math.min(100, baseScore));

            // HR Comment
            let hrComment = '';
            if (wordCount === 0) {
              hrComment =
                persona === 'savage'
                  ? 'Đứng hình mất 90 giây! Đi phỏng vấn thật mà im lặng thế này là HR tiễn ra cửa từ phút thứ 2 nhé.'
                  : 'Bạn đã bỏ trống câu này. Trong phỏng vấn áp lực, hãy cố gắng nêu hướng tiếp cận sơ bộ thay vì im lặng hoàn toàn.';
            } else if (apiEvalData?.simulatedPressureVerdict) {
              hrComment = apiEvalData.simulatedPressureVerdict;
            } else if (finalScore < 50) {
              hrComment =
                persona === 'savage'
                  ? `Trả lời mới được ${wordCount} chữ toàn văn mẫu chung chung, không có nổi 1 con số hay hành động kỹ thuật cụ thể. Chém gió trong CV bị lộ rồi nhé!`
                  : 'Câu trả lời còn ngắn và thiếu chiều sâu thực tế. Bạn cần bổ sung hành động cụ thể (Action) và kết quả đo lường được (Result).';
            } else if (finalScore < 80) {
              hrComment =
                persona === 'savage'
                  ? 'Có ý thức xử lý vấn đề đấy, nhưng vẫn thiếu số liệu thực chứng (Metrics) để thuyết phục Tech Lead khó tính.'
                  : 'Hướng tư duy khá tốt! Để đạt điểm tuyệt đối, hãy định lượng hóa kết quả bằng con số cụ thể hơn.';
            } else {
              hrComment =
                persona === 'savage'
                  ? 'Khá khen! Trả lời có lớp lang, có công cụ và con số rõ ràng. Đủ bản lĩnh sống sót qua vòng gửi xe!'
                  : 'Câu trả lời rất xuất sắc, bám sát cấu trúc STAR và thể hiện rõ tư duy giải quyết vấn đề thực chiến.';
            }

            if (sub.pasteAttempts > 0) {
              hrComment += ` (Bị trừ ${sub.pasteAttempts * 10} điểm thái độ vì phát hiện cố tình copy từ bên ngoài).`;
            }

            const sampleAnswer =
              q.sampleBestAnswer ||
              DEFAULT_IT_QUESTIONS[i]?.sampleBestAnswer ||
              'Áp dụng quy trình STAR chuẩn hóa giải quyết vấn đề.';

            return {
              questionId: q.id,
              questionTitle: q.title || q.tag,
              score: finalScore,
              hrComment,
              starBreakdown: {
                hasSituationTask: hasContext,
                hasSpecificAction: hasActionVerbs,
                hasMeasurableResult: hasNumbers,
              },
              rubricScores: apiEvalData?.rubricScores,
              strengths: apiEvalData?.strengths || ['Phản xạ nhanh trước áp lực thời gian'],
              improvements: apiEvalData?.improvements || [
                'Bổ sung thêm chỉ số đo lường định lượng cụ thể',
              ],
              sampleBestAnswer: sampleAnswer,
            };
          })
        );

        const avgScore = Math.round(
          evalResults.reduce((sum, item) => sum + item.score, 0) / evalResults.length
        );

        let verdict: FinalInterviewReport['verdict'] = 'REJECTED';
        let verdictTitle = '💀 BAY MÀU VÒNG PHỎNG VẤN (REJECTED)';
        let summaryRoast =
          persona === 'savage'
            ? 'CV viết một đằng, vào phòng phỏng vấn hỏi xoáy 3 câu là lộ ngay học thuộc lòng văn mẫu. Cần luyện lại cách bảo vệ đồ án ngay!'
            : 'Bạn chưa vượt qua bài kiểm tra áp lực lần này. Hãy chuẩn bị kỹ hơn các minh chứng kỹ thuật và rèn luyện phản xạ.';

        if (avgScore >= 75) {
          verdict = 'HIRED';
          verdictTitle = '🔥 VƯỢT ẢI THÀNH CÔNG (PASSED INTERVIEW)';
          summaryRoast =
            persona === 'savage'
              ? 'Phản xạ sắc bén, tâm lý vững trước đồng hồ đếm ngược và biết dùng số liệu kỹ thuật để khóa miệng HR khó tính!'
              : 'Chúc mừng bạn! Câu trả lời rất tự tin, mạch lạc theo chuẩn STAR và thuyết phục được toàn bộ hội đồng tuyển dụng.';
        } else if (avgScore >= 50) {
          verdict = 'WAITLIST';
          verdictTitle = '⚠️ Vớt Vát Vòng Chờ (ON HOLD / PROBATION)';
          summaryRoast =
            persona === 'savage'
              ? 'Có kiến thức nền tảng nhưng phản xạ dưới áp lực thời gian còn lúng túng, chưa bung được số liệu đắt giá để chốt hạ.'
              : 'Bạn có tiềm năng nhưng cần rèn luyện thêm khả năng tư duy nhanh và đưa ra các dẫn chứng định lượng sắc bén hơn.';
        }

        setReport({
          overallScore: avgScore,
          verdict,
          verdictTitle,
          summaryRoast,
          evaluations: evalResults,
        });
        setStage('RESULT');
      } catch {
        // Fallback safety
        setStage('RESULT');
      }
    },
    [persona, questions, selectedTrack]
  );

  // ==========================================
  // 4. HÀM NỘP CÂU TRẢ LỜI & CHUYỂN CÂU TIẾP THEO
  // ==========================================
  const handleSubmitCurrentAnswer = useCallback(
    (isTimedOut: boolean = false) => {
      const cIdx = currentIdxRef.current;
      const qList = questionsRef.current;
      const q = qList[cIdx] || DEFAULT_IT_QUESTIONS[0];
      const timeRemaining = timeLeftRef.current;
      const timeSpent = isTimedOut
        ? q.timeLimitSeconds
        : Math.max(1, q.timeLimitSeconds - timeRemaining);

      // Preserving current draft text typed so far
      const finalDraft = currentAnswerRef.current;
      const finalPasteAttempts = pasteAttemptsRef.current;

      const newSubmission: AnswerSubmission = {
        questionId: q.id,
        answerText: finalDraft,
        timeSpentSeconds: timeSpent,
        isTimedOut,
        pasteAttempts: finalPasteAttempts,
      };

      const updatedSubmissions = [...submissionsRef.current, newSubmission];
      submissionsRef.current = updatedSubmissions;
      setSubmissions(updatedSubmissions);

      // Reset state cho câu tiếp theo
      setCurrentAnswer('');
      setPasteAttempts(0);
      setCheatWarning(null);

      if (cIdx + 1 < qList.length) {
        currentIdxRef.current = cIdx + 1;
        setCurrentIdx(cIdx + 1);
        setReadingCountdown(5);
        setStage('READING');
      } else {
        evaluateInterview(updatedSubmissions);
      }
    },
    [evaluateInterview]
  );

  // ==========================================
  // 5. TIMERS (5s ĐỌC ĐỀ & 90s TRẢ LỜI)
  // ==========================================
  // Timer 5 giây đọc đề
  useEffect(() => {
    if (stage !== 'READING') return;

    const timer = setInterval(() => {
      setReadingCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [stage]);

  // Chuyển từ READING sang ANSWERING khi hết 5s đọc đề
  useEffect(() => {
    if (stage === 'READING' && readingCountdown <= 0) {
      const cIdx = currentIdxRef.current;
      const q = questionsRef.current[cIdx] || DEFAULT_IT_QUESTIONS[0];
      setTimeLeft(q.timeLimitSeconds || 90);
      setStage('ANSWERING');
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [stage, readingCountdown]);

  // Timer 90 giây trả lời
  useEffect(() => {
    if (stage !== 'ANSWERING') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [stage]);

  // Auto-Submit khi hết 90s (00:00)
  useEffect(() => {
    if (stage === 'ANSWERING' && timeLeft <= 0) {
      handleSubmitCurrentAnswer(true);
    }
  }, [stage, timeLeft, handleSubmitCurrentAnswer]);

  // ==========================================
  // 6. CHỐNG COPY-PASTE TỪ CHATGPT (ANTI-CHEAT)
  // ==========================================
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData('text');
    // Nếu paste đoạn văn dài hơn 30 ký tự -> Chặn ngay lập tức
    if (pastedText.length > 30) {
      e.preventDefault();
      setPasteAttempts((prev) => prev + 1);
      setCheatWarning(
        '🚫 Copy từ ChatGPT là HR gửi xe giùm bạn liền đó! Đang phỏng vấn trực tiếp trước mặt HR, không dùng phao cứu trợ từ ChatGPT nhé (-10 điểm thái độ).'
      );
      // Tự tắt cảnh báo sau 4 giây
      setTimeout(() => setCheatWarning(null), 4000);
    }
  };

  // Khởi động phỏng vấn
  const startInterview = () => {
    submissionsRef.current = [];
    currentIdxRef.current = 0;
    setSubmissions([]);
    setCurrentIdx(0);
    setCurrentAnswer('');
    setPasteAttempts(0);
    setCheatWarning(null);
    setReadingCountdown(5);
    setStage('READING');
  };

  // Trở về phòng chờ để sẵn sàng thi lại
  const handleReturnToLobby = () => {
    submissionsRef.current = [];
    currentIdxRef.current = 0;
    setSubmissions([]);
    setCurrentIdx(0);
    setCurrentAnswer('');
    setPasteAttempts(0);
    setCheatWarning(null);
    setReadingCountdown(5);
    setStage('LOBBY');
  };

  // Format giây sang MM:SS
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const isDangerZone = stage === 'ANSWERING' && timeLeft < 20;

  return (
    <div
      data-testid="pressure-interview-room"
      className={cn(
        'min-h-[85vh] text-zinc-100 py-6 px-4 sm:px-6 flex flex-col items-center justify-center',
        className
      )}
    >
      <div className="w-full max-w-4xl">
        {/* ====================================================
            STAGE 1: PHÒNG CHỜ & CHỌN ĐỘ KHÓ (LOBBY)
        ==================================================== */}
        {stage === 'LOBBY' && (
          <div
            data-testid="stage-lobby"
            className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8 shadow-2xl space-y-6"
          >
            {/* Top Bar Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-3 w-3 rounded-full bg-rose-500 animate-ping" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-rose-400">
                  PRESSURE INTERVIEW SIMULATOR // CONTINUOUS ROOM
                </span>
              </div>
              <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-mono text-zinc-300">
                {questions.length} Câu hỏi xoáy • 90s / câu
              </span>
            </div>

            {/* Banner nạp câu hỏi từ CV */}
            {hasCvContext && (
              <div
                role="status"
                className="p-4 rounded-xl border border-purple-500/40 bg-purple-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-purple-200"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>
                    <strong>Đã nạp 3 câu hỏi áp lực từ CV của bạn!</strong> Các câu hỏi được thiết
                    kế riêng xoáy vào chính điểm yếu lớn nhất trong CV vừa quét.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleSelectTrack('cv_tailored')}
                  className={cn(
                    'shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition',
                    selectedTrack === 'cv_tailored'
                      ? 'bg-purple-500 text-white shadow'
                      : 'border border-purple-500/40 text-purple-300 hover:bg-purple-500/20'
                  )}
                >
                  Dùng bộ câu hỏi này
                </button>
              </div>
            )}

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Phòng Phỏng Vấn Áp Lực Cao (Continuous 5-Stage Room)
              </h1>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Mô phỏng chân thực phòng thi với Tech Lead & HR khó tính. Bạn sẽ đi qua 5 giai đoạn
                liên hoàn không ngắt quãng: Đọc đề 5s ➔ Trả lời 90s (chặn copy ChatGPT) ➔ Đánh giá
                STAR & Khám phá câu trả lời mẫu 10/10.
              </p>
            </div>

            {/* Chọn Track Phỏng Vấn */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Chọn Chuyên Ngành Phỏng Vấn:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleSelectTrack('it')}
                  className={cn(
                    'p-3.5 rounded-xl border text-left transition',
                    selectedTrack === 'it'
                      ? 'border-orange-500 bg-orange-500/10 text-white'
                      : 'border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900 text-zinc-400'
                  )}
                >
                  <div className="font-bold text-sm text-orange-400 flex items-center gap-1.5">
                    <Terminal className="w-4 h-4" /> IT / Software
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Kiểm chứng số liệu, sự cố Prod, văn hóa Fresher.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTrack('marketing')}
                  className={cn(
                    'p-3.5 rounded-xl border text-left transition',
                    selectedTrack === 'marketing'
                      ? 'border-cyan-500 bg-cyan-500/10 text-white'
                      : 'border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900 text-zinc-400'
                  )}
                >
                  <div className="font-bold text-sm text-cyan-400 flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4" /> Marketing / Growth
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Attribution ROI, xử lý PR Crisis, tối ưu chuyển đổi.
                  </p>
                </button>

                {hasCvContext && (
                  <button
                    type="button"
                    onClick={() => handleSelectTrack('cv_tailored')}
                    className={cn(
                      'p-3.5 rounded-xl border text-left transition',
                      selectedTrack === 'cv_tailored'
                        ? 'border-purple-500 bg-purple-500/10 text-white'
                        : 'border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900 text-zinc-400'
                    )}
                  >
                    <div className="font-bold text-sm text-purple-400 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" /> Từ CV Vừa Roast
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      3 câu hỏi áp lực cá nhân hóa theo CV của bạn.
                    </p>
                  </button>
                )}
              </div>
            </div>

            {/* Chọn Persona Người Phỏng Vấn */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <button
                type="button"
                onClick={() => setPersona('savage')}
                className={cn(
                  'text-left rounded-xl border p-4 transition',
                  persona === 'savage'
                    ? 'border-orange-500 bg-orange-500/10'
                    : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-orange-400 flex items-center gap-1.5">
                    <Flame className="w-4 h-4" /> Chế độ: Tech Lead &quot;Mỏ Hỗn&quot;
                  </span>
                  {persona === 'savage' && (
                    <span className="text-[10px] font-mono bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded">
                      ĐANG CHỌN
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-1.5">
                  Hỏi thẳng, bắt bẻ từng con số, sẵn sàng dập tắt mọi câu trả lời văn mẫu sáo rỗng.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPersona('mentor')}
                className={cn(
                  'text-left rounded-xl border p-4 transition',
                  persona === 'mentor'
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4" /> Chế độ: HR Chuyên Gia
                  </span>
                  {persona === 'mentor' && (
                    <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">
                      ĐANG CHỌN
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-1.5">
                  Đặt câu hỏi tình huống sâu sắc, hướng dẫn phân tích câu trả lời chuẩn STAR.
                </p>
              </button>
            </div>

            {/* Luật chơi phòng thi */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" /> Quy tắc sinh tồn trong phòng thi:
              </div>
              <ul className="text-xs text-zinc-300 space-y-1.5 list-disc list-inside">
                <li>
                  Bạn có <strong>5 giây đọc đề</strong> và{' '}
                  <strong>90 giây để gõ câu trả lời</strong> cho mỗi câu hỏi.
                </li>
                <li>
                  Khi đồng hồ về <strong>00:00</strong>, hệ thống tự động thu bài ngay lập tức (giữ
                  nguyên câu chữ đang gõ dở).
                </li>
                <li>
                  <strong>Cấm Copy-Paste từ ChatGPT:</strong> Bắt sự kiện dán văn bản &gt; 30 ký tự,
                  khóa lệnh Paste và trừ 10 điểm thái độ.
                </li>
              </ul>
            </div>

            <div className="flex items-center gap-3">
              {onExit && (
                <button
                  type="button"
                  onClick={onExit}
                  className="px-4 py-4 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-xs font-semibold text-zinc-300 transition"
                >
                  <ArrowLeft className="w-4 h-4 inline mr-1.5" /> Quay lại
                </button>
              )}
              <button
                type="button"
                data-testid="start-interview-btn"
                onClick={startInterview}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 py-4 text-sm font-bold text-white shadow-lg shadow-orange-500/20 hover:opacity-95 transition cursor-pointer"
              >
                ⏱️ Bước vào phòng phỏng vấn ngay
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ====================================================
            STAGE 2 & 3: ĐỌC ĐỀ (5S) & TRẢ LỜI DƯỚI ÁP LỰC (90S)
        ==================================================== */}
        {(stage === 'READING' || stage === 'ANSWERING') && (
          <div
            data-testid={stage === 'READING' ? 'stage-reading' : 'stage-answering'}
            className={cn(
              'rounded-2xl border p-6 sm:p-8 shadow-2xl transition-all duration-300 space-y-6',
              isDangerZone
                ? 'border-red-500/80 animate-pulse bg-rose-950/20 shadow-rose-500/20'
                : 'border-zinc-800 bg-zinc-900/70'
            )}
          >
            {/* Top Bar: Tiến độ & Countdown */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-orange-400">
                  {currentQuestion.tag}
                </span>
                <div className="flex items-center gap-2 mt-1.5">
                  {questions.map((q, idx) => (
                    <div
                      key={String(q.id)}
                      className={cn(
                        'h-2 w-12 rounded-full transition-all',
                        idx < currentIdx
                          ? 'bg-emerald-500'
                          : idx === currentIdx
                          ? 'bg-orange-500 animate-pulse'
                          : 'bg-zinc-800'
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* Đồng hồ Countdown */}
              <div
                data-testid="countdown-timer"
                className={cn(
                  'flex items-center gap-2.5 rounded-xl border px-4 py-2 font-mono transition-colors',
                  stage === 'READING'
                    ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                    : isDangerZone
                    ? 'border-red-500/80 bg-red-500/20 text-red-500 animate-bounce'
                    : 'border-zinc-700 bg-zinc-950 text-zinc-100'
                )}
              >
                <Timer className="w-5 h-5 shrink-0" />
                {stage === 'READING' ? (
                  <span className="text-sm font-bold">
                    Đọc kỹ đề: 0{readingCountdown}s
                  </span>
                ) : (
                  <span className="text-xl font-extrabold tracking-widest">
                    {formatTime(timeLeft)}
                  </span>
                )}
              </div>
            </div>

            {/* Reading Countdown Progress Bar */}
            {stage === 'READING' && (
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-400 h-full transition-all duration-1000 ease-linear"
                  style={{ width: `${(readingCountdown / 5) * 100}%` }}
                />
              </div>
            )}

            {/* Tiêu đề & Bối cảnh câu hỏi */}
            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl font-extrabold text-white">
                {currentQuestion.title}
              </h2>
              {currentQuestion.scenario && currentQuestion.scenario !== currentQuestion.question && (
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  {currentQuestion.scenario}
                </p>
              )}
            </div>

            {/* Bằng chứng trích từ CV */}
            {currentQuestion.cvEvidence && (
              <div className="rounded-xl bg-zinc-950/90 border border-zinc-800 p-4">
                <div className="text-[11px] font-mono uppercase text-zinc-400 mb-1 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-orange-400" />
                  Chi tiết trong CV của bạn bị HR soi:
                </div>
                <blockquote className="text-xs sm:text-sm italic text-zinc-300">
                  “{currentQuestion.cvEvidence}”
                </blockquote>
              </div>
            )}

            {/* Câu hỏi vặn của HR */}
            <div className="rounded-xl bg-gradient-to-br from-orange-500/15 via-rose-500/10 to-zinc-900 border border-orange-500/40 p-5 space-y-2">
              <div className="text-xs font-bold text-orange-400 flex items-center gap-1.5">
                <Terminal className="w-4 h-4" />
                {persona === 'savage'
                  ? 'Tech Lead khó tính hỏi xoáy:'
                  : 'Chuyên gia Tuyển dụng đặt câu hỏi:'}
              </div>
              <p className="text-base sm:text-lg font-bold text-white leading-relaxed">
                “{currentQuestion.question}”
              </p>
              {currentQuestion.pressureContext && (
                <p className="text-xs text-rose-300/90 italic">
                  ⚡ <strong>Bối cảnh áp lực:</strong> {currentQuestion.pressureContext}
                </p>
              )}
              {currentQuestion.hint && (
                <p className="text-xs text-zinc-400 pt-1">
                  💡 <strong>Gợi ý sống sót (STAR):</strong> {currentQuestion.hint}
                </p>
              )}
            </div>

            {/* Cảnh báo Anti-Cheat nếu cố tình Paste từ ChatGPT */}
            {cheatWarning && (
              <div
                role="alert"
                data-testid="cheat-warning"
                className="rounded-xl border border-rose-500 bg-rose-500/15 p-3 text-xs font-semibold text-rose-300 flex items-center gap-2 animate-pulse"
              >
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{cheatWarning}</span>
              </div>
            )}

            {/* Khung nhập câu trả lời */}
            <div className="relative">
              {stage === 'READING' && (
                <div
                  role="status"
                  className="absolute inset-0 z-10 rounded-xl bg-zinc-950/85 backdrop-blur-xs flex flex-col items-center justify-center gap-2 border border-amber-500/30"
                >
                  <Lock className="w-6 h-6 text-amber-400 animate-pulse" />
                  <p className="text-xs sm:text-sm font-semibold text-amber-300">
                    Hãy đọc kỹ câu hỏi! Bàn phím sẽ mở sau 0{readingCountdown}s...
                  </p>
                </div>
              )}

              <textarea
                ref={textareaRef}
                rows={5}
                disabled={stage === 'READING'}
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                onPaste={handlePaste}
                placeholder="Nhập câu trả lời trực diện vào vấn đề: Tình huống (Situation) -> Hành động cụ thể của bạn (Action) -> Số liệu kết quả (Result)..."
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-4 text-sm text-zinc-100 placeholder-zinc-500 focus:border-orange-500 focus:outline-none disabled:opacity-50"
              />

              <div className="mt-2 flex items-center justify-between text-xs text-zinc-400">
                <span>
                  Số từ:{' '}
                  <strong className="text-zinc-200">
                    {currentAnswer.trim() ? currentAnswer.trim().split(/\s+/).length : 0}
                  </strong>{' '}
                  từ (Khuyên dùng: 40 - 100 từ)
                </span>
                {isDangerZone && (
                  <span className="text-rose-400 font-semibold animate-pulse">
                    ⚠️ Sắp hết giờ! Chốt ý nhanh!
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                disabled={stage === 'READING'}
                onClick={() => handleSubmitCurrentAnswer(false)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 px-6 py-3 text-sm font-bold text-white shadow-lg hover:opacity-95 disabled:opacity-40 transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
                {currentIdx + 1 < questions.length
                  ? 'Chốt câu trả lời & Qua câu tiếp theo'
                  : 'Nộp câu cuối & Xem phán quyết của HR'}
              </button>
            </div>
          </div>
        )}

        {/* ====================================================
            STAGE 4: AI ĐANG CHẤM BÀI (EVALUATING)
        ==================================================== */}
        {stage === 'EVALUATING' && (
          <div
            data-testid="stage-evaluating"
            className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-12 text-center space-y-4"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-500/15 border border-orange-500/40">
              <Sparkles className="w-7 h-7 text-orange-400 animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-white">
              Hội đồng Tuyển dụng AI đang mổ xẻ câu trả lời của bạn...
            </h2>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Đang kiểm tra mức độ khớp với cấu trúc STAR, số liệu thực chứng và tốc độ phản xạ dưới
              áp lực.
            </p>
          </div>
        )}

        {/* ====================================================
            STAGE 5: BẢNG PHÁN QUYẾT & CHỮA BÀI CHI TIẾT (RESULT)
        ==================================================== */}
        {stage === 'RESULT' && report && (
          <div data-testid="stage-result" className="space-y-6">
            {/* Banner Tổng kết Verdict */}
            <div
              className={cn(
                'rounded-2xl border p-6 sm:p-8 shadow-2xl',
                report.verdict === 'HIRED'
                  ? 'border-emerald-500/40 bg-emerald-950/20'
                  : report.verdict === 'WAITLIST'
                  ? 'border-amber-500/40 bg-amber-950/20'
                  : 'border-rose-500/40 bg-rose-950/20'
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                    PHÁN QUYẾT CUỐI CÙNG TỪ PHÒNG PHỎNG VẤN
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                    {report.verdictTitle}
                  </h2>
                </div>

                <div className="rounded-2xl border border-zinc-700 bg-zinc-950/90 px-5 py-3 text-right">
                  <div className="text-[11px] font-mono text-zinc-400 uppercase">
                    Điểm bản lĩnh
                  </div>
                  <div className="text-3xl font-extrabold font-mono text-orange-400">
                    {report.overallScore}/100
                  </div>
                </div>
              </div>

              <p className="mt-4 text-sm text-zinc-200 leading-relaxed border-t border-zinc-800/80 pt-4">
                <strong>🔥 Nhận xét tổng quát:</strong> {report.summaryRoast}
              </p>
            </div>

            {/* Chi tiết từng câu trả lời & Bản sửa mẫu STAR */}
            <div className="space-y-4">
              {questions.map((q, idx) => {
                const sub = submissions[idx];
                const evalItem = report.evaluations[idx];
                if (!sub || !evalItem) return null;

                return (
                  <div
                    key={String(q.id)}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6 space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                      <span className="text-xs font-mono font-bold text-orange-400">
                        {q.tag}
                      </span>
                      <div className="flex items-center gap-3 text-xs font-mono">
                        <span className="text-zinc-400">
                          ⏱️ Phản xạ: {sub.timeSpentSeconds}s
                          {sub.isTimedOut ? ' (Hết giờ)' : ''}
                        </span>
                        <span
                          className={cn(
                            'rounded-lg px-2.5 py-1 font-bold',
                            evalItem.score >= 70
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : evalItem.score >= 45
                              ? 'bg-amber-500/15 text-amber-400'
                              : 'bg-rose-500/15 text-rose-400'
                          )}
                        >
                          Điểm: {evalItem.score}/100
                        </span>
                      </div>
                    </div>

                    <p className="text-sm font-bold text-zinc-100">
                      ❓ Câu hỏi: “{q.question}”
                    </p>

                    {/* Câu trả lời thực tế của ứng viên */}
                    <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-3.5">
                      <div className="text-[11px] text-zinc-400 mb-1">
                        🗣️ Câu trả lời của bạn:
                      </div>
                      <p className="text-xs sm:text-sm text-zinc-300 italic">
                        {sub.answerText.trim()
                          ? `“${sub.answerText}”`
                          : '(Không trả lời kịp chữ nào trước khi hết giờ 💀)'}
                      </p>
                    </div>

                    {/* Checklist 3 tiêu chí STAR */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div className="flex items-center gap-2 rounded-lg bg-zinc-950/70 border border-zinc-800 p-2.5">
                        {evalItem.starBreakdown.hasSituationTask ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                        <span>Bối cảnh (Situation/Task)</span>
                      </div>
                      <div className="flex items-center gap-2 rounded-lg bg-zinc-950/70 border border-zinc-800 p-2.5">
                        {evalItem.starBreakdown.hasSpecificAction ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                        <span>Hành động kỹ thuật (Action)</span>
                      </div>
                      <div className="flex items-center gap-2 rounded-lg bg-zinc-950/70 border border-zinc-800 p-2.5">
                        {evalItem.starBreakdown.hasMeasurableResult ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                        <span>Số liệu đo lường (Result)</span>
                      </div>
                    </div>

                    {/* Nhận xét của HR */}
                    <div className="rounded-xl bg-orange-500/10 border border-orange-500/30 p-3.5 text-xs sm:text-sm text-orange-200">
                      <strong className="text-orange-400">🔥 HR nhận xét: </strong>
                      {evalItem.hrComment}
                    </div>

                    {/* Câu trả lời mẫu 10/10 */}
                    <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 text-xs sm:text-sm text-emerald-100">
                      <div className="font-bold text-emerald-400 mb-1">
                        ✅ Cách trả lời mẫu ăn điểm tuyệt đối (Chuẩn STAR):
                      </div>
                      <p className="leading-relaxed">
                        “{evalItem.sampleBestAnswer}”
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Nút thi lại */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <button
                type="button"
                onClick={handleReturnToLobby}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-3 text-xs sm:text-sm font-bold text-zinc-200 hover:bg-zinc-800 transition cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" /> Thử thách lại lần nữa (Phục thù)
              </button>

              {onExit && (
                <button
                  type="button"
                  onClick={onExit}
                  className="px-5 py-3 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-xs font-semibold text-zinc-400 transition"
                >
                  Thoát phòng phỏng vấn
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
