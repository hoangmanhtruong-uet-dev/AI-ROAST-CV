import { RoastData } from '@/lib/schemas/roast';

export const MOCK_EXTRACTED_CV = `NGUYỄN VĂN A
Email: nguyenvana@example.com | Điện thoại: 0912345678 | Địa chỉ: Hà Nội
LinkedIn: linkedin.com/in/nguyenvana | GitHub: github.com/nguyenvana

MỤC TIÊU NGHỀ NGHIỆP:
Sinh viên năm cuối nhiệt tình, chăm chỉ, ham học hỏi, có khả năng chịu áp lực cao. Tìm kiếm cơ hội thực tập vị trí Frontend Developer để cống hiến hết mình cho công ty.

HỌC VẤN:
Đại học Bách Khoa Hà Nội (2022 - 2026)
Chuyên ngành: Công nghệ Thông tin - GPA: 3.2/4.0

KINH NGHIỆM DỰ ÁN:
1. Website Thương mại điện tử (Dự án cá nhân)
- Xây dựng giao diện web bán hàng thời trang bằng React và Tailwind CSS.
- Tích hợp API giỏ hàng và thanh toán.
- Giúp cải thiện trải nghiệm người dùng đáng kể.

2. Ứng dụng Quản lý công việc (Đồ án môn học)
- Viết bằng Next.js và Node.js.
- Quản lý trạng thái bằng Zustand.
- Được giảng viên đánh giá tốt.

KỸ NĂNG:
- Lập trình: JavaScript, TypeScript, HTML5, CSS3, React, Next.js
- Công cụ: Git, VS Code, Postman, Figma
- Kỹ năng mềm: Giao tiếp tốt, làm việc nhóm, thành thạo tin học văn phòng`;

