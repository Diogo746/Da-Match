import { HttpErrorResponse, provideHttpClient } from "@angular/common/http";
import { TestBed } from "@angular/core/testing";
import { Router, provideRouter } from "@angular/router";
import { Subject, of, throwError } from "rxjs";
import { beforeEach, expect, it, vi } from "vitest";
import { AuthStateStore } from "../../core/auth-state.store";
import { StartupProfile } from "../../core/startup.models";
import { StartupService } from "../../core/startup.service";
import { StartupPublication } from "../../core/startup-publication.models";
import { StartupProfileComponent } from "./startup-profile.component";

const profile: StartupProfile = {
  id: "startup-test", nomeProvisorio: "Ideia Fictícia", pitchCurto: "Resumo", problemaCentral: "Problema",
  solucaoProposta: "Solução", publicoAlvo: "Público", modeloDeNegocio: "Modelo", statusValidacao: "APENAS_IDEIA",
  status: "RASCUNHO", dataCriacao: "2026-10-22T12:00:00Z", membros: [{ id: "member-test", usuarioId: "user-test",
    nomeUsuario: "Pessoa Fictícia", papelMembro: "FUNDADOR", dataEntrada: "2026-10-22" }],
};
const user = { id: "user-test", nome: "Pessoa Fictícia", email: "founder@example.test", tipoUsuario: "STARTUP" as const };
const publication: StartupPublication = { startupId: profile.id, status: "RASCUNHO", aptoParaPublicacao: true, podeGerenciar: true, pendencias: [] };
let service: { mine: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn>;
  publication: ReturnType<typeof vi.fn>; setStatus: ReturnType<typeof vi.fn> };
beforeEach(() => {
  service = { mine: vi.fn(() => of([profile])), update: vi.fn(() => of(profile)),
    publication: vi.fn((id: string) => of({ ...publication, startupId: id })),
    setStatus: vi.fn((id: string, status: string) => of({ ...publication, startupId: id, status })) };
  TestBed.configureTestingModule({ imports: [StartupProfileComponent], providers: [provideRouter([]), provideHttpClient(),
    { provide: StartupService, useValue: service }] });
  TestBed.inject(AuthStateStore).setUser(user);
  vi.spyOn(TestBed.inject(Router), "navigate").mockResolvedValue(true);
});
async function create() {
  const fixture = TestBed.createComponent(StartupProfileComponent);
  fixture.detectChanges(); await fixture.whenStable();
  await vi.waitFor(() => expect(fixture.componentInstance.loading()).toBe(false)); fixture.detectChanges();
  return { fixture, component: fixture.componentInstance };
}

it("renders the real startup read-only and supports editing, saving and cancelling", async () => {
  const { fixture, component } = await create();
  const page = fixture.nativeElement as HTMLElement;
  expect(page.textContent).toContain("Ideia Fictícia");
  expect(page.querySelector("form")).toBeNull();
  component.edit(); fixture.detectChanges();
  expect(page.querySelectorAll("textarea")).toHaveLength(5);
  component.form.controls.nomeProvisorio.setValue("Descartar");
  component.cancel();
  expect(component.profile()?.nomeProvisorio).toBe(profile.nomeProvisorio);
  component.edit();
  expect(component.form.controls.nomeProvisorio.value).toBe(profile.nomeProvisorio);
  component.form.controls.nomeProvisorio.setValue("Atualizada");
  service.update.mockReturnValue(of({ ...profile, nomeProvisorio: "Atualizada" }));
  await component.save(); fixture.detectChanges();
  expect(service.update).toHaveBeenCalledWith(profile.id, expect.objectContaining({ nomeProvisorio: "Atualizada" }));
  expect(component.profile()?.nomeProvisorio).toBe("Atualizada");
  expect(page.querySelector("output")?.textContent).toContain("salvos com sucesso");
  expect(component.editing()).toBe(false);
});

