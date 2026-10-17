import { ChangeDetectionStrategy, Component, inject, input } from "@angular/core";
import { RouterLink } from "@angular/router";
import { IconComponent } from "../../shared/icon.component";
import { ProfileSessionStore } from "../../core/profile-session.store";
import { LumenGuideComponent } from "../../shared/lumen-guide.component";
@Component({
  selector: "app-discovery-hero",
  standalone: true,
  imports: [RouterLink, IconComponent, LumenGuideComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./discovery-hero.component.html",
  styleUrl: "./discovery-hero.component.css",
})
export class DiscoveryHeroComponent {
  readonly session = inject(ProfileSessionStore);
  readonly savedOnly = input(false);
}
