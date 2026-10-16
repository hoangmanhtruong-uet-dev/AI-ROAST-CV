# Kế hoạch xây dựng AI Roast CV từ đầu đến Go-Live

## 1. Mục tiêu và nguyên tắc

Tài liệu này mô tả kế hoạch triển khai sản phẩm từ kiểm chứng ý tưởng đến phát hành bản MVP công khai. Kế hoạch được xây từ `README.md` và các tài liệu trong `docs/`; không mặc định trước framework, nhà cung cấp AI/OCR, nền tảng hosting hoặc cổng thanh toán.

Mục tiêu Go-Live đầu tiên là vận hành một ứng dụng web tiếng Việt cho sinh viên năm cuối và fresher, bao gồm:

- Roast CV từ văn bản dán vào hoặc PDF/ảnh, có bước xem và xác nhận nội dung trích xuất.
- Một lượt roast miễn phí giới hạn một trang.
- Phỏng vấn áp lực phiên bản văn bản gồm ba câu hỏi, có giới hạn thời gian và phản hồi theo rubric.
- Gợi ý cải thiện cụ thể, không tự bịa thông tin hồ sơ.
- Tạo ảnh kết quả đã ẩn danh theo thao tác chủ động của người dùng.
- Có chính sách dữ liệu, giới hạn sản phẩm, giám sát vận hành và quy trình xử lý sự cố.

Nguyên tắc xuyên suốt:

- Ưu tiên chất lượng phản hồi, quyền riêng tư và độ tin cậy trước số lượng tính năng.
- Dữ liệu CV/câu trả lời là dữ liệu không đáng tin; không xem nội dung trong tệp là chỉ thị hệ thống.
- Không ghi nội dung CV hoặc câu trả lời nguyên văn vào log/analytics.
- Không dùng thuộc tính nhạy cảm để chấm điểm; không biến “nguy cơ bị loại” thành xác suất tuyển dụng thật.
- Mọi đề xuất viết lại phải dựa trên dữ kiện người dùng cung cấp, dùng placeholder khi thiếu dữ liệu.
- Không tự động đăng nội dung lên Threads hay mạng xã hội.
- Không công bố sản phẩm nếu chưa xác định nhà cung cấp xử lý dữ liệu và thời hạn lưu trữ.

## 2. Phạm vi phiên bản đầu

### Bao gồm

- Landing page tiếng Việt mô tả rõ giá trị, giới hạn AI, cách xử lý dữ liệu và liên hệ hỗ trợ.
- Tải PDF/ảnh với kiểm tra loại tệp, chữ ký nội dung, dung lượng, số trang và lỗi tệp; hoặc dán văn bản CV.
- Trích xuất/OCR, màn hình xem trước/chỉnh sửa và bước xác nhận gửi phân tích.
- Kết quả roast có cấu trúc: trích đoạn liên quan, vấn đề, mức độ ưu tiên, lý do và đề xuất sửa.
- Kiểm tra nội dung sáo rỗng, thiếu bằng chứng, cấu trúc, khả năng đọc và các vấn đề ATS có thể phát hiện; không cam kết tương thích mọi ATS.
- Một phiên phỏng vấn gồm ba câu hỏi tình huống theo vai trò/ngành khởi đầu đã chọn.
- Đồng hồ/giới hạn thời gian hiển thị, trả lời văn bản, có thể bỏ qua hoặc dừng.
- Rubric giải thích được: cấu trúc, tính cụ thể, mức độ liên quan và nhận thức hệ quả.
- Giới hạn sử dụng miễn phí được kiểm tra phía máy chủ; giao diện thông báo rõ giới hạn một trang/một lượt.
- Xóa dữ liệu phiên và tạo ảnh chia sẻ đã ẩn danh, có màn hình xem trước.
- Đo lường sản phẩm tối thiểu, bảo vệ khỏi lạm dụng, theo dõi lỗi/chi phí mà không thu nội dung cá nhân.

### Không bao gồm trong Go-Live đầu

