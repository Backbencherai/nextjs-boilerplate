import type { Metadata } from "next";
import { Container, Notice, PageHeader } from "@/components/ui";
import { requireRole } from "@/lib/auth/guards";

// Auth state is per-request: never prerender or cache this page.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default async function AdminPage() {
  const session = await requireRole(["admin"], "/admin"); // redirects anonymous and non-admin users on the server
  return (
    <>
      <PageHeader title="Administration" intro="Restricted area." />
      <Container className="max-w-2xl">
        <Notice tone="danger" title={session.status === "signed-in" ? "No admin functions yet" : "Disabled"}>
          {session.status === "signed-in"
            ? "You are signed in as an administrator, but no administrative functions have been built. Add them behind server-side role checks."
            : "Authentication is not configured, so this page deliberately exposes nothing."}
        </Notice>
      </Container>
    </>
  );
}
