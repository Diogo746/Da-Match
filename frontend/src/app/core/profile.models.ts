export type ProfileKind = "MENTOR" | "STARTUP";

export const SECTORS = [
  { id: "TECH", label: "Tecnologia", icon: "network" },
  { id: "EDUCATION", label: "Educação", icon: "spark" },
  { id: "HEALTH", label: "Saúde e bem-estar", icon: "shield" },
  { id: "CREATIVE", label: "Economia criativa", icon: "spark" },
  { id: "SOCIAL", label: "Impacto social", icon: "network" },
  { id: "COMMERCE", label: "Comércio e serviços", icon: "compass" },
] as const;
export type SectorId = (typeof SECTORS)[number]["id"] | "GENERAL" | "DISCOVERING";

export const TOPICS = [
  { id: "VALIDATION", label: "Validar a ideia", detail: "Investigar se o problema existe.", icon: "search" },
  { id: "CUSTOMERS", label: "Entender o cliente", detail: "Conhecer quem precisa da solução.", icon: "compass" },
  { id: "BUSINESS", label: "Modelo de negócio", detail: "Pensar em como a ideia se sustenta.", icon: "network" },
  { id: "PROTOTYPE", label: "Primeiro protótipo", detail: "Desenhar algo simples para testar.", icon: "spark" },
  { id: "PRICING", label: "Preços e custos", detail: "Explorar a viabilidade da ideia.", icon: "clock" },
  { id: "PITCH", label: "Apresentar a proposta", detail: "Explicar a ideia com clareza.", icon: "arrow" },
] as const;
export type TopicId = (typeof TOPICS)[number]["id"];

export const DAYS = [
  { id: "MON", label: "Seg", full: "Segunda-feira" },
  { id: "TUE", label: "Ter", full: "Terça-feira" },
  { id: "WED", label: "Qua", full: "Quarta-feira" },
  { id: "THU", label: "Qui", full: "Quinta-feira" },
  { id: "FRI", label: "Sex", full: "Sexta-feira" },
  { id: "SAT", label: "Sáb", full: "Sábado" },
  { id: "SUN", label: "Dom", full: "Domingo" },
] as const;
export type DayId = (typeof DAYS)[number]["id"];

export const PERIODS = [
  { id: "MORNING", label: "Manhã", detail: "8h às 12h" },
  { id: "AFTERNOON", label: "Tarde", detail: "12h às 18h" },
  { id: "EVENING", label: "Noite", detail: "18h às 22h" },
] as const;
export type PeriodId = (typeof PERIODS)[number]["id"];

export const FORMATS = [
  { id: "ONLINE", label: "Online", detail: "Uma conversa de onde você estiver.", icon: "network" },
  { id: "PRESENCIAL", label: "Presencial", detail: "Um encontro na mesma cidade.", icon: "pin" },
  { id: "AMBOS", label: "Tenho flexibilidade", detail: "Online ou presencial, podemos combinar.", icon: "compass" },
] as const;
export type MeetingFormat = (typeof FORMATS)[number]["id"];

export const CITIES = [
  { id: "PE_RECIFE", label: "Recife · PE", city: "Recife" },
  { id: "PE_OLINDA", label: "Olinda · PE", city: "Olinda" },
  { id: "PE_JABOATAO", label: "Jaboatão dos Guararapes · PE", city: "Jaboatão dos Guararapes" },
  { id: "PE_CARUARU", label: "Caruaru · PE", city: "Caruaru" },
  { id: "PB_JOAO_PESSOA", label: "João Pessoa · PB", city: "João Pessoa" },
  { id: "BA_SALVADOR", label: "Salvador · BA", city: "Salvador" },
  { id: "CE_FORTALEZA", label: "Fortaleza · CE", city: "Fortaleza" },
  { id: "RN_NATAL", label: "Natal · RN", city: "Natal" },
] as const;

export interface MatchProfile {
  kind: ProfileKind;
  sectors: SectorId[];
  // Para startups, a ordem indica prioridade. Para mentores, são especialidades.
  topics: TopicId[];
  format: MeetingFormat | "";
  cityId: string;
  days: DayId[];
  periods: PeriodId[];
  accepting: boolean;
}

export interface ProfileDraft extends MatchProfile {
  projectName: string;
}

export interface SessionProfile {
  name: string;
  displayName: string;
  answers: ProfileDraft;
}

export function sectorLabel(id: SectorId): string {
  if (id === "GENERAL") return "Atuação geral";
  if (id === "DISCOVERING") return "Setor em descoberta";
  return SECTORS.find((item) => item.id === id)?.label ?? id;
}

export function topicLabel(id: TopicId): string {
  return TOPICS.find((item) => item.id === id)?.label ?? id;
}

export function cityLabel(id: string): string {
  return CITIES.find((city) => city.id === id)?.city ?? "Local a combinar";
}

export function emptyProfile(kind: ProfileKind): ProfileDraft {
  return { kind, sectors: [], topics: [], format: "", cityId: "", days: [], periods: [], accepting: true, projectName: "" };
}

export function stepIsComplete(profile: MatchProfile, step: number): boolean {
  switch (step) {
    case 0: return profile.sectors.length > 0;
    case 1: return profile.topics.length > 0;
    case 2: return profile.format !== "" && (profile.format !== "PRESENCIAL" || !!profile.cityId);
    case 3: return profile.days.length > 0 && profile.periods.length > 0;
    default: return false;
  }
}

export function profileIsComplete(profile: MatchProfile): boolean {
  return [0, 1, 2, 3].every((step) => stepIsComplete(profile, step));
}
