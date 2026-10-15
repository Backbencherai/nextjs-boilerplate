import type { Metadata } from "next";
import AnatomyLabLoader from "@/components/anatomy/AnatomyLabLoader";
import { Container, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Anatomy lab" };

export default function AnatomyPage() {
  return (
    <>
      <PageHeader
        title="Anatomy lab"
        intro="Rotate, zoom and select structures of a 3D human anatomy atlas, toggle body systems, and search structures by name."
      />
      <Container>
        <AnatomyLabLoader />
      </Container>
    </>
  );
}
