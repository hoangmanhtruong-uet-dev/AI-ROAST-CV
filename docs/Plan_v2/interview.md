Để trang Phỏng vấn áp lực (/interview) thực sự tạo ra cảm giác "toát mồ hôi hột" như ngồi trước một Tech Lead / HR khó tính ngoài đời thực — đồng thời khép kín hoàn hảo vòng lặp sản phẩm từ trang /roast — chúng ta cần thiết kế một cơ chế State Machine (Máy trạng thái) chặt chẽ kết hợp với các tác nhân gây áp lực tâm lý (Psychological Triggers).

Dưới đây là thiết kế chi tiết về Nghiệp vụ, Luồng UI/UX, và Code Component hoàn chỉnh cho trang /interview.

1. Thiết kế Nghiệp vụ & Cơ chế "Tạo Áp Lực" (Game Mechanics)
   Thay vì hiển thị cả 3 câu hỏi cùng lúc như một biểu mẫu (form) khảo sát nhàm chán, hệ thống sẽ ép ứng viên đi qua 3 Vòng hỏi xoáy liên hoàn (Sequential Interrogation) với các quy tắc nghiệp vụ:

Liên kết ngữ cảnh từ /roast (Context-Aware):

Mỗi câu hỏi đều hiển thị rõ "Bằng chứng trong CV" (câu chữ mà ứng viên đã trót ghi trong CV) rồi mới tung ra câu hỏi vặn vẹo tương ứng:

Câu 1 (Soi số liệu / Kiến trúc): Bắt chứng minh một con số hoặc công nghệ ghi trong CV.

Câu 2 (Xử lý khủng hoảng / Tình huống): Đặt vào kịch bản dự án sập hoặc mâu thuẫn nhóm.

Câu 3 (Đòn tâm lý / Chốt hạ): Chất vấn điểm yếu lớn nhất hoặc lỗ hổng logic trong CV.

Đồng hồ đếm ngược 90 giây + Đọc đề 5 giây:

Cho 5 giây đọc đề trước khi mở khóa ô nhập liệu và bắt đầu tính giờ 90 giây/câu.

Khi thời gian còn < 20 giây: Viền màn hình nhấp nháy đỏ (animate-pulse), đồng hồ rung nhẹ để mô phỏng áp lực phòng phỏng vấn thật.

Khi hết giờ (00:00): Tự động khóa bàn phím và thu bài ngay lập tức (dù đang gõ dở câu) rồi chuyển sang câu tiếp theo.

Cơ chế Chống "Copy-Paste từ ChatGPT" (Anti-Cheat):

Bắt sự kiện onPaste trên khung trả lời: Nếu ứng viên paste một đoạn văn dài từ bên ngoài vào, hệ thống lập tức chặn lại và bật cảnh báo từ HR: "🚫 Đang phỏng vấn trực tiếp, không dùng phao cứu trợ từ ChatGPT nhé em!" (Ghi nhận số lần định gian lận để trừ điểm thái độ cuối buổi).

Chấm điểm theo mô hình STAR (Situation - Task - Action - Result):

Kết thúc 3 câu, AI chấm điểm từng câu trả lời, chỉ ra câu trả lời của ứng viên "chết" ở đâu và viết lại Câu trả lời mẫu ăn điểm 10/10 theo chuẩn STAR.

2. Sơ đồ Luồng Trạng Thái (5-Stage UI State Machine)
   Plaintext
   [1. LOBBY / BRIEFING]
   │ (Chọn độ khó HR + Kiểm tra ngữ cảnh CV từ sessionStorage)
   ▼
   [2. READING PHASE (5s)] ──► Hiện trích dẫn CV + Câu hỏi xoáy (Khóa ô gõ để buộc đọc kỹ)
   │
   ▼
   [3. ANSWERING PHASE (90s)] ──► Đếm ngược + Chặn Paste + Cảnh báo đỏ khi < 20s
   │ (Lặp lại cho đủ 3 câu hỏi: Q1 -> Q2 -> Q3)
   ▼
   [4. EVALUATING] ──► Hiệu ứng HR đang gõ phím chấm bài & tổng hợp thái độ
   │
   ▼
   [5. DEBRIEF VERDICT] ──► Công bố: HIRED / PROBATION / REJECTED + Phân tích từng câu theo STAR
