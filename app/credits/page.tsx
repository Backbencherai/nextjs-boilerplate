import type { Metadata } from "next";
import { Container, Notice, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Credits & licences" };

export default function CreditsPage() {
  return (
    <>
      <PageHeader title="Credits and licences" intro="Third-party material used in Swasth Setu and the terms it is shared under." />
      <Container className="max-w-3xl space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold">3D anatomy atlas</h2>
          <p className="mt-2">
            The anatomy models are adapted from <a className="underline" href="https://www.z-anatomy.com/" target="_blank" rel="noopener noreferrer">Z-Anatomy</a>{" "}
            (CC BY-SA 4.0), which is itself derived from{" "}
            <a className="underline" href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html" target="_blank" rel="noopener noreferrer">BodyParts3D</a>{" "}
            (CC BY-SA 2.1 Japan, Kousaku Okubo and colleagues, The Database Center for Life Science).
          </p>
          <p className="mt-2">
            We simplified and compressed the meshes, removed helper objects, and omitted some structures. The adapted files are
            shared under <a className="underline" href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>:
            download them from <code>/models/anatomy/</code>. See <a className="underline" href="/models/anatomy/LICENSE.md">LICENSE.md</a> there for the full change list.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Images, lighting and fonts</h2>
          <p className="mt-2">
            The anatomy pictures on the home page were rendered from the adapted Z-Anatomy model and are shared under the same CC BY-SA 4.0 licence.
            Studio lighting in the 3D viewer uses a CC0 HDR from the <code>@pmndrs/assets</code> bundle. Typefaces (Inter, Fraunces, Noto Sans Devanagari and Kannada) are open-source under the SIL Open Font License.
          </p>
        </section>
        <Notice tone="warn" title="Omitted for licence reasons">
          Kidneys and inner-ear structures (upstream sources are non-commercial), and cortical-surface and white-matter
          meshes (reuse terms unverified) are not included.
        </Notice>
        <Notice title="Open question for counsel">
          Whether share-alike extends beyond the model files to the surrounding application code is a legal question this
          project has not resolved. The model files are kept separate and clearly licensed so they can be handled independently.
        </Notice>
      </Container>
    </>
  );
}
