# Original User Request

## Initial Request — 2026-10-14T02:43:35Z

Xây dựng ứng dụng web AI Roast CV bằng Next.js (App Router, TypeScript, Tailwind CSS) giúp sinh viên năm cuối và fresher tại Việt Nam nhận phản hồi thẳng thắn, sắc sảo về CV và mô phỏng phỏng vấn tình huống áp lực (Stress Interview) với tiêu chí minh bạch, bảo mật dữ liệu tuyệt đối.

Working directory: d:\MyProjects\MyProjectToMoney\AI ROAST CV
Integrity mode: development

## Requirements

### R1. Landing Page & Giao diện thương hiệu
Xây dựng giao diện web tiếng Việt responsive, hiện đại, thân thiện cho sinh viên/fresher. Trang chủ gồm:
- Hero section giải thích rõ giá trị và giới hạn AI (chỉ mang tính tham khảo luyện tập, không cam kết việc làm hay đỗ ATS).
- Cam kết bảo mật dữ liệu nổi bật (không lưu trữ CV trên máy chủ, xử lý an toàn).
- Chọn giữa 2 tính năng chính: **Roast CV** và **Phỏng vấn áp lực**.
- Banner / Nút đo lường nhu cầu gói nâng cấp ("Fake Door Test": gói 29.000đ với modal thu thập email quan tâm khi click).

### R2. Roast CV: Upload, Trích xuất OCR & Phân tích Đa giọng điệu
- Hỗ trợ tải tệp PDF / Ảnh (PNG, JPG) giới hạn 1 trang và dung lượng <= 5MB, hoặc dán trực tiếp văn bản CV.
- Tích hợp Google Gemini Flash (`@google/genai`) xử lý multimodal đọc nội dung văn bản.
- Màn hình xem trước & cho phép người dùng tự do chỉnh sửa văn bản trích xuất trước khi bấm gửi phân tích.
- Hỗ trợ 2 chế độ giọng điệu: **"Cà khịa / Sát thủ" (Spicy Roast)** và **"Chuyên gia tận tâm" (Constructive Review)**.
- Kết quả phân tích trả về JSON có cấu trúc rõ ràng:
  - Tổng điểm và đánh giá chung.
  - Danh sách điểm yếu: trích đoạn từ CV, vấn đề phát hiện, mức độ nghiêm trọng (Cao / Trung bình / Thấp), lý do nhà tuyển dụng từ chối, và hướng sửa kèm placeholder `[số liệu cụ thể]` (tuyệt đối không tự bịa đặt thành tích).
  - Khuyến nghị cải thiện cấu trúc & khả năng quét ATS.

### R3. Phỏng vấn áp lực (Stress Interview) & Chấm điểm Rubric
- Cho phép người dùng chọn vai trò ban đầu: **IT / Software Engineer** hoặc **Marketing / Business**.
- Phiên phỏng vấn gồm 3 câu hỏi tình huống liên tiếp, hiển thị đồng hồ đếm ngược (timer 60s - 90s mỗi câu).
- Trả lời bằng văn bản, hỗ trợ nút "Bỏ qua" hoặc "Dừng phỏng vấn bất kỳ lúc nào".
- Chấm điểm từng câu theo Rubric 4 tiêu chí công khai:
  1. Cấu trúc câu trả lời (STAR / mạch lạc).
  2. Tính cụ thể & dẫn chứng cá nhân.
  3. Mức độ liên quan & đúng trọng tâm câu hỏi.
  4. Nhận thức hệ quả & tư duy xử lý vấn đề.
- Tổng kết phiên phỏng vấn với các điểm mạnh, điểm cần cải thiện và câu hỏi đào sâu. Hiển thị nhãn "Mô phỏng áp lực" kèm lưu ý không phải quyết định tuyển dụng thực tế.

### R4. Bảo vệ quyền riêng tư & Tạo ảnh kết quả chia sẻ (Share Card)
- Không ghi nội dung CV hoặc câu trả lời vào server log hay cơ sở dữ liệu.
- Cung cấp nút "Xóa sạch dữ liệu phiên" (Wipe data) một chạm xóa toàn bộ LocalStorage / Session.
- Tạo ảnh thẻ kết quả (Share Card dạng Canvas / SVG) đã tự động che / ẩn danh PII (Họ tên, Email, Số điện thoại, Link cá nhân).
- Cho phép người dùng xem trước (Preview) ảnh trước khi bấm nút tải về (Download PNG), không tự động đăng lên bất kỳ mạng xã hội nào.

