import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { firstValueFrom } from "rxjs";
import { afterEach, beforeEach, expect, it } from "vitest";
import { authInterceptor } from "./auth.interceptor";
import { REGISTRATION_MODE } from "./registration.config";
import { StartupService } from "./startup.service";

const profile = {
  id: "startup-test", nomeProvisorio: "Ideia", pitchCurto: "Resumo", problemaCentral: "Problema",
  solucaoProposta: "Solução", publicoAlvo: "Público", modeloDeNegocio: "Modelo", statusValidacao: "APENAS_IDEIA" as const,
  status: "RASCUNHO" as const, dataCriacao: "2026-10-22T12:00:00Z", membros: [{ id: "member-test", usuarioId: "user-test",
    nomeUsuario: "Pessoa Fictícia", papelMembro: "FUNDADOR", dataEntrada: "2026-10-22" }],
};
let http: HttpTestingController;
let service: StartupService;
beforeEach(() => {
  TestBed.configureTestingModule({ providers: [provideHttpClient(withInterceptors([authInterceptor])),
    provideHttpClientTesting(), { provide: REGISTRATION_MODE, useValue: "API" }] });
  http = TestBed.inject(HttpTestingController);
  service = TestBed.inject(StartupService);
});
afterEach(() => http.verify());

it("queries session startups without an actor ID and strips unexpected response fields", async () => {
  const result = firstValueFrom(service.mine());
  const request = http.expectOne("/api/v1/startups/me");
  expect(request.request.withCredentials).toBe(true);
  expect(request.request.params.keys()).toEqual([]);
  request.flush([{ ...profile, senha: "unexpected", membros: [{ ...profile.membros[0], usuario: { senha: "unexpected" } }] }]);
  expect(await result).toEqual([profile]);
});

it("sends only editable fields through PATCH with session and CSRF", async () => {
  const result = firstValueFrom(service.update(profile.id, { ...profile, nomeProvisorio: " Atualizada " }));
  http.expectOne("/csrf").flush({ headerName: "X-XSRF-TOKEN", token: "test-token" });
  const request = http.expectOne("/api/v1/startups/startup-test");
  expect(request.request.method).toBe("PATCH");
  expect(request.request.withCredentials).toBe(true);
  expect(request.request.headers.get("X-XSRF-TOKEN")).toBe("test-token");
  expect(request.request.body).toEqual({ nomeProvisorio: "Atualizada", pitchCurto: "Resumo", problemaCentral: "Problema",
    solucaoProposta: "Solução", publicoAlvo: "Público", modeloDeNegocio: "Modelo", statusValidacao: "APENAS_IDEIA" });
  request.flush({ ...profile, nomeProvisorio: "Atualizada" });
  expect((await result).nomeProvisorio).toBe("Atualizada");
});

it.each([{}, [null], [{ ...profile, membros: [] }]])("rejects malformed list responses: case %#", async value => {
  const result = firstValueFrom(service.mine());
  const rejected = expect(result).rejects.toThrow();
  http.expectOne("/api/v1/startups/me").flush(value);
  await rejected;
});

const publication = { startupId: profile.id, status: "RASCUNHO", aptoParaPublicacao: true, podeGerenciar: true, pendencias: [] };

it("loads private publication with a session and no actor identifier", async () => {
  const result = firstValueFrom(service.publication(profile.id));
  const request = http.expectOne("/api/v1/startups/startup-test/status");
  expect(request.request.method).toBe("GET");
  expect(request.request.withCredentials).toBe(true);
  expect(request.request.params.keys()).toEqual([]);
  request.flush({ ...publication, score: 99, respostas: "never-copy" });
  expect(await result).toEqual(publication);
});

it("encodes the project identifier and sends only target status, with CSRF", async () => {
  const result = firstValueFrom(service.setStatus("a/b?", "PAUSADO"));
  http.expectOne("/csrf").flush({ headerName: "X-XSRF-TOKEN", token: "status-token" });
  const request = http.expectOne("/api/v1/startups/a%2Fb%3F/status");
  expect(request.request.body).toEqual({ status: "PAUSADO" });
  expect(request.request.method).toBe("PATCH");
  expect(request.request.withCredentials).toBe(true);
  expect(request.request.headers.get("X-XSRF-TOKEN")).toBe("status-token");
  request.flush({ ...publication, startupId: "a/b?", status: "PAUSADO" });
  expect((await result).status).toBe("PAUSADO");
});

it.each([{ ...publication, startupId: "another", status: "PUBLICADO" }, publication,
  { ...publication, status: "PUBLICADO", podeGerenciar: false },
  { ...publication, status: "PUBLICADO", aptoParaPublicacao: false,
    pendencias: [{ codigo: "QUESTIONARIO_AUSENTE", campo: "perfilMatch", mensagem: "Preencha." }] },
])("does not confirm a mismatched or invalid publication response: %#", async body => {
  const result = firstValueFrom(service.setStatus(profile.id, "PUBLICADO"));
  const rejected = expect(result).rejects.toThrow();
  http.expectOne("/csrf").flush({ headerName: "X-XSRF-TOKEN", token: "status-token" });
  http.expectOne("/api/v1/startups/startup-test/status").flush(body);
  await rejected;
});
