import { ChangeDetectionStrategy, Component, computed, inject, signal } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { ProfilesStore, DemoProfile, ProfileKind } from "../../core/profiles.store";
import { ProfileSessionStore } from "../../core/profile-session.store";
import { calculateMatch, MatchResult } from "../../core/matching.engine";
import { IconComponent } from "../../shared/icon.component";
import { DiscoveryHeroComponent } from "./discovery-hero.component";
import { ProfileCardComponent } from "./profile-card.component";
import { ProfileDialogComponent } from "./profile-dialog.component";
import { DiscoveryGuideComponent } from "./discovery-guide.component";

export function normalizeSearch(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

@Component({
  selector: "app-explore",
  standalone: true,
  imports: [RouterLink, IconComponent, DiscoveryHeroComponent, ProfileCardComponent, ProfileDialogComponent, DiscoveryGuideComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./explore.component.html",
  styleUrl: "./explore.component.css",
})
export class ExploreComponent {
  readonly store = inject(ProfilesStore);
  readonly session = inject(ProfileSessionStore);
  readonly savedOnly = inject(ActivatedRoute).snapshot.data["savedOnly"] === true;
  readonly kind = signal<ProfileKind | "TODOS">(this.savedOnly ? "TODOS" : "MENTOR");
  readonly mode = signal<"recommended" | "catalog">("recommended");
  readonly search = signal("");
  readonly sector = signal("");
  readonly city = signal("");
  readonly announcement = signal("");
  readonly kinds: { value: ProfileKind | "TODOS"; label: string }[] = [
    { value: "TODOS", label: "Todos" }, { value: "MENTOR", label: "Mentores" }, { value: "STARTUP", label: "Startups" },
  ];
  readonly sectors = [...new Set(this.store.profiles.map((profile) => profile.sector))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  readonly cities = [...new Set(this.store.profiles.map((profile) => profile.city))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  readonly personalized = computed(() => !!this.session.profile() && !this.savedOnly && this.mode() === "recommended");
  readonly matches = computed(() => {
    const viewer = this.session.profile();
    const results = new Map<string, MatchResult>();
    if (viewer) {
      for (const profile of this.store.profiles) {
        const result = calculateMatch(viewer.answers, profile.matching);
        if (result) results.set(profile.id, result);
      }
    }
    return results;
  });
  readonly recommendationCount = computed(() => [...this.matches().values()].filter((result) => result.eligible && result.relevant).length);
  readonly visibleProfiles = computed(() => {
    const query = normalizeSearch(this.search());
    return this.store.profiles.filter((profile) => {
      const result = this.matches().get(profile.id);
      const inMode = this.personalized() ? !!result?.eligible && result.relevant : this.kind() === "TODOS" || profile.kind === this.kind();
      return inMode && (!this.savedOnly || this.store.isSaved(profile.id)) && (!this.sector() || profile.sector === this.sector()) && (!this.city() || profile.city === this.city()) && (!query || normalizeSearch([profile.name, profile.title, profile.description, ...profile.tags].join(" ")).includes(query));
    }).sort((a, b) => {
      if (this.personalized()) {
        const difference = (this.matches().get(b.id)?.score ?? -1) - (this.matches().get(a.id)?.score ?? -1);
        if (difference) return difference;
        const practical = (this.matches().get(b.id)?.practicalMatches ?? 0) - (this.matches().get(a.id)?.practicalMatches ?? 0);
        if (practical) return practical;
      }
      return a.name.localeCompare(b.name, "pt-BR") || a.id.localeCompare(b.id);
    });
  });
  readonly hasFilters = computed(() => !!(this.search() || this.sector() || this.city()));

  matchFor(profile: DemoProfile): MatchResult | null {
    return this.matches().get(profile.id) ?? null;
  }
  count(kind: ProfileKind | "TODOS"): number {
    return this.store.profiles.filter((profile) => (kind === "TODOS" || profile.kind === kind) && (!this.savedOnly || this.store.isSaved(profile.id))).length;
  }
  setKind(kind: ProfileKind | "TODOS"): void { this.mode.set("catalog"); this.kind.set(kind); }
  showRecommendations(): void { this.mode.set("recommended"); this.clearFilters(); }
  updateFilter(event: Event, filter: "search" | "sector" | "city"): void { this[filter].set((event.target as HTMLInputElement | HTMLSelectElement).value); }
  clearFilters(): void { this.search.set(""); this.sector.set(""); this.city.set(""); }
  toggleSaved(profile: DemoProfile): void {
    this.store.toggleSaved(profile.id);
    this.announcement.set(`${profile.name}: ${this.store.isSaved(profile.id) ? "perfil salvo" : "perfil removido dos salvos"}.`);
  }
}
