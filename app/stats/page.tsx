import { RequireUser } from "@/components/Gate";
import { Stats } from "@/components/stats/Stats";

export const metadata = { title: "Observatory · A×D" };

export default function Page() {
  return (
    <RequireUser>
      <Stats />
    </RequireUser>
  );
}
