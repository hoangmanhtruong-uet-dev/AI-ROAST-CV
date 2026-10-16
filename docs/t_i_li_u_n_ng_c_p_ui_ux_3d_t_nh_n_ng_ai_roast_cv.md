# 🔥 TÀI LIỆU THIẾT KẾ HỆ THỐNG & REBUILD GIAO DIỆN: AI ROAST CV (V2.0)

> **Mục tiêu:** Chuyển đổi giao diện từ dạng Landing Page phẳng (Flat Dark UI) truyền thống sang trải nghiệm **Interactive 3D WebGL kết hợp Scrollytelling** mang đậm chất "High-Tech AI", tối ưu hóa tỷ lệ chuyển đổi (CRO) và tạo ấn tượng thị giác mạnh mẽ cho sinh viên/Fresher tại Việt Nam.

---

## 1. HỆ THỐNG THIẾT KẾ (DESIGN SYSTEM) & ĐỊNH HƯỚNG THỊ GIÁC

### 1.1. Bảng màu (Dynamic Dual-Theme Palette)
Giao diện hoạt động trên nền tối sâu (Deep Space Dark) nhưng có khả năng **chuyển đổi sắc thái (Ambient Mood)** dựa trên chế độ mà người dùng đang tương tác hoặc hover:

*   **Màu nền (Backgrounds):**
    *   `Primary BG`: `#05070B` (Đen sâu hơn bản cũ để làm nổi bật hiệu ứng phát sáng Glow và 3D).
    *   `Surface / Card BG`: `rgba(15, 20, 32, 0.65)` kết hợp `backdrop-filter: blur(16px)` (Glassmorphism).
    *   `Border Subtle`: `rgba(255, 255, 255, 0.08)` (Viền mờ tinh tế).
*   **Chế độ "Roast CV" (Ignite / Cà khịa):**
    *   `Primary Accent`: `#FF4D00` -> `#FF0055` (Gradient Cam lửa sang Đỏ hồng).
    *   `Glow Effect`: `rgba(255, 77, 0, 0.35)`.
*   **Chế độ "Phỏng vấn áp lực" (Cyber / Stress Interview):**
    *   `Primary Accent`: `#00F0FF` -> `#0066FF` (Gradient Xanh Cyan sang Xanh Băng giá).
    *   `Glow Effect`: `rgba(0, 240, 255, 0.35)`.
*   **Chế độ "An toàn & Bảo mật" (Zero Retention):**
    *   `Primary Accent`: `#10B981` (Xanh Ngọc lục bảo - Emerald).

### 1.2. Typography (Phông chữ)
*   **Heading (Tiêu đề lớn):** Sử dụng `Space Grotesk`, `Plus Jakarta Sans` hoặc `Syne` (hỗ trợ tiếng Việt tốt, nét chữ hiện đại, tạo cảm giác công nghệ và sắc bén).
*   **Body (Nội dung):** `Inter` hoặc `Be Vietnam Pro` (đảm bảo độ dễ đọc cao nhất cho các đoạn nhận xét CV dài).
*   **Monospace (Số liệu, Timer, Code, Điểm số):** `JetBrains Mono` (dùng cho đồng hồ đếm ngược phỏng vấn, phần trăm ATS, log xóa dữ liệu).

---

## 2. TÁI CẤU TRÚC BỐ CỤC (UI/UX LAYOUT REBUILD)

### 2.1. Floating Glassmorphism Navbar (Thanh điều hướng nổi)
*   **Vấn đề hiện tại:** Navbar trải dài 100% chiều ngang, chứa 9 phần tử khác nhau khiến chữ "AI Roast CV" bị rớt thành 3 dòng và gây nhiễu thị giác.
*   **Cấu trúc mới:**
    *   Thu gọn thành một thanh **Floating Pill** (bo tròn `rounded-full`), chiều rộng tối đa `960px`, cách mép trên `20px`, nằm cố định (`fixed top-5`).
    *   **Bên trái:** Icon Ngọn lửa 3D nhỏ + Chữ **AI Roast CV** (trên 1 dòng duy nhất) + Badge `BETA` siêu nhỏ đính kèm góc trên.
    *   **Ở giữa:** 3 liên kết chính (`Roast CV`, `Phỏng vấn áp lực`, `Bảo mật`). Khi di chuột có một viên thuốc sáng mờ trượt theo (Framer Motion `layoutId`).
    *   **Bên phải:**
        *   Nút Icon `🛡️ Trạng thái phiên` (Gom chung: *Bảo mật 100%*, *Nút Thùng rác xóa dữ liệu*, và *Nhập Key/VietQR* vào một Popover/Dropdown gọn gàng). When có dữ liệu lưu ở LocalStorage, icon này sẽ có chấm xanh/cam báo hiệu.
        *   Nút CTA **Gói Pro 29k**: Thiết kế hiệu ứng **Border Beam** (tia sáng chạy quanh viền nút liên tục).

