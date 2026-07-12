import type { Metadata } from "next";
import AppShell from "@/components/layout/app-shell";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export const metadata: Metadata = {
  title: { default: "Library", template: "%s | Watch Party" },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}
