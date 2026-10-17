import { ChangeDetectionStrategy, Component, inject, signal } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { IconComponent } from "./shared/icon.component";
import { ProfileSessionStore } from "./core/profile-session.store";
import { ThemeStore } from "./core/theme.store";
@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
})
export class AppComponent {
  readonly session = inject(ProfileSessionStore);
  readonly theme = inject(ThemeStore);
  readonly motionPaused = signal(false);
}
