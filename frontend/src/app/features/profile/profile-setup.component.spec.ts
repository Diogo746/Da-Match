import { describe, expect, it } from "vitest";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { ProfileSetupComponent } from "./profile-setup.component";
import { ProfileDraft, emptyProfile } from "../../core/profile.models";

let fixture: ComponentFixture<ProfileSetupComponent>;
let root: HTMLElement;
async function render(kind: "STARTUP" | "MENTOR" = "STARTUP", initial: ProfileDraft | null = null, editing = false, startStep = 0) {
  await TestBed.configureTestingModule({ imports: [ProfileSetupComponent], providers: [provideZonelessChangeDetection()] })
    .compileComponents();
  fixture = TestBed.createComponent(ProfileSetupComponent);
  fixture.componentRef.setInput("kind", kind);
  fixture.componentRef.setInput("name", "Maria Teste");
  fixture.componentRef.setInput("editing", editing);
  fixture.componentRef.setInput("startStep", startStep);
  if (initial) fixture.componentRef.setInput("initial", initial);
  fixture.detectChanges();
  root = fixture.nativeElement;
}
function click(label: string) {
  const button = [...root.querySelectorAll<HTMLButtonElement>("button")].find((item) => item.textContent?.includes(label));
  expect(button, `Botão: ${label}`).toBeDefined();
  button!.click();
  fixture.detectChanges();
}
function next() { click("Continuar"); }
function selectDay(label: string) {
  root.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!.click();
  fixture.detectChanges();
}

