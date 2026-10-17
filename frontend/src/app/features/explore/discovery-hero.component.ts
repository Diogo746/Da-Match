import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { RouterLink } from "@angular/router";
import { IconComponent } from "../../shared/icon.component";
@Component({
  selector: "app-discovery-hero",
  standalone: true,
  imports: [RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./discovery-hero.component.html",
  styleUrl: "./discovery-hero.component.css",
})
export class DiscoveryHeroComponent {
  readonly savedOnly = input(false);
}
