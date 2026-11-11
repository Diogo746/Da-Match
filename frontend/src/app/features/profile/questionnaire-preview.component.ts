import { ChangeDetectionStrategy, Component, ElementRef, afterRenderEffect, signal, viewChild } from "@angular/core";
import { RouterLink } from "@angular/router";
import { ProfileKind } from "../../core/profile.models";
import { ProfileSetupComponent } from "./profile-setup.component";
import { LumenComponent } from "../../shared/lumen.component";

@Component({
  selector: "app-questionnaire-preview",
  imports: [RouterLink, ProfileSetupComponent, LumenComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="back-link" routerLink="/">← Voltar para descobrir</a>
    <p class="eyebrow">DEMONSTRAÇÃO · QUESTIONÁRIO</p>
    @if (finished()) {
      <section><app-lumen pose="complete" /><h1 tabindex="-1" #heading>Você concluiu o teste!</h1>
        <p>Suas respostas de demonstração não foram salvas.</p>
        <button class="button button-primary" type="button" (click)="restart()">Testar outro perfil</button></section>
    } @else if (kind(); as role) {
      <h1 #heading tabindex="-1">Questionário de {{ role === "MENTOR" ? "mentor" : "startup" }}</h1>
      <button type="button" class="text-button" (click)="restart()">Trocar perfil de teste</button>
      <app-profile-setup [kind]="role" [name]="role === 'MENTOR' ? 'Mentor de teste' : 'Startup de teste'"
        (finished)="finish()" />
    } @else {
      <section><app-lumen pose="curious" /><h1 #heading tabindex="-1">Qual jornada você quer testar?</h1>
        <p>Escolha um papel para responder às seis etapas com o Lumen. Este teste não cria uma conta nem altera seu perfil.</p>
        <div class="choices"><button class="button button-primary" type="button" (click)="kind.set('STARTUP')">Testar como startup</button>
        <button class="button button-secondary" type="button" (click)="kind.set('MENTOR')">Testar como mentor</button></div>
      </section>
    }`,
  styles: `:host{display:block}section{max-width:680px;padding:clamp(20px,4vw,40px);border:1px solid var(--border);border-radius:16px;background:var(--surface);--lumen-size:90px}h1{line-height:1.2}p:not(.eyebrow){color:var(--muted);line-height:1.6}.choices{display:flex;gap:12px;flex-wrap:wrap}.text-button{margin-bottom:14px}`,
})
export class QuestionnairePreviewComponent {
  readonly kind = signal<ProfileKind | null>(null);
  readonly finished = signal(false);
  private readonly heading = viewChild<ElementRef<HTMLElement>>("heading");
  constructor() { afterRenderEffect(() => this.heading()?.nativeElement.focus()); }
  finish() { this.finished.set(true); }
  restart() { this.kind.set(null); this.finished.set(false); }
}
