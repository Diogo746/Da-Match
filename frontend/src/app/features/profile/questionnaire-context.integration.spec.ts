import { Location } from "@angular/common";
import { provideLocationMocks } from "@angular/common/testing";
import { provideHttpClient, HttpErrorResponse } from "@angular/common/http";
import { TestBed } from "@angular/core/testing";
import { Router, provideRouter } from "@angular/router";
import { RouterTestingHarness } from "@angular/router/testing";
import { Subject, of } from "rxjs";
import { beforeEach, expect, it, vi } from "vitest";
import { AuthStateStore } from "../../core/auth-state.store";
import { ProfileDraft, emptyProfile } from "../../core/profile.models";
import { QuestionnaireService } from "../../core/questionnaire.service";
import { StartupService } from "../../core/startup.service";
import { QuestionnaireComponent } from "./questionnaire.component";

const answers: ProfileDraft = { ...emptyProfile("STARTUP"), moments: ["PROBLEM"], sectors: ["TECH"],
  topics: ["VALIDATION"], audiences: ["B2C"], backgrounds: ["TECH"], format: "ONLINE", cadence: "FLEXIBLE",
  availability: [{ day: "THU", period: "EVENING" }] };
const profiles = ["a", "b"].map(id => ({ id, nomeProvisorio: `Projeto ${id}`,
  membros: [{ usuarioId: "owner", papelMembro: "FUNDADOR" }] }));
let questionnaires: { load: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn> };
let startups: { mine: ReturnType<typeof vi.fn> };

beforeEach(() => {
  questionnaires = { load: vi.fn((_kind: string, id: string) => of({ ...answers, projectName: id })),
    save: vi.fn(() => of(answers)) };
  startups = { mine: vi.fn(() => of(profiles)) };
  TestBed.configureTestingModule({ providers: [provideHttpClient(), provideLocationMocks(), provideRouter([
    { path: "startup/perfil/:startupId/questionario", component: QuestionnaireComponent, data: { kind: "STARTUP" } },
  ]), { provide: StartupService, useValue: startups }, { provide: QuestionnaireService, useValue: questionnaires }] });
  TestBed.inject(AuthStateStore).setUser({ id: "owner", nome: "Pessoa Fictícia", email: "owner@example.test", tipoUsuario: "STARTUP" });
});

async function open(harness: RouterTestingHarness, id: string) {
  const component = await harness.navigateByUrl(`/startup/perfil/${id}/questionario`, QuestionnaireComponent);
  await vi.waitFor(() => expect(component.loading()).toBe(false));
  return component;
}

it("loads and saves the project in the current URL when the Router reuses the component", async () => {
  const harness = await RouterTestingHarness.create();
  TestBed.inject(Router).setUpLocationChangeListener();
  const first = await open(harness, "a"); first.edit();
  const second = await open(harness, "b");
  expect(second).toBe(first);
  expect(second.editing()).toBe(false);
  expect(second.name()).toBe("Projeto b");
  expect(second.saved()?.projectName).toBe("b");
  second.edit(); await second.save(answers);
  expect(questionnaires.save).toHaveBeenCalledWith("STARTUP", "b", answers);
  TestBed.inject(Location).back();
  await vi.waitFor(() => expect(first.name()).toBe("Projeto a"));
  TestBed.inject(Location).forward();
  await vi.waitFor(() => expect(first.name()).toBe("Projeto b"));
});

it("ignores an earlier profile lookup after the next project's lookup completes", async () => {
  const pending = new Subject<typeof profiles>();
  startups.mine.mockReturnValueOnce(pending);
  const harness = await RouterTestingHarness.create();
  const component = await harness.navigateByUrl("/startup/perfil/a/questionario", QuestionnaireComponent);
  await open(harness, "b");
  pending.next(profiles); pending.complete();
  await Promise.resolve();
  expect(component.name()).toBe("Projeto b");
  expect(questionnaires.load).not.toHaveBeenCalledWith("STARTUP", "a");
});

it.each(["response", "error"] as const)("ignores an old questionnaire %s after another project is ready", async outcome => {
  const pending = new Subject<ProfileDraft>();
  questionnaires.load.mockReturnValueOnce(pending);
  const harness = await RouterTestingHarness.create();
  const component = await harness.navigateByUrl("/startup/perfil/a/questionario", QuestionnaireComponent);
  await vi.waitFor(() => expect(questionnaires.load).toHaveBeenCalledWith("STARTUP", "a"));
  await open(harness, "b");
  if (outcome === "response") { pending.next({ ...answers, projectName: "old" }); pending.complete(); }
  else pending.error(new HttpErrorResponse({ status: 403 }));
  await Promise.resolve();
  expect(component.name()).toBe("Projeto b");
  expect(component.saved()?.projectName).toBe("b");
  expect(component.error()).toBe("");
  expect(component.ready()).toBe(true);
});

it.each(["response", "error"] as const)("waits for a pending write before loading the new context and discards its old %s", async outcome => {
  const harness = await RouterTestingHarness.create();
  const component = await open(harness, "a");
  const pending = new Subject<ProfileDraft>();
  questionnaires.save.mockReturnValueOnce(pending);
  component.edit(); const saving = component.save(answers);
  await harness.navigateByUrl("/startup/perfil/b/questionario", QuestionnaireComponent);
  expect(component.ready()).toBe(false);
  expect(component.busy()).toBe(true);
  component.edit(); await component.save(answers);
  expect(questionnaires.load).not.toHaveBeenCalledWith("STARTUP", "b");
  if (outcome === "response") { pending.next(answers); pending.complete(); }
  else pending.error(new HttpErrorResponse({ status: 500 }));
  await saving;
  await vi.waitFor(() => {
    expect(component.ready()).toBe(true);
    expect(component.loading()).toBe(false);
    expect(component.name()).toBe("Projeto b");
  });
  expect(component.message()).toBe(""); expect(component.error()).toBe("");
  expect(questionnaires.save).toHaveBeenCalledOnce();
  component.edit(); await component.save(answers);
  expect(questionnaires.save).toHaveBeenLastCalledWith("STARTUP", "b", answers);
});

it("does not keep manager permissions or an editing form when the next project is read-only", async () => {
  startups.mine.mockReturnValue(of([profiles[0], { ...profiles[1],
    membros: [{ usuarioId: "owner", papelMembro: "MEMBRO" }] }]));
  const harness = await RouterTestingHarness.create();
  const component = await open(harness, "a"); component.edit();
  await open(harness, "b"); component.edit(); await component.save(answers);
  expect(component.editing()).toBe(false); expect(component.canEdit()).toBe(false);
  expect(questionnaires.save).not.toHaveBeenCalled();
});

it("ignores a pending write after the component has been destroyed", async () => {
  const harness = await RouterTestingHarness.create();
  const component = await open(harness, "a");
  const pending = new Subject<ProfileDraft>(); questionnaires.save.mockReturnValueOnce(pending);
  component.edit(); const saving = component.save(answers);
  harness.fixture.destroy(); pending.next(answers); pending.complete(); await saving;
  expect(component.message()).toBe(""); expect(startups.mine).toHaveBeenCalledOnce();
});
