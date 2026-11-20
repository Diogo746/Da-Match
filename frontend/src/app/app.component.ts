
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  inject,
  signal
} from "@angular/core";

import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { IconComponent } from "./shared/icon.component";
import { LumenChatComponent } from "./features/lumen-chat/lumen-chat.component";
import { ProfileSessionStore } from "./core/profile-session.store";
import { MotionStore } from "./core/motion.store";
import { ThemeStore, type PaletteName } from "./core/theme.store";
import { REGISTRATION_MODE } from "./core/registration.config";
import { AuthStateStore } from "./core/auth-state.store";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    IconComponent,
    LumenChatComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
  host: { "(click)": "onRootClick($event)" },
})
export class AppComponent {
  readonly apiMode = inject(REGISTRATION_MODE) === "API";
  readonly session = this.apiMode ? null : inject(ProfileSessionStore);
  readonly authState = inject(AuthStateStore);
  readonly theme = inject(ThemeStore);
  readonly motionPaused = inject(MotionStore).paused;
private workspaceClickCount: number = 0;
  // Controle do menu de paletas
  readonly paletteMenuOpen = signal(false);

  // Abre ou fecha o menu
  togglePaletteMenu(): void {
    this.paletteMenuOpen.update(open => !open);
  }

  // Fecha o menu
  closePaletteMenu(): void {
    this.paletteMenuOpen.set(false);
  }

  // Seleciona uma paleta
  selectPalette(palette: PaletteName): void {
    this.theme.setPalette(palette);
    this.closePaletteMenu();
  }

  // Fecha ao clicar fora
  @HostListener("document:click", ["$event"])
  closePaletteMenuOnOutsideClick(event: MouseEvent): void {
    const target = event.target;

    if (
      target instanceof Element &&
      !target.closest(".palette-control")
    ) {
      this.closePaletteMenu();
    }
  }

  // Easter egg do tema arco-íris
 onRootClick(event: Event): void {
  const target = event.target;

  if (
    target instanceof Element &&
    target.closest(".workspace-name")
  ) {
    this.workspaceClickCount++;

    if (this.workspaceClickCount === 5) {
      this.theme.toggleRainbow();

      // Reinicia o contador
      this.workspaceClickCount = 0;
    }
  }
}

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
    if (this.apiMode) {
      return this.authState.user()
        ? "Meu perfil"
        : "Cadastrar startup ou mentor";
    }

    return this.session?.profile()
      ? "Meu próximo passo"
      : "Montar meu perfil";
  });
}