### 2.2. Hero Section: Bố cục tương tác & Loại bỏ rào cản chuyển đổi
*   **Vấn đề hiện tại:** Hộp cảnh báo màu vàng ("Lưu ý quan trọng...") nằm chình ình ngay trên 2 nút CTA chính, làm tụt cảm xúc của người dùng trước khi bấm nút.
*   **Cấu trúc mới:**
    *   **Interactive Persona Switcher ngay trên đỉnh Hero:** Thay vì chỉ là badge tĩnh *"Dành riêng cho Sinh viên năm cuối & Fresher"*, biến nó thành một thanh gạt (Toggle) thử nghiệm cảm giác mạnh: `[ 🔥 Chế độ Mỏ Hỗn (Roast) | 🧊 Chế độ Chuyên Gia | ⚡ Áp Lực Phòng Thi ]`. Khi gạt, tiêu đề và mô hình 3D phía sau đổi màu/hiệu ứng ngay lập tức.
    *   **Tiêu đề chính (Typography Animation):** Chữ *"Mổ xẻ CV & Phỏng vấn áp lực"* có hiệu ứng **Text Scramble / Glitch** nhẹ hoặc hiệu ứng cháy sáng khi tải trang.
    *   **Khu vực Nút bấm (CTA Group):** Đẩy lên ngay dưới đoạn mô tả ngắn.
        *   Nút 1: `🔥 Thử Roast CV ngay (Miễn phí)` — Hiệu ứng Magnetic (hút chuột) + Hạt lửa bay lên khi hover.
        *   Nút 2: `⏱️ Thử thách phỏng vấn áp lực` — Hiệu ứng viền băng giá + Icon đồng hồ rung nhịp.
    *   **Xử lý hộp "Lưu ý quan trọng":** Thu gọn thành một dòng chữ nhỏ tinh tế (`text-xs text-slate-400`) bên dưới 2 nút CTA kèm icon `ⓘ Xem tuyên bố miễn trừ trách nhiệm` (di chuột vào mới hiện Tooltip chi tiết).

### 2.3. Khu vực "Quyền riêng tư" -> Chuyển sang Bento Grid Động
*   **Vấn đề hiện tại:** 4 thẻ chữ nhật bằng nhau, toàn chữ là chữ, người dùng sẽ lướt qua mà không đọc.
*   **Cấu trúc mới (Bento Grid 2 tầng):**
    *   **Ô 1 (Lớn - Chiếm 2 cột): Xử lý bộ nhớ tạm (In-Memory Pipeline):**
        *   Thay vì chỉ viết chữ, hiển thị một **Sơ đồ luồng động (Animated SVG Diagram)**: `[Tệp CV] ➔ [RAM Server (Gemini Flash)] ➔ [Kết quả] ➔ 💥 [Tự hủy sau 0.1s]`. Có các chấm sáng chạy liên tục trên đường dây để minh họa dữ liệu không bao giờ rẽ vào ổ cứng (Database).
    *   **Ô 2 (Chiếm 1 cột): Không ghi nội dung vào Log:**
        *   Hiển thị một màn hình Terminal giả lập đang chạy các dòng log hệ thống: `POST /api/roast 200 OK - Payload: [REDACTED_BY_ZERO_RETENTION]`.
    *   **Ô 3 (Chiếm 1 cột): Xóa dữ liệu một chạm (Interactive Demo):**
        *   Có một nút bấm thử ngay trong thẻ. Khi người dùng bấm vào, thẻ sẽ chạy hiệu ứng **Thanos Snap (Tan biến thành cát)** hoặc hiệu ứng máy hủy giấy rồi khôi phục lại, chứng minh tính năng xóa sạch LocalStorage.
    *   **Ô 4 (Nằm ngang dưới cùng): Ẩn danh thông tin cá nhân tự động:**
        *   Minh họa trực quan một thẻ CV mẫu có SĐT `0987.xxx.xxx` và Email bị làm mờ bằng hiệu ứng kính mờ (Blur/Pixelate) khi di chuột qua.

