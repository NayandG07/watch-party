import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
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
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans bg-surface-default text-content-primary antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "var(--color-surface-elevated)",
                border: "1px solid var(--color-border-strong)",
                color: "var(--color-text-primary)",
              },
            }}
            richColors
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
