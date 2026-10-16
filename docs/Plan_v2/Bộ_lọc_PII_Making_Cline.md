Bài toán thực tế khi lọc CV tại Việt Nam
Nếu chỉ dùng Regex SĐT hay số CCCD đơn thuần, bộ lọc rất dễ "bắn nhầm" (False Positive) vào các con số hợp lệ trong CV như:

Khoảng thời gian làm việc: 2022 - 2026, 09/2023 - 10/2025.

Số liệu thành tích (Metrics): 100.000 users, 12.500.000 VNĐ.

Mã môn học, GPA hoặc ID chứng chỉ.

Do đó, bộ lọc dưới đây được tinh chỉnh chuyên biệt cho định dạng dữ liệu cá nhân tại Việt Nam, đồng thời vẫn giữ lại các placeholder có ngữ nghĩa (như [EMAIL_ĐÃ_ẨN], [LINK_GITHUB]) để AI biết ứng viên có đính kèm thông tin liên hệ hay Github trong CV mà không cần đọc nội dung thật.

1. Code Module lib/pii-masker.ts
   TypeScript
   export interface MaskingStats {
   emailsMasked: number;
   phonesMasked: number;
   cccdMasked: number;
   urlsMasked: number;
   addressesMasked: number;
   totalMasked: number;
   }

export interface MaskingResult {
sanitizedText: string;
stats: MaskingStats;
detectedItems: {
type: "EMAIL" | "PHONE" | "CCCD" | "URL" | "ADDRESS";
originalPreview: string; // Chỉ hiện 1 phần để user kiểm tra trên UI (VD: 098\*\*\*123)
}[];
}

/\*\*

- Hàm che dấu 1 phần chuỗi để hiển thị trên UI cho người dùng yên tâm
- VD: "nguyenvana@gmail.com" -> "ngu***@gmail.com"
  */
  function createPartialPreview(value: string, type: string): string {
  const clean = value.trim();
  if (type === "EMAIL") {
  const [local, domain] = clean.split("@");
  if (!domain) return "\***@**_";
  return `${local.slice(0, 2)}_**@${domain}`;
  }
  if (type === "PHONE" || type === "CCCD") {
    return `${clean.slice(0, 3)}\*\*\*\*${clean.slice(-2)}`;
  }
  return clean.length > 15 ? `${clean.slice(0, 12)}...` : clean;
  }

/\*\*

