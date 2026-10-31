import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { HttpTestingController, TestRequest, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { Router, provideRouter } from "@angular/router";
import { expect, it, vi } from "vitest";
import { AppComponent } from "../../app.component";
import { routes } from "../../app.routes";
import { authInterceptor } from "../../core/auth.interceptor";
import { ProfileSessionStore } from "../../core/profile-session.store";
import { REGISTRATION_MODE } from "../../core/registration.config";

it("restores a real mentor questionnaire, edits it through the wizard, saves with CSRF and loads a startup questionnaire independently", async () => {
  TestBed.configureTestingModule({ imports: [AppComponent], providers: [provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting(),
    { provide: REGISTRATION_MODE, useValue: "API" },
  ] });
  const fixture = TestBed.createComponent(AppComponent);
  const page = fixture.nativeElement as HTMLElement;
  const router = TestBed.inject(Router); const http = TestBed.inject(HttpTestingController);
  const owner = { id: "mentor-user", nome: "Pessoa Mentora", email: "mentor@example.test", tipoUsuario: "MENTOR" };
  const mentor = { id: "mentor-test", usuarioId: owner.id, nome: owner.nome, email: owner.email,
    biografia: "Biografia fictícia", dataEntradaPlataforma: "2026-10-26", status: "RASCUNHO",
    disponibilidades: [{ diaSemana: 4, periodo: "NOITE" }] };
  const answers = { questionnaireVersion: "damatch-profile-v3", kind: "MENTOR", projectName: "", moments: ["PROBLEM"],
    sectors: ["TECH"], topics: ["VALIDATION"], experience: { VALIDATION: "PRACTICAL" }, audiences: ["B2C"],
    backgrounds: ["TECH"], capacity: "ONE", format: "ONLINE", cityId: "", cadence: "FLEXIBLE", accepting: true,
    availability: [{ day: "THU", period: "EVENING" }] };
  async function request(url: string): Promise<TestRequest> {
    let found: TestRequest | undefined;
    await vi.waitFor(() => { found = http.expectOne(url); }); return found!;
  }
  async function refresh() { await fixture.whenStable(); fixture.detectChanges(); }
  function button(text: string) {
    const element = Array.from(page.querySelectorAll("button")).find(item => item.textContent?.trim() === text);
    expect(element).toBeDefined(); element!.click(); fixture.detectChanges();
  }
  fixture.detectChanges();
  const opening = router.navigateByUrl("/mentor/questionario");
  (await request("/api/v1/auth/me")).flush(owner);
  (await request("/api/v1/mentores/me")).flush(mentor);
  (await request("/api/v1/mentores/mentor-test/perfil-match")).flush(answers);
  await opening; await refresh();
  await vi.waitFor(() => { fixture.detectChanges(); expect(page.textContent).toContain("Editar respostas"); });
  button("Editar respostas"); button("Público"); button("2 a 3 startupsUm pequeno grupo por vez.");
  page.querySelector("app-profile-setup form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  (await request("/csrf")).flush({ headerName: "X-XSRF-TOKEN", token: "test-token" });
  const writing = await request("/api/v1/mentores/mentor-test/perfil-match");
  expect(writing.request.method).toBe("PUT");
  expect(writing.request.withCredentials).toBe(true);
  expect(writing.request.headers.get("X-XSRF-TOKEN")).toBe("test-token");
  expect(writing.request.body.capacity).toBe("FEW");
  expect(writing.request.body.availability).toEqual(answers.availability);
  writing.flush({ ...answers, capacity: "FEW" }); await refresh();
  await vi.waitFor(() => { fixture.detectChanges(); expect(page.textContent).toContain("Questionário salvo"); });
  expect(TestBed.inject(ProfileSessionStore).profile()).toBeNull();
  const founder = { id: "startup-user", nome: "Pessoa Fundadora", email: "startup@example.test", tipoUsuario: "STARTUP" };
  const startup = { id: "startup-test", nomeProvisorio: "Projeto fictício", pitchCurto: "Resumo", problemaCentral: "Problema",
    solucaoProposta: "Solução", publicoAlvo: "Público", modeloDeNegocio: "Modelo", statusValidacao: "APENAS_IDEIA",
    status: "RASCUNHO", dataCriacao: "2026-10-26T12:00:00Z", membros: [{ id: "member-test", usuarioId: founder.id,
      nomeUsuario: founder.nome, papelMembro: "FUNDADOR", dataEntrada: "2026-10-26" }] };
  const changing = router.navigateByUrl("/startup/perfil/startup-test/questionario");
  (await request("/api/v1/auth/me")).flush(founder);
  (await request("/api/v1/startups/me")).flush([startup]);
  (await request("/api/v1/startups/startup-test/perfil-match")).flush(null, { status: 204, statusText: "No Content" });
  await changing; await refresh();
  await vi.waitFor(() => { fixture.detectChanges(); expect(page.textContent).toContain("Preencher questionário"); });
  expect(page.textContent).not.toContain("Pessoa Mentora");
  expect(page.textContent).not.toContain("Questionário salvo");
  http.verify();
});
