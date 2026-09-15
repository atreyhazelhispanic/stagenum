import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'StagePaid Prototype',
  description:
    'A mobile-first staged work, approval, invoicing, and payment prototype.',
  openGraph: {
    title: 'StagePaid',
    description: 'Invoice by stage. Get StagePaid.',
    images: [
      {
        url: '/og.png',
        width: 1732,
        height: 908,
        alt: 'StagePaid — Invoice by stage. Get StagePaid.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StagePaid',
    description: 'Invoice by stage. Get StagePaid.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('stagepaid-theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d)}catch(e){}})()`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
