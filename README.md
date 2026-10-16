# AI Roast CV

*Công cụ tiếng Việt giúp sinh viên và fresher nhận phản hồi thẳng thắn, có thể hành động về CV và luyện phỏng vấn trong môi trường áp lực có kiểm soát.*


## Ý tưởng

Ứng viên đầu sự nghiệp thường gửi nhiều CV mà không biết cần sửa gì, đồng thời thiếu cơ hội luyện phỏng vấn. AI Roast CV tập trung vào hai trải nghiệm:

- **Roast CV:** tìm câu sáo rỗng, thiếu bằng chứng, vấn đề cấu trúc và đề xuất sửa theo hướng ATS-friendly mà không bịa thành tích.
- **Phỏng vấn áp lực:** mô phỏng ba câu hỏi tình huống có giới hạn thời gian, chấm theo rubric và giải thích điểm cần cải thiện.

Giọng điệu có thể sắc sảo, nhưng phản hồi phải hữu ích, tôn trọng người dùng và nhắm vào nội dung chứ không công kích cá nhân.

## Đối tượng

- Sinh viên năm 3, năm 4 tìm thực tập.
- Fresher và người mới đi làm.
- Người cần công cụ tiếng Việt, giá dễ tiếp cận để chuẩn bị hồ sơ và phỏng vấn.

## MVP dự kiến

- Tải PDF/ảnh CV hoặc dán nội dung; xem lại văn bản trích xuất trước khi phân tích.
- Một lượt roast miễn phí giới hạn một trang.
- Ba câu hỏi phỏng vấn tình huống, trả lời bằng văn bản và có đồng hồ đếm ngược.
- Đề xuất sửa theo bằng chứng, rubric giải thích được và không tự tạo thông tin ứng viên.
- Tạo ảnh kết quả đã ẩn thông tin cá nhân theo thao tác chủ động của người dùng.

## Mô hình doanh thu dự kiến

- Miễn phí một lượt roast CV giới hạn một trang.
- Gói 19.000–39.000 VNĐ cho luyện phỏng vấn theo ngành/công ty hoặc hỗ trợ viết lại CV theo chuẩn ATS.

Giá, nhu cầu và chi phí phục vụ cần được kiểm chứng trước khi triển khai thanh toán. Sản phẩm không cam kết người dùng sẽ được tuyển dụng hoặc vượt qua mọi hệ thống ATS.

## Tài liệu

- [Product brief](docs/product-brief.md): vấn đề, người dùng, giá trị và mô hình doanh thu.
- [Yêu cầu MVP](docs/mvp-requirements.md): luồng người dùng, chức năng và tiêu chí chấp nhận.
- [Kế hoạch triển khai](docs/roadmap.md): các giai đoạn, đầu ra và cổng quyết định.
- [Tổng quan kỹ thuật](docs/technical-overview.md): ranh giới hệ thống, dữ liệu và bảo mật.
- [Nguyên tắc nội dung](docs/content-guidelines.md): giọng điệu roast, rubric và chia sẻ an toàn.

## Trạng thái

Hiện tại là bộ tài liệu định hình ý tưởng và phạm vi MVP; chưa có mã nguồn ứng dụng. Công nghệ, nhà cung cấp AI/OCR, thanh toán và thời hạn lưu trữ vẫn cần được quyết định.

## Quyền riêng tư và giới hạn

CV có thể chứa dữ liệu cá nhân. Trước khi đưa sản phẩm vào thử nghiệm thực tế, cần công bố rõ dữ liệu nào được xử lý, nhà cung cấp nào nhận dữ liệu, thời hạn lưu trữ và cách yêu cầu xóa. Nội dung CV không nên được lưu trong log. Điểm đánh giá chỉ phục vụ luyện tập, không phải quyết định tuyển dụng.
