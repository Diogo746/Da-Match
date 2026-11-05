import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { firstValueFrom } from "rxjs";
import { afterEach, beforeEach, expect, it } from "vitest";
import { authInterceptor } from "./auth.interceptor";
import { AuthStateStore } from "./auth-state.store";
import { REGISTRATION_MODE } from "./registration.config";
import { StartupTeamService } from "./startup-team.service";
import { StartupInvitation } from "./startup-team.models";

const invitation: StartupInvitation = { id: "invitation", startupId: "project", nomeStartup: "Projeto", nomeConvidante: "Gestor",
  nomeDestinatario: "Pessoa", papelMembro: "MEMBRO", status: "PENDENTE", criadoEm: "2026-11-05T12:00:00Z", expiraEm: "2026-11-12T12:00:00Z" };
let http: HttpTestingController;
let service: StartupTeamService;
beforeEach(() => {
  TestBed.configureTestingModule({ providers: [provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting(),
    { provide: REGISTRATION_MODE, useValue: "API" }] });
  http = TestBed.inject(HttpTestingController); service = TestBed.inject(StartupTeamService);
});
afterEach(() => http.verify());

it.each([undefined, "project"])("lists private invitations with pagination and no actor: %s", async project => {
  const result = firstValueFrom(service.list(0, project));
  const req = http.expectOne(r => r.url.endsWith(project ? "/project/convites" : "/convites/me"));
  expect(req.request.params.get("pagina")).toBe("0"); expect(req.request.params.get("tamanho")).toBe("20");
  expect(req.request.withCredentials).toBe(true);
  req.flush({ itens: [invitation], pagina: 0, tamanho: 20, totalItens: 1, totalPaginas: 1 });
  expect((await result).itens).toEqual([invitation]);
});

it("creates with only the allowed fields and checks HTTP 201 and the offered role", async () => {
  const result = firstValueFrom(service.create("project", { solicitacaoId: "request", email: " person@example.test ", papelMembro: "MEMBRO", extra: "never" } as never));
  http.expectOne("/csrf").flush({ headerName: "X-XSRF-TOKEN", token: "qa-token" });
  const req = http.expectOne("/api/v1/startups/project/convites");
  expect(req.request.method).toBe("POST"); expect(req.request.withCredentials).toBe(true);
  expect(req.request.headers.get("X-XSRF-TOKEN")).toBe("qa-token");
  expect(req.request.body).toEqual({ solicitacaoId: "request", email: "person@example.test", papelMembro: "MEMBRO" });
  req.flush(invitation, { status: 201, statusText: "Created" }); expect(await result).toEqual(invitation);
});

it.each([200, 201])("rejects an unconfirmed creation receipt %s", async status => {
  const result = firstValueFrom(service.create("project", { solicitacaoId: "request", email: "person@example.test", papelMembro: "MEMBRO" }));
  const rejected = expect(result).rejects.toThrow();
  http.expectOne("/csrf").flush({ headerName: "X-XSRF-TOKEN", token: "qa-token" });
  http.expectOne("/api/v1/startups/project/convites").flush({ ...invitation, papelMembro: "REPRESENTANTE" }, { status, statusText: "OK" });
  await rejected;
});

it("recovers by request ID without putting email or actor in the query", async () => {
  const result = firstValueFrom(service.recover("p/?", "r/?"));
  const req = http.expectOne("/api/v1/startups/p%2F%3F/convites/solicitacoes/r%2F%3F");
  expect(req.request.params.keys()).toEqual([]); req.flush({ ...invitation, startupId: "p/?" });
  expect((await result).startupId).toBe("p/?");
});

it("queries the exact invitation for recovery", async () => {
  const result = firstValueFrom(service.invitation("i/?", "project"));
  http.expectOne("/api/v1/startups/convites/i%2F%3F").flush({ ...invitation, id: "i/?" });
  expect((await result).id).toBe("i/?");
});

it.each(["accept", "refuse", "cancel"] as const)("sends %s with an empty JSON body and CSRF", async action => {
  const result = firstValueFrom(service.act(invitation, action));
  http.expectOne("/csrf").flush({ headerName: "X-XSRF-TOKEN", token: "qa-token" });
  const prefix = action === "cancel" ? "/project" : "";
  const suffix = { accept: "aceite", refuse: "recusa", cancel: "cancelamento" }[action];
  const req = http.expectOne(`/api/v1/startups${prefix}/convites/invitation/${suffix}`);
  expect(req.request.method).toBe("PATCH"); expect(req.request.body).toEqual({});
  expect(req.request.headers.get("X-XSRF-TOKEN")).toBe("qa-token");
  const status = { accept: "ACEITO", refuse: "RECUSADO", cancel: "CANCELADO" }[action];
  req.flush({ ...invitation, status }); expect((await result).status).toBe(status);
});

it.each([{ ...invitation }, { ...invitation, status: "ACEITO", papelMembro: "REPRESENTANTE" }])("rejects incompatible action receipts %#", async value => {
  const result = firstValueFrom(service.act(invitation, "accept")); const rejected = expect(result).rejects.toThrow();
  http.expectOne("/csrf").flush({ headerName: "X-XSRF-TOKEN", token: "qa-token" });
  http.expectOne("/api/v1/startups/convites/invitation/aceite").flush(value); await rejected;
});

it.each([204, 200])("only confirms a removal with HTTP 204: %s", async status => {
  const result = firstValueFrom(service.remove("p/?", "u/?"));
  const outcome = status === 204 ? expect(result).resolves.toBeUndefined() : expect(result).rejects.toThrow();
  http.expectOne("/csrf").flush({ headerName: "X-XSRF-TOKEN", token: "qa-token" });
  const req = http.expectOne("/api/v1/startups/p%2F%3F/membros/u%2F%3F");
  expect(req.request.method).toBe("DELETE"); req.flush(null, { status, statusText: "OK" }); await outcome;
});

it("does not send a waiting write in a different session", async () => {
  const result = firstValueFrom(service.act(invitation, "accept")); const rejected = expect(result).rejects.toThrow();
  TestBed.inject(AuthStateStore).setUser(null);
  http.expectOne("/csrf").flush({ headerName: "X-XSRF-TOKEN", token: "qa-token" });
  await rejected; http.expectNone("/api/v1/startups/convites/invitation/aceite");
});