it.each(["FUNDADOR", "REPRESENTANTE", "MEMBRO"] as const)("enforces the %s editing permission", async role => {
  service.mine.mockReturnValue(of([{ ...profile, membros: [{ ...profile.membros[0], papelMembro: role }] }]));
  const { fixture, component } = await create();
  component.edit(); fixture.detectChanges();
  expect(component.editing()).toBe(role !== "MEMBRO");
  if (role === "MEMBRO") {
    expect(fixture.nativeElement.textContent).toContain("fundadores e representantes");
    await component.save(); expect(service.update).not.toHaveBeenCalled();
  }
});

it("supports multiple memberships without selecting arbitrary IDs or losing an edit", async () => {
  const second = { ...profile, id: "second", nomeProvisorio: "Segunda startup" };
  service.mine.mockReturnValue(of([profile, second]));
  const { fixture, component } = await create();
  expect(fixture.nativeElement.querySelectorAll("#startup-selection option")).toHaveLength(2);
  component.select("unknown"); expect(component.profile()?.id).toBe(profile.id);
  await component.select(second.id); expect(component.profile()?.id).toBe(second.id);
  component.edit(); component.select(profile.id); expect(component.profile()?.id).toBe(second.id);
  component.cancel(); await component.load(); expect(component.profile()?.id).toBe(second.id);
  service.mine.mockReturnValue(of([profile]));
  await component.load(); expect(component.profile()).toBeNull();
  expect(component.error()).toContain("não está disponível");
  await component.select(profile.id); expect(component.profile()?.id).toBe(profile.id);
});

it("shows a useful empty state without starting another onboarding", async () => {
  service.mine.mockReturnValue(of([]));
  const { fixture, component } = await create();
  expect(fixture.nativeElement.textContent).toContain("não possui vínculo");
  component.edit(); await component.save();
  expect(service.update).not.toHaveBeenCalled();
});

it("validates required text, maximum lengths and idea status before sending", async () => {
  const { component, fixture } = await create();
  component.edit(); component.form.controls.pitchCurto.setValue(" ");
  await component.save(); fixture.detectChanges();
  expect(component.invalid("pitchCurto")).toBe(true);
  expect(fixture.nativeElement.textContent).toContain("sem usar apenas espaços");
  component.form.controls.pitchCurto.setValue("x".repeat(256)); await component.save();
  component.form.controls.pitchCurto.setValue("Resumo");
  component.form.controls.statusValidacao.setValue("PUBLICADO" as never); await component.save(); fixture.detectChanges();
  expect(fixture.nativeElement.textContent).toContain("momento da ideia válido");
  expect(service.update).not.toHaveBeenCalled();
});

it.each([401, 403, 404, 400, 500, 0])("handles PATCH failure %s without confirming or replaying", async status => {
  const { component, fixture } = await create();
  component.edit(); service.update.mockReturnValue(throwError(() => new HttpErrorResponse({ status })));
  await component.save(); fixture.detectChanges();
  expect(service.update).toHaveBeenCalledOnce(); expect(component.message()).toBe("");
  expect(component.error()).not.toBe("");
  if (status === 401 || status === 404) expect(component.profile()).toBeNull();
  if (status === 401) expect(TestBed.inject(AuthStateStore).user()).toBeNull();
  if (status === 0 || status === 500) {
    await component.save(); component.edit(); component.select("other");
    expect(service.update).toHaveBeenCalledOnce(); expect(component.uncertain()).toBe(true);
    await component.load(); expect(component.uncertain()).toBe(false);
  }
});

it("blocks an unconfirmed write until a successful reload, including a failed reload", async () => {
  const { component } = await create(); component.edit();
  service.update.mockReturnValue(throwError(() => new Error("offline")));
  await component.save();
  service.mine.mockReturnValueOnce(throwError(() => new Error("offline")));
  await component.load(); expect(component.uncertain()).toBe(true);
  await component.save(); expect(service.update).toHaveBeenCalledOnce();
  await component.load(); expect(component.profile()).toEqual(profile); expect(component.uncertain()).toBe(false);
});

