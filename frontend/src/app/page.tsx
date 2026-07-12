import { redirect } from "next/navigation";

/**
 * Root page — redirects to /library.
 * The actual auth guard (token check) happens client-side in the AppShell.
 * Server-side auth middleware will be added in Phase 3.
 */
export default function HomePage() {
  redirect("/library");
}
