import type { Metadata } from "next";
export const metadata: Metadata = { title: "User Management" };
export default function AdminUsersLayout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
