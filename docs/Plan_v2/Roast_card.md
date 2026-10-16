Để biến tính năng "Roast Card (Thẻ Nhân Phẩm CV)" thành một động cơ tăng trưởng tự nhiên (Viral Loop) trên Threads, Facebook Story và TikTok, nguyên tắc cốt lõi là: Tôn trọng cam kết "100% Client-Side Privacy" của web (không gửi dữ liệu lên server để render ảnh) + Tối ưu cảm xúc hài hước nhưng không làm lộ thông tin nhạy cảm của ứng viên.

Dưới đây là thiết kế chi tiết luồng trải nghiệm (UX Flow), giải pháp kỹ thuật và trọn bộ code Component cho Next.js (App Router) + Tailwind CSS.

1. Thiết kế Luồng UI/UX (Viral User Flow)
   Thay vì chỉ đặt một nút "Chia sẻ" chung chung ở cuối trang, hãy đặt nút kích hoạt ngay tại điểm cảm xúc của người dùng lên cao nhất (khi đọc câu bị AI "cà khịa" đau nhất):

Điểm kích hoạt (Trigger Point):

Trên màn hình kết quả /roast, ở mỗi thẻ lỗi CV hoặc ở bảng Tổng kết điểm ATS, thêm nút bấm nổi bật: 📸 Xuất ảnh "Bia Đỡ Đạn" (hoặc 🔥 Flex độ phũ của AI).

Cửa sổ Tùy chỉnh nhanh (Instant Preview Modal):

Khi bấm vào, một Modal hiện lên với bản xem trước của chiếc thẻ (Card Preview) theo thời gian thực.

3 Tùy chọn cá nhân hóa (tăng tỷ lệ dám chia sẻ):

Tỷ lệ khung hình: 1:1 (Vuông - Chuẩn Threads / FB Feed) hoặc 9:16 (Dọc - Chuẩn TikTok / IG & FB Story).

Chế độ Ẩn danh (Mặc định BẬT): Tự động đổi tên thật thành biệt danh hài hước (VD: "Chiến thần nộp CV", "Thực tập sinh hệ tâm linh", "Fresher bất tử"). Điều này cực kỳ quan trọng vì sinh viên rất ngại lộ tên thật kèm điểm CV thấp trước mặt bạn bè hay HR tương lai.

Chọn "Vết thương" muốn khoe: Cho phép bấm mũi tên qua lại giữa các câu Roast đắt giá nhất trong CV.

Hành động Chia sẻ (1-Click Action):

Trên Desktop: Nút "Copy ảnh vào Clipboard" (Bấm 1 phát
→ Mở tab Threads bấm Ctrl + V là đăng được ngay, nhanh hơn tải file về máy gấp 3 lần) + Nút "Tải ảnh PNG".

Trên Mobile: Gọi trực tiếp navigator.share (Native Web Share API) để đẩy thẳng ảnh sang app Threads, Instagram, Zalo hoặc TikTok.

2. Giải pháp Kỹ thuật: Tại sao chọn html-to-image ở Client?
   Với Next.js, có 2 cách tạo ảnh phổ biến là @vercel/og (Server-side) và html-to-image (Client-side). Đối với AI Roast CV, html-to-image là lựa chọn tối ưu tuyệt đối vì:

Giữ vững cam kết Bảo mật: Không phải đẩy câu chữ trong CV hay tên ứng viên qua URL params lên Edge Server để render ảnh. Mọi thứ diễn ra 100% trong RAM trình duyệt của người dùng.

Đồng bộ 100% CSS với trang chủ: Hỗ trợ đầy đủ Gradient, Glassmorphism, Box-shadow và Font tiếng Việt có dấu đã load sẵn trên trang mà không cần cấu hình lại font .ttf phức tạp như Satori (next/og).

Cài đặt thư viện
Chạy lệnh sau trong project của bạn:

