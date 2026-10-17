import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, ViewChild, input } from "@angular/core";
import { RouterLink } from "@angular/router";
import { MentorAccount } from "../../core/registration.gateway";
import { LumenGuideComponent } from "../../shared/lumen-guide.component";

@Component({
  selector: "app-mentor-registration-complete",
  standalone: true,
  imports: [RouterLink, LumenGuideComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="confirmation" aria-labelledby="mentor-created-title">
      <app-lumen-guide message="Seu cadastro foi confirmado. Obrigado por compartilhar sua experiência." />
      <p class="eyebrow">CADASTRO CONFIRMADO</p>
      <h1 #heading id="mentor-created-title" tabindex="-1">Seu cadastro de mentor foi criado.</h1>
      <p class="intro">Estes são os dados confirmados pelo servidor.</p>
      <div class="account-card">
        <h2>{{ mentor().nome }}</h2>
        <p class="email">{{ mentor().email }}</p>
        <h3>Como você pode ajudar</h3>
        <p class="biography">{{ mentor().biografia }}</p>
        @if (mentor().linkedin) { <h3>LinkedIn</h3><p>{{ mentor().linkedin }}</p> }
        @if (mentor().instagram) { <h3>Instagram</h3><p>{{ mentor().instagram }}</p> }
      </div>
      <p class="notice">Sua conta foi registrada. O login, a edição online e o salvamento das preferências de mentoria serão disponibilizados nas próximas etapas.</p>
      <a class="button button-primary" routerLink="/">Explorar a demonstração</a>
      <p class="field-help">Os perfis e as porcentagens da descoberta ainda são fictícios.</p>
    </section>`,
  styles: `
    :host{display:block}.confirmation{max-width:620px;margin:0 auto}.confirmation app-lumen-guide{--lumen-size:85px;margin-bottom:24px}
    h1{font-size:clamp(27px,4vw,36px);line-height:1.2;letter-spacing:-1px;margin:12px 0;outline:none}.intro,.notice{font-size:13px;color:var(--muted);line-height:1.8}
    .account-card{padding:24px;border:1px solid var(--border);border-radius:16px;background:var(--surface);margin:24px 0}.account-card h2{margin:0 0 6px;font-size:21px}
    .account-card h3{font-size:11px;color:var(--muted);margin:22px 0 7px}.account-card p{font-size:13px;line-height:1.8;margin:0;overflow-wrap:anywhere}.biography{white-space:pre-line}.email{color:var(--muted)}
    .notice{padding:16px;background:var(--surface-tint);border-radius:10px}.button{margin:10px 0}.field-help{margin-bottom:0}
    @media(max-width:430px){.account-card{padding:20px}.confirmation app-lumen-guide{--lumen-size:70px}}
  `,
})
export class MentorRegistrationCompleteComponent implements AfterViewInit {
  readonly mentor = input.required<MentorAccount>();
  @ViewChild("heading") private readonly heading?: ElementRef<HTMLElement>;

  ngAfterViewInit(): void { this.heading?.nativeElement.focus(); }
}
