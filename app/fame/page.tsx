import { RequireUser } from "@/components/Gate";
import { Fame } from "@/components/fame/Fame";

export const metadata = { title: "Hall of Fame · A×D" };

export default function Page() {
  return (
    <RequireUser>
      <Fame />
    </RequireUser>
  );
}