Bash
npm install html-to-image lucide-react 3. Code Component hoàn chỉnh: RoastShareModal.tsx
Bạn có thể tạo file components/roast/RoastShareModal.tsx và nhúng trực tiếp vào trang /roast. Component này đã bao gồm cả giao diện thẻ bài Cyberpunk/Dark-mode đồng bộ với trang chủ, nút chuyển đổi 1:1 / 9:16, chế độ ẩn danh và tính năng Copy trực tiếp vào Clipboard.

TypeScript
"use client";

import React, { useRef, useState, useCallback } from "react";
import { toPng, toBlob } from "html-to-image";
import {
Download,
Copy,
Check,
Share2,
EyeOff,
Eye,
Sparkles,
Flame,
ShieldAlert,
X,
Smartphone,
Square,
} from "lucide-react";

// Định nghĩa kiểu dữ liệu truyền từ kết quả Roast CV vào
export interface RoastShareData {
candidateName: string;
targetRole: string;
atsScore: number;
metrics: {
impact: number;
keywords: number;
zeroCliche: number;
};
roastItem: {
category: string; // VD: "Văn mẫu đa cấp" | "Thánh Fork Code"
badgeWarning: string; // VD: "HR đóng tab sau 2s"
originalQuote: string; // Câu gốc trong CV của ứng viên
aiRoastText: string; // Câu cà khịa của AI
pointDeduction: string; // VD: "-50 điểm ATS"
};
}

interface RoastShareModalProps {
isOpen: boolean;
onClose: () => void;
data: RoastShareData;
}

const FUNNY_ALIASES = [
"Chiến Thần Rải CV",
"Fresher Hệ Tâm Linh",
"Thực Tập Sinh Bất Tử",
"Chủ Tịch Giả Danh",
"Kẻ Hủy Diệt Vòng Gửi Xe",
];

export default function RoastShareModal({
isOpen,
onClose,
data,
}: RoastShareModalProps) {
const cardRef = useRef<HTMLDivElement>(null);

// States điều khiển tuỳ chỉnh thẻ
const [isAnonymous, setIsAnonymous] = useState(true);
const [aliasIndex, setAliasIndex] = useState(0);
const [aspectRatio, setAspectRatio] = useState<"square" | "story">("square");

// States trạng thái xuất ảnh
const [isGenerating, setIsGenerating] = useState(false);
const [copied, setCopied] = useState(false);
const [captionCopied, setCaptionCopied] = useState(false);

if (!isOpen) return null;

const displayName = isAnonymous
? FUNNY_ALIASES[aliasIndex]
: data.candidateName || "Ứng viên Fresher";

// Đổi biệt danh ngẫu nhiên khi bật ẩn danh
const cycleAlias = () => {
setAliasIndex((prev) => (prev + 1) % FUNNY_ALIASES.length);
};

// Lấy màu sắc theo mức điểm ATS
const getScoreColor = (score: number) => {
if (score >= 75) return "text-emerald-400 border-emerald-500/40 bg-emerald-500/10";
if (score >= 50) return "text-amber-400 border-amber-500/40 bg-amber-500/10";
return "text-rose-500 border-rose-500/40 bg-rose-500/10";
};

// 1. Hàm Tải ảnh PNG chất lượng cao (Retina 2x-3x)
const handleDownloadImage = useCallback(async () => {
if (!cardRef.current) return;
try {
setIsGenerating(true);
const dataUrl = await toPng(cardRef.current, {
cacheBust: true,
pixelRatio: 3, // Nét căng khi up lên Threads/Story
backgroundColor: "#09090b",
});

      const link = document.createElement("a");
      link.download = `ai-roast-cv-${data.atsScore}pts.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Lỗi khi xuất ảnh Roast Card:", err);
      alert("Không thể tạo ảnh lúc này, vui lòng thử lại!");
    } finally {
      setIsGenerating(false);
    }

}, [data.atsScore]);

// 2. Hàm Copy thẳng ảnh vào Clipboard (Dán trực tiếp lên Threads/FB)
const handleCopyImageToClipboard = useCallback(async () => {
if (!cardRef.current) return;
try {
setIsGenerating(true);
const blob = await toBlob(cardRef.current, {
cacheBust: true,
pixelRatio: 2.5,
backgroundColor: "#09090b",
});

      if (!blob) throw new Error("Blob generation failed");

      // Nếu trên Mobile có hỗ trợ Web Share API cho file
      if (
        navigator.canShare &&
        navigator.canShare({
          files: [new File([blob], "roast-cv.png", { type: "image/png" })],
        })
      ) {
        const file = new File([blob], "ai-roast-cv.png", { type: "image/png" });
        await navigator.share({
          title: "AI Roast CV — Mổ xẻ CV không kiêng nể",
          text: `CV mình vừa bị AI Roast còn ${data.atsScore}/100 điểm 😭 Thử độ cứng CV của bạn tại https://ai-roast-cv.vercel.app`,
          files: [file],
        });
        return;
      }

      // Trên Desktop: Ghi thẳng vào Clipboard
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Lỗi copy ảnh:", err);
      // Fallback sang tải ảnh nếu trình duyệt chặn ClipboardItem
      handleDownloadImage();
    } finally {
      setIsGenerating(false);
    }

}, [data.atsScore, handleDownloadImage]);