- Voice realtime hoặc chấm giọng nói, accent, khuôn mặt hay tốc độ gõ.
- Tự động truy cập LinkedIn, tự động ứng tuyển hoặc tích hợp tài khoản mạng xã hội.
- Tự động đăng ảnh/chia sẻ lên Threads.
- Tài khoản và lịch sử lâu dài nếu chưa chứng minh nhu cầu và thiết kế xóa dữ liệu phù hợp.
- Thanh toán thật trước khi kiểm chứng gói, giá, nhà cung cấp, hoàn tiền và trách nhiệm vận hành.
- Cam kết được tuyển dụng, vượt ATS hoặc độ chính xác tuyệt đối của đánh giá.

## 3. Các quyết định cần chốt trước khi build

Không bắt đầu triển khai tính năng phụ thuộc vào quyết định chưa chốt. Ghi kết quả và lý do trong decision log của dự án.

- Đối tượng/nhóm vai trò đầu tiên, ví dụ thực tập/fresher công nghệ hoặc marketing.
- Framework web/API, ngôn ngữ, cơ sở dữ liệu (nếu cần), quy trình build và hosting.
- Nhà cung cấp mô hình AI và OCR; vị trí xử lý, chính sách lưu trữ/huấn luyện, giới hạn tốc độ, chi phí và cơ chế fallback.
- Tệp có được lưu tạm hay xử lý trong bộ nhớ; thời hạn xóa chính xác và cách người dùng yêu cầu xóa.
- MVP có cần tài khoản hay không; ưu tiên trải nghiệm không tài khoản nếu có thể giới hạn lượt an toàn.
- Giới hạn kích thước tệp, số trang, số lượt, thời gian chờ và ngân sách AI tối đa.
- Cách thu thập analytics tối thiểu và thời hạn lưu sự kiện.
- Ngôn ngữ/điều khoản quyền riêng tư, điều khoản sử dụng, hỗ trợ người dùng và quy trình xử lý yêu cầu dữ liệu.
- Có bật thanh toán lúc phát hành hay chỉ chạy thử nghiệm nhu cầu bằng trang giới thiệu gói.

## 4. Kế hoạch theo giai đoạn

### Giai đoạn 0: Khám phá và xác nhận giả thuyết

**Mục tiêu:** Xác nhận nỗi đau, ngôn ngữ sản phẩm, nhóm người dùng đầu tiên và phạm vi đáng build.

**Công việc:**

- Phỏng vấn sinh viên năm cuối/fresher về quy trình hiện tại để sửa CV, tìm nguyên nhân không được phản hồi và luyện phỏng vấn.
- Kiểm tra giải pháp thay thế, mức độ tin tưởng vào phân tích AI và mức sẵn lòng trả 19.000–39.000 VNĐ.
- Thử thông điệp “HR khó tính/roast” với “thẳng thắn nhưng hữu ích”; xác định mức hài hước được chấp nhận.
- Chọn một nhóm ngành/vai trò ban đầu và xác định tình huống phỏng vấn phù hợp.
- Xác định chỉ số thành công, cách tuyển người thử nghiệm và nguyên tắc xin đồng ý khi dùng dữ liệu nghiên cứu.

**Đầu ra:** Chân dung người dùng, giả thuyết sản phẩm, phạm vi MVP được duyệt, danh sách câu hỏi phỏng vấn mẫu và báo cáo phát hiện.

**Điều kiện hoàn tất:** Có bằng chứng người dùng nhận diện vấn đề và có thể mô tả một tác vụ cụ thể cần sản phẩm giải quyết; nhóm/role đầu tiên được chọn.

### Giai đoạn 1: Đặc tả sản phẩm, rủi ro và kiến trúc

**Mục tiêu:** Biến ý tưởng thành yêu cầu có thể build và vận hành an toàn.

**Công việc:**

