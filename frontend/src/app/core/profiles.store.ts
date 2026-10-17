import { Injectable, signal } from "@angular/core";
import { MatchProfile } from "./profile.models";
export type { ProfileKind } from "./profile.models";

export interface DemoProfile {
  id: string;
  name: string;
  initials: string;
  kind: "MENTOR" | "STARTUP";
  title: string;
  city: string;
  sector: string;
  stage: "Ideação";
  description: string;
  tags: string[];
  reasons: string[];
  availability: string;
  theme: "mint" | "sand" | "blue";
  matching: MatchProfile;
}
// Pessoas e organizações inventadas exclusivamente para o protótipo.
export const DEMO_PROFILES: readonly DemoProfile[] = [
  {
    "id": "mentor-1",
    "name": "Marina Albuquerque",
    "initials": "MA",
    "kind": "MENTOR",
    "title": "Estratégia de produto e validação",
    "city": "Recife",
    "sector": "Tecnologia",
    "stage": "Ideação",
    "description": "Apoia fundadores a transformar hipóteses em experimentos, conversar com clientes e definir um primeiro produto com foco.",
    "tags": [
      "Ideação",
      "Produto",
      "Pesquisa"
    ],
    "reasons": [
      "Experiência em validação de negócios",
      "Apoio a startups em ideação",
      "Disponibilidade para encontros online"
    ],
    "availability": "2 encontros por mês",
    "theme": "mint",
    "matching": {
      "kind": "MENTOR",
      "format": "AMBOS",
      "cityId": "PE_RECIFE",
      "days": [
        "MON",
        "WED",
        "THU"
      ],
      "periods": [
        "AFTERNOON",
        "EVENING"
      ],
      "accepting": true,
      "sectors": [
        "TECH",
        "EDUCATION"
      ],
      "topics": [
        "VALIDATION",
        "CUSTOMERS",
        "PITCH"
      ]
    }
  },
  {
    "id": "mentor-2",
    "name": "Rafael Nascimento",
    "initials": "RN",
    "kind": "MENTOR",
    "title": "Tecnologia para ideias em construção",
    "city": "Recife",
    "sector": "Tecnologia",
    "stage": "Ideação",
    "description": "Ajuda equipes em ideação a entender possibilidades técnicas, organizar hipóteses e escolher os primeiros experimentos para uma ideia.",
    "tags": [
      "Ideação",
      "Tecnologia",
      "Experimentos"
    ],
    "reasons": [
      "Orientação para primeiros experimentos",
      "Atuação em tecnologia",
      "Apoio a equipes em ideação"
    ],
    "availability": "1 encontro por mês",
    "theme": "blue",
    "matching": {
      "kind": "MENTOR",
      "format": "ONLINE",
      "cityId": "PE_RECIFE",
      "days": [
        "TUE",
        "THU",
        "SAT"
      ],
      "periods": [
        "EVENING"
      ],
      "accepting": true,
      "sectors": [
        "TECH"
      ],
      "topics": [
        "PROTOTYPE",
        "VALIDATION",
        "BUSINESS"
      ]
    }
  },
  {
    "id": "mentor-3",
    "name": "Camila Duarte",
    "initials": "CD",
    "kind": "MENTOR",
    "title": "Público e posicionamento de novas ideias",
    "city": "João Pessoa",
    "sector": "Economia criativa",
    "stage": "Ideação",
    "description": "Ajuda projetos criativos em ideação a conhecer seu público, investigar problemas e construir uma proposta de valor.",
    "tags": [
      "Marketing",
      "Posicionamento",
      "Design"
    ],
    "reasons": [
      "Foco em economia criativa",
      "Apoio à descoberta do público",
      "Mentoria remota disponível"
    ],
    "availability": "2 encontros por mês",
    "theme": "sand",
    "matching": {
      "kind": "MENTOR",
      "format": "ONLINE",
      "cityId": "PB_JOAO_PESSOA",
      "days": [
        "MON",
        "WED",
        "SAT"
      ],
      "periods": [
        "AFTERNOON",
        "EVENING"
      ],
      "accepting": true,
      "sectors": [
        "CREATIVE",
        "EDUCATION"
      ],
      "topics": [
        "CUSTOMERS",
        "PITCH",
        "PROTOTYPE"
      ]
    }
  },
  {
    "id": "mentor-4",
    "name": "André Monteiro",
    "initials": "AM",
    "kind": "MENTOR",
    "title": "Modelo de negócio e finanças",
    "city": "Salvador",
    "sector": "Impacto social",
    "stage": "Ideação",
    "description": "Contribui com modelos de receita, planejamento financeiro e estruturação de iniciativas de impacto social.",
    "tags": [
      "Finanças",
      "Modelo de negócio",
      "Impacto"
    ],
    "reasons": [
      "Apoio à estruturação financeira",
      "Experiência com negócios de impacto",
      "Atendimento a projetos em ideação"
    ],
    "availability": "1 encontro por mês",
    "theme": "mint",
    "matching": {
      "kind": "MENTOR",
      "format": "ONLINE",
      "cityId": "BA_SALVADOR",
      "days": [
        "TUE",
        "THU",
        "FRI"
      ],
      "periods": [
        "EVENING"
      ],
      "accepting": true,
      "sectors": [
        "SOCIAL",
        "COMMERCE"
      ],
      "topics": [
        "BUSINESS",
        "PRICING",
        "PITCH"
      ]
    }
  },
  {
    "id": "startup-1",
    "name": "Semente Labs",
    "initials": "SL",
    "kind": "STARTUP",
    "title": "Tecnologia para aprender melhor",
    "city": "Recife",
    "sector": "Tecnologia",
    "stage": "Ideação",
    "description": "Startup fictícia em ideação que investiga dificuldades de aprendizagem. Busca mentoria para entender o problema e estruturar sua proposta inicial.",
    "tags": [
      "Educação",
      "Ideação",
      "Pesquisa"
    ],
    "reasons": [
      "Busca apoio para estruturar uma ideia",
      "Atua no setor de tecnologia",
      "Está no estágio de ideação"
    ],
    "availability": "Busca mentoria para sua ideia",
    "theme": "sand",
    "matching": {
      "kind": "STARTUP",
      "format": "ONLINE",
      "cityId": "PE_RECIFE",
      "days": [
        "MON",
        "WED",
        "THU"
      ],
      "periods": [
        "AFTERNOON",
        "EVENING"
      ],
      "accepting": true,
      "sectors": [
        "TECH"
      ],
      "topics": [
        "VALIDATION",
        "PROTOTYPE"
      ]
    }
  },
  {
    "id": "startup-2",
    "name": "Maré Studio",
    "initials": "MS",
    "kind": "STARTUP",
    "title": "Novas experiências na economia criativa",
    "city": "João Pessoa",
    "sector": "Economia criativa",
    "stage": "Ideação",
    "description": "Projeto fictício de experiências digitais para a economia criativa. Procura apoio em modelo de negócio e descoberta de clientes.",
    "tags": [
      "Design",
      "Experiências digitais",
      "Negócio"
    ],
    "reasons": [
      "Busca apoio em modelo de negócio",
      "Atua na economia criativa",
      "Está no estágio de ideação"
    ],
    "availability": "Busca mentoria de negócio",
    "theme": "blue",
    "matching": {
      "kind": "STARTUP",
      "format": "ONLINE",
      "cityId": "PB_JOAO_PESSOA",
      "days": [
        "MON",
        "WED",
        "THU"
      ],
      "periods": [
        "AFTERNOON",
        "EVENING"
      ],
      "accepting": true,
      "sectors": [
        "CREATIVE"
      ],
      "topics": [
        "BUSINESS",
        "CUSTOMERS"
      ]
    }
  },
  {
    "id": "mentor-5",
    "name": "Beatriz Lima",
    "initials": "BL",
    "kind": "MENTOR",
    "title": "Validação para negócios de saúde",
    "city": "Recife",
    "sector": "Saúde e bem-estar",
    "stage": "Ideação",
    "description": "Mentora fictícia que apoia equipes a ouvir usuários, testar hipóteses e estruturar modelos de negócio na saúde.",
    "tags": [
      "Saúde",
      "Validação",
      "Clientes"
    ],
    "reasons": [
      "Experiência em saúde e bem-estar",
      "Orientação para descoberta de clientes"
    ],
    "availability": "Novas mentorias disponíveis",
    "theme": "mint",
    "matching": {
      "kind": "MENTOR",
      "format": "PRESENCIAL",
      "cityId": "PE_RECIFE",
      "days": [
        "MON",
        "WED"
      ],
      "periods": [
        "MORNING",
        "AFTERNOON"
      ],
      "accepting": true,
      "sectors": [
        "HEALTH"
      ],
      "topics": [
        "VALIDATION",
        "CUSTOMERS",
        "BUSINESS"
      ]
    }
  },
  {
    "id": "mentor-6",
    "name": "Lucas Azevedo",
    "initials": "LA",
    "kind": "MENTOR",
    "title": "Do primeiro plano à proposta de valor",
    "city": "Recife",
    "sector": "Atuação geral",
    "stage": "Ideação",
    "description": "Mentor fictício com atuação geral em organização da ideia, modelo de negócio e comunicação da proposta.",
    "tags": [
      "Negócio",
      "Apresentação",
      "Ideação"
    ],
    "reasons": [
      "Atuação geral em diferentes setores",
      "Apoio ao modelo de negócio"
    ],
    "availability": "Novas mentorias disponíveis",
    "theme": "blue",
    "matching": {
      "kind": "MENTOR",
      "format": "ONLINE",
      "cityId": "PE_RECIFE",
      "days": [
        "MON",
        "TUE",
        "WED",
        "THU",
        "FRI",
        "SAT"
      ],
      "periods": [
        "MORNING",
        "AFTERNOON",
        "EVENING"
      ],
      "accepting": true,
      "sectors": [
        "GENERAL"
      ],
      "topics": [
        "BUSINESS",
        "PRICING",
        "PITCH"
      ]
    }
  },
  {
    "id": "startup-3",
    "name": "Raiz Circular",
    "initials": "RC",
    "kind": "STARTUP",
    "title": "Uma ideia para reaproveitar melhor",
    "city": "Salvador",
    "sector": "Impacto social",
    "stage": "Ideação",
    "description": "Ideia fictícia que investiga o desperdício no comércio local. Busca orientação para pensar em custos e em um modelo sustentável.",
    "tags": [
      "Impacto social",
      "Custos",
      "Negócio"
    ],
    "reasons": [
      "Busca apoio em preços e custos",
      "Investiga um problema do comércio local"
    ],
    "availability": "Busca orientação para a ideia",
    "theme": "sand",
    "matching": {
      "kind": "STARTUP",
      "format": "ONLINE",
      "cityId": "BA_SALVADOR",
      "days": [
        "TUE",
        "THU",
        "FRI"
      ],
      "periods": [
        "EVENING"
      ],
      "accepting": true,
      "sectors": [
        "SOCIAL"
      ],
      "topics": [
        "PRICING",
        "BUSINESS"
      ]
    }
  },
  {
    "id": "startup-4",
    "name": "Cuidado Perto",
    "initials": "CP",
    "kind": "STARTUP",
    "title": "Escutar antes de construir uma solução",
    "city": "Recife",
    "sector": "Saúde e bem-estar",
    "stage": "Ideação",
    "description": "Projeto fictício em ideação que quer entender dificuldades de famílias no acompanhamento de cuidados de saúde.",
    "tags": [
      "Saúde",
      "Pesquisa",
      "Validação"
    ],
    "reasons": [
      "Busca validar o problema",
      "Quer conhecer melhor seu público"
    ],
    "availability": "Busca orientação para a ideia",
    "theme": "mint",
    "matching": {
      "kind": "STARTUP",
      "format": "PRESENCIAL",
      "cityId": "PE_RECIFE",
      "days": [
        "MON",
        "WED"
      ],
      "periods": [
        "MORNING",
        "AFTERNOON"
      ],
      "accepting": true,
      "sectors": [
        "HEALTH"
      ],
      "topics": [
        "CUSTOMERS",
        "VALIDATION"
      ]
    }
  }
];
@Injectable({ providedIn: "root" })
export class ProfilesStore {
  readonly profiles = DEMO_PROFILES;
  readonly savedIds = signal<readonly string[]>([]);
  isSaved(id: string): boolean { return this.savedIds().includes(id); }
  toggleSaved(id: string): void {
    if (!this.profiles.some((profile) => profile.id === id)) return;
    this.savedIds.update((ids) => ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id]);
  }
}
