import { describe, expect, it } from "vitest";
import { ProfileSessionStore } from "./profile-session.store";
import { cityLabel, emptyProfile, profileIsComplete, sectorLabel, stepIsComplete, topicLabel, ProfileDraft } from "./profile.models";
const answers: ProfileDraft = { ...emptyProfile("STARTUP"), projectName: "  Minha ideia  ", sectors: ["TECH"], topics: ["VALIDATION"], format: "ONLINE", moments: ["PROBLEM"], cadence: "FLEXIBLE", experience: { VALIDATION: "PRACTICAL", CUSTOMERS: "PRACTICAL", BUSINESS: "PRACTICAL", PROTOTYPE: "PRACTICAL", PRICING: "PRACTICAL", PITCH: "PRACTICAL" }, availability: [{ day: "MON", period: "EVENING" }] };

describe("Perfil temporário", () => {
  it("salva uma cópia sem informações de credenciais e permite limpar", () => {
    const store = new ProfileSessionStore();
    const original = structuredClone(answers);
    store.save("  Maria Teste  ", original);
    original.topics.push("PRICING");
    expect(store.profile()!.displayName).toBe("Minha ideia");
    expect(store.profile()!.name).toBe("Maria Teste");
    expect(store.profile()!.answers.topics).toEqual(["VALIDATION"]);
    expect(Object.keys(store.profile()!)).toEqual(["questionnaireVersion", "name", "displayName", "answers"]);
    store.clear();
    expect(store.profile()).toBeNull();
    expect(new ProfileSessionStore().profile()).toBeNull();
  });
  it("usa o nome do mentor e uma apresentação alternativa para uma ideia sem nome", () => {
    const store = new ProfileSessionStore();
    store.save("Maria Teste", { ...answers, kind: "MENTOR" });
    expect(store.profile()!.displayName).toBe("Maria Teste");
    store.save("Maria Teste", { ...answers, projectName: "" });
    expect(store.profile()!.displayName).toBe("Ideia de Maria");
  });
  it("exige as etapas usadas pela compatibilidade antes de ativar um perfil", () => {
    const store = new ProfileSessionStore();
    expect(() => store.save("Maria", emptyProfile("STARTUP"))).toThrow("Perfil incompleto");
    expect(profileIsComplete(answers)).toBe(true);
    expect(stepIsComplete(answers, 6)).toBe(false);
    expect(stepIsComplete({ ...answers, format: "PRESENCIAL", cityId: "" }, 4)).toBe(false);
  });
  it("apresenta os códigos e as alternativas do perfil em português", () => {
    expect(sectorLabel("GENERAL")).toBe("Atuação geral");
    expect(sectorLabel("DISCOVERING")).toContain("descoberta");
    expect(sectorLabel("TECH")).toBe("Tecnologia");
    expect(topicLabel("PRICING")).toBe("Preços e custos");
    expect(cityLabel("PE_RECIFE")).toBe("Recife");
    expect(cityLabel("")).toBe("Local a combinar");
  });
});
