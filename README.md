# 🔥 AI Roast CV

> **Nền tảng phân tích CV thẳng thắn, bóc trần điểm yếu & luyện phỏng vấn áp lực chuẩn ATS dành cho sinh viên và fresher Việt Nam.**

[![Next.js](https://img.shields.io/badge/Next.js-15.3.9-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.17-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
[![Gemini Flash](https://img.shields.io/badge/Google%20GenAI-Gemini%20Flash-4285F4?logo=google)](https://aistudio.google.com/)
[![Tests](https://img.shields.io/badge/Tests-1%2C044%20passed%20(62%20suites)-success?logo=vitest)](./TEST_READY.md)
[![Privacy](https://img.shields.io/badge/Privacy-Zero--Retention-green)](./docs/technical-overview.md)
[![License](https://img.shields.io/badge/License-MIT-orange)](#)

---

## 💡 Ý tưởng & Sứ mệnh

Ứng viên đầu sự nghiệp (sinh viên năm 3, năm 4, fresher) thường nộp hàng chục CV nhưng chỉ nhận lại sự im lặng hoặc từ chối mà không hiểu lý do. Hầu hết CV mắc các lỗi kinh điển:
- **Ngôn từ sáo rỗng**: Dùng từ ngữ chung chung ("năng động", "ham học hỏi", "chịu được áp lực cao") mà không có minh chứng định lượng.
- **Thiếu cấu trúc & chỉ số**: Trình bày dài dòng, không dùng mô hình STAR/CAR, thiếu metrics (doanh thu, %, thời gian).
- **Không thân thiện với ATS**: Định dạng khó bóc tách thông tin, tiêu đề mục sai chuẩn.
- **Bỡ ngỡ khi phỏng vấn áp lực**: Chưa từng trải nghiệm các câu hỏi tình huống hóc búa với thời gian phản hồi thực tế.

**AI Roast CV** ra đời để giải quyết triệt để vấn đề này với hai giá trị cốt lõi:
1. **Roast CV không khoan nhượng**: Chỉ ra điểm yếu sắc sảo, giải thích lý do nhà tuyển dụng đánh rớt, gợi ý cách sửa chuẩn ATS kèm khung mẫu `[...]` (tuyệt đối không bịa đặt số liệu).
2. **Mô phỏng phỏng vấn áp lực (Stress Interview)**: 3 câu hỏi tình huống dồn dập, đồng hồ đếm ngược, chấm điểm theo Rubric 4 tiêu chí minh bạch.

---

## ✨ Tính năng nổi bật

### 1. 🎯 Roast CV & Bóc tách đa giọng điệu
- **Đa dạng hình thức tải lên**: Hỗ trợ tệp PDF, Ảnh (PNG, JPG) hoặc dán trực tiếp văn bản CV.
- **Trích xuất thông minh (OCR)**: Tích hợp Google Gemini Multimodal kết hợp `unpdf` xử lý nhanh chóng.
- **Màn hình xem lại & biên tập (OCR Preview)**: Người dùng có toàn quyền kiểm tra, chỉnh sửa văn bản đã trích xuất trước khi gửi tới AI.
- **2 chế độ giọng điệu linh hoạt**:
  - 🌶️ **Cà khịa / Sát thủ (Spicy Roast)**: Thẳng thắn, châm biếm sâu cay vào các câu sáo rỗng, thức tỉnh ứng viên ngay lập tức.
  - 👔 **Chuyên gia tận tâm (Constructive)**: Phân tích khách quan, nghiêm túc, tập trung chuyên sâu vào định hướng phát triển.
- **Báo cáo phân tích chuyên sâu**:
  - Chấm điểm tổng quan và tóm tắt ấn tượng đầu tiên.
  - Phân tích chi tiết từng điểm yếu: Trích đoạn CV gốc $\rightarrow$ Vấn đề $\rightarrow$ Mức độ nghiêm trọng (Cao / Trung bình / Thấp) $\rightarrow$ Lý do HR loại $\rightarrow$ Hướng sửa cụ thể kèm placeholder `[số liệu cụ thể]`.
  - Khuyến nghị tối ưu từ khóa và cấu trúc theo chuẩn ATS.

### 2. ⚡ Mô phỏng phỏng vấn áp lực (Stress Interview)
- **2 nhánh ngành nghề chính**:
  - 💻 **IT / Software Engineer**: Các tình huống về outage, bug production, xung đột kiến trúc, technical debt.
  - 📈 **Marketing / Business**: Các tình huống khủng hoảng truyền thông, ngân sách sụt giảm, mâu thuẫn chỉ tiêu KPI.
- **Cơ chế thời gian đếm ngược**: Mỗi câu hỏi có đồng hồ 60s – 90s, tự động nộp bài khi hết giờ hoặc cho phép nộp sớm.
- **Quyền kiểm soát phiên**: Nút "Bỏ qua câu hỏi" và "Dừng phỏng vấn" lập tức để đảm bảo an toàn tâm lý.
- **Chấm điểm theo Rubric 4 tiêu chí chuẩn hóa**:
  1. *Cấu trúc câu trả lời* (mạch lạc, chuẩn STAR).
  2. *Tính cụ thể & Dẫn chứng* (kinh nghiệm thực tế).
  3. *Mức độ bám sát & Liên quan* (trả lời trúng trọng tâm câu hỏi).
  4. *Tư duy hệ quả & Xử lý rủi ro* (nhận thức tác động lâu dài).
- **Báo cáo tổng kết**: Điểm mạnh, điểm cần hoàn thiện và gợi ý câu hỏi đào sâu cho vòng tiếp theo.

### 3. 🛡️ Kiến trúc bảo mật Zero-Retention (Bảo vệ dữ liệu tuyệt đối)
- **Không lưu trữ CV trên máy chủ**: Toàn bộ dữ liệu xử lý theo dạng stateless; không ghi vào cơ sở dữ liệu hay bộ nhớ đệm server.
- **Zero-PII Server Logging**: Hệ thống Logger tùy chỉnh lọc sạch thông tin nhạy cảm trước khi ghi log hệ thống.
- **Lọc thông tin cá nhân (PII Redaction Engine)**: Tự động phát hiện và che mờ Họ tên, Số điện thoại, Email, URL trước khi tạo ảnh chia sẻ.
- **Nút "Xóa sạch dữ liệu" (1-Click Wipe Data)**: Thanh lọc toàn bộ LocalStorage, SessionStorage và React State chỉ với 1 cú click.
- **Phòng chống Prompt Injection**: Bao bọc nội dung người dùng trong thẻ XML phân cách nghiêm ngặt (`<candidate_cv>`, `<candidate_answer>`).

### 4. 🎴 Thẻ chia sẻ kết quả (Share Card Canvas)
- **Tạo thẻ trực tiếp tại trình duyệt**: Sử dụng HTML5 Canvas API (0% phụ thuộc server, 100% riêng tư).
- **Phong cách Spotify Wrapped / RPG Card**: Điểm số, danh hiệu, câu roast đắt giá nhất và thống kê điểm mạnh/yếu.
- **Chế độ kiểm duyệt PII chủ động**: Cho phép người dùng xem trước và tải file PNG về máy; tuyệt đối không tự động đăng bài lên mạng xã hội.

### 5. 💳 Hệ thống VietQR & Kích hoạt gói Pro
- **Mô hình định giá dễ tiếp cận**: Thử nghiệm nhu cầu (Fake Door Test) với gói Pro chỉ từ 29.000 VNĐ.
- **Thanh toán VietQR động**: Tạo mã QR ngân hàng tự động (MBBank) kèm mã nội dung chuẩn xác.
- **Xác thực tự động qua SePay Webhook**: Kích hoạt License Key (`PRO-XXXX-YYYY`) tự động chỉ trong 3–5 giây.

### 6. 🎨 Trải nghiệm giao diện & Tương tác cao cấp
- **3D WebGL Canvas**: Tích hợp Three.js với quả cầu năng lượng và ánh sáng tương tác, tự động fallback an toàn nếu thiết bị không hỗ trợ WebGL.
- **Âm thanh Procedural Web Audio (0 KB)**: Tạo âm thanh click, countdown alert, success jingle thuần bằng thuật toán Oscillator, không tốn băng thông tải file âm thanh.
- **Cuộn mượt mà (Lenis Smooth Scroll)**: Đồng bộ cuộn trang cao cấp với cơ chế tự động tạm dừng khi mở modal.
- **Hall of Shame Ticker**: Dải ticker hiển thị những câu trích đoạn CV sáo rỗng hài hước thường gặp.
- **Interactive Diff Slider**: So sánh trước/sau khi tối ưu CV với thanh trượt trực quan.

---

## 🏛️ Kiến trúc hệ thống

```
                           ┌──────────────────────────────────────────────┐
                           │            Client (Next.js / React)          │
                           │  - Landing & Feature Chooser (R1)            │
                           │  - CV Upload / OCR Edit / Roast UI (R2)      │
                           │  - Stress Interview & Timer Engine (R3)      │
                           │  - 1-Click Wipe Data & State (R4)            │
                           │  - Client-Side HTML5 Canvas Share Card (R4)  │
                           └──────────────────────┬───────────────────────┘
                                                  │ Clean JSON (zero retention)
                                                  ▼
                           ┌──────────────────────────────────────────────┐
                           │          Next.js Route Handlers (API)        │
                           │  - POST /api/fakedoor (Lead capture)         │
                           │  - POST /api/extract (OCR / Multimodal)      │
                           │  - POST /api/roast (Spicy / Constructive)    │
                           │  - POST /api/interview/question (Scenarios)  │
                           │  - POST /api/interview/evaluate (4 Rubrics)  │
                           │  - Zero-PII Server Logging Middleware        │
                           └──────────────────────┬───────────────────────┘
                                                  │ Sanitized Prompt & Delimiters
                                                  ▼
                           ┌──────────────────────────────────────────────┐
                           │     Google Gemini Flash (@google/genai)      │
                           │  - Structured JSON Outputs with Zod Schemas  │
                           │  - Strict Placeholder [...] Enforcement      │
                           │  - Prompt Injection Containment (<tags>)     │
                           └──────────────────────────────────────────────┘
```

---

## 🛠️ Công nghệ sử dụng

| Lớp công nghệ | Công nghệ | Mục đích |
|---|---|---|
| **Framework** | Next.js 15 (App Router) | Khung ứng dụng React full-stack, Server Route Handlers |
| **Giao diện** | React 19, Tailwind CSS | Thành phần UI, styling hiện đại, responsive |
| **Animation & 3D** | Framer Motion, Three.js, Lenis | Hiệu ứng chuyển động mượt mà, quả cầu 3D tương tác |
| **Trí tuệ nhân tạo** | `@google/genai` (Gemini Flash) | Trích xuất OCR văn bản, phân tích CV đa giọng điệu, chấm điểm phỏng vấn |
| **Xử lý tài liệu** | `unpdf` | Trích xuất nội dung văn bản từ tệp PDF trực tiếp |
| **Kiểm tra dữ liệu** | Zod | Kiểm soát và bảo đảm cấu trúc JSON phản hồi từ AI |
| **Âm thanh** | Web Audio API | Tạo hiệu ứng âm thanh thời gian thực (0 KB asset) |
| **Đồ họa Client** | HTML5 Canvas, `html-to-image` | Tạo thẻ chia sẻ kết quả và xuất ảnh PNG cục bộ |
| **Kiểm thử** | Vitest, Testing Library, JSDOM | Bộ kiểm thử tự động toàn diện (1,044 tests) |
| **Thanh toán** | VietQR API, SePay Webhook | Tích hợp chuyển khoản ngân hàng và tự động mở khóa Pro |

---

## 📁 Cấu trúc thư mục

```
ai-roast-cv/
├── app/                              # Next.js App Router (Pages & API Routes)
│   ├── api/
│   │   ├── extract/route.ts          # API trích xuất OCR văn bản từ PDF/ảnh
│   │   ├── roast/route.ts            # API phân tích và roast CV theo giọng điệu
│   │   ├── interview/
│   │   │   ├── question/route.ts     # API sinh câu hỏi tình huống phỏng vấn
│   │   │   └── evaluate/route.ts     # API chấm điểm rubric 4 tiêu chí
│   │   ├── fakedoor/route.ts         # API thu thập email đo lường nhu cầu gói Pro
│   │   └── payment/                  # API VietQR & SePay webhook
│   ├── roast/page.tsx                # Trang tải lên, biên tập OCR và hiển thị Roast
│   ├── interview/page.tsx            # Trang phỏng vấn tình huống áp lực & đồng hồ
│   ├── ats-diff/page.tsx             # Trang so sánh trực quan CV trước & sau tối ưu
│   ├── privacy/page.tsx              # Chính sách bảo mật & cam kết Zero-Retention
│   ├── layout.tsx                    # Layout chung, providers và navigation
│   └── page.tsx                      # Trang chủ (Hero, 3D Canvas, Bento Grid, Teaser)
├── components/
│   ├── landing/                      # Các khối giao diện trang chủ (Hero, Bento, Ticker, Features)
│   ├── roast/                        # Form upload, preview OCR, bảng điểm roast
│   ├── interview/                    # Giao diện phỏng vấn, đồng hồ timer, rubric card
│   ├── share/                        # Trình tạo Share Card Canvas, modal tải ảnh
│   ├── payment/                      # Modal thanh toán VietQR và kích hoạt license
│   └── ui/                           # Thành phần giao diện dùng chung (Button, Modal, Badge...)
├── lib/
│   ├── audio/                        # Web Audio Engine sinh âm thanh bằng code
│   ├── gemini/                       # Tích hợp Google Gemini Flash SDK & prompts
│   ├── logger/                       # Zero-PII Logger bảo vệ quyền riêng tư
│   ├── payment/                      # Logic tạo VietQR và xử lý SePay webhook
│   ├── rate-limit/                   # Rate limiting bảo mật không lưu IP thô
│   ├── schemas/                      # Zod validation schemas cho dữ liệu AI
│   └── security/                     # Engine lọc PII và phòng vệ prompt injection
├── tests/                            # 62 bộ kiểm thử tự động (Unit, Integration, E2E)
├── docs/                             # Tài liệu đặc tả sản phẩm & kiến trúc
├── .env.example                      # Mẫu biến môi trường
├── package.json                      # Quản lý dependencies & scripts
├── tailwind.config.ts                # Cấu hình Tailwind CSS
└── vitest.config.ts                  # Cấu hình Vitest runner
```

---

## 🚀 Hướng dẫn cài đặt & Khởi chạy

### 1. Yêu cầu hệ thống
- **Node.js**: Phiên bản `18.18.0` trở lên (khuyên dùng Node.js 20+ LTS).
- **Trình quản lý gói**: `npm` (đi kèm Node.js).
- **Khóa API Google Gemini**: Đăng ký miễn phí tại [Google AI Studio](https://aistudio.google.com/).

### 2. Cài đặt các bước

1. **Clone repository về máy**:
   ```bash
   git clone https://github.com/hoangmanhtruong-uet-dev/AI-ROAST-CV.git
   cd AI-ROAST-CV
   ```

2. **Cài đặt thư viện dependencies**:
   ```bash
   npm install
   ```

3. **Cấu hình biến môi trường**:
   Sao chép tệp `.env.example` thành `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Mở `.env.local` và điền khóa API của bạn:
   ```env
   # Khóa API Google Gemini (bắt buộc để chạy AI Roast & OCR)
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   GEMINI_MODEL=gemini-3.8-flash

   # Cấu hình thanh toán VietQR (tùy chọn)
   VIETQR_BANK_ID=MB
   VIETQR_BANK_NAME=MBBank - Ngân hàng Quân Đội
   VIETQR_ACCOUNT_NO=01012076666
   VIETQR_ACCOUNT_NAME=HOANG MANH TRUONG

   # Khóa bảo mật SePay Webhook (tùy chọn)
   SEPAY_WEBHOOK_KEY=your_sepay_webhook_key_here

   # Khóa salt bảo vệ chống lạm dụng & PII (tùy chọn)
   RATE_LIMIT_SALT=random_salt_string_here
   TEASER_RATE_LIMIT_SALT=random_teaser_salt_string_here
   ```

4. **Khởi chạy máy chủ phát triển (Development Server)**:
   ```bash
   npm run dev
   ```
   Mở trình duyệt và truy cập `http://localhost:3000` để trải nghiệm ứng dụng.

---

## 🧪 Kiểm thử & Đảm bảo chất lượng

Dự án áp dụng quy trình kiểm thử tự động nghiêm ngặt với **1,044 bài kiểm thử** trên **62 tệp test suite**, bao phủ 5 tầng kiểm nghiệm:

| Tầng kiểm thử | Số lượng test | Mô tả chi tiết |
|---|:---:|---|
| **Tier 1: Feature Coverage** | 260 | Kiểm tra đơn vị từng tính năng độc lập (Landing, OCR, Roast, Timer, Rubric, Canvas) |
| **Tier 2: Boundary & Corner Cases** | 310 | Kiểm tra các giá trị biên: file rỗng, dung lượng chạm trần 5MB, ký tự lạ, timeout |
| **Tier 3: Cross-Feature Combinations** | 240 | Kiểm tra phối hợp: 3D fallback, Audio persona sync, Rate limit & cache |
| **Tier 4: Real-World Scenarios** | 134 | Luồng người dùng hoàn chỉnh từ tải CV $\rightarrow$ nhận Roast $\rightarrow$ phỏng vấn $\rightarrow$ tải ảnh |
| **Tier 5: Adversarial & Security** | 100 | Tấn công thử nghiệm: 17 kịch bản rò rỉ PII, concurrency bursts, prompt injection |
| **Tổng cộng** | **1,044 / 1,044 (100% PASS)** | Sẵn sàng triển khai sản xuất |

### Các lệnh kiểm tra:
```bash
# Chạy toàn bộ test suite
npm test

# Kiểm tra an toàn kiểu dữ liệu TypeScript
npm run type-check

# Kiểm tra lint mã nguồn
npm run lint

# Build bản sản xuất để kiểm tra tính toàn vẹn
npm run build
```

---

## 🔒 Cam kết Quyền riêng tư & Tuyên bố trách nhiệm

### 1. Cam kết Bảo vệ Dữ liệu (Privacy First)
- **Không bán, không chia sẻ**: Dữ liệu CV của bạn chỉ được truyền qua kết nối mã hóa an toàn tới Google Gemini API để tạo kết quả phân tích tức thì.
- **Không lưu trữ bí mật**: Không có cơ sở dữ liệu nào lưu trữ hồ sơ hay câu trả lời phỏng vấn của bạn.
- **Chủ quyền người dùng**: Bạn có thể xóa toàn bộ dữ liệu tạm thời trên máy bất kỳ lúc nào bằng nút "Xóa dữ liệu".

### 2. Tuyên bố Miễn trừ trách nhiệm (Disclaimer)
- Điểm số và nhận xét từ AI Roast CV chỉ mang tính chất **tham khảo và hỗ trợ luyện tập**, không đại diện cho quyết định tuyển dụng chính thức của bất kỳ doanh nghiệp nào.
- Ứng dụng không đảm bảo rằng bạn sẽ vượt qua 100% các hệ thống ATS hoặc chắc chắn nhận được việc làm.
- Hãy luôn đối chiếu các đề xuất với yêu cầu công việc thực tế (Job Description) và kinh nghiệm chân thực của chính bạn.

---

## 📚 Tài liệu chi tiết liên quan

- 📋 [Product Brief](docs/product-brief.md): Vấn đề cốt lõi, chân dung khách hàng mục tiêu và bài toán thị trường.
- 📐 [MVP Requirements](docs/mvp-requirements.md): Đặc tả yêu cầu chức năng, tiêu chí chấp nhận cho từng tính năng.
- 🗺️ [Kế hoạch phát triển (Roadmap)](docs/roadmap.md): Lộ trình mở rộng tính năng và các cột mốc bàn giao.
- ⚙️ [Tổng quan kỹ thuật (Technical Overview)](docs/technical-overview.md): Ranh giới hệ thống, an toàn dữ liệu và kiến trúc AI.
- 📝 [Nguyên tắc nội dung (Content Guidelines)](docs/content-guidelines.md): Chuẩn mực giọng điệu, rubric chấm điểm và ranh giới đạo đức.
- 📊 [Báo cáo E2E Test Suite (TEST_READY.md)](TEST_READY.md): Chi tiết kết quả 1,044 tests và checklist kiểm nghiệm.

---

## 📄 Giấy phép (License)

Dự án được phát triển cho cộng đồng sinh viên và người tìm việc tại Việt Nam. Vui lòng xem thông tin chi tiết tại [LICENSE](LICENSE) hoặc liên hệ nhóm phát triển để biết thêm chi tiết.

<p align="center">
  Phát triển với ❤️ vì sự nghiệp của sinh viên & fresher Việt Nam.
</p>
