import { ChangeDetectionStrategy, Component, inject, signal } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { HttpErrorResponse } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { AuthService } from "../../core/auth.service";
import { REGISTRATION_MODE } from "../../core/registration.config";

@Component({
  selector: "app-login",
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section aria-labelledby="login-title">
      <h1 id="login-title">Entrar na sua conta</h1>
      @if (apiMode) {
        <form [formGroup]="form" (ngSubmit)="submit()" [attr.aria-busy]="loading()">
          <label class="field-label" for="login-email">E-mail</label>
          <input class="form-input" id="login-email" type="email" autocomplete="username" formControlName="email" required />
          <label class="field-label" for="login-password">Senha</label>
          <input class="form-input" id="login-password" type="password" autocomplete="current-password" formControlName="senha" required />
          @if (error()) { <p role="alert">{{ error() }}</p> }
          <button class="button button-primary" type="submit" [disabled]="loading() || form.invalid">
            {{ loading() ? 'Entrando…' : 'Entrar' }}
          </button>
        </form>
        <p>Ainda não tem conta? <a routerLink="/cadastro">Cadastre-se</a></p>
      } @else {
        <p>Você está na demonstração. O acesso a contas reais está disponível na versão conectada.</p>
        <a routerLink="/">Voltar para descobrir</a>
      }
    </section>`,
  styles: `section{max-width:440px;margin:40px auto}.field-label{display:block;margin:20px 0 8px}button{margin-top:24px}[role=alert]{color:var(--text);margin-top:16px}`,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly apiMode = inject(REGISTRATION_MODE) === "API";
  readonly loading = signal(false);
  readonly error = signal(inject(ActivatedRoute).snapshot.queryParamMap.has("unavailable")
    ? "Não foi possível consultar sua sessão. Tente novamente." : "");
  readonly form = new FormGroup({
    email: new FormControl("", { nonNullable: true, validators: [Validators.required, Validators.email] }),
    senha: new FormControl("", { nonNullable: true, validators: [Validators.required, Validators.maxLength(72)] }),
  });

  async submit(): Promise<void> {
    if (!this.apiMode || this.loading() || this.form.invalid) return;
    this.loading.set(true);
    this.error.set("");
    const { email, senha } = this.form.getRawValue();
    this.form.controls.senha.reset();
    try {
      await firstValueFrom(this.auth.login(email, senha));
      await this.router.navigateByUrl("/conta");
    } catch (error: unknown) {
      this.error.set(error instanceof HttpErrorResponse && error.status === 401
        ? "E-mail ou senha inválidos." : "Não foi possível concluir o acesso. Tente novamente.");
    } finally {
      this.loading.set(false);
    }
  }
}
