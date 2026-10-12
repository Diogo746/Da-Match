import { Injectable, signal } from "@angular/core";
export type ProfileKind = "MENTOR" | "INVESTIDOR" | "STARTUP";
export interface DemoProfile {
  id: string;
  name: string;
  initials: string;
  kind: ProfileKind;
  title: string;
  city: string;
  sector: string;
  stages: string[];
  description: string;
  tags: string[];
  reasons: string[];
  availability: string;
  theme: "mint" | "sand" | "blue";
}
// Pessoas e organizações inventadas exclusivamente para o protótipo.
export const DEMO_PROFILES: readonly DemoProfile[] = [
  {
    id: "mentor-1",
    name: "Marina Albuquerque",
    initials: "MA",
    kind: "MENTOR",
    title: "Estratégia de produto e validação",
    city: "Recife",
    sector: "Tecnologia",
    stages: ["Ideação", "Validação"],
    description:
      "Apoia fundadores a transformar hipóteses em experimentos, conversar com clientes e definir um primeiro produto com foco.",
    tags: ["Produto", "Validação", "Pesquisa"],
    reasons: [
      "Experiência em validação de negócios",
      "Apoio a startups em ideação",
      "Disponibilidade para encontros online",
    ],
    availability: "2 encontros por mês",
    theme: "mint",
  },
  {
    id: "mentor-2",
    name: "Rafael Nascimento",
    initials: "RN",
    kind: "MENTOR",
    title: "Tecnologia e primeiros produtos",
    city: "Recife",
    sector: "Tecnologia",
    stages: ["Validação", "Operação"],
    description:
      "Orienta decisões de arquitetura, planejamento de MVP e organização de equipes de desenvolvimento em negócios nascentes.",
    tags: ["MVP", "Tecnologia", "Gestão"],
    reasons: [
      "Experiência no desenvolvimento de MVPs",
      "Atuação em tecnologia",
      "Apoio a equipes em validação",
    ],
    availability: "1 encontro por mês",
    theme: "blue",
  },
  {
    id: "mentor-3",
    name: "Camila Duarte",
    initials: "CD",
    kind: "MENTOR",
    title: "Marketing e entrada no mercado",
    city: "João Pessoa",
    sector: "Economia criativa",
    stages: ["Validação", "Operação"],
    description:
      "Ajuda negócios criativos a definir posicionamento, entender seu público e planejar os primeiros canais de aquisição.",
    tags: ["Marketing", "Posicionamento", "Design"],
    reasons: [
      "Foco em economia criativa",
      "Experiência na entrada no mercado",
      "Mentoria remota disponível",
    ],
    availability: "2 encontros por mês",
    theme: "sand",
  },
  {
    id: "mentor-4",
    name: "André Monteiro",
    initials: "AM",
    kind: "MENTOR",
    title: "Modelo de negócio e finanças",
    city: "Salvador",
    sector: "Impacto social",
    stages: ["Ideação", "Validação"],
    description:
      "Contribui com modelos de receita, planejamento financeiro e estruturação de iniciativas de impacto social.",
    tags: ["Finanças", "Modelo de negócio", "Impacto"],
    reasons: [
      "Apoio à estruturação financeira",
      "Experiência com negócios de impacto",
      "Atendimento a projetos em ideação",
    ],
    availability: "1 encontro por mês",
    theme: "mint",
  },
  {
    id: "investidor-1",
    name: "Horizonte Capital",
    initials: "HC",
    kind: "INVESTIDOR",
    title: "Tecnologia com raízes no Nordeste",
    city: "Recife",
    sector: "Tecnologia",
    stages: ["Validação", "Operação"],
    description:
      "Perfil demonstrativo de um grupo interessado em negócios de tecnologia que estejam validando sua solução ou iniciando a operação.",
    tags: ["SaaS", "B2B", "Tecnologia"],
    reasons: [
      "Interesse em negócios de tecnologia",
      "Foco regional no Nordeste",
      "Abertura a negócios em validação",
    ],
    availability: "Conversas iniciais online",
    theme: "blue",
  },
  {
    id: "investidor-2",
    name: "Raiz Investimentos",
    initials: "RI",
    kind: "INVESTIDOR",
    title: "Negócios com impacto positivo",
    city: "Salvador",
    sector: "Impacto social",
    stages: ["Operação"],
    description:
      "Perfil demonstrativo voltado a projetos com propósito social e primeiros resultados operacionais.",
    tags: ["Impacto", "Sustentabilidade", "Educação"],
    reasons: [
      "Foco em impacto social",
      "Interesse em negócios em operação",
      "Atuação no Nordeste",
    ],
    availability: "Análise inicial de projetos",
    theme: "mint",
  },
  {
    id: "startup-1",
    name: "Semente Labs",
    initials: "SL",
    kind: "STARTUP",
    title: "Tecnologia para aprender melhor",
    city: "Recife",
    sector: "Tecnologia",
    stages: ["Validação"],
    description:
      "Startup fictícia que explora ferramentas de apoio à aprendizagem. Busca orientação para validar sua proposta e priorizar o MVP.",
    tags: ["Educação", "Produto", "MVP"],
    reasons: [
      "Busca apoio em validação",
      "Atua no setor de tecnologia",
      "Está no estágio de validação",
    ],
    availability: "Busca mentoria de produto",
    theme: "sand",
  },
  {
    id: "startup-2",
    name: "Maré Studio",
    initials: "MS",
    kind: "STARTUP",
    title: "Novas experiências na economia criativa",
    city: "João Pessoa",
    sector: "Economia criativa",
    stages: ["Ideação"],
    description:
      "Projeto fictício de experiências digitais para a economia criativa. Procura apoio em modelo de negócio e descoberta de clientes.",
    tags: ["Design", "Experiências digitais", "Negócio"],
    reasons: [
      "Busca apoio em modelo de negócio",
      "Atua na economia criativa",
      "Está no estágio de ideação",
    ],
    availability: "Busca mentoria de negócio",
    theme: "blue",
  },
];
@Injectable({ providedIn: "root" })
export class ProfilesStore {
  readonly profiles = DEMO_PROFILES;
  readonly savedIds = signal<readonly string[]>([]);
  isSaved(id: string): boolean {
    return this.savedIds().includes(id);
  }
  toggleSaved(id: string): void {
    if (!this.profiles.some((profile) => profile.id === id)) return;
    this.savedIds.update((ids) =>
      ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id],
    );
  }
}
