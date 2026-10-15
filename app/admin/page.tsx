import type { Metadata } from "next";
import { Container, Notice, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default function AdminPage() {
  return (
    <>
      <PageHeader title="Administration" intro="Restricted area." />
      <Container className="max-w-2xl">
        <Notice tone="danger" title="Disabled">
          No administrative functions exist in this build and there is no authentication, so this page deliberately
          exposes nothing. Admin features must only be added behind server-side role checks.
        </Notice>
      </Container>
    </>
  );
}