- Chuyển các yêu cầu trong `docs/mvp-requirements.md` thành user stories và tiêu chí nghiệm thu.
- Vẽ luồng upload/paste, xem trước OCR, đồng ý gửi AI, nhận kết quả, xóa dữ liệu và luồng phỏng vấn.
- Định nghĩa schema đầu ra cho roast và đánh giá phỏng vấn; xác định rubric, thang điểm và nội dung giải thích.
- Lập sơ đồ luồng dữ liệu và phân loại dữ liệu cá nhân; xác định điểm nào truyền tới nhà cung cấp bên ngoài.
- Chọn nhà cung cấp AI/OCR sau khi đánh giá quyền riêng tư, chất lượng tiếng Việt, chi phí, hạn mức và điều khoản xử lý dữ liệu.
- Quyết định kiến trúc tối thiểu, môi trường dev/staging/production, quản lý secrets, backup và logging.
- Thiết kế threat model mức MVP: tệp độc hại, prompt injection, lộ dữ liệu, spam, chi phí tăng đột biến, đầu ra gây hại.

**Đầu ra:** Đặc tả MVP, wireframe, quyết định kiến trúc/nhà cung cấp, data-flow diagram, threat checklist, schema và rubric phiên bản đầu.

**Điều kiện hoàn tất:** Các quyết định ảnh hưởng dữ liệu/chi phí/kiến trúc đã có chủ sở hữu và được ghi lại; không còn giả định quan trọng bị che giấu.

### Giai đoạn 2: Prototype và kiểm tra trải nghiệm

**Mục tiêu:** Kiểm tra người dùng có hiểu sản phẩm, tin phản hồi và biết hành động tiếp theo hay không.

**Công việc:**

- Tạo prototype cho landing page, chọn tính năng, upload/paste, xem trước nội dung và màn hình kết quả.
- Tạo prototype phỏng vấn ba câu với đồng hồ, trạng thái bỏ qua/dừng và đánh giá theo rubric.
- Dùng CV tổng hợp/đã ẩn danh; không dùng CV thật nếu chưa có đồng ý rõ ràng.
- Thực hiện kiểm thử tác vụ có điều phối; ghi nhận điểm người dùng hiểu sai, lo ngại về dữ liệu và mức độ hữu ích.
- Chỉnh ngôn từ roast để tránh công kích cá nhân; cung cấp giọng trung tính và lời giải thích cho đánh giá.

**Đầu ra:** Prototype cập nhật, danh sách UX issues theo mức độ, nội dung sản phẩm và luồng quyền riêng tư được kiểm tra.

**Điều kiện hoàn tất:** Người dùng thử hoàn tất các tác vụ chính mà không cần hướng dẫn liên tục; biết dữ liệu nào sẽ được gửi đi và hiểu giới hạn kết quả.

### Giai đoạn 3: Nền tảng kỹ thuật và môi trường triển khai

**Mục tiêu:** Tạo nền móng ứng dụng có thể build, kiểm thử và phát hành lặp lại.

**Công việc:**

- Khởi tạo cấu trúc repository, quy ước code, cấu hình môi trường và hướng dẫn chạy local.
- Thiết lập formatter/linter, kiểm tra kiểu (nếu stack hỗ trợ), unit test và CI cho pull request.
- Tạo môi trường development, staging và production tách biệt; secrets không được commit vào source.
- Thiết lập deployment tự động có kiểm soát, domain/TLS, headers bảo mật và cấu hình CORS phù hợp.
- Thiết lập health check, error reporting có lọc dữ liệu nhạy cảm, dashboard latency/lỗi/chi phí.
- Xác định backup/restore và quy trình khôi phục cấu hình/dữ liệu cần thiết.
- Tạo trang lỗi, trạng thái loading, empty state và giới hạn dịch vụ.

**Đầu ra:** Ứng dụng khung chạy local/staging, CI xanh, quy trình deploy, secrets/configuration checklist và hướng dẫn vận hành.

**Điều kiện hoàn tất:** Có thể triển khai một thay đổi lên staging qua pipeline; lỗi triển khai được phát hiện và có cách quay lại phiên bản trước.

### Giai đoạn 4: Xây dựng Roast CV

