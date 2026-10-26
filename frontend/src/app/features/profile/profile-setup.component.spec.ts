import { describe, expect, it } from "vitest";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { ProfileSetupComponent } from "./profile-setup.component";
import { ProfileDraft, emptyProfile } from "../../core/profile.models";
import { MotionStore } from "../../core/motion.store";

let fixture: ComponentFixture<ProfileSetupComponent>;
let root: HTMLElement;
function filled(kind: "STARTUP" | "MENTOR" = "STARTUP"): ProfileDraft {
  return { ...emptyProfile(kind), moments: ["PROBLEM"], sectors: ["TECH"], topics: ["VALIDATION"], experience: kind === "MENTOR" ? { VALIDATION: "PRACTICAL" } : {}, audiences: ["B2C"], backgrounds: ["TECH"], capacity: kind === "MENTOR" ? "FEW" : "", format: "ONLINE", cadence: "FLEXIBLE", availability: [{ day: "MON", period: "EVENING" }] };
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
// Momento e setor fecham a primeira fase; o próximo "Continuar" sai da comemoração.
function startupTopics() { click("Um problema que quero entender"); next(); click("Tecnologia"); next(); next(); }
function walkToReview() { for (let i = 0; i < 7; i++) next(); click("Revisar meu perfil"); }
function speech() { return root.querySelector(".speech-text")?.textContent ?? ""; }

describe("Perfil em seis etapas e três fases com o Lumen", () => {
  it("faz a pergunta no balão e orienta o foco quando falta uma resposta", async () => {
    await render();
    expect(root.querySelector(".speech h2")?.textContent).toContain("O que você já tem");
    expect(root.querySelector("app-lumen img")?.getAttribute("src")).toBe("assets/lumen/curious.png");
    expect(root.textContent).toContain("personalizar as indicações");
    next(); await Promise.resolve();
    expect(root.querySelector('[role="alert"]')?.textContent).toContain("momento");
    expect(document.activeElement).toBe(root.querySelector('[role="alert"]'));
  });
  it("conclui uma startup com seis etapas, três fases e revisão explícita", async () => {
    await render();
    const completed: ProfileDraft[] = [];
    fixture.componentInstance.finished.subscribe((answers) => completed.push(answers));
    startupTopics(); click("Validar a ideia"); next();
    click("Vou vender para pessoas"); click("Saúde"); next(); next();
    click("Online"); next();
    click("Podemos combinar"); aria("Segunda-feira"); click("Noite");
    click("Revisar meu perfil");
    expect(completed).toHaveLength(0);
    const review = root.querySelector(".review-list")?.textContent;
    expect(review).toContain("Principal: Validar a ideia");
    expect(review).toContain("Pessoas (B2C) · Saúde");
    expect(root.textContent).toContain("6 de 6 etapas preenchidas");
    click("Concluir meu perfil");
    expect(completed).toHaveLength(1);
    expect(completed[0]).toMatchObject({ moments: ["PROBLEM"], topics: ["VALIDATION"], audiences: ["B2C"], backgrounds: ["HEALTH"], format: "ONLINE", cadence: "FLEXIBLE", availability: [{ day: "MON", period: "EVENING" }] });
    expect(JSON.stringify(completed[0])).not.toContain("senha");
  });
  it("comemora cada fase concluída e permite voltar antes de seguir", async () => {
    await render();
    click("Um problema que quero entender"); next(); click("Tecnologia"); next();
    expect(fixture.componentInstance.celebrating()).toBe(0);
    const summary = root.querySelector(".phase-summary")?.textContent;
    expect(summary).toContain("Momento da ideia");
    expect(summary).toContain("Descoberta do problema");
    expect(summary).toContain("Tecnologia");
    expect(summary).not.toContain("Necessidades");
    expect(root.querySelector(".phase-celebration")?.textContent).not.toContain("Ideia registrada!");
    expect(root.querySelector(".speech h2")?.textContent).toBe("Ideia registrada!");
    expect(speech()).toContain("Próxima fase: Sua missão");
    expect(root.querySelector("app-lumen img")?.getAttribute("src")).toBe("assets/lumen/complete.png");
    expect(root.querySelector<HTMLElement>(".phase-track li .phase-bar i")?.style.width).toBe("100%");
    click("Voltar");
    expect(fixture.componentInstance.celebrating()).toBeNull();
    expect(fixture.componentInstance.step()).toBe(1);
    next(); click("Continuar para Sua missão");
    expect(fixture.componentInstance.step()).toBe(2);
    expect(root.querySelector(".phase-track li.current")?.textContent).toContain("Sua missão");
  });
  it("mostra a reação do Lumen depois de cada resposta, mas não durante a edição", async () => {
    await render();
    click("Um problema que quero entender");
    expect(speech()).toBe("Toda grande startup começou exatamente aí.");
    next(); click("Ainda estou descobrindo");
    expect(speech()).toContain("Um mentor pode te ajudar");
    TestBed.resetTestingModule();
    await render("STARTUP", filled(), true, 0);
    expect(speech()).toBe("Escolha o que melhor descreve seu ponto de partida.");
  });
  it("busca áreas sem diferenciar acentos e avisa quando nada é encontrado", async () => {
    await render("STARTUP", filled(), true, 1);
    const search = root.querySelector<HTMLInputElement>("#sector-search")!;
    search.value = "agronegocio"; search.dispatchEvent(new Event("input", { bubbles: true })); fixture.detectChanges();
    expect([...root.querySelectorAll(".sector-grid .choice")].map((item) => item.textContent?.trim())).toEqual(["Agronegócio"]);
    search.value = "xyz"; search.dispatchEvent(new Event("input", { bubbles: true })); fixture.detectChanges();
    expect(root.querySelector(".sector-grid")?.textContent).toContain("Nenhuma área encontrada");
  });
  it("aceita até duas áreas para a startup", async () => {
    await render("STARTUP", filled(), true, 1);
    click("Agronegócio"); click("Pets");
    expect(fixture.componentInstance.draft().sectors).toEqual(["TECH", "AGRO"]);
    expect(root.querySelector('[role="alert"]')?.textContent).toContain("até 2");
    click("Ainda estou descobrindo");
    expect(fixture.componentInstance.draft().sectors).toEqual(["DISCOVERING"]);
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
    click("Descoberta do problema"); next(); click("Tecnologia"); next(); next();
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
    click("Tecnologia"); click("Educação"); click("Economia criativa"); click("Comércio e serviços"); click("Agronegócio"); click("Pets");
    expect(fixture.componentInstance.draft().sectors).toEqual(["TECH", "EDUCATION", "CREATIVE", "COMMERCE", "AGRO"]);
    expect(root.querySelector('[role="alert"]')?.textContent).toContain("até 5");
    click("Minha orientação serve");
    expect(fixture.componentInstance.draft().sectors).toEqual(["GENERAL"]);
    click("Tecnologia"); click("Educação"); click("Educação");
    expect(fixture.componentInstance.draft().sectors).toEqual(["TECH"]);
  });
  it("limita as especialidades do mentor sem apagar escolhas anteriores", async () => {
    await render("MENTOR", filled("MENTOR"), true, 2);
    click("Modelo de negócio"); click("Preços e custos"); click("Apresentar a proposta"); click("Primeiro protótipo"); click("Primeiros clientes"); click("Sócios e time");
    expect(fixture.componentInstance.draft().topics).toHaveLength(6);
    expect(root.querySelector('[role="alert"]')?.textContent).toContain("até 6");
  });
  it("pergunta público e áreas da equipe à startup, com 'Ainda não sei' como resposta exclusiva", async () => {
    await render("STARTUP", { ...filled(), audiences: [], backgrounds: [] }, true, 3);
    expect(root.textContent).toContain("Quais áreas o seu time já domina para tocar essa ideia?");
    expect(root.textContent).toContain("Ainda estou estudando");
    expect(root.textContent).not.toContain("Quantas startups");
    click("Vou vender para pessoas"); click("Vou vender para empresas"); click("Vou vender para o governo");
    expect(fixture.componentInstance.draft().audiences).toEqual(["B2C", "B2B"]);
    expect(root.querySelector('[role="alert"]')?.textContent).toContain("até 2");
    click("Ainda não sei");
    expect(fixture.componentInstance.draft().audiences).toEqual(["UNKNOWN"]);
    click("Vou vender para pessoas");
    expect(fixture.componentInstance.draft().audiences).toEqual(["B2C"]);
    click("Ainda estou estudando");
    click("Direito"); click("Agro"); click("Outra área");
    expect(fixture.componentInstance.draft().backgrounds).toEqual(["STUDENT", "LAW", "AGRO"]);
    expect(root.querySelector('[role="alert"]')?.textContent).toContain("até 3 áreas");
  });
  it("pergunta ao mentor quantas startups ele topa acompanhar", async () => {
    await render("MENTOR", { ...filled("MENTOR"), capacity: "" }, true, 3);
    expect(root.textContent).not.toContain("Ainda não sei");
    expect(root.textContent).not.toContain("Ainda estou estudando");
    expect(root.textContent).toContain("Qual é a sua área de formação ou experiência?");
    click("Salvar alterações"); await Promise.resolve();
    expect(root.querySelector('[role="alert"]')?.textContent).toContain("quantas startups");
    click("4 ou mais");
    expect(fixture.componentInstance.draft().capacity).toBe("MANY");
  });
  it("guarda somente os pares de dia e período selecionados e permite removê-los", async () => {
    await render("STARTUP", filled(), true, 5);
    expect(root.querySelector("output.selection-note")?.textContent).toContain("1 janela adicionada");
    aria("Quinta-feira"); click("Tarde");
    expect(fixture.componentInstance.draft().availability).toEqual([{ day: "MON", period: "EVENING" }, { day: "THU", period: "AFTERNOON" }]);
    expect(root.querySelector("output.selection-note")?.textContent).toContain("2 janelas adicionadas");
    expect(fixture.componentInstance.slotSelected("MON", "AFTERNOON")).toBe(false);
    aria("Remover Segunda-feira · Noite");
    expect(fixture.componentInstance.draft().availability).toEqual([{ day: "THU", period: "AFTERNOON" }]);
    expect(root.querySelector("output.selection-note")?.textContent).toContain("1 janela adicionada");
  });
  it("solicita cidade no presencial e informa a alternativa online quando a modalidade é flexível", async () => {
    await render("STARTUP", filled(), true, 4);
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
    await render("MENTOR",original,true,4);
    const completed:ProfileDraft[]=[];
    fixture.componentInstance.finished.subscribe((answers)=>completed.push(answers));
    click("Agenda"); click("Noite"); click("Setor"); click("Salvar alterações"); await Promise.resolve();
    expect(completed).toHaveLength(0);
    expect(fixture.componentInstance.step()).toBe(5);
    expect(root.querySelector('[role="alert"]')?.textContent).toContain("combinação");
    click("Noite"); click("Salvar alterações");
    expect(completed).toHaveLength(1);
    expect(original.availability).toEqual([{day:"MON",period:"EVENING"}]);
    expect(root.querySelector("#profile-progress")).toBeNull();
  });
  it("completa campos novos vazios ao editar um perfil salvo antes das perguntas novas", async () => {
    const legacy = { ...filled() } as Partial<ProfileDraft>;
    delete legacy.audiences; delete legacy.backgrounds; delete legacy.capacity;
    await render("STARTUP", legacy as ProfileDraft, true, 0);
    expect(fixture.componentInstance.draft()).toMatchObject({ audiences: [], backgrounds: [], capacity: "" });
    click("Salvar alterações"); await Promise.resolve();
    expect(fixture.componentInstance.step()).toBe(3);
  });
  it("volta direto à revisão depois de ajustar uma resposta", async () => {
    await render("STARTUP",filled());
    walkToReview(); aria("Rever Setor e apresentação"); click("Educação"); next();
    expect(root.querySelector(".review-list")?.textContent).toContain("Educação");
    expect(fixture.componentInstance.reviewing()).toBe(true);
  });
  it("mostra a prioridade e a necessidade secundária na revisão da startup", async () => {
    await render("STARTUP", { ...filled(), topics: ["PRICING", "VALIDATION"] });
    walkToReview();
    expect(root.querySelector(".review-list")?.textContent).toContain("Principal: Preços e custos · Também busca: Validar a ideia");
  });
  it("distingue experiência prática e conhecimento na revisão do mentor", async () => {
    await render("MENTOR", { ...filled("MENTOR"), topics: ["VALIDATION", "BUSINESS"], experience: { VALIDATION: "PRACTICAL", BUSINESS: "KNOWLEDGE" } });
    walkToReview();
    const review = root.querySelector(".review-list")?.textContent;
    expect(review).toContain("Validar a ideia (experiência prática)");
    expect(review).toContain("Modelo de negócio (conhecimento para orientar)");
    expect(review).toContain("2 a 3 startups");
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
  it("respeita a pausa de movimento nas reações e na comemoração e permite cancelar a edição", async () => {
    await render("MENTOR",filled("MENTOR"),true,5);
    TestBed.inject(MotionStore).paused.set(true); fixture.detectChanges(); click("Semanal");
    expect(fixture.componentInstance.pose()).toBe("thinking");
    let cancelled=false; fixture.componentInstance.cancelled.subscribe(()=>cancelled=true);
    click("Cancelar"); expect(cancelled).toBe(true);
    root.querySelector<HTMLInputElement>(".accepting-choice input")!.click(); fixture.detectChanges();
    expect(fixture.componentInstance.draft().accepting).toBe(false);
    TestBed.resetTestingModule();
    await render("STARTUP", filled());
    TestBed.inject(MotionStore).paused.set(true); fixture.detectChanges();
    next(); next();
    expect(root.querySelector(".phase-celebration")).not.toBeNull();
    expect(root.querySelector(".confetti")).toBeNull();
  });
});
