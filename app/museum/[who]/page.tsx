import { notFound } from "next/navigation";
import { RequireUser } from "@/components/Gate";
import { MuseumLoader } from "@/components/museum/MuseumLoader";

export const metadata = { title: "Museum · A×D" };

export function generateStaticParams() {
  return [{ who: "adarsh" }, { who: "devanshi" }, { who: "together" }];
}

export default async function Page({ params }: { params: Promise<{ who: string }> }) {
  const { who } = await params;
  if (!["adarsh", "devanshi", "together"].includes(who)) notFound();
  return (
    <RequireUser>
      <MuseumLoader who={who as "adarsh" | "devanshi" | "together"} />
    </RequireUser>
  );
}
