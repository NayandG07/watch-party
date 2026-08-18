import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
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
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans bg-surface-default text-content-primary antialiased`}>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "rgb(32 43 31)",
              border: "1px solid rgba(211, 231, 183, 0.16)",
              color: "#f1f6eb",
            },
          }}
          richColors
        />
      </body>
    </html>
  );
}
