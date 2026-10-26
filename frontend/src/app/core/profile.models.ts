export type ProfileKind = "MENTOR" | "STARTUP";
export const QUESTIONNAIRE_VERSION = "damatch-profile-v3";
export const PROFILE_STEPS = ["Momento", "Setor", "Objetivos", "Público", "Encontro", "Agenda"] as const;
// Três fases de duas etapas: o progresso fica visível e cada fase concluída é comemorada.
export const PROFILE_PHASES: Record<ProfileKind, readonly string[]> = {
  STARTUP: ["Sua ideia", "Sua missão", "Seu ritmo"],
  MENTOR: ["Sua experiência", "Sua contribuição", "Seu ritmo"],
};
export const PHASE_DONE: Record<ProfileKind, readonly string[]> = {
  STARTUP: ["Ideia registrada!", "Agora sabemos do que você precisa"],
  MENTOR: ["Experiência registrada!", "Agora sabemos como você ajuda"],
};
export function phaseOf(step: number): number { return Math.floor(step / 2); }
// Etapas usadas pelo cálculo de compatibilidade. Público, formação e vagas ainda não entram na nota.
export const MATCH_STEPS = [0, 1, 2, 4, 5] as const;
export const MOMENTS = [
  { id: "PROBLEM", label: "Descoberta do problema", startup: "Um problema que quero entender", detail: "Investigar a dificuldade antes de pensar na solução.", icon: "search" },
  { id: "AUDIENCE", label: "Descoberta do público", startup: "Um público que quero conhecer", detail: "Ouvir quem convive com o problema.", icon: "compass" },
  { id: "SOLUTION", label: "Primeiro desenho da solução", startup: "Uma solução esboçada", detail: "Organizar a proposta e desenhar algo simples para testar.", icon: "spark" },
  { id: "VALIDATING", label: "Primeiras validações", startup: "Primeiras conversas com usuários", detail: "Aprender com os primeiros retornos e ajustar a ideia.", icon: "network" },
] as const;
export type MomentId = (typeof MOMENTS)[number]["id"];
export const SECTORS = [
  { id: "TECH", label: "Tecnologia", icon: "network" },
  { id: "HEALTH", label: "Saúde e bem-estar", icon: "shield" },
  { id: "EDUCATION", label: "Educação", icon: "spark" },
  { id: "AGRO", label: "Agronegócio", icon: "compass" },
  { id: "SOCIAL", label: "Impacto social", icon: "network" },
  { id: "ENVIRONMENT", label: "Meio ambiente e circularidade", icon: "spark" },
  { id: "FINANCE", label: "Finanças", icon: "clock" },
  { id: "INSURANCE", label: "Seguros", icon: "shield" },
  { id: "COMMERCE", label: "Comércio e serviços", icon: "compass" },
  { id: "FOOD", label: "Alimentação", icon: "compass" },
  { id: "LOGISTICS", label: "Logística e mobilidade", icon: "arrow" },
  { id: "REAL_ESTATE", label: "Imóveis e construção", icon: "pin" },
  { id: "LEGAL", label: "Jurídico", icon: "shield" },
  { id: "WORK", label: "RH e trabalho", icon: "network" },
  { id: "MARKETING", label: "Marketing e publicidade", icon: "arrow" },
  { id: "INDUSTRY", label: "Indústria", icon: "network" },
  { id: "TOURISM", label: "Turismo e eventos", icon: "pin" },
  { id: "CREATIVE", label: "Economia criativa", icon: "spark" },
  { id: "GAMES", label: "Games, entretenimento e mídia", icon: "spark" },
  { id: "FASHION", label: "Moda e beleza", icon: "spark" },
  { id: "SPORTS", label: "Esportes", icon: "compass" },
  { id: "PETS", label: "Pets", icon: "compass" },
  { id: "GOVERNMENT", label: "Governo e cidades", icon: "pin" },
] as const;
export type SectorId = (typeof SECTORS)[number]["id"] | "GENERAL" | "DISCOVERING";
// family agrupa as ajudas para o tipo de mentor: Guia, Maker, Estrategista ou Conector.
export const TOPICS = [
  { id: "VALIDATION", label: "Validar a ideia", detail: "Investigar se o problema existe.", icon: "search", family: "GUIDE" },
  { id: "CUSTOMERS", label: "Entender o cliente", detail: "Conhecer quem precisa da solução.", icon: "compass", family: "GUIDE" },
  { id: "BUSINESS", label: "Modelo de negócio", detail: "Pensar em como a ideia se sustenta.", icon: "network", family: "STRATEGIST" },
  { id: "PROTOTYPE", label: "Primeiro protótipo", detail: "Desenhar algo simples para testar.", icon: "spark", family: "MAKER" },
  { id: "PRICING", label: "Preços e custos", detail: "Explorar a viabilidade da ideia.", icon: "clock", family: "STRATEGIST" },
  { id: "PITCH", label: "Apresentar a proposta", detail: "Explicar a ideia com clareza.", icon: "arrow", family: "STRATEGIST" },
  { id: "TECHNOLOGY", label: "Ferramentas e tecnologia", detail: "Escolher como construir a solução.", icon: "network", family: "MAKER" },
  { id: "DESIGN", label: "Design e experiência", detail: "Deixar a solução simples de usar.", icon: "spark", family: "MAKER" },
  { id: "MARKETING", label: "Marketing e redes sociais", detail: "Fazer a ideia ser conhecida.", icon: "arrow", family: "CONNECTOR" },
  { id: "FIRST_CUSTOMERS", label: "Primeiros clientes", detail: "Conseguir as primeiras pessoas que usam ou pagam.", icon: "compass", family: "CONNECTOR" },
  { id: "LEGAL", label: "Questões jurídicas", detail: "Abrir empresa, registrar marca e fazer contratos.", icon: "shield", family: "STRATEGIST" },
  { id: "PARTNERS", label: "Sócios e time", detail: "Encontrar quem construa junto.", icon: "network", family: "CONNECTOR" },
  { id: "GRANTS", label: "Editais e programas de apoio", detail: "Incubadoras, aceleradoras e editais.", icon: "spark", family: "CONNECTOR" },
  { id: "ORGANIZATION", label: "Organização e rotina", detail: "Priorizar tarefas e manter o ritmo.", icon: "clock", family: "GUIDE" },
] as const;
export type TopicId = (typeof TOPICS)[number]["id"];
export type TopicFamily = (typeof TOPICS)[number]["family"];
export type TopicExperience = "PRACTICAL" | "KNOWLEDGE";
// startupOnly marca respostas que só fazem sentido para quem está começando uma ideia.
export const AUDIENCES = [
  { id: "B2C", label: "Pessoas (B2C)", startup: "Vou vender para pessoas", icon: "compass", startupOnly: false },
  { id: "B2B", label: "Empresas (B2B)", startup: "Vou vender para empresas", icon: "network", startupOnly: false },
  { id: "B2B2C", label: "Empresas que atendem pessoas (B2B2C)", startup: "Vou vender para empresas que atendem pessoas", icon: "arrow", startupOnly: false },
  { id: "B2G", label: "Governo (B2G)", startup: "Vou vender para o governo", icon: "pin", startupOnly: false },
  { id: "UNKNOWN", label: "Ainda não sei", startup: "Ainda não sei", icon: "search", startupOnly: true },
] as const;
export type AudienceId = (typeof AUDIENCES)[number]["id"];
// Áreas de formação ou experiência; servem para buscar quem complementa a pessoa.
export const BACKGROUNDS = [
  { id: "TECH", label: "Tecnologia", startupOnly: false },
  { id: "BUSINESS", label: "Negócios e gestão", startupOnly: false },
  { id: "DESIGN", label: "Design e comunicação", startupOnly: false },
  { id: "HEALTH", label: "Saúde", startupOnly: false },
  { id: "EDUCATION", label: "Educação", startupOnly: false },
  { id: "LAW", label: "Direito", startupOnly: false },
  { id: "ENGINEERING", label: "Engenharia e indústria", startupOnly: false },
  { id: "AGRO", label: "Agro", startupOnly: false },
  { id: "STUDENT", label: "Ainda estou estudando", startupOnly: true },
  { id: "OTHER", label: "Outra área", startupOnly: false },
] as const;
export type BackgroundId = (typeof BACKGROUNDS)[number]["id"];
export const CAPACITIES = [
  { id: "ONE", label: "1 startup", detail: "Acompanhamento bem próximo." },
  { id: "FEW", label: "2 a 3 startups", detail: "Um pequeno grupo por vez." },
  { id: "MANY", label: "4 ou mais", detail: "Conversas mais pontuais." },
] as const;
export type CapacityId = (typeof CAPACITIES)[number]["id"];
export const SECTOR_LIMIT: Record<ProfileKind, number> = { STARTUP: 2, MENTOR: 5 };
export const TOPIC_LIMIT: Record<ProfileKind, number> = { STARTUP: 2, MENTOR: 6 };
export const AUDIENCE_LIMIT: Record<ProfileKind, number> = { STARTUP: 2, MENTOR: 4 };
export const BACKGROUND_LIMIT: Record<ProfileKind, number> = { STARTUP: 3, MENTOR: 2 };
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
// Respostas do questionário que ainda não participam do cálculo de compatibilidade.
export interface ProfileDraft extends MatchProfile {
  projectName: string;
  audiences: AudienceId[];
  backgrounds: BackgroundId[];
  capacity: CapacityId | "";
}
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
export function audienceLabel(id: AudienceId): string { return AUDIENCES.find((item) => item.id === id)?.label ?? id; }
export function backgroundLabel(id: BackgroundId): string { return BACKGROUNDS.find((item) => item.id === id)?.label ?? id; }
export function capacityLabel(id: CapacityId | ""): string { return CAPACITIES.find((item) => item.id === id)?.label ?? "A definir"; }
export function cadenceLabel(id: Cadence | ""): string { return CADENCES.find((item) => item.id === id)?.label ?? "A definir"; }
export function cityLabel(id: string): string { return CITIES.find((city) => city.id === id)?.city ?? "Local a combinar"; }
export function slotLabel(slot: AvailabilitySlot): string {
  return (DAYS.find((day) => day.id === slot.day)?.full ?? slot.day) + " · " + (PERIODS.find((period) => period.id === slot.period)?.label ?? slot.period);
}
export function emptyProfile(kind: ProfileKind): ProfileDraft {
  return { kind, moments: [], sectors: [], topics: [], experience: {}, format: "", cityId: "", availability: [], cadence: "", accepting: true, projectName: "", audiences: [], backgrounds: [], capacity: "" };
}
export function stepIsComplete(profile: MatchProfile | ProfileDraft, step: number): boolean {
  switch (step) {
    case 0: return profile.moments.length > 0 && profile.moments.length <= (profile.kind === "STARTUP" ? 1 : MOMENTS.length) && profile.moments.every((id) => MOMENTS.some((moment) => moment.id === id));
    case 1: return validSectors(profile);
    case 2: return validTopics(profile);
    case 3: return "audiences" in profile && validAudience(profile);
    case 4: return FORMATS.some((format) => format.id === profile.format) && (profile.format !== "PRESENCIAL" || CITIES.some((city) => city.id === profile.cityId));
    case 5: return CADENCES.some((cadence) => cadence.id === profile.cadence) && profile.availability.length > 0 && profile.availability.every((slot) => DAYS.some((day) => day.id === slot.day) && PERIODS.some((period) => period.id === slot.period));
    default: return false;
  }
}
function validAudience(profile: ProfileDraft): boolean {
  const startup = profile.kind === "STARTUP";
  const audiences = [...new Set(profile.audiences)];
  const audiencesOk = audiences.length > 0 && audiences.length <= AUDIENCE_LIMIT[profile.kind]
    && audiences.every((id) => AUDIENCES.some((item) => item.id === id && (startup || !item.startupOnly)))
    && (!audiences.includes("UNKNOWN") || audiences.length === 1);
  const backgrounds = [...new Set(profile.backgrounds)];
  const backgroundOk = backgrounds.length > 0 && backgrounds.length <= BACKGROUND_LIMIT[profile.kind]
    && backgrounds.every((id) => BACKGROUNDS.some((item) => item.id === id && (startup || !item.startupOnly)));
  const capacityOk = startup || CAPACITIES.some((item) => item.id === profile.capacity);
  return audiencesOk && backgroundOk && capacityOk;
}
function validSectors(profile: MatchProfile): boolean {
  if (!profile.sectors.length || profile.sectors.length > SECTOR_LIMIT[profile.kind]) return false;
  const special = profile.kind === "STARTUP" ? "DISCOVERING" : "GENERAL";
  return profile.sectors.every((id) => id === special || SECTORS.some((sector) => sector.id === id))
    && (!profile.sectors.includes(special) || profile.sectors.length === 1);
}
function validTopics(profile: MatchProfile): boolean {
  const topics = [...new Set(profile.topics)];
  return topics.length > 0 && topics.length <= TOPIC_LIMIT[profile.kind]
    && topics.every((id) => TOPICS.some((topic) => topic.id === id))
    && (profile.kind === "STARTUP" || topics.every((id) => profile.experience[id] === "PRACTICAL" || profile.experience[id] === "KNOWLEDGE"));
}
// Usado pelo cálculo: perfis sem as respostas novas continuam elegíveis.
export function profileIsComplete(profile: MatchProfile | ProfileDraft): boolean {
  return MATCH_STEPS.every((step) => stepIsComplete(profile, step));
}
export function questionnaireIsComplete(profile: ProfileDraft): boolean {
  return PROFILE_STEPS.every((_, step) => stepIsComplete(profile, step));
}

