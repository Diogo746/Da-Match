import { HttpErrorResponse, provideHttpClient } from "@angular/common/http";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { Subject, TimeoutError, of, throwError } from "rxjs";
import { beforeEach, expect, it, vi } from "vitest";
import { AuthStateStore } from "../../core/auth-state.store";
import { MentorProfile } from "../../core/mentor.models";
import { MentorService } from "../../core/mentor.service";
import { MentorProfileComponent } from "./mentor-profile.component";

const profile: MentorProfile = {
  id: "mentor-test", usuarioId: "user-test", nome: "Mentora Fictícia", email: "mentor@example.test",
  biografia: "Experiência com produtos.", linkedin: null, instagram: null, site: null,
  status: "RASCUNHO", disponibilidades: [{ diaSemana: 1, periodo: "MANHA" }], dataEntradaPlataforma: "2026-10-21",
};
let service: { me: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn>; setStatus: ReturnType<typeof vi.fn> };
beforeEach(() => {
  service = { me: vi.fn(() => of(profile)), update: vi.fn(() => of(profile)), setStatus: vi.fn(() => of({ ...profile, status: "PUBLICADO" })) };
  TestBed.configureTestingModule({ imports: [MentorProfileComponent], providers: [
    provideRouter([]), provideHttpClient(), { provide: MentorService, useValue: service },
  ] });
  TestBed.inject(AuthStateStore).setUser({ id: profile.usuarioId, nome: profile.nome, email: profile.email, tipoUsuario: "MENTOR" });
});

async function create() {
  const fixture = TestBed.createComponent(MentorProfileComponent);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance };
}

it("loads the private profile, renders a weekly schedule and saves only editable fields", async () => {
  const { fixture, component } = await create();
  expect(fixture.nativeElement.textContent).toContain("Rascunho");
  expect(fixture.nativeElement.querySelectorAll('input[type="checkbox"]')).toHaveLength(21);
  component.form.controls.biografia.setValue(" Atualizada ");
  const checkbox = fixture.nativeElement.querySelector('input[aria-label="Terça-feira, Tarde"]') as HTMLInputElement;
  checkbox.click();
  await component.save();
  expect(service.update).toHaveBeenCalledWith(profile.id, {
    biografia: "Atualizada", linkedin: "", instagram: "", site: "",
    disponibilidades: [...profile.disponibilidades, { diaSemana: 2, periodo: "TARDE" }],
  });
  expect(component.message()).toContain("salvo");
});

it("supports publication and pause while preserving the server-confirmed state", async () => {
  const { component } = await create();
  await component.changeStatus("RASCUNHO");
  expect(service.setStatus).not.toHaveBeenCalled();
  await component.changeStatus("PUBLICADO");
  expect(component.profile()?.status).toBe("PUBLICADO");
  expect(component.message()).toContain("Publicado");
  service.setStatus.mockReturnValue(of({ ...profile, status: "PAUSADO" }));
  await component.changeStatus("PAUSADO");
  expect(component.profile()?.status).toBe("PAUSADO");
});

it("requires saving edits before changing publication", async () => {
  const { component } = await create();
  component.form.markAsDirty();
  await component.changeStatus("PUBLICADO");
  expect(service.setStatus).not.toHaveBeenCalled();
  expect(component.error()).toContain("Salve");
});

it("rejects invalid fields and an empty schedule before sending a write", async () => {
  const { component } = await create();
  component.availability.set([]);
  await component.save();
  component.availability.set(profile.disponibilidades);
  component.form.controls.biografia.setValue("  ");
  await component.save();
  expect(service.update).not.toHaveBeenCalled();
  expect(component.error()).toContain("Revise");
});

it.each([401, 403, 404, 400, 500, 0])("handles write failure %s without replaying or confirming it", async status => {
  const { component, fixture } = await create();
  service.update.mockReturnValue(throwError(() => new HttpErrorResponse({ status })));
  await component.save();
  fixture.detectChanges();
  expect(service.update).toHaveBeenCalledOnce();
  expect(component.message()).toBe("");
  expect(component.error()).not.toBe("");
  if (status === 401) {
    expect(component.profile()).toBeNull();
    expect(fixture.nativeElement.querySelector("textarea")).toBeNull();
    expect(TestBed.inject(AuthStateStore).user()).toBeNull();
  }
});

