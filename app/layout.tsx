import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "營建預算管理",
  description: "營建工程預算儀表板",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "營建預算",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" className="h-full">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="min-h-full bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
