import { RequireUser } from "@/components/Gate";
import { History } from "@/components/History";

export const metadata = { title: "Records · A×D" };

export default function Page() {
  return (
    <RequireUser>
      <History />
    </RequireUser>
  );
}
