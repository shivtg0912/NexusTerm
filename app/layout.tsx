import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Market Analyst",
  description: "AI Powered Crypto trading dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased font-mono">
        { }
        <div className="fixed inset-0 z-[-1] pointer-events-none opacity-20"
          style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
        </div>
        {children}
      </body>
    </html>
  );
}
