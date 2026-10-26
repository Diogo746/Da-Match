import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, ViewChild, computed, inject, input, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { calculateMatch } from "../../core/matching.engine";
import { MotionStore } from "../../core/motion.store";
import { SessionProfile } from "../../core/profile.models";
import { ProfilesStore } from "../../core/profiles.store";
import { IconComponent } from "../../shared/icon.component";
import { LumenComponent } from "../../shared/lumen.component";
import { ProfilePreviewComponent } from "./profile-preview.component";

@Component({
  selector: "app-profile-complete",
  standalone: true,
  imports: [RouterLink, IconComponent, LumenComponent, ProfilePreviewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section class="complete-layout" aria-labelledby="complete-title">
    <div class="complete-copy"><app-lumen pose="complete" /><span class="complete-badge"><app-icon name="check" />Perfil concluído</span>
      <h1 #completeHeading id="complete-title" tabindex="-1">Boas conexões começam com quem você é.</h1>
      @if (found()) {
        <div class="found-count">
          @if (motion.allowed()) { <span class="confetti" aria-hidden="true">@for (piece of confetti; track piece) { <i></i> }</span> }
          <span class="found-text" aria-hidden="true">Encontramos <strong>{{ shown() }}</strong> {{ otherSide() }} para você!</span>
          <span class="sr-only">Encontramos {{ found() }} {{ otherSide() }} para você.</span>
        </div>
      } @else {
        <div class="found-count empty-found"><strong>Ainda não encontramos {{ otherSide() }} compatíveis</strong><span>Experimente aceitar encontros online, marcar mais dias e períodos ou escolher outras necessidades em Meu perfil.</span></div>
      }
      <p>{{ profile().answers.kind === 'STARTUP' ? 'Agora podemos apresentar mentores que ajudam no próximo passo da sua ideia.' : 'Agora podemos apresentar ideias que precisam da experiência que você compartilha.' }}</p>
      @if (profile().answers.kind === 'MENTOR' && !profile().answers.accepting) { <p class="pause-note">Seu perfil está em pausa para novas mentorias. Você pode retomar em Meu perfil.</p> }
      <div class="complete-actions"><a class="button button-primary" routerLink="/">Ver minhas indicações<app-icon name="arrow" /></a><a class="button button-secondary" routerLink="/meu-perfil">Meu perfil</a></div>
      <p class="complete-note">Perfil de demonstração, disponível nesta sessão. Recarregar a página reinicia o teste.</p>
    </div>
    <app-profile-preview [name]="profile().name" [draft]="profile().answers" />
  </section>`,
  // O confete reaproveita os estilos do questionário.
  styleUrl: "./profile-gamification.css",
  styles: `:host{display:block}.complete-layout{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:65px;align-items:center;max-width:950px;margin:10px auto 30px}.complete-copy>app-lumen{width:100px;margin-bottom:18px}.complete-badge{display:inline-flex;align-items:center;gap:7px;color:var(--success-text);background:var(--success-bg);padding:7px 10px;border-radius:20px;font-size:10px;font-weight:650}.complete-badge app-icon{width:14px;height:14px}.complete-copy h1{font-size:clamp(29px,3.5vw,43px);letter-spacing:-1.4px;line-height:1.2;margin:18px 0}.complete-copy p{font-size:13px;line-height:1.9;color:var(--muted)}.complete-actions{display:flex;gap:10px;flex-wrap:wrap;margin:24px 0}.complete-copy .complete-note{font-size:10px;max-width:360px}.pause-note{border-left:3px solid var(--border-hover);padding-left:12px}.found-count{position:relative;display:flex;flex-direction:column;gap:6px;max-width:460px;padding:18px 22px;border-radius:16px;background:var(--profile-tint);border:1px solid var(--profile-ink);color:var(--profile-ink);overflow:hidden}.found-text{font-size:20px;font-weight:650;letter-spacing:-.4px;line-height:1.3}.found-text strong{font-size:34px;font-variant-numeric:tabular-nums}.empty-found strong{font-size:17px}.empty-found span{font-size:13px;line-height:1.7;color:var(--muted)}@media(max-width:1000px){.complete-layout{grid-template-columns:1fr;gap:25px}.complete-layout>app-profile-preview{max-width:360px}.complete-copy>app-lumen{width:85px}}`,
})
export class ProfileCompleteComponent implements AfterViewInit {
  private readonly store = inject(ProfilesStore);
  readonly motion = inject(MotionStore);
  readonly profile = input.required<SessionProfile>();
  readonly confetti = Array.from({ length: 14 }, (_, index) => index);
  // Só a quantidade é exibida; nomes e porcentagens ficam na descoberta e com a equipe.
  readonly found = computed(() => this.store.profiles.filter((item) => {
    const result = calculateMatch(this.profile().answers, item.matching);
    return !!result && result.eligible && result.relevant;
  }).length);
  readonly otherSide = computed(() => {
    const startup = this.profile().answers.kind === "STARTUP";
    if (this.found() === 1) return startup ? "mentor" : "startup";
    return startup ? "mentores" : "startups";
  });
  readonly shown = signal(0);
  @ViewChild("completeHeading") private readonly heading?: ElementRef<HTMLElement>;
  private timer?: ReturnType<typeof setInterval>;

  constructor() { inject(DestroyRef).onDestroy(() => clearInterval(this.timer)); }
  ngAfterViewInit(): void {
    this.heading?.nativeElement.focus();
    this.countUp();
  }
  // O número sobe até o total; sem animação, aparece direto.
  private countUp(): void {
    const total = this.found();
    if (!this.motion.allowed() || total <= 1) { this.shown.set(total); return; }
    this.timer = setInterval(() => {
      this.shown.update((value) => value + 1);
      if (this.shown() >= total) clearInterval(this.timer);
    }, 120);
  }
}