## Acceptance Criteria

### Functional Verification
- [ ] Ứng dụng Next.js khởi động thành công trên môi trường local, không có lỗi TypeScript hay build error.
- [ ] Luồng Roast CV: Tải PDF/Ảnh hoặc dán text trích xuất thành công nội dung, hiển thị form review/edit trước khi gửi AI.
- [ ] API AI trả về schema JSON hợp lệ; đề xuất sửa không chứa thành tích bịa đặt mà dùng mẫu placeholder `[...]`.
- [ ] Cho phép đổi giọng điệu giữa "Cà khịa" và "Chuyên gia", kết quả trả về thể hiện đúng sắc thái đã chọn.
- [ ] Luồng phỏng vấn 3 câu có đồng hồ đếm ngược hoạt động chính xác, có rubric chấm điểm 4 tiêu chí giải thích được.
- [ ] Thẻ chia sẻ (Share Card) hiển thị đúng tóm đậm kết quả, che sạch PII đã kiểm nghiệm và cho phép tải ảnh PNG về máy.
- [ ] Nút xóa dữ liệu hoạt động chính xác, xóa sạch mọi kết quả đã lưu tạm ở client.
- [ ] Modal đo lường nhu cầu gói 29.000đ hiển thị và lưu thông tin đăng ký hợp lệ.

### Security & Privacy Verification
- [ ] Server log không chứa nội dung thô của CV hay câu trả lời phỏng vấn.
- [ ] Có validate kích thước file (<= 5MB) và định dạng hợp lệ (PDF, PNG, JPG).
- [ ] System prompt có cơ chế phòng chống prompt injection từ nội dung tệp tải lên.


## Follow-up — 2026-10-14T14:42:07Z

Mở rộng ứng dụng AI Roast CV với 2 tính năng nâng cao: Trợ lý viết lại CV chuẩn ATS (ATS CV Rewrite Assistant) và Phỏng vấn áp lực tùy biến theo Job Description (Custom JD Stress Interview), kết nối trực tiếp với hệ sinh thái Pro License Key & VietQR đã có.

Working directory: d:\MyProjects\MyProjectToMoney\AI ROAST CV
Integrity mode: development

## Requirements

### R1. Trợ lý Viết lại CV chuẩn ATS (ATS CV Rewrite Assistant)
- Trên màn hình kết quả Roast Report, cho phép người dùng bấm nút "Tối ưu hóa theo chuẩn ATS" hoặc "Sửa lại mục này" cho từng điểm yếu phát hiện được.
- Tích hợp Gemini Flash sinh các đoạn văn bản viết lại chuyên nghiệp theo công thức Action Verb + Context + Result (sử dụng placeholder `[số liệu]`, tuyệt đối không bịa đặt thành tích).
- Cho phép người dùng chỉnh sửa trực tiếp, sao chép (Copy to clipboard) một chạm hoặc xuất toàn bộ bản CV cải tiến dưới định dạng văn bản sạch (Markdown / Plain Text).

### R2. Phỏng vấn áp lực cá nhân hóa theo JD (Custom JD Stress Interview)
- Cho phép ứng viên nhập hoặc dán nội dung Job Description (JD) / Yêu cầu tuyển dụng của công ty mục tiêu.
- AI phân tích yêu cầu kỹ năng và văn hóa từ JD để tạo ra bộ 3 câu hỏi áp lực sát thực tế nhất cho vị trí đó kèm thời gian đếm ngược phù hợp.
- Đánh giá câu trả lời của ứng viên theo mức độ phù hợp với JD thực tế (Job Match Fit) kết hợp cùng Rubric 4 tiêu chí chuẩn.