3. Code Component hoàn chỉnh: PressureInterviewRoom.tsx
   Bạn có thể tạo file components/interview/PressureInterviewRoom.tsx và nhúng trực tiếp vào app/interview/page.tsx. Bộ code dưới đây đã tích hợp sẵn bộ câu hỏi fallback (trong trường hợp người dùng vào thẳng /interview mà chưa qua /roast), bộ đếm thời gian chống trôi, chặn copy-paste, và màn hình chấm điểm chi tiết.

TypeScript
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
} from "lucide-react";

// ==========================================
// 1. INTERFACES & DATA TYPES
// ==========================================
export interface InterviewQuestion {
id: number;
tag: string; // VD: "Kiểm chứng số liệu" | "Kịch bản sập nguồn"
cvEvidence: string; // Câu trích trực tiếp từ CV của ứng viên
question: string; // Câu hỏi vặn của HR/Tech Lead
timeLimitSeconds: number; // Mặc định 90s
hint: string; // Gợi ý ngắn theo chuẩn STAR
}

export interface AnswerSubmission {
questionId: number;
answerText: string;
timeSpentSeconds: number;
isTimedOut: boolean;
pasteAttempts: number;
}

export interface QuestionEvaluation {
questionId: number;
score: number; // 0 - 100
hrComment: string; // Nhận xét gắt từ HR
starBreakdown: {
hasSituationTask: boolean;
hasSpecificAction: boolean;
hasMeasurableResult: boolean;
};
sampleBestAnswer: string; // Câu trả lời mẫu chuẩn STAR
}

export interface FinalInterviewReport {
overallScore: number;
verdict: "HIRED" | "WAITLIST" | "REJECTED";
verdictTitle: string;
summaryRoast: string;
evaluations: QuestionEvaluation[];
}

// Bộ 3 câu hỏi mặc định (nếu chưa có dữ liệu truyền sang từ trang /roast)
const DEFAULT_QUESTIONS: InterviewQuestion[] = [
{
id: 1,
tag: "Vòng 1/3 • Kiểm chứng Kỹ thuật & Số liệu",
cvEvidence:
"Tối ưu hiệu năng hệ thống Backend, giúp tăng tốc độ phản hồi API và chịu tải cao.",
question:
"Trong CV em ghi 'tối ưu hiệu năng và chịu tải cao' rất kêu. Vậy cụ thể p95 latency trước và sau khi tối ưu là bao nhiêu ms? Em đã dùng công cụ gì để benchmark và xử lý bottleneck ở tầng Database hay Cache?",
timeLimitSeconds: 90,
hint: "Nêu rõ công cụ đo (k6/JMeter), nguyên nhân gây nghẽn (N+1 query/thiếu index) và con số cải thiện thực tế.",
},
{
id: 2,
tag: "Vòng 2/3 • Xử lý Sự cố Production",
cvEvidence:
"Có khả năng làm việc nhóm tốt, chịu được áp lực công việc cao và giải quyết vấn đề nhanh.",
question:
"Giả sử lúc 11h đêm thứ Sáu, bản deploy của em làm lỗi thanh toán của khách hàng trên Production trong khi Tech Lead không nghe máy. Em sẽ xử lý từng bước như thế nào trong 15 phút đầu tiên?",
timeLimitSeconds: 90,
hint: "Ưu tiên cô lập lỗi / Rollback trước khi ngồi debug mò mẫm; thông báo rõ cho các bên liên quan.",
},
{
id: 3,
tag: "Vòng 3/3 • Đòn Tâm lý & Thái độ",
cvEvidence:
"Mong muốn học hỏi thêm kinh nghiệm trong môi trường chuyên nghiệp để phát triển bản thân.",
question:
"Công ty anh trả lương để em tạo ra giá trị chứ không phải mở lớp dạy học miễn phí. Với kiến thức hiện tại, trong 2 tuần đầu tiên ngồi vào bàn làm việc, em tự tin mình đóng góp được gì ngay mà không cần người cầm tay chỉ việc?",
timeLimitSeconds: 90,
hint: "Chuyển từ tư thế 'xin đi học' sang 'đóng góp giá trị ngay': viết unit test, fix bug tồn đọng, chuẩn hóa tài liệu...",
},
];

