import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { HttpTestingController, TestRequest, provideHttpClientTesting } from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Router, provideRouter } from "@angular/router";
import { afterEach, expect, it, vi } from "vitest";
import { AppComponent } from "../../app.component";
import { routes } from "../../app.routes";
import { authInterceptor } from "../../core/auth.interceptor";
import { AuthStateStore } from "../../core/auth-state.store";
import { REGISTRATION_MODE, registrationGatewayFactory } from "../../core/registration.config";
import { RegistrationGateway } from "../../core/registration.gateway";
import { THEME_STORAGE_KEY } from "../../core/theme.store";

afterEach(() => localStorage.removeItem(THEME_STORAGE_KEY));

it("connects registration, login, private profile, editing, publication and logout through the real Angular routes", async () => {
  TestBed.configureTestingModule({ imports: [AppComponent], providers: [
    provideZonelessChangeDetection(), provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting(),
    { provide: REGISTRATION_MODE, useValue: "API" },
    { provide: RegistrationGateway, useFactory: registrationGatewayFactory },
  ] });
  const fixture: ComponentFixture<AppComponent> = TestBed.createComponent(AppComponent);
  const page: HTMLElement = fixture.nativeElement;
  const http = TestBed.inject(HttpTestingController);
  const router = TestBed.inject(Router);
  const account = { id: "user-test", nome: "Mentora Fictícia", email: "mentor@example.test", tipoUsuario: "MENTOR" };
  const profile = { id: "mentor-test", usuarioId: account.id, nome: account.nome, email: account.email,
    biografia: "Experiência em produtos.", linkedin: null, instagram: null, site: null,
    disponibilidades: [{ diaSemana: 1, periodo: "MANHA" }], status: "RASCUNHO", dataEntradaPlataforma: "2026-10-21" };
  async function request(url: string): Promise<TestRequest> {
    let found: TestRequest | undefined;
    await vi.waitFor(() => { found = http.expectOne(url); });
    return found!;
  }
  async function refresh() { await fixture.whenStable(); fixture.detectChanges(); }
  function enter(id: string, value: string) {
    const input = page.querySelector<HTMLInputElement | HTMLTextAreaElement>(`#${id}`)!;
    input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    fixture.detectChanges();
  }
  function submit() {
    page.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    fixture.detectChanges();
  }
  fixture.detectChanges();
  await router.navigateByUrl("/cadastro");
  await refresh();
  enter("register-name", account.nome); enter("register-email", account.email);
  enter("register-password", "ficticia"); enter("register-biography", profile.biografia);
  page.querySelector<HTMLInputElement>('input[aria-label="Segunda-feira, Manhã"]')!.click();
  submit();
  (await request("/csrf")).flush({ headerName: "X-XSRF-TOKEN", token: "before-registration" });
  const registration = await request("/api/v1/mentores");
  expect(registration.request.body.disponibilidades).toEqual(profile.disponibilidades);
  expect(registration.request.withCredentials).toBe(true);
  registration.flush(profile, { status: 201, statusText: "Created" });
  await refresh();
  expect(page.textContent).toContain("Seu cadastro de mentor foi criado");
  expect(TestBed.inject(AuthStateStore).user()).toBeNull();

  await router.navigateByUrl("/entrar"); await refresh();
  enter("login-email", account.email); enter("login-password", "ficticia"); submit();
  (await request("/csrf")).flush({ headerName: "X-XSRF-TOKEN", token: "before-login" });
  const login = await request("/api/v1/auth/login");
  expect(login.request.headers.get("X-XSRF-TOKEN")).toBe("before-login");
  login.flush(account);
  (await request("/csrf")).flush({ headerName: "X-XSRF-TOKEN", token: "after-login" });
  (await request("/api/v1/auth/me")).flush(account);
  await refresh();
  expect(router.url).toBe("/conta");
  expect(page.textContent).toContain("Abrir meu perfil de mentor");

  const navigation = router.navigateByUrl("/mentor/perfil");
  (await request("/api/v1/auth/me")).flush(account);
  await navigation;
  (await request("/api/v1/mentores/me")).flush(profile);
  await refresh();
  enter("mentor-biography", "Biografia atualizada"); submit();
  const edit = await request("/api/v1/mentores/mentor-test");
  expect(edit.request.headers.get("X-XSRF-TOKEN")).toBe("after-login");
  expect(edit.request.body).not.toHaveProperty("usuarioId");
  const updated = { ...profile, biografia: "Biografia atualizada" };
  edit.flush(updated); await refresh();
  expect(page.textContent).toContain("Perfil salvo com sucesso");
  [...page.querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent?.includes("Publicar perfil"))!.click();
  const publish = await request("/api/v1/mentores/mentor-test/status");
  expect(publish.request.body).toEqual({ status: "PUBLICADO" });
  publish.flush({ ...updated, status: "PUBLICADO" }); await refresh();
  expect(page.textContent).toContain("Publicado");

  const back = router.navigateByUrl("/conta");
  (await request("/api/v1/auth/me")).flush(account); await back; await refresh();
  [...page.querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent?.includes("Sair da conta"))!.click();
  (await request("/api/v1/auth/logout")).flush(null, { status: 204, statusText: "No Content" });
  (await request("/csrf")).flush({ headerName: "X-XSRF-TOKEN", token: "after-logout" });
  await refresh();
  expect(router.url).toBe("/entrar");
  expect(TestBed.inject(AuthStateStore).user()).toBeNull();
  http.verify();
});
