import { HttpErrorResponse, provideHttpClient } from "@angular/common/http";
import { TestBed } from "@angular/core/testing";
import { Router, provideRouter } from "@angular/router";
import { RouterTestingHarness } from "@angular/router/testing";
import { Subject, of, throwError } from "rxjs";
import { beforeEach, expect, it, vi } from "vitest";
import { AuthStateStore } from "../../core/auth-state.store";
import { REGISTRATION_MODE } from "../../core/registration.config";
import { StartupProfile } from "../../core/startup.models";
import { StartupService } from "../../core/startup.service";
import { StartupInvitation, TeamOperation } from "../../core/startup-team.models";
import { StartupTeamPendingStore } from "../../core/startup-team-pending.store";
import { StartupTeamService } from "../../core/startup-team.service";
import { StartupTeamComponent } from "./startup-team.component";
import { routes } from "../../app.routes";
import { AuthService } from "../../core/auth.service";

const user = { id: "actor", nome: "Gestor", email: "manager@example.test", tipoUsuario: "STARTUP" as const };
const founder = { id: "founder", usuarioId: user.id, nomeUsuario: "Gestor", papelMembro: "FUNDADOR" as const, dataEntrada: "2026-11-05" };
const member = { ...founder, id: "member", usuarioId: "member-user", nomeUsuario: "Pessoa convidada", papelMembro: "MEMBRO" as const };
const project: StartupProfile = { id: "project", nomeProvisorio: "Projeto Fictício", pitchCurto: "Resumo", problemaCentral: "Problema",
  solucaoProposta: "Solução", publicoAlvo: "Público", modeloDeNegocio: "Modelo", statusValidacao: "APENAS_IDEIA",
  status: "RASCUNHO", dataCriacao: "2026-11-05T12:00:00Z", membros: [founder, member] };
const invite: StartupInvitation = { id: "invite", startupId: "project", nomeStartup: project.nomeProvisorio, nomeConvidante: "Gestor",
  nomeDestinatario: "Pessoa convidada", papelMembro: "MEMBRO", status: "PENDENTE", criadoEm: "2026-11-05T12:00:00Z", expiraEm: "2026-11-12T12:00:00Z" };
function page(itens = [invite], index = 0, count = itens.length) {
  return { itens, pagina: index, tamanho: 20, totalItens: count, totalPaginas: Math.ceil(count / 20) };
}
let teams: Record<"list" | "create" | "recover" | "invitation" | "act" | "remove", ReturnType<typeof vi.fn>>;
let startups: { mine: ReturnType<typeof vi.fn> };
beforeEach(() => {
  startups = { mine: vi.fn(() => of([project])) };
  teams = { list: vi.fn(() => of(page())), create: vi.fn(() => of(invite)), recover: vi.fn(() => of(invite)),
    invitation: vi.fn(() => of(invite)), act: vi.fn((i: StartupInvitation, action: string) => of({ ...i,
      status: { accept: "ACEITO", refuse: "RECUSADO", cancel: "CANCELADO" }[action] })), remove: vi.fn(() => of(undefined)) };
  TestBed.configureTestingModule({ providers: [provideHttpClient(), provideRouter([
    { path: "team/:startupId", component: StartupTeamComponent }, { path: "inbox", component: StartupTeamComponent, data: { inbox: true } },
    { path: "other", component: StartupTeamComponent },
  ]), { provide: REGISTRATION_MODE, useValue: "API" }, { provide: StartupService, useValue: startups },
  { provide: StartupTeamService, useValue: teams }, { provide: AuthService, useValue: { me: vi.fn(() => of(user)) } }] });
  TestBed.inject(AuthStateStore).setUser(user);
});
async function create(inbox = false) {
  const harness = await RouterTestingHarness.create();
  const component = await harness.navigateByUrl(inbox ? "/inbox" : "/team/project", StartupTeamComponent);
  await vi.waitFor(() => expect(component.loading()).toBe(false));
  await harness.fixture.whenStable(); harness.detectChanges();
  return { harness, component, element: harness.routeNativeElement as HTMLElement };
}
function fill(component: StartupTeamComponent) { component.form.setValue({ email: "person@example.test", papelMembro: "MEMBRO" }); }
function fail(status: number) { return throwError(() => new HttpErrorResponse({ status })); }

