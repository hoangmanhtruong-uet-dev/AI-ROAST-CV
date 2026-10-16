import { InterviewQuestionData, InterviewRole, QuestionIndex } from '@/lib/schemas/interview';

export const INTERVIEW_QUESTIONS: InterviewQuestionData[] = [
  // =========================================================================
  // Track 1: IT / Software Engineer (Escalating Stakes: 90s -> 75s -> 60s)
  // =========================================================================
  {
    questionId: 'it-q1',
    role: 'it',
    questionIndex: 1,
    title: 'Bug nghiêm trọng sát giờ Release (Hotfix vs Deadline)',
    scenario:
      'Bạn là Fresher Backend/Fullstack. 17:30 chiều thứ Sáu, chỉ còn 30 phút trước khi toàn bộ hệ thống deploy bản cập nhật lớn cho đối tác ngân hàng/thương mại điện tử. Bạn tình cờ phát hiện một race condition tiềm ẩn trong module thanh toán có thể dẫn đến trừ tiền 2 lần trong 1% trường hợp tải cao. Tech Lead của bạn đã về sớm, PM dự án giục deploy ngay để kịp cam kết hợp đồng phạt tiến độ.',
    pressureContext:
      'PM đứng ngay sau lưng bạn: "Đã test qua staging rồi, không ai báo lỗi đó đâu em. Cứ bấm release đi, thứ Hai tính tiếp, nếu hoãn bây giờ đối tác phạt công ty 50 triệu và trừ KPI cả team!"',
    timeLimitSeconds: 90,
  },
  {
    questionId: 'it-q2',
    role: 'it',
    questionIndex: 2,
    title: 'Xung đột kiến trúc & Đổ lỗi từ Senior Developer',
    scenario:
      'Trong đợt bàn giao code, một tính năng do một Senior Developer uy tín trong công ty viết bị memory leak khiến server sập liên tục lúc cao điểm. Khi CEO và CTO triệu tập họp khẩn cấp, Senior này ngầm đổ lỗi cho module của bạn (fresher) rằng "do fresher viết query tối ưu kém gây nghẽn DB". Bạn nắm rõ log và flamegraph chứng minh nguyên nhân là do cache leak trong code của Senior đó.',
    pressureContext:
      'Senior là người review thử việc và quyết định bạn có được ký hợp đồng chính thức hay không sau 2 tuần nữa. CTO đang nhìn thẳng vào bạn yêu cầu giải trình ngay tại phòng họp.',
    timeLimitSeconds: 75,
  },
  {
    questionId: 'it-q3',
    role: 'it',
    questionIndex: 3,
    title: 'Lộ rò rỉ dữ liệu Production & Lệnh che giấu từ Giám đốc (Data Breach)',
    scenario:
      '22:00 đêm, bạn phát hiện một credential AWS S3 chứa file scan CCCD/CMND và sao kê tài khoản của 50.000 người dùng vừa bị lộ công khai trên GitHub repo cá nhân của một nhân viên cũ đã nghỉ việc. Hacker đã bắt đầu tải dữ liệu. Bạn báo ngay cho Giám đốc kỹ thuật (VP of Engineering), nhưng ông ta chỉ đạo: "Xóa commit và repo đó ngay, âm thầm đổi key, cấm không được thông báo cho bất kỳ ai kể cả khách hàng hay cơ quan chức năng để tránh công ty phá sản."',
    pressureContext:
      'Dữ liệu đang tiếp tục bị rò rỉ từng giây, thời gian đếm ngược 60s. Pháp luật quy định xử phạt hình sự về che giấu vi phạm dữ liệu cá nhân (Nghị định 13/2023/NĐ-CP).',
    timeLimitSeconds: 60,
  },

  // =========================================================================
  // Track 2: Marketing / Business (Escalating Stakes: 90s -> 75s -> 60s)
  // =========================================================================
  {
    questionId: 'marketing-q1',
    role: 'marketing',
    questionIndex: 1,
    title: 'Khủng hoảng ngân sách & Áp lực KPI ảo (Fake Lead vs Data Ethics)',
    scenario:
      'Bạn là Marketing Fresher phụ trách chiến dịch ra mắt sản phẩm mới của một chuỗi bán lẻ. Đã tiêu hết 70% ngân sách tháng nhưng conversion rate chỉ đạt 30% KPI. Trưởng phòng Marketing yêu cầu bạn chuyển đổi toàn bộ ngân sách còn lại vào một kênh quảng cáo "mua lead giá rẻ" (số điện thoại ảo/kém chất lượng) để "báo cáo số đẹp cho Ban Giám đốc" trước kỳ họp cuối tháng.',
    pressureContext:
      'Trưởng phòng nói: "Em không biết làm đẹp số thì cả phòng bị cắt thưởng quý này, em cũng không qua được thử việc đâu. Bơm số cho kịp báo cáo, sau đó sale gọi được hay không là việc của team Sales!"',
    timeLimitSeconds: 90,
  },
  {
    questionId: 'marketing-q2',
    role: 'marketing',
    questionIndex: 2,
    title: 'Khủng hoảng truyền thông PR do KOL xúc phạm cộng đồng (Boycott)',
    scenario:
      'KOL độc quyền mà thương hiệu vừa ký hợp đồng 1 tỷ đồng bất ngờ vướng scandal phát ngôn nhạy cảm, xúc phạm cộng đồng người tiêu dùng trên mạng xã hội. Hàng nghìn bình luận phẫn nộ tràn vào fanpage của thương hiệu đòi tẩy chay sản phẩm. Trưởng nhóm PR đang đi công tác trên máy bay mất liên lạc, bạn là người duy nhất trực trang lúc 21:00 tối.',
    pressureContext:
      'Cộng đồng mạng đang spam hashtag tẩy chay với tốc độ 50 bình luận/phút. Một bên nội bộ đòi xóa sạch bình luận và khóa fanpage, một bên yêu cầu đăng đàn xin lỗi ngay lập tức mà chưa có thông điệp chính thống duyệt từ Legal.',
    timeLimitSeconds: 75,
  },
  {
    questionId: 'marketing-q3',
    role: 'marketing',
    questionIndex: 3,
    title: 'Gian lận thành phần sản phẩm & Đe dọa pháp lý từ khách hàng',
    scenario:
      'Sản phẩm thực phẩm bảo vệ sức khỏe mới ra mắt bị phát hiện chứa sai lệch tỷ lệ thành phần so với thông tin ghi trên bao bì và bài quảng cáo do team bạn biên soạn. Một khách hàng VIP bị dị ứng nặng nhập viện và dọa khởi kiện ra tòa lẫn báo chí trừ khi thương hiệu trả 500 triệu đồng "tiền bồi thường ngậm miệng" trong vòng 2 giờ tới. CEO yêu cầu bạn thảo văn bản bác bỏ trách nhiệm và đổ lỗi cho khách hàng sử dụng sai cách.',
    pressureContext:
      'Khách hàng đang livestream trước cổng công ty. CEO đập bàn: "Soạn ngay thông cáo báo chí phản bác khách hàng bịa đặt, bảo vệ uy tín thương hiệu bằng mọi giá, không được thừa nhận bất kỳ sai sót nào!"',
    timeLimitSeconds: 60,
  },
];

export function getInterviewQuestion(
  role: InterviewRole,
  questionIndex: QuestionIndex
): InterviewQuestionData | null {
  const match = INTERVIEW_QUESTIONS.find(
    (q) => q.role === role && q.questionIndex === questionIndex
  );
  return match || null;
}