### R3. Gắn kết với Hệ thống Pro Entitlement & Giới hạn sử dụng
- Người dùng miễn phí: Cho phép trải nghiệm thử 1 lượt viết lại mẫu và 1 câu hỏi theo JD.
- Người dùng Pro (đã có License Key hoặc quét VietQR): Mở khóa không giới hạn số lần viết lại CV và phỏng vấn theo mọi JD.
- Duy trì nguyên tắc Zero-PII server logging và khả năng xóa sạch dữ liệu phiên (1-Click Wipe Data).

## Acceptance Criteria

### Functional Verification
- [ ] Tính năng Viết lại CV chuẩn ATS hoạt động mượt mà trên `/roast`, đề xuất viết lại tuân thủ quy tắc placeholder `[...]`.
- [ ] Cho phép copy từng đoạn và tải về toàn bộ bản CV đã tối ưu ATS dưới dạng file `.txt` hoặc `.md`.
- [ ] Trang `/interview` hỗ trợ tab "Nhập JD tùy biến", AI sinh câu hỏi bám sát JD đã nhập.
- [ ] Hệ sinh thái Pro License Key tự động mở khóa các tính năng nâng cao này mà không phát sinh lỗi.
- [ ] Toàn bộ bộ test (unit, integration, adversarial) đạt 100% pass, không có lỗi TypeScript hay build error.

### Security & Privacy Verification
- [ ] Nội dung JD và CV viết lại không bị ghi vào server logs.
- [ ] Có validate độ dài và sanitize nội dung JD chống prompt injection.


## Follow-up — 2026-10-14T17:24:11Z

Rebuild toàn diện giao diện trang chủ AI Roast CV (V2.0) chuyển đổi từ Landing Page phẳng sang trải nghiệm tương tác Interactive 3D WebGL, Scrollytelling, Floating Pill Navbar, Bento Grid bảo mật, Live Roast Teaser, Ticker Hall of Shame, Sound FX bằng Web Audio API, và Thẻ chia sẻ mạng xã hội RPG viral.

Working directory: d:\MyProjects\MyProjectToMoney\AI ROAST CV
Integrity mode: development

## Requirements

### R1. Floating Pill Glassmorphism Navbar & Web Audio Engine
- Tái cấu trúc Header thành thanh điều hướng nổi (Floating Pill Navbar), bo tròn `rounded-full`, `fixed top-5`, viền kính mờ `backdrop-blur-md`, giới hạn chiều rộng `max-w-4xl`.
- Logo AI Roast CV hiển thị gọn trên 1 dòng kèm badge `BETA` siêu nhỏ; 3 liên kết chính (`Roast CV`, `Phỏng vấn áp lực`, `Bảo mật`) có viên thuốc sáng trượt theo (`layoutId`).
- Gom các nút *Bảo mật 100%*, *1-Click Wipe Data*, *Nhập Key Pro* vào Popover trạng thái phiên gọn gàng (có chấm báo khi LocalStorage có dữ liệu).
- Nút CTA **Gói Pro 29k** có hiệu ứng Border Beam (tia sáng chạy quanh viền).
- Tích hợp Web Audio API (0 KB file tải bên ngoài, mặc định Mute, có nút toggle âm thanh trên Navbar) phát âm thanh công nghệ, tiếng laser, nhịp tim dồn dập (stress heartbeat) và tiếng lửa cháy.

### R2. Hero Section 3D WebGL & Interactive Persona Switcher
- Tích hợp Three.js / WebGL Canvas thuần tối ưu React 19 / Next.js 15:
  - Tờ CV Hologram 3D lơ lửng phản ứng theo tọa độ chuột (Mouse Parallax).
  - Tia Laser quét liên tục từ trên xuống, phân rã các khối câu chữ sáo rỗng thành hạt sáng và tái sinh thành thanh ngọc chuẩn ATS.
  - 500+ hạt Ember Particles lơ lửng, kéo giãn nhẹ khi cuộn trang nhanh.
- Interactive Persona Switcher: `[ 🔥 Chế độ Mỏ Hỗn | 🧊 Chế độ Chuyên Gia | ⚡ Áp Lực Phòng Thi ]` chuyển đổi màu nền ambient và mood tức thì.
- Tiêu đề Text Scramble / Glitch nhẹ, 2 nút CTA Magnetic (`🔥 Thử Roast CV ngay` và `⏱️ Thử thách phỏng vấn áp lực`).
- Bảo tồn câu tuyên bố miễn trừ trách nhiệm hợp chuẩn (`chỉ mang tính chất tham khảo luyện tập...`) dưới dạng tooltip hoặc dòng chú thích tinh tế.

