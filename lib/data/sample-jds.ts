/**
 * Curated Vietnamese Sample Job Descriptions for 1-Click Loading in Stress Interview
 */

export interface SampleJd {
  id: string;
  badge: string;
  roleTitle: string;
  companyOrIndustry: string;
  summary: string;
  jdText: string;
}

export const SAMPLE_JDS: SampleJd[] = [
  {
    id: 'frontend-react-fresher',
    badge: 'Công nghệ / FinTech',
    roleTitle: 'Frontend React / Next.js Fresher',
    companyOrIndustry: 'FinTech Startup (Hà Nội / Hybrid)',
    summary: 'Xây dựng giao diện ví điện tử & cổng thanh toán với React 19, Next.js App Router, TypeScript, bảo mật token & xử lý race-condition.',
    jdText: `VỊ TRÍ: FRONTEND DEVELOPER (FRESHER / JUNIOR)
CÔNG TY: FinTech Solutions Vietnam (Q. Cầu Giấy, Hà Nội)

MÔ TẢ CÔNG VIỆC:
- Tham gia phát triển hệ thống Web Portal thanh toán trực tuyến và Dashboard quản lý giao dịch merchant phục vụ hơn 500.000 người dùng hoạt động hàng ngày.
- Xây dựng giao diện responsive, tối ưu tốc độ tải trang (Core Web Vitals) và tuân thủ các chuẩn an toàn thông tin (OWASP Web Top 10, phòng chống XSS/CSRF).
- Phối hợp chặt chẽ với Backend Team (Golang/Node.js) để tích hợp RESTful API và WebSocket cho dữ liệu realtime biến động số dư.
- Tham gia vào quy trình Code Review nghiêm ngặt, viết Unit Test bằng Jest/Vitest và quản lý source code qua Git/GitLab CI.

YÊU CẦU ỨNG VIÊN:
- Tốt nghiệp hoặc sinh viên năm cuối chuyên ngành CNTT, Khoa học Máy tính hoặc tương đương.
- Thành thạo JavaScript (ES6+), TypeScript và nền tảng React.js / Next.js (App Router, Server/Client Components).
- Hiểu biết về State Management (Zustand / Redux Toolkit / React Query) và Styling hiện đại (Tailwind CSS).
- Nắm vững kiến trúc mạng cơ bản: HTTP/HTTPS status codes, JWT authentication lifecycle, CORS, Webhooks.
- Tinh thần trách nhiệm cao, cẩn trọng với dữ liệu tài chính người dùng; sẵn sàng On-call hỗ trợ sự cố khi có Release quan trọng vào cuối tuần.

QUYỀN LỢI & VĂN HÓA:
- Mức lương khởi điểm 10.000.000đ - 15.000.000đ/tháng + Thưởng hiệu suất dự án.
- Môi trường làm việc Agile/Scrum áp lực cao, nhịp độ nhanh nhưng khuyến khích đổi mới sáng tạo và tranh luận kỹ thuật đa chiều.`,
  },
  {
    id: 'marketing-growth-executive',
    badge: 'Marketing / E-Commerce',
    roleTitle: 'Digital Marketing & Growth Executive',
    companyOrIndustry: 'Thương mại điện tử & Bán lẻ F&B (TP. Hồ Chí Minh)',
    summary: 'Quản trị ngân sách Performance Ads 300M+/tháng, tối ưu hóa CAC/ROAS, xử lý khủng hoảng truyền thông mạng xã hội và vận hành chiến dịch Mega Sale.',
    jdText: `VỊ TRÍ: DIGITAL MARKETING / GROWTH EXECUTIVE (FRESHER / 1 NĂM KINH NGHIỆM)
CÔNG TY: Nova Retail & E-Commerce Group (Q. 1, TP. Hồ Chí Minh)

MÔ TẢ CÔNG VIỆC:
- Lên kế hoạch và trực tiếp tối ưu hóa các chiến dịch Performance Ads đa kênh (Facebook Ads, TikTok Ads, Google Search/Performance Max) với ngân sách từ 200 - 500 triệu VNĐ/tháng.
- Giám sát các chỉ số phễu chuyển đổi: CTR, CVR, CAC (Chi phí có khách hàng mới), AOV và ROAS. Phân tích số liệu qua Google Analytics 4 (GA4) và Looker Studio.
- Phối hợp với Đội ngũ Sáng tạo (Creative & Design) để A/B testing nội dung video ngắn TikTok, banner ads và landing page tối ưu tỷ lệ chốt đơn.
- Theo dõi sentiment thương hiệu trên các hội nhóm mạng xã hội; phát hiện sớm nguy cơ khủng hoảng truyền thông từ phản hồi tiêu cực của khách hàng và phối hợp bộ phận CSKH/PR xử lý khẩn cấp.

YÊU CẦU ỨNG VIÊN:
- Tốt nghiệp Đại học chuyên ngành Marketing, Quản trị Kinh doanh, Truyền thông hoặc Kinh tế.
- Đã có kinh nghiệm thực chiến chạy quảng cáo Facebook/TikTok (tối thiểu trong kỳ thực tập hoặc dự án kinh doanh sinh viên).
- Tư duy số liệu nhạy bén (Data-driven mindset), thành thạo Excel/Google Sheets phục vụ báo cáo phân bổ chi phí.
- Trung thực tuyệt đối về số liệu; kiên quyết nói KHÔNG với các hành vi gian lận traffic ảo, mua lead rác để làm đẹp KPI ngắn hạn.
- Khả năng chịu áp lực doanh số cao trong các dịp Mega Sale (Double Days 11.11, 12.12, Black Friday).

QUYỀN LỢI:
- Thu nhập 9.000.000đ - 14.000.000đ + Thưởng KPI doanh thu chiến dịch.
- Được cấp ngân sách thử nghiệm các định dạng quảng cáo mới hàng quý.`,
  },
  {
    id: 'backend-golang-node',
    badge: 'Hệ thống / Microservices',
    roleTitle: 'Backend Engineer Fresher (Node.js / Go)',
    companyOrIndustry: 'Nền tảng Logistics & Chuỗi cung ứng (Hà Nội)',
    summary: 'Thiết kế API tải cao cho hệ thống điều phối đơn hàng, quản trị cơ sở dữ liệu PostgreSQL & Redis cache, triển khai microservices với Docker.',
    jdText: `VỊ TRÍ: BACKEND ENGINEER (FRESHER / ENTRY-LEVEL)
CÔNG TY: V-Logistics Cloud Platform (Q. Thanh Xuân, Hà Nội)

MÔ TẢ CÔNG VIỆC:
- Tham gia thiết kế và hiện thực hóa các microservices xử lý đơn hàng và điều hướng tài xế theo thời gian thực (Real-time dispatching).
- Thiết kế mô hình cơ sở dữ liệu quan hệ (PostgreSQL) và tối ưu hóa câu lệnh SQL, indexing, transaction lock để ngăn chặn rủi ro overbooking / race-condition.
- Tích hợp hệ thống caching đa tầng (Redis) và Message Queue (RabbitMQ / Kafka) đảm bảo độ trễ API P99 < 100ms trong giờ cao điểm.
- Đóng gói ứng dụng bằng Docker, hỗ trợ DevOps cấu hình CI/CD pipeline và theo dõi giám sát hệ thống qua Prometheus / Grafana.

YÊU CẦU CÔNG VIỆC:
- Nền tảng khoa học máy tính vững chắc: Cấu trúc dữ liệu & Giải thuật, Hệ điều hành, Mạng máy tính.
- Nắm vững một trong các ngôn ngữ Backend: Node.js (TypeScript) hoặc Golang.
- Hiểu biết về tính toàn vẹn dữ liệu ACID, cơ chế distributed lock và xử lý idempotent cho các API thanh toán/giao dịch.
- Nhận thức cao về an ninh mạng và bảo mật dữ liệu khách hàng theo Nghị định 13/2023/NĐ-CP.
- Tinh thần không ngại khó, bình tĩnh điều tra log (troubleshooting) khi xảy ra sự cố production.`,
  },
];

export function getSampleJd(id: string): SampleJd | undefined {
  return SAMPLE_JDS.find((s) => s.id === id);
}
