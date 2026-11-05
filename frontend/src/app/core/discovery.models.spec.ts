import { convertToParamMap } from "@angular/router";
import { expect, it } from "vitest";
import { EMPTY_DISCOVERY_QUERY, discoveryParams, isDiscoveryId, readDiscoveryPage,
  readDiscoveryProfile, readDiscoveryQuery } from "./discovery.models";

const mentor = { id: "10000000-0000-4000-8000-000000000001", tipo: "MENTOR", nome: "Mentora Fictícia",
  apresentacao: "Experiência em validação.", setores: ["TECH"], topicos: ["VALIDATION"], formato: "ONLINE", cidadeId: "" };
const query = { ...EMPTY_DISCOVERY_QUERY };

it("reads the minimal projection and preserves ordered needs without account or quiz data", () => {
  expect(readDiscoveryProfile(mentor, "MENTOR", mentor.id)).toEqual(mentor);
  const startup = { ...mentor, tipo: "STARTUP", nome: "A", setores: ["DISCOVERING"], topicos: ["PRICING", "BUSINESS"],
    formato: "AMBOS", cidadeId: "PE_RECIFE" };
  expect(readDiscoveryProfile(startup, "STARTUP").topicos).toEqual(["PRICING", "BUSINESS"]);
  expect(readDiscoveryProfile({ ...mentor, setores: ["GENERAL"], apresentacao: "a".repeat(1000) }, "MENTOR").apresentacao).toHaveLength(1000);
  expect(isDiscoveryId(mentor.id)).toBe(true); expect(isDiscoveryId("not-a-profile")).toBe(false);
});
it.each([
  null, [], {}, { ...mentor, email: "private@example.test" }, { ...mentor, nome: " " }, { ...mentor, nome: "abc" },
  { ...mentor, nome: "a".repeat(256) }, { ...mentor, apresentacao: null }, { ...mentor, apresentacao: "a".repeat(1001) },
  { ...mentor, id: "account-id" }, { ...mentor, tipo: "STARTUP" }, { ...mentor, setores: [] },
  { ...mentor, setores: ["DISCOVERING"] }, { ...mentor, setores: ["GENERAL", "TECH"] },
  { ...mentor, setores: ["TECH", "TECH"] }, { ...mentor, topicos: ["UNKNOWN"] }, { ...mentor, topicos: [] },
  { ...mentor, topicos: null }, { ...mentor, formato: "REMOTO" }, { ...mentor, cidadeId: "OUTRA" },
  { ...mentor, cidadeId: "PE_RECIFE" }, { ...mentor, formato: "PRESENCIAL" },
])("rejects malformed, private or incompatible profile payload %#", value => {
  expect(() => readDiscoveryProfile(value, "MENTOR")).toThrow();
});
it("checks the requested detail id and startup-specific lengths and limits", () => {
  expect(() => readDiscoveryProfile(mentor, "MENTOR", "20000000-0000-4000-8000-000000000001")).toThrow();
  const startup = { ...mentor, tipo: "STARTUP" };
  expect(() => readDiscoveryProfile({ ...startup, setores: ["GENERAL"] }, "STARTUP")).toThrow();
  expect(() => readDiscoveryProfile({ ...startup, topicos: ["BUSINESS", "PRICING", "PITCH"] }, "STARTUP")).toThrow();
  expect(() => readDiscoveryProfile({ ...startup, apresentacao: "a".repeat(256) }, "STARTUP")).toThrow();
});
it("validates page context, counts, unique ids and out-of-range empty pages", () => {
  const page = { itens: [mentor], pagina: 0, tamanho: 20, totalItens: 1, totalPaginas: 1 };
  expect(readDiscoveryPage(page, "MENTOR", query).itens).toHaveLength(1);
  expect(readDiscoveryPage({ ...page, itens: [], pagina: 5 }, "MENTOR", { ...query, pagina: 5 }).totalItens).toBe(1);
  for (const value of [{ ...page, pagina: 1 }, { ...page, tamanho: 10 }, { ...page, totalItens: -1 },
    { ...page, totalItens: 1.5 }, { ...page, totalPaginas: 0 }, { ...page, itens: [] },
    { ...page, totalItens: 2, itens: [mentor, mentor] }, { ...page, itens: null }, { ...page, unknown: true }]) {
    expect(() => readDiscoveryPage(value, "MENTOR", query)).toThrow();
  }
});
it("round-trips filters and page with encoded codes, trimming literal search only", () => {
  expect(readDiscoveryQuery(convertToParamMap({}), "MENTOR")).toEqual(query);
  const result = readDiscoveryQuery(convertToParamMap({ busca: "  Árvore%_'  ", setor: "GENERAL", topico: "BUSINESS",
    formato: "AMBOS", cidade: "PE_RECIFE", pagina: "3", tamanho: "10" }), "MENTOR");
  expect(result).toEqual({ busca: "Árvore%_'", setor: "GENERAL", topico: "BUSINESS", formato: "AMBOS", cidade: "PE_RECIFE", pagina: 3, tamanho: 10 });
  expect(discoveryParams(result)["pagina"]).toBe("3"); expect(discoveryParams(query)).toEqual({ pagina: "0", tamanho: "20" });
  expect(readDiscoveryQuery(convertToParamMap({ setor: "DISCOVERING" }), "STARTUP").setor).toBe("DISCOVERING");
});
it.each([{ actor: "other" }, { busca: ["a", "b"] }, { busca: "a".repeat(101) }, { setor: "DISCOVERING" },
  { topico: "UNKNOWN" }, { formato: "remote" }, { cidade: "UNKNOWN" }, { pagina: "-1" }, { pagina: "1.2" },
  { pagina: "2147483648" }, { pagina: "" }, { tamanho: "0" }, { tamanho: "21" }, { tamanho: "abc" }])(
  "rejects invalid or repeated URL input %#", params => expect(() => readDiscoveryQuery(convertToParamMap(params), "MENTOR")).toThrow());
