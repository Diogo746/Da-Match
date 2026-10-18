import { describe, expect, it } from "vitest";
import { MatchProfile, MomentId, SectorId, TopicId, cadenceLabel, cityLabel, emptyProfile, momentLabel, profileIsComplete, slotLabel, stepIsComplete } from "./profile.models";

const startup: MatchProfile = { ...emptyProfile("STARTUP"), moments: ["PROBLEM"], sectors: ["TECH"], topics: ["VALIDATION"], format: "ONLINE", cadence: "FLEXIBLE", availability: [{ day: "MON", period: "EVENING" }] };
const mentor: MatchProfile = { ...startup, kind: "MENTOR", experience: { VALIDATION: "PRACTICAL" } };
describe("Respostas válidas do questionário v2", () => {
  it("exige as cinco etapas e reconhece os dois públicos", () => {
    expect(profileIsComplete(startup)).toBe(true);
    expect(profileIsComplete(mentor)).toBe(true);
    expect(profileIsComplete(emptyProfile("STARTUP"))).toBe(false);
    expect(stepIsComplete(startup, 5)).toBe(false);
  });
  it("mantém um momento por startup e permite vários ao mentor", () => {
    expect(stepIsComplete({ ...startup, moments: ["PROBLEM", "SOLUTION"] }, 0)).toBe(false);
    expect(stepIsComplete({ ...mentor, moments: ["PROBLEM", "SOLUTION"] }, 0)).toBe(true);
    expect(stepIsComplete({ ...startup, moments: ["DESCONHECIDO" as MomentId] }, 0)).toBe(false);
  });
  it("trata setor em descoberta e atuação geral como respostas específicas de cada papel", () => {
    expect(stepIsComplete({ ...startup, sectors: ["DISCOVERING"] }, 1)).toBe(true);
    expect(stepIsComplete({ ...startup, sectors: ["GENERAL"] }, 1)).toBe(false);
    expect(stepIsComplete({ ...mentor, sectors: ["GENERAL"] }, 1)).toBe(true);
    expect(stepIsComplete({ ...mentor, sectors: ["GENERAL", "TECH"] }, 1)).toBe(false);
    expect(stepIsComplete({ ...mentor, sectors: ["DISCOVERING"] }, 1)).toBe(false);
    expect(stepIsComplete({ ...startup, sectors: ["X" as SectorId] }, 1)).toBe(false);
    expect(stepIsComplete({ ...mentor, sectors: ["TECH","EDUCATION","HEALTH","SOCIAL"] }, 1)).toBe(false);
  });
  it("exige experiência declarada nas especialidades selecionadas do mentor", () => {
    expect(stepIsComplete({ ...mentor, experience: {} }, 2)).toBe(false);
    expect(stepIsComplete({ ...mentor, experience: { VALIDATION: "KNOWLEDGE" } }, 2)).toBe(true);
    expect(stepIsComplete({ ...startup, topics: ["X" as TopicId] }, 2)).toBe(false);
    expect(stepIsComplete({ ...startup, topics: ["VALIDATION", "PRICING", "PITCH"] }, 2)).toBe(false);
  });
  it("aceita cidade opcional para quem pode conversar online", () => {
    expect(stepIsComplete({ ...startup, format: "AMBOS", cityId: "" }, 3)).toBe(true);
    expect(stepIsComplete({ ...startup, format: "PRESENCIAL", cityId: "" }, 3)).toBe(false);
    expect(stepIsComplete({ ...startup, format: "PRESENCIAL", cityId: "PE_RECIFE" }, 3)).toBe(true);
  });
  it("apresenta momento, frequência e pares de horários com rótulos compreensíveis", () => {
    expect(momentLabel("PROBLEM")).toBe("Descoberta do problema");
    expect(momentLabel("X" as MomentId)).toBe("X");
    expect(cadenceLabel("BIWEEKLY")).toBe("Quinzenal");
    expect(cadenceLabel("")).toBe("A definir");
    expect(cityLabel("PE_RECIFE")).toBe("Recife");
    expect(slotLabel({ day: "THU", period: "AFTERNOON" })).toBe("Quinta-feira · Tarde");
  });
});