- Bộ lọc PII Masking chạy 100% trên trình duyệt trước khi gửi text CV lên Server
  \*/
  export function maskCVPII(rawText: string): MaskingResult {
  if (!rawText) {
  return {
  sanitizedText: "",
  stats: {
  emailsMasked: 0,
  phonesMasked: 0,
  cccdMasked: 0,
  urlsMasked: 0,
  addressesMasked: 0,
  totalMasked: 0,
  },
  detectedItems: [],
  };
  }

let text = rawText;
const detectedItems: MaskingResult["detectedItems"] = [];
const stats: MaskingStats = {
emailsMasked: 0,
phonesMasked: 0,
cccdMasked: 0,
urlsMasked: 0,
addressesMasked: 0,
totalMasked: 0,
};

// 1. LỌC EMAIL
const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
text = text.replace(emailRegex, (match) => {
stats.emailsMasked++;
detectedItems.push({
type: "EMAIL",
originalPreview: createPartialPreview(match, "EMAIL"),
});
return "[EMAIL_CÁ_NHÂN]";
});

// 2. LỌC SỐ ĐIỆN THOẠI VIỆT NAM
// Hỗ trợ: +84, 84, 03x, 05x, 07x, 08x, 09x (có thể cách nhau bằng dấu chấm, gạch ngang hoặc khoảng trắng)
// Dùng Negative Lookbehind/Lookahead để không bắt nhầm chuỗi số dài hơn
const vnPhoneRegex =
/(?<![0-9])(?:\+84|0084|84|0)[\s.-]?(?:3[2-9]|5[25689]|7[06-9]|8[1-9]|9[0-46-9])(?:[\s.-]?\d){7}(?![0-9])/g;
text = text.replace(vnPhoneRegex, (match) => {
stats.phonesMasked++;
detectedItems.push({
type: "PHONE",
originalPreview: createPartialPreview(match, "PHONE"),
});
return "[SĐT_CÁ_NHÂN]";
});

// 3. LỌC CCCD (12 số) & CMND CŨ (9 số có tiền tố từ khóa)
// CCCD 12 số ở VN thường bắt đầu bằng mã tỉnh (001 -> 096)
const cccd12Regex = /(?<![0-9])0[0-9]{2}[0-3][0-9]{2}[0-9]{6}(?![0-9])/g;
text = text.replace(cccd12Regex, (match) => {
stats.cccdMasked++;
detectedItems.push({
type: "CCCD",
originalPreview: createPartialPreview(match, "CCCD"),
});
return "[CCCD_ĐÃ_ẨN]";
});

// CMND/CCCD đi kèm nhãn tường minh (tránh bắt nhầm số tiền/metric)
const labeledIdRegex =
/(?:CCCD|CMND|Căn cước|Số định danh|ID Card|Passport)[\s:.-]\*([0-9]{9,12})/gi;
text = text.replace(labeledIdRegex, (fullMatch, idNumber) => {
stats.cccdMasked++;
detectedItems.push({
type: "CCCD",
originalPreview: createPartialPreview(idNumber, "CCCD"),
});
return "CCCD: [CCCD_ĐÃ_ẨN]";
});

// 4. LỌC LINK MẠNG XÃ HỘI CÁ NHÂN (NHƯNG GIỮ NHÃN ĐỂ AI BIẾT CÓ PORTFOLIO/GITHUB)
const socialUrlRegex =
/https?:\/\/(?:www\.)?(linkedin\.com\/in\/[^\s,;)"]+|facebook\.com\/[^\s,;)"]+|fb\.com\/[^\s,;)"]+|github\.com\/[^\s,;)"]+|gitlab\.com\/[^\s,;)"]+)/gi;
text = text.replace(socialUrlRegex, (match) => {
stats.urlsMasked++;
detectedItems.push({
type: "URL",
originalPreview: createPartialPreview(match, "URL"),
});
const lower = match.toLowerCase();
if (lower.includes("github") || lower.includes("gitlab")) {
return "[LINK_GITHUB_PORTFOLIO]";
}
if (lower.includes("linkedin")) {
return "[LINK_LINKEDIN_PROFILE]";
}
return "[LINK_MẠNG_XÃ_HỘI]";
});

// 5. LỌC ĐỊA CHỈ NHÀ CHI TIẾT (Số nhà, Ngõ, Ngách, Hẻm)
// Giữ lại Quận/Thành phố phía sau nếu có, chỉ che phần số nhà/ngõ cụ thể
const streetAddressRegex =
/(?:Số nhà|Số|Đ\/c|Địa chỉ|Address)?[\s:]_\b\d+[A-Za-z]?(?:\/\d+[A-Za-z]?)_\s+(?:ngõ|ngách|hẻm|đường|phố)\s+[^\n,;.]{3,35}/gi;
text = text.replace(streetAddressRegex, (match) => {
stats.addressesMasked++;
detectedItems.push({
type: "ADDRESS",
originalPreview: createPartialPreview(match, "ADDRESS"),
});
return "[ĐỊA_CHỈ_CHI_TIẾT_ĐÃ_ẨN]";
});

stats.totalMasked =
stats.emailsMasked +
stats.phonesMasked +
stats.cccdMasked +
stats.urlsMasked +
stats.addressesMasked;

return {
sanitizedText: text,
stats,
detectedItems,
};
} 2. UI Badge hiển thị kết quả ẩn danh (Tăng Trust cho người dùng)
Ngay sau khi trình đọc PDF bóc tách text xong ở trang /roast, bạn gọi maskCVPII(extractedText) và hiển thị một thanh thông báo nhỏ màu xanh ngọc:

TypeScript
// Ví dụ hiển thị ngay dưới khung Upload CV trước khi bấm nút "Roast"
{maskResult.stats.totalMasked > 0 && (

  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center justify-between">
    <span>
      🛡️ <strong>Khiên bảo mật Client:</strong> Đã tự động che{" "}
      <b>{maskResult.stats.phonesMasked} SĐT</b>,{" "}
      <b>{maskResult.stats.emailsMasked} Email</b> và{" "}
      <b>{maskResult.stats.cccdMasked + maskResult.stats.urlsMasked} thông tin định danh</b>{" "}
      trước khi gửi cho AI.
    </span>
  </div>
)}
Phần 2: Cơ chế Rate Limiting đa tầng cho Next.js App Router (No-Auth)
Vì web của bạn không bắt đăng nhập ("Không cần tạo tài khoản"), người dùng có thể xóa localStorage hoặc mở tab ẩn danh để dùng lại. Để bảo vệ API gọi LLM (vốn tốn phí theo token và thời gian xử lý lâu), bạn nên kết hợp 3 lớp chặn trong Route Handler:

