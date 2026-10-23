import { HttpErrorResponse, provideHttpClient } from "@angular/common/http";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { Subject, of, throwError } from "rxjs";
import { beforeEach, expect, it, vi } from "vitest";
import { AuthStateStore } from "../../core/auth-state.store";
import { StartupProfile } from "../../core/startup.models";
import { StartupService } from "../../core/startup.service";
import { StartupProfileComponent } from "./startup-profile.component";

const profile: StartupProfile = {
  id: "startup-test", nomeProvisorio: "Ideia Fictícia", pitchCurto: "Resumo", problemaCentral: "Problema",
  solucaoProposta: "Solução", publicoAlvo: "Público", modeloDeNegocio: "Modelo", statusValidacao: "APENAS_IDEIA",
  dataCriacao: "2026-10-22T12:00:00Z", membros: [{ id: "member-test", usuarioId: "user-test",
    nomeUsuario: "Pessoa Fictícia", papelMembro: "FUNDADOR", dataEntrada: "2026-10-22" }],
};
const user = { id: "user-test", nome: "Pessoa Fictícia", email: "founder@example.test", tipoUsuario: "STARTUP" as const };
let service: { mine: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
beforeEach(() => {
  service = { mine: vi.fn(() => of([profile])), update: vi.fn(() => of(profile)) };
  TestBed.configureTestingModule({ imports: [StartupProfileComponent], providers: [provideRouter([]), provideHttpClient(),
    { provide: StartupService, useValue: service }] });
  TestBed.inject(AuthStateStore).setUser(user);
});
async function create() {
  const fixture = TestBed.createComponent(StartupProfileComponent);
  fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();
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
  component.select(second.id); expect(component.profile()?.id).toBe(second.id);
  component.edit(); component.select(profile.id); expect(component.profile()?.id).toBe(second.id);
  component.cancel(); await component.load(); expect(component.profile()?.id).toBe(second.id);
  service.mine.mockReturnValue(of([profile]));
  await component.load(); expect(component.profile()?.id).toBe(profile.id);
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
  expect(component.profiles()).toEqual([]); expect(component.error()).not.toBe("");
});

it.each([null, { ...user, tipoUsuario: "MENTOR" as const }])("does not load for an ineligible session: case %#", async value => {
  TestBed.inject(AuthStateStore).setUser(value);
  const { component } = await create(); await component.save(); await component.load();
  expect(service.mine).not.toHaveBeenCalled();
});
