import { MatchProfile, TopicId, cityLabel, profileIsComplete, sectorLabel, topicLabel } from "./profile.models";

export const MATCH_RULE_VERSION = "damatch-rules-v1";

export interface MatchCriterion {
  key: "primary" | "secondary" | "sector";
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
}

function meetingBlockers(startup: MatchProfile, mentor: MatchProfile): string[] {
  const blockers: string[] = [];
  if (!mentor.accepting) blockers.push("O mentor está com novas mentorias em pausa.");
  const online = startup.format !== "PRESENCIAL" && mentor.format !== "PRESENCIAL";
  const inPerson = startup.format !== "ONLINE" && mentor.format !== "ONLINE" && !!startup.cityId && startup.cityId === mentor.cityId;
  if (!online && !inPerson) blockers.push("As modalidades ou cidades não permitem um encontro.");
  if (!startup.days.some((day) => mentor.days.includes(day))) blockers.push("Não há dias da semana em comum.");
  if (!startup.periods.some((period) => mentor.periods.includes(period))) blockers.push("Não há períodos do dia em comum.");
  return blockers;
}

function needsCriteria(topics: TopicId[], mentor: MatchProfile): MatchCriterion[] {
  const [primary, secondary] = [...new Set(topics)].slice(0, 2);
  const maximum = secondary ? 50 : 70;
  const criteria: MatchCriterion[] = [{ key: "primary", label: `Prioridade: ${topicLabel(primary)}`, points: mentor.topics.includes(primary) ? maximum : 0, maximum }];
  if (secondary) criteria.push({ key: "secondary", label: `Também busca: ${topicLabel(secondary)}`, points: mentor.topics.includes(secondary) ? 20 : 0, maximum: 20 });
  return criteria;
}

function sectorCriterion(startup: MatchProfile, mentor: MatchProfile): MatchCriterion {
  if (startup.sectors.includes("DISCOVERING")) return { key: "sector", label: "Setor ainda em descoberta", points: 0, maximum: 0 };
  const direct = startup.sectors.some((sector) => mentor.sectors.includes(sector));
  let points = 0;
  if (direct) points = 30;
  else if (mentor.sectors.includes("GENERAL")) points = 15;
  return { key: "sector", label: "Experiência declarada no setor", points, maximum: 30 };
}

function describeResult(startup: MatchProfile, mentor: MatchProfile, criteria: MatchCriterion[]): { reasons: string[]; limitations: string[] } {
  const reasons: string[] = [];
  const limitations: string[] = [];
  for (const criterion of criteria.filter((item) => item.key !== "sector")) {
    if (criterion.points > 0) reasons.push(`Pode orientar em ${criterion.label.split(": ")[1].toLocaleLowerCase("pt-BR")}.`);
    else limitations.push(`${criterion.label.split(": ")[1]} não está entre as especialidades declaradas.`);
  }
  const sector = criteria.find((item) => item.key === "sector")!;
  if (sector.points === 30) reasons.push(`Experiência em ${sectorLabel(startup.sectors[0]).toLocaleLowerCase("pt-BR")}.`);
  else if (sector.points === 15) reasons.push("Atuação geral para apoiar diferentes setores.");
  else if (sector.maximum > 0) limitations.push("O setor da startup não está entre os setores declarados pelo mentor.");
  else limitations.push("Defina o setor para obter a porcentagem completa.");
  if (startup.format !== "PRESENCIAL" && mentor.format !== "PRESENCIAL") reasons.push("Vocês aceitam encontros online.");
  else reasons.push(`Encontros presenciais em ${cityLabel(startup.cityId)}.`);
  reasons.push("Há dias e períodos disponíveis em comum.");
  return { reasons, limitations };
}

// Regra pura e simétrica: o mesmo par sempre produz o mesmo resultado.
// Os pesos são hipóteses do MVP; não representam probabilidade de sucesso.
export function calculateMatch(first: MatchProfile, second: MatchProfile): MatchResult | null {
  if (first.kind === second.kind || !profileIsComplete(first) || !profileIsComplete(second)) return null;
  const startup = first.kind === "STARTUP" ? first : second;
  const mentor = first.kind === "MENTOR" ? first : second;
  const blockers = meetingBlockers(startup, mentor);
  if (blockers.length) return { version: MATCH_RULE_VERSION, eligible: false, relevant: false, score: null, partial: false, criteria: [], reasons: [], limitations: [], blockers };
  const criteria = [...needsCriteria(startup.topics, mentor), sectorCriterion(startup, mentor)];
  const partial = startup.sectors.includes("DISCOVERING");
  const relevant = criteria.some((item) => item.key !== "sector" && item.points > 0);
  return {
    version: MATCH_RULE_VERSION,
    eligible: true,
    relevant,
    score: partial ? null : criteria.reduce((sum, item) => sum + item.points, 0),
    partial,
    criteria,
    ...describeResult(startup, mentor, criteria),
    blockers: [],
  };
}
