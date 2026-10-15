import type { Metadata } from "next";
import AnatomyLabLoader from "@/components/anatomy/AnatomyLabLoader";
import { Container, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Anatomy lab" };

export default function AnatomyPage() {
  return (
    <>
      <PageHeader
        title="Anatomy lab"
        intro="Rotate, zoom and select structures of a schematic human body, toggle body systems, and read plain-language explanations."
      />
      <Container>
        <AnatomyLabLoader />
      </Container>
    </>
  );
}
