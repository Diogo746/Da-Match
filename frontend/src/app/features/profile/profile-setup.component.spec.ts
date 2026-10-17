import { describe, expect, it } from "vitest";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { ProfileSetupComponent } from "./profile-setup.component";
import { ProfileDraft, emptyProfile } from "../../core/profile.models";
import { MotionStore } from "../../core/motion.store";

let fixture: ComponentFixture<ProfileSetupComponent>;
let root: HTMLElement;
function filled(kind: "STARTUP" | "MENTOR" = "STARTUP"): ProfileDraft {
  return { ...emptyProfile(kind), moments: ["PROBLEM"], sectors: ["TECH"], topics: ["VALIDATION"], experience: kind === "MENTOR" ? { VALIDATION: "PRACTICAL" } : {}, format: "ONLINE", cadence: "FLEXIBLE", availability: [{ day: "MON", period: "EVENING" }] };
}
async function render(kind: "STARTUP" | "MENTOR" = "STARTUP", initial: ProfileDraft | null = null, editing = false, startStep = 0) {
  await TestBed.configureTestingModule({ imports: [ProfileSetupComponent], providers: [provideZonelessChangeDetection()] }).compileComponents();
  fixture = TestBed.createComponent(ProfileSetupComponent);
  fixture.componentRef.setInput("kind", kind);
  fixture.componentRef.setInput("name", "Maria Teste");
  fixture.componentRef.setInput("editing", editing);
  fixture.componentRef.setInput("startStep", startStep);
  if (initial) fixture.componentRef.setInput("initial", initial);
  fixture.detectChanges(); root = fixture.nativeElement;
}
function click(label: string) {
  const button = [...root.querySelectorAll<HTMLButtonElement>("button")].find((item) => item.textContent?.includes(label));
  expect(button, "Botão: " + label).toBeDefined(); button!.click(); fixture.detectChanges();
}
function aria(label: string) { root.querySelector<HTMLButtonElement>('button[aria-label="' + label + '"]')!.click(); fixture.detectChanges(); }
function next() { click("Continuar"); }
function startupTopics() { click("Um problema que quero entender"); next(); click("Tecnologia"); next(); }

