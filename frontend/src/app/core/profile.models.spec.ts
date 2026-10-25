import { describe, expect, it } from "vitest";
import { AudienceId, BackgroundId, MatchProfile, MomentId, ProfileDraft, SectorId, TopicId, audienceLabel, backgroundLabel, cadenceLabel, capacityLabel, cityLabel, emptyProfile, momentLabel, phaseOf, profileIsComplete, questionnaireIsComplete, slotLabel, stepIsComplete } from "./profile.models";

const startup: MatchProfile = { ...emptyProfile("STARTUP"), moments: ["PROBLEM"], sectors: ["TECH"], topics: ["VALIDATION"], format: "ONLINE", cadence: "FLEXIBLE", availability: [{ day: "MON", period: "EVENING" }] };
const mentor: MatchProfile = { ...startup, kind: "MENTOR", experience: { VALIDATION: "PRACTICAL" } };
const startupDraft: ProfileDraft = { ...emptyProfile("STARTUP"), ...startup, audiences: ["B2C"], backgrounds: ["TECH"] };
const mentorDraft: ProfileDraft = { ...emptyProfile("MENTOR"), ...mentor, audiences: ["B2B"], backgrounds: ["BUSINESS"], capacity: "FEW" };
describe("Respostas válidas do questionário v3", () => {
  it("exige as seis etapas no questionário e só as do cálculo para a compatibilidade", () => {
    expect(questionnaireIsComplete(startupDraft)).toBe(true);
    expect(questionnaireIsComplete(mentorDraft)).toBe(true);
    expect(profileIsComplete(startup)).toBe(true);
    expect(profileIsComplete(mentor)).toBe(true);
    expect(questionnaireIsComplete({ ...startupDraft, audiences: [] })).toBe(false);
    expect(profileIsComplete({ ...startupDraft, audiences: [] })).toBe(true);
    expect(profileIsComplete(emptyProfile("STARTUP"))).toBe(false);
    expect(stepIsComplete(startup, 6)).toBe(false);
  });
  it("agrupa as seis etapas em três fases de duas", () => {
    expect([0, 1, 2, 3, 4, 5].map(phaseOf)).toEqual([0, 0, 1, 1, 2, 2]);
  });
  it("mantém um momento por startup e permite vários ao mentor", () => {
    expect(stepIsComplete({ ...startup, moments: ["PROBLEM", "SOLUTION"] }, 0)).toBe(false);
    expect(stepIsComplete({ ...mentor, moments: ["PROBLEM", "SOLUTION"] }, 0)).toBe(true);
    expect(stepIsComplete({ ...startup, moments: ["DESCONHECIDO" as MomentId] }, 0)).toBe(false);
  });
  it("trata setor em descoberta e atuação geral como respostas específicas de cada papel", () => {
    expect(stepIsComplete({ ...startup, sectors: ["DISCOVERING"] }, 1)).toBe(true);
    expect(stepIsComplete({ ...startup, sectors: ["GENERAL"] }, 1)).toBe(false);
    expect(stepIsComplete({ ...startup, sectors: ["DISCOVERING", "TECH"] }, 1)).toBe(false);
    expect(stepIsComplete({ ...mentor, sectors: ["GENERAL"] }, 1)).toBe(true);
    expect(stepIsComplete({ ...mentor, sectors: ["GENERAL", "TECH"] }, 1)).toBe(false);
    expect(stepIsComplete({ ...mentor, sectors: ["DISCOVERING"] }, 1)).toBe(false);
    expect(stepIsComplete({ ...startup, sectors: ["X" as SectorId] }, 1)).toBe(false);
  });
  it("aceita até duas áreas para a startup e até cinco para o mentor", () => {
    expect(stepIsComplete({ ...startup, sectors: ["TECH", "AGRO"] }, 1)).toBe(true);
    expect(stepIsComplete({ ...startup, sectors: ["TECH", "AGRO", "PETS"] }, 1)).toBe(false);
    expect(stepIsComplete({ ...mentor, sectors: ["TECH", "EDUCATION", "HEALTH", "SOCIAL", "LEGAL"] }, 1)).toBe(true);
    expect(stepIsComplete({ ...mentor, sectors: ["TECH", "EDUCATION", "HEALTH", "SOCIAL", "LEGAL", "PETS"] }, 1)).toBe(false);
  });
  it("exige experiência declarada nas especialidades selecionadas do mentor", () => {
    expect(stepIsComplete({ ...mentor, experience: {} }, 2)).toBe(false);
    expect(stepIsComplete({ ...mentor, experience: { VALIDATION: "KNOWLEDGE" } }, 2)).toBe(true);
    expect(stepIsComplete({ ...startup, topics: ["X" as TopicId] }, 2)).toBe(false);
    expect(stepIsComplete({ ...startup, topics: ["VALIDATION", "PRICING", "PITCH"] }, 2)).toBe(false);
  });
  it("aceita até seis especialidades para o mentor", () => {
    const topics: TopicId[] = ["VALIDATION", "CUSTOMERS", "BUSINESS", "PROTOTYPE", "LEGAL", "GRANTS"];
    const experience = Object.fromEntries(topics.map((topic) => [topic, "PRACTICAL"]));
    expect(stepIsComplete({ ...mentor, topics, experience }, 2)).toBe(true);
    expect(stepIsComplete({ ...mentor, topics: [...topics, "PITCH"], experience: { ...experience, PITCH: "PRACTICAL" } }, 2)).toBe(false);
  });
  it("valida público, áreas e vagas de acordo com o papel", () => {
    expect(stepIsComplete(startupDraft, 3)).toBe(true);
    expect(stepIsComplete(startup, 3)).toBe(false);
    expect(stepIsComplete({ ...startupDraft, audiences: ["UNKNOWN"] }, 3)).toBe(true);
    expect(stepIsComplete({ ...startupDraft, audiences: ["UNKNOWN", "B2C"] }, 3)).toBe(false);
    expect(stepIsComplete({ ...startupDraft, audiences: ["B2C", "B2B", "B2G"] }, 3)).toBe(false);
    expect(stepIsComplete({ ...startupDraft, backgrounds: ["STUDENT"] }, 3)).toBe(true);
    expect(stepIsComplete({ ...startupDraft, backgrounds: [] }, 3)).toBe(false);
    expect(stepIsComplete({ ...startupDraft, backgrounds: ["TECH", "LAW", "AGRO"] }, 3)).toBe(true);
    expect(stepIsComplete({ ...startupDraft, backgrounds: ["TECH", "LAW", "AGRO", "OTHER"] }, 3)).toBe(false);
    expect(stepIsComplete({ ...mentorDraft, audiences: ["B2C", "B2B", "B2B2C", "B2G"] }, 3)).toBe(true);
    expect(stepIsComplete({ ...mentorDraft, audiences: ["UNKNOWN"] }, 3)).toBe(false);
    expect(stepIsComplete({ ...mentorDraft, backgrounds: ["TECH", "LAW"] }, 3)).toBe(true);
    expect(stepIsComplete({ ...mentorDraft, backgrounds: ["TECH", "LAW", "AGRO"] }, 3)).toBe(false);
    expect(stepIsComplete({ ...mentorDraft, backgrounds: ["STUDENT"] }, 3)).toBe(false);
    expect(stepIsComplete({ ...mentorDraft, capacity: "" }, 3)).toBe(false);
    expect(stepIsComplete({ ...mentorDraft, audiences: ["X" as AudienceId] }, 3)).toBe(false);
    expect(stepIsComplete({ ...mentorDraft, backgrounds: ["X" as BackgroundId] }, 3)).toBe(false);
  });
  it("aceita cidade opcional para quem pode conversar online", () => {
    expect(stepIsComplete({ ...startup, format: "AMBOS", cityId: "" }, 4)).toBe(true);
    expect(stepIsComplete({ ...startup, format: "PRESENCIAL", cityId: "" }, 4)).toBe(false);
    expect(stepIsComplete({ ...startup, format: "PRESENCIAL", cityId: "PE_RECIFE" }, 4)).toBe(true);
  });
  it("apresenta momento, frequência, público e pares de horários com rótulos compreensíveis", () => {
    expect(momentLabel("PROBLEM")).toBe("Descoberta do problema");
    expect(momentLabel("X" as MomentId)).toBe("X");
    expect(cadenceLabel("BIWEEKLY")).toBe("Quinzenal");
    expect(cadenceLabel("")).toBe("A definir");
    expect(cityLabel("PE_RECIFE")).toBe("Recife");
    expect(slotLabel({ day: "THU", period: "AFTERNOON" })).toBe("Quinta-feira · Tarde");
    expect(audienceLabel("B2B")).toBe("Empresas (B2B)");
    expect(backgroundLabel("LAW")).toBe("Direito");
    expect(capacityLabel("FEW")).toBe("2 a 3 startups");
  });
});
