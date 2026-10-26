import { HttpErrorResponse, provideHttpClient } from "@angular/common/http";
import { TestBed } from "@angular/core/testing";
import { ActivatedRoute, convertToParamMap, provideRouter } from "@angular/router";
import { Subject, of, throwError } from "rxjs";
import { beforeEach, expect, it, vi } from "vitest";
import { AuthStateStore } from "../../core/auth-state.store";
import { MentorService } from "../../core/mentor.service";
import { StartupService } from "../../core/startup.service";
import { QuestionnaireService } from "../../core/questionnaire.service";
import { ProfileDraft, ProfileKind, emptyProfile } from "../../core/profile.models";
import { QuestionnaireComponent } from "./questionnaire.component";

const startup = { id: "project-test", nomeProvisorio: "Projeto fictício", membros: [
  { usuarioId: "user-test", papelMembro: "FUNDADOR" },
] };
const mentor = { id: "mentor-test", usuarioId: "user-test", nome: "Pessoa Mentora",
  disponibilidades: [{ diaSemana: 7, periodo: "NOITE" }] };
const answers: ProfileDraft = { ...emptyProfile("STARTUP"), moments: ["PROBLEM"], sectors: ["TECH"],
  topics: ["VALIDATION"], audiences: ["B2C"], backgrounds: ["TECH"], format: "ONLINE", cadence: "FLEXIBLE",
  availability: [{ day: "THU", period: "EVENING" }] };
let service: { load: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn> };
let startups: { mine: ReturnType<typeof vi.fn> };
let mentors: { me: ReturnType<typeof vi.fn> };
beforeEach(() => {
  service = { load: vi.fn(() => of(null)), save: vi.fn(() => of(answers)) };
  startups = { mine: vi.fn(() => of([startup])) }; mentors = { me: vi.fn(() => of(mentor)) };
});
async function create(kind: ProfileKind = "STARTUP") {
  TestBed.configureTestingModule({ imports: [QuestionnaireComponent], providers: [provideRouter([]), provideHttpClient(),
    { provide: QuestionnaireService, useValue: service }, { provide: MentorService, useValue: mentors },
    { provide: StartupService, useValue: startups },
    { provide: ActivatedRoute, useValue: { snapshot: { data: { kind }, paramMap: convertToParamMap({ startupId: startup.id }) } } },
  ] });
  TestBed.inject(AuthStateStore).setUser({ id: "user-test", nome: "Pessoa Fictícia", email: "person@example.test", tipoUsuario: kind });
  const fixture = TestBed.createComponent(QuestionnaireComponent);
  fixture.detectChanges(); await fixture.whenStable();
  await vi.waitFor(() => expect(fixture.componentInstance.loading()).toBe(false));
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance, state: TestBed.inject(AuthStateStore) };
}

it("fills, saves, reloads and cancels the questionnaire of the selected session project", async () => {
  const { fixture, component } = await create();
  expect(service.load).toHaveBeenCalledWith("STARTUP", startup.id);
  expect(fixture.nativeElement.textContent).toContain("ainda não tem questionário");
  component.edit(); fixture.detectChanges();
  expect(fixture.nativeElement.querySelector("app-profile-setup")).not.toBeNull();
  await component.save(answers); fixture.detectChanges();
  expect(component.message()).toContain("Questionário salvo");
  expect(fixture.nativeElement.textContent).toContain("Validar a ideia");
  service.load.mockReturnValue(of(answers));
  await component.load();
  expect(component.saved()).toEqual(answers);
  component.edit(); component.cancel(); expect(component.editing()).toBe(false);
});

it("uses the mentor session profile and seeds its real availability", async () => {
  const { component } = await create("MENTOR");
  expect(service.load).toHaveBeenCalledWith("MENTOR", mentor.id);
  expect(component.initial().availability).toEqual([{ day: "SUN", period: "EVENING" }]);
  expect(startups.mine).not.toHaveBeenCalled();
});

