import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { IconComponent } from "../../shared/icon.component";
@Component({
  selector: "app-about",
  standalone: true,
  imports: [RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section class="about-hero">
      <p class="eyebrow">CONEXÕES COM CONTEXTO</p>
      <h1>Encontrar apoio deve começar por entender quem pode somar.</h1>
      <p>
        O DaMatch está sendo desenvolvido para aproximar startups nascentes,
        mentores e investidores do Nordeste. O recorte inicial é Recife e o
        ecossistema do Porto Digital.
      </p>
      <a routerLink="/solicitar-acesso" class="button button-primary"
        >Solicitar acesso<app-icon name="arrow"
      /></a>
    </section>
    <section class="journey" aria-label="Jornada prevista do produto">
      @for (step of steps; track step.number) {
        <article>
          <span>{{ step.number }}</span>
          <h2>{{ step.title }}</h2>
          <p>{{ step.description }}</p>
        </article>
      }
    </section>
    <section class="about-note">
      <app-icon name="shield" />
      <div>
        <h2>Conexão é o começo, não uma garantia.</h2>
        <p>
          O DaMatch não movimentará dinheiro nem garantirá investimentos ou
          parcerias. Interesse mútuo permite iniciar uma conexão; reuniões
          ajudam os participantes a conversar sobre possibilidades.
        </p>
      </div>
    </section>
    <section class="demo-scope">
      <h2>O que você pode experimentar agora</h2>
      <p>
        Explore perfis fictícios, combine filtros, salve perfis nesta sessão e
        teste a solicitação de acesso. Login, aprovação administrativa,
        matching, conexões e reuniões ainda dependem da integração com o
        backend.
      </p>
      <a class="text-button" routerLink="/"
        >Explorar os perfis<app-icon name="arrow"
      /></a>
    </section>`,
  styles: `
    :host {
      display: block;
      max-width: 1060px;
      margin: auto;
    }
    .about-hero {
      max-width: 690px;
      padding: 20px 0 35px;
    }
    .about-hero h1 {
      font-size: clamp(29px, 3.6vw, 46px);
      line-height: 1.2;
      letter-spacing: -1.7px;
      margin: 17px 0 22px;
    }
    .about-hero > p:not(.eyebrow) {
      font-size: 14px;
      line-height: 1.9;
      color: var(--muted);
    }
    .about-hero > .button {
      margin-top: 15px;
    }
    .journey {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }
    .journey article {
      padding: 25px 20px;
      border: 1px solid var(--border);
      border-radius: 12px;
      background: #fff;
    }
    .journey article > span {
      font-size: 24px;
      color: #83ab9a;
      font-weight: 600;
    }
    .journey h2 {
      font-size: 15px;
      line-height: 1.5;
      margin: 20px 0 10px;
    }
    .journey p,
    .about-note p,
    .demo-scope p {
      font-size: 12px;
      line-height: 1.9;
      color: var(--muted);
      margin: 0;
    }
    .about-note {
      display: flex;
      gap: 18px;
      background: #e4f0e9;
      border: 1px solid #cfe2d7;
      border-radius: 12px;
      padding: 25px;
      margin: 28px 0;
    }
    .about-note > app-icon {
      color: var(--teal);
      width: 25px;
      height: 25px;
    }
    .about-note h2,
    .demo-scope h2 {
      font-size: 17px;
      margin: 0 0 12px;
    }
    .demo-scope {
      padding: 20px 0;
    }
    .demo-scope .text-button {
      margin-top: 17px;
      text-decoration: none;
      display: inline-flex;
    }
    @media (max-width: 1050px) {
      .journey {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    @media (max-width: 430px) {
      .journey {
        grid-template-columns: 1fr;
      }
      .about-hero h1 {
        letter-spacing: -1px;
      }
      .about-note {
        padding: 20px;
      }
    }
  `,
})
export class AboutComponent {
  readonly steps = [
    {
      number: "01",
      title: "Um perfil que conta sua história",
      description:
        "Objetivos, setor, experiência e estágio ajudam a apresentar o que cada participante busca ou oferece.",
    },
    {
      number: "02",
      title: "Descoberta com mais contexto",
      description:
        "Busca e recomendações deverão facilitar a comparação e apresentar os motivos de compatibilidade.",
    },
    {
      number: "03",
      title: "Interesse dos dois lados",
      description:
        "Uma conexão será criada quando os participantes demonstrarem interesse mútuo.",
    },
    {
      number: "04",
      title: "Uma conversa para avançar",
      description:
        "Após a conexão, os participantes poderão propor e acompanhar uma reunião.",
    },
  ];
}
