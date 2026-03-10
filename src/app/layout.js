import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

const font = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

export const metadata = {
  title: 'Valli Super Speciality Hospital | PMS',
  description: 'Performance Management System for Marketing Department',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${font.className} bg-slate-50 min-h-screen flex antialiased bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 relative via-slate-100 to-slate-200`}>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen relative z-10 w-full overflow-hidden">
          <Header />
          <main className="flex-1 p-6 lg:p-10 overflow-auto">
            <div className="max-w-7xl mx-auto w-full">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
