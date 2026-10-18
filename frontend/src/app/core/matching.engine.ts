import { MatchProfile, TopicId, cityLabel, momentLabel, profileIsComplete, sectorLabel, slotLabel, topicLabel } from "./profile.models";

export const MATCH_RULE_VERSION = "damatch-rules-v2";
export interface MatchCriterion {
  key: "primary" | "secondary" | "sector" | "moment";
  label: string;
  points: number;
  maximum: number;
}
export interface MatchResult {
  version: typeof MATCH_RULE_VERSION;
  eligible: boolean;
  relevant: boolean;
  score: number | null;
  partial: boolean;
  criteria: MatchCriterion[];
  reasons: string[];
  limitations: string[];
  blockers: string[];
  practicalMatches: number;
}
function commonSlots(startup: MatchProfile, mentor: MatchProfile) {
  return startup.availability.filter((slot) => mentor.availability.some((other) => other.day === slot.day && other.period === slot.period));
}
function meetingBlockers(startup: MatchProfile, mentor: MatchProfile): string[] {
  const blockers: string[] = [];
  if (!mentor.accepting) blockers.push("O mentor está com novas mentorias em pausa.");
  const online = startup.format !== "PRESENCIAL" && mentor.format !== "PRESENCIAL";
  const inPerson = startup.format !== "ONLINE" && mentor.format !== "ONLINE" && !!startup.cityId && startup.cityId === mentor.cityId;
  if (!online && !inPerson) blockers.push("As modalidades ou cidades não permitem um encontro.");
  if (!commonSlots(startup, mentor).length) blockers.push("Não há combinações de dia e período em comum.");
  if (startup.cadence !== "FLEXIBLE" && mentor.cadence !== "FLEXIBLE" && startup.cadence !== mentor.cadence) blockers.push("A frequência escolhida para os encontros é diferente.");
  return blockers;
}
function needsCriteria(topics: TopicId[], mentor: MatchProfile): MatchCriterion[] {
  const [primary, secondary] = [...new Set(topics)].slice(0, 2);
  const maximum = secondary ? 50 : 70;
  const criteria: MatchCriterion[] = [{ key: "primary", label: "Prioridade: " + topicLabel(primary), points: mentor.topics.includes(primary) ? maximum : 0, maximum }];
  if (secondary) criteria.push({ key: "secondary", label: "Também busca: " + topicLabel(secondary), points: mentor.topics.includes(secondary) ? 20 : 0, maximum: 20 });
  return criteria;
}
function sectorCriterion(startup: MatchProfile, mentor: MatchProfile): MatchCriterion {
  if (startup.sectors.includes("DISCOVERING")) return { key: "sector", label: "Setor ainda em descoberta", points: 0, maximum: 0 };
  const direct = startup.sectors.some((sector) => mentor.sectors.includes(sector));
  let points = 0;
  if (direct) points = 20;
  else if (mentor.sectors.includes("GENERAL")) points = 10;
  return { key: "sector", label: "Experiência declarada no setor", points, maximum: 20 };
}
interface MatchDescription { reasons: string[]; limitations: string[]; }
function describeNeeds(startup: MatchProfile, mentor: MatchProfile): MatchDescription {
  const reasons: string[] = [];
  const limitations: string[] = [];
  for (const topic of new Set(startup.topics)) {
    if (mentor.topics.includes(topic)) {
      reasons.push("Pode orientar em " + topicLabel(topic).toLocaleLowerCase("pt-BR") + ".");
      if (mentor.experience[topic] === "PRACTICAL") reasons.push("Relata experiência prática em " + topicLabel(topic).toLocaleLowerCase("pt-BR") + ".");
    } else limitations.push(topicLabel(topic) + " não está entre as especialidades declaradas.");
  }
  return { reasons, limitations };
}
function addSectorDescription(description: MatchDescription, startup: MatchProfile, sector: MatchCriterion): void {
  if (sector.points === 20) description.reasons.push("Experiência em " + sectorLabel(startup.sectors[0]).toLocaleLowerCase("pt-BR") + ".");
  else if (sector.points === 10) description.reasons.push("Atuação geral para apoiar diferentes setores.");
  else description.limitations.push(sector.maximum ? "O setor da startup não está entre os setores declarados pelo mentor." : "Defina o setor para obter a porcentagem completa.");
}
function describeResult(startup: MatchProfile, mentor: MatchProfile, criteria: MatchCriterion[]): MatchDescription {
  const description = describeNeeds(startup, mentor);
  const { reasons, limitations } = description;
  addSectorDescription(description, startup, criteria.find((item) => item.key === "sector")!);
  if (mentor.moments.includes(startup.moments[0])) reasons.push("Apoio em " + momentLabel(startup.moments[0]).toLocaleLowerCase("pt-BR") + ".");
  else limitations.push("O momento da ideia não está entre os momentos de atuação declarados pelo mentor.");
  if (startup.format !== "PRESENCIAL" && mentor.format !== "PRESENCIAL") reasons.push("Vocês aceitam encontros online.");
  else reasons.push("Encontros presenciais em " + cityLabel(startup.cityId) + ".");
  reasons.push(
    "Janela em comum: " + slotLabel(commonSlots(startup, mentor)[0]) + ". O horário exato ainda precisa ser combinado.",
    startup.cadence === mentor.cadence && startup.cadence !== "FLEXIBLE" ? "Vocês escolheram a mesma frequência de encontros." : "Há flexibilidade para combinar a frequência.",
  );
  return { reasons, limitations };
}
// Regra pura e simétrica; os pesos do MVP expressam aderência declarada, não probabilidade.
export function calculateMatch(first: MatchProfile, second: MatchProfile): MatchResult | null {
  if (first.kind === second.kind || !profileIsComplete(first) || !profileIsComplete(second)) return null;
  const startup = first.kind === "STARTUP" ? first : second;
  const mentor = first.kind === "MENTOR" ? first : second;
  const blockers = meetingBlockers(startup, mentor);
  if (blockers.length) return { version: MATCH_RULE_VERSION, eligible: false, relevant: false, score: null, partial: false, criteria: [], reasons: [], limitations: [], blockers, practicalMatches: 0 };
  const moment = { key: "moment" as const, label: "Apoio ao momento da ideia", points: mentor.moments.includes(startup.moments[0]) ? 10 : 0, maximum: 10 };
  const criteria = [...needsCriteria(startup.topics, mentor), sectorCriterion(startup, mentor), moment];
  const partial = startup.sectors.includes("DISCOVERING");
  const relevant = startup.topics.some((topic) => mentor.topics.includes(topic));
  return {
    version: MATCH_RULE_VERSION, eligible: true, relevant,
    score: partial || !relevant ? null : criteria.reduce((sum, item) => sum + item.points, 0),
    partial, criteria, ...describeResult(startup, mentor, criteria), blockers: [],
    practicalMatches: [...new Set(startup.topics)].filter((topic) => mentor.topics.includes(topic) && mentor.experience[topic] === "PRACTICAL").length,
  };
}

