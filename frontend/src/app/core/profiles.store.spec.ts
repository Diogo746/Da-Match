import { describe, expect, it } from "vitest";
import { CITIES, DAYS, FORMATS, PERIODS, SECTORS, TOPICS, profileIsComplete } from "./profile.models";
import { DEMO_PROFILES } from "./profiles.store";

describe("Catálogo de demonstração", () => {
  it("mantém dez identificadores únicos e os dois públicos do MVP", () => {
    expect(DEMO_PROFILES).toHaveLength(10);
    expect(new Set(DEMO_PROFILES.map((profile) => profile.id)).size).toBe(10);
    expect(DEMO_PROFILES.filter((profile) => profile.kind === "MENTOR")).toHaveLength(6);
    expect(DEMO_PROFILES.filter((profile) => profile.kind === "STARTUP")).toHaveLength(4);
  });

  it.each(DEMO_PROFILES)("$name contém respostas válidas para recomendações", (profile) => {
    const { matching } = profile;
    expect(matching.kind).toBe(profile.kind);
    expect(profileIsComplete(matching)).toBe(true);
    expect(profile.stage).toBe("Ideação");
    expect(profile.initials.length).toBeGreaterThan(0);
    expect(profile.city).not.toBe("Local a combinar");
    expect(profile.sector.length).toBeGreaterThan(0);
    expect(profile.tags.length).toBeGreaterThan(0);
    expect(profile.reasons.length).toBeGreaterThan(0);
    expect(profile.theme.startsWith(profile.kind === "MENTOR" ? "mentor-" : "startup-")).toBe(true);
    expect(["MENTOR", "STARTUP"]).toContain(profile.kind);
    expect(CITIES.map((city) => city.id)).toContain(matching.cityId);
    expect(FORMATS.map((format) => format.id)).toContain(matching.format);
    const sectors = new Set<string>([...SECTORS.map((sector) => sector.id), "GENERAL", "DISCOVERING"]);
    expect(matching.sectors.every((sector) => sectors.has(sector))).toBe(true);
    expect(matching.topics.every((topic) => TOPICS.some((item) => item.id === topic))).toBe(true);
    expect(matching.availability.every((slot) => DAYS.some((item) => item.id === slot.day))).toBe(true);
    expect(matching.availability.every((slot) => PERIODS.some((item) => item.id === slot.period))).toBe(true);
  });
});
