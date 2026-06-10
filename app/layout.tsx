import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Teamflow — Where your team's work actually happens",
  description: 'Channels, threads, calls, and search — built for teams that move fast.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full ${manrope.variable}`}>
      <body className="min-h-full bg-bg text-ink antialiased" style={{ fontFamily: 'var(--font-manrope), ui-sans-serif, system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