// 3. Copy Caption mẫu để đăng Threads câu tương tác
const handleCopyViralCaption = () => {
const caption = `Vừa đưa CV cho con AI "Mỏ Hỗn" chấm thử, kết quả còn đúng ${data.atsScore}/100 điểm ATS 💀\n\nNó chê câu "${data.roastItem.originalQuote}" của mình là: "${data.roastItem.aiRoastText}" 😭\n\nAnh em sinh viên năm cuối vào test nhân phẩm CV miễn phí ở đây nhé: https://ai-roast-cv.vercel.app`;
navigator.clipboard.writeText(caption);
setCaptionCopied(true);
setTimeout(() => setCaptionCopied(false), 2500);
};

return (
<div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Xuất ảnh Roast Card chia sẻ mạng xã hội"
    >
<div className="relative w-full max-w-4xl rounded-2xl border border-zinc-800 bg-zinc-950 p-5 md:p-6 shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-6 my-auto">
{/_ Nút đóng Modal _/}
<button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
          aria-label="Đóng cửa sổ"
        >
<X className="w-5 h-5" />
</button>

        {/* CỘT TRÁI: VÙNG PREVIEW THẺ SẼ ĐƯỢC CHỤP ẢNH */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center bg-zinc-900/50 rounded-xl p-4 border border-zinc-800/60 overflow-hidden">
          <div className="text-xs text-zinc-400 mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            <span>Bản xem trước ảnh xuất ra (100% xử lý trên thiết bị của bạn)</span>
          </div>

          {/* ================= VÙNG DOM ĐƯỢC CHỤP (cardRef) ================= */}
          <div
            ref={cardRef}
            className={`relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 text-white shadow-2xl transition-all duration-300 flex flex-col justify-between ${
              aspectRatio === "square"
                ? "w-[360px] sm:w-[400px] min-h-[400px] p-6"
                : "w-[320px] sm:w-[340px] min-h-[580px] p-6 py-8"
            }`}
          >
            {/* Background Glow trang trí kiểu Cyberpunk */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-orange-600/20 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-rose-600/15 blur-3xl"
            />

            {/* 1. Header của Card */}
            <div>
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-orange-500 animate-pulse" />
                  <span className="font-mono text-[11px] font-bold tracking-wider text-orange-400 uppercase">
                    MỎ HỖN ROAST // V2.0
                  </span>
                </div>
                <span className="rounded bg-zinc-900 border border-zinc-700/70 px-2 py-0.5 font-mono text-[10px] text-zinc-300">
                  AI SCANNED
                </span>
              </div>

              {/* 2. Thông tin Ứng viên & Điểm ATS */}
              <div className="mt-4 flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-zinc-400">👤 Hồ sơ:</span>
                    <h3 className="font-bold text-sm sm:text-base text-zinc-100 truncate max-w-[170px]">
                      {displayName}
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5 truncate max-w-[200px]">
                    {data.targetRole || "Ứng viên Fresher / Sinh viên"}
                  </p>
                </div>

                <div
                  className={`flex flex-col items-end rounded-xl border px-3 py-1.5 ${getScoreColor(
                    data.atsScore
                  )}`}
                >
                  <span className="text-[10px] font-mono uppercase opacity-80">
                    Điểm sống sót
                  </span>
                  <span className="text-lg font-extrabold font-mono leading-tight">
                    ATS: {data.atsScore}/100
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Nội dung chính: Câu viết trong CV & Lời phán của AI */}
            <div className="my-4 space-y-3 relative z-10">
              {/* Tags phân loại */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-rose-500/15 border border-rose-500/30 px-2.5 py-0.5 text-[11px] font-medium text-rose-300">
                  {data.roastItem.category}
                </span>
                <span className="rounded-md bg-zinc-900 border border-zinc-800 px-2.5 py-0.5 text-[11px] text-zinc-400">
                  ⚠️ {data.roastItem.badgeWarning}
                </span>
              </div>

              {/* Trích dẫn câu gốc trong CV */}
              <div className="rounded-xl bg-zinc-900/90 border border-zinc-800 p-3.5">
                <div className="text-[11px] text-zinc-400 mb-1 font-medium">
                  Viết trong CV:
                </div>
                <blockquote className="text-xs sm:text-sm italic text-zinc-200 line-clamp-3">
                  “{data.roastItem.originalQuote}”
                </blockquote>
              </div>

              {/* Khối AI Roast nổi bật */}
              <div className="rounded-xl bg-gradient-to-br from-orange-500/15 via-rose-500/10 to-zinc-900 border border-orange-500/40 p-3.5 shadow-inner">
                <div className="flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1 text-xs font-bold text-orange-400">
                    <Flame className="w-3.5 h-3.5 fill-orange-400" /> AI Roast:
                  </span>
                  <span className="font-mono text-[11px] font-semibold text-rose-400">
                    {data.roastItem.pointDeduction}
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-medium text-zinc-100 leading-relaxed">
                  {data.roastItem.aiRoastText}
                </p>
              </div>
            </div>

            {/* 4. Ba chỉ số Mini Metrics & Watermark thương hiệu */}
            <div className="relative z-10">
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="rounded-lg bg-zinc-900/80 border border-zinc-800/80 p-2 text-center">
                  <div className="text-[10px] text-zinc-400">Impact</div>
                  <div className="font-mono text-xs font-bold text-zinc-100">
                    {data.metrics.impact}%
                  </div>
                </div>
                <div className="rounded-lg bg-zinc-900/80 border border-zinc-800/80 p-2 text-center">
                  <div className="text-[10px] text-zinc-400">ATS Keywords</div>
                  <div className="font-mono text-xs font-bold text-zinc-100">
                    {data.metrics.keywords}%
                  </div>
                </div>
                <div className="rounded-lg bg-zinc-900/80 border border-zinc-800/80 p-2 text-center">
                  <div className="text-[10px] text-zinc-400">Zero Cliché</div>
                  <div className="font-mono text-xs font-bold text-zinc-100">
                    {data.metrics.zeroCliche}%
                  </div>
                </div>
              </div>

              {/* Footer Watermark kéo Traffic về Web */}
              <div className="flex items-center justify-between border-t border-zinc-800/80 pt-3 text-[10px] font-mono text-zinc-400">
                <span className="text-zinc-300 font-semibold">
                  🔥 ai-roast-cv.vercel.app
                </span>
                <span>100% CLIENT VERIFIED</span>
              </div>
            </div>
          </div>
          {/* ================= KẾT THÚC VÙNG CHỤP ================= */}
        </div>

        {/* CỘT PHẢI: BẢNG ĐIỀU KHIỂN CÁ NHÂN HÓA & CHIA SẺ */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-5">
          <div className="space-y-5">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 px-3 py-1 text-xs font-semibold text-orange-400">
                <Flame className="w-3.5 h-3.5" /> Chứng nhận vượt ải AI
              </span>
              <h2 className="mt-2 text-xl font-bold text-white">
                Tạo thẻ &quot;Roast Card&quot;
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Khoe độ phũ của AI lên Threads hoặc Story mà không lo lộ thông
                tin cá nhân trong CV.
              </p>
            </div>

            {/* Tùy chọn 1: Khung hình */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                1. Chọn kích thước đăng bài
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setAspectRatio("square")}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-medium transition ${
                    aspectRatio === "square"
                      ? "border-orange-500 bg-orange-500/10 text-orange-300"
                      : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
                  }`}
                >
                  <Square className="w-4 h-4" />
                  Vuông 1:1 (Threads/FB)
                </button>
                <button
                  type="button"
                  onClick={() => setAspectRatio("story")}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-medium transition ${
                    aspectRatio === "story"
                      ? "border-orange-500 bg-orange-500/10 text-orange-300"
                      : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  Dọc 9:16 (Story/TikTok)
                </button>
              </div>
            </div>

            {/* Tùy chọn 2: Chế độ ẩn danh */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                2. Chế độ bảo vệ danh tính
              </label>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isAnonymous ? (
                      <EyeOff className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-amber-400" />
                    )}
                    <span className="text-xs font-medium text-zinc-200">
                      {isAnonymous ? "Đang dùng Biệt danh ẩn danh" : "Hiển thị tên thật"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAnonymous(!isAnonymous)}
                    className="rounded-lg bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-200 hover:bg-zinc-700 transition"
                  >
                    {isAnonymous ? "Hiện tên thật" : "Bật ẩn danh"}
                  </button>
                </div>

                {isAnonymous && (
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
                    <span className="text-xs text-zinc-400 truncate">
                      Biệt danh:{" "}
                      <strong className="text-orange-300">{displayName}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={cycleAlias}
                      className="text-xs text-orange-400 hover:underline font-medium"
                    >
                      🎲 Đổi biệt danh khác
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Tùy chọn 3: Copy Caption câu tương tác */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  3. Caption mẫu đăng Threads
                </label>
                <button
                  type="button"
                  onClick={handleCopyViralCaption}
                  className="text-xs font-medium text-orange-400 hover:text-orange-300 flex items-center gap-1"
                >
                  {captionCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Đã copy
                      caption!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy văn mẫu
                    </>
                  )}
                </button>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-xs text-zinc-400 italic line-clamp-3">
                &quot;Vừa đưa CV cho con AI Mỏ Hỗn chấm thử, kết quả còn đúng{" "}
                {data.atsScore}/100 điểm ATS 💀 Nó chê câu của mình là...&quot;
              </div>
            </div>
          </div>

          {/* Cụm nút CTA Xuất ảnh */}
          <div className="space-y-2.5 pt-3 border-t border-zinc-800">
            <button
              type="button"
              disabled={isGenerating}
              onClick={handleCopyImageToClipboard}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 hover:opacity-95 disabled:opacity-50 transition"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" /> Đã Copy ảnh! Bấm Ctrl+V lên
                  Threads ngay
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  {isGenerating
                    ? "Đang kết xuất ảnh nét cao..."
                    : "Copy ảnh / Chia sẻ ngay (Khuyên dùng)"}
                </>
              )}
            </button>

            <button
              type="button"
              disabled={isGenerating}
              onClick={handleDownloadImage}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 disabled:opacity-50 transition"
            >
              <Download className="w-4 h-4" /> Tải file ảnh PNG về máy
            </button>

            <p className="text-[11px] text-center text-zinc-500 flex items-center justify-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-emerald-500" />
              Ảnh được tạo trực tiếp trên trình duyệt, không lưu trên máy chủ.
            </p>
          </div>
        </div>
      </div>
    </div>

);
} 4. Cách tích hợp vào trang /roast
Tại trang hiển thị kết quả Roast CV (app/roast/page.tsx), bạn chỉ cần quản lý một state selectedRoastForShare và truyền dữ liệu của thẻ lỗi mà người dùng muốn khoe vào Modal:

TypeScript
"use client";

import { useState } from "react";
import RoastShareModal, { RoastShareData } from "@/components/roast/RoastShareModal";

export default function RoastResultDemo() {
const [isShareOpen, setIsShareOpen] = useState(false);

// Dữ liệu lấy từ state kết quả trả về của AI trên trang /roast
const sampleShareData: RoastShareData = {
candidateName: "Nguyễn Văn A",
targetRole: "Fresher Frontend Developer",
atsScore: 42,
metrics: {
impact: 35,
keywords: 60,
zeroCliche: 30,
},
roastItem: {
category: "Thánh Fork Code",
badgeWarning: "HR đóng tab sau 2s",
originalQuote:
"Kỹ năng lập trình: Từng clone repo Github 10k stars của người khác và chạy npm install thành công.",
aiRoastText:
"Fork mã nguồn của người khác về rồi sửa tên author không biến bạn thành Fullstack Developer được đâu em ơi!",
pointDeduction: "-75 điểm ATS",
},
};

return (
<div className="p-6">
{/_ Nút đặt cạnh kết quả Roast _/}
<button
onClick={() => setIsShareOpen(true)}
className="inline-flex items-center gap-2 rounded-xl bg-orange-500/15 border border-orange-500/40 px-4 py-2 text-sm font-semibold text-orange-400 hover:bg-orange-500/25 transition" >
📸 Xuất ảnh &quot;Bia Đỡ Đạn&quot; khoe Threads
</button>

      <RoastShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        data={sampleShareData}
      />
    </div>

);
} 5. 3 Mẹo tối ưu "Độ Viral" trong Nghiệp vụ Share Card
Tự động gắn hạng danh hiệu (Rank Badge) theo điểm ATS:

Điểm < 40: "Huyền Thoại Rải Truyền Đơn" (Màu Đỏ)

Điểm 40 - 70: "Chiến Binh Vượt Vòng Gửi Xe" (Màu Vàng)

Điểm > 70: "Con Nhà Người Ta Hệ ATS" (Màu Xanh Ngọc)

Tác dụng: Kích thích tâm lý sưu tầm danh hiệu hoặc cố sửa CV để thoát khỏi danh hiệu "Rải truyền đơn".

Xử lý lỗi Font trên trình duyệt Safari (iOS):

Trên iPhone (Safari), đôi khi html-to-image lần đầu gọi sẽ bị thiếu font web do Safari chặn cache font ngoại lai. Mẹo khắc phục triệt để là gọi hàm toPng(cardRef.current) nháp 1 lần (warm-up) trước khi xuất file thật khoảng 100ms, hoặc nhúng font Inter/JetBrains Mono trực tiếp qua thẻ <style> nội bộ.

Nút "Gửi vào CV Hall of Shame trang chủ" (Opt-in):

Ngay trong Modal chia sẻ, bạn có thể thêm một nút checkbox nhỏ: "Cho phép đưa câu Roast ẩn danh này lên bảng vàng CV Hall of Shame ở trang chủ". Nhờ vậy, khu vực Marquee ở trang chủ của bạn sẽ liên tục có thêm nội dung thực tế cực mặn từ người dùng thật mà bạn không phải tự nghĩ thêm.