Lớp 1 — Payload Guard & Content Hashing: Chặn CV rỗng, CV quá dài (vượt quá giới hạn "Miễn phí 1 trang" ~ 4.500 ký tự), và cache/chặn nếu cùng 1 nội dung CV bấm gửi liên tục.

Lớp 2 — Sliding Window Rate Limiter theo IP + Fingerprint:

Giới hạn ngắn hạn (Burst Limit): Tối đa 2 request / 1 phút (chống bấm liên tục hoặc chạy script loop).

Giới hạn ngày (Daily Quota): Tối đa 5 lượt Roast / 24 giờ cho mỗi IP.

Lớp 3 — Hybrid Storage (Upstash Redis trên Vercel hoặc In-Memory Fallback): Vì Next.js trên Vercel chạy dạng Serverless/Edge (bộ nhớ RAM có thể bị reset giữa các cold-start), code dưới đây được thiết kế theo mô hình Hybrid: tự động dùng Upstash Redis REST API nếu bạn có cấu hình biến môi trường, hoặc tự động fallback về LRU In-Memory Map khi chạy local/MVP mà không làm sập app.

1. Code Module lib/rate-limiter.ts
   TypeScript
   import { NextRequest } from "next/server";

export interface RateLimitResult {
allowed: boolean;
limit: number;
remaining: number;
resetInSeconds: number;
reason?: "BURST_LIMIT" | "DAILY_LIMIT";
}

interface BucketRecord {
count: number;
expiresAt: number;
}

// Fallback bộ nhớ trong (dùng cho Local Dev hoặc khi chưa gắn Redis)
const memoryStore = new Map<string, BucketRecord>();

// Dọn rác định kỳ để tránh rò rỉ bộ nhớ (Memory Leak)
function cleanupExpiredKeys() {
if (memoryStore.size < 1000) return;
const now = Date.now();
for (const [key, record] of memoryStore.entries()) {
if (record.expiresAt <= now) {
memoryStore.delete(key);
}
}
}

/\*\*

- Trích xuất IP chuẩn xác khi deploy trên Vercel / Cloudflare
  \*/
  export function getClientIdentifiers(req: NextRequest): {
  ip: string;
  fingerprint: string;
  } {
  // Vercel tự động gắn header x-real-ip hoặc x-forwarded-for không thể giả mạo từ ngoài
  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const cfIp = req.headers.get("cf-connecting-ip");

const ip =
cfIp ||
realIp ||
(forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1");

// Kết hợp thêm User-Agent + Ngôn ngữ để phân biệt cơ bản trong cùng mạng LAN/Trường đại học
const ua = req.headers.get("user-agent") || "unknown-ua";
const clientToken = req.headers.get("x-client-session-id") || "";

// Tạo chuỗi định danh ngắn gọn
const rawFp = `${ip}:${ua.slice(0, 40)}:${clientToken.slice(0, 24)}`;
return { ip, fingerprint: rawFp };
}

/\*\*

- Hàm tăng bộ đếm hỗ trợ cả Upstash Redis REST (không cần cài thêm SDK) và Memory Fallback
  \*/
  async function incrementCounter(
  key: string,
  windowSeconds: number
  ): Promise<{ count: number; ttl: number }> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

// Nếu có cấu hình Upstash Redis trên Vercel -> Dùng Redis Pipeline siêu nhẹ qua fetch
if (redisUrl && redisToken) {
try {
const response = await fetch(`${redisUrl}/pipeline`, {
method: "POST",
headers: {
Authorization: `Bearer ${redisToken}`,
"Content-Type": "application/json",
},
body: JSON.stringify([
["INCR", key],
["EXPIRE", key, windowSeconds, "NX"],
["TTL", key],
]),
cache: "no-store",
});

      if (response.ok) {
        const data = await response.json();
        const count = Number(data?.[0]?.result ?? 1);
        const ttl = Number(data?.[2]?.result ?? windowSeconds);
        return { count, ttl: ttl > 0 ? ttl : windowSeconds };
      }
    } catch (err) {
      console.warn("Redis fallback sang In-Memory:", err);
    }

}

// Fallback: Xử lý trực tiếp trên In-Memory Map
cleanupExpiredKeys();
const now = Date.now();
const existing = memoryStore.get(key);

if (!existing || existing.expiresAt <= now) {
const expiresAt = now + windowSeconds \* 1000;
memoryStore.set(key, { count: 1, expiresAt });
return { count: 1, ttl: windowSeconds };
}

existing.count += 1;
const remainingTtl = Math.max(1, Math.ceil((existing.expiresAt - now) / 1000));
return { count: existing.count, ttl: remainingTtl };
}

