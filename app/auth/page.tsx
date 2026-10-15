import type { Metadata } from "next";
import { Container, Notice, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Sign in" };

export default function AuthPage() {
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  return (
    <>
      <PageHeader title="Sign in" intro="Accounts let you keep your information across devices." />
      <Container className="max-w-2xl">
        <Notice tone="warn" title={configured ? "Authentication keys detected, but sign-in UI is not built yet" : "Authentication is not configured"}>
          {configured
            ? "Supabase environment variables are set, but the sign-in flow has not been implemented in this build."
            : "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY and implement the auth flow with row-level security. Until then the dashboard works in local-only mode and no data is saved to an account."}
        </Notice>
      </Container>
    </>
  );
}
