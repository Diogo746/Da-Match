import { describe, expect, it } from "vitest";
import { calculateMatch, MATCH_RULE_VERSION } from "./matching.engine";
import { MatchProfile, emptyProfile } from "./profile.models";
import { DEMO_PROFILES } from "./profiles.store";

const startup: MatchProfile = { ...emptyProfile("STARTUP"), moments: ["PROBLEM"], sectors: ["TECH"], topics: ["VALIDATION", "PRICING"], format: "ONLINE", availability: [{ day: "MON", period: "EVENING" }, { day: "THU", period: "EVENING" }], cadence: "FLEXIBLE" };
const mentor: MatchProfile = { ...startup, kind: "MENTOR", topics: ["VALIDATION", "PITCH"], experience: { VALIDATION: "PRACTICAL", PRICING: "PRACTICAL", PITCH: "KNOWLEDGE", BUSINESS: "PRACTICAL" } };

describe("Compatibilidade v2 entre necessidades e experiência", () => {
  it("gera 80 pontos para prioridade, setor e momento, sem a necessidade secundária", () => {
    const result = calculateMatch(startup, mentor)!;
    expect(result.score).toBe(80);
    expect(result.version).toBe(MATCH_RULE_VERSION);
    expect(result.eligible).toBe(true);
    expect(result.reasons.join(" ")).toContain("validar a ideia");
    expect(result.limitations.join(" ")).toContain("Preços e custos");
  });
  it("alcança 100 ao atender às necessidades, ao setor e ao momento", () => {
    const result = calculateMatch(startup, { ...mentor, topics: ["VALIDATION", "PRICING"] })!;
    expect(result.score).toBe(100);
    expect(result.limitations).toEqual([]);
    expect(result.criteria.reduce((sum, criterion) => sum + criterion.maximum, 0)).toBe(100);
  });
  it("mudar a prioridade muda a nota do mesmo mentor", () => {
    expect(calculateMatch({ ...startup, topics: ["PRICING", "VALIDATION"] }, mentor)!.score).toBe(50);
  });
  it("redistribui os 70 pontos quando a segunda necessidade não foi escolhida", () => {
    const result = calculateMatch({ ...startup, topics: ["VALIDATION"] }, mentor)!;
    expect(result.score).toBe(100);
    expect(result.criteria[0].maximum).toBe(70);
  });
  it("atribui 20 pontos ao setor direto, 10 à atuação geral e zero ao setor diferente", () => {
    const both = { ...mentor, topics: ["VALIDATION", "PRICING"] as MatchProfile["topics"] };
    expect(calculateMatch(startup, { ...both, sectors: ["GENERAL"] })!.score).toBe(90);
    expect(calculateMatch(startup, { ...both, sectors: ["HEALTH"] })!.score).toBe(80);
    expect(calculateMatch(startup, { ...mentor, sectors: ["HEALTH", "TECH"] })!.score).toBe(80);
  });
  it("considera o momento dentro da ideação sem excluir um apoio útil", () => {
    const result = calculateMatch(startup, { ...mentor, moments: ["SOLUTION"] })!;
    expect(result.score).toBe(70);
    expect(result.relevant).toBe(true);
    expect(result.limitations.join(" ")).toContain("momento da ideia");
  });
  it("não inventa porcentagem quando o setor está em descoberta", () => {
    const result = calculateMatch({ ...startup, sectors: ["DISCOVERING"] }, mentor)!;
    expect(result.score).toBeNull();
    expect(result.partial).toBe(true);
    expect(result.relevant).toBe(true);
    expect(result.limitations.join(" ")).toContain("Defina o setor");
  });
  it("não recomenda por setor e momento se nenhuma necessidade for atendida", () => {
    const result = calculateMatch(startup, { ...mentor, topics: ["BUSINESS"] })!;
    expect(result.relevant).toBe(false);
    expect(result.score).toBeNull();
  });
  it("explica a experiência prática sem alterar a porcentagem", () => {
    const practical = calculateMatch(startup, mentor)!;
    const knowledge = calculateMatch(startup, { ...mentor, experience: { VALIDATION: "KNOWLEDGE", PITCH: "KNOWLEDGE" } })!;
    expect(practical.score).toBe(knowledge.score);
    expect(practical.practicalMatches).toBe(1);
    expect(knowledge.practicalMatches).toBe(0);
    expect(practical.reasons.join(" ")).toContain("experiência prática");
  });
  it("não altera as respostas e não conta uma prioridade duplicada duas vezes", () => {
    const before = structuredClone(startup);
    calculateMatch(startup, mentor);
    expect(startup).toEqual(before);
    const duplicate = calculateMatch({ ...startup, topics: ["VALIDATION", "VALIDATION"] }, mentor)!;
    const single = calculateMatch({ ...startup, topics: ["VALIDATION"] }, mentor)!;
    expect(duplicate).toEqual(single);
    expect(duplicate.score).toBe(100);
  });
  it("não calcula entre dois perfis do mesmo público", () => {
    expect(calculateMatch(startup, startup)).toBeNull();
    expect(calculateMatch(mentor, mentor)).toBeNull();
  });
  it.each([{ moments: [] }, { topics: [] }, { sectors: [] }, { availability: [] }, { cadence: "" }, { format: "" }])("exige o preenchimento mínimo: %o", (patch) => {
    expect(calculateMatch({ ...startup, ...patch } as MatchProfile, mentor)).toBeNull();
  });
});
describe("Viabilidade das conversas", () => {
  it("respeita a pausa de novas mentorias", () => {
    const result = calculateMatch(startup, { ...mentor, accepting: false })!;
    expect(result.eligible).toBe(false);
    expect(result.score).toBeNull();
    expect(result.blockers.join(" ")).toContain("pausa");
  });
  it("não cria horários cruzando dias e períodos que nunca foram escolhidos juntos", () => {
    const a: MatchProfile = { ...startup, availability: [{ day: "MON", period: "EVENING" }, { day: "THU", period: "AFTERNOON" }] };
    const b: MatchProfile = { ...mentor, availability: [{ day: "MON", period: "AFTERNOON" }, { day: "THU", period: "EVENING" }] };
    expect(calculateMatch(a, b)!.eligible).toBe(false);
    const compatible = calculateMatch(a, { ...b, availability: [...b.availability, { day: "MON", period: "EVENING" }] })!;
    expect(compatible.eligible).toBe(true);
    expect(compatible.reasons.join(" ")).toContain("Segunda-feira · Noite");
  });
  it("distingue frequência incompatível de uma preferência flexível", () => {
    const weekly: MatchProfile = { ...startup, cadence: "WEEKLY" };
    expect(calculateMatch(weekly, { ...mentor, cadence: "MONTHLY" })!.eligible).toBe(false);
    expect(calculateMatch(weekly, { ...mentor, cadence: "FLEXIBLE" })!.eligible).toBe(true);
    expect(calculateMatch(weekly, { ...mentor, cadence: "WEEKLY" })!.reasons.join(" ")).toContain("mesma frequência");
  });
  it("exige modalidade viável e cidade em comum quando o encontro depende de presencial", () => {
    expect(calculateMatch(startup, { ...mentor, format: "PRESENCIAL", cityId: "PE_RECIFE" })!.eligible).toBe(false);
    const local: MatchProfile = { ...startup, format: "PRESENCIAL", cityId: "PE_RECIFE" };
    expect(calculateMatch(local, { ...mentor, format: "AMBOS", cityId: "PE_RECIFE" })!.reasons.join(" ")).toContain("Recife");
    expect(calculateMatch(local, { ...mentor, format: "AMBOS", cityId: "PB_JOAO_PESSOA" })!.eligible).toBe(false);
    expect(calculateMatch({ ...local, cityId: "" }, mentor)).toBeNull();
  });
  it("considera o online entre pessoas flexíveis de cidades diferentes", () => {
    expect(calculateMatch({ ...startup, format: "AMBOS", cityId: "PE_RECIFE" }, { ...mentor, format: "AMBOS", cityId: "BA_SALVADOR" })!.eligible).toBe(true);
  });
  it("adicionar janelas não reduz a pontuação", () => {
    expect(calculateMatch({ ...startup, availability: [...startup.availability, { day: "SAT", period: "MORNING" }] }, mentor)!.score).toBe(calculateMatch(startup, mentor)!.score);
  });
  it("é simétrica e mantém os limites em todos os pares do catálogo", () => {
    for (const a of DEMO_PROFILES) for (const b of DEMO_PROFILES) {
      const result = calculateMatch(a.matching, b.matching);
      expect(result).toEqual(calculateMatch(b.matching, a.matching));
      if (result?.score !== null && result?.score !== undefined) {
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(100);
      }
    }
  });
});