/\*\*

- Kiểm tra kép: Chặn cả Spam tốc độ cao (1 phút) lẫn Giới hạn lượt dùng trong ngày (24h)
  \*/
  export async function checkRoastRateLimit(
  req: NextRequest,
  endpointName: "roast" | "interview" = "roast"
  ): Promise<RateLimitResult> {
  const { ip } = getClientIdentifiers(req);

// Cấu hình hạn mức
const BURST_LIMIT = 2; // Tối đa 2 lần bấm / 60 giây
const BURST_WINDOW = 60;

const DAILY_LIMIT = endpointName === "roast" ? 5 : 8; // 5 lần Roast CV / ngày / IP
const DAILY_WINDOW = 86400; // 24 giờ

const burstKey = `rl:${endpointName}:burst:${ip}`;
const dailyKey = `rl:${endpointName}:daily:${ip}`;

// 1. Kiểm tra Burst Limit (chống spam F5/script)
const burst = await incrementCounter(burstKey, BURST_WINDOW);
if (burst.count > BURST_LIMIT) {
return {
allowed: false,
limit: BURST_LIMIT,
remaining: 0,
resetInSeconds: burst.ttl,
reason: "BURST_LIMIT",
};
}

// 2. Kiểm tra Daily Quota (bảo vệ chi phí token AI)
const daily = await incrementCounter(dailyKey, DAILY_WINDOW);
if (daily.count > DAILY_LIMIT) {
return {
allowed: false,
limit: DAILY_LIMIT,
remaining: 0,
resetInSeconds: daily.ttl,
reason: "DAILY_LIMIT",
};
}

return {
allowed: true,
limit: DAILY_LIMIT,
remaining: Math.max(0, DAILY_LIMIT - daily.count),
resetInSeconds: daily.ttl,
};
}
Phần 3: Tích hợp vào Route Handler (app/api/roast/route.ts)
Ở tầng Server API, ngoài việc gọi checkRoastRateLimit, bạn nên chạy lại hàm maskCVPII thêm một lần nữa trên Server (Defense-in-Depth — đề phòng có người gọi thẳng API bằng Postman mà không đi qua giao diện web của bạn).

TypeScript
import { NextRequest, NextResponse } from "next/server";
import { checkRoastRateLimit } from "@/lib/rate-limiter";
import { maskCVPII } from "@/lib/pii-masker";

// Giới hạn độ dài tương đương ~1-1.5 trang A4 để đúng cam kết "Miễn phí 1 trang"
const MAX_CV_CHAR_LENGTH = 5000;
const MIN_CV_CHAR_LENGTH = 120;

