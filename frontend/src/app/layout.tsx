import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import ThemeInitializer from "@/components/ThemeInitializer";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Watch Party",
    template: "%s | Watch Party",
  },
  description:
    "A private synchronized watch-party platform for a trusted group of friends.",
  robots: {
    index: false,   // This is a private platform — never index
    follow: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" data-theme="terracotta" data-mode="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('watchparty_theme') || 'terracotta';
                var mode = localStorage.getItem('watchparty_mode') || 'dark';
                document.documentElement.setAttribute('data-theme', theme);
                document.documentElement.setAttribute('data-mode', mode);
                if (mode === 'light') {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                } else {
                  document.documentElement.classList.remove('light');
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans bg-surface-default text-content-primary antialiased`}>
        <ThemeInitializer />
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "rgb(22 22 36)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#e2e8f0",
            },
          }}
          richColors
        />
      </body>
    </html>
  );
}
