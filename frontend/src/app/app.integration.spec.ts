import { afterEach, describe, expect, it, vi } from "vitest";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { Router, provideRouter } from "@angular/router";
import { of } from "rxjs";
import { AppComponent } from "./app.component";
import { routes } from "./app.routes";
import { RegistrationGateway, RegistrationRequest } from "./core/registration.gateway";
import { ProfileKind, ProfileDraft } from "./core/profile.models";
import { ProfileSessionStore } from "./core/profile-session.store";
import { THEME_STORAGE_KEY } from "./core/theme.store";

let fixture: ComponentFixture<AppComponent>;
let root: HTMLElement;
async function settle() { await fixture.whenStable(); fixture.detectChanges(); }
async function render(path: string) {
  await TestBed.configureTestingModule({ imports: [AppComponent], providers: [
    provideZonelessChangeDetection(), provideRouter(routes),
    { provide: RegistrationGateway, useValue: { register: (kind: ProfileKind, request: RegistrationRequest) => of({ nome: request.nome, email: request.email, tipoUsuario: kind, mode: "DEMO" as const }) } },
  ] }).compileComponents();
  fixture = TestBed.createComponent(AppComponent); root = fixture.nativeElement;
  fixture.detectChanges(); await TestBed.inject(Router).navigateByUrl(path); await settle();
}
function fill(id: string, value: string) {
  const input = root.querySelector<HTMLInputElement>(`#${id}`)!;
  input.value = value; input.dispatchEvent(new Event("input", { bubbles: true })); fixture.detectChanges();
}
async function click(label: string) {
  const element = [...root.querySelectorAll<HTMLButtonElement>("button")].find((item) => item.textContent?.trim().includes(label));
  expect(element, `Botão ${label}`).toBeDefined(); element!.click(); await settle();
}
async function account(kind: ProfileKind) {
  const label = [...root.querySelectorAll<HTMLLabelElement>(".role-option")].find((item) => item.textContent?.includes(kind === "MENTOR" ? "Mentor" : "Startup"))!;
  label.querySelector<HTMLInputElement>('input[type="radio"]')!.click();
  fill("register-name", "Maria Teste"); fill("register-email", "maria@example.test"); fill("register-password", "senha-inventada");
  root.querySelector<HTMLInputElement>('input[formControlName="demoConsent"]')!.click();
  await click("Continuar para meu perfil");
}
async function onlineSchedule() {
  await click("Online"); await click("Continuar");
  root.querySelector<HTMLButtonElement>('button[aria-label="Quinta-feira"]')!.click();
  await click("Noite");
}
async function goHomeFromCompletion() {
  root.querySelector<HTMLAnchorElement>(".complete-actions a")!.click(); await settle();
}
afterEach(() => {
  vi.restoreAllMocks();
  localStorage.removeItem(THEME_STORAGE_KEY);
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.style.removeProperty("color-scheme");
});

it("alterna o tema pela interface e preserva a preferência e as falas ao navegar", async () => {
  await render("/");
  const toggle = root.querySelector<HTMLButtonElement>(".theme-toggle")!;
  expect(toggle.getAttribute("aria-pressed")).toBe("false");
  expect(root.querySelector("app-lumen-guide .speech-text")?.textContent).toContain("Sou o Lumen");
  await click("Modo escuro");
  expect(document.documentElement.dataset["theme"]).toBe("dark");
  expect(toggle.getAttribute("aria-label")).toBe("Ativar modo claro");
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  expect(root.querySelectorAll("app-profile-card")).toHaveLength(6);
  await TestBed.inject(Router).navigateByUrl("/cadastro"); await settle();
  expect(document.documentElement.dataset["theme"]).toBe("dark");
  expect(root.querySelector("app-lumen-guide .speech-text")?.textContent).toContain("começar pelo básico");
  await click("Modo claro");
  expect(document.documentElement.dataset["theme"]).toBe("light");
  expect(toggle.getAttribute("aria-pressed")).toBe("false");
});

it("permite pausar e retomar o movimento mantendo a escolha durante a navegação", async () => {
  await render("/");
  const pause = root.querySelector<HTMLButtonElement>(".motion-toggle")!;
  expect(pause.getAttribute("aria-pressed")).toBe("false");
  await click("Pausar animações");
  expect(pause.getAttribute("aria-pressed")).toBe("true");
  expect(root.querySelector(".app-layout")?.classList.contains("motion-paused")).toBe(true);
  await TestBed.inject(Router).navigateByUrl("/cadastro"); await settle();
  expect(root.querySelector("app-lumen img")?.getAttribute("src")).toBe("assets/lumen.png");
  expect(root.querySelector(".app-layout")?.classList.contains("motion-paused")).toBe(true);
  await click("Retomar animações");
  expect(pause.getAttribute("aria-pressed")).toBe("false");
  expect(root.querySelector(".app-layout")?.classList.contains("motion-paused")).toBe(false);
});