### R3. Live Roast Teaser & Bento Grid Bảo Mật Động
- **Live Roast Teaser**:
  - Ô nhập nhanh 1 câu kinh nghiệm (tối đa 250 ký tự) ngay trên trang chủ kèm 4 câu ví dụ mẫu bấm ăn liền.
  - API route siêu tốc `POST /api/roast/teaser` gọi Gemini Flash xử lý phản hồi trong ~500ms (trả về lời chê sâu cay và câu viết lại chuẩn ATS) kèm rate limit 3 lần/ngày và deterministic offline fallback.
- **Bento Grid Bảo mật 4 ô**:
  - Ô 1: Sơ đồ luồng SVG động (CV ➔ RAM Server ➔ Kết quả ➔ Tự hủy sau 0.1s, không qua ổ cứng).
  - Ô 2: Terminal giả lập log `[REDACTED_BY_ZERO_RETENTION]`.
  - Ô 3: Interactive Demo xóa dữ liệu 1-chạm (Thanos Snap tan biến thành cát rồi khôi phục).
  - Ô 4: Preview tự động làm mờ PII (SĐT, Email) khi hover.

### R4. CV Hall of Shame, Dual Portal Cards, Diff Slider & RPG Share Card
- **Ticker Marquee "CV Hall of Shame"**: Dải chạy ngang hiển thị các câu chém gió hài hước đã ẩn danh kèm bình luận mỉa mai của AI.
- **Dual Portal Cards (3D Tilt Cards)**:
  - Thẻ Roast CV có thanh trượt đọc thử 1 câu nhận xét spicy mẫu.
  - Thẻ Stress Interview có đồng hồ đếm ngược `00:59` nhảy số và câu hỏi gõ chữ máy tính.
- **Interactive Diff Slider**: Thanh trượt kéo Before / After so sánh câu cũ gạch đỏ và câu sửa xanh lá có `[placeholder]`.
- **Nâng cấp Share Card dạng RPG / Spotify Wrapped**: Thêm Điểm sinh tồn CV (`/100`) và danh hiệu hài hước (*"Chúa tể sáo rỗng"*, *"Chiến thần kỹ năng mềm"*, *"Kẻ hủy diệt vòng gửi xe"*).
- Tích hợp Lenis Smooth Scroll tạo độ lướt quán tính cao cấp.

## Acceptance Criteria

### Functional & Visual Verification
- [ ] Floating Pill Navbar hiển thị đúng, responsive, Popover trạng thái phiên và nút xóa dữ liệu hoạt động chính xác.
- [ ] Nút Sound FX toggle trên Navbar bật/tắt Web Audio API mượt mà không phát sinh lỗi audio context.
- [ ] Cảnh Three.js WebGL (Hologram CV quét laser + Ember Particles) chạy mượt mà 60 FPS, không lỗi crash trên React 19.
- [ ] Persona Switcher gạt đổi màu giao diện (Roast Cam / Băng Xanh Cyber) tức thì.
- [ ] Live Roast Teaser nhận diện input, 4 câu mẫu bấm ăn liền hiển thị kết quả chê & gợi ý sửa chuẩn ATS trong < 1.5s; có offline fallback khi ngắt mạng.
- [ ] Bento Grid hiển thị đầy đủ sơ đồ SVG động, Terminal log giả lập, hiệu ứng Thanos snap demo và che mờ PII.
- [ ] Ticker Marquee "CV Hall of Shame", Dual Tilt Cards, và Diff Slider hoạt động trơn tru.
- [ ] Thẻ chia sẻ RPG tạo ảnh Canvas/PNG chứa Điểm sinh tồn và Danh hiệu hài hước đúng chuẩn.
- [ ] Lenis Smooth Scroll hoạt động mượt mà, không gây xung đột với các modal hay form cuộn.

