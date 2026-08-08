import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Watch Party",
    template: "%s | Watch Party",
  },
  description:
    "A private synchronized watch-party platform for a trusted group of friends.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-stone-50 dark:bg-[#050505] text-stone-900 dark:text-zinc-100 font-sans antialiased select-none transition-colors duration-300">
        {children}
      </body>
    </html>
  );
}