**Mục tiêu:** Hoàn thiện luồng CV an toàn từ đầu vào đến gợi ý có căn cứ.

**Công việc:**

- Xây giao diện paste/upload và giải thích định dạng, dung lượng, số trang, dữ liệu sẽ gửi.
- Kiểm tra MIME thực tế và chữ ký file, giới hạn dung lượng/trang, từ chối file lỗi hoặc không hỗ trợ.
- Tích hợp trích xuất PDF/OCR ảnh; xử lý trang không đọc được, xoay ảnh và văn bản trống.
- Hiển thị toàn bộ văn bản trích xuất cho người dùng chỉnh sửa trước khi gửi phân tích.
- Xây API điều phối phân tích, giới hạn tần suất, hạn mức miễn phí và timeout.
- Dùng prompt phiên bản hóa và schema có kiểm tra để tạo nhận xét theo bằng chứng.
- Kiểm tra đầu ra: không có bằng chứng thì hỏi thêm; gợi ý viết lại dùng placeholder, không tự tạo số liệu/thành tích.
- Hiển thị mức độ ưu tiên, lý do, gợi ý hành động, giới hạn một trang và trạng thái lỗi rõ ràng.
- Xóa file và nội dung tạm sau xử lý theo chính sách đã định; không ghi payload vào log.

**Đầu ra:** Luồng roast CV hoàn chỉnh trên staging, test tệp và bộ đánh giá chất lượng với dữ liệu tổng hợp/được phép sử dụng.

**Điều kiện hoàn tất:** Các tiêu chí upload, preview, xác nhận, phân tích, xóa dữ liệu, hạn mức và xử lý lỗi trong `docs/mvp-requirements.md` đều đạt.

### Giai đoạn 5: Xây dựng phỏng vấn áp lực

**Mục tiêu:** Cung cấp phiên luyện văn bản có cấu trúc, phản hồi hữu ích và không giả vờ dự đoán tuyển dụng.

**Công việc:**

- Chọn vai trò/ngành khởi đầu và xây bộ câu hỏi tình huống đã được rà soát.
- Xây phiên ba câu hỏi, trạng thái bắt đầu/đang trả lời/hết giờ/bỏ qua/hoàn tất.
- Hiển thị đồng hồ; cho phép kết thúc phiên và làm rõ thời gian chỉ là thiết lập luyện tập.
- Xây rubric công khai gồm cấu trúc, cụ thể, liên quan và nhận thức hệ quả.
- Trả phản hồi tách riêng điểm tốt, phần thiếu, ví dụ cải thiện và câu hỏi đào sâu.
- Nếu hiển thị “nguy cơ bị loại”, đặt cạnh đó giải thích đây là mô phỏng theo rubric, không phải xác suất hoặc quyết định tuyển dụng.
- Không chấm tốc độ gõ, giọng nói, accent, tuổi, giới tính, trường học hay thuộc tính nhạy cảm.

**Đầu ra:** Phiên phỏng vấn hoàn chỉnh, bộ câu hỏi/rubric có version và bộ test cho các kiểu câu trả lời.

**Điều kiện hoàn tất:** Người dùng có thể hoàn tất/dừng phiên; điểm số có giải thích; đầu ra không dựa trên thuộc tính bị loại trừ.

### Giai đoạn 6: Hạn mức, chia sẻ và hoàn thiện sản phẩm

**Mục tiêu:** Hoàn thiện hành trình sử dụng, giá trị miễn phí và cơ chế chia sẻ an toàn.

**Công việc:**

