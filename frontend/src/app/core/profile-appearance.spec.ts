import { expect, it } from "vitest";
import { DEMO_PROFILES } from "./profiles.store";
import { profileTone } from "./profile-appearance";
it("mantém as cores por papel e uma variação estável ao reordenar perfis", () => {
  for(const profile of DEMO_PROFILES) {
    const tone=profileTone(profile.kind,profile.id);
    expect(tone).toBe(profile.theme);
    expect(tone).toMatch(profile.kind === "MENTOR" ? /^mentor-/ : /^startup-/);
  }
  for(const kind of ["MENTOR","STARTUP"] as const) {
    const profiles=DEMO_PROFILES.filter((profile)=>profile.kind===kind);
    expect(new Set(profiles.map((profile)=>profile.theme)).size).toBe(2);
    expect(profiles.slice().reverse().map((profile)=>profileTone(profile.kind,profile.id)).reverse()).toEqual(profiles.map((profile)=>profile.theme));
  }
});

it("trata identificadores Unicode completos sem depender de pares substitutos", () => {
  expect(profileTone("MENTOR", "😀")).toBe("mentor-deep");
  expect(profileTone("STARTUP", "😀a")).toBe("startup-soft");
  expect(profileTone("MENTOR", "")).toBe("mentor-deep");
});