describe("Perfil em cinco etapas com o Lumen", () => {
  it("faz a pergunta no balão e orienta o foco quando falta uma resposta", async () => {
    await render();
    expect(root.querySelector(".speech h2")?.textContent).toContain("O que você já tem");
    expect(root.querySelector("app-lumen img")?.getAttribute("src")).toBe("assets/lumen/curious.png");
    expect(root.textContent).toContain("personalizar as indicações");
    next(); await Promise.resolve();
    expect(root.querySelector('[role="alert"]')?.textContent).toContain("momento");
    expect(document.activeElement).toBe(root.querySelector('[role="alert"]'));
  });
  it("conclui uma startup com cinco etapas e revisão explícita, sem exigir uma segunda necessidade", async () => {
    await render();
    const completed: ProfileDraft[] = [];
    fixture.componentInstance.finished.subscribe((answers) => completed.push(answers));
    startupTopics(); click("Validar a ideia"); next(); click("Online"); next();
    click("Podemos combinar"); aria("Segunda-feira"); click("Noite");
    click("Revisar meu perfil");
    expect(completed).toHaveLength(0);
    expect(root.querySelector(".review-list")?.textContent).toContain("Principal: Validar a ideia");
    expect(root.textContent).toContain("5 de 5 etapas preenchidas");
    click("Concluir meu perfil");
    expect(completed).toHaveLength(1);
    expect(completed[0]).toMatchObject({ moments: ["PROBLEM"], topics: ["VALIDATION"], format: "ONLINE", cadence: "FLEXIBLE", availability: [{ day: "MON", period: "EVENING" }] });
    expect(JSON.stringify(completed[0])).not.toContain("senha");
  });
  it("mantém o rascunho ao voltar e permite trocar a prioridade sem refazer as escolhas", async () => {
    await render(); startupTopics();
    click("Validar a ideia"); click("Preços e custos"); click("Primeiro protótipo");
    expect(root.querySelector('[role="alert"]')?.textContent).toContain("até 2");
    click("Tornar prioridade");
    expect(fixture.componentInstance.draft().topics).toEqual(["PRICING", "VALIDATION"]);
    next(); click("Voltar");
    expect(root.querySelectorAll('.topic-choice[aria-pressed="true"]')).toHaveLength(2);
    click("Validar a ideia");
    expect(fixture.componentInstance.draft().topics).toEqual(["PRICING"]);
  });
  it("exige que o mentor identifique sua experiência em cada especialidade escolhida", async () => {
    await render("MENTOR");
    click("Descoberta do problema"); next(); click("Tecnologia"); next();
    click("Validar a ideia"); click("Modelo de negócio"); next();
    expect(fixture.componentInstance.step()).toBe(2);
    expect(root.querySelector('[role="alert"]')?.textContent).toContain("tipo de experiência");
    aria("Experiência prática em Validar a ideia"); aria("Conhecimento para orientar em Modelo de negócio");
    next();
    expect(fixture.componentInstance.step()).toBe(3);
    expect(fixture.componentInstance.draft().experience).toEqual({ VALIDATION: "PRACTICAL", BUSINESS: "KNOWLEDGE" });
    click("Voltar"); click("Modelo de negócio");
    expect(fixture.componentInstance.draft().experience).toEqual({ VALIDATION: "PRACTICAL" });
  });
  it("limita os setores do mentor e mantém a atuação geral como escolha exclusiva", async () => {
    await render("MENTOR"); click("Descoberta do problema"); click("Primeiras validações"); next();
    click("Tecnologia"); click("Educação"); click("Economia criativa"); click("Comércio e serviços");
    expect(fixture.componentInstance.draft().sectors).toEqual(["TECH", "EDUCATION", "CREATIVE"]);
    expect(root.querySelector('[role="alert"]')?.textContent).toContain("até três");
    click("Minha orientação serve");
    expect(fixture.componentInstance.draft().sectors).toEqual(["GENERAL"]);
    click("Tecnologia"); click("Educação"); click("Educação");
    expect(fixture.componentInstance.draft().sectors).toEqual(["TECH"]);
  });
  it("limita as especialidades do mentor sem apagar escolhas anteriores", async () => {
    await render("MENTOR", filled("MENTOR"), true, 2);
    click("Modelo de negócio"); click("Preços e custos"); click("Apresentar a proposta");
    expect(fixture.componentInstance.draft().topics).toHaveLength(3);
    expect(root.querySelector('[role="alert"]')?.textContent).toContain("até 3");
  });
  it("guarda somente os pares de dia e período selecionados e permite removê-los", async () => {
    await render("STARTUP", filled(), true, 4);
    aria("Quinta-feira"); click("Tarde");
    expect(fixture.componentInstance.draft().availability).toEqual([{ day: "MON", period: "EVENING" }, { day: "THU", period: "AFTERNOON" }]);
    expect(fixture.componentInstance.slotSelected("MON", "AFTERNOON")).toBe(false);
    aria("Remover Segunda-feira · Noite");
    expect(fixture.componentInstance.draft().availability).toEqual([{ day: "THU", period: "AFTERNOON" }]);
    expect(root.querySelector(".selection-note")?.textContent).toContain("1 janela");
  });
  it("solicita cidade no presencial e informa a alternativa online quando a modalidade é flexível", async () => {
    await render("STARTUP", filled(), true, 3);
    click("Presencial"); click("Salvar alterações"); await Promise.resolve();
    expect(root.querySelector('[role="alert"]')?.textContent).toContain("cidade");
    const select=root.querySelector<HTMLSelectElement>("#meeting-city")!;
    select.value="PE_RECIFE"; select.dispatchEvent(new Event("change",{bubbles:true})); fixture.detectChanges();
    click("Tenho flexibilidade");
    expect(root.querySelector("#city-hint")?.textContent).toContain("Sem uma cidade");
    click("Online");
    expect(root.querySelector("#meeting-city")).toBeNull();
    expect(fixture.componentInstance.draft().cityId).toBe("");
  });
  it("edita uma cópia, encontra uma agenda incompleta e preserva o perfil original", async () => {
    const original=filled("MENTOR");
    await render("MENTOR",original,true,3);
    const completed:ProfileDraft[]=[];
    fixture.componentInstance.finished.subscribe((answers)=>completed.push(answers));
    click("Agenda"); click("Noite"); click("Setor"); click("Salvar alterações"); await Promise.resolve();
    expect(completed).toHaveLength(0);
    expect(fixture.componentInstance.step()).toBe(4);
    expect(root.querySelector('[role="alert"]')?.textContent).toContain("combinação");
    click("Noite"); click("Salvar alterações");
    expect(completed).toHaveLength(1);
    expect(original.availability).toEqual([{day:"MON",period:"EVENING"}]);
    expect(root.querySelector("#profile-progress")).toBeNull();
  });
  it("volta direto à revisão depois de ajustar uma resposta", async () => {
    await render("STARTUP",filled());
    for(let i=0;i<4;i++)next();
    click("Revisar meu perfil"); aria("Rever Setor e apresentação"); click("Educação"); next();
    expect(root.querySelector(".review-list")?.textContent).toContain("Educação");
    expect(fixture.componentInstance.reviewing()).toBe(true);
  });
  it("leva ao nome inválido mesmo quando a edição foi salva a partir de outra seção", async () => {
    await render("STARTUP",filled(),true,1);
    const input=root.querySelector<HTMLInputElement>("#project-name")!;
    input.value="x".repeat(61); input.dispatchEvent(new Event("input",{bubbles:true})); fixture.detectChanges();
    click("Agenda"); click("Salvar alterações"); await Promise.resolve();
    expect(fixture.componentInstance.step()).toBe(1);
    expect(root.querySelector('[role="alert"]')?.textContent).toContain("60 caracteres");
  });
  it("permite setor em descoberta e atualiza o nome da ideia na prévia", async () => {
    await render("STARTUP",filled(),true,1); click("Ainda estou descobrindo");
    const input=root.querySelector<HTMLInputElement>("#project-name")!;
    input.value="Ideia da turma"; input.dispatchEvent(new Event("input",{bubbles:true})); fixture.detectChanges();
    expect(root.querySelector("app-profile-preview h3")?.textContent).toBe("Ideia da turma");
    expect(fixture.componentInstance.draft().sectors).toEqual(["DISCOVERING"]);
  });
  it("respeita a pausa de movimento nas reações e permite cancelar a edição", async () => {
    await render("MENTOR",filled("MENTOR"),true,4);
    TestBed.inject(MotionStore).paused.set(true); fixture.detectChanges(); click("Semanal");
    expect(fixture.componentInstance.pose()).toBe("thinking");
    let cancelled=false; fixture.componentInstance.cancelled.subscribe(()=>cancelled=true);
    click("Cancelar"); expect(cancelled).toBe(true);
    root.querySelector<HTMLInputElement>(".accepting-choice input")!.click(); fixture.detectChanges();
    expect(fixture.componentInstance.draft().accepting).toBe(false);
  });
});

