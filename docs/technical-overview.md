# Tổng quan kỹ thuật ban đầu

Tài liệu này định hướng các ranh giới hệ thống, chưa khóa framework hay nhà cung cấp. Chốt công nghệ sau khi xác định môi trường triển khai và năng lực đội ngũ.

## Thành phần logic

- Giao diện web: trang giới thiệu, tải CV, xem trước, kết quả roast, phiên phỏng vấn và trang dữ liệu/quyền riêng tư.
- API ứng dụng: xác thực đầu vào, kiểm tra hạn mức, điều phối OCR/AI và trả kết quả đã kiểm tra cấu trúc.
- Bộ xử lý tệp: xác nhận MIME thực tế, kích thước, số trang; trích xuất văn bản; từ chối tệp lỗi hoặc không hỗ trợ.
- Bộ đánh giá: prompt có phiên bản, schema kết quả và rubric đánh giá nhất quán.
- Lưu trữ: tránh lưu file gốc nếu không cần; nếu cần lưu tạm, giới hạn quyền truy cập và thời gian tồn tại.
- Đo lường: chỉ sự kiện sản phẩm tối thiểu, không ghi CV, câu trả lời nguyên văn hay thông tin định danh vào analytics/log.

## Luồng xử lý CV

1. Kiểm tra phần mở rộng và chữ ký nội dung tệp, kích thước, số trang và tần suất yêu cầu.
2. Trích xuất/OCR nội dung ở vùng xử lý được kiểm soát.
3. Hiển thị bản trích xuất để người dùng sửa và xác nhận.
4. Gửi dữ liệu tối thiểu cần thiết tới mô hình, cùng hướng dẫn không suy diễn thành tích.
5. Kiểm tra đầu ra theo schema, lọc lỗi và hiển thị kèm cảnh báo phù hợp.
6. Xóa tệp và dữ liệu tạm theo chính sách đã công bố.

## Bảo mật và quyền riêng tư

- Tệp CV là dữ liệu nhạy cảm trong thực tế; áp dụng quyền truy cập tối thiểu và mã hóa khi truyền/lưu nếu có lưu.
- Không đưa bí mật hệ thống hoặc dữ liệu cá nhân vào prompt không cần thiết.
- Không ghi nội dung tải lên vào log lỗi, analytics hoặc công cụ theo dõi phiên.
- Thiết lập giới hạn loại tệp, dung lượng, số trang, thời gian xử lý và chống spam.
- Công bố nhà cung cấp AI/OCR và cách dữ liệu được xử lý trước khi người dùng gửi CV.
- Có luồng xóa dữ liệu, thời hạn lưu trữ, quy trình xử lý sự cố và quyền quản trị giới hạn.
- Kiểm thử prompt injection trong tài liệu tải lên; coi nội dung CV là dữ liệu không đáng tin, không phải chỉ thị hệ thống.

## Chất lượng đầu ra

- Dùng schema có trường riêng cho vấn đề, mức độ, bằng chứng từ CV, lý do và đề xuất.
- Phân biệt rõ trích dẫn đầu vào với suy luận; khi không đủ bằng chứng, yêu cầu người dùng bổ sung.
- Không suy luận phẩm chất hoặc mức phù hợp dựa trên thuộc tính được bảo vệ.
- Phiên bản hóa prompt/rubric và lưu bộ dữ liệu kiểm thử tổng hợp hoặc đã được phép sử dụng.
- Theo dõi chất lượng, độ trễ, lỗi và chi phí theo tính năng, không theo nội dung cá nhân.

## Chưa quyết định

- Framework frontend/backend, cơ sở dữ liệu và nền tảng triển khai.
- Nhà cung cấp OCR, AI, lưu trữ và thanh toán.
- Có cần tài khoản/lịch sử phiên ở MVP hay không.
- Thời hạn lưu dữ liệu cụ thể sau khi rà soát pháp lý và giới hạn nhà cung cấp.
