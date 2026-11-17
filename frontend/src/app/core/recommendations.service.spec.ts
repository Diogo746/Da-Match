import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, expect, it } from "vitest";
import { ProfileKind } from "./profile.models";
import { Recommendations, RecommendationsService, readRecommendations } from "./recommendations.service";
import { REGISTRATION_MODE } from "./registration.config";

const origin = "10000000-0000-4000-8000-000000000001";
const candidate = "20000000-0000-4000-8000-000000000002";
function response(kind: ProfileKind = "STARTUP"): Recommendations {
  return { perfilOrigemId: origin, tipoOrigem: kind, versaoRegra: "damatch-mentoria-v1",
    calculadoEm: "2026-11-17T12:00:00Z", perfilElegivel: true, pendencias: [], itens: [{
      perfil: { id: candidate, tipo: kind === "STARTUP" ? "MENTOR" : "STARTUP", nome: "Perfil Fictício",
        apresentacao: "Apresentação fictícia", setores: ["TECH"], topicos: ["VALIDATION"], formato: "ONLINE", cidadeId: "" },
      superDamatch: true, agendaEmComum: true }] };
}
let service: RecommendationsService;
let http: HttpTestingController;
beforeEach(() => {
  TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(),
    { provide: REGISTRATION_MODE, useValue: "API" }] });
  service = TestBed.inject(RecommendationsService); http = TestBed.inject(HttpTestingController);
});
afterEach(() => http.verify());

it("reads only server-calculated public results for the exact origin and opposite kind", () => {
  expect(readRecommendations(response(), "STARTUP", origin)).toEqual(response());
  expect(readRecommendations(response("MENTOR"), "MENTOR", origin).itens[0].perfil.tipo).toBe("STARTUP");
  const empty = { ...response(), itens: [] };
  expect(readRecommendations(empty, "STARTUP", origin).itens).toEqual([]);
  const pending = { ...empty, perfilElegivel: false, pendencias: [{ campo: "status", mensagem: "Publique seu perfil." }] };
  expect(readRecommendations(pending, "STARTUP", origin).perfilElegivel).toBe(false);
});

it("rejects mixed identities, numeric contributions, private fields, unknown versions and malformed states", () => {
  const base = response();
  const invalid: unknown[] = [null, [], "bad", { ...base, score: 100 }, { ...base, perfilOrigemId: candidate },
    { ...base, tipoOrigem: "MENTOR" }, { ...base, versaoRegra: "damatch-rules-v2" },
    { ...base, calculadoEm: "invalid" }, { ...base, calculadoEm: 123 }, { ...base, perfilElegivel: null },
    { ...base, itens: "bad" }, { ...base, itens: Array(21).fill(base.itens[0]) },
    { ...base, itens: [base.itens[0], base.itens[0]] },
    { ...base, itens: [{ ...base.itens[0], nota: 100 }] },
    { ...base, itens: [{ ...base.itens[0], superDamatch: "true" }] },
    { ...base, itens: [{ ...base.itens[0], agendaEmComum: false }] },
    { ...base, itens: [{ ...base.itens[0], perfil: { ...base.itens[0].perfil, email: "private@example.test" } }] },
    { ...base, itens: [{ ...base.itens[0], perfil: { ...base.itens[0].perfil, tipo: "STARTUP" } }] },
    { ...base, perfilElegivel: false }, { ...base, perfilElegivel: false, itens: [] },
    { ...base, pendencias: [{ campo: "status", mensagem: "Pendente" }] },
    { ...base, perfilElegivel: false, itens: [], pendencias: [{ campo: "", mensagem: "Pendente" }] },
    { ...base, perfilElegivel: false, itens: [], pendencias: [{ campo: "status", mensagem: "" }] },
    { ...base, pendencias: null }];
  for (const value of invalid) expect(() => readRecommendations(value, "STARTUP", origin)).toThrow();
  expect(() => readRecommendations(base, "STARTUP", "bad")).toThrow();
});

it("calls the startup's authorized project route and the mentor's context-only route", () => {
  service.list("STARTUP", origin).subscribe(value => expect(value.itens).toHaveLength(1));
  const startup = http.expectOne(`/api/v1/startups/${origin}/recomendacoes`);
  expect(startup.request.method).toBe("GET"); expect(startup.request.params.keys()).toEqual([]); startup.flush(response());
  service.list("MENTOR", origin).subscribe(value => expect(value.tipoOrigem).toBe("MENTOR"));
  http.expectOne("/api/v1/mentores/me/recomendacoes").flush(response("MENTOR"));
});

it("does not invoke real APIs in DEMO or for an invalid actor context", () => {
  for (const [kind, id] of [["STARTUP", "bad"], ["ADMIN", origin]]) {
    service.list(kind as ProfileKind, id).subscribe({ error: error => expect(error).toBeInstanceOf(Error) });
  }
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), { provide: REGISTRATION_MODE, useValue: "DEMO" }] });
  http = TestBed.inject(HttpTestingController);
  TestBed.inject(RecommendationsService).list("STARTUP", origin).subscribe({ error: error => expect(error).toBeInstanceOf(Error) });
  http.expectNone(() => true);
});

it("preserves backend failures without falling back to dummy recommendations", () => {
  service.list("STARTUP", origin).subscribe({ error: error => expect(error.status).toBe(403) });
  http.expectOne(`/api/v1/startups/${origin}/recomendacoes`).flush({}, { status: 403, statusText: "Forbidden" });
});