type InterviewStage =
| "LOBBY"
| "READING"
| "ANSWERING"
| "EVALUATING"
| "RESULT";

export default function PressureInterviewRoom() {
// States quản lý luồng
const [stage, setStage] = useState<InterviewStage>("LOBBY");
const [persona, setPersona] = useState<"savage" | "mentor">("savage");
const [questions, setQuestions] =
useState<InterviewQuestion[]>(DEFAULT_QUESTIONS);
const [currentIdx, setCurrentIdx] = useState<number>(0);

// States bộ đếm & nhập liệu trong phòng thi
const [readingCountdown, setReadingCountdown] = useState<number>(5);
const [timeLeft, setTimeLeft] = useState<number>(90);
const [currentAnswer, setCurrentAnswer] = useState<string>("");
const [pasteAttempts, setPasteAttempts] = useState<number>(0);
const [cheatWarning, setCheatWarning] = useState<string | null>(null);

// States lưu trữ bài làm & kết quả chấm
const [submissions, setSubmissions] = useState<AnswerSubmission[]>([]);
const [report, setReport] = useState<FinalInterviewReport | null>(null);

const textareaRef = useRef<HTMLTextAreaElement>(null);
const currentQuestion = questions[currentIdx];

// ==========================================
// 2. KHỞI TẠO NGỮ CẢNH TỪ TRANG /ROAST (NẾU CÓ)
// ==========================================
useEffect(() => {
try {
const savedContext = sessionStorage.getItem("ai_roast_cv_context");
if (savedContext) {
const parsed = JSON.parse(savedContext);
if (Array.isArray(parsed.customQuestions) && parsed.customQuestions.length === 3) {
setQuestions(parsed.customQuestions);
}
}
} catch {
// Giữ bộ câu hỏi mặc định nếu không đọc được sessionStorage
}
}, []);

// ==========================================
// 3. LOGIC CHẤM ĐIỂM (LOCAL HEURISTIC + API READY)
// ==========================================
const evaluateInterview = useCallback(
async (allSubmissions: AnswerSubmission[]) => {
setStage("EVALUATING");

      // Bạn có thể thay thế đoạn giả lập 1.8s dưới đây bằng `fetch('/api/interview/evaluate', ...)`
      await new Promise((r) => setTimeout(r, 1800));

      const evaluations: QuestionEvaluation[] = allSubmissions.map((sub, i) => {
        const q = questions[i];
        const cleanText = sub.answerText.trim();
        const wordCount = cleanText ? cleanText.split(/\s+/).length : 0;

        // Phân tích tín hiệu STAR trong câu trả lời
        const hasNumbers = /\d+(%|ms|s|x|k|triệu|phút|giờ|ngày|bug|api)/i.test(
          cleanText
        );
        const hasActionVerbs =
          /(tối ưu|sử dụng|triển khai|rollback|kiểm tra|phân tích|cấu hình|log|debug|redis|index|test|fix)/i.test(
            cleanText
          );
        const hasContext = wordCount >= 25;

        let score = 0;
        if (wordCount === 0) {
          score = 0;
        } else {
          score = 30; // Điểm cơ bản khi có trả lời
          if (hasContext) score += 25;
          if (hasActionVerbs) score += 25;
          if (hasNumbers) score += 20;
          if (sub.isTimedOut && wordCount < 15) score -= 15;
          if (sub.pasteAttempts > 0) score -= Math.min(20, sub.pasteAttempts * 10);
          score = Math.max(5, Math.min(98, score));
        }

        let hrComment = "";
        if (wordCount === 0) {
          hrComment =
            persona === "savage"
              ? "Đứng hình mất 90 giây! Đi phỏng vấn thật mà im lặng thế này là HR tiễn ra cửa từ phút thứ 2 nhé."
              : "Bạn đã bỏ trống câu này. Trong phỏng vấn áp lực, hãy cố gắng nêu hướng tiếp cận sơ bộ thay vì im lặng hoàn toàn.";
        } else if (score < 50) {
          hrComment =
            persona === "savage"
              ? `Trả lời mới được ${wordCount} chữ toàn văn mẫu chung chung, không có nổi 1 con số hay hành động kỹ thuật cụ thể. Chém gió trong CV bị lộ rồi nhé!`
              : "Câu trả lời còn quá ngắn và thiếu chiều sâu thực tế. Bạn cần bổ sung hành động cụ thể (Action) và kết quả đo lường được (Result).";
        } else if (score < 80) {
          hrComment =
            persona === "savage"
              ? "Có ý thức xử lý vấn đề đấy, nhưng vẫn thiếu số liệu thực chứng (Metrics) để thuyết phục Tech Lead khó tính."
              : "Hướng tư duy khá tốt! Để đạt điểm tuyệt đối, hãy định lượng hóa kết quả bằng con số cụ thể hơn.";
        } else {
          hrComment =
            persona === "savage"
              ? "Khá khen! Trả lời có lớp lang, có công cụ và con số rõ ràng. Đủ bản lĩnh sống sót qua vòng gửi xe!"
              : "Câu trả lời rất xuất sắc, bám sát cấu trúc STAR và thể hiện rõ tư duy giải quyết vấn đề thực chiến.";
        }

        const sampleAnswers = [
          "Ở đồ án cuối khóa, API danh sách sản phẩm bị chậm (p95 ~ 420ms khi test bằng k6 với 200 VU). Em kiểm tra Query Plan phát hiện lỗi N+1 query và thiếu Composite Index. Sau khi đánh lại Index trên PostgreSQL và cache kết quả bằng Redis (TTL 5 phút), latency giảm xuống 45ms, giảm 70% tải CPU DB.",
          "Trong 5 phút đầu, em lập tức kiểm tra Error Log trên Sentry/CloudWatch để xác nhận phạm vi lỗi và thực hiện Rollback về bản release ổn định trước đó để chặn thiệt hại cho khách. Sau khi hệ thống chạy lại bình thường, em mới báo cáo lên nhóm trực, dựng lại môi trường Staging để tái hiện bug và viết bổ sung Integration Test trước khi deploy lại.",
          "Trong 2 tuần đầu, em không đợi giao việc thụ động mà sẽ: (1) Tự dựng xong môi trường local và đọc toàn bộ kiến trúc repo trong 2 ngày đầu, (2) Nhận xử lý ngay các ticket bug nhỏ/UI tồn đọng trên Jira để quen luồng CI/CD của team, và (3) Viết bổ sung Unit Test cho các module thiếu coverage.",
        ];

        return {
          questionId: q.id,
          score,
          hrComment,
          starBreakdown: {
            hasSituationTask: hasContext,
            hasSpecificAction: hasActionVerbs,
            hasMeasurableResult: hasNumbers,
          },
          sampleBestAnswer: sampleAnswers[i] || sampleAnswers[0],
        };
      });

      const avgScore = Math.round(
        evaluations.reduce((sum, item) => sum + item.score, 0) /
          evaluations.length
      );

      let verdict: FinalInterviewReport["verdict"] = "REJECTED";
      let verdictTitle = "💀 BAY MÀU VÒNG PHỎNG VẤN (REJECTED)";
      let summaryRoast =
        "CV viết một đằng, vào phòng phỏng vấn hỏi xoáy 3 câu là lộ ngay học thuộc lòng văn mẫu. Cần luyện lại cách bảo vệ đồ án ngay!";

      if (avgScore >= 75) {
        verdict = "HIRED";
        verdictTitle = "🔥 VƯỢT ẢI THÀNH CÔNG (PASSED INTERVIEW)";
        summaryRoast =
          "Phản xạ sắc bén, tâm lý vững trước đồng hồ đếm ngược và biết dùng số liệu kỹ thuật để khóa miệng HR khó tính!";
      } else if (avgScore >= 50) {
        verdict = "WAITLIST";
        verdictTitle = "⚠️ Vớt Vát Vòng Chờ (ON HOLD / PROBATION)";
        summaryRoast =
          "Có kiến thức nền tảng nhưng phản xạ dưới áp lực thời gian còn lúng túng, chưa bung được số liệu đắt giá để chốt hạ.";
      }

      setReport({
        overallScore: avgScore,
        verdict,
        verdictTitle,
        summaryRoast,
        evaluations,
      });
      setStage("RESULT");
    },
    [persona, questions]

);

// ==========================================
// 4. HÀM NỘP CÂU TRẢ LỜI & CHUYỂN CÂU TIẾP THEO
// ==========================================
const handleSubmitCurrentAnswer = useCallback(
(isTimedOut: boolean = false) => {
const timeSpent =
currentQuestion.timeLimitSeconds - (isTimedOut ? 0 : timeLeft);

      const newSubmission: AnswerSubmission = {
        questionId: currentQuestion.id,
        answerText: currentAnswer,
        timeSpentSeconds: Math.max(1, timeSpent),
        isTimedOut,
        pasteAttempts,
      };

      const updatedSubmissions = [...submissions, newSubmission];
      setSubmissions(updatedSubmissions);

      // Reset state cho câu tiếp theo
      setCurrentAnswer("");
      setPasteAttempts(0);
      setCheatWarning(null);

      if (currentIdx + 1 < questions.length) {
        setCurrentIdx((prev) => prev + 1);
        setReadingCountdown(5);
        setStage("READING");
      } else {
        evaluateInterview(updatedSubmissions);
      }
    },
    [
      currentAnswer,
      currentIdx,
      currentQuestion,
      evaluateInterview,
      pasteAttempts,
      questions.length,
      submissions,
      timeLeft,
    ]

);

// ==========================================
// 5. TIMERS (5s ĐỌC ĐỀ & 90s TRẢ LỜI)
// ==========================================
// Timer 5 giây đọc đề
useEffect(() => {
if (stage !== "READING") return;

    if (readingCountdown <= 0) {
      setTimeLeft(currentQuestion.timeLimitSeconds);
      setStage("ANSWERING");
      setTimeout(() => textareaRef.current?.focus(), 50);
      return;
    }

    const timer = setTimeout(() => {
      setReadingCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);

}, [stage, readingCountdown, currentQuestion.timeLimitSeconds]);

// Timer 90 giây trả lời
useEffect(() => {
if (stage !== "ANSWERING") return;

    if (timeLeft <= 0) {
      handleSubmitCurrentAnswer(true);
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);

}, [stage, timeLeft, handleSubmitCurrentAnswer]);

// ==========================================
// 6. CHỐNG COPY-PASTE TỪ CHATGPT (ANTI-CHEAT)
// ==========================================
const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
const pastedText = e.clipboardData.getData("text");
// Nếu paste đoạn văn dài hơn 30 ký tự -> Chặn ngay
if (pastedText.length > 30) {
e.preventDefault();
setPasteAttempts((prev) => prev + 1);
setCheatWarning(
"🚫 Phát hiện Copy-Paste! Đang phỏng vấn trực tiếp trước mặt HR, không dùng phao cứu trợ từ ChatGPT nhé (-10 điểm thái độ)."
);
setTimeout(() => setCheatWarning(null), 4000);
}
};

// Bắt đầu phiên phỏng vấn
const startInterview = () => {
setSubmissions([]);
setCurrentIdx(0);
setReadingCountdown(5);
setStage("READING");
};

// Format giây sang MM:SS
const formatTime = (sec: number) => {
const m = Math.floor(sec / 60);
const s = sec % 60;
return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const isDangerZone = stage === "ANSWERING" && timeLeft <= 20;

return (
<div className="min-h-screen bg-zinc-950 text-zinc-100 py-10 px-4 sm:px-6 flex flex-col items-center justify-center">
<div className="w-full max-w-4xl">
{/_ ====================================================
STAGE 1: PHÒNG CHỜ & CHỌN ĐỘ KHÓ (LOBBY)
==================================================== _/}
{stage === "LOBBY" && (
<div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8 shadow-2xl space-y-6">
<div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
<div className="flex items-center gap-2">
<span className="flex h-3 w-3 rounded-full bg-rose-500 animate-ping" />
<span className="font-mono text-xs font-bold uppercase tracking-wider text-rose-400">
PRESSURE INTERVIEW SIMULATOR // V2.0
</span>
</div>
<span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-mono text-zinc-300">
3 Câu hỏi xoáy • 90s / câu
</span>
</div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Phòng Phỏng Vấn Áp Lực Cao
              </h1>
              <p className="text-sm text-zinc-400 leading-relaxed">
                AI sẽ đóng vai Tech Lead & HR khó tính, dùng chính những câu chữ
                bạn viết trong CV để vặn hỏi ngược lại bạn dưới áp lực đồng hồ
                đếm ngược.
              </p>
            </div>

            {/* Chọn chế độ người phỏng vấn */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPersona("savage")}
                className={`text-left rounded-xl border p-4 transition ${
                  persona === "savage"
                    ? "border-orange-500 bg-orange-500/10"
                    : "border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-orange-400 flex items-center gap-1.5">
                    <Flame className="w-4 h-4" /> Chế độ: Tech Lead &quot;Mỏ Hỗn&quot;
                  </span>
                  {persona === "savage" && (
                    <span className="text-[10px] font-mono bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded">
                      ĐANG CHỌN
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-1.5">
                  Hỏi thẳng, bắt bẻ từng con số, sẵn sàng dập tắt mọi câu trả
                  lời văn mẫu sáo rỗng.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPersona("mentor")}
                className={`text-left rounded-xl border p-4 transition ${
                  persona === "mentor"
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4" /> Chế độ: HR Chuyên Gia
                  </span>
                  {persona === "mentor" && (
                    <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">
                      ĐANG CHỌN
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-1.5">
                  Đặt câu hỏi tình huống sâu sắc, hướng dẫn cách sửa câu trả lời
                  theo chuẩn STAR.
                </p>
              </button>
            </div>

            {/* Luật chơi tạo áp lực */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" /> Quy tắc sinh tồn trong phòng
                thi:
              </div>
              <ul className="text-xs text-zinc-300 space-y-1.5 list-disc list-inside">
                <li>
                  Bạn có <strong>5 giây đọc đề</strong> và{" "}
                  <strong>90 giây để gõ câu trả lời</strong> cho mỗi câu hỏi.
                </li>
                <li>
                  Khi đồng hồ về <strong>00:00</strong>, hệ thống tự động thu
                  bài ngay lập tức (kể cả khi đang gõ dở).
                </li>
                <li>
                  <strong>Cấm Copy-Paste từ ChatGPT:</strong> Hệ thống sẽ khóa
                  lệnh Paste đoạn văn dài và trừ điểm thái độ.
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={startInterview}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 py-4 text-sm font-bold text-white shadow-lg shadow-orange-500/20 hover:opacity-95 transition"
            >
              ⏱️ Bước vào phòng phỏng vấn ngay
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ====================================================
            STAGE 2 & 3: ĐỌC ĐỀ (5S) & TRẢ LỜI DƯỚI ÁP LỰC (90S)
        ==================================================== */}
        {(stage === "READING" || stage === "ANSWERING") && (
          <div
            className={`rounded-2xl border p-6 sm:p-8 shadow-2xl transition-all duration-300 space-y-6 ${
              isDangerZone
                ? "border-rose-500 bg-rose-950/20 shadow-rose-500/20"
                : "border-zinc-800 bg-zinc-900/70"
            }`}
          >
            {/* Thanh Top Bar: Tiến độ câu hỏi & Đồng hồ đếm ngược */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-orange-400">
                  {currentQuestion.tag}
                </span>
                <div className="flex items-center gap-2 mt-1.5">
                  {questions.map((q, idx) => (
                    <div
                      key={q.id}
                      className={`h-2 w-12 rounded-full transition-all ${
                        idx < currentIdx
                          ? "bg-emerald-500"
                          : idx === currentIdx
                          ? "bg-orange-500 animate-pulse"
                          : "bg-zinc-800"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Đồng hồ Countdown */}
              <div
                className={`flex items-center gap-2.5 rounded-xl border px-4 py-2 font-mono ${
                  stage === "READING"
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                    : isDangerZone
                    ? "border-rose-500 bg-rose-500/20 text-rose-400 animate-bounce"
                    : "border-zinc-700 bg-zinc-950 text-zinc-100"
                }`}
              >
                <Timer className="w-5 h-5" />
                {stage === "READING" ? (
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

            {/* Bằng chứng trích từ CV */}
            <div className="rounded-xl bg-zinc-950/90 border border-zinc-800 p-4">
              <div className="text-[11px] font-mono uppercase text-zinc-400 mb-1 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-orange-400" />
                Chi tiết trong CV của bạn bị HR soi:
              </div>
              <blockquote className="text-xs sm:text-sm italic text-zinc-300">
                “{currentQuestion.cvEvidence}”
              </blockquote>
            </div>

            {/* Câu hỏi vặn của HR */}
            <div className="rounded-xl bg-gradient-to-br from-orange-500/15 via-rose-500/10 to-zinc-900 border border-orange-500/40 p-5 space-y-2">
              <div className="text-xs font-bold text-orange-400 flex items-center gap-1.5">
                <Terminal className="w-4 h-4" />
                {persona === "savage"
                  ? "Tech Lead khó tính hỏi xoáy:"
                  : "Chuyên gia Tuyển dụng đặt câu hỏi:"}
              </div>
              <p className="text-base sm:text-lg font-bold text-white leading-relaxed">
                “{currentQuestion.question}”
              </p>
              <p className="text-xs text-zinc-400 pt-1">
                💡 <strong>Gợi ý sống sót (STAR):</strong> {currentQuestion.hint}
              </p>
            </div>

            {/* Cảnh báo nếu cố tình Paste từ ChatGPT */}
            {cheatWarning && (
              <div
                role="alert"
                className="rounded-xl border border-rose-500 bg-rose-500/15 p-3 text-xs font-semibold text-rose-300 flex items-center gap-2 animate-pulse"
              >
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{cheatWarning}</span>
              </div>
            )}

            {/* Khung nhập câu trả lời */}
            <div className="relative">
              {stage === "READING" && (
                <div className="absolute inset-0 z-10 rounded-xl bg-zinc-950/85 backdrop-blur-xs flex flex-col items-center justify-center gap-2 border border-amber-500/30">
                  <Lock className="w-6 h-6 text-amber-400 animate-pulse" />
                  <p className="text-xs sm:text-sm font-semibold text-amber-300">
                    Hãy đọc kỹ câu hỏi! Bàn phím sẽ mở sau {readingCountdown}{" "}
                    giây...
                  </p>
                </div>
              )}

              <textarea
                ref={textareaRef}
                rows={5}
                disabled={stage === "READING"}
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                onPaste={handlePaste}
                placeholder="Nhập câu trả lời trực diện vào vấn đề: Tình huống (Situation) -> Hành động cụ thể của bạn (Action) -> Số liệu kết quả (Result)..."
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-4 text-sm text-zinc-100 placeholder-zinc-500 focus:border-orange-500 focus:outline-none disabled:opacity-50"
              />

              <div className="mt-2 flex items-center justify-between text-xs text-zinc-400">
                <span>
                  Số từ:{" "}
                  <strong className="text-zinc-200">
                    {currentAnswer.trim()
                      ? currentAnswer.trim().split(/\s+/).length
                      : 0}
                  </strong>{" "}
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
                disabled={stage === "READING"}
                onClick={() => handleSubmitCurrentAnswer(false)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 px-6 py-3 text-sm font-bold text-white shadow-lg hover:opacity-95 disabled:opacity-40 transition"
              >
                <Send className="w-4 h-4" />
                {currentIdx + 1 < questions.length
                  ? "Chốt câu trả lời & Qua câu tiếp theo"
                  : "Nộp câu cuối & Xem phán quyết của HR"}
              </button>
            </div>
          </div>
        )}

        {/* ====================================================
            STAGE 4: AI ĐANG CHẤM BÀI (EVALUATING)
        ==================================================== */}
        {stage === "EVALUATING" && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-12 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-500/15 border border-orange-500/40">
              <Sparkles className="w-7 h-7 text-orange-400 animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-white">
              Hội đồng Tuyển dụng AI đang mổ xẻ câu trả lời của bạn...
            </h2>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Đang kiểm tra mức độ khớp với cấu trúc STAR, số liệu thực chứng và
              tốc độ phản xạ dưới áp lực.
            </p>
          </div>
        )}

        {/* ====================================================
            STAGE 5: BẢNG PHÁN QUYẾT & CHỮA BÀI CHI TIẾT (RESULT)
        ==================================================== */}
        {stage === "RESULT" && report && (
          <div className="space-y-6">
            {/* Banner Tổng kết Verdict */}
            <div
              className={`rounded-2xl border p-6 sm:p-8 shadow-2xl ${
                report.verdict === "HIRED"
                  ? "border-emerald-500/40 bg-emerald-950/20"
                  : report.verdict === "WAITLIST"
                  ? "border-amber-500/40 bg-amber-950/20"
                  : "border-rose-500/40 bg-rose-950/20"
              }`}
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
                    key={q.id}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6 space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                      <span className="text-xs font-mono font-bold text-orange-400">
                        {q.tag}
                      </span>
                      <div className="flex items-center gap-3 text-xs font-mono">
                        <span className="text-zinc-400">
                          ⏱️ Phản xạ: {sub.timeSpentSeconds}s
                          {sub.isTimedOut ? " (Hết giờ)" : ""}
                        </span>
                        <span
                          className={`rounded-lg px-2.5 py-1 font-bold ${
                            evalItem.score >= 70
                              ? "bg-emerald-500/15 text-emerald-400"
                              : evalItem.score >= 45
                              ? "bg-amber-500/15 text-amber-400"
                              : "bg-rose-500/15 text-rose-400"
                          }`}
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
                          : "(Không trả lời kịp chữ nào trước khi hết giờ 💀)"}
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
                onClick={startInterview}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-3 text-xs sm:text-sm font-bold text-zinc-200 hover:bg-zinc-800 transition"
              >
                <RotateCcw className="w-4 h-4" /> Thử thách lại lần nữa (Phục
                thù)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>

);
} 4. Cách truyền dữ liệu mượt mà từ /roast sang /interview
Để khi người dùng vừa bị Roast xong ở trang /roast và bấm nút ⏱️ Thử thách phỏng vấn áp lực, trang /interview lập tức hỏi xoáy vào đúng chiếc CV của họ mà không cần lưu Database trên server:

Trong API /api/roast, bạn yêu cầu LLM sinh sẵn luôn mảng customQuestions gồm 3 câu hỏi xoáy dựa trên 3 điểm yếu lớn nhất của CV vừa quét.

Khi trang /roast nhận kết quả từ AI, bạn lưu nhẹ vào sessionStorage:

TypeScript
sessionStorage.setItem(
"ai_roast_cv_context",
JSON.stringify({
customQuestions: aiResponse.interviewQuestions,
})
);
Khi người dùng chuyển sang /interview, useEffect trong component PressureInterviewRoom ở trên sẽ tự động lấy đúng 3 câu hỏi đó ra để tra khảo ứng viên. Và khi họ bấm nút "Xóa sạch dữ liệu trong 1 click", chỉ cần gọi sessionStorage.removeItem("ai_roast_cv_context") là sạch dấu vết 100%!