it("renders the team, founder protection and sending form; emits an invitation without claiming membership", async () => {
  const { component, element, harness } = await create();
  expect(element.textContent).toContain(project.nomeProvisorio);
  expect(element.querySelector<HTMLButtonElement>('[aria-label="Remover Gestor"]')?.disabled).toBe(true);
  expect(element.textContent).toContain("só é criado depois do aceite");
  fill(component); await component.send(); harness.detectChanges();
  expect(teams.create).toHaveBeenCalledWith("project", expect.objectContaining({ email: "person@example.test", papelMembro: "MEMBRO", solicitacaoId: expect.any(String) }));
  expect(component.message()).toBe("Convite pendente."); expect(component.pending()).toBeNull();
  expect(component.profile()?.membros).toEqual(project.membros);
  expect(component.form.controls.email.value).toBe("");
});

it.each(["REPRESENTANTE", "MEMBRO"] as const)("enforces team permissions for %s", async role => {
  startups.mine.mockReturnValue(of([{ ...project, membros: [{ ...founder, papelMembro: role }] }]));
  const { component, element } = await create();
  expect(component.canManage()).toBe(role === "REPRESENTANTE");
  expect(teams.list.mock.calls).toHaveLength(role === "REPRESENTANTE" ? 1 : 0);
  if (role === "MEMBRO") {
    expect(element.querySelector("form")).toBeNull(); fill(component); await component.send();
    component.requestRemoval(founder); component.requestAction(invite, "cancel"); await component.confirm();
    expect(teams.create).not.toHaveBeenCalled(); expect(teams.act).not.toHaveBeenCalled(); expect(teams.remove).not.toHaveBeenCalled();
  }
});

it("validates email, length and role before sending", async () => {
  const { component } = await create();
  for (const email of ["", "bad", `${"a".repeat(255)}@example.test`]) {
    component.form.controls.email.setValue(email); await component.send();
  }
  fill(component); component.form.controls.papelMembro.setValue("FUNDADOR" as never); await component.send();
  expect(teams.create).not.toHaveBeenCalled(); expect(component.error()).toContain("Confira o e-mail");
});

it("requires named confirmation before removing and refreshes current memberships", async () => {
  const { component, harness, element } = await create();
  component.requestRemoval(founder); expect(component.confirmation()).toBeNull();
  component.requestRemoval({ ...member, usuarioId: "unknown" }); expect(component.confirmation()).toBeNull();
  component.requestRemoval(member); harness.detectChanges();
  expect(element.textContent).toContain("Remover Pessoa convidada de Projeto Fictício?");
  component.cancelConfirmation(); await component.confirm(); expect(teams.remove).not.toHaveBeenCalled();
  component.requestRemoval(member); startups.mine.mockReturnValue(of([{ ...project, membros: [founder] }]));
  await component.confirm(); expect(teams.remove).toHaveBeenCalledWith("project", member.usuarioId);
  expect(component.profile()?.membros).toHaveLength(1); expect(component.message()).toContain("removido");
});

it("handles removing one's own representative membership without retaining access", async () => {
  startups.mine.mockReturnValue(of([{ ...project, membros: [{ ...founder, papelMembro: "REPRESENTANTE" }, { ...member, papelMembro: "FUNDADOR" }] }]));
  const { component } = await create();
  component.requestRemoval({ ...founder, papelMembro: "REPRESENTANTE" }); startups.mine.mockReturnValue(of([]));
  await component.confirm(); expect(component.profile()).toBeNull(); expect(component.canManage()).toBe(false);
});