### 2.4. Khu vực "Chọn tính năng" -> Dual Interactive Portal Cards
*   **Vấn đề hiện tại:** 2 thẻ liệt kê gạch đầu dòng khá dài và khô khan.
*   **Cấu trúc mới:**
    *   Biến 2 thẻ thành **2 Cánh cổng tương tác (3D Tilt Cards)**.
    *   **Thẻ Trái (Roast CV):** Có thanh trượt nhỏ cho phép người dùng **nghe thử / đọc thử 1 câu Roast mẫu** ngay trên thẻ. Ví dụ gạt sang *Cà khịa*: *"Kỹ năng làm việc nhóm tốt? Viết câu này vào CV chỉ chứng tỏ bạn không có thành tích cá nhân nào nổi bật!"*.
    *   **Thẻ Phải (Phỏng vấn áp lực):** Có đồng hồ đếm ngược `00:59` đang nhảy số thực tế ở góc thẻ, kèm một câu hỏi phỏng vấn mẫu đang gõ chữ (Typewriter effect) để kích thích sự tò mò.

---

## 3. TÍCH HỢP THREE.JS & WEBGL (ĐIỂM NHẤN 3D)

Sử dụng bộ thư viện `@react-three/fiber`, `@react-three/drei`, và `@react-three/postprocessing` để đảm bảo hiệu năng cao (60 FPS) và tích hợp mượt vào React/Next.js.

### 3.1. Cảnh 3D chính: "The AI Scanner & Hologram CV" (Ở Hero Section)
*   **Mô tả vật thể:** Một tờ CV dạng tấm kính Hologram 3D lơ lửng nghiêng góc 15 độ ở phía sau hoặc bên phải Hero Section.
*   **Hiệu ứng Shader & Tương tác:**
    *   Một **Tia Laser 3D (Scanning Beam)** màu cam/đỏ liên tục quét từ trên xuống dưới tờ CV.
    *   Khi tia laser đi qua đâu, các khối chữ màu xám (tượng trưng cho câu chữ sáo rỗng) trên tờ CV bị **vỡ vụn thành các hạt sáng (Particles)** bay lên không trung, đồng thời tái cấu trúc lại thành các thanh sáng màu xanh ngọc (tượng trưng cho CV chuẩn ATS).
    *   **Tương tác chuột (Mouse Parallax):** Khi người dùng di chuyển chuột trên màn hình, tờ CV 3D và góc camera nghiêng theo nhẹ nhàng, tạo chiều sâu không gian thực.

### 3.2. Hiệu ứng chuyển cảnh 3D theo cuộn trang (Scroll-driven 3D Journey)
Thay vì Canvas 3D chỉ đứng yên ở đầu trang, hãy đặt `Canvas` ở chế độ `fixed inset-0 pointer-events-none z-0` và điều khiển vật thể 3D biến đổi theo từng phần khi cuộn (dùng `GSAP ScrollTrigger`):
1.  **Tại Hero Section (0% - 30% scroll):** Vật thể là **Tờ CV Hologram** đang được quét laser.
2.  **Cuộn xuống phần "Quyền riêng tư" (30% - 65% scroll):** Tờ CV 3D gấp lại hoặc biến hình (Morphing) thành một **Khối Khiên Đa Diện (Low-poly Cyber Shield)** màu xanh lục bảo xoay tròn bảo vệ dữ liệu.
3.  **Cuộn xuống phần "Chọn tính năng" (65% - 100% scroll):** Khối khiên tách làm **2 luồng năng lượng (Hạt lửa Cam bên trái & Hạt băng Xanh bên phải)** bay về phía nền của 2 thẻ *Roast CV* và *Phỏng vấn áp lực*.

### 3.3. Nền Hạt Tương Tác (Interactive Ember/Data Particles)
*   Tạo 500 - 800 hạt điểm sáng (Points) trong không gian 3D với độ mờ khác nhau (Depth of Field).
*   Khi cuộn nhanh, các hạt này kéo dài ra tạo hiệu ứng **Warp Speed** (bay xuyên không gian) nhẹ nhàng rồi trả về trạng thái trôi nổi khi dừng cuộn.

---

## 4. HIỆU ỨNG CUỘN (SCROLL ANIMATIONS) & MICRO-INTERACTIONS