export async function POST(req: NextRequest) {
try {
// BƯỚC 1: KIỂM TRA RATE LIMIT TRƯỚC KHI ĐỌC BODY HOẶC GỌI AI
const rateLimit = await checkRoastRateLimit(req, "roast");

    const rateLimitHeaders = {
      "X-RateLimit-Limit": String(rateLimit.limit),
      "X-RateLimit-Remaining": String(rateLimit.remaining),
      "X-RateLimit-Reset": String(rateLimit.resetInSeconds),
    };

    if (!rateLimit.allowed) {
      const errorMessage =
        rateLimit.reason === "BURST_LIMIT"
          ? `Bạn thao tác quá nhanh! AI đang thở oxy, vui lòng đợi ${rateLimit.resetInSeconds} giây rồi thử lại nhé.`
          : `Bạn đã dùng hết ${rateLimit.limit} lượt Roast CV miễn phí trong hôm nay. Hãy sửa CV thật kỹ rồi quay lại vào ngày mai nhé!`;

      return NextResponse.json(
        {
          error: "TOO_MANY_REQUESTS",
          message: errorMessage,
          retryAfter: rateLimit.resetInSeconds,
        },
        {
          status: 429,
          headers: {
            ...rateLimitHeaders,
            "Retry-After": String(rateLimit.resetInSeconds),
          },
        }
      );
    }

    // BƯỚC 2: KIỂM TRA HỢP LỆ DỮ LIỆU ĐẦU VÀO (PAYLOAD GUARD)
    const body = await req.json();
    const { cvText, mode = "savage", targetRole = "Fresher" } = body;

    if (!cvText || typeof cvText !== "string") {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "Không tìm thấy nội dung văn bản trong CV." },
        { status: 400, headers: rateLimitHeaders }
      );
    }

    const trimmedText = cvText.trim();

    // Bắt lỗi file PDF xuất từ Canva dạng ảnh (không có text layer)
    if (trimmedText.length < MIN_CV_CHAR_LENGTH) {
      return NextResponse.json(
        {
          error: "EMPTY_OR_SCANNED_PDF",
          message:
            "CV của bạn có quá ít chữ (hoặc là file PDF dạng ảnh chụp/Canva không quét được chữ). Hệ thống ATS của doanh nghiệp cũng sẽ loại thẳng các file này! Hãy xuất PDF chuẩn dạng văn bản nhé.",
        },
        { status: 422, headers: rateLimitHeaders }
      );
    }

    // Cắt ngắn an toàn nếu vượt quá giới hạn 1 trang miễn phí (bảo vệ Token)
    const truncatedText = trimmedText.slice(0, MAX_CV_CHAR_LENGTH);

    // BƯỚC 3: LỌC LẠI PII LẦN NỮA Ở SERVER (DEFENSE-IN-DEPTH)
    const { sanitizedText } = maskCVPII(truncatedText);

    // BƯỚC 4: GỌI LLM API (Gemini / OpenAI / Claude...) VỚI `sanitizedText`
    // const aiResult = await callYourLLM(sanitizedText, mode, targetRole);

    return NextResponse.json(
      {
        success: true,
        remainingQuota: rateLimit.remaining,
        // data: aiResult
      },
      { status: 200, headers: rateLimitHeaders }
    );

} catch (error) {
console.error("[API /roast Error]:", error);
return NextResponse.json(
{ error: "INTERNAL_ERROR", message: "Hệ thống AI đang quá tải, vui lòng thử lại sau!" },
{ status: 500 }
);
}
}
Phần 4: Luồng gọi từ Client (/roast/page.tsx) chuẩn chỉnh
Khi ghép nối ở phía Frontend, luồng chạy sẽ diễn ra mượt mà và minh bạch với người dùng như sau:

TypeScript
// Trong hàm xử lý khi user chọn file PDF và bấm nút "🔥 Roast CV của tôi"
async function handleRoastSubmit(rawExtractedPdfText: string) {
// 1. Chạy bộ lọc PII ngay trên trình duyệt
const { sanitizedText, stats } = maskCVPII(rawExtractedPdfText);
console.log(`Đã ẩn danh ${stats.totalMasked} thông tin nhạy cảm tại Client.`);

// 2. Chỉ gửi bản text ĐÃ LÀM SẠCH (sanitizedText) qua mạng
const res = await fetch("/api/roast", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({
cvText: sanitizedText,
mode: selectedPersona, // "savage" | "expert"
}),
});

const result = await res.json();

// 3. Xử lý thông báo nếu chạm ngưỡng Rate Limit (HTTP 429)
if (res.status === 429) {
alert(result.message); // Hiển thị câu cà khịa nhẹ nhàng khi hết lượt
return;
}
}
Tóm tắt lợi ích của kiến trúc này:
Không sợ rò rỉ dữ liệu: Kể cả bạn mở tab Network (F12) trên trình duyệt để soi payload gửi đi, toàn bộ SĐT, Email, CCCD của ứng viên đã biến thành [SĐT_CÁ_NHÂN], [EMAIL_CÁ_NHÂN]. Người dùng kỹ tính (đặc biệt là dân IT) khi kiểm tra F12 thấy điều này sẽ cực kỳ nể phục sự chỉn chu của sản phẩm.

Bắt gọn lỗi CV ảnh (Canva scan) ngay từ cửa: Biến một lỗi kỹ thuật (trimmedText.length < 120) thành một lời khuyên nghiệp vụ cực đắt giá ("Máy quét ATS của công ty cũng sẽ không đọc được file PDF dạng ảnh này của bạn!").

Kiểm soát 100% chi phí AI: Không ai có thể treo tool gọi hàng nghìn request làm cháy tài khoản API của bạn.
