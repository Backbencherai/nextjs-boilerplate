/**
 * Provider-directory integration layer.
 *
 * Implement `DoctorProvider` against a legitimate source (for example an ABDM Healthcare Professionals
 * Registry integration or a hospital partner API) and register it in `getProvider`. Access to ABDM / UHI
 * requires onboarding and credentials that this project does not have; see docs/INTEGRATIONS.md.
 */
export type DoctorQuery = { specialty?: string; location?: string; facility?: string; format?: "in-person" | "teleconsult" };

export type DoctorRecord = {
  id: string;
  name: string;
  specialty: string;
  facility?: string;
  address?: string;
  contact?: string;
  source: string; // where the listing came from
  verification?: { method: string; checkedOn: string; registryId: string }; // only if a real check happened
};

export interface DoctorProvider {
  name: string;
  search(q: DoctorQuery): Promise<DoctorRecord[]>;
}

export function getProvider(): DoctorProvider | null {
  // No provider is configured. Return null rather than sample data.
  return null;
}