- Thực thi hạn mức miễn phí phía máy chủ; thiết kế hành vi khi hết hạn mức và chống lạm dụng cơ bản.
- Nếu thử gói trả phí, trước tiên hiển thị trang gói/giá giả lập hoặc thu đăng ký quan tâm, không thu tiền thật cho tới khi quy trình thương mại sẵn sàng.
- Xây chức năng tạo ảnh kết quả; mặc định loại bỏ tên, email, số điện thoại, URL và nội dung định danh phổ biến.
- Cho người dùng xem trước, chỉnh sửa hoặc hủy trước khi tải ảnh; không tự động đăng lên nền tảng.
- Hoàn thiện trang giới thiệu, FAQ, điều khoản, quyền riêng tư, giới hạn AI, liên hệ hỗ trợ và báo cáo nội dung có vấn đề.
- Rà soát responsive, khả năng truy cập cơ bản, trạng thái loading/empty/error và ngôn ngữ tiếng Việt.

**Đầu ra:** Hành trình sản phẩm hoàn chỉnh, trang pháp lý/chính sách và chức năng chia sẻ có xem trước.

**Điều kiện hoàn tất:** Người dùng hiểu hạn mức/gói; ảnh chia sẻ không lộ dữ liệu cá nhân trong các ca test đã định; mọi thao tác chia sẻ đều do người dùng chủ động.

### Giai đoạn 7: Kiểm thử chất lượng, bảo mật và beta kín

**Mục tiêu:** Phát hiện lỗi sản phẩm, rủi ro dữ liệu và vấn đề chất lượng AI trước khi công khai.

**Công việc kiểm thử:**

- Unit/integration test cho xác thực file, giới hạn trang, hạn mức, schema AI, xóa dữ liệu và xử lý lỗi nhà cung cấp.
- End-to-end test cho roast CV, phỏng vấn, dừng phiên, xóa dữ liệu và tạo ảnh chia sẻ.
- Kiểm tra file giả phần mở rộng, file quá lớn, PDF lỗi, ảnh không đọc được, OCR sai, nội dung trống và prompt injection.
- Kiểm tra đầu ra bịa thành tích, thiên lệch, công kích cá nhân, lời khuyên thiếu căn cứ và câu trả lời ngoài phạm vi.
- Kiểm tra redaction ảnh với tên/email/điện thoại/URL và ca false positive/false negative.
- Kiểm tra quyền truy cập, rate limit, secrets, CORS/headers, dependency vulnerabilities và dữ liệu log.
- Kiểm tra hiệu năng, timeout, giới hạn đồng thời, hành vi khi AI/OCR mất kết nối và ngân sách chi phí.
- Thử backup/restore hoặc xác nhận dữ liệu phiên không lưu lâu dài nên không cần restore nội dung người dùng.
- Thử với nhóm beta nhỏ, CV tổng hợp hoặc CV có đồng ý; có kênh hỗ trợ và quy trình xử lý lỗi.

**Đầu ra:** Báo cáo test, danh sách lỗi đã xử lý/chấp nhận, đánh giá beta, bộ prompt/rubric đạt chất lượng tối thiểu và go-live checklist.

**Điều kiện hoàn tất:** Không còn lỗi nghiêm trọng/cao chưa xử lý liên quan đến bảo mật, lộ dữ liệu, thanh toán hoặc đầu ra có thể gây hại; beta có thể hoàn tất tác vụ chính.

### Giai đoạn 8: Chuẩn bị Go-Live

**Mục tiêu:** Xác nhận đội ngũ, sản phẩm và vận hành sẵn sàng cho người dùng công khai.

**Công việc:**

- Chốt phạm vi phát hành và bật/tắt từng tính năng qua cấu hình/feature flag nếu có.
- Chốt domain, TLS, email liên hệ, thông tin hỗ trợ, trang chính sách và thông báo giới hạn AI.
- Xác minh hợp đồng/cấu hình nhà cung cấp AI/OCR; kiểm tra điều khoản dùng dữ liệu, vùng lưu trữ, retention và xử lý sự cố.
- Thiết lập secrets production, quyền truy cập quản trị tối thiểu, rate limits và ngân sách/cảnh báo chi phí.
- Kiểm tra analytics chỉ thu sự kiện cần thiết, không có nội dung CV/câu trả lời hoặc định danh không cần thiết.
- Chạy smoke test production trước khi mở cho công chúng; xác minh upload, preview, phân tích, phỏng vấn, xóa và hỗ trợ.
- Chuẩn bị rollback: phiên bản ổn định trước đó, cách tắt AI/upload/phỏng vấn, người quyết định và tiêu chí dừng.
- Chuẩn bị thông báo phát hành trung thực, không hứa hẹn tuyển dụng hay “vượt ATS”.
- Nếu có thanh toán: chỉ bật sau khi test sandbox, xác minh webhook/chống giao dịch trùng, xác nhận giá/hoàn tiền/hỗ trợ và đối soát.