### Security, Quality & Regression Verification
- [ ] Toàn bộ bộ test hiện tại (39 test suites, 635 tests) cùng các test mới bổ sung đạt **100% PASS**.
- [ ] `npm run type-check` (`tsc --noEmit`) đạt **0 diagnostic errors**.
- [ ] `npm run build` biên dịch sạch sẽ không có lỗi Next.js 15 hay ESLint error.
- [ ] Duy trì nguyên tắc Zero-PII Server Logging trên mọi API route mới (`/api/roast/teaser`).

## Follow-up — 2026-10-16T11:49:32Z

Triển khai toàn diện kế hoạch Plan_v2 (Fix & Feature) cho AI Roast CV: Tái cấu trúc quyền riêng tư trung thực, trang /privacy, bộ lọc PII client-side với chip preview, System Prompt 1-request đa năng chống hallucination số liệu, phòng phỏng vấn áp lực State Machine 5 bước (/interview), và Modal xuất thẻ chia sẻ viral html-to-image (/roast).

Working directory: d:\MyProjects\MyProjectToMoney\AI ROAST CV
Integrity mode: development

## Requirements

### R1. P0: Quyền Riêng Tư Trung Thực, Trang /privacy & Client-Side PII Masker
- Viết lại cam kết quyền riêng tư trung thực: Nói rõ dữ liệu CV được gửi tới Google Gemini theo chính sách API của Google, không tuyên bố "RAM tự hủy sau 0.1s" hay "100% Client Verified" gây rủi ro pháp lý. Tạo trang `/privacy` đầy đủ chính sách.
- Xây dựng `lib/utils/pii-masker.ts` lọc SĐT Việt Nam (+84, 03x-09x), Email, CCCD 12 số, URL cá nhân trước khi gửi payload lên server; hiển thị chip preview `ngu***@gmail.com`, `098****123` trên UI nộp CV kèm checkbox xác nhận đồng ý.
- Cơ chế Rate Limit tự chủ (Self-contained): Dùng Server-side Salted Token Bucket + Encrypted Cookie + Input length limit (không phụ thuộc Redis bên ngoài).

### R2. P1: System Prompt 1-Request Đa Năng & Chống Bịa Số Liệu
- Nâng cấp System Prompt và Gemini Response Schema: Sinh trọn gói Kết quả Roast + 3-5 thẻ mổ xẻ lỗi + 3 câu hỏi phỏng vấn áp lực tùy biến theo CV trong 1 lượt gọi duy nhất.
- Chống hallucination số liệu: Khi viết lại câu chuẩn ATS, bắt buộc dùng placeholder dạng `[X]%`, `[A]ms → [B]ms`, tuyệt đối không tự bịa con số giả.
- Phân cách input người dùng bằng delimiter `<<<USER_CV>>>` để triệt tiêu tấn công Prompt Injection ("Ignore previous instructions...").

### R3. P1.4 & P2.1: Phòng Phỏng Vấn Áp Lực Tuần Tự (PressureInterviewRoom)
- Tái cấu trúc `/interview` thành máy trạng thái 5 giai đoạn: Lobby -> Đọc đề (5s) -> Trả lời có đồng hồ 90s (viền đỏ nhấp nháy khi < 20s) -> Chấm điểm -> Tổng kết STAR.
- Bắt sự kiện `onPaste` chặn copy từ ChatGPT kèm lời cảnh cáo hài hước từ HR.
- Tự động thu bài khi hết giờ (giữ nguyên câu đang gõ dở); chấm điểm STAR và cung cấp câu trả lời mẫu 10/10.
- Kết nối thông suốt `/roast` -> `/interview`: Nút "Luyện phỏng vấn từ chính CV này" truyền 3 câu hỏi cá nhân hóa qua `sessionStorage`.

### R4. P2.2: Viral Roast Share Modal (html-to-image)
- Cài đặt `html-to-image` và xây dựng `RoastShareModal.tsx` tại `/roast`: Cho phép xuất ảnh 1:1 (Threads/FB) và 9:16 (Story/TikTok) trực tiếp tại trình duyệt.
- Tự động bật chế độ ẩn danh (biệt danh vui: *"Fresher Hệ Tâm Linh"*, *"Chiến Thần Rải CV"*); khử khuẩn PII trong câu trích dẫn trước khi vẽ lên ảnh.
- Nút 1-click Copy ảnh vào Clipboard (desktop) và `navigator.share` (mobile) kèm nút Tải ảnh PNG.