it.each([401, 403, 404, 500])("handles GET failure %s and permits a read retry", async status => {
  service.mine.mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status })));
  const { component } = await create();
  expect(component.profile()).toBeNull(); expect(component.error()).not.toBe("");
  TestBed.inject(AuthStateStore).setUser(user); await component.load(); expect(component.profile()).toEqual(profile);
});

it.each(["foreign", "duplicate"])("rejects %s profiles from a malformed private response", async variant => {
  service.mine.mockReturnValue(of(variant === "foreign"
    ? [{ ...profile, membros: [{ ...profile.membros[0], usuarioId: "someone-else" }] }] : [profile, profile]));
  const { component } = await create(); expect(component.profiles()).toEqual([]); expect(component.error()).not.toBe("");
});

it.each(["different-id", "foreign-member"])("rejects a PATCH response with %s", async variant => {
  const { component } = await create(); component.edit();
  service.update.mockReturnValue(of(variant === "different-id" ? { ...profile, id: "other" }
    : { ...profile, membros: [{ ...profile.membros[0], usuarioId: "other" }] }));
  await component.save(); expect(component.profile()).toEqual(profile);
  expect(component.uncertain()).toBe(true); expect(component.message()).toBe("");
});

it("blocks concurrent operations and never applies a response after the account changes", async () => {
  const { component } = await create(); component.edit();
  const pending = new Subject<StartupProfile>(); service.update.mockReturnValue(pending);
  const saving = component.save();
  await component.save(); await component.load(); component.select("other"); component.cancel(); component.edit();
  expect(service.update).toHaveBeenCalledOnce(); expect(service.mine).toHaveBeenCalledOnce();
  TestBed.inject(AuthStateStore).setUser({ ...user, id: "different-user" });
  pending.next(profile); pending.complete(); await saving;
  expect(component.profile()).toBeNull(); expect(component.message()).toBe("");
});

it("blocks concurrent reads and drops late reads from a previous session", async () => {
  const pending = new Subject<StartupProfile[]>(); service.mine.mockReturnValue(pending);
  const fixture = TestBed.createComponent(StartupProfileComponent); fixture.detectChanges();
  const component = fixture.componentInstance;
  await component.load(); component.select("other"); component.edit(); expect(service.mine).toHaveBeenCalledOnce();
  TestBed.inject(AuthStateStore).setUser(null); pending.next([profile]); pending.complete(); await fixture.whenStable();
  expect(component.profiles()).toEqual([]); expect(component.error()).toBe("");
});

it.each([null, { ...user, tipoUsuario: "MENTOR" as const }])("does not load for an ineligible session: case %#", async value => {
  TestBed.inject(AuthStateStore).setUser(value);
  const { component } = await create(); await component.save(); await component.load();
  expect(service.mine).not.toHaveBeenCalled();
});

it("shows server pending requirements and refreshes them after profile edits", async () => {
  const incomplete = { ...publication, aptoParaPublicacao: false,
    pendencias: [{ codigo: "QUESTIONARIO_AUSENTE", campo: "perfilMatch", mensagem: "Preencha e salve o questionário." }] };
  service.publication.mockReturnValueOnce(of(incomplete));
  const { component, fixture } = await create();
  const publish = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll("button"))
    .find(button => button.textContent?.includes("Publicar startup"))!;
  expect(publish.disabled).toBe(true);
  expect(fixture.nativeElement.textContent).toContain("Preencha e salve o questionário");
  await component.changeStatus("PUBLICADO"); expect(service.setStatus).not.toHaveBeenCalled();
  component.edit(); await component.save();
  expect(service.publication).toHaveBeenCalledTimes(2);
  expect(component.publication()?.aptoParaPublicacao).toBe(true);
  expect(component.profile()?.status).toBe("RASCUNHO");
});

