import { HttpClient, HttpHeaders, provideHttpClient, withInterceptors } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { firstValueFrom } from "rxjs";
import { afterEach, beforeEach, expect, it } from "vitest";
import { AuthRenewalService } from "./auth-renewal.service";
import { AuthStateStore } from "./auth-state.store";
import { AuthService } from "./auth.service";
import { authInterceptor } from "./auth.interceptor";
import { API_BASE_URL } from "./auth.config";
import { REGISTRATION_MODE } from "./registration.config";

const base = "https://api.example.test";
const account = { id: "ficticio", nome: "Pessoa", email: "jwt@example.test", tipoUsuario: "STARTUP" as const };
let http: HttpTestingController;
let state: AuthStateStore;
let renewal: AuthRenewalService;
let client: HttpClient;

function headers(offset = 900_000) {
  return { "X-Auth-Mode": "JWT", "X-Auth-Expires-At": new Date(Date.now() + offset).toISOString() };
}

beforeEach(() => {
  TestBed.configureTestingModule({ providers: [
    provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting(),
    { provide: REGISTRATION_MODE, useValue: "API" }, { provide: API_BASE_URL, useValue: base },
  ] });
  http = TestBed.inject(HttpTestingController);
  state = TestBed.inject(AuthStateStore);
  renewal = TestBed.inject(AuthRenewalService);
  client = TestBed.inject(HttpClient);
});
afterEach(() => http.verify());

function csrf() {
  http.expectOne(base + "/csrf").flush({ headerName: "X-XSRF-TOKEN", token: "ficticio" });
}

function renewed() {
  const request = http.expectOne(base + "/api/v1/auth/refresh");
  expect(request.request.withCredentials).toBe(true);
  expect(request.request.headers.get("X-XSRF-TOKEN")).toBe("ficticio");
  request.flush(null, { status: 204, statusText: "No Content", headers: headers() });
}

it("renews an expired JWT on initial session lookup, then repeats only the GET", async () => {
  const result = firstValueFrom(TestBed.inject(AuthService).me());
  http.expectOne(base + "/api/v1/auth/me").flush({}, { status: 401, statusText: "Expired", headers: headers(-1) });
  csrf(); renewed();
  http.expectOne(base + "/api/v1/auth/me").flush(account, { headers: headers() });
  expect(await result).toEqual(account);
  expect(state.user()).toEqual(account);
});

it("renews before a write expires and sends that mutation exactly once", async () => {
  state.setUser(account);
  renewal.accept(new HttpHeaders(headers(30_000)));
  const result = firstValueFrom(client.patch("/api/v1/startups/project", { nomeProvisorio: "Projeto" }));
  csrf();
  http.expectNone(base + "/api/v1/startups/project");
  renewed();
  const write = http.expectOne(base + "/api/v1/startups/project");
  expect(write.request.body).toEqual({ nomeProvisorio: "Projeto" });
  write.flush({});
  await result;
  http.expectNone(base + "/api/v1/startups/project");
});

it("shares one renewal across simultaneous writes", async () => {
  state.setUser(account); renewal.accept(new HttpHeaders(headers(-1)));
  const first = firstValueFrom(client.patch("/api/v1/startups/one", {}));
  const second = firstValueFrom(client.patch("/api/v1/startups/two", {}));
  csrf(); renewed();
  http.expectOne(base + "/api/v1/startups/one").flush({});
  http.expectOne(base + "/api/v1/startups/two").flush({});
  await Promise.all([first, second]);
});

it("shares renewal after concurrent failed GETs and retries each read once", async () => {
  state.setUser(account);
  const first = firstValueFrom(client.get("/api/v1/startups/one"));
  const second = firstValueFrom(client.get("/api/v1/startups/two"));
  for (const id of ["one", "two"]) {
    http.expectOne(base + "/api/v1/startups/" + id).flush({}, { status: 401, statusText: "Expired", headers: headers(-1) });
  }
  csrf(); renewed();
  for (const id of ["one", "two"]) http.expectOne(base + "/api/v1/startups/" + id).flush({});
  await Promise.all([first, second]);
});

it("never retries a denied mutation even if the response indicates JWT", async () => {
  state.setUser(account); renewal.accept(new HttpHeaders(headers()));
  const result = firstValueFrom(client.patch("/api/v1/startups/project", {})).catch(error => error);
  csrf();
  http.expectOne(base + "/api/v1/startups/project").flush({}, { status: 401, statusText: "Denied", headers: headers() });
  expect((await result).status).toBe(401);
  expect(state.user()).toBeNull();
  http.expectNone(base + "/api/v1/auth/refresh");
});

