import { RequireUser } from "@/components/Gate";
import { Quests } from "@/components/Quests";

export const metadata = { title: "Quests · A×D" };

export default function Page() {
  return (
    <RequireUser>
      <Quests />
    </RequireUser>
  );
}
