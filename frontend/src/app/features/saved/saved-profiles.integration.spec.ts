import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { AppComponent } from "../../app.component";
import { routes } from "../../app.routes";
import { AuthStateStore, CurrentUser } from "../../core/auth-state.store";
import { authInterceptor } from "../../core/auth.interceptor";
import { ProfilesStore } from "../../core/profiles.store";
import { REGISTRATION_MODE } from "../../core/registration.config";
import { expect, it, vi } from "vitest";

const account: CurrentUser = { id: "saved-reader", nome: "Pessoa Fictícia", email: "reader@example.test", tipoUsuario: "STARTUP" };
const profile = { id: "10000000-0000-4000-8000-000000000001", tipo: "MENTOR", nome: "Ágata do Banco",
  apresentacao: "Biografia pública", setores: ["TECH"], topicos: ["VALIDATION"], formato: "ONLINE", cidadeId: "" };
const saved = { perfilId: profile.id, salvoEm: "2026-11-22T12:00:00Z", perfil: profile };
const rootUrl = "/api/v1/salvos";
const itemUrl = `${rootUrl}/${profile.id}`;
const csrf = { token: "token-fixture", headerName: "X-XSRF-TOKEN" };

function page(items: unknown[], pagina = 0, total = items.length) {
  return { itens: items, pagina, tamanho: 20, totalItens: total, totalPaginas: Math.ceil(total / 20) };
}

function setup() {
  TestBed.configureTestingModule({ imports: [AppComponent], providers: [provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting(),
    { provide: REGISTRATION_MODE, useValue: "API" },
    { provide: ProfilesStore, useFactory: () => { throw new Error("DEMO store must not be used"); } }] });
  const fixture = TestBed.createComponent(AppComponent);
  const http = TestBed.inject(HttpTestingController);
  const router = TestBed.inject(Router);
  const state = TestBed.inject(AuthStateStore);
  const element = fixture.nativeElement as HTMLElement;
  const settle = async () => { await fixture.whenStable(); fixture.detectChanges(); };
  const load = (index = 0) => http.expectOne(`${rootUrl}?pagina=${index}&tamanho=20`);
  const goToList = async () => {
    const navigating = router.navigateByUrl("/salvos");
    await vi.waitFor(() => http.expectOne("/api/v1/auth/me").flush(account));
    expect(await navigating).toBe(true);
    await settle();
  };
  fixture.detectChanges();
  return { fixture, http, router, state, element, settle, load, goToList };
}

it("saves from a real catalog detail and restores the private list using the authenticated account", async () => {
  const env = setup();
  await env.router.navigateByUrl("/"); await env.settle();
  env.http.expectOne("/api/v1/auth/me").flush(account); await env.settle();
  env.http.expectOne(req => req.url === "/api/v1/descoberta/mentores")
    .flush({ itens: [profile], pagina: 0, tamanho: 6, totalItens: 1, totalPaginas: 1 });
  await env.settle();
  env.element.querySelector<HTMLButtonElement>(".profile-link")!.click(); await env.settle();
  env.http.expectOne(`/api/v1/descoberta/mentores/${profile.id}`).flush(profile); await env.settle();
  env.http.expectOne(itemUrl).flush({ salvo: false }); await env.settle();
  env.element.querySelector<HTMLButtonElement>("app-saved-profile-button button")!.click(); await env.settle();
  env.http.expectOne("/csrf").flush(csrf);
  const write = env.http.expectOne({ url: itemUrl, method: "PUT" });
  expect(write.request.headers.get(csrf.headerName)).toBe(csrf.token);
  expect(write.request.body).toBeNull();
  write.flush(null, { status: 204, statusText: "No Content" }); await env.settle();
  expect(env.element.querySelector("app-saved-profile-button button")?.textContent).toContain("Remover dos salvos");
  await env.goToList();
  env.load().flush(page([saved])); await env.settle();
  expect(env.element.querySelector(".saved-list")?.textContent).toContain(profile.nome);
  env.http.verify();
});

it("removes an unavailable favorite and rechecks the list after an uncertain response", async () => {
  const env = setup();
  await env.goToList();
  env.load().flush(page([{ ...saved, perfil: null }])); await env.settle();
  expect(env.element.textContent).toContain("Perfil indisponível");
  expect(env.element.textContent).not.toContain(profile.nome);
  env.element.querySelector<HTMLButtonElement>(".saved-item button")!.click(); await env.settle();
  env.http.expectOne("/csrf").flush(csrf);
  env.http.expectOne({ url: itemUrl, method: "DELETE" }).flush(null, { status: 503, statusText: "Unavailable" });
  await env.settle();
  expect(env.element.querySelector("[role=alert]")?.textContent).toContain("Não foi possível confirmar");
  env.http.expectNone(itemUrl);
  env.element.querySelector<HTMLButtonElement>(".catalog-notice button")!.click(); await env.settle();
  env.load().flush(page([])); await env.settle();
  expect(env.element.textContent).toContain("Você ainda não salvou nenhum perfil");
  env.http.verify();
});

it("discards old account responses and refuses extra private fields in saved entries", async () => {
  const env = setup();
  await env.goToList();
  const old = env.load();
  env.state.setUser({ ...account, id: "other-reader" }); await env.settle();
  const fresh = env.load();
  old.flush(page([saved])); await env.settle();
  expect(env.element.textContent).not.toContain(profile.nome);
  fresh.flush(page([{ ...saved, email: "private@example.test" }])); await env.settle();
  expect(env.element.querySelector("[role=alert]")?.textContent).toContain("Não foi possível consultar");
  expect(env.element.textContent).not.toContain("private@example.test");
  env.http.verify();
});

it("returns to the previous page after deleting its last favorite", async () => {
  const env = setup();
  await env.goToList();
  const rows = Array.from({ length: 20 }, (_, index) => ({ ...saved, perfil: null,
    perfilId: `20000000-0000-4000-8000-${String(index).padStart(12, "0")}` }));
  env.load().flush(page(rows, 0, 21)); await env.settle();
  env.element.querySelectorAll<HTMLButtonElement>(".saved-pagination button")[1].click(); await env.settle();
  env.load(1).flush(page([saved], 1, 21)); await env.settle();
  env.element.querySelector<HTMLButtonElement>(".saved-item button")!.click(); await env.settle();
  env.http.expectOne("/csrf").flush(csrf);
  env.http.expectOne({ url: itemUrl, method: "DELETE" }).flush(null, { status: 204, statusText: "No Content" });
  await env.settle(); env.load(1).flush(page([], 1, 20)); await env.settle();
  env.load().flush(page(rows)); await env.settle();
  expect(env.element.querySelectorAll(".saved-item")).toHaveLength(20);
  env.http.verify();
});
