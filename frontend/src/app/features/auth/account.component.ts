import { ChangeDetectionStrategy, Component, inject, signal } from "@angular/core";
import { Router } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { AuthService } from "../../core/auth.service";
import { AuthStateStore } from "../../core/auth-state.store";

@Component({
  selector: "app-account",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>Minha conta</h1>
    @if (state.user(); as user) {
      <p>{{ user.nome }}</p><p>{{ user.email }}</p>
      <p>Sua sessão está ativa. A edição online do perfil estará disponível em uma próxima etapa.</p>
    }
    @if (state.notice()) { <p role="alert">{{ state.notice() }}</p> }
    <button class="button button-primary" type="button" [disabled]="loading()" (click)="logout()">Sair da conta</button>`,
})
export class AccountComponent {
  readonly state = inject(AuthStateStore);
  readonly loading = signal(false);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  async logout(): Promise<void> {
    if (this.loading()) return;
    this.loading.set(true);
    try {
      await firstValueFrom(this.auth.logout());
      await this.router.navigateByUrl("/entrar");
    } catch {
      this.state.notice.set("Não foi possível concluir a saída. Tente novamente.");
    } finally {
      this.loading.set(false);
    }
  }
}