### R5. P0.5/P0.6 & Verification: Sửa Lỗi Copy, Đồng Nhất Rubric & 100% Test Pass
- Rà soát sửa lỗi chính tả/khoảng trắng trên toàn bộ trang; đồng nhất 5 tiêu chí Rubric trên mọi màn hình.
- Viết test suites đầy đủ cho PII Masker, Gemini Schema, Interview State Machine, Share Modal; duy trì 100% test pass (`vitest`), 0 lỗi type-check, clean Next.js 15 build.

## Acceptance Criteria

### Security & Privacy
- [ ] Payload text gửi lên `/api/roast` không chứa SĐT, Email hay CCCD nguyên bản.
- [ ] Có trang `/privacy` và checkbox thỏa thuận dữ liệu trước khi tải CV lên.
- [ ] Ảnh xuất từ `RoastShareModal` và canvas không chứa thông tin cá nhân thật khi bật ẩn danh.

### Functional Integrity
- [ ] 1 lượt gọi API `/api/roast` trả về đủ cả kết quả roast và 3 câu hỏi phỏng vấn chuẩn bị sẵn.
- [ ] `/interview` vận hành mượt mà theo đúng 5 bước trạng thái, chặn paste từ ChatGPT và auto-submit khi hết 90s.
- [ ] Nút "Luyện phỏng vấn từ chính CV này" chuyển hướng mượt và nạp đúng 3 câu hỏi từ `sessionStorage`.
- [ ] Modal xuất ảnh hoạt động tốt trên desktop (Copy Clipboard) và mobile (Share API/Download).

### Quality & Regression
- [ ] 100% test pass trong test suite hiện tại và mới bổ sung (vitest).
- [ ] `npm run type-check` đạt 0 lỗi diagnostic.
- [ ] `npm run build` biên dịch thành công 100% không lỗi Next.js 15.


## 2026-10-16T14:31:11Z

Xây dựng tính năng "So Khớp JD Thực Tế & Phân Tích Lỗ Hổng Kỹ Năng" (Targeted JD Match & ATS Keyword Gap Analyzer) cho AI Roast CV: Mở rộng trang /roast cho phép nộp kèm JD (hoặc chọn mẫu có sẵn), phân tích độ lệch từ khóa ATS qua Gemini Flash 1-request, hiển thị thẻ Bento Match Score % với mô hình Freemium (mở khóa Pro 29k), và tùy biến 3 câu hỏi phỏng vấn áp lực xoáy trực diện vào khoảng trống kỹ năng giữa CV và JD.

Working directory: d:\MyProjects\MyProjectToMoney\AI ROAST CV
Integrity mode: development

## Requirements

### R1. UX Nộp JD Linh Hoạt & Bộ Mẫu JD Thực Chiến
- Tại màn hình nộp CV (app/roast/page.tsx & FileUploader.tsx): Nâng cấp trường "Vị trí ứng tuyển" thành bộ chọn 3 chế độ:
  1. Nhập nhanh tên vị trí (ví dụ: Frontend Fresher).
  2. Dán toàn bộ văn bản JD của công ty mục tiêu (hỗ trợ độ dài tối đa 3.000 ký tự).
  3. 1-Click chọn JD mẫu có sẵn từ lib/data/sample-jds.ts (Frontend React Fresher, Backend Node/Go, Digital Marketing...).
- Tích hợp bộ lọc pii-masker.ts khử khuẩn thông tin nhạy cảm trên cả văn bản JD trước khi gửi payload lên server.

