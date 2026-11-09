import { HttpClient, provideHttpClient, withInterceptors } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { Router, provideRouter } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { expect, it, vi } from "vitest";
import { AppComponent } from "../../app.component";
import { routes } from "../../app.routes";
import { AuthStateStore } from "../../core/auth-state.store";
import { authInterceptor } from "../../core/auth.interceptor";
import { REGISTRATION_MODE } from "../../core/registration.config";
import { ProfilesStore } from "../../core/profiles.store";
import { ProfileSessionStore } from "../../core/profile-session.store";

it("restores the session before catalog requests, follows filters and fresh details, then clears all catalog data on expiry", async () => {
  TestBed.configureTestingModule({ imports: [AppComponent], providers: [provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting(), { provide: REGISTRATION_MODE, useValue: "API" },
    { provide: ProfilesStore, useFactory: () => { throw new Error("Fake profiles accessed"); } },
    { provide: ProfileSessionStore, useFactory: () => { throw new Error("DEMO session accessed"); } }] });
  const fixture = TestBed.createComponent(AppComponent); const root = fixture.nativeElement as HTMLElement;
  const router = TestBed.inject(Router); const http = TestBed.inject(HttpTestingController);
  const account = { id: "reader", nome: "Pessoa Fictícia", email: "reader@example.test", tipoUsuario: "STARTUP" };
  const profile = { id: "10000000-0000-4000-8000-000000000001", tipo: "MENTOR", nome: "Ágata do Banco",
    apresentacao: "Biografia pública completa", setores: ["TECH"], topicos: ["VALIDATION"], formato: "ONLINE", cidadeId: "" };
  fixture.detectChanges(); await router.navigateByUrl("/?busca=Ágata"); await fixture.whenStable();
  http.expectNone(req => req.url.includes("/descoberta/"));
  http.expectOne("/api/v1/auth/me").flush(account); await fixture.whenStable(); fixture.detectChanges();
  const catalog = http.expectOne(req => req.url === "/api/v1/descoberta/mentores");
  expect(catalog.request.withCredentials).toBe(true); expect(catalog.request.params.get("busca")).toBe("Ágata");
  catalog.flush({ itens: [profile], pagina: 0, tamanho: 6, totalItens: 1, totalPaginas: 1 });
  await fixture.whenStable(); fixture.detectChanges();
  expect(root.textContent).toContain(profile.nome); expect(root.querySelector('.main-nav a[href="/salvos"]')).toBeNull();
  expect(root.querySelector(".topbar-actions a")?.getAttribute("href")).toBe("/conta");
  root.querySelector<HTMLButtonElement>(".profile-link")!.click(); fixture.detectChanges();
  expect(root.querySelector("dialog .presentation")).toBeNull();
  http.expectOne("/api/v1/descoberta/mentores/" + profile.id).flush(profile);
  await fixture.whenStable(); fixture.detectChanges(); expect(root.querySelector("dialog")?.textContent).toContain(profile.apresentacao);
  root.querySelector<HTMLButtonElement>('[aria-label="Fechar detalhe"]')!.click();
  const field = root.querySelector<HTMLInputElement>("#discovery-search")!;
  field.value = "Sem resultado"; field.dispatchEvent(new Event("input", { bubbles: true }));
  root.querySelector<HTMLFormElement>("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  await vi.waitFor(() => expect(router.url).toContain("Sem%20resultado")); await fixture.whenStable();
  const empty = http.expectOne(req => req.url === "/api/v1/descoberta/mentores");
  empty.flush({ itens: [], pagina: 0, tamanho: 6, totalItens: 0, totalPaginas: 0 }); await fixture.whenStable(); fixture.detectChanges();
  expect(root.textContent).toContain("Nenhum perfil nesta página"); expect(root.textContent).not.toContain(profile.nome);
  const pending = firstValueFrom(TestBed.inject(HttpClient).get("/api/v1/auth/me")).catch(error => error);
  http.expectOne("/api/v1/auth/me").flush({}, { status: 401, statusText: "Expired" }); await pending;
  await fixture.whenStable(); fixture.detectChanges(); expect(TestBed.inject(AuthStateStore).user()).toBeNull();
  expect(root.textContent).toContain("Entre para conhecer os perfis"); expect(root.querySelector(".catalog-card")).toBeNull();
  expect(root.querySelector(".topbar-actions a")?.getAttribute("href")).toBe("/entrar"); http.verify();
});
