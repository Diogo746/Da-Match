import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, ViewChild, input } from "@angular/core";
import { RouterLink } from "@angular/router";
import { STARTUP_FIELDS, STARTUP_STATUS_LABELS, StartupProfile } from "../../core/startup.models";
import { LumenGuideComponent } from "../../shared/lumen-guide.component";

@Component({
  selector: "app-startup-registration-complete",
  standalone: true,
  imports: [RouterLink, LumenGuideComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="confirmation" aria-labelledby="startup-created-title">
      <app-lumen-guide message="Sua ideia já tem um lugar aqui. O cadastro da startup foi confirmado." />
      <p class="eyebrow">CADASTRO CONFIRMADO</p>
      <h1 #heading id="startup-created-title" tabindex="-1">Sua startup foi cadastrada.</h1>
      <p>A startup e o vínculo da pessoa fundadora foram confirmados pelo servidor.</p>
      <div class="startup-card">
        <h2>{{ startup().nomeProvisorio }}</h2>
        <dl>
          @for (field of fields; track field.key) {
            @if (field.key !== 'nomeProvisorio') {
              <dt>{{ field.label }}</dt><dd>{{ startup()[field.key] }}</dd>
            }
          }
          <dt>Momento da ideia</dt><dd>{{ statusLabels[startup().statusValidacao] }}</dd>
          <dt>Pessoa fundadora</dt><dd>{{ startup().membros[0].nomeUsuario }}</dd>
        </dl>
      </div>
      <p>Você já pode entrar com o e-mail e a senha da pessoa fundadora. O cadastro não inicia uma sessão automaticamente.</p>
      <a class="button button-primary" routerLink="/entrar">Entrar na minha conta</a>
      <a class="button button-secondary" routerLink="/">Explorar a demonstração</a>
      <p class="field-help">Depois de entrar, abra Minha conta para consultar e editar sua startup. O questionário e as recomendações ainda são demonstrativos.</p>
    </section>`,
  styles: `
    :host{display:block}.confirmation{max-width:660px;margin:0 auto}.confirmation app-lumen-guide{--lumen-size:85px;margin-bottom:24px}
    h1{font-size:clamp(27px,4vw,36px);line-height:1.2;letter-spacing:-1px;margin:12px 0;outline:none}
    p,dd{font-size:13px;line-height:1.8;overflow-wrap:anywhere}p{color:var(--muted)}
    .startup-card{padding:24px;border:1px solid var(--border);border-radius:16px;background:var(--surface);margin:24px 0}
    h2{margin:0 0 16px;font-size:21px;overflow-wrap:anywhere}dl{margin:0}dt{font-size:12px;font-weight:650;margin-top:18px}dd{margin:6px 0 0;white-space:pre-line}
    .button{margin:10px 8px 10px 0}.field-help{font-size:12px}@media(max-width:430px){.startup-card{padding:18px}}
  `,
})
export class StartupRegistrationCompleteComponent implements AfterViewInit {
  readonly startup = input.required<StartupProfile>();
  readonly fields = STARTUP_FIELDS;
  readonly statusLabels = STARTUP_STATUS_LABELS;
  @ViewChild("heading") private readonly heading?: ElementRef<HTMLElement>;

  ngAfterViewInit(): void { this.heading?.nativeElement.focus(); }
}
