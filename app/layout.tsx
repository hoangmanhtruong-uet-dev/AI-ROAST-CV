import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AI Roast CV & Phỏng Vấn Áp Lực | Thực Chiến Cho Sinh Viên & Fresher',
  description:
    'Nhận phản hồi CV thẳng thắn, sắc sảo từ AI và rèn luyện phỏng vấn áp lực tình huống thực tế. Bảo mật dữ liệu tuyệt đối, không lưu CV trên máy chủ.',
  keywords: ['roast cv', 'phỏng vấn áp lực', 'cv fresher', 'ai cv review', 'vietnam'],
  openGraph: {
    title: 'AI Roast CV & Stress Interview Simulator',
    description: 'Chấm điểm CV thẳng thắn & mô phỏng phỏng vấn tình huống thực chiến.',
    type: 'website',
    locale: 'vi_VN',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="dark">
      <body
        className={`${inter.variable} font-sans antialiased bg-[#0a0f1d] text-gray-100 min-h-screen flex flex-col`}
      >
        {children}
      </body>
    </html>
  );
}