it("publishes, pauses, resumes and returns to draft only after server confirmation", async () => {
  const { component, fixture } = await create();
  for (const status of ["PUBLICADO", "PAUSADO", "PUBLICADO", "RASCUNHO"] as const) {
    await component.changeStatus(status); fixture.detectChanges();
    expect(component.profile()?.status).toBe(status);
    expect(component.publication()?.status).toBe(status);
    expect(component.message()).toContain(component.publicationLabels[status]);
  }
  expect(service.setStatus).toHaveBeenCalledTimes(4);
  await component.changeStatus("RASCUNHO"); expect(service.setStatus).toHaveBeenCalledTimes(4);
  component.edit(); await component.changeStatus("PUBLICADO"); expect(service.setStatus).toHaveBeenCalledTimes(4);
  component.cancel();
});

it("members see readiness without management actions, including a revocation found by status GET", async () => {
  service.publication.mockReturnValue(of({ ...publication, podeGerenciar: false }));
  const { component, fixture } = await create();
  expect(component.publication()?.aptoParaPublicacao).toBe(true);
  expect(component.canEdit()).toBe(false);
  expect(fixture.nativeElement.querySelector(".publication-actions")).toBeNull();
  component.edit(); await component.changeStatus("PUBLICADO"); await component.save();
  expect(service.setStatus).not.toHaveBeenCalled(); expect(service.update).not.toHaveBeenCalled();
});

it("updates pending requirements on a confirmed 409 without changing the previous status", async () => {
  const { component, fixture } = await create();
  service.setStatus.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 409, error: {
    status: 409, codigo: "STARTUP_INCOMPLETA",
    pendencias: [{ codigo: "CAMPO_INVALIDO", campo: "pitchCurto", mensagem: "Revise o resumo." },
      { codigo: "CAMPO_OBRIGATORIO", campo: "statusValidacao", mensagem: "Informe o momento." }],
  } })));
  await component.changeStatus("PUBLICADO"); fixture.detectChanges();
  expect(component.publication()?.aptoParaPublicacao).toBe(false);
  expect(component.profile()?.status).toBe("RASCUNHO");
  expect(component.uncertain()).toBe(false);
  expect(fixture.nativeElement.textContent).toContain("Revise o resumo");
  expect(component.pendingLabel("statusValidacao")).toBe("Momento da ideia");
  expect(component.pendingLabel("unknown")).toBe("unknown");
  await component.changeStatus("PUBLICADO"); expect(service.setStatus).toHaveBeenCalledOnce();
});

it.each([401, 403, 404, 400, 409, 500, 0])("handles publication failure %s and blocks ambiguous writes across actions", async status => {
  const { component } = await create();
  service.setStatus.mockReturnValue(throwError(() => new HttpErrorResponse({ status, error: { unsafe: "never-display" } })));
  await component.changeStatus("PUBLICADO");
  expect(component.message()).toBe(""); expect(component.error()).not.toContain("never-display");
  expect(component.error()).not.toBe("");
  if ([0, 409, 500].includes(status)) {
    expect(component.uncertain()).toBe(true);
    component.edit(); await component.save(); await component.changeStatus("PAUSADO");
    expect(service.setStatus).toHaveBeenCalledOnce(); expect(service.update).not.toHaveBeenCalled();
    service.publication.mockReturnValueOnce(throwError(() => new Error("offline")));
    await component.load(); expect(component.uncertain()).toBe(true);
    await component.changeStatus("PAUSADO"); expect(service.setStatus).toHaveBeenCalledOnce();
    await component.load(); expect(component.uncertain()).toBe(false);
  }
  if (status === 403) expect(component.canEdit()).toBe(false);
});

it("blocks both actions while status is pending, then confirms latest GET status", async () => {
  const { component } = await create();
  const pending = new Subject<StartupPublication>(); service.setStatus.mockReturnValue(pending);
  const saving = component.changeStatus("PUBLICADO");
  await component.changeStatus("PAUSADO"); await component.save(); component.edit(); await component.select("other");
  await component.load();
  expect(service.setStatus).toHaveBeenCalledOnce(); expect(service.update).not.toHaveBeenCalled();
  expect(service.mine).toHaveBeenCalledOnce();
  pending.next({ ...publication, status: "PUBLICADO" }); pending.complete(); await saving;
  expect(component.profile()?.status).toBe("PUBLICADO");
  service.publication.mockReturnValueOnce(of({ ...publication, status: "PAUSADO" }));
  await component.load(); expect(component.profile()?.status).toBe("PAUSADO");
});

