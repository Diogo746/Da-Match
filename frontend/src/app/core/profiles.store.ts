import { Injectable, signal } from "@angular/core";
export type ProfileKind = "MENTOR" | "STARTUP";
export interface DemoProfile {
  id: string;
  name: string;
  initials: string;
  kind: ProfileKind;
  title: string;
  city: string;
  sector: string;
  stage: "Ideação";
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
    stage: "Ideação",
    description:
      "Apoia fundadores a transformar hipóteses em experimentos, conversar com clientes e definir um primeiro produto com foco.",
    tags: ["Ideação", "Produto", "Pesquisa"],
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
    title: "Tecnologia para ideias em construção",
    city: "Recife",
    sector: "Tecnologia",
    stage: "Ideação",
    description:
      "Ajuda equipes em ideação a entender possibilidades técnicas, organizar hipóteses e escolher os primeiros experimentos para uma ideia.",
    tags: ["Ideação", "Tecnologia", "Experimentos"],
    reasons: [
      "Orientação para primeiros experimentos",
      "Atuação em tecnologia",
      "Apoio a equipes em ideação",
    ],
    availability: "1 encontro por mês",
    theme: "blue",
  },
  {
    id: "mentor-3",
    name: "Camila Duarte",
    initials: "CD",
    kind: "MENTOR",
    title: "Público e posicionamento de novas ideias",
    city: "João Pessoa",
    sector: "Economia criativa",
    stage: "Ideação",
    description:
      "Ajuda projetos criativos em ideação a conhecer seu público, investigar problemas e construir uma proposta de valor.",
    tags: ["Marketing", "Posicionamento", "Design"],
    reasons: [
      "Foco em economia criativa",
      "Apoio à descoberta do público",
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
    stage: "Ideação",
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
    id: "startup-1",
    name: "Semente Labs",
    initials: "SL",
    kind: "STARTUP",
    title: "Tecnologia para aprender melhor",
    city: "Recife",
    sector: "Tecnologia",
    stage: "Ideação",
    description:
      "Startup fictícia em ideação que investiga dificuldades de aprendizagem. Busca mentoria para entender o problema e estruturar sua proposta inicial.",
    tags: ["Educação", "Ideação", "Pesquisa"],
    reasons: [
      "Busca apoio para estruturar uma ideia",
      "Atua no setor de tecnologia",
      "Está no estágio de ideação",
    ],
    availability: "Busca mentoria para sua ideia",
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
    stage: "Ideação",
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