it.each(["accept", "refuse"] as const)("supports recipient %s without a preexisting membership", async kind => {
  startups.mine.mockReturnValue(of([]));
  const { component } = await create(true);
  expect(component.inbox).toBe(true); expect(component.page()).not.toBeNull(); expect(component.blocked()).toBe(false);
  expect(teams.list).toHaveBeenCalledWith(0, undefined);
  component.requestAction(invite, "cancel"); expect(component.confirmation()).toBeNull();
  component.requestAction(invite, kind);
  expect(component.confirmationText(component.confirmation()!)).toContain(project.nomeProvisorio);
  if (kind === "accept") startups.mine.mockReturnValue(of([project]));
  await component.confirm(); expect(teams.act).toHaveBeenCalledWith(invite, kind);
  expect(component.canOpen("project")).toBe(kind === "accept");
});

it("does not restore project access for a historical accepted invitation after membership removal", async () => {
  startups.mine.mockReturnValue(of([])); teams.list.mockReturnValue(of(page([{ ...invite, status: "ACEITO" }])));
  const { component, element } = await create(true);
  expect(component.canOpen("project")).toBe(false); expect(element.textContent).not.toContain("Abrir projeto");
  component.requestAction({ ...invite, status: "ACEITO" }, "accept"); expect(component.confirmation()).toBeNull();
});

it("cancels only a listed pending invitation for the current team", async () => {
  const { component } = await create();
  component.requestAction(invite, "accept"); component.requestAction({ ...invite, id: "foreign" }, "cancel");
  expect(component.confirmation()).toBeNull();
  component.requestAction(invite, "cancel"); await component.confirm();
  expect(teams.act).toHaveBeenCalledWith(invite, "cancel"); expect(component.message()).toContain("cancelado");
});

it.each([400, 403, 404, 409, 410, 415])("handles definitive create rejection %s without an automatic retry", async status => {
  const { component } = await create(); teams.create.mockReturnValue(fail(status)); fill(component); await component.send();
  expect(teams.create).toHaveBeenCalledOnce(); expect(component.pending()).toBeNull(); expect(component.message()).toBe("");
  expect(component.error()).not.toBe("");
  if ([403, 404, 409, 410].includes(status)) expect(component.profile()).toBeNull();
});

it.each([0, 500])("blocks writes after uncertain create %s and recovers using the original request", async status => {
  const { component } = await create(); teams.create.mockReturnValue(fail(status)); fill(component); await component.send();
  const operation = component.pending(); expect(operation?.kind).toBe("create");
  await component.send(); component.requestRemoval(member); await component.changePage(1);
  expect(teams.create).toHaveBeenCalledOnce(); expect(teams.remove).not.toHaveBeenCalled();
  await component.load(); expect(component.pending()).toEqual(operation);
  await component.recover();
  expect(teams.recover).toHaveBeenCalledWith("project", (operation as Extract<TeamOperation, { kind: "create" }>).request.solicitacaoId);
  expect(component.pending()).toBeNull(); expect(component.message()).toContain("Estado confirmado");
});

it("keeps identical content and request ID when recovery returns 404 and the user explicitly retries", async () => {
  const { component } = await create(); teams.create.mockReturnValueOnce(fail(0)); fill(component); await component.send();
  const sent = teams.create.mock.calls[0]; teams.recover.mockReturnValue(fail(404));
  await component.recover(); expect(component.retryAllowed()).toBe(true); expect(teams.create).toHaveBeenCalledOnce();
  component.form.controls.email.setValue("other@example.test"); await component.retryCreate();
  expect(teams.create.mock.calls[1]).toEqual(sent); expect(component.pending()).toBeNull();
});

it("does not treat a 404 during post-receipt refresh as an absent creation request", async () => {
  const { component } = await create(); teams.create.mockReturnValue(fail(0)); fill(component); await component.send();
  teams.list.mockReturnValue(fail(404)); await component.recover();
  expect(component.retryAllowed()).toBe(false); expect(component.pending()).not.toBeNull();
});

it("retains pending state when the receipt succeeds but refreshing fails", async () => {
  const { component } = await create(); teams.list.mockReturnValue(fail(403)); fill(component); await component.send();
  expect(component.pending()).not.toBeNull(); expect(component.message()).toBe("");
  teams.list.mockReturnValue(of(page())); await component.recover(); expect(component.pending()).toBeNull();
});

