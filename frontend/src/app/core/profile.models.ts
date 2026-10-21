export type ProfileKind = "MENTOR" | "STARTUP";
export const QUESTIONNAIRE_VERSION = "damatch-profile-v2";
export const PROFILE_STEPS = ["Momento", "Setor", "Objetivos", "Encontro", "Agenda"] as const;
export const MOMENTS = [
  { id: "PROBLEM", label: "Descoberta do problema", startup: "Um problema que quero entender", detail: "Investigar a dificuldade antes de pensar na solução.", icon: "search" },
  { id: "AUDIENCE", label: "Descoberta do público", startup: "Um público que quero conhecer", detail: "Ouvir quem convive com o problema.", icon: "compass" },
  { id: "SOLUTION", label: "Primeiro desenho da solução", startup: "Uma solução esboçada", detail: "Organizar a proposta e desenhar algo simples para testar.", icon: "spark" },
  { id: "VALIDATING", label: "Primeiras validações", startup: "Primeiras conversas com usuários", detail: "Aprender com os primeiros retornos e ajustar a ideia.", icon: "network" },
] as const;
export type MomentId = (typeof MOMENTS)[number]["id"];
export const SECTORS = [
  { id: "TECH", label: "Tecnologia", icon: "network" },
  { id: "EDUCATION", label: "Educação", icon: "spark" },
  { id: "HEALTH", label: "Saúde e bem-estar", icon: "shield" },
  { id: "CREATIVE", label: "Economia criativa", icon: "spark" },
  { id: "SOCIAL", label: "Impacto social", icon: "network" },
  { id: "COMMERCE", label: "Comércio e serviços", icon: "compass" },
  { id: "ENVIRONMENT", label: "Meio ambiente e circularidade", icon: "spark" },
  { id: "FOOD", label: "Alimentação e agro", icon: "compass" },
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
export type TopicExperience = "PRACTICAL" | "KNOWLEDGE";
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
export interface AvailabilitySlot { day: DayId; period: PeriodId; }
export const CADENCES = [
  { id: "WEEKLY", label: "Semanal", detail: "Uma vez por semana" },
  { id: "BIWEEKLY", label: "Quinzenal", detail: "A cada duas semanas" },
  { id: "MONTHLY", label: "Mensal", detail: "Uma vez por mês" },
  { id: "FLEXIBLE", label: "Podemos combinar", detail: "Tenho flexibilidade" },
] as const;
export type Cadence = (typeof CADENCES)[number]["id"];
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
  moments: MomentId[];
  sectors: SectorId[];
  // Para startups, a ordem indica prioridade. Para mentores, são especialidades.
  topics: TopicId[];
  experience: Partial<Record<TopicId, TopicExperience>>;
  format: MeetingFormat | "";
  cityId: string;
  availability: AvailabilitySlot[];
  cadence: Cadence | "";
  accepting: boolean;
}
export interface ProfileDraft extends MatchProfile { projectName: string; }
export interface SessionProfile {
  questionnaireVersion: typeof QUESTIONNAIRE_VERSION;
  name: string;
  displayName: string;
  answers: ProfileDraft;
}
export function sectorLabel(id: SectorId): string {
  if (id === "GENERAL") return "Atuação geral";
  if (id === "DISCOVERING") return "Setor em descoberta";
  return SECTORS.find((item) => item.id === id)?.label ?? id;
}
export function topicLabel(id: TopicId): string { return TOPICS.find((item) => item.id === id)?.label ?? id; }
export function momentLabel(id: MomentId): string { return MOMENTS.find((item) => item.id === id)?.label ?? id; }
export function cadenceLabel(id: Cadence | ""): string { return CADENCES.find((item) => item.id === id)?.label ?? "A definir"; }
export function cityLabel(id: string): string { return CITIES.find((city) => city.id === id)?.city ?? "Local a combinar"; }
export function slotLabel(slot: AvailabilitySlot): string {
  return (DAYS.find((day) => day.id === slot.day)?.full ?? slot.day) + " · " + (PERIODS.find((period) => period.id === slot.period)?.label ?? slot.period);
}
export function emptyProfile(kind: ProfileKind): ProfileDraft {
  return { kind, moments: [], sectors: [], topics: [], experience: {}, format: "", cityId: "", availability: [], cadence: "", accepting: true, projectName: "" };
}
export function stepIsComplete(profile: MatchProfile, step: number): boolean {
  switch (step) {
    case 0: return profile.moments.length > 0 && profile.moments.length <= (profile.kind === "STARTUP" ? 1 : MOMENTS.length) && profile.moments.every((id) => MOMENTS.some((moment) => moment.id === id));
    case 1: return validSectors(profile);
    case 2: return validTopics(profile);
    case 3: return FORMATS.some((format) => format.id === profile.format) && (profile.format !== "PRESENCIAL" || CITIES.some((city) => city.id === profile.cityId));
    case 4: return CADENCES.some((cadence) => cadence.id === profile.cadence) && profile.availability.length > 0 && profile.availability.every((slot) => DAYS.some((day) => day.id === slot.day) && PERIODS.some((period) => period.id === slot.period));
    default: return false;
  }
}
function validSectors(profile: MatchProfile): boolean {
  if (!profile.sectors.length || profile.sectors.length > (profile.kind === "STARTUP" ? 1 : 3)) return false;
  const special = profile.kind === "STARTUP" ? "DISCOVERING" : "GENERAL";
  return profile.sectors.every((id) => id === special || SECTORS.some((sector) => sector.id === id))
    && (!profile.sectors.includes(special) || profile.sectors.length === 1);
}
function validTopics(profile: MatchProfile): boolean {
  const topics = [...new Set(profile.topics)];
  return topics.length > 0 && topics.length <= (profile.kind === "STARTUP" ? 2 : 3)
    && topics.every((id) => TOPICS.some((topic) => topic.id === id))
    && (profile.kind === "STARTUP" || topics.every((id) => profile.experience[id] === "PRACTICAL" || profile.experience[id] === "KNOWLEDGE"));
}
export function profileIsComplete(profile: MatchProfile): boolean {
  return [0, 1, 2, 3, 4].every((step) => stepIsComplete(profile, step));
}