it("does not renew SESSION mode, public signup, logout, or an obsolete account revision", async () => {
  state.setUser(account);
  renewal.accept(new HttpHeaders());
  await firstValueFrom(renewal.beforeRequest("/api/v1/startups/project"));
  renewal.accept(new HttpHeaders(headers(-1)));
  for (const path of ["/csrf", "/csrf?x=1", "/api/v1/auth/logout", "/api/v1/auth/me"]) {
    await firstValueFrom(renewal.beforeRequest(path));
  }
  state.setUser(null);
  await firstValueFrom(renewal.beforeRequest("/api/v1/startups/project"));
  expect(renewal.canRecover("POST", new HttpHeaders(headers()))).toBe(false);
  expect(renewal.canRecover("GET", new HttpHeaders())).toBe(false);
});

it.each([401, 403])("does not send a waiting mutation after a confirmed renewal error %s", async status => {
  state.setUser(account); renewal.accept(new HttpHeaders(headers(-1)));
  const result = firstValueFrom(client.patch("/api/v1/startups/project", {})).catch(error => error);
  csrf();
  http.expectOne(base + "/api/v1/auth/refresh").flush({}, { status, statusText: "Denied" });
  expect((await result).status).toBe(status);
  http.expectNone(base + "/api/v1/startups/project");
});

it.each([0, 503, 200])("blocks another renewal after an ambiguous response %s until a session lookup confirms it", async status => {
  state.setUser(account); renewal.accept(new HttpHeaders(headers(-1)));
  const result = firstValueFrom(client.patch("/api/v1/startups/project", {})).catch(error => error);
  csrf();
  const request = http.expectOne(base + "/api/v1/auth/refresh");
  if (status === 0) request.error(new ProgressEvent("error"));
  else request.flush(null, { status, statusText: "Unconfirmed" });
  await result;
  expect(state.user()).toEqual(account);
  expect(renewal.canRecover("GET", new HttpHeaders(headers()))).toBe(false);
  const next = await firstValueFrom(client.patch("/api/v1/startups/project", {})).catch(error => error);
  expect(next).toBeInstanceOf(Error);
  http.expectNone(base + "/api/v1/auth/refresh");
  http.expectNone(base + "/api/v1/startups/project");
  const me = firstValueFrom(TestBed.inject(AuthService).me());
  http.expectOne(base + "/api/v1/auth/me").flush(account, { headers: headers() });
  await me;
  expect(renewal.canRecover("GET", new HttpHeaders(headers()))).toBe(true);
});

it("rejects a renewed cookie response from a previous account before sending a waiting write", async () => {
  state.setUser(account); renewal.accept(new HttpHeaders(headers(-1)));
  const result = firstValueFrom(client.patch("/api/v1/startups/project", {})).catch(error => error);
  csrf();
  state.setUser({ ...account, id: "outra-conta" });
  renewed();
  expect(await result).toBeInstanceOf(Error);
  expect(state.user()?.id).toBe("outra-conta");
  http.expectNone(base + "/api/v1/startups/project");
});

it("rejects a changed account while renewal waits for CSRF", async () => {
  state.setUser(account); renewal.accept(new HttpHeaders(headers(-1)));
  const result = firstValueFrom(renewal.refresh()).catch(error => error);
  state.setUser(null); csrf();
  expect(await result).toBeInstanceOf(Error);
  http.expectNone(base + "/api/v1/auth/refresh");
});

it("does not recover an old GET error after switching accounts", async () => {
  state.setUser(account);
  const result = firstValueFrom(client.get("/api/v1/startups/project")).catch(error => error);
  state.setUser({ ...account, id: "outra" });
  http.expectOne(base + "/api/v1/startups/project").flush({}, { status: 401, statusText: "Expired", headers: headers(-1) });
  expect((await result).status).toBe(401);
  expect(state.user()?.id).toBe("outra");
  http.expectNone(base + "/api/v1/auth/refresh");
});

it("does not overwrite a changed account when a login response arrives late", async () => {
  const result = firstValueFrom(TestBed.inject(AuthService).login(account.email, "ficticia")).catch(error => error);
  csrf(); state.setUser({ ...account, id: "outra" });
  http.expectOne(base + "/api/v1/auth/login").flush(account, { headers: headers() });
  expect(await result).toBeInstanceOf(Error);
  expect(state.user()?.id).toBe("outra");
});