it.each(["accept", "refuse", "cancel"] as const)("recovers uncertain %s by exact invitation, then memberships", async kind => {
  const { component } = await create(kind !== "cancel"); teams.act.mockReturnValue(fail(500));
  component.requestAction(invite, kind); await component.confirm();
  expect(component.pending()?.kind).toBe(kind);
  await component.recover(); expect(teams.invitation).toHaveBeenCalledWith(invite.id, invite.startupId);
  expect(component.pending()).toBeNull(); expect(teams.act).toHaveBeenCalledOnce();
});

it("recovers uncertain removal from current project memberships", async () => {
  const { component } = await create(); teams.remove.mockReturnValue(fail(0));
  component.requestRemoval(member); await component.confirm();
  startups.mine.mockReturnValue(of([{ ...project, membros: [founder] }])); await component.recover();
  expect(component.pending()).toBeNull(); expect(component.profile()?.membros).toHaveLength(1);
  expect(component.message()).toContain("Equipe consultada");
});

it("does not clear an unresolved request on a failed or mismatched recovery", async () => {
  const { component } = await create(); fill(component); teams.create.mockReturnValue(fail(0)); await component.send();
  teams.recover.mockReturnValue(fail(500)); await component.recover(); expect(component.pending()).not.toBeNull();
  teams.recover.mockReturnValue(of({ ...invite, papelMembro: "REPRESENTANTE" })); await component.recover();
  expect(component.pending()).not.toBeNull(); expect(component.retryAllowed()).toBe(false);
});

it("handles pagination and discards the previous page while the next request is loading", async () => {
  teams.list.mockReturnValue(of(page([invite], 0, 21)));
  const { component } = await create(true);
  await component.changePage(-1); await component.changePage(2); expect(teams.list).toHaveBeenCalledOnce();
  const response = new Subject<ReturnType<typeof page>>(); teams.list.mockReturnValue(response);
  const loading = component.changePage(1); await vi.waitFor(() => expect(teams.list).toHaveBeenCalledTimes(2)); expect(component.page()).toBeNull();
  response.next(page([{ ...invite, id: "last" }], 1, 21)); response.complete(); await loading;
  expect(component.page()?.pagina).toBe(1); expect(teams.list).toHaveBeenLastCalledWith(1, undefined);
});

it("drops old data during route changes and ignores a late page from the previous project", async () => {
  const { component, harness } = await create();
  const old = new Subject<ReturnType<typeof page>>(); teams.list.mockReturnValueOnce(old);
  const loading = component.load(); await Promise.resolve();
  startups.mine.mockReturnValue(of([{ ...project, id: "second", nomeProvisorio: "Outro projeto" }]));
  teams.list.mockReturnValue(of(page([{ ...invite, startupId: "second" }])));
  await harness.navigateByUrl("/team/second", StartupTeamComponent);
  old.next(page()); old.complete(); await loading; harness.detectChanges();
  expect(component.profile()?.id).toBe("second"); expect(component.page()?.itens[0].startupId).toBe("second");
});

it("preserves an unresolved write across navigation and guard session confirmation", async () => {
  const { component, harness } = await create(); fill(component); teams.create.mockReturnValue(fail(0)); await component.send();
  const pending = component.pending(); TestBed.inject(AuthStateStore).confirmUser({ ...user });
  await harness.navigateByUrl("/inbox", StartupTeamComponent);
  const again = await harness.navigateByUrl("/team/project", StartupTeamComponent);
  expect(again.pending()).toEqual(pending); fill(again); await again.send(); expect(teams.create).toHaveBeenCalledOnce();
});

it("does not display data or feedback from a prior account or a new session of the same account", async () => {
  const { component, harness, element } = await create();
  const late = new Subject<StartupInvitation>(); teams.create.mockReturnValue(late); fill(component); const sending = component.send();
  const auth = TestBed.inject(AuthStateStore); auth.setUser(null); auth.setUser(user);
  late.next(invite); late.complete(); await sending; harness.detectChanges();
  expect(component.profile()).toBeNull(); expect(component.page()).toBeNull(); expect(component.message()).toBe("");
  expect(component.pending()).toBeNull(); expect(element.textContent).not.toContain(project.nomeProvisorio);
});

