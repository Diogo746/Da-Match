import { expect, it } from "vitest";
import { STARTUP_FIELDS, StartupRegistrationDetails, normalizeStartupDetails, readStartupProfile, validStartupDetails } from "./startup.models";

const details: StartupRegistrationDetails = {
  nomeProvisorio: "Ideia Fictícia", pitchCurto: "Conectar ideias e experiência.",
  problemaCentral: "Poucas conexões.", solucaoProposta: "Uma rede de apoio.",
  publicoAlvo: "Projetos iniciantes", modeloDeNegocio: "Hipótese de assinatura", statusValidacao: "APENAS_IDEIA",
};
const member = { id: "member-test", usuarioId: "user-test", nomeUsuario: "Pessoa Fictícia", papelMembro: "FUNDADOR", dataEntrada: "2026-10-22" };
const profile = { ...details, id: "startup-test", dataCriacao: "2026-10-22T12:00:00Z", membros: [member] };

it("validates each text boundary and normalizes only declared startup fields", () => {
  expect(validStartupDetails(details)).toBe(true);
  expect(normalizeStartupDetails({ ...details, nomeProvisorio: " Ideia Fictícia " })).toEqual(details);
  for (const { key, maxLength } of STARTUP_FIELDS) {
    expect(validStartupDetails({ ...details, [key]: "x".repeat(maxLength) })).toBe(true);
    for (const value of ["", "   ", null, 42, "x".repeat(maxLength + 1)]) {
      expect(validStartupDetails({ ...details, [key]: value })).toBe(false);
    }
  }
});

it.each([null, undefined, "startup", {}, { ...details, statusValidacao: "PUBLICADO" }])("rejects malformed details: %#", value => {
  expect(validStartupDetails(value)).toBe(false);
});

it("reads confirmed startups without propagating credentials or unexpected properties", () => {
  const result = readStartupProfile({ ...profile, senha: "never-copy", token: "never-copy",
    membros: [{ ...member, senha: "never-copy", email: "never-copy" }] });
  expect(result).toEqual(profile);
  expect(JSON.stringify(result)).not.toContain("never-copy");
  expect(readStartupProfile({ ...profile, statusValidacao: "PESQUISA_MERCADO" }).statusValidacao).toBe("PESQUISA_MERCADO");
});

it.each([null, {}, { ...profile, id: "" }, { ...profile, dataCriacao: "invalid" },
  { ...profile, membros: [] }, { ...profile, membros: null }, { ...profile, membros: [null] },
  { ...profile, membros: [{ ...member, usuarioId: "" }] }, { ...profile, membros: [{ ...member, papelMembro: "ADMIN" }] },
])("rejects incomplete confirmation data: %#", value => {
  expect(() => readStartupProfile(value)).toThrow();
});
