import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NIKATA-OS',
  description: 'Vintage computer OS-style desktop with AI chatbot',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=VT323&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
