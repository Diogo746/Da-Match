import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from "@angular/core";
import { DemoProfile } from "../../core/profiles.store";
import { IconComponent } from "../../shared/icon.component";
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
  readonly saveToggled = output<void>();
  readonly profileOpened = output<void>();
  label(): string {
    return { MENTOR: "Mentor", INVESTIDOR: "Investidor", STARTUP: "Startup" }[
      this.profile().kind
    ];
  }
}
