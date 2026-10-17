import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, ViewChild, input } from "@angular/core";
import { RouterLink } from "@angular/router";
import { SessionProfile } from "../../core/profile.models";
import { IconComponent } from "../../shared/icon.component";
import { LumenComponent } from "../../shared/lumen.component";
import { ProfilePreviewComponent } from "./profile-preview.component";

@Component({
  selector: "app-profile-complete",
  standalone: true,
  imports: [RouterLink, IconComponent, LumenComponent, ProfilePreviewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section class="complete-layout" aria-labelledby="complete-title">
    <div class="complete-copy"><app-lumen /><span class="complete-badge"><app-icon name="check" />Perfil concluído</span>
      <h1 #completeHeading id="complete-title" tabindex="-1">Boas conexões começam com quem você é.</h1>
      <p>{{ profile().answers.kind === 'STARTUP' ? 'Agora podemos apresentar mentores que ajudam no próximo passo da sua ideia.' : 'Agora podemos apresentar ideias que precisam da experiência que você compartilha.' }}</p>
      @if (profile().answers.kind === 'MENTOR' && !profile().answers.accepting) { <p class="pause-note">Seu perfil está em pausa para novas mentorias. Você pode retomar em Meu perfil.</p> }
      <div class="complete-actions"><a class="button button-primary" routerLink="/">Ver minhas indicações<app-icon name="arrow" /></a><a class="button button-secondary" routerLink="/meu-perfil">Meu perfil</a></div>
      <p class="complete-note">Perfil de demonstração, disponível nesta sessão. Recarregar a página reinicia o teste.</p>
    </div>
    <app-profile-preview [name]="profile().name" [draft]="profile().answers" />
  </section>`,
  styles: `:host{display:block}.complete-layout{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:65px;align-items:center;max-width:950px;margin:10px auto 30px}.complete-copy>app-lumen{width:100px;margin-bottom:18px}.complete-badge{display:inline-flex;align-items:center;gap:7px;color:var(--success-text);background:var(--success-bg);padding:7px 10px;border-radius:20px;font-size:10px;font-weight:650}.complete-badge app-icon{width:14px;height:14px}.complete-copy h1{font-size:clamp(29px,3.5vw,43px);letter-spacing:-1.4px;line-height:1.2;margin:18px 0}.complete-copy p{font-size:13px;line-height:1.9;color:var(--muted)}.complete-actions{display:flex;gap:10px;flex-wrap:wrap;margin:24px 0}.complete-copy .complete-note{font-size:10px;max-width:360px}.pause-note{border-left:3px solid var(--border-hover);padding-left:12px}@media(max-width:1000px){.complete-layout{grid-template-columns:1fr;gap:25px}.complete-layout>app-profile-preview{max-width:360px}.complete-copy>app-lumen{width:85px}}`,
})
export class ProfileCompleteComponent implements AfterViewInit {
  readonly profile = input.required<SessionProfile>();
  @ViewChild("completeHeading") private heading?: ElementRef<HTMLElement>;
  ngAfterViewInit(): void { this.heading?.nativeElement.focus(); }
}
