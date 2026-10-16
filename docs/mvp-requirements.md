# Yêu cầu MVP

## Mục tiêu

Kiểm chứng liệu người tìm việc đầu sự nghiệp có sử dụng phản hồi CV và mô phỏng phỏng vấn bằng tiếng Việt, có sẵn sàng trả phí cho nội dung chuyên sâu hay không.

## Luồng người dùng

1. Người dùng vào trang giới thiệu, đọc rõ giới hạn và chính sách dữ liệu.
2. Chọn Roast CV hoặc Phỏng vấn áp lực.
3. Với Roast CV: tải PDF/ảnh trong giới hạn kích thước hoặc dán nội dung; xem lại nội dung trích xuất trước khi phân tích.
4. Nhận kết quả có cấu trúc và các đề xuất sửa.
5. Với phỏng vấn: chọn vai trò/ngành, trả lời ba câu hỏi bằng văn bản có đồng hồ đếm ngược và nhận đánh giá sau mỗi câu.
6. Có thể tải/xóa dữ liệu hoặc tạo ảnh chia sẻ đã loại thông tin cá nhân.
7. Gói trả phí được giới thiệu sau khi người dùng đã nhận giá trị miễn phí; thanh toán thật chỉ triển khai khi đã chọn và tích hợp nhà cung cấp phù hợp.

## Chức năng cần có

### Roast CV

- Hỗ trợ PDF và ảnh phổ biến; có giới hạn loại tệp, dung lượng và số trang.
- Trích xuất văn bản và cho phép người dùng kiểm tra nội dung trước khi gửi phân tích.
- Phân tích tính rõ ràng, bằng chứng/kết quả, câu sáo rỗng, cấu trúc, lỗi trình bày có thể phát hiện và khả năng đọc ATS ở mức gợi ý.
- Xếp hạng vấn đề theo mức độ ưu tiên; đưa ra lý do và gợi ý viết lại không tự thêm thành tích.
- Miễn phí tối đa một trang; giải thích rõ phần nào bị giới hạn.

### Phỏng vấn áp lực

- Chọn tối thiểu vai trò/ngành; dùng bộ câu hỏi tình huống phiên bản đầu.
- Ba câu hỏi mỗi phiên, thời gian hiển thị và cho phép trả lời bằng văn bản.
- Đánh giá theo rubric công khai: cấu trúc, cụ thể, liên quan và nhận thức về hệ quả.
- Phản hồi tách bạch điểm tốt, điểm thiếu và câu hỏi đào sâu.
- Có thể bỏ qua/dừng phiên; không dùng ngôn ngữ đe dọa hoặc công kích cá nhân.

### Tài khoản, thanh toán và nội dung

- MVP có thể thử nghiệm không cần tài khoản; nếu cần lưu lịch sử phải có cơ chế xóa.
- Ghi nhận trạng thái gói miễn phí/trả phí một cách an toàn phía máy chủ.
- Chỉ thu thập dữ liệu tối thiểu; không ghi nội dung CV vào log ứng dụng.
- Trang điều khoản, quyền riêng tư, giới hạn AI và liên hệ hỗ trợ trước khi mở rộng người dùng.

## Tiêu chí chấp nhận

- Người dùng biết rõ đầu vào nào được gửi đến dịch vụ AI trước khi xác nhận.
- CV có thể được xem lại sau trích xuất để phát hiện lỗi OCR.
- Mọi lời khuyên viết lại không được tự bịa số liệu, vai trò, kỹ năng hoặc thành tích.
- Đánh giá phỏng vấn có giải thích, không trình bày điểm “bị loại” như kết luận tuyển dụng.
- Có thể tạo/chia sẻ kết quả đã ẩn thông tin định danh; mặc định không tự đăng nội dung.
- Lỗi tải lên, tệp không hỗ trợ, nội dung trống và lỗi dịch vụ có thông báo có thể hành động.
- Có kiểm thử cho kiểm tra tệp, giới hạn trang, che dữ liệu cá nhân và rubric đánh giá.

## Rủi ro và giảm thiểu

- OCR sai: cho xem trước văn bản và sửa trước phân tích.
- AI bịa thành tích: yêu cầu chỉ dùng dữ kiện đầu vào, đánh dấu phần cần người dùng xác nhận.
- Roast gây tổn thương: nhắm vào nội dung CV/câu trả lời, không công kích người; cung cấp tùy chọn giọng điệu trung tính.
- Điểm số tạo cảm giác chắc chắn giả: công bố rubric và giới hạn ngay cạnh kết quả.
- CV chứa dữ liệu cá nhân: tối thiểu hóa lưu trữ, thời hạn xóa rõ ràng, không đưa vào log.
- Chi phí AI tăng: giới hạn độ dài/tần suất, theo dõi chi phí mỗi phiên và cung cấp thông báo lỗi.
