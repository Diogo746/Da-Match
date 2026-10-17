import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Router, provideRouter } from "@angular/router";
import { afterEach, beforeEach, expect, it } from "vitest";
import { AppComponent } from "../../app.component";
import { routes } from "../../app.routes";
import { REGISTRATION_MODE, registrationGatewayFactory } from "../../core/registration.config";
import { RegistrationGateway } from "../../core/registration.gateway";
import { ProfileSessionStore } from "../../core/profile-session.store";
import { THEME_STORAGE_KEY } from "../../core/theme.store";
import { RegisterComponent } from "./register.component";
import { emptyProfile } from "../../core/profile.models";

let fixture: ComponentFixture<AppComponent>;
let page: HTMLElement;
let http: HttpTestingController;
const mentorResponse = {
  id: "mentor-confirmado", usuarioId: "usuario-confirmado", nome: "Ana Mentora", email: "ana@example.test",
  biografia: "Experiência em educação e validação de ideias.", dataEntradaPlataforma: "2026-10-17",
  linkedin: "https://www.linkedin.com/in/ana-teste", instagram: "ana.teste", site: null,
};
async function refresh() { await fixture.whenStable(); fixture.detectChanges(); }
function enter(id: string, value: string) {
  const field = page.querySelector<HTMLInputElement | HTMLTextAreaElement>(`#${id}`)!;
  field.value = value; field.dispatchEvent(new Event("input", { bubbles: true })); fixture.detectChanges();
}
function submit() {
  page.querySelector<HTMLFormElement>("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  fixture.detectChanges();
}
function fill() {
  enter("register-name", "Ana Mentora"); enter("register-email", "ana@example.test");
  enter("register-password", "senha-ficticia"); enter("register-biography", mentorResponse.biografia);
}
function receiveCsrf() {
  http.expectOne("/csrf").flush({ headerName: "X-XSRF-TOKEN", token: "protecao-ficticia" });
  return http.expectOne("/api/v1/mentores");
}
beforeEach(async () => {
  await TestBed.configureTestingModule({ imports: [AppComponent], providers: [
    provideZonelessChangeDetection(), provideRouter(routes), provideHttpClient(), provideHttpClientTesting(),
    { provide: REGISTRATION_MODE, useValue: "API" },
    { provide: RegistrationGateway, useFactory: registrationGatewayFactory },
  ] }).compileComponents();
  fixture = TestBed.createComponent(AppComponent); page = fixture.nativeElement;
  http = TestBed.inject(HttpTestingController);
  fixture.detectChanges(); await TestBed.inject(Router).navigateByUrl("/cadastro"); await refresh();
});
afterEach(() => { http.verify(); localStorage.removeItem(THEME_STORAGE_KEY); });

it("apresenta apenas mentor no modo conectado e exige a biografia antes da rede", async () => {
  expect(page.querySelectorAll(".role-option")).toHaveLength(1);
  expect(page.querySelector('.main-nav a[href="/meu-perfil"]')).toBeNull();
  expect(page.querySelector(".topbar-actions a")?.textContent).toContain("Cadastro de mentor");
  expect(page.querySelector(".sidebar-invite a")?.textContent).toContain("Cadastrar mentor");
  expect(page.querySelector(".demo-pill")?.textContent).toContain("Integração de mentor");
  expect(page.querySelector('input[formControlName="demoConsent"]')).toBeNull();
  enter("register-name", "Ana Mentora"); enter("register-email", "ana@example.test"); enter("register-password", "senha-ficticia");
  submit(); await refresh();
  expect(page.querySelector("#biography-error")?.textContent).toContain("biografia");
  http.expectNone(() => true);
});

it("confirma somente depois de 201, limpa a senha e termina sem inventar login ou perfil salvo", async () => {
  fill(); enter("register-linkedin", mentorResponse.linkedin); enter("register-instagram", mentorResponse.instagram);
  expect(page.querySelector(".biography-help")?.textContent).toContain(`${mentorResponse.biografia.length}/1000`);
  submit(); submit();
  expect(page.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(true);
  expect(page.textContent).not.toContain("Seu cadastro de mentor foi criado.");
  const post = receiveCsrf();
  expect(post.request.headers.get("X-XSRF-TOKEN")).toBe("protecao-ficticia");
  post.flush(mentorResponse, { status: 201, statusText: "Created" }); await refresh();
  expect(page.querySelector("h1")?.textContent).toContain("Seu cadastro de mentor foi criado.");
  expect(page.querySelector(".account-card")?.textContent).toContain(mentorResponse.biografia);
  expect(page.querySelector(".account-card")?.textContent).toContain(mentorResponse.linkedin);
  expect(page.querySelector(".account-card")?.textContent).toContain(mentorResponse.instagram);
  expect(page.querySelector("app-profile-setup")).toBeNull();
  expect(page.textContent).toContain("login, a edição online");
  expect(page.innerHTML).not.toContain("senha-ficticia");
  expect(TestBed.inject(ProfileSessionStore).profile()).toBeNull();
  expect(document.activeElement?.id).toBe("mentor-created-title");
});

it.each([[400, "não aceitou"], [403, "proteção do envio"], [409, "e-mail já está cadastrado"]])("explica HTTP %s sem abrir o questionário", async (status, message) => {
  fill(); submit(); receiveCsrf().flush(null, { status: Number(status), statusText: "Error" }); await refresh();
  expect(page.querySelector('[role="alert"]')?.textContent).toContain(message);
  expect(page.querySelector("app-profile-setup")).toBeNull();
  expect(page.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(false);
  expect(TestBed.inject(ProfileSessionStore).profile()).toBeNull();
});

it("mantém o envio bloqueado quando não há confirmação e não refaz POST", async () => {
  fill(); submit(); receiveCsrf().flush(null, { status: 500, statusText: "Internal Server Error" }); await refresh();
  expect(page.querySelector('[role="alert"]')?.textContent).toContain("A conta pode ter sido criada");
  expect(page.querySelector<HTMLInputElement>("#register-password")?.value).toBe("");
  expect(page.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(true);
  submit(); http.expectNone(() => true);
});

it("explica indisponibilidade antes do envio e permite corrigir a conexão", async () => {
  fill(); submit(); http.expectOne("/csrf").error(new ProgressEvent("error")); await refresh();
  expect(page.querySelector('[role="alert"]')?.textContent).toContain("backend está em execução");
  expect(page.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(false);
  submit(); receiveCsrf().flush(mentorResponse, { status: 201, statusText: "Created" }); await refresh();
  expect(page.querySelector("h1")?.textContent).toContain("foi criado");
});

it("não transforma a confirmação de API em perfil demonstrativo", async () => {
  // Verificação do contrato do componente, inclusive se um evento for emitido por engano.
  const registration = fixture.debugElement.queryAll(node => node.componentInstance instanceof RegisterComponent)[0].componentInstance as RegisterComponent;
  fill(); submit(); receiveCsrf().flush(mentorResponse, { status: 201, statusText: "Created" }); await refresh();
  registration.completeProfile({ ...emptyProfile("MENTOR"), sectors: ["TECH"], topics: ["VALIDATION"], format: "ONLINE", moments: ["PROBLEM"], cadence: "FLEXIBLE", experience: { VALIDATION: "PRACTICAL", CUSTOMERS: "PRACTICAL", BUSINESS: "PRACTICAL", PROTOTYPE: "PRACTICAL", PRICING: "PRACTICAL", PITCH: "PRACTICAL" }, availability: [{ day: "MON", period: "EVENING" }] });
  expect(registration.profileReady()).toBe(false);
  expect(TestBed.inject(ProfileSessionStore).profile()).toBeNull();
  registration.restart(); await refresh();
  expect(registration.form.controls.tipoUsuario.value).toBe("MENTOR");
  expect(registration.form.controls.biografia.value).toBe("");
});
