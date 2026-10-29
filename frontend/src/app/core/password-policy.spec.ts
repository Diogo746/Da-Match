import { expect, it } from "vitest";
import { passwordFitsBcrypt } from "./password-policy";
import { normalizeRegistration } from "./registration.gateway";

it.each(["a", "é", "😀"])("validates the UTF-8 byte boundary for %s without changing the password", symbol => {
  const repetitions = 72 / new TextEncoder().encode(symbol).length;
  const boundary = symbol.repeat(repetitions);
  const oversized = boundary + symbol;
  expect(passwordFitsBcrypt(boundary)).toBe(true);
  expect(passwordFitsBcrypt(oversized)).toBe(false);
  for (const kind of ["STARTUP", "MENTOR"] as const) {
    const input = { nome: "Pessoa Fictícia", email: "person@example.test", senha: boundary,
      mentor: { biografia: "Biografia fictícia" } };
    expect(normalizeRegistration(kind, input).senha).toBe(boundary);
    expect(() => normalizeRegistration(kind, { ...input, senha: oversized })).toThrow("INVALID_INPUT");
  }
});