describe("Fluxo renderizado de cadastro, perfil e home", () => {
  it("leva o cadastro da startup até indicações reais de 80 pontos na home", async () => {
    await render("/cadastro"); await click("Modo escuro"); await account("STARTUP");
    await click("Tecnologia"); await click("Continuar");
    await click("Validar a ideia"); await click("Preços e custos"); await click("Continuar");
    await onlineSchedule(); await click("Meu perfil está pronto");
    expect(root.querySelector("app-profile-complete")).not.toBeNull();
    expect(document.activeElement).toBe(root.querySelector("#complete-title"));
    expect(root.textContent).not.toContain("senha-inventada");
    await goHomeFromCompletion();
    expect(root.querySelector("#profiles-title")?.textContent).toContain("Indicações");
    expect(root.querySelector(".compatibility-label")?.textContent).toContain("80%");
    expect(TestBed.inject(ProfileSessionStore).profile()!.answers.topics).toEqual(["VALIDATION", "PRICING"]);
    const button = root.querySelector<HTMLButtonElement>(".profile-link")!;
    button.click(); await settle();
    expect(root.querySelector("#matching-title")?.textContent).toContain("80%");
    expect(root.querySelector(".match-limitations")?.textContent).toContain("Preços e custos");
    await TestBed.inject(Router).navigateByUrl("/meu-perfil"); await settle();
    expect(root.querySelector("#my-profile-title")?.textContent).toBe("Meu perfil");
    expect(root.querySelector("app-profile-setup")).toBeNull();
    expect(root.querySelector("#profile-topics-title")?.parentElement?.parentElement?.textContent).toContain("Preços e custos");
    root.querySelector<HTMLButtonElement>('button[aria-label="Editar necessidades"]')!.click(); await settle();
    expect(root.querySelector(".question-title")?.textContent).toContain("O que mais ajudaria");
    await click("Preços e custos"); await click("Salvar alterações");
    expect(root.querySelector("app-profile-setup")).toBeNull();
    expect(root.querySelector('[role="status"]')?.textContent).toContain("Alterações salvas");
    expect(document.activeElement).toBe(root.querySelector("#my-profile-title"));
    expect(TestBed.inject(ProfileSessionStore).profile()!.answers.topics).toEqual(["VALIDATION"]);
    root.querySelector<HTMLAnchorElement>(".profile-actions a")!.click(); await settle();
    expect(root.querySelector(".compatibility-label")?.textContent).toContain("100%");
    await TestBed.inject(Router).navigateByUrl("/meu-perfil"); await settle();
    expect(root.querySelector("app-profile-setup")).toBeNull();
    expect(root.querySelector(".profile-details")?.textContent).not.toContain("Preços e custos");
  });
  it("mostra startups ao mentor e atualiza a home ao pausar novas mentorias", async () => {
    await render("/cadastro"); await account("MENTOR");
    await click("Tecnologia"); await click("Continuar");
    await click("Validar a ideia"); await click("Primeiro protótipo"); await click("Continuar");
    await onlineSchedule(); await click("Meu perfil está pronto"); await goHomeFromCompletion();
    expect(root.querySelector(".compatibility-label")?.textContent).toContain("100%");
    expect(root.querySelector(".kind-label")?.textContent).toContain("Startup");
    await TestBed.inject(Router).navigateByUrl("/meu-perfil"); await settle();
    expect(root.querySelector("app-profile-setup")).toBeNull();
    root.querySelector<HTMLButtonElement>('button[aria-label="Editar disponibilidade"]')!.click(); await settle();
    root.querySelector<HTMLInputElement>('.accepting-choice input')!.click(); await settle();
    await click("Salvar alterações");
    expect(root.querySelector(".mentoring-status")?.textContent).toContain("em pausa");
    root.querySelector<HTMLAnchorElement>(".profile-actions a")!.click(); await settle();
    expect(root.querySelectorAll("app-profile-card")).toHaveLength(0);
    expect(root.textContent).toContain("Novas mentorias em pausa");
    expect(root.textContent).toContain("Suas preferências continuam valendo");
  });
  it("preserva a descoberta pública e os salvos sem exibir porcentagens sem um perfil", async () => {
    await render("/");
    expect(root.querySelectorAll("app-profile-card")).toHaveLength(6);
    expect(root.querySelector(".compatibility-label")).toBeNull();
    root.querySelector<HTMLButtonElement>(".save-button")!.click(); await settle();
    await TestBed.inject(Router).navigateByUrl("/salvos"); await settle();
    expect(root.querySelectorAll("app-profile-card")).toHaveLength(1);
    root.querySelector<HTMLButtonElement>(".save-button")!.click(); await settle();
    expect(root.querySelectorAll("app-profile-card")).toHaveLength(0);
  });
  it("apresenta uma indicação parcial sem fabricar porcentagem", async () => {
    await render("/");
    const answers: ProfileDraft = { kind: "STARTUP", projectName: "Ideia Teste", sectors: ["DISCOVERING"], topics: ["VALIDATION"], format: "ONLINE", cityId: "", days: ["THU"], periods: ["EVENING"], accepting: true };
    TestBed.inject(ProfileSessionStore).save("Maria Teste", answers); await settle();
    expect(root.querySelectorAll(".partial-label").length).toBeGreaterThan(0);
    expect(root.querySelector(".compatibility-label")).toBeNull();
  });
});