### 4.1. Cuộn mượt & Chuyển động theo trớn (Smooth Scroll)
*   Tích hợp **Lenis Smooth Scroll**: Giúp mọi thao tác lăn chuột có độ mượt và quán tính cao cấp, đồng bộ hoàn hảo với `GSAP ScrollTrigger` và `Three.js`.

### 4.2. Hiệu ứng Tương tác Vi mô (Micro-interactions)
*   **Mouse-Tracking Spotlight Border:** Toàn bộ các thẻ trong phần *Bảo mật* và *Tính năng* sử dụng kỹ thuật CSS Radial Gradient theo tọa độ chuột `(clientX, clientY)`. Khi đưa chuột đi đến đâu, viền của các thẻ gần đó sẽ sáng rực lên như có đèn pin chiếu vào.
*   **Hiệu ứng "Heat Distortion" (Biến dạng nhiệt):** Khi di chuột vào nút *"Bắt đầu Roast CV ngay"*, nền nút có hiệu ứng gợn sóng nhiệt nhẹ và viền phát sáng rực hơn.
*   **Hiệu ứng "Heartbeat / Panic" (Nhịp tim áp lực):** Khi di chuột vào nút *"Vào phỏng vấn áp lực ngay"*, viền nút nhấp nháy theo nhịp tim đập nhanh (`Lub-dub... Lub-dub`) kèm hiệu ứng rung cực nhẹ.

---

## 5. ĐỀ XUẤT THÊM TÍNH NĂNG MỚI (NEW FEATURES) ĐỂ TĂNG GIÁ TRỊ SẢN PHẨM

Để giữ chân người dùng lâu hơn và kích thích họ mua **Gói Pro 29.000đ**, bạn có thể bổ sung các tính năng thiên về UI/UX tương tác sau:

### 5.1. "Live Roast Teaser" (Dùng thử siêu tốc ngay tại Trang chủ)
*   **Vấn đề:** Nhiều người dùng lười tìm file PDF CV để tải lên ngay lập tức.
*   **Giải pháp:** Đặt một ô input nhỏ ngay dưới Hero hoặc trong phần Tính năng: *"Nhập 1 câu mô tả công việc trong CV của bạn để xem AI chê cỡ nào"*.
    *   *Ví dụ người dùng nhập:* `"Tham gia phát triển website bán hàng cùng nhóm."`
    *   *Bấm nút "Roast thử":* Ngay lập tức 2 nhân vật AI (Cà khịa & Chuyên gia) hiện ra phán xét câu đó và gợi ý câu sửa có số liệu. Sau đó hiện nút: **"Tải toàn bộ CV lên để mổ xẻ chi tiết hơn!"** -> Tăng tỷ lệ chuyển đổi cực mạnh.

### 5.2. Bản đồ nhiệt CV (Simulated Eye-Tracking Heatmap)
*   Khi trả kết quả Roast CV, ngoài phần chữ nhận xét, hãy cung cấp chế độ xem **"Góc nhìn HR trong 6 giây"**:
    *   Hiển thị lại hình ảnh/văn bản CV của người dùng với một lớp phủ **Bản đồ nhiệt (Heatmap đỏ/vàng/xanh)** chỉ ra vùng nào HR sẽ nhìn vào đầu tiên, vùng nào bị bỏ qua, và vùng nào quá dày đặc chữ.

### 5.3. "Thanh Nộ Khí / Áp Lực" (HR Mood Meter) trong phòng Phỏng vấn
*   Trong màn hình *Phỏng vấn áp lực*, thêm một **Avatar 3D / Biểu đồ sóng âm AI** của nhà tuyển dụng kèm **"Thanh Kiên Nhẫn (Patience Bar)"**:
    *   Nếu người dùng trả lời vòng vo, thiếu cấu trúc STAR, hoặc để thời gian trôi quá lâu mà chưa gõ chữ, thanh kiên nhẫn giảm xuống, sóng âm chuyển sang màu đỏ gắt.
    *   Nếu trả lời có số liệu sắc bén, thanh chuyển sang màu xanh hài lòng.

### 5.4. Nâng cấp "Share Card" (Thẻ Chia Sẻ Mạng Xã Hội Viral)
*   Bạn đã có tính năng tạo Share Card bằng HTML5 Canvas ẩn danh. Hãy thiết kế thẻ này theo phong cách **Spotify Wrapped** hoặc **Thẻ Bài Game (RPG Character Card)**:
    *   Hiển thị **Điểm Sống Sót Của CV** (VD: `42/100 - Cấp độ: Sinh viên ngơ ngác`).
    *   Danh hiệu hài hước để khoe lên Facebook/Threads (VD: *"Chúa tể viết câu sáo rỗng"*, *"Chiến thần Kỹ năng mềm"*, *"Kẻ hủy diệt vòng gửi xe"*).
    *   Một câu Quote "đắt" nhất mà AI đã Roast CV của họ. Điều này sẽ giúp web của bạn viral tự nhiên trong cộng đồng sinh viên mà không tốn tiền quảng cáo.