it("handles a publication failure without changing the displayed status", async () => {
  const { component } = await create();
  service.setStatus.mockReturnValue(throwError(() => new Error("offline")));
  await component.changeStatus("PUBLICADO");
  expect(component.profile()?.status).toBe("RASCUNHO");
  expect(component.error()).toContain("confirmar");
});

it.each([0, 500, "timeout"] as const)("blocks all writes after an unconfirmed profile update (%s) until a successful GET", async failure => {
  const { component, fixture } = await create();
  const error = failure === "timeout" ? new TimeoutError() : new HttpErrorResponse({ status: failure });
  service.update.mockReturnValue(throwError(() => error));
  await component.save();
  expect(component.uncertain()).toBe(true);
  fixture.detectChanges();
  expect(fixture.nativeElement.querySelector("textarea").matches(":disabled")).toBe(true);
  expect(fixture.nativeElement.querySelector(".publication button").disabled).toBe(true);
  await component.save(); await component.changeStatus("PUBLICADO");
  expect(service.update).toHaveBeenCalledOnce();
  expect(service.setStatus).not.toHaveBeenCalled();
  service.me.mockReturnValueOnce(throwError(() => new Error("unavailable")));
  await component.load(); await component.save();
  expect(component.uncertain()).toBe(true);
  expect(service.update).toHaveBeenCalledOnce();
  await component.load();
  expect(component.uncertain()).toBe(false);
  service.update.mockReturnValue(of(profile));
  await component.save();
  expect(service.update).toHaveBeenCalledTimes(2);
});

it("blocks saving and publication after an unconfirmed status change, then restores the confirmed server state", async () => {
  const { component } = await create();
  service.setStatus.mockReturnValue(throwError(() => new Error("invalid response")));
  await component.changeStatus("PUBLICADO");
  await component.save(); await component.changeStatus("PAUSADO");
  expect(component.uncertain()).toBe(true);
  expect(service.setStatus).toHaveBeenCalledOnce();
  expect(service.update).not.toHaveBeenCalled();
  service.me.mockReturnValue(of({ ...profile, status: "PUBLICADO" }));
  await component.load();
  expect(component.profile()?.status).toBe("PUBLICADO");
  expect(component.uncertain()).toBe(false);
  service.setStatus.mockReturnValue(of({ ...profile, status: "PAUSADO" }));
  await component.changeStatus("PAUSADO");
  expect(component.profile()?.status).toBe("PAUSADO");
});

it("explains an unavailable profile and allows a GET retry", async () => {
  service.me.mockReturnValueOnce(throwError(() => new Error("offline")));
  const { component } = await create();
  expect(component.error()).toContain("carregar");
  await component.save();
  await component.changeStatus("PUBLICADO");
  expect(service.update).not.toHaveBeenCalled();
  await component.load();
  expect(component.profile()).toEqual(profile);
});

it("does not render a profile belonging to another session", async () => {
  service.me.mockReturnValue(of({ ...profile, usuarioId: "someone-else" }));
  const { component } = await create();
  expect(component.profile()).toBeNull();
  expect(component.error()).not.toContain("someone-else");
});

it("does not load mentor data for a startup or a signed-out visitor", async () => {
  TestBed.inject(AuthStateStore).setUser(null);
  const { component } = await create();
  await component.load();
  expect(service.me).not.toHaveBeenCalled();
});

it("blocks concurrent loading and writing", async () => {
  const { component } = await create();
  const pending = new Subject<MentorProfile>();
  service.update.mockReturnValue(pending);
  const saving = component.save();
  await component.save();
  await component.load();
  await component.changeStatus("PUBLICADO");
  expect(service.update).toHaveBeenCalledOnce();
  expect(service.me).toHaveBeenCalledOnce();
  pending.next(profile);
  pending.complete();
  await saving;
});

it("can deselect a schedule period and respects disabled controls", async () => {
  const { fixture, component } = await create();
  const checkbox = fixture.nativeElement.querySelector('input[aria-label="Segunda-feira, Manhã"]') as HTMLInputElement;
  checkbox.click();
  expect(component.availability()).toEqual([]);
  component.busy.set(true);
  fixture.detectChanges();
  expect(checkbox.matches(":disabled")).toBe(true);
});
