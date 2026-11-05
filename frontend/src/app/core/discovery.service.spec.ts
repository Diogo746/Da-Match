import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { firstValueFrom } from "rxjs";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { authInterceptor } from "./auth.interceptor";
import { REGISTRATION_MODE } from "./registration.config";
import { API_BASE_URL } from "./auth.config";
import { EMPTY_DISCOVERY_QUERY } from "./discovery.models";
import { ProfileKind } from "./profile.models";
import { DiscoveryService } from "./discovery.service";

let http: HttpTestingController;
let service: DiscoveryService;
const profile = { id: "10000000-0000-4000-8000-000000000001", tipo: "MENTOR", nome: "Mentora Fictícia",
  apresentacao: "Biografia", setores: ["TECH"], topicos: ["VALIDATION"], formato: "ONLINE", cidadeId: "" };
beforeEach(() => {
  TestBed.configureTestingModule({ providers: [provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting(),
    { provide: REGISTRATION_MODE, useValue: "API" }, { provide: API_BASE_URL, useValue: "https://api.example.test" }] });
  http = TestBed.inject(HttpTestingController); service = TestBed.inject(DiscoveryService);
});
afterEach(() => { http.verify(); vi.useRealTimers(); });
it.each(["MENTOR", "STARTUP"] as const)("uses the real %s route with literal filters, credentials and no CSRF read or write", async kind => {
  const query = { ...EMPTY_DISCOVERY_QUERY, busca: "Árvore %_'", pagina: 2, tamanho: 5 };
  const response = firstValueFrom(service.list(kind, query));
  const request = http.expectOne(req => req.url.endsWith(kind === "MENTOR" ? "/descoberta/mentores" : "/descoberta/startups"));
  expect(request.request.method).toBe("GET"); expect(request.request.withCredentials).toBe(true);
  expect(request.request.params.get("busca")).toBe(query.busca); expect(request.request.params.get("pagina")).toBe("2");
  expect(request.request.params.has("setor")).toBe(false); expect(request.request.headers.has("X-XSRF-TOKEN")).toBe(false);
  request.flush({ itens: [], pagina: 2, tamanho: 5, totalItens: 0, totalPaginas: 0 });
  expect((await response).itens).toEqual([]); http.expectNone("https://api.example.test/csrf");
});
it("revalidates a detail instead of reusing a card or querying management routes", async () => {
  const result = firstValueFrom(service.detail("MENTOR", profile.id));
  http.expectOne("https://api.example.test/api/v1/descoberta/mentores/" + profile.id).flush(profile);
  expect(await result).toEqual(profile);
  const wrong = firstValueFrom(service.detail("MENTOR", profile.id)).catch(error => error);
  http.expectOne("https://api.example.test/api/v1/descoberta/mentores/" + profile.id).flush({ ...profile, email: "private" });
  expect(await wrong).toBeInstanceOf(Error);
});
it("rejects invalid ids/types before HTTP and never substitutes a failed request with demo data", async () => {
  expect(await firstValueFrom(service.detail("MENTOR", "../account")).catch(error => error)).toBeInstanceOf(Error);
  expect(await firstValueFrom(service.list("ADMIN" as ProfileKind, EMPTY_DISCOVERY_QUERY)).catch(error => error)).toBeInstanceOf(Error);
  const result = firstValueFrom(service.list("MENTOR", EMPTY_DISCOVERY_QUERY)).catch(error => error);
  http.expectOne(req => req.url.endsWith("/descoberta/mentores")).flush({}, { status: 503, statusText: "Unavailable" });
  expect((await result).status).toBe(503);
});
it("times out without replaying a request", async () => {
  vi.useFakeTimers();
  const result = firstValueFrom(service.detail("MENTOR", profile.id)).catch(error => error);
  const request = http.expectOne(req => req.url.includes("/descoberta/mentores/"));
  await vi.advanceTimersByTimeAsync(15001);
  expect(request.cancelled).toBe(true); expect((await result).name).toBe("TimeoutError");
});
it("does not contact the API in DEMO", async () => {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), { provide: REGISTRATION_MODE, useValue: "DEMO" }] });
  http = TestBed.inject(HttpTestingController);
  expect(await firstValueFrom(TestBed.inject(DiscoveryService).list("MENTOR", EMPTY_DISCOVERY_QUERY)).catch(error => error)).toBeInstanceOf(Error);
});
