import '@/app/ui/global.css';
import { inter } from '@/app/ui/fonts';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black" />
      <meta name="theme-color" content="#000000" />

      {/* make sure to provide the name of your icon in below.*/}
      <link rel="apple-touch-icon" href="/icon-512x512.png" />
      <link rel="manifest" href="/manifest.json" />      
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
