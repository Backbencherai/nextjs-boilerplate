import type { Metadata } from "next";
import { Container, Notice, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <>
      <PageHeader title="Privacy policy" intro="A plain description of what this build actually does with your information." />
      <Container className="max-w-3xl space-y-6 text-sm leading-relaxed">
        <Notice tone="warn" title="Draft">
          This is a technical description, not a reviewed legal policy. Have it reviewed against India&apos;s Digital
          Personal Data Protection Act, 2023 and applicable health-data rules before launch.
        </Notice>
        <section>
          <h2 className="text-xl font-semibold">What stays on your device</h2>
          <p className="mt-2">Dashboard reminders, notes, saved items and your language choice are stored in your browser&apos;s local storage. They are not sent to any server. Use the dashboard&apos;s delete button to erase them.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">What is sent to the server</h2>
          <ul className="mt-2 list-disc pl-5">
            <li>Report explainer: the text you submit is processed to compare values with ranges you supply. It is not stored or logged.</li>
            <li>Assistant: messages are sent to the configured AI provider only if the site operator has set one up, and only after you tick consent.</li>
            <li>Care guidance photos are checked in your browser and are not uploaded.</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-semibold">What we do not do</h2>
          <p className="mt-2">No advertising trackers, no selling of data, and no API keys in browser code.</p>
        </section>
      </Container>
    </>
  );
}
