import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { HttpTestingController, TestRequest, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { Router, provideRouter } from "@angular/router";
import { expect, it, vi } from "vitest";
import { AppComponent } from "../../app.component";
import { routes } from "../../app.routes";
import { authInterceptor } from "../../core/auth.interceptor";
import { AuthStateStore } from "../../core/auth-state.store";
import { REGISTRATION_MODE, registrationGatewayFactory } from "../../core/registration.config";
import { RegistrationGateway } from "../../core/registration.gateway";
import { ProfileSessionStore } from "../../core/profile-session.store";

it("completa onboarding de startup, login por sessão e logout com renovação de CSRF", async () => {
  TestBed.configureTestingModule({ imports: [AppComponent], providers: [
    provideRouter(routes), provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting(),
    { provide: REGISTRATION_MODE, useValue: "API" }, { provide: RegistrationGateway, useFactory: registrationGatewayFactory },
  ] });
  const fixture = TestBed.createComponent(AppComponent);
  const page = fixture.nativeElement as HTMLElement;
  const router = TestBed.inject(Router);
  const http = TestBed.inject(HttpTestingController);
  const account = { id: "founder-test", nome: "Pessoa Fundadora", email: "founder@example.test", tipoUsuario: "STARTUP" };
  const details = { nomeProvisorio: "Ideia Fictícia", pitchCurto: "Uma rede de apoio.", problemaCentral: "Poucas conexões.",
    solucaoProposta: "Aproximar pessoas e ideias.", publicoAlvo: "Projetos iniciais", modeloDeNegocio: "Assinatura", statusValidacao: "PESQUISA_MERCADO" };
  const startup = { ...details, id: "startup-test", status: "RASCUNHO", dataCriacao: "2026-10-22T12:00:00Z",
    membros: [{ id: "member-test", usuarioId: account.id, nomeUsuario: account.nome, papelMembro: "FUNDADOR", dataEntrada: "2026-10-22" }] };
  async function request(url: string): Promise<TestRequest> {
    let found: TestRequest | undefined;
    await vi.waitFor(() => { found = http.expectOne(url); });
    return found!;
  }
  async function refresh() { await fixture.whenStable(); fixture.detectChanges(); }
  function enter(id: string, value: string) {
    const control = page.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(`#${id}`)!;
    control.value = value;
    control.dispatchEvent(new Event(control instanceof HTMLSelectElement ? "change" : "input", { bubbles: true }));
    fixture.detectChanges();
  }
  function submit() {
    page.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); fixture.detectChanges();
  }
  fixture.detectChanges(); await router.navigateByUrl("/cadastro"); await refresh();
  page.querySelector<HTMLInputElement>("#register-kind-STARTUP")!.click(); fixture.detectChanges();
  enter("register-name", account.nome); enter("register-email", account.email); enter("register-password", "senha-ficticia");
  for (const [key, value] of Object.entries(details)) enter(key === "statusValidacao" ? "startup-status" : `startup-${key}`, value);
  submit();
  (await request("/csrf")).flush({ headerName: "X-XSRF-TOKEN", token: "before-registration" });
  const registration = await request("/api/v1/startups");
  expect(registration.request.withCredentials).toBe(true);
  expect(registration.request.headers.get("X-XSRF-TOKEN")).toBe("before-registration");
  expect(registration.request.body).toEqual({ fundador: { nome: account.nome, email: account.email, senha: "senha-ficticia" }, ...details });
  registration.flush(startup, { status: 201, statusText: "Created" }); await refresh();
  expect(page.textContent).toContain("Sua startup foi cadastrada");
  expect(TestBed.inject(AuthStateStore).user()).toBeNull();
  expect(TestBed.inject(ProfileSessionStore).profile()).toBeNull();
  expect(page.innerHTML).not.toContain("senha-ficticia");
  expect([...Object.values(localStorage), ...Object.values(sessionStorage)].join("")).not.toContain("senha-ficticia");
  await router.navigateByUrl("/entrar"); await refresh();
  enter("login-email", account.email); enter("login-password", "senha-ficticia"); submit();
  (await request("/csrf")).flush({ headerName: "X-XSRF-TOKEN", token: "before-login" });
  (await request("/api/v1/auth/login")).flush(account);
  (await request("/csrf")).flush({ headerName: "X-XSRF-TOKEN", token: "after-login" });
  (await request("/api/v1/auth/me")).flush(account); await refresh();
  expect(router.url).toBe("/conta");
  expect(page.textContent).toContain(account.nome);
  expect(page.querySelector('a[href="/mentor/perfil"]')).toBeNull();
  expect(page.querySelector('a[href="/startup/perfil"]')?.textContent).toContain("Abrir minha startup");
  const opening = router.navigateByUrl("/startup/perfil");
  (await request("/api/v1/auth/me")).flush(account);
  await opening; await refresh();
  (await request("/api/v1/startups/me")).flush([startup]);
  const publication = { startupId: startup.id, status: "RASCUNHO", aptoParaPublicacao: false, podeGerenciar: true,
    pendencias: [{ codigo: "QUESTIONARIO_AUSENTE", campo: "perfilMatch", mensagem: "Preencha e salve o questionário desta startup." }] };
  (await request("/api/v1/startups/startup-test/status")).flush(publication); await refresh();
  await vi.waitFor(() => {
    fixture.detectChanges();
    const edit = [...page.querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent?.includes("Editar startup"));
    expect(edit?.disabled).toBe(false);
  });
  expect(page.textContent).toContain(details.nomeProvisorio);
  [...page.querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent?.includes("Editar startup"))!.click();
  fixture.detectChanges(); enter("edit-startup-nomeProvisorio", "Ideia Atualizada"); submit();
  const update = await request("/api/v1/startups/startup-test");
  expect(update.request.method).toBe("PATCH");
  expect(update.request.headers.get("X-XSRF-TOKEN")).toBe("after-login");
  expect(update.request.withCredentials).toBe(true);
  expect(update.request.body).toEqual({ ...details, nomeProvisorio: "Ideia Atualizada" });
  const updated = { ...startup, nomeProvisorio: "Ideia Atualizada" };
  update.flush(updated);
  (await request("/api/v1/startups/startup-test/status")).flush(publication); await refresh();
  await vi.waitFor(() => { fixture.detectChanges(); expect(page.textContent).toContain("Dados da startup salvos com sucesso"); });
  [...page.querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent?.includes("Recarregar dados"))!.click();
  (await request("/api/v1/startups/me")).flush([updated]);
  (await request("/api/v1/startups/startup-test/status")).flush(publication); await refresh();
  expect(page.textContent).toContain("Ideia Atualizada");
  const accountPage = router.navigateByUrl("/conta");
  (await request("/api/v1/auth/me")).flush(account); await accountPage; await refresh();
  [...page.querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent?.includes("Sair da conta"))!.click();
  const logout = await request("/api/v1/auth/logout");
  expect(logout.request.headers.get("X-XSRF-TOKEN")).toBe("after-login");
  logout.flush(null, { status: 204, statusText: "No Content" });
  (await request("/csrf")).flush({ headerName: "X-XSRF-TOKEN", token: "after-logout" }); await refresh();
  expect(router.url).toBe("/entrar");
  expect(TestBed.inject(AuthStateStore).user()).toBeNull();
  http.verify();
});
