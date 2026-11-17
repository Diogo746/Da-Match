import { HttpErrorResponse, provideHttpClient } from "@angular/common/http";
import { TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { RouterTestingHarness } from "@angular/router/testing";
import { Subject, of, throwError } from "rxjs";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AuthStateStore } from "../../core/auth-state.store";
import { MentorService } from "../../core/mentor.service";
import { ProfilesStore } from "../../core/profiles.store";
import { ProfileKind } from "../../core/profile.models";
import { Recommendations, RecommendationsService } from "../../core/recommendations.service";
import { REGISTRATION_MODE } from "../../core/registration.config";
import { StartupProfile } from "../../core/startup.models";
import { StartupService } from "../../core/startup.service";
import { RecommendationsComponent } from "./recommendations.component";

const first = "10000000-0000-4000-8000-000000000001";
const second = "10000000-0000-4000-8000-000000000002";
const mentorId = "30000000-0000-4000-8000-000000000001";
const user = { id: "actor", nome: "Pessoa Fictícia", email: "actor@example.test", tipoUsuario: "STARTUP" as const };
function project(id = first): StartupProfile {
  return { id, nomeProvisorio: "Projeto " + id.slice(-1), pitchCurto: "Resumo", problemaCentral: "Problema", solucaoProposta: "Solução",
    publicoAlvo: "Público", modeloDeNegocio: "Modelo", statusValidacao: "APENAS_IDEIA", status: "PUBLICADO", dataCriacao: "2026-11-17T12:00:00Z", membros: [] };
}
function result(kind: ProfileKind = "STARTUP", origin = first): Recommendations {
  return { perfilOrigemId: origin, tipoOrigem: kind, versaoRegra: "damatch-mentoria-v1", calculadoEm: "2026-11-17T12:00:00Z",
    perfilElegivel: true, pendencias: [], itens: [{ perfil: { id: second, tipo: kind === "STARTUP" ? "MENTOR" : "STARTUP",
      nome: "Perfil Recomendado", apresentacao: "Apresentação fictícia", setores: ["TECH"], topicos: ["VALIDATION"], formato: "ONLINE", cidadeId: "" },
    superDamatch: true, agendaEmComum: true }] };
}
let state: AuthStateStore;
let api: { list: ReturnType<typeof vi.fn> };
let startups: { mine: ReturnType<typeof vi.fn> };
let mentors: { me: ReturnType<typeof vi.fn> };
beforeEach(() => {
  api = { list: vi.fn((kind: ProfileKind, origin: string) => of(result(kind, origin))) };
  startups = { mine: vi.fn(() => of([project()])) }; mentors = { me: vi.fn(() => of({ id: mentorId })) };
  TestBed.configureTestingModule({ providers: [provideHttpClient(), provideRouter([{ path: "", component: RecommendationsComponent }]),
    { provide: REGISTRATION_MODE, useValue: "API" }, { provide: RecommendationsService, useValue: api },
    { provide: StartupService, useValue: startups }, { provide: MentorService, useValue: mentors },
    { provide: ProfilesStore, useFactory: () => { throw new Error("No demo store in recommendations"); } }] });
  state = TestBed.inject(AuthStateStore); state.setUser(user);
  vi.spyOn(HTMLDialogElement.prototype, "showModal").mockImplementation(function (this: HTMLDialogElement) { this.open = true; });
  vi.spyOn(HTMLDialogElement.prototype, "close").mockImplementation(function (this: HTMLDialogElement) {
    this.open = false; this.dispatchEvent(new Event("close"));
  });
});
afterEach(() => vi.restoreAllMocks());
async function create(url = "/") {
  const harness = await RouterTestingHarness.create();
  const component = await harness.navigateByUrl(url, RecommendationsComponent);
  await harness.fixture.whenStable(); harness.detectChanges();
  return { harness, component, element: harness.routeNativeElement as HTMLElement };
}
async function settle(harness: RouterTestingHarness) { await harness.fixture.whenStable(); harness.detectChanges(); }
function failure(status: number) { return throwError(() => new HttpErrorResponse({ status })); }