it("shows mentor experience, intake and declared capacity from the server", async () => {
  const saved = { ...answers, kind: "MENTOR", capacity: "FEW", topics: ["VALIDATION", "CUSTOMERS"],
    experience: { VALIDATION: "PRACTICAL", CUSTOMERS: "KNOWLEDGE" }, accepting: false } as ProfileDraft;
  service.load.mockReturnValue(of(saved));
  const { fixture } = await create("MENTOR");
  expect(fixture.nativeElement.textContent).toContain("experiência prática");
  expect(fixture.nativeElement.textContent).toContain("conhecimento");
  expect(fixture.nativeElement.textContent).toContain("Pausadas");
  expect(fixture.nativeElement.textContent).toContain("2 a 3");
});

it("allows members to consult answers while preventing writes", async () => {
  startups.mine.mockReturnValue(of([{ ...startup, membros: [{ usuarioId: "user-test", papelMembro: "MEMBRO" }] }]));
  service.load.mockReturnValue(of(answers));
  const { component, fixture } = await create();
  component.edit(); await component.save(answers);
  expect(component.editing()).toBe(false); expect(service.save).not.toHaveBeenCalled();
  expect(fixture.nativeElement.textContent).toContain("Somente fundadores");
});

it("accepts representatives of the selected project and never selects a different project", async () => {
  startups.mine.mockReturnValue(of([{ ...startup, id: "other-project" },
    { ...startup, membros: [{ usuarioId: "user-test", papelMembro: "REPRESENTANTE" }] }]));
  const { component } = await create(); component.edit(); await component.save(answers);
  expect(service.save).toHaveBeenCalledWith("STARTUP", startup.id, answers);
});

it.each([{ records: [] }, { records: [{ ...startup, membros: [] }] }])("rejects missing projects or memberships %#", async ({ records }) => {
  startups.mine.mockReturnValue(of(records));
  const { component } = await create();
  expect(component.ready()).toBe(false); expect(service.load).not.toHaveBeenCalled();
});

it("rejects a mentor profile belonging to another person", async () => {
  mentors.me.mockReturnValue(of({ ...mentor, usuarioId: "other-user" }));
  const { component } = await create("MENTOR");
  expect(component.ready()).toBe(false); expect(service.load).not.toHaveBeenCalled();
});

it.each([400, 401, 403, 404, 500, 0])("handles write error %s and never replays", async status => {
  const { component } = await create(); component.edit();
  service.save.mockReturnValue(throwError(() => new HttpErrorResponse({ status })));
  await component.save(answers);
  expect(component.message()).toBe(""); expect(component.error()).not.toBe("");
  expect(component.uncertain()).toBe(status === 500 || status === 0);
  if (status >= 500 || status === 0) {
    component.edit(); await component.save(answers); expect(service.save).toHaveBeenCalledTimes(1);
    await component.load(); expect(component.uncertain()).toBe(false);
  }
});

it("clears stored answers when the account changes", async () => {
  service.load.mockReturnValue(of(answers));
  const { component, state, fixture } = await create();
  state.setUser(null); fixture.detectChanges();
  expect(component.saved()).toBeNull(); expect(component.name()).toBe(""); expect(component.ready()).toBe(false);
});

it("ignores a late write response after switching accounts", async () => {
  const { component, state } = await create();
  const pending = new Subject<ProfileDraft>(); service.save.mockReturnValue(pending);
  component.edit(); const saving = component.save(answers);
  await component.save(answers); component.cancel(); await component.load();
  expect(service.save).toHaveBeenCalledTimes(1); expect(component.editing()).toBe(true);
  state.setUser(null); pending.next(answers); pending.complete(); await saving;
  expect(component.saved()).toBeNull(); expect(component.ready()).toBe(false);
});

it("ignores a late questionnaire response after switching accounts", async () => {
  const { component, state } = await create();
  const pending = new Subject<ProfileDraft>(); service.load.mockReturnValue(pending);
  const loading = component.load(); await Promise.resolve();
  state.setUser(null); pending.next(answers); pending.complete(); await loading;
  expect(component.saved()).toBeNull(); expect(component.ready()).toBe(false);
});

it("ignores late startup and mentor identity responses after logout", async () => {
  const { component, state } = await create();
  const pending = new Subject<typeof startup[]>(); startups.mine.mockReturnValue(pending);
  const loading = component.load(); state.setUser(null); pending.next([startup]); pending.complete(); await loading;
  expect(component.saved()).toBeNull(); expect(component.name()).toBe("");
});