export function getMockRoastData(tone: 'spicy' | 'constructive'): RoastData {
  if (tone === 'spicy') {
    return {
      overallScore: 58,
      tone: 'spicy',
      summaryVerdict:
        'CV của bạn như một bức thư tình gửi cho mọi nhà tuyển dụng: đầy ắp những lời hứa hẹn sáo rỗng nhưng thiếu sạch số liệu thực tế. Viết "ham học hỏi, chịu áp lực cao" trong năm 2026 thì chỉ đủ gây áp lực cho người đọc thôi!',
      topStrengths: [
        'Đã tiếp cận công nghệ thực tế (Next.js, TypeScript, Tailwind CSS) thay vì chỉ học lý thuyết trường lớp.',
        'Bố cục ngắn gọn, rõ ràng, không bị nhồi nhét quá nhiều trang.',
      ],
      weaknesses: [
        {
          quote: 'Sinh viên năm cuối nhiệt tình, chăm chỉ, ham học hỏi, có khả năng chịu áp lực cao.',
          issue: 'Dùng văn mẫu sáo rỗng 100% người xin việc đều viết, không tạo được sự khác biệt.',
          severity: 'Cao',
          rejectionReason:
            'Nhà tuyển dụng đọc câu này hàng nghìn lần mỗi ngày. Nó không chứng minh được bạn giải quyết được bài toán gì cho doanh nghiệp.',
          fixGuideline:
            'Thay bằng: Sinh viên năm cuối CNTT định hướng [Frontend Developer], có kinh nghiệm xây dựng [X] ứng dụng web với [React / Next.js] và tối ưu hóa [tốc độ tải trang / SEO].',
        },
        {
          quote: 'Giúp cải thiện trải nghiệm người dùng đáng kể.',
          issue: 'Tuyên bố cảm tính, hoàn toàn không có số liệu đo lường kiểm chứng.',
          severity: 'Cao',
          rejectionReason:
            'Từ "đáng kể" là tín hiệu cảnh báo của việc nói quá mà không có dẫn chứng. Nhà tuyển dụng kỹ thuật cần dữ liệu định lượng.',
          fixGuideline:
            'Thay bằng: Tối ưu kích thước bundle giảm [X%] và cải thiện chỉ số Core Web Vitals (LCP) xuống dưới [1.5s] cho [số lượng người dùng thử nghiệm] người dùng.',
        },
        {
          quote: 'Kỹ năng mềm: Giao tiếp tốt, làm việc nhóm, thành thạo tin học văn phòng',
          issue: 'Liệt kê kỹ năng hiển nhiên của thế kỷ 20 thay vì các kỹ năng kỹ thuật có giá trị.',
          severity: 'Trung bình',
          rejectionReason:
            'Lập trình viên ghi "thành thạo tin học văn phòng" khiến hồ sơ bị hạ giá trị, trông giống nhân viên nhập liệu hơn kỹ sư phần mềm.',
          fixGuideline:
            'Thay bằng việc làm rõ quy trình: Làm việc nhóm theo mô hình [Agile / Scrum], review mã nguồn qua [Git Pull Requests], và phối hợp qua [Jira / Slack].',
        },
      ],
      atsRecommendations: [
        {
          category: 'Từ khóa',
          recommendation:
            'Bổ sung các từ khóa kỹ thuật chuyên sâu liên quan đến JD (ví dụ: RESTful API, State Management, Responsive Design, Web Performance).',
          impact: 'Quan trọng',
        },
        {
          category: 'Cấu trúc',
          recommendation:
            'Đổi tên mục "Kinh nghiệm dự án" thành "Dự án thực tế" hoặc "Kinh nghiệm làm việc" để bot ATS dễ nhận diện trường dữ liệu.',
          impact: 'Quan trọng',
        },
        {
          category: 'Định dạng',
          recommendation:
            'Dùng định dạng danh sách có dấu đầu dòng chuẩn (-) thay vì icon hoặc ký tự đặc biệt có thể làm bot ATS parse lỗi.',
          impact: 'Nên làm',
        },
        {
          category: 'Độ dài',
          recommendation:
            'Duy trì độ dài chính xác trong 1 trang A4, cắt bỏ thông tin không liên quan như sở thích cá nhân.',
          impact: 'Nên làm',
        },
      ],
      disclaimer:
        'Lưu ý: Kết quả phân tích do AI sinh ra dựa trên dữ liệu bạn cung cấp, chỉ mang tính chất tham khảo luyện tập và không đại diện cho quyết định tuyển dụng của bất kỳ doanh nghiệp nào.',
    };
  }

  return {
    overallScore: 68,
    tone: 'constructive',
    summaryVerdict:
      'Hồ sơ của bạn có nền tảng công nghệ cập nhật và định hướng rõ ràng. Tuy nhiên, để tạo ấn tượng mạnh với Hiring Manager và vượt qua vòng sàng lọc sơ tuyển, bạn cần định lượng hóa thành tích và cấu trúc lại các dự án theo chuẩn chuyên nghiệp.',
    topStrengths: [
      'Nền tảng học vấn vững vàng tại trường đào tạo kỹ thuật uy tín.',
      'Stack công nghệ hiện đại phù hợp với nhu cầu tuyển dụng Frontend hiện nay.',
      'Có dự án cá nhân hoàn chỉnh triển khai thực tế.',
    ],
    weaknesses: [
      {
        quote: 'Mục tiêu: Tìm kiếm cơ hội thực tập vị trí Frontend Developer để cống hiến hết mình cho công ty.',
        issue: 'Mục tiêu mang tính một chiều, chưa làm nổi bật giá trị bạn mang lại cho tổ chức.',
        severity: 'Trung bình',
        rejectionReason:
          'Nhà tuyển dụng tìm kiếm ứng viên hiểu rõ vị trí và sẵn sàng đóng góp vào mục tiêu kinh doanh hoặc sản phẩm.',
        fixGuideline:
          'Thay bằng: Kỹ sư Frontend fresher hướng tới việc áp dụng thế mạnh về [TypeScript & Next.js] để cùng team phát triển [tính năng sản phẩm], hướng tới mục tiêu [kết quả đầu ra cụ thể].',
      },
      {
        quote: 'Tích hợp API giỏ hàng và thanh toán.',
        issue: 'Mô tả nhiệm vụ đơn thuần, chưa nêu bật giải pháp kỹ thuật và thử thách đã vượt qua.',
        severity: 'Cao',
        rejectionReason:
          'Chưa thấy được năng lực giải quyết vấn đề và độ phức tạp kỹ thuật của dự án.',
        fixGuideline:
          'Thay bằng: Tích hợp cổng thanh toán [tên cổng thanh toán] với cơ chế xử lý lỗi [tên giải pháp], xử lý trung bình [X giao dịch/phút] trong môi trường sandbox.',
      },
      {
        quote: 'Được giảng viên đánh giá tốt.',
        issue: 'Nhận xét chủ quan thiếu thang đo chuẩn hóa.',
        severity: 'Thấp',
        rejectionReason:
          'Cần minh chứng cụ thể bằng điểm số đồ án hoặc xếp hạng trong lớp học.',
        fixGuideline:
          'Thay bằng: Đạt điểm [A / GPA X/4.0] đồ án chuyên ngành, xếp hạng trong top [X%] của khóa.',
      },
    ],
    atsRecommendations: [
      {
        category: 'Cấu trúc',
        recommendation:
          'Phân tách rõ ràng mục Kỹ năng chuyên môn (Hard Skills) và Công cụ phát triển (Dev Tools) để ATS phân loại chính xác.',
        impact: 'Quan trọng',
      },
      {
        category: 'Từ khóa',
        recommendation:
          'Lồng ghép các từ khóa cốt lõi của vị trí ứng tuyển vào phần mô tả dự án thay vì chỉ liệt kê ở cuối.',
        impact: 'Quan trọng',
      },
      {
        category: 'Định dạng',
        recommendation:
          'Sử dụng font chữ không chân chuẩn như Inter, Roboto hoặc Arial với cỡ chữ 10-11pt để đảm bảo tính dễ đọc.',
        impact: 'Nên làm',
      },
      {
        category: 'Độ dài',
        recommendation:
          'Dung lượng 1 trang chuẩn chỉnh, rất phù hợp cho hồ sơ sinh viên mới tốt nghiệp.',
        impact: 'Nên làm',
      },
    ],
    disclaimer:
      'Lưu ý: Kết quả phân tích do AI sinh ra dựa trên dữ liệu bạn cung cấp, chỉ mang tính chất tham khảo luyện tập và không đại diện cho quyết định tuyển dụng của bất kỳ doanh nghiệp nào.',
  };
}
