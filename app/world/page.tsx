import { RequireUser } from "@/components/Gate";
import { WorldPage } from "@/components/world/WorldPage";

export const metadata = { title: "The World · A×D" };

export default function Page() {
  return (
    <RequireUser>
      <WorldPage />
    </RequireUser>
  );
}
