import { LumenChatComponent } from "./features/lumen-chat/lumen-chat.component";
import { ChangeDetectionStrategy, Component, computed, inject } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { IconComponent } from "./shared/icon.component";
import { ProfileSessionStore } from "./core/profile-session.store";
import { MotionStore } from "./core/motion.store";
import { ThemeStore } from "./core/theme.store";
import { REGISTRATION_MODE } from "./core/registration.config";
import { AuthStateStore } from "./core/auth-state.store";
@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, IconComponent, LumenChatComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
})
export class AppComponent {
  readonly apiMode = inject(REGISTRATION_MODE) === "API";
  readonly session = this.apiMode ? null : inject(ProfileSessionStore);
  readonly authState = inject(AuthStateStore);
  readonly theme = inject(ThemeStore);
  readonly motionPaused = inject(MotionStore).paused;
  readonly accountPath = computed(() => {
    if (this.apiMode) return this.authState.user() ? "/conta" : "/entrar";
    return this.session?.profile() ? "/meu-perfil" : "/cadastro";
  });
  readonly invitationPath = computed(() => {
    if (this.apiMode) return this.authState.user() ? "/conta" : "/cadastro";
    return this.accountPath();
  });
  readonly accountLabel = computed(() => {
    if (this.apiMode) return this.authState.user() ? "Minha conta" : "Entrar";
    return this.session?.profile() ? "Meu perfil" : "Criar perfil";
  });
  readonly invitationLabel = computed(() => {
    if (this.apiMode) return this.authState.user() ? "Meu perfil" : "Cadastrar startup ou mentor";
    return this.session?.profile() ? "Meu próximo passo" : "Montar meu perfil";
  });
}