### 5.5. Chế độ "Before / After" Trực quan (Interactive Diff Slider)
*   Trong màn hình kết quả sửa CV, cung cấp một thanh kéo so sánh (Diff View hoặc Slider) giữa **Câu gốc trong CV (Đỏ - Yếu)** và **Câu đã được AI tối ưu kèm `[Placeholder số liệu]` (Xanh - Chuẩn ATS)** kèm nút `Copy` 1 chạm.

---

## 6. CẤU TRÚC THƯ MỤC & TECH STACK ĐỀ XUẤT (NEXT.JS / REACT)

```bash
src/
├── components/
│   ├── canvas/                  # Toàn bộ các thành phần 3D (Three.js / R3F)
│   │   ├── SceneCanvas.tsx      # Canvas chính cố định dưới nền
│   │   ├── HologramCV.tsx       # Mô hình tờ CV 3D + Tia Laser quét
│   │   ├── CyberShield.tsx      # Mô hình khiên bảo mật phần Privacy
│   │   └── EmberParticles.tsx   # Hệ thống hạt lửa & băng trôi nổi
│   ├── layout/
│   │   ├── FloatingNavbar.tsx   # Thanh điều hướng kính mờ bo tròn
│   │   └── Footer.tsx           # Footer tối giản kèm pháp lý
│   ├── sections/
│   │   ├── HeroSection.tsx      # Hero + Persona Switcher + Magnetic CTAs
│   │   ├── LiveTeaser.tsx       # Tính năng Roast thử 1 câu trực tiếp
│   │   ├── PrivacyBento.tsx     # Bento Grid 4 ô động giải thích Zero Retention
│   │   └── FeaturePortals.tsx   # 2 thẻ lớn Roast CV & Stress Interview (3D Tilt)
│   └── ui/                      # Các component tái sử dụng
│       ├── SpotlightCard.tsx    # Thẻ phát sáng theo vị trí con trỏ chuột
│       ├── MagneticButton.tsx   # Nút bấm hút chuột
│       └── BorderBeam.tsx       # Viền chạy tia sáng cho nút Gói Pro 29k
├── hooks/
│   ├── useSmoothScroll.ts       # Khởi tạo Lenis Smooth Scroll
│   └── useThemeMood.ts          # Quản lý trạng thái màu sắc (Roast Cam / Interview Xanh)
└── styles/
    └── globals.css              # Tailwind CSS + Custom Shaders / Keyframes
```

---

## 7. LỘ TRÌNH THỰC HIỆN (IMPLEMENTATION ROADMAP)

*   **Giai đoạn 1 (Core UI & Layout):**
    *   Làm lại `FloatingNavbar` để giải phóng không gian màn hình.
    *   Sắp xếp lại `HeroSection` (đưa hộp cảnh báo xuống dưới, làm nổi bật 2 nút CTA).
    *   Chuyển khu vực *Bảo mật* sang dạng **Bento Grid** kết hợp `SpotlightCard`.
*   **Giai đoạn 2 (Motion & Micro-interactions):**
    *   Cài đặt `framer-motion` và `lenis`.
    *   Thêm hiệu ứng xuất hiện khi cuộn (Staggered Reveal), hiệu ứng nghiêng thẻ 3D (Tilt) cho 2 thẻ Tính năng, và hoạt ảnh minh họa luồng xóa dữ liệu.
*   **Giai đoạn 3 (Three.js Integration):**
    *   Tích hợp `@react-three/fiber`.
    *   Dựng `EmberParticles` (nền hạt) và mô hình `HologramCV` quét laser ở Hero Section.
    *   Tối ưu hóa hiệu năng: Tự động giảm số lượng hạt hoặc tắt 3D trên các thiết bị di động cấu hình yếu (`useDetectGPU`).
*   **Giai đoạn 4 (Tính năng Viral & Polish):**
    *   Bổ sung ô **Roast thử 1 câu** trên trang chủ và nâng cấp giao diện **RPG Share Card**.