**Đầu ra:** Biên bản go/no-go, release candidate, runbook vận hành, danh sách liên hệ và thông báo ra mắt.

**Điều kiện hoàn tất:** Tất cả mục bắt buộc trong checklist Go-Live bên dưới được đánh dấu đạt; người phụ trách phát hành đồng ý mở traffic.

### Giai đoạn 9: Go-Live và theo dõi sau phát hành

**Mục tiêu:** Mở dịch vụ theo từng bước, quan sát sức khỏe hệ thống và phản hồi người dùng.

**Công việc:**

- Phát hành canary/nhóm nhỏ trước nếu nền tảng hỗ trợ; tăng traffic dần khi không có lỗi nghiêm trọng.
- Chạy smoke test sau deploy và theo dõi uptime, lỗi, độ trễ, tỷ lệ hoàn tất, chi phí AI và yêu cầu xóa.
- Kiểm tra feedback hỗ trợ, báo cáo nội dung gây hại và tín hiệu OCR/AI sai.
- Dừng tính năng liên quan nếu phát hiện lộ dữ liệu, bùng chi phí, lỗi thanh toán hoặc đầu ra rủi ro.
- Tổng kết sau phát hành, phân loại lỗi theo mức độ và cập nhật roadmap dựa trên dữ liệu thật.

**Đầu ra:** Bản MVP hoạt động công khai có giám sát, báo cáo sau phát hành và kế hoạch cải tiến ưu tiên.

## 5. Tiêu chí kiểm thử và chất lượng AI

### Roast CV

- Có thể từ chối tệp không hỗ trợ/hỏng/quá giới hạn mà không làm lộ thông tin nội bộ.
- Văn bản OCR được người dùng xem và sửa trước khi gửi phân tích.
- Nhận xét chỉ ra bằng chứng hoặc tuyên bố không đủ thông tin.
- Không tự tạo số liệu, thành tích, vai trò, bằng cấp hay kỹ năng.
- Mỗi vấn đề có lý do và đề xuất hành động; không chỉ đưa lời chê chung chung.
- Hạn mức một trang/một lượt được kiểm tra phía máy chủ, kể cả khi gọi API trực tiếp.

### Phỏng vấn

- Bộ câu hỏi được rà soát về liên quan nghề nghiệp, mức độ phù hợp và không xâm phạm riêng tư.
- Rubric và thang điểm nhất quán trên bộ câu trả lời test.
- Đánh giá giải thích bằng nội dung câu trả lời, không bằng tốc độ nhập hoặc thuộc tính người dùng.
- Điểm nguy cơ được mô tả là mô phỏng; không khẳng định chắc chắn kết quả tuyển dụng.
- Cho phép bỏ qua, dừng và thoát mà không mất kiểm soát phiên.

### Quyền riêng tư và bảo mật

- Không ghi CV/câu trả lời nguyên văn vào logs, analytics hoặc crash reports.
- Nhà cung cấp xử lý dữ liệu và thời hạn lưu trữ được công bố trước khi upload.
- File tạm được xóa theo chính sách; thao tác xóa được kiểm chứng.
- Tệp được coi là dữ liệu không đáng tin; test prompt injection và file giả mạo đã chạy.
- Không lưu bí mật trong repository; quyền quản trị production theo nguyên tắc tối thiểu.
- Có rate limit và cảnh báo chi phí/abuse.

## 6. Checklist Go-Live

### Sản phẩm

