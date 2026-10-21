import { HttpClient, provideHttpClient, withInterceptors } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { afterEach, beforeEach, expect, it } from "vitest";
import { firstValueFrom, isObservable } from "rxjs";
import { authInterceptor } from "./auth.interceptor";
import { AuthService } from "./auth.service";
import { AuthStateStore } from "./auth-state.store";
import { API_BASE_URL } from "./auth.config";
import { REGISTRATION_MODE } from "./registration.config";
import { authGuard, demoProfileGuard } from "./auth.guard";
import { CsrfService } from "./csrf.service";

const base = "https://api.example.test";
const account = { id: "ficticio", nome: "Pessoa Teste", email: "test@example.test", tipoUsuario: "MENTOR" as const };
let http: HttpTestingController;
let auth: AuthService;
let state: AuthStateStore;

beforeEach(() => {
  TestBed.configureTestingModule({ providers: [
    provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting(), provideRouter([]),
    { provide: REGISTRATION_MODE, useValue: "API" }, { provide: API_BASE_URL, useValue: base },
  ] });
  http = TestBed.inject(HttpTestingController);
  auth = TestBed.inject(AuthService);
  state = TestBed.inject(AuthStateStore);
});
afterEach(() => http.verify());

function csrf(token = "token-ficticio") {
  const request = http.expectOne(base + "/csrf");
  expect(request.request.withCredentials).toBe(true);
  request.flush({ headerName: "X-XSRF-TOKEN", token });
}

it("logs in with CSRF and credentials, keeps only safe user fields and refreshes CSRF before resolving", async () => {
  const result = firstValueFrom(auth.login(account.email, "senha-ficticia"));
  csrf("before");
  const request = http.expectOne(base + "/api/v1/auth/login");
  expect(request.request.withCredentials).toBe(true);
  expect(request.request.headers.get("X-XSRF-TOKEN")).toBe("before");
  request.flush({ ...account, senha: "secret", sessionId: "secret" });
  csrf("after");
  expect(await result).toEqual(account);
  expect(state.user()).toEqual(account);
  expect(JSON.stringify(state.user())).not.toContain("secret");
});

it("logout requires CSRF and renews it after clearing the current user", async () => {
  state.setUser(account);
  const result = firstValueFrom(auth.logout());
  csrf("before");
  const logout = http.expectOne(base + "/api/v1/auth/logout");
  expect(logout.request.headers.get("X-XSRF-TOKEN")).toBe("before");
  logout.flush(null, { status: 204, statusText: "No Content" });
  expect(state.user()).toBeNull();
  csrf("after");
  await result;
});

it.each([401, 403])("handles %s without replaying a write or persisting credentials", async (status) => {
  state.setUser(account);
  const result = firstValueFrom(TestBed.inject(HttpClient).patch("/api/v1/mentores/ficticio", {})).catch(error => error);
  csrf();
  http.expectOne(base + "/api/v1/mentores/ficticio").flush({}, { status, statusText: "Denied" });
  expect((await result).status).toBe(status);
  expect(state.notice()).not.toBe("");
  expect(state.user()).toEqual(status === 401 ? null : account);
  http.expectNone(base + "/api/v1/mentores/ficticio");
  const next = firstValueFrom(TestBed.inject(CsrfService).getToken());
  csrf("renewed");
  expect(await next).toBe("renewed");
});

it("never sends API credentials or CSRF to unrelated absolute URLs", async () => {
  const result = firstValueFrom(TestBed.inject(HttpClient).post("https://other.example.test/upload", {}));
  const request = http.expectOne("https://other.example.test/upload");
  expect(request.request.withCredentials).toBe(false);
  expect(request.request.headers.has("X-XSRF-TOKEN")).toBe(false);
  request.flush({});
  await result;
});

it("reuses an explicitly supplied CSRF header from registration", async () => {
  const result = firstValueFrom(TestBed.inject(HttpClient).post("/api/v1/mentores", {},
    { headers: { "X-XSRF-TOKEN": "explicit" } }));
  const request = http.expectOne(base + "/api/v1/mentores");
  expect(request.request.headers.get("X-XSRF-TOKEN")).toBe("explicit");
  request.flush({});
  await result;
});

it("shares simultaneous CSRF requests and rejects invalid responses", async () => {
  const csrfService = TestBed.inject(CsrfService);
  const first = firstValueFrom(csrfService.getToken()).catch(error => error);
  const second = firstValueFrom(csrfService.getToken()).catch(error => error);
  http.expectOne(base + "/csrf").flush({ headerName: "wrong", token: "wrong" });
  expect(await first).toBeInstanceOf(Error);
  expect(await second).toBeInstanceOf(Error);
  const retry = firstValueFrom(csrfService.getToken());
  csrf();
  expect(await retry).toBe("token-ficticio");
  expect(await firstValueFrom(csrfService.getToken())).toBe("token-ficticio");
});

it("checks the server session in the route guard", async () => {
  const guard = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
  if (!isObservable(guard)) throw new Error("Expected an observable guard");
  const result = firstValueFrom(guard);
  http.expectOne(base + "/api/v1/auth/me").flush(account);
  expect(await result).toBe(true);
  expect(state.user()).toEqual(account);
  const redirect = TestBed.runInInjectionContext(() => demoProfileGuard({} as never, {} as never));
  expect(TestBed.inject(Router).serializeUrl(redirect as never)).toBe("/conta");
});

it.each([401, 500])("redirects a failed session check (%s) to login", async (status) => {
  const guard = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
  if (!isObservable(guard)) throw new Error("Expected an observable guard");
  const result = firstValueFrom(guard);
  http.expectOne(base + "/api/v1/auth/me").flush({}, { status, statusText: "Error" });
  expect(TestBed.inject(Router).serializeUrl(await result as never)).toBe(status === 401 ? "/entrar" : "/entrar?unavailable=1");
});

it("rejects malformed user responses", async () => {
  const result = firstValueFrom(auth.me()).catch(error => error);
  http.expectOne(base + "/api/v1/auth/me").flush({ id: "incomplete" });
  expect(await result).toBeInstanceOf(Error);
  expect(state.user()).toBeNull();
});

it("keeps demo mode separate from real authentication and network interception", async () => {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [
    provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting(), provideRouter([]),
    { provide: REGISTRATION_MODE, useValue: "DEMO" },
  ] });
  http = TestBed.inject(HttpTestingController);
  await expect(firstValueFrom(TestBed.inject(AuthService).login("test@example.test", "ficticia"))).rejects.toThrow("demonstração");
  const guard = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
  expect(TestBed.inject(Router).serializeUrl(guard as never)).toBe("/");
  expect(TestBed.runInInjectionContext(() => demoProfileGuard({} as never, {} as never))).toBe(true);
  const result = firstValueFrom(TestBed.inject(HttpClient).get("/api/v1/auth/me"));
  const request = http.expectOne("/api/v1/auth/me");
  expect(request.request.withCredentials).toBe(false);
  request.flush({});
  await result;
});