it.each(["response", "error"] as const)("ignores an earlier project's pending status %s", async outcome => {
  const second = { ...profile, id: "second" };
  service.mine.mockReturnValue(of([profile, second]));
  const { component } = await create();
  const pending = new Subject<StartupPublication>(); service.publication.mockReturnValueOnce(pending);
  const oldRead = component.select(second.id);
  await vi.waitFor(() => expect(service.publication).toHaveBeenLastCalledWith(second.id));
  await component.select(profile.id);
  if (outcome === "response") { pending.next({ ...publication, startupId: second.id, status: "PUBLICADO" }); pending.complete(); }
  else pending.error(new HttpErrorResponse({ status: 403 }));
  await oldRead;
  expect(component.profile()?.id).toBe(profile.id);
  expect(component.publication()?.startupId).toBe(profile.id);
  expect(component.error()).toBe(""); expect(component.publicationLoading()).toBe(false);
});

it.each(["response", "error"] as const)("ignores a late publication %s after logout/login of the same account", async outcome => {
  const { component } = await create();
  const pending = new Subject<StartupPublication>(); service.setStatus.mockReturnValueOnce(pending);
  const saving = component.changeStatus("PUBLICADO");
  const state = TestBed.inject(AuthStateStore); state.setUser(null); state.setUser(user);
  expect(component.profiles()).toEqual([]);
  if (outcome === "response") { pending.next({ ...publication, status: "PUBLICADO" }); pending.complete(); }
  else pending.error(new HttpErrorResponse({ status: 401 }));
  await saving;
  expect(component.message()).toBe(""); expect(component.error()).toBe("");
  expect(state.user()?.id).toBe(user.id);
  await component.load(); expect(component.profile()?.status).toBe("RASCUNHO");
});

it("distinguishes saved fields from an unavailable subsequent readiness GET", async () => {
  const { component } = await create(); component.edit();
  service.update.mockReturnValueOnce(of({ ...profile, pitchCurto: "Confirmado" }));
  service.publication.mockReturnValueOnce(throwError(() => new Error("offline")));
  await component.save();
  expect(component.profile()?.pitchCurto).toBe("Confirmado");
  expect(component.error()).toContain("Dados salvos");
  expect(component.canEdit()).toBe(false); expect(component.publication()).toBeNull();
  await component.changeStatus("PUBLICADO"); expect(service.setStatus).not.toHaveBeenCalled();
  await component.load(); expect(component.canEdit()).toBe(true);
});

it("ignores a status response after the component is destroyed", async () => {
  const { component, fixture } = await create();
  const pending = new Subject<StartupPublication>(); service.setStatus.mockReturnValueOnce(pending);
  const saving = component.changeStatus("PUBLICADO"); fixture.destroy();
  pending.next({ ...publication, status: "PUBLICADO" }); pending.complete(); await saving;
  expect(component.message()).toBe(""); expect(component.profile()?.status).toBe("RASCUNHO");
});

it("offers sign-in after the interceptor invalidates a session before the component receives 401", async () => {
  const { component, fixture } = await create();
  const pending = new Subject<StartupPublication>(); service.setStatus.mockReturnValueOnce(pending);
  const saving = component.changeStatus("PUBLICADO");
  TestBed.inject(AuthStateStore).setUser(null);
  pending.error(new HttpErrorResponse({ status: 401 })); await saving; fixture.detectChanges();
  expect(component.profile()).toBeNull();
  expect(fixture.nativeElement.querySelector('a[href="/entrar"]')?.textContent).toContain("Entrar novamente");
  expect(fixture.nativeElement.querySelector(".publication-actions")).toBeNull();
});