- [ ] Landing page mô tả đúng MVP, đối tượng, giới hạn và giá (nếu có).
- [ ] Upload/paste, preview, xác nhận gửi AI, kết quả và xóa dữ liệu hoạt động trên thiết bị desktop/mobile hỗ trợ.
- [ ] Phỏng vấn ba câu hỏi, timer, dừng/bỏ qua và rubric hoạt động.
- [ ] Hạn mức miễn phí được kiểm tra phía máy chủ và có thông báo rõ.
- [ ] Ảnh chia sẻ có preview, không tự đăng và đã kiểm tra che dữ liệu cá nhân.
- [ ] Điều khoản, quyền riêng tư, giới hạn AI và liên hệ hỗ trợ được công khai.

### Kỹ thuật và vận hành

- [ ] CI/test/build production thành công trên commit phát hành.
- [ ] Domain/TLS, health checks, error reporting và giám sát đã xác minh.
- [ ] Secrets production được cấu hình an toàn và không nằm trong source/log.
- [ ] Rate limits, hạn mức chi phí và cảnh báo đã thử.
- [ ] Log/analytics không chứa CV, câu trả lời nguyên văn hoặc định danh không cần thiết.
- [ ] Có hướng dẫn rollback/tắt tính năng và người trực xử lý sự cố.
- [ ] Smoke test hoàn tất sau deploy; phiên bản trước có thể khôi phục.

### AI, dữ liệu và nhà cung cấp

- [ ] Nhà cung cấp AI/OCR, vùng xử lý, retention và chính sách dữ liệu đã được rà soát.
- [ ] Người dùng được thông báo dữ liệu nào được gửi trước khi xác nhận.
- [ ] Bộ test chống bịa thông tin, công kích, thiên lệch và prompt injection đạt ngưỡng nội bộ.
- [ ] Quy trình yêu cầu xóa và thời hạn xóa đã được xác nhận end-to-end.
- [ ] Không dùng dữ liệu người dùng để huấn luyện nếu chưa có đồng ý riêng phù hợp.

### Thanh toán (chỉ áp dụng nếu bật)

- [ ] Giá, mô tả gói, điều kiện sử dụng và hoàn tiền được công khai.
- [ ] Sandbox, webhook, chống xử lý trùng, email/biên nhận và đối soát đã kiểm thử.
- [ ] Có quy trình hỗ trợ giao dịch lỗi và hoàn tiền.
- [ ] Thanh toán có thể bị tắt độc lập nếu phát hiện sự cố.

Go-Live chỉ được duyệt khi các mục bắt buộc đều đạt hoặc có ngoại lệ được ghi rõ với người chịu trách nhiệm và biện pháp giảm thiểu. Không phát hành nếu còn nguy cơ nghiêm trọng về lộ CV, quyền riêng tư hoặc đầu ra có thể gây hại chưa được xử lý.

## 7. Chỉ số sau Go-Live

Thu thập ở mức tối thiểu, ưu tiên dữ liệu tổng hợp và không lưu nội dung đầu vào.

- Tỷ lệ bắt đầu/hoàn tất roast và phỏng vấn.
- Lỗi upload/OCR, lỗi API, timeout và độ trễ theo tính năng.
- Tỷ lệ người dùng áp dụng ít nhất một gợi ý nếu có thể đo mà không lưu CV.
- Tỷ lệ quay lại trong 7 ngày.
- Tỷ lệ phản hồi tiêu cực, báo cáo gây hại và yêu cầu hỗ trợ/xóa dữ liệu.
- Chi phí AI/OCR trên mỗi phiên hoàn tất và tổng chi phí theo ngày.
- Chuyển đổi trả phí chỉ khi thanh toán được bật hợp lệ.

Đặt ngưỡng cảnh báo trước khi mở rộng traffic. Không tối ưu viral hoặc chuyển đổi bằng cách giảm minh bạch dữ liệu hay tăng áp lực tâm lý.

## 8. Rủi ro và phương án ứng phó

