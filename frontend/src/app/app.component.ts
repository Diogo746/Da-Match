import { ChangeDetectionStrategy, Component, computed, inject } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { IconComponent } from "./shared/icon.component";
import { ProfileSessionStore } from "./core/profile-session.store";
import { MotionStore } from "./core/motion.store";
import { ThemeStore } from "./core/theme.store";
import { REGISTRATION_MODE } from "./core/registration.config";
@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
  // Easter egg: clicar no texto "Ecossistema de inovação" (barra de cima) liga/desliga o tema arco-íris.
  host: { "(click)": "onRootClick($event)" },
})
export class AppComponent {
  readonly apiMode = inject(REGISTRATION_MODE) === "API";
  readonly session = inject(ProfileSessionStore);
  readonly theme = inject(ThemeStore);
  readonly motionPaused = inject(MotionStore).paused;
  onRootClick(event: Event): void {
    const target = event.target;
    if (target instanceof Element && target.classList.contains("workspace-name")) this.theme.toggleRainbow();
  }
  readonly accountLabel = computed(() => {
    if (this.apiMode) return "Criar conta";
    return this.session.profile() ? "Meu perfil" : "Criar perfil";
  });
  readonly invitationLabel = computed(() => {
    if (this.apiMode) return "Cadastrar startup ou mentor";
    return this.session.profile() ? "Meu próximo passo" : "Montar meu perfil";
  });
}
