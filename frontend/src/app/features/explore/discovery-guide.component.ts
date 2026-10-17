import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { IconComponent } from "../../shared/icon.component";
@Component({
  selector: "app-discovery-guide",
  standalone: true,
  imports: [RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./discovery-guide.component.html",
  styleUrl: "./discovery-guide.component.css",
})
export class DiscoveryGuideComponent {}
