import { ChangeDetectionStrategy, Component, computed, input, output } from "@angular/core";
import { DiscoveryProfile } from "../../core/discovery.models";
import { profileTone } from "../../core/profile-appearance";
import { IconComponent } from "../../shared/icon.component";

@Component({
  selector: "app-discovery-card",
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./discovery-card.component.html",
  styleUrl: "./discovery-card.component.css",
})
export class DiscoveryCardComponent {
  readonly profile = input.required<DiscoveryProfile>();
  readonly location = input.required<string>();
  readonly opened = output<Event>();
  readonly tone = computed(() => profileTone(this.profile().tipo, this.profile().id));
  readonly initials = computed(() => {
    const words = this.profile().nome.trim().split(/\s+/u);
    const ends = words.length > 1 ? [words[0], words[words.length - 1]] : [words[0]];
    return ends.map(word => [...word][0]).join("").toLocaleUpperCase("pt-BR");
  });
}