it("renders the server order and seal without scores, private fields or demo state", async () => {
  const { component, element } = await create();
  expect(api.list).toHaveBeenCalledWith("STARTUP", first);
  expect(element.textContent).toContain("Perfil Recomendado"); expect(element.textContent).toContain("Super DaMatch");
  expect(element.textContent).toContain("Regra de mentoria v1");
  for (const forbidden of ["95%", "100%", user.email, "Salvar perfil", "Conectar agora"]) expect(element.textContent).not.toContain(forbidden);
  expect(component.result()?.itens).toHaveLength(1);
});

it("requires an explicit selection for multiple projects and preserves the selected project in the URL", async () => {
  startups.mine.mockReturnValue(of([project(), project(second)]));
  const { harness, component, element } = await create();
  expect(api.list).not.toHaveBeenCalled(); expect(element.querySelector("select")).not.toBeNull();
  await component.select(second); await settle(harness);
  expect(api.list).toHaveBeenLastCalledWith("STARTUP", second);
  expect(TestBed.inject(Router).url).toContain(second);
  expect(component.selectedId()).toBe(second);
  expect((element.querySelector("select") as HTMLSelectElement).value).toBe(second);
  component.reload(); await settle(harness);
  expect((element.querySelector("select") as HTMLSelectElement).selectedOptions[0].textContent).toBe("Projeto 2");
});

it("ignores results from a previous project and discards previous cards immediately", async () => {
  startups.mine.mockReturnValue(of([project(), project(second)]));
  const old = new Subject<Recommendations>();
  api.list.mockImplementation((kind, origin) => origin === first ? old : of(result(kind, origin)));
  const { harness, component } = await create("/?startupId=" + first);
  await component.select(second); await settle(harness);
  old.next(result()); old.complete(); await settle(harness);
  expect(component.result()?.perfilOrigemId).toBe(second);
});

it("ignores late results after logout and after a new actor takes over", async () => {
  const old = new Subject<Recommendations>(); api.list.mockReturnValue(old);
  const { harness, component, element } = await create();
  state.setUser(null); await settle(harness);
  old.next(result()); old.complete(); await settle(harness);
  expect(component.result()).toBeNull(); expect(element.textContent).not.toContain("Perfil Recomendado");
  api.list.mockImplementation((kind, origin) => of(result(kind, origin)));
  state.setUser({ ...user, id: "mentor-account", tipoUsuario: "MENTOR" }); await settle(harness);
  expect(api.list).toHaveBeenLastCalledWith("MENTOR", mentorId);
  expect(component.result()?.tipoOrigem).toBe("MENTOR");
});

it("does not query for ADMIN, visitors or the isolated demo mode", async () => {
  state.setUser({ ...user, tipoUsuario: "ADMIN" });
  const { harness, component } = await create();
  expect(api.list).not.toHaveBeenCalled(); expect(component.kind()).toBeNull();
  state.setUser(null); await settle(harness); expect(startups.mine).not.toHaveBeenCalled();
});

it("keeps the DEMO page isolated from real profiles", async () => {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [provideHttpClient(), provideRouter([{ path: "", component: RecommendationsComponent }]),
    { provide: REGISTRATION_MODE, useValue: "DEMO" }, { provide: RecommendationsService, useValue: api },
    { provide: StartupService, useValue: startups }, { provide: MentorService, useValue: mentors }] });
  TestBed.inject(AuthStateStore).setUser(user);
  const { element } = await create();
  expect(element.textContent).toContain("demonstração mantém sua regra experimental");
  expect(api.list).not.toHaveBeenCalled(); expect(startups.mine).not.toHaveBeenCalled();
});