describe("Cadastro de perfil em quatro etapas", () => {
  it("edita seções sem percorrer o cadastro e aponta uma resposta pendente antes de salvar", async () => {
    const original: ProfileDraft = { ...emptyProfile("MENTOR"), sectors: ["GENERAL"], topics: ["PITCH"], format: "PRESENCIAL", cityId: "PE_RECIFE", days: ["THU"], periods: ["EVENING"] };
    await render("MENTOR", original, true, 2);
    const completed: ProfileDraft[] = [];
    fixture.componentInstance.finished.subscribe((answers) => completed.push(answers));
    expect(fixture.componentInstance.step()).toBe(2);
    expect(root.querySelector("#profile-progress")).toBeNull();
    expect(document.activeElement).toBe(root.querySelector(".question-title"));
    click("Online"); click("Agenda"); selectDay("Quinta-feira"); click("Setor");
    click("Salvar alterações"); await Promise.resolve();
    expect(completed).toHaveLength(0);
    expect(fixture.componentInstance.step()).toBe(3);
    expect(root.querySelector('[role="alert"]')?.textContent).toContain("dia e um período");
    selectDay("Quinta-feira"); click("Salvar alterações");
    expect(completed).toHaveLength(1);
    expect(completed[0]).toMatchObject({ format: "ONLINE", cityId: "", topics: ["PITCH"] });
    expect(original.cityId).toBe("PE_RECIFE");
  });

  it("leva ao nome da ideia inválido ao salvar por outra seção de edição", async () => {
    const original: ProfileDraft = { ...emptyProfile("STARTUP"), sectors: ["TECH"], topics: ["VALIDATION"], format: "ONLINE", days: ["MON"], periods: ["EVENING"] };
    await render("STARTUP", original, true);
    const input = root.querySelector<HTMLInputElement>("#project-name")!;
    input.value = "x".repeat(61); input.dispatchEvent(new Event("input", { bubbles: true })); fixture.detectChanges();
    click("Agenda"); click("Salvar alterações"); await Promise.resolve();
    expect(fixture.componentInstance.step()).toBe(0);
    expect(root.querySelector('[role="alert"]')?.textContent).toContain("60 caracteres");
    expect(original.projectName).toBe("");
  });

  it("mostra o Lumen, informa a finalidade e exige uma resposta para avançar", async () => {
    await render();
    expect(root.querySelector("app-lumen img")?.getAttribute("src")).toBe("assets/lumen.png");
    expect(root.textContent).toContain("personalizar as indicações");
    next();
    await Promise.resolve();
    expect(root.querySelector('[role="alert"]')?.textContent).toContain("Escolha um setor");
    expect(fixture.componentInstance.step()).toBe(0);
    expect(document.activeElement).toBe(root.querySelector('[role="alert"]'));
  });
  it("conclui como startup apenas com as respostas essenciais e sem uma segunda necessidade", async () => {
    await render();
    const completed: ProfileDraft[] = [];
    fixture.componentInstance.finished.subscribe((answers) => completed.push(answers));
    expect(root.querySelector(".speech-text")?.textContent).toContain("quatro passos");
    click("Tecnologia"); next();
    expect(root.querySelector(".speech-text")?.textContent).toContain("apoio faria mais diferença");
    click("Validar a ideia"); next();
    click("Online"); next();
    selectDay("Segunda-feira"); click("Noite");
    click("Meu perfil está pronto");
    expect(completed).toHaveLength(1);
    expect(completed[0]).toMatchObject({ kind: "STARTUP", topics: ["VALIDATION"], format: "ONLINE", days: ["MON"], periods: ["EVENING"] });
    expect(root.textContent).toContain("4 de 4 etapas preenchidas");
    expect(JSON.stringify(completed[0])).not.toContain("senha");
  });
  it("preserva as respostas ao voltar e permite reordenar as prioridades", async () => {
    await render();
    click("Tecnologia"); next();
    click("Validar a ideia"); click("Preços e custos"); click("Primeiro protótipo");
    expect(root.querySelector('[role="alert"]')?.textContent).toContain("até 2");
    click("Validar a ideia");
    expect(fixture.componentInstance.draft().topics).toEqual(["PRICING"]);
    click("Primeiro protótipo");
    next(); click("Voltar");
    expect(fixture.componentInstance.draft().topics).toEqual(["PRICING", "PROTOTYPE"]);
    expect(root.querySelectorAll('.topic-choice[aria-pressed="true"]')).toHaveLength(2);
  });
  it("solicita a cidade somente quando faz sentido e mantém o limite da etapa", async () => {
    await render();
    click("Educação"); next(); next();
    expect(fixture.componentInstance.step()).toBe(1);
    click("Entender o cliente"); next(); click("Presencial"); next();
    expect(root.querySelector('[role="alert"]')?.textContent).toContain("cidade");
    const select = root.querySelector<HTMLSelectElement>("#meeting-city")!;
    select.value = "PE_RECIFE"; select.dispatchEvent(new Event("change", { bubbles: true })); fixture.detectChanges();
    click("Online");
    expect(root.querySelector("#meeting-city")).toBeNull();
    expect(fixture.componentInstance.draft().cityId).toBe("");
    next();
    click("Meu perfil está pronto");
    expect(root.querySelector('[role="alert"]')?.textContent).toContain("dia e um período");
  });
  it("trata setores e especialidades do mentor com os limites próprios", async () => {
    await render("MENTOR");
    click("Tecnologia"); click("Educação"); click("Economia criativa");
    expect(fixture.componentInstance.draft().sectors).toEqual(["TECH", "EDUCATION"]);
    click("Minha orientação serve");
    expect(fixture.componentInstance.draft().sectors).toEqual(["GENERAL"]);
    click("Tecnologia");
    expect(fixture.componentInstance.draft().sectors).toEqual(["TECH"]);
    next(); click("Validar a ideia"); click("Modelo de negócio"); click("Preços e custos"); click("Apresentar a proposta");
    expect(fixture.componentInstance.draft().topics).toHaveLength(3);
    click("Modelo de negócio"); click("Apresentar a proposta");
    next(); click("Tenho flexibilidade"); next();
    selectDay("Quinta-feira"); click("Manhã");
    const checkbox = root.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
    checkbox.click(); fixture.detectChanges();
    expect(fixture.componentInstance.draft().accepting).toBe(false);
    click("Meu perfil está pronto");
  });
  it("edita uma cópia e permite alterar dias e períodos sem modificar o perfil salvo", async () => {
    const original: ProfileDraft = { ...emptyProfile("MENTOR"), sectors: ["GENERAL"], topics: ["PITCH"], format: "ONLINE", days: ["MON"], periods: ["EVENING"] };
    await render("MENTOR", original);
    next(); next(); next();
    selectDay("Segunda-feira"); selectDay("Quarta-feira"); click("Noite"); click("Tarde");
    expect(fixture.componentInstance.draft().days).toEqual(["WED"]);
    expect(fixture.componentInstance.draft().periods).toEqual(["AFTERNOON"]);
    expect(original.days).toEqual(["MON"]);
    expect(original.periods).toEqual(["EVENING"]);
  });
  it("permite deixar o setor em descoberta e atualiza o nome na prévia", async () => {
    await render(); click("Ainda estou descobrindo");
    const input = root.querySelector<HTMLInputElement>("#project-name")!;
    input.value = "Ideia da turma"; input.dispatchEvent(new Event("input", { bubbles: true })); fixture.detectChanges();
    expect(root.querySelector("app-profile-preview h3")?.textContent).toBe("Ideia da turma");
    expect(fixture.componentInstance.draft().sectors).toEqual(["DISCOVERING"]);
    fixture.componentInstance.back();
    expect(fixture.componentInstance.step()).toBe(0);
  });
});