### R2. Gemini Response Schema & Prompt Single-Shot Phân Tích CV x JD
- Nâng cấp lib/schemas/roast.ts và lib/gemini/prompts.ts:
  - Khi có JD được cung cấp, Gemini Flash phân tích đồng thời và trả về trường jdMatch:
    - matchScore: Điểm phần trăm tương thích tổng thể (0 - 100%).
    - breakdown: Điểm chi tiết cho hardSkillsMatch, experienceMatch, cultureMatch (0 - 100%).
    - missingKeywords: Mảng danh sách các từ khóa công nghệ, kỹ năng cứng, chứng chỉ có trong JD nhưng CV hoàn toàn thiếu.
    - tailoredRecommendations: Danh sách gợi ý cách viết lại dự án để bổ sung từ khóa vào CV mà không bịa đặt.
  - Tùy biến 3 câu hỏi phỏng vấn áp lực (interviewQuestions): Xoáy trực diện 100% vào khoảng trống giữa CV và JD (ví dụ chất vấn tại sao JD đòi hỏi tải cao Redis/Kafka mà CV chỉ có đồ án MySQL cơ bản).

### R3. Thẻ Bento Giao Diện "Phân Tích Độ Lệch JD" & Freemium Gate
- Xây dựng component thẻ Bento JdMatchCard.tsx đặt trang trọng ngay dưới bảng điểm ATS trên RoastReport.tsx:
  - Vòng đo % Match Score trực quan phong cách Cyberpunk.
  - 3 thanh đo tiến độ chi tiết: Kỹ năng cứng, Kinh nghiệm dự án, Độ phù hợp văn hóa.
  - Danh sách badge "Từ khóa tử huyệt" (Missing ATS Keywords).
- Cơ chế Freemium thông minh kết hợp Gói Pro 29k:
  - Miễn phí: Xem tổng % Match Score, 3 thanh đo và Top 3 từ khóa thiếu quan trọng nhất.
  - Người dùng có Pro Key: Mở khóa toàn bộ danh sách từ khóa ẩn + các câu gợi ý viết lại chèn từ khóa vào CV chuẩn ATS.
  - Người dùng chưa có Pro Key: Hiển thị hiệu ứng mờ kính (Blur) với nút bấm kích hoạt nhanh Pro Key 29k.

### R4. Kết Nối Phòng Phỏng Vấn Áp Lực 5 Bước (/interview)
- Khi người dùng bấm nút "⏱️ Luyện phỏng vấn từ chính CV này", truyền toàn bộ ngữ cảnh JD và 3 câu hỏi xoáy theo JD sang sessionStorage.
- PressureInterviewRoom.tsx: Hiển thị rõ badge "🎯 Phỏng vấn xoáy theo JD mục tiêu" và trích dẫn trực tiếp cả câu chữ trong CV lẫn yêu cầu trong JD làm căn cứ vặn hỏi.

### R5. Kiểm Thử Toàn Diện, Chất Lượng & Hồi Quy (Zero-Regression)
- Viết test suites đầy đủ cho JD Match Schema, UI Component JdMatchCard, cơ chế Freemium gating, và luồng nạp JD từ sample-jds.ts.
- Bảo toàn 100% test pass trên toàn bộ 73 test suites hiện có + các tests mới bổ sung.
- npm run type-check đạt 0 lỗi diagnostic.
- npm run build biên dịch thành công 100% không lỗi Next.js 15.

## Acceptance Criteria

### Functional & Visual
- [ ] Người dùng có thể chọn nhập tên vị trí nhanh, dán văn bản JD tùy chỉnh, hoặc chọn 1-click từ danh sách JD mẫu.
- [ ] Khi nộp kèm JD, báo cáo Roast hiển thị đầy đủ thẻ Bento So Khớp JD với % Match Score và 3 thanh đo chi tiết.
- [ ] Top 3 từ khóa thiếu hiển thị ở bản miễn phí; toàn bộ từ khóa ẩn và gợi ý chèn ATS mở khóa khi kích hoạt Pro Key.
- [ ] 3 câu hỏi phỏng vấn áp lực xoáy trực tiếp vào lỗ hổng giữa CV và JD, truyền mượt mà sang /interview.

### Security & Privacy
- [ ] Văn bản JD được khử khuẩn PII trước khi gửi lên API.
- [ ] Toàn bộ dữ liệu JD lưu tạm thời trong sessionStorage và tự hủy khi bấm nút Xóa dữ liệu 1-chạm.

### Quality & Regression
- [ ] 100% test pass trong test suite toàn dự án (vitest).
- [ ] npm run type-check (tsc --noEmit) đạt 0 lỗi diagnostic.
- [ ] npm run build biên dịch sạch sẽ 100%.
