import type { Metadata } from "next";
import Link from "next/link";
import { Container, Notice, PageHeader } from "@/components/ui";
import { getSession } from "@/lib/auth/guards";
import { safeNext } from "@/lib/auth/safeNext";
import { AuthForm } from "./AuthForm";

// Auth state is per-request: never prerender or cache this page.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function AuthPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string; denied?: string }> }) {
  const sp = await searchParams;
  const session = await getSession();
  const next = safeNext(sp.next);

  return (
    <>
      <PageHeader title="Sign in" intro="An account keeps your reminders and notes across devices." />
      <Container className="max-w-md space-y-4">
        {sp.error === "link" && <Notice tone="warn" title="That link did not work">It may have expired or already been used. Request a new one below.</Notice>}
        {sp.denied && <Notice tone="danger" title="Access denied">Your account does not have permission to open that page.</Notice>}

        {session.status === "unconfigured" && (
          <Notice tone="warn" title="Accounts are not enabled on this deployment">
            The site operator has not connected an authentication service, so nothing can be saved to an account.
            The <Link className="underline" href="/dashboard">dashboard</Link> works in local-only mode.
          </Notice>
        )}

        {session.status === "signed-in" && (
          <div className="card space-y-3">
            <p className="text-sm">Signed in as <strong>{session.email}</strong>.</p>
            <div className="flex gap-2">
              <Link href={next} className="btn btn-primary">Continue</Link>
              <form action="/auth/signout" method="post"><button className="btn btn-secondary">Sign out</button></form>
            </div>
          </div>
        )}

        {session.status === "anonymous" && <AuthForm next={next} />}
      </Container>
    </>
  );
}