it("ignores late reads from a logged-out account", async () => {
  const { component } = await create(); const late = new Subject<StartupProfile[]>(); startups.mine.mockReturnValue(late);
  const loading = component.load(); TestBed.inject(AuthStateStore).setUser({ ...user, id: "another" });
  late.next([project]); late.complete(); await loading; expect(component.profile()).toBeNull();
});

it("retains an operation when its component is destroyed before the receipt", async () => {
  const { component, harness } = await create(); fill(component); const late = new Subject<StartupInvitation>(); teams.create.mockReturnValue(late);
  const sending = component.send(); await harness.navigateByUrl("/inbox", StartupTeamComponent);
  late.next(invite); late.complete(); await sending;
  expect(TestBed.inject(StartupTeamPendingStore).get("project")?.kind).toBe("create");
});

it.each([401, 403, 404, 500])("handles initial read failure %s", async status => {
  startups.mine.mockReturnValue(fail(status)); const { component } = await create();
  expect(component.profile()).toBeNull(); expect(component.page()).toBeNull();
  if (status === 401) expect(TestBed.inject(AuthStateStore).user()).toBeNull();
  else expect(component.error()).not.toBe("");
});

it.each([{ profiles: [] }, { profiles: [project, project] }, { profiles: [{ ...project, membros: [member] }] }])("rejects absent or invalid current membership %#", async ({ profiles }) => {
  startups.mine.mockReturnValue(of(profiles)); const { component } = await create();
  expect(component.profile()).toBeNull(); expect(teams.list).not.toHaveBeenCalled(); expect(component.error()).not.toBe("");
});

it.each(["MENTOR", "ADMIN"] as const)("does not query or mutate for account type %s", async type => {
  TestBed.inject(AuthStateStore).setUser({ ...user, tipoUsuario: type }); const { component } = await create();
  fill(component); await component.send(); await component.recover(); await component.retryCreate();
  expect(startups.mine).not.toHaveBeenCalled(); expect(teams.create).not.toHaveBeenCalled(); expect(component.active()).toBe(false);
});

it("formats dates explicitly in São Paulo and does not act without confirmation or pending recovery", async () => {
  const { component } = await create(); expect(component.date(invite.criadoEm)).toContain("09:00");
  await component.confirm(); await component.recover(); await component.retryCreate(); expect(teams.act).not.toHaveBeenCalled();
  expect(component.confirmationText({ kind: "create", project: "p", request: { solicitacaoId: "r", email: "p@example.test", papelMembro: "MEMBRO" } })).toBe("Enviar convite?");
  expect(TestBed.inject(Router)).toBeTruthy();
});

it.each(["/startup/convites", "/startup/perfil/project/equipe"])("loads the real lazy route %s behind its account guard", async path => {
  TestBed.inject(Router).resetConfig(routes);
  const harness = await RouterTestingHarness.create();
  const component = await harness.navigateByUrl(path, StartupTeamComponent);
  await vi.waitFor(() => expect(component.loading()).toBe(false));
  expect(component.active()).toBe(true); expect(component.page()?.itens).toEqual([invite]);
});

it("wires the form and confirmation buttons through DOM events", async () => {
  const { component, harness, element } = await create(); fill(component); harness.detectChanges();
  const form = element.querySelector('form')!; form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  await vi.waitFor(() => expect(component.busy()).toBe(false)); harness.detectChanges();
  expect(teams.create).toHaveBeenCalledOnce();
  element.querySelector<HTMLButtonElement>('[aria-label="Remover Pessoa convidada"]')!.click(); harness.detectChanges();
  const confirmation = element.querySelector('.confirmation')!;
  expect(confirmation.textContent).toContain("Pessoa convidada");
  confirmation.querySelector<HTMLButtonElement>('button')!.click();
  await vi.waitFor(() => expect(teams.remove).toHaveBeenCalledOnce());
});

it("does not keep old management data after a failed membership reload", async () => {
  const { component } = await create(); startups.mine.mockReturnValue(fail(500)); await component.load();
  expect(component.profile()).toBeNull(); expect(component.canManage()).toBe(false);
});
