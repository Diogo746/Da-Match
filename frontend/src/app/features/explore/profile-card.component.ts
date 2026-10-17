import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from "@angular/core";
import { DemoProfile } from "../../core/profiles.store";
import { IconComponent } from "../../shared/icon.component";
import { MatchResult } from "../../core/matching.engine";
@Component({
  selector: "app-profile-card",
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./profile-card.component.html",
  styleUrl: "./profile-card.component.css",
})
export class ProfileCardComponent {
  readonly profile = input.required<DemoProfile>();
  readonly saved = input(false);
  readonly match = input<MatchResult | null>(null);
  readonly saveToggled = output<void>();
  readonly profileOpened = output<void>();
  label(): string {
    return { MENTOR: "Mentor", STARTUP: "Startup · Ideação" }[
      this.profile().kind
    ];
  }
}
