import { RoastData, JdMatchData } from '@/lib/schemas/roast';
import { InterviewQuestionData } from '@/lib/schemas/interview';

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

/**
 * Realistic mock data for Targeted JD Match & ATS Keyword Gap Analyzer (R2 / R3).
 * Used when offline/test fallback mode is active and jdText is supplied.
 */
export const MOCK_JD_MATCH_DATA: JdMatchData = {
  matchScore: 68,
  breakdown: {
    hardSkillsMatch: 65,
    experienceMatch: 60,
    cultureMatch: 80,
  },
  missingKeywords: [
    'Docker',
    'Redis',
    'CI/CD Pipeline',
    'Unit Testing (Jest/Vitest)',
    'Kubernetes',
  ],
  tailoredRecommendations: [
    'Bổ sung kinh nghiệm đóng gói ứng dụng với [Docker] trong dự án [Website Thương mại điện tử], mô tả quy trình container hóa và chạy thử nghiệm trên môi trường local.',
    'Tích hợp [Redis] làm caching layer cho các endpoint API đọc nhiều trong đồ án [Website Thương mại điện tử], tối ưu thời gian phản hồi từ [A]ms → [B]ms.',
    'Thêm các bài kiểm thử tự động với [Vitest / Jest] cho các luồng xử lý giỏ hàng và thanh toán, nâng mức độ bao phủ code lên [X]%.',
    'Mô tả quy trình tích hợp liên tục (CI/CD) sử dụng [GitHub Actions] để tự động hóa linting và testing trước khi merge pull request.',
  ],
};

/**
 * Pressure interview questions tailored directly to the candidate's CV vs JD gap.
 */
export const MOCK_JD_PRESSURE_QUESTIONS: InterviewQuestionData[] = [
  {
    questionId: 'jd-q1',
    role: 'custom',
    questionIndex: 1,
    title: 'Khoảng trống Redis/Kafka khi xử lý tải cao theo yêu cầu JD',
    scenario:
      'JD yêu cầu kinh nghiệm thiết kế hệ thống chịu tải cao với Redis cache và Kafka message queue. Tuy nhiên, trong CV bạn chỉ có đồ án Website Thương mại điện tử sử dụng MySQL đơn thuần. Nếu hệ thống đón nhận 50.000 truy vấn/giây trong đợt sale flash, kiến trúc MySQL của bạn sẽ sụp đổ thế nào và bạn bổ sung Redis/Kafka vào đâu?',
    pressureContext:
      'Technical Lead chỉ trích giải pháp của bạn chỉ là bài tập sinh viên, đòi hỏi chứng minh tư duy chịu tải thực tế trong 90 giây.',
    timeLimitSeconds: 90,
  },
  {
    questionId: 'jd-q2',
    role: 'custom',
    questionIndex: 2,
    title: 'Thiếu sót quy trình CI/CD và Unit Testing tự động',
    scenario:
      'Vị trí tuyển dụng yêu cầu nghiêm ngặt văn hóa kiểm thử tự động (Jest/Vitest) và triển khai tự động qua CI/CD Pipeline. Trong CV bạn hoàn toàn không nhắc đến việc viết test hay automation. Nếu bạn merge một đoạn code làm sập luồng thanh toán trên môi trường staging của công ty mà không có test guard, bạn giải trình ra sao?',
    pressureContext:
      'DevOps Lead yêu cầu bạn viết nhanh một luồng test case và pipeline yaml ngay trong buổi phỏng vấn dưới áp lực 75 giây.',
    timeLimitSeconds: 75,
  },
  {
    questionId: 'jd-q3',
    role: 'custom',
    questionIndex: 3,
    title: 'Khoảng trống Docker & Triển khai đám mây (Cloud/Containerization)',
    scenario:
      'JD yêu cầu ứng viên thành thạo container hóa ứng dụng bằng Docker và am hiểu quy trình triển khai Cloud. CV của bạn chỉ đề cập chạy ứng dụng local. Khi khách hàng báo lỗi phiên bản môi trường production khác local ("It works on my machine"), bạn xử lý sự cố và chuẩn hóa Dockerfile thế nào?',
    pressureContext:
      'Production đang gián đoạn, khách hàng khiếu nại, bạn chỉ có 60 giây để phân tích nguyên nhân và đề xuất phương án container hóa tức thì.',
    timeLimitSeconds: 60,
  },
];

