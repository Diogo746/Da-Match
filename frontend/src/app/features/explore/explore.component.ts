import { DiscoveryGuideComponent } from "./discovery-guide.component";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import {
  ProfilesStore,
  DemoProfile,
  ProfileKind,
} from "../../core/profiles.store";
import { IconComponent } from "../../shared/icon.component";
import { DiscoveryHeroComponent } from "./discovery-hero.component";
import { ProfileCardComponent } from "./profile-card.component";
import { ProfileDialogComponent } from "./profile-dialog.component";
export function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
@Component({
  selector: "app-explore",
  standalone: true,
  imports: [
    RouterLink,
    IconComponent,
    DiscoveryHeroComponent,
    ProfileCardComponent,
    ProfileDialogComponent,
    DiscoveryGuideComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./explore.component.html",
  styleUrl: "./explore.component.css",
})
export class ExploreComponent {
  readonly store = inject(ProfilesStore);
  readonly savedOnly =
    inject(ActivatedRoute).snapshot.data["savedOnly"] === true;
  readonly kind = signal<ProfileKind | "TODOS">(
    this.savedOnly ? "TODOS" : "MENTOR",
  );
  readonly search = signal("");
  readonly sector = signal("");
  readonly city = signal("");
  readonly announcement = signal("");
  readonly kinds: { value: ProfileKind | "TODOS"; label: string }[] = [
    { value: "TODOS", label: "Todos" },
    { value: "MENTOR", label: "Mentores" },
    { value: "STARTUP", label: "Startups" },
  ];
  readonly sectors = ["Tecnologia", "Economia criativa", "Impacto social"];
  readonly cities = ["Recife", "João Pessoa", "Salvador"];
  readonly visibleProfiles = computed(() => {
    const query = normalizeSearch(this.search());
    return this.store.profiles
      .filter(
        (profile) =>
          (!this.savedOnly || this.store.isSaved(profile.id)) &&
          (this.kind() === "TODOS" || profile.kind === this.kind()) &&
          (!this.sector() || profile.sector === this.sector()) &&
          (!this.city() || profile.city === this.city()) &&
          (!query ||
            normalizeSearch(
              [
                profile.name,
                profile.title,
                profile.description,
                ...profile.tags,
              ].join(" "),
            ).includes(query)),
      )
      .sort(
        (a, b) =>
          a.name.localeCompare(b.name, "pt-BR") || a.id.localeCompare(b.id),
      );
  });
  readonly hasFilters = computed(
    () => !!(this.search() || this.sector() || this.city()),
  );
  count(kind: ProfileKind | "TODOS"): number {
    return this.store.profiles.filter(
      (profile) =>
        (kind === "TODOS" || profile.kind === kind) &&
        (!this.savedOnly || this.store.isSaved(profile.id)),
    ).length;
  }
  setKind(kind: ProfileKind | "TODOS"): void {
    this.kind.set(kind);
  }
  updateFilter(event: Event, filter: "search" | "sector" | "city"): void {
    this[filter].set(
      (event.target as HTMLInputElement | HTMLSelectElement).value,
    );
  }
  clearFilters(): void {
    this.search.set("");
    this.sector.set("");
    this.city.set("");
  }
  toggleSaved(profile: DemoProfile): void {
    this.store.toggleSaved(profile.id);
    this.announcement.set(
      `${profile.name}: ${this.store.isSaved(profile.id) ? "perfil salvo" : "perfil removido dos salvos"}.`,
    );
  }
}