| Rủi ro | Tín hiệu | Ứng phó |
|---|---|---|
| OCR sai làm phản hồi sai | Người dùng sửa nhiều, báo cáo trích xuất lỗi | Dừng gửi tự động; yêu cầu xem/sửa; cải thiện OCR và thông báo chất lượng |
| AI bịa thành tích hoặc hướng dẫn khai gian | Kết quả không có bằng chứng từ đầu vào | Tắt prompt/model liên quan; siết schema/guardrails; rà soát bộ test trước khi bật lại |
| Lộ CV hoặc retention ngoài dự kiến | Nội dung xuất hiện trong log/nhà cung cấp lưu quá hạn | Tắt upload/AI, cô lập sự cố, thực hiện runbook và nghĩa vụ thông báo phù hợp |
| Nội dung roast gây tổn thương | Báo cáo hoặc feedback tăng | Chuyển giọng trung tính mặc định, sửa nội dung và bổ sung cơ chế dừng/báo cáo |
| Điểm phỏng vấn bị hiểu là quyết định tuyển dụng | Người dùng hiểu điểm là xác suất thật | Sửa nhãn/copy, hiển thị giới hạn ngay cạnh điểm, cân nhắc bỏ nhãn nguy cơ |
| Chi phí AI tăng đột biến | Chi phí/phiên hoặc tổng chi phí vượt ngưỡng | Siết rate limit/hạn mức, tạm tắt tính năng tốn kém, kiểm tra lạm dụng |
| Nhà cung cấp gián đoạn | Lỗi/timeout tăng | Thông báo trạng thái, retry có giới hạn, fallback an toàn hoặc tạm dừng tính năng |
| Thanh toán lỗi/trùng | Webhook lỗi hoặc trạng thái gói không khớp | Tắt thu tiền, đối soát, xử lý hoàn tiền và khôi phục trạng thái chính xác |

## 9. Rollback và điều kiện dừng

Rollback hoặc tắt tính năng ngay khi có một trong các điều kiện:

- Có bằng chứng CV/câu trả lời cá nhân bị lộ hoặc lưu trái chính sách.
- Hệ thống tạo hướng dẫn có thể khiến người dùng khai gian, hoặc nội dung xúc phạm/rủi ro tăng vượt ngưỡng nội bộ.
- Chi phí hoặc lạm dụng vượt hạn mức vận hành đã duyệt.
- Lỗi nghiêm trọng làm mất dữ liệu, xử lý thanh toán sai hoặc không thể thực hiện yêu cầu xóa.
- Nhà cung cấp thay đổi điều khoản/quy trình xử lý dữ liệu chưa được đánh giá.

Thứ tự ứng phó: giới hạn/tắt tính năng gây lỗi, bảo vệ dữ liệu và giao dịch, thông báo người phụ trách, thu thập log không nhạy cảm, khôi phục phiên bản ổn định, xác minh lại bằng smoke test, sau đó mới mở lại với phê duyệt.

## 10. Sau MVP

Chỉ đưa vào roadmap sau khi dữ liệu thử nghiệm chứng minh nhu cầu và đội ngũ đánh giá đủ khả năng vận hành:

- Gói phỏng vấn theo ngành/công ty và viết lại CV trả phí 19.000–39.000 VNĐ.
- Mở rộng bộ câu hỏi và template theo vai trò.
- Voice sau khi kiểm chứng quyền riêng tư, độ chính xác và cách đánh giá không thiên lệch.
- Nâng chất lượng phân tích ATS bằng bộ tài liệu mẫu được phép sử dụng; không tuyên bố hỗ trợ mọi ATS.
- Tài khoản/lịch sử nếu người dùng cần và có cơ chế lưu/xóa minh bạch.
- Chia sẻ/referral chỉ sau khi ẩn danh và consent được kiểm thử với dữ liệu thực tế.

Tham chiếu phạm vi, yêu cầu và nguyên tắc nội dung tại `docs/product-brief.md`, `docs/mvp-requirements.md`, `docs/roadmap.md`, `docs/technical-overview.md` và `docs/content-guidelines.md`.