it("discards a late detail after the session changes", async () => {
  const { harness, component } = await create();
  const pending = new Subject<Recommendations>(); api.list.mockReturnValue(pending);
  const opening = component.open(result().itens[0], new Event("click"));
  state.setUser(null); await settle(harness);
  pending.next(result()); pending.complete(); await opening; await settle(harness);
  expect(component.detail()).toBeNull(); expect(component.result()).toBeNull();
});

it("shows publication/questionnaire requirements and a real empty result without fillers", async () => {
  api.list.mockReturnValue(of({ ...result(), perfilElegivel: false, itens: [], pendencias: [{ campo: "status", mensagem: "Publique a startup." }] }));
  const { harness, component, element } = await create();
  expect(element.textContent).toContain("Publique a startup"); expect(element.textContent).not.toContain("Perfil Recomendado");
  expect(element.querySelector('a[href*="questionario"]')).not.toBeNull();
  api.list.mockReturnValue(of({ ...result(), itens: [] })); component.reload(); await settle(harness);
  expect(element.textContent).toContain("Nenhuma indicação neste momento"); expect(component.result()?.itens).toEqual([]);
});

it("does not silently replace a revoked or unknown project with another project", async () => {
  const { component, element } = await create("/?startupId=" + second);
  expect(api.list).not.toHaveBeenCalled(); expect(component.error()).toContain("não está entre seus projetos");
  expect(element.textContent).not.toContain("Perfil Recomendado");
});

it("handles missing memberships and reload failures without rendering stale recommendations", async () => {
  const { harness, component, element } = await create();
  api.list.mockReturnValue(failure(403)); component.reload(); await settle(harness);
  expect(component.result()).toBeNull(); expect(element.textContent).toContain("não tem mais acesso");
  startups.mine.mockReturnValue(of([])); component.reload(); await settle(harness);
  expect(element.textContent).toContain("não possui vínculo");
  for (const code of [401, 404, 500]) {
    startups.mine.mockReturnValue(failure(code)); component.reload(); await settle(harness);
    expect(component.error()).not.toBe(""); expect(component.result()).toBeNull();
  }
});

it("recalculates before showing details and shows the no-common-agenda explanation without exposing slots", async () => {
  const { harness, component, element } = await create();
  api.list.mockReturnValue(of({ ...result(), itens: [{ ...result().itens[0], superDamatch: false, agendaEmComum: false }] }));
  await component.open(result().itens[0], new Event("click")); await settle(harness);
  expect(component.detail()?.superDamatch).toBe(false);
  expect(element.textContent).toContain("precisam combinar os horários");
  expect(element.textContent).not.toContain("Super DaMatch");
  component.dismiss(); await settle(harness); expect(component.detail()).toBeNull();
});

it("removes an unavailable recommendation and cancels late detail requests on project changes", async () => {
  const { harness, component, element } = await create();
  api.list.mockReturnValue(of({ ...result(), itens: [] }));
  await component.open(result().itens[0], new Event("click")); await settle(harness);
  expect(component.detailError()).toContain("não está mais disponível"); expect(element.querySelector("app-discovery-card")).toBeNull();
  component.dismiss();
  api.list.mockReturnValue(of(result())); component.reload(); await settle(harness);
  api.list.mockReturnValue(failure(500)); await component.open(result().itens[0], new Event("click")); await settle(harness);
  expect(component.result()).toBeNull(); expect(component.detailError()).toContain("Não foi possível");
});

it("reports navigation failure and does not overwrite a new account with an old origin request", async () => {
  const { harness, component } = await create();
  vi.spyOn(TestBed.inject(Router), "navigate").mockRejectedValueOnce(new Error("navigation"));
  await component.select(second); await settle(harness); expect(component.error()).toContain("selecionar");
  const origins = new Subject<StartupProfile[]>(); startups.mine.mockReturnValue(origins);
  component.reload(); await settle(harness);
  state.setUser({ ...user, id: "mentor", tipoUsuario: "MENTOR" }); await settle(harness);
  origins.next([project()]); origins.complete(); await settle(harness);
  expect(component.result()?.perfilOrigemId).toBe(mentorId);
});
