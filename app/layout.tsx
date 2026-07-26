import './globals.css';
import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/components/nyaya/auth-provider';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const display = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Nyaya AI — Your AI-Powered Legal Assistant',
  description:
    'Nyaya AI helps you understand the law, draft legal documents, generate RTI applications, and get cited answers to legal questions in seconds.',
  keywords: ['legal AI', 'legal assistant', 'RTI generator', 'legal notice', 'Indian law', 'AI lawyer'],
  openGraph: {
    title: 'Nyaya AI — Your AI-Powered Legal Assistant',
    description: 'Understand the law, draft documents, and get cited answers — powered by AI.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${display.variable} font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