it("cancela alterações e volta a abrir Meu perfil sem reapresentar o questionário", async () => {
  await render("/");
  const answers: ProfileDraft = { kind: "STARTUP", projectName: "Ideia Teste", sectors: ["TECH"], topics: ["VALIDATION"], format: "PRESENCIAL", cityId: "PE_RECIFE", days: ["THU"], periods: ["EVENING"], accepting: true };
  TestBed.inject(ProfileSessionStore).save("Maria Teste", answers);
  await TestBed.inject(Router).navigateByUrl("/meu-perfil"); await settle();
  expect(root.querySelector(".profile-details")?.textContent).toContain("Recife");
  await click("Editar perfil");
  await click("Educação");
  expect(TestBed.inject(ProfileSessionStore).profile()!.answers.sectors).toEqual(["TECH"]);
  await click("Cancelar");
  expect(root.querySelector("app-profile-setup")).toBeNull();
  expect(root.querySelector(".profile-details")?.textContent).toContain("Tecnologia");
  expect(document.activeElement).toBe(root.querySelector("#my-profile-title"));
  await click("Editar perfil"); await click("Educação");
  await TestBed.inject(Router).navigateByUrl("/"); await settle();
  await TestBed.inject(Router).navigateByUrl("/meu-perfil"); await settle();
  expect(root.querySelector("app-profile-setup")).toBeNull();
  expect(TestBed.inject(ProfileSessionStore).profile()!.answers).toEqual(answers);
});

it.each(["PE_OLINDA", ""])("apresenta a modalidade flexível e a cidade declarada no perfil: %s", async (cityId) => {
  await render("/");
  const answers: ProfileDraft = { kind: "MENTOR", projectName: "", sectors: ["TECH", "EDUCATION"], topics: ["VALIDATION", "PROTOTYPE"], format: "AMBOS", cityId, days: ["MON", "THU"], periods: ["MORNING", "EVENING"], accepting: true };
  TestBed.inject(ProfileSessionStore).save("Maria Teste", answers);
  await TestBed.inject(Router).navigateByUrl("/meu-perfil"); await settle();
  const details = root.querySelector(".profile-details")?.textContent;
  expect(details).toContain("Online ou presencial");
  expect(details).toContain(cityId ? "Olinda" : "A combinar para encontros presenciais");
  expect(details).toContain("Recebendo novas startups");
  expect(details).toContain("Segunda-feira");
  expect(details).toContain("Manhã");
  expect(root.querySelector("app-profile-setup")).toBeNull();
});

it("limpa o perfil pela interface e mantém acessíveis o cadastro e a explicação do produto", async () => {
  await render("/");
  const answers: ProfileDraft = { kind: "STARTUP", projectName: "Ideia Teste", sectors: ["TECH"], topics: ["VALIDATION"], format: "ONLINE", cityId: "", days: ["THU"], periods: ["EVENING"], accepting: true };
  TestBed.inject(ProfileSessionStore).save("Maria Teste", answers);
  await TestBed.inject(Router).navigateByUrl("/meu-perfil"); await settle();
  await click("Limpar perfil de teste");
  expect(root.querySelector(".no-profile")?.textContent).toContain("Seu próximo passo começa pelo seu perfil");
  expect(TestBed.inject(ProfileSessionStore).profile()).toBeNull();
  await TestBed.inject(Router).navigateByUrl("/como-funciona"); await settle();
  expect(root.textContent).toContain("monte seu perfil em quatro etapas com o Lumen");
  expect(root.querySelector('.topbar-actions a')?.textContent).toContain("Criar perfil");
});
