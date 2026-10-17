import { describe, expect, it } from "vitest";
import { calculateMatch } from "./matching.engine";
import { MatchProfile } from "./profile.models";
import { DEMO_PROFILES } from "./profiles.store";

const startup: MatchProfile = { kind: "STARTUP", sectors: ["TECH"], topics: ["VALIDATION", "PRICING"], format: "ONLINE", cityId: "", days: ["MON", "THU"], periods: ["EVENING"], accepting: true };
const mentor: MatchProfile = { ...startup, kind: "MENTOR", topics: ["VALIDATION", "PITCH"] };

describe("Compatibilidade entre necessidades e experiência", () => {
  it("gera 80 pontos ao cobrir a prioridade principal e o setor, sem cobrir a secundária", () => {
    const result = calculateMatch(startup, mentor)!;
    expect(result.score).toBe(80);
    expect(result.eligible).toBe(true);
    expect(result.reasons.join(" ")).toContain("validar a ideia");
    expect(result.limitations.join(" ")).toContain("Preços e custos");
  });
  it("alcança 100 somente nos critérios declarados, sem depender de IA", () => {
    const result = calculateMatch(startup, { ...mentor, topics: ["VALIDATION", "PRICING"] })!;
    expect(result.score).toBe(100);
    expect(result.limitations).toEqual([]);
    expect(result.criteria.reduce((sum, criterion) => sum + criterion.maximum, 0)).toBe(100);
  });
  it("mudar a prioridade muda a nota do mesmo mentor", () => {
    expect(calculateMatch({ ...startup, topics: ["PRICING", "VALIDATION"] }, mentor)!.score).toBe(50);
  });
  it("não pune a startup por deixar a segunda necessidade opcional em branco", () => {
    const result = calculateMatch({ ...startup, topics: ["VALIDATION"] }, mentor)!;
    expect(result.score).toBe(100);
    expect(result.criteria[0].maximum).toBe(70);
  });
  it("tem o mesmo resultado quando visto pelo mentor ou pela startup", () => {
    expect(calculateMatch(startup, mentor)).toEqual(calculateMatch(mentor, startup));
  });
  it("distingue experiência direta, atuação geral e outro setor", () => {
    expect(calculateMatch(startup, { ...mentor, topics: ["VALIDATION", "PRICING"], sectors: ["GENERAL"] })!.score).toBe(85);
    expect(calculateMatch(startup, { ...mentor, topics: ["VALIDATION", "PRICING"], sectors: ["HEALTH"] })!.score).toBe(70);
    expect(calculateMatch(startup, { ...mentor, sectors: ["HEALTH", "TECH"] })!.score).toBe(80);
  });
  it("não inventa uma porcentagem quando o setor ainda está em descoberta", () => {
    const result = calculateMatch({ ...startup, sectors: ["DISCOVERING"] }, mentor)!;
    expect(result.score).toBeNull();
    expect(result.partial).toBe(true);
    expect(result.relevant).toBe(true);
    expect(result.limitations.join(" ")).toContain("Defina o setor");
  });
  it("identifica que coincidência de setor sozinha não atende à necessidade", () => {
    const result = calculateMatch(startup, { ...mentor, topics: ["BUSINESS"] })!;
    expect(result.relevant).toBe(false);
    expect(result.score).toBe(30);
  });
  it("não modifica as respostas originais e ignora uma prioridade duplicada", () => {
    const before = structuredClone(startup);
    calculateMatch(startup, mentor);
    expect(startup).toEqual(before);
    expect(calculateMatch({ ...startup, topics: ["VALIDATION", "VALIDATION"] }, mentor)!.score).toBe(100);
  });
  it("não calcula entre perfis do mesmo tipo", () => {
    expect(calculateMatch(startup, startup)).toBeNull();
    expect(calculateMatch(mentor, mentor)).toBeNull();
  });
  it.each([
    { topics: [] }, { sectors: [] }, { days: [] }, { periods: [] }, { format: "" },
  ])("exige dados mínimos para calcular: %o", (patch) => {
    expect(calculateMatch({ ...startup, ...patch } as MatchProfile, mentor)).toBeNull();
  });
});

describe("Viabilidade antes da indicação", () => {
  it("bloqueia mentor que pausou novas mentorias", () => {
    const result = calculateMatch(startup, { ...mentor, accepting: false })!;
    expect(result.eligible).toBe(false);
    expect(result.score).toBeNull();
    expect(result.blockers.join(" ")).toContain("pausa");
  });
  it("exige interseção de dias e de períodos", () => {
    expect(calculateMatch(startup, { ...mentor, days: ["SAT"] })!.eligible).toBe(false);
    expect(calculateMatch(startup, { ...mentor, periods: ["MORNING"] })!.eligible).toBe(false);
  });
  it("não mistura uma pessoa exclusivamente online com outra exclusivamente presencial", () => {
    expect(calculateMatch(startup, { ...mentor, format: "PRESENCIAL", cityId: "PE_RECIFE" })!.eligible).toBe(false);
  });
  it("considera cidade e modalidade para encontros presenciais", () => {
    const local = { ...startup, format: "PRESENCIAL", cityId: "PE_RECIFE" } as MatchProfile;
    expect(calculateMatch(local, { ...mentor, format: "AMBOS", cityId: "PE_RECIFE" })!.eligible).toBe(true);
    expect(calculateMatch(local, { ...mentor, format: "AMBOS", cityId: "PB_JOAO_PESSOA" })!.eligible).toBe(false);
    expect(calculateMatch(local, { ...mentor, format: "AMBOS", cityId: "PE_RECIFE" })!.reasons.join(" ")).toContain("Recife");
  });
  it("ignora distância quando ambos aceitam online e não relaxa uma restrição presencial", () => {
    expect(calculateMatch({ ...startup, format: "AMBOS", cityId: "PE_RECIFE" }, { ...mentor, format: "AMBOS", cityId: "BA_SALVADOR" })!.eligible).toBe(true);
    expect(calculateMatch({ ...startup, format: "PRESENCIAL", cityId: "" }, mentor)).toBeNull();
  });
  it("adicionar opções à agenda não reduz a compatibilidade", () => {
    const flexible = { ...startup, days: [...startup.days, "SAT"], periods: [...startup.periods, "MORNING"] } as MatchProfile;
    expect(calculateMatch(flexible, mentor)!.score).toBe(calculateMatch(startup, mentor)!.score);
  });
  it("mantém simetria e limites em todos os pares do catálogo", () => {
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