export function getMockRoastData(
  tone: 'spicy' | 'constructive',
  options?: { hasJd?: boolean; jdText?: string }
): RoastData {
  const hasJd = Boolean(options?.hasJd || (options?.jdText && options.jdText.trim().length > 0));
  if (tone === 'spicy') {
    return {
      overallScore: 58,
      roastScore: 58,
      survivalScore: 52,
      funnyTitle: 'Chiến Thần Kỹ Năng Mềm',
      tone: 'spicy',
      summaryVerdict:
        'CV của bạn như một bức thư tình gửi cho mọi nhà tuyển dụng: đầy ắp những lời hứa hẹn sáo rỗng nhưng thiếu sạch số liệu thực tế. Viết "ham học hỏi, chịu áp lực cao" trong năm 2026 thì chỉ đủ gây áp lực cho người đọc thôi!',
      verdict:
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
          rejectReason:
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
          rejectReason:
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
          rejectReason:
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
      interviewQuestions: hasJd
        ? MOCK_JD_PRESSURE_QUESTIONS
        : [
            {
              questionId: 'cv-q1',
              role: 'custom',
              questionIndex: 1,
              title: 'Bug thanh toán giỏ hàng sát giờ Release',
              scenario:
                'Trong CV bạn nêu kinh nghiệm tích hợp API giỏ hàng và thanh toán. Đúng 17h30 chiều thứ Sáu trước giờ release, khách hàng báo lỗi giỏ hàng trừ tiền 2 lần khi mạng chập chờn. Bạn điều tra nguyên nhân ở đâu và khắc phục thế nào?',
              pressureContext:
                'Product Owner và Giám đốc kỹ thuật đứng ngay sau lưng yêu cầu rollback toàn bộ hoặc fix nóng dứt điểm trong vòng 15 phút.',
              timeLimitSeconds: 90,
            },
            {
              questionId: 'cv-q2',
              role: 'custom',
              questionIndex: 2,
              title: 'Xung đột kiến trúc State Management và áp lực Senior',
              scenario:
                'Bạn sử dụng Zustand trong ứng dụng Next.js, nhưng Senior Developer yêu cầu đập đi viết lại toàn bộ sang Redux Toolkit để đồng bộ với mã nguồn cũ của công ty. Bạn thuyết phục giữ lại hay đồng ý viết lại?',
              pressureContext:
                'Senior bóng gió chỉ trích bạn là fresher bảo thủ, thiếu tinh thần hợp tác trong buổi sprint planning trước toàn bộ nhóm.',
              timeLimitSeconds: 75,
            },
            {
              questionId: 'cv-q3',
              role: 'custom',
              questionIndex: 3,
              title: 'Sự cố rò rỉ API Token và áp lực giấu nhẹm',
              scenario:
                'Bạn phát hiện một commit cũ công khai trên GitHub cá nhân có chứa khóa API dịch vụ thanh toán sandbox từng dùng cho đồ án nhóm. Đồng đội cùng làm đề nghị xóa lịch sử git âm thầm thay vì thu hồi key và báo cáo sự cố. Bạn hành động ra sao?',
              pressureContext:
                'Đồng đội là bạn thân cùng phòng trọ gây áp lực sẽ cạch mặt và rút khỏi đồ án tốt nghiệp nếu bạn báo cáo sự cố này.',
              timeLimitSeconds: 60,
            },
          ],
      jdMatch: hasJd ? MOCK_JD_MATCH_DATA : undefined,
      disclaimer:
        'Lưu ý: Kết quả phân tích do AI sinh ra dựa trên dữ liệu bạn cung cấp, chỉ mang tính chất tham khảo luyện tập và không đại diện cho quyết định tuyển dụng của bất kỳ doanh nghiệp nào.',
    };
  }

  return {
    overallScore: 68,
    roastScore: 68,
    survivalScore: 65,
    funnyTitle: 'Hiệp Sĩ Fix Bug Gánh Team',
    tone: 'constructive',
    summaryVerdict:
      'Hồ sơ của bạn có nền tảng công nghệ cập nhật và định hướng rõ ràng. Tuy nhiên, để tạo ấn tượng mạnh với Hiring Manager và vượt qua vòng sàng lọc sơ tuyển, bạn cần định lượng hóa thành tích và cấu trúc lại các dự án theo chuẩn chuyên nghiệp.',
    verdict:
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
        rejectReason:
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
        rejectReason:
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
        rejectReason:
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
    interviewQuestions: hasJd
      ? MOCK_JD_PRESSURE_QUESTIONS
      : [
          {
            questionId: 'cv-q1',
            role: 'custom',
            questionIndex: 1,
            title: 'Tối ưu API thanh toán và xử lý timeout mạng',
            scenario:
              'Khi tích hợp cổng thanh toán trong đồ án, nếu webhook phản hồi trễ quá 10 giây hoặc mạng chập chờn, bạn thiết kế cơ chế retry và reconciliation như thế nào để đảm bảo không thất thoát tiền của khách?',
            pressureContext:
              'Hiring Manager yêu cầu bạn giải thích chi tiết luồng xử lý idempotent ngay trên bảng trắng trong 90 giây.',
            timeLimitSeconds: 90,
          },
          {
            questionId: 'cv-q2',
            role: 'custom',
            questionIndex: 2,
            title: 'Bảo vệ quyết định kiến trúc trước đội ngũ Tech Lead',
            scenario:
              'Trong đồ án môn học, bạn chọn Next.js và Zustand. Nếu khách hàng yêu cầu chuyển đổi hệ thống sang micro-frontend do nhiều team độc lập cùng đóng góp, bạn đánh giá rủi ro và phương án khả thi ra sao?',
            pressureContext:
              'Ban giám khảo phỏng vấn liên tục đặt câu hỏi nghi vấn tính khả thi của giải pháp trong 75 giây.',
            timeLimitSeconds: 75,
          },
          {
            questionId: 'cv-q3',
            role: 'custom',
            questionIndex: 3,
            title: 'Xử lý vi phạm an toàn thông tin đồ án',
            scenario:
              'Giả sử bạn vô tình phát hiện cơ sở dữ liệu đồ án của nhóm bị rò rỉ công khai do cấu hình sai quyền truy cập MongoDB. Bạn sẽ báo cáo giảng viên hướng dẫn và các thành viên ra sao mà không gây hoảng loạn?',
            pressureContext:
              'Chỉ còn 60 giây để đưa ra quyết định ngăn chặn rò rỉ dữ liệu trước khi sự cố lan rộng.',
            timeLimitSeconds: 60,
          },
        ],
    jdMatch: hasJd ? MOCK_JD_MATCH_DATA : undefined,
    disclaimer:
      'Lưu ý: Kết quả phân tích do AI sinh ra dựa trên dữ liệu bạn cung cấp, chỉ mang tính chất tham khảo luyện tập và không đại diện cho quyết định tuyển dụng của bất kỳ doanh nghiệp nào.',
  };
}
