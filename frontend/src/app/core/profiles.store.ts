import { Injectable, signal } from "@angular/core";
import { MatchProfile, cityLabel, sectorLabel } from "./profile.models";
import { ProfileTone, profileTone } from "./profile-appearance";
import catalog from "./demo-profiles.json";
export type { ProfileKind } from "./profile.models";

export interface DemoProfile {
  id: string;
  name: string;
  initials: string;
  kind: "MENTOR" | "STARTUP";
  title: string;
  city: string;
  sector: string;
  stage: "Ideação";
  description: string;
  tags: string[];
  reasons: string[];
  availability: string;
  theme: ProfileTone;
  matching: MatchProfile;
}
// Pessoas e organizações inventadas exclusivamente para o protótipo.
type DemoProfileSeed = Omit<DemoProfile,
  "initials" | "city" | "sector" | "stage" | "matching" | "theme"
> & { matching: Omit<MatchProfile, "kind" | "accepting"> };

function createDemoProfile(seed: DemoProfileSeed): DemoProfile {
  const matching: MatchProfile = { ...seed.matching, kind: seed.kind, accepting: true };
  return {
    ...seed,
    theme: profileTone(seed.kind, seed.id),
    initials: seed.name.split(" ").map((part) => part.charAt(0)).join(""),
    city: cityLabel(matching.cityId),
    sector: sectorLabel(matching.sectors[0]),
    stage: "Ideação",
    matching,
  };
}

export const DEMO_PROFILES: readonly DemoProfile[] =
  (catalog as DemoProfileSeed[]).map(createDemoProfile);
@Injectable({ providedIn: "root" })
export class ProfilesStore {
  readonly profiles = DEMO_PROFILES;
  readonly savedIds = signal<readonly string[]>([]);
  isSaved(id: string): boolean { return this.savedIds().includes(id); }
  toggleSaved(id: string): void {
    if (!this.profiles.some((profile) => profile.id === id)) return;
    this.savedIds.update((ids) => ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id]);
  }
}
