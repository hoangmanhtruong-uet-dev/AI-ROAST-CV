import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import {
  ShieldCheck,
  Lock,
  Cpu,
  Trash2,
  HardDrive,
  Mail,
  ArrowLeft,
  Flame,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { WipeDataButton } from '@/components/privacy/WipeDataButton';

export const metadata: Metadata = {
  title: 'Chính Sách Quyền Riêng Tư & Bảo Mật Dữ Liệu | AI Roast CV',
  description:
    'Cam kết bảo mật dữ liệu trung thực, minh bạch của AI Roast CV: Kiến trúc Zero-Database Retention, truyền dữ liệu mã hóa HTTPS tới Google Gemini API, bộ lọc PII Client-Side và quyền 1-Click Wipe Data.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#0a0f1d] text-gray-100 flex flex-col selection:bg-orange-500 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-zinc-300 hover:text-white text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại Trang chủ</span>
          </Link>

          <div className="flex items-center gap-3">
            <WipeDataButton
              variant="outline"
              size="sm"
              label="Xóa sạch dữ liệu trình duyệt"
              className="text-xs border-zinc-700 hover:border-rose-500/50 hover:bg-rose-500/10 hover:text-rose-300"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-12">
        {/* Title & Badge */}
        <div className="space-y-4 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Minh bạch & Quyền riêng tư trung thực</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Chính Sách Quyền Riêng Tư & Bảo Mật Dữ Liệu
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl">
            Cập nhật lần cuối: Tháng 10/2026. AI Roast CV cam kết bảo vệ quyền riêng tư của bạn bằng các giải pháp kỹ thuật có thể kiểm chứng độc lập, không đưa ra các tuyên bố giật gân phi thực tế.
          </p>
        </div>

        {/* Executive Summary Card */}
        <div className="p-6 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-3">
          <h2 className="text-base font-bold text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <span>Tóm tắt nhanh cam kết của chúng tôi</span>
          </h2>
          <ul className="space-y-2 text-xs sm:text-sm text-zinc-300 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <span><strong>Không cơ sở dữ liệu:</strong> Máy chủ của chúng tôi hoàn toàn không có cơ sở dữ liệu (Database) lưu trữ hồ sơ CV, câu trả lời phỏng vấn hay thông tin định danh cá nhân.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <span><strong>Khử khuẩn PII trên trình duyệt:</strong> Số điện thoại, Email, CCCD và liên kết mạng xã hội được lọc và che mờ ngay tại máy của bạn trước khi gửi.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <span><strong>Truyền bảo mật tới Google Gemini:</strong> Văn bản đã khử khuẩn được gửi qua giao thức mã hóa HTTPS tới Google Gemini API theo điều khoản thương mại, không dùng để huấn luyện mô hình.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <span><strong>Quyền tự chủ toàn diện:</strong> Bạn luôn có thể chỉnh sửa văn bản trước khi gửi và xóa sạch mọi dữ liệu đã lưu tạm bằng nút 1-Click Wipe Data.</span>
            </li>
          </ul>
        </div>

        {/* 6 Core Sections */}
        <div className="space-y-10">
          {/* Section 1: Zero Database Retention */}
          <section id="section-zero-retention" className="space-y-3 pt-6 border-t border-zinc-800/80">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <HardDrive className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                1. Nguyên tắc cốt lõi: Zero Database Retention
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Khác với các nền tảng tuyển dụng truyền thống yêu cầu bạn tạo tài khoản, nhập họ tên và lưu trữ hồ sơ vĩnh viễn, AI Roast CV hoạt động theo nguyên tắc <strong>Zero Database Retention</strong>:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-zinc-400 pl-2">
              <li>Không yêu cầu đăng ký tài khoản hay cung cấp mật khẩu.</li>
              <li>Hệ thống máy chủ không kết nối với bất kỳ cơ sở dữ liệu quan hệ (SQL) hay NoSQL nào để lưu trữ nội dung CV hay kết quả đánh giá.</li>
              <li>Tệp CV hoặc văn bản bạn tải lên chỉ tồn tại tạm thời trong bộ nhớ RAM của tiến trình máy chủ trong thời gian thực hiện phân tích và được giải phóng ngay sau khi phản hồi hoàn tất.</li>
              <li>Server log máy chủ được áp dụng bộ lọc bảo mật nghiêm ngặt <code>[REDACTED_BY_ZERO_RETENTION]</code>, không bao giờ ghi lại nội dung văn bản CV thô hay thông tin nhạy cảm.</li>
            </ul>
          </section>

          {/* Section 2: Google Gemini API Transmission & Encryption */}
          <section id="section-gemini-transmission" className="space-y-3 pt-6 border-t border-zinc-800/80">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Lock className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                2. Dữ liệu xử lý và Cơ chế truyền tới Google Gemini API qua giao thức mã hóa HTTPS
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Để phân tích điểm yếu CV và chấm điểm phỏng vấn theo phương pháp STAR, ứng dụng chuyển tiếp văn bản CV tới dịch vụ trí tuệ nhân tạo của Google (<strong>Google Gemini Flash API</strong> thông qua SDK chính thức <code>@google/genai</code>):
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-zinc-400 pl-2">
              <li>
                <strong>Giao thức mã hóa đầu cuối:</strong> Toàn bộ dữ liệu truyền tải giữa trình duyệt của bạn, máy chủ trung gian và máy chủ Google Gemini đều được bảo vệ bằng giao thức mã hóa SSL/TLS (HTTPS) tiêu chuẩn ngành ngân hàng.
              </li>
              <li>
                <strong>Điều khoản API thương mại của Google:</strong> Dịch vụ API Google Gemini mà chúng tôi sử dụng tuân thủ Điều khoản Dịch vụ API Google Cloud / Google AI Studio dành cho nhà phát triển thương mại. Theo chính sách công bố của Google, dữ liệu yêu cầu và phản hồi qua API thương mại không được Google sử dụng để huấn luyện (train) mô hình cơ sở khi chưa có thỏa thuận riêng.
              </li>
              <li>
                <strong>Minh bạch tuyệt đối:</strong> Chúng tôi không đưa ra các tuyên bố phóng đại như &quot;không chia sẻ cho bên thứ ba&quot; vì việc gọi API Google Gemini là một phần không thể thiếu để cung cấp dịch vụ phân tích AI cho bạn.
              </li>
            </ul>
          </section>

          {/* Section 3: Client-Side PII Masking */}
          <section id="section-pii-masker" className="space-y-3 pt-6 border-t border-zinc-800/80">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Cpu className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                3. Bộ lọc PII Client-Side: Khử khuẩn dữ liệu trước khi gửi lên máy chủ
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Chúng tôi trang bị công nghệ <strong>Khiên bảo mật PII Client (Client-Side PII Masker)</strong> chạy trực tiếp trên trình duyệt của người dùng trước khi bất kỳ ký tự nào được truyền qua Internet:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-zinc-400 pl-2">
              <li>
                <strong>Số điện thoại Việt Nam:</strong> Các đầu số di động (+84, 03x, 05x, 07x, 08x, 09x) tự động được chuyển đổi thành token ngữ nghĩa <code>[PHONE_REDACTED]</code>.
              </li>
              <li>
                <strong>Địa chỉ Email:</strong> Tất cả địa chỉ email cá nhân được ẩn danh thành <code>[EMAIL_REDACTED]</code>.
              </li>
              <li>
                <strong>Căn cước công dân & CMND:</strong> Nhận diện CCCD 12 số (theo mã tỉnh thành Việt Nam 001-096) và CMND 9 số có tiền tố định danh, tự động thay thế thành <code>[ID_REDACTED]</code>.
              </li>
              <li>
                <strong>Liên kết cá nhân & Portfolio:</strong> Đường dẫn mạng xã hội hoặc trang cá nhân được bảo vệ bằng <code>[URL_REDACTED]</code>.
              </li>
              <li>
                <strong>Bảo tồn số liệu thành tích:</strong> Thuật toán nhận diện được tinh chỉnh để không che nhầm các số liệu đo lường kỹ thuật hoặc kết quả kinh doanh quan trọng như <code>100.000 users</code>, <code>15.000.000 VNĐ</code>, <code>35%</code>, hay năm tốt nghiệp <code>2022-2026</code>.
              </li>
            </ul>
          </section>

          {/* Section 4: User Autonomy & 1-Click Wipe Data */}
          <section id="section-user-autonomy" className="space-y-3 pt-6 border-t border-zinc-800/80">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <Trash2 className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                4. Quyền tự chủ của người dùng: 1-Click Wipe Data & Kiểm tra văn bản trước khi gửi
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Bạn nắm toàn quyền kiểm soát dữ liệu của chính mình trong mọi giai đoạn sử dụng:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-zinc-400 pl-2">
              <li>
                <strong>Màn hình kiểm tra trước (OCR Review Modal):</strong> Sau khi trích xuất nội dung từ tệp PDF hoặc hình ảnh, ứng dụng luôn hiển thị màn hình xem trước kèm các Chip hiển thị thông tin cá nhân đã phát hiện và cho phép bạn tự do xóa, sửa bất kỳ câu chữ nào trước khi bấm gửi phân tích.
              </li>
              <li>
                <strong>Xác nhận đồng ý minh bạch:</strong> Người dùng phải chủ động xác nhận đồng ý gửi dữ liệu đã ẩn danh tới Google Gemini trước khi hệ thống bắt đầu xử lý.
              </li>
              <li>
                <strong>Xóa sạch dữ liệu một chạm (1-Click Wipe Data):</strong> Nút bấm thanh lọc dữ liệu được bố trí trên thanh điều hướng Navbar, bảng điều khiển phiên và chân trang Footer. Bấm nút này sẽ lập tức xóa sạch toàn bộ bản nháp CV, lịch sử câu hỏi phỏng vấn, điểm số và bộ nhớ tạm khỏi trình duyệt của bạn.
              </li>
            </ul>
          </section>

          {/* Section 5: Local Storage & Rate Limiting Cookies */}
          <section id="section-local-storage" className="space-y-3 pt-6 border-t border-zinc-800/80">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Flame className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                5. Lưu trữ cục bộ (LocalStorage/SessionStorage) và Cookies xác thực hạn mức
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Ứng dụng chỉ sử dụng các cơ chế lưu trữ phía client phục vụ trực tiếp cho trải nghiệm người dùng:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-zinc-400 pl-2">
              <li>
                <strong>LocalStorage & SessionStorage:</strong> Dùng để lưu tạm kết quả phân tích CV và phiên làm việc hiện tại, giúp bạn không bị mất kết quả khi tải lại trang hoặc chuyển đổi giữa các tab. Dữ liệu này chỉ nằm trên máy tính của bạn và không gửi về bất kỳ máy chủ theo dõi nào.
              </li>
              <li>
                <strong>Cookie hạn mức sử dụng (Rate Limiter Cookie):</strong> Để ngăn chặn các hành vi tấn công DDoS hoặc lạm dụng làm cạn kiệt tài nguyên máy chủ, hệ thống sử dụng cookie kỹ thuật số được ký mật mã học HMAC-SHA256 (<code>rcv_session_quota</code>). Cookie này chỉ chứa số lượt sử dụng và thời điểm đặt lại hạn mức, hoàn toàn không chứa bất kỳ thông tin nhận dạng cá nhân nào.
              </li>
              <li>
                <strong>Không sử dụng bên thứ ba theo dõi xâm lấn:</strong> Chúng tôi không cài đặt các pixel theo dõi quảng cáo của bên thứ ba (như Facebook Pixel, TikTok Pixel) can thiệp vào hành vi người dùng.
              </li>
            </ul>
          </section>

          {/* Section 6: Honest Commitment & Transparent Contact */}
          <section id="section-contact" className="space-y-3 pt-6 border-t border-zinc-800/80">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                <Mail className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                6. Cam kết trung thực & Liên hệ minh bạch
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Chúng tôi hiểu rằng CV chứa đựng con đường học vấn, sự nghiệp và ước mơ của các bạn sinh viên và người mới đi làm. Do đó, toàn bộ quy trình công nghệ của AI Roast CV đều được thiết kế với mục tiêu cao nhất là tôn trọng và bảo vệ bạn:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-zinc-400 pl-2">
              <li>Không thương mại hóa, bán hoặc chia sẻ hồ sơ ứng viên cho các bên môi giới nhân sự hay đơn vị quảng cáo.</li>
              <li>Mọi thay đổi trong kiến trúc xử lý dữ liệu đều được cập nhật công khai và thông báo rõ ràng trong tài liệu này.</li>
              <li>Nếu bạn có bất kỳ câu hỏi, thắc mắc hoặc yêu cầu xác minh bảo mật, xin vui lòng liên hệ đội ngũ phát triển:</li>
            </ul>

            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm mt-3">
              <div>
                <p className="font-semibold text-white">Ban Bảo mật & Quyền riêng tư — AI Roast CV</p>
                <p className="text-zinc-400">Email: <a href="mailto:privacy@airoastcv.vn" className="text-orange-400 hover:underline">privacy@airoastcv.vn</a> hoặc <a href="mailto:support@airoastcv.vn" className="text-orange-400 hover:underline">support@airoastcv.vn</a></p>
              </div>
              <Link
                href="/roast"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium text-xs transition-colors shrink-0"
              >
                <span>Bắt đầu Roast CV an toàn</span>
              </Link>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950 py-8 px-4 text-center text-xs text-zinc-500">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 AI Roast CV. Mọi quyền được bảo lưu.</p>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-zinc-300 transition-colors">
              Trang chủ
            </Link>
            <Link href="/roast" className="hover:text-zinc-300 transition-colors">
              Roast CV
            </Link>
            <Link href="/interview" className="hover:text-zinc-300 transition-colors">
              Phỏng vấn áp lực
            </Link>
            <Link href="/privacy" className="text-emerald-400">
              Quyền riêng tư
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
