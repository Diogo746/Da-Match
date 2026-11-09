import { HttpErrorResponse, provideHttpClient } from "@angular/common/http";
import { TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { RouterTestingHarness } from "@angular/router/testing";
import { Subject, of, throwError } from "rxjs";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AuthStateStore } from "../../core/auth-state.store";
import { AuthService } from "../../core/auth.service";
import { DiscoveryService } from "../../core/discovery.service";
import { DiscoveryPage, DiscoveryProfile, EMPTY_DISCOVERY_QUERY } from "../../core/discovery.models";
import { ProfileKind } from "../../core/profile.models";
import { ProfilesStore } from "../../core/profiles.store";
import { ProfileSessionStore } from "../../core/profile-session.store";
import { REGISTRATION_MODE } from "../../core/registration.config";
import { ApiDiscoveryComponent } from "./api-discovery.component";
import { loadExploreComponent } from "./explore.entry";

const user = { id: "reader", nome: "Pessoa Fictícia", email: "reader@example.test", tipoUsuario: "STARTUP" as const };
const profile: DiscoveryProfile = { id: "10000000-0000-4000-8000-000000000001", tipo: "MENTOR", nome: "Mentora do Banco",
  apresentacao: "Uma biografia real para a consulta.", setores: ["TECH"], topicos: ["VALIDATION", "BUSINESS"], formato: "ONLINE", cidadeId: "" };
function page(kind: ProfileKind = "MENTOR", index = 0): DiscoveryPage {
  return { itens: [{ ...profile, tipo: kind }], pagina: index, tamanho: 20, totalItens: 41, totalPaginas: 3 };
}
let api: { list: ReturnType<typeof vi.fn>; detail: ReturnType<typeof vi.fn> };
let auth: { me: ReturnType<typeof vi.fn> };
let state: AuthStateStore;
beforeEach(() => {
  api = { list: vi.fn((kind: ProfileKind, query) => of(page(kind, query.pagina))), detail: vi.fn(() => of(profile)) };
  auth = { me: vi.fn(() => of(user)) };
  TestBed.configureTestingModule({ providers: [provideHttpClient(), provideRouter([
    { path: "", component: ApiDiscoveryComponent }, { path: "salvos", component: ApiDiscoveryComponent, data: { savedOnly: true } },
    { path: "other", loadComponent: loadExploreComponent },
  ]), { provide: REGISTRATION_MODE, useValue: "API" }, { provide: DiscoveryService, useValue: api },
  { provide: AuthService, useValue: auth },
  { provide: ProfilesStore, useFactory: () => { throw new Error("DEMO store must not be constructed"); } },
  { provide: ProfileSessionStore, useFactory: () => { throw new Error("DEMO session must not be constructed"); } }] });
  state = TestBed.inject(AuthStateStore); state.setUser(user);
  vi.spyOn(HTMLDialogElement.prototype, "close").mockImplementation(function (this: HTMLDialogElement) {
    this.open = false; this.dispatchEvent(new Event("close"));
  });
});
afterEach(() => vi.restoreAllMocks());
async function create(url = "/") {
  const harness = await RouterTestingHarness.create();
  const component = await harness.navigateByUrl(url, ApiDiscoveryComponent);
  await harness.fixture.whenStable(); harness.detectChanges();
  return { harness, component, element: harness.routeNativeElement as HTMLElement };
}
async function settle(harness: RouterTestingHarness) { await harness.fixture.whenStable(); harness.detectChanges(); }
function failure(status: number) { return throwError(() => new HttpErrorResponse({ status })); }

it("renders real profiles without demo stores, fake recommendations, saving, private data or extra type tabs", async () => {
  const { component, element } = await create();
  expect(api.list).toHaveBeenCalledWith("MENTOR", EMPTY_DISCOVERY_QUERY);
  expect(element.textContent).toContain(profile.nome); expect(element.textContent).toContain("Conheça os mentores");
  expect(element.querySelector("app-profile-card")).toBeNull();
  for (const text of ["Perfis fictícios", "Super DaMatch", "Para você", user.email, "Salvar perfil"]) expect(element.textContent).not.toContain(text);
  expect(component.catalog()?.page?.itens).toHaveLength(1);
});
it("waits for session restoration before querying and offers login for a visitor", async () => {
  const pending = new Subject<typeof user>(); auth.me.mockReturnValue(pending); state.setUser(null);
  const { harness, component, element } = await create();
  expect(api.list).not.toHaveBeenCalled(); expect(element.textContent).toContain("Consultando sua sessão");
  pending.error(new HttpErrorResponse({ status: 401 })); await settle(harness);
  expect(component.sessionStatus()).toBe("ready"); expect(element.textContent).toContain("Entre para conhecer");
  expect(element.querySelector('a[href="/entrar"]')).not.toBeNull(); expect(api.list).not.toHaveBeenCalled();
});
it("allows a reader without a project, quiz or published profile and restricts each account to the opposite type", async () => {
  state.setUser({ ...user, tipoUsuario: "MENTOR" });
  const { harness, component, element } = await create();
  expect(api.list).toHaveBeenCalledWith("STARTUP", EMPTY_DISCOVERY_QUERY);
  expect(element.textContent).toContain("Conheça as startups");
  expect(element.querySelector('option[value="DISCOVERING"]')).not.toBeNull();
  expect(element.querySelector('option[value="GENERAL"]')).toBeNull();
  state.setUser({ ...user, tipoUsuario: "ADMIN" }); await settle(harness);
  expect(component.catalog()).toBeNull(); expect(element.textContent).toContain("não possui acesso");
  expect(element.textContent).not.toContain(profile.nome);
});
it("recovers from session unavailability explicitly and accepts a newly authenticated account", async () => {
  auth.me.mockReturnValue(failure(503));
  const { harness, component, element } = await create();
  expect(element.textContent).toContain("Não foi possível consultar sua sessão"); expect(api.list).not.toHaveBeenCalled();
  auth.me.mockReturnValue(of(user)); await component.restoreSession(); await settle(harness);
  expect(api.list).toHaveBeenCalledTimes(1);
  auth.me.mockReturnValue(failure(503)); await component.restoreSession(); await settle(harness);
  state.setUser({ ...user, id: "new-account" }); await settle(harness);
  expect(component.sessionStatus()).toBe("ready"); expect(element.textContent).toContain(profile.nome);
});
it("does not restore data after destruction or a superseded session restoration", async () => {
  const first = new Subject<typeof user>(); auth.me.mockReturnValue(first);
  const { harness, component } = await create();
  auth.me.mockReturnValue(of(user)); await component.restoreSession(); await settle(harness);
  first.error(new Error("old")); await settle(harness); expect(component.sessionStatus()).toBe("ready");
  const last = new Subject<typeof user>(); auth.me.mockReturnValue(last); const pending = component.restoreSession();
  harness.fixture.destroy(); last.next(user); last.complete(); await pending;
  expect(component.sessionStatus()).toBe("loading");
});
it("restores URL filters and pagination, submits back to page zero and preserves browser history", async () => {
  const { harness, component } = await create("/?busca=Ideia&setor=TECH&topico=VALIDATION&formato=ONLINE&pagina=2&tamanho=10");
  expect(api.list).toHaveBeenLastCalledWith("MENTOR", expect.objectContaining({ busca: "Ideia", setor: "TECH", pagina: 2, tamanho: 10 }));
  expect(component.form.controls.busca.value).toBe("Ideia");
  component.form.patchValue({ busca: "  Saúde %_'  ", cidade: "PE_RECIFE" }); await component.search(); await settle(harness);
  expect(TestBed.inject(Router).url).toContain("pagina=0");
  expect(api.list).toHaveBeenLastCalledWith("MENTOR", expect.objectContaining({ busca: "Saúde %_'", cidade: "PE_RECIFE", pagina: 0 }));
  await component.page(1); await settle(harness); expect(component.queryState().query?.pagina).toBe(1);
  await harness.navigateByUrl("/?busca=Ideia&pagina=2"); await settle(harness);
  expect(component.form.controls.busca.value).toBe("Ideia"); expect(component.queryState().query?.pagina).toBe(2);
  await component.clear(); await settle(harness); expect(component.queryState().query).toEqual(EMPTY_DISCOVERY_QUERY);
});
it.each(["?actor=other", "?setor=DISCOVERING", "?pagina=-1", "?busca=a&busca=b"])("rejects invalid address %s without querying", async address => {
  const { component, element, harness } = await create("/" + address);
  expect(element.textContent).toContain("endereço são inválidos"); expect(api.list).not.toHaveBeenCalled();
  await component.clear(); await settle(harness); expect(component.catalog()?.page?.itens).toHaveLength(1);
});
it("blocks invalid form input and handles navigation failure", async () => {
  const { component, harness, element } = await create();
  component.form.controls.busca.setValue("x".repeat(101)); await component.search();
  expect(component.form.controls.busca.touched).toBe(true); expect(api.list).toHaveBeenCalledTimes(1);
  component.form.controls.busca.setValue("valid");
  vi.spyOn(TestBed.inject(Router), "navigate").mockRejectedValue(new Error("navigation"));
  await component.search(); await settle(harness); expect(element.textContent).toContain("Não foi possível atualizar a pesquisa");
  await component.page(-1); expect(component.queryState().query?.pagina).toBe(0);
});
it.each([400, 401, 403, 503])("distinguishes HTTP %s without a fake empty list and allows a new read", async status => {
  api.list.mockReturnValue(failure(status));
  const { harness, component, element } = await create();
  expect(element.querySelector('[role="alert"]')).not.toBeNull(); expect(element.textContent).not.toContain("Nenhum perfil nesta página");
  expect(component.catalog()?.page).toBeNull();
  api.list.mockReturnValue(of({ ...page(), itens: [], totalItens: 0, totalPaginas: 0 }));
  await component.load(); await settle(harness); expect(element.textContent).toContain("Nenhum perfil nesta página");
});
it("discards out-of-order list responses across page/filter and logout/login of the same account", async () => {
  const old = new Subject<DiscoveryPage>(); api.list.mockReturnValueOnce(old);
  const { harness, component, element } = await create();
  await component.page(1); await settle(harness);
  old.next({ ...page(), itens: [{ ...profile, nome: "Resposta antiga" }] }); old.complete(); await settle(harness);
  expect(element.textContent).not.toContain("Resposta antiga"); expect(component.catalog()?.page?.pagina).toBe(1);
  const other = new Subject<DiscoveryPage>(); api.list.mockReturnValueOnce(other); const pending = component.load();
  state.setUser(null); state.setUser(user); expect(component.catalog()).toBeNull();
  await settle(harness); other.error(new Error("stale error")); await pending; await settle(harness);
  expect(component.catalog()?.error).toBe(""); expect(element.textContent).toContain(profile.nome);
});
it("does not let a destroyed view accept a pending list or detail", async () => {
  const { harness, component } = await create();
  const detail = new Subject<DiscoveryProfile>(); api.detail.mockReturnValue(detail); const opening = component.open(profile);
  const list = new Subject<DiscoveryPage>(); api.list.mockReturnValue(list); const loading = component.load();
  harness.fixture.destroy(); detail.next(profile); detail.complete(); list.error(new Error("old")); await Promise.all([opening, loading]);
  expect(component.detail()).toBeNull();
});
it("re-reads detail, shows full presentation as text, focuses close and returns focus on close", async () => {
  const { harness, component, element } = await create();
  api.detail.mockReturnValue(of({ ...profile, apresentacao: "<script>text only</script>\n" + "a".repeat(970), formato: "AMBOS", cidadeId: "PE_RECIFE" }));
  const button = element.querySelector<HTMLButtonElement>(".profile-link")!;
  button.click(); await settle(harness);
  expect(api.detail).toHaveBeenCalledWith("MENTOR", profile.id);
  expect(element.querySelector("dialog")?.open).toBe(true); expect(element.querySelector("dialog script")).toBeNull();
  expect(element.querySelector(".presentation")?.textContent).toContain("<script>text only</script>");
  expect(element.querySelector("dialog")?.textContent).toContain("Online ou presencial · Recife");
  component.dismiss(); await settle(harness); expect(component.detail()).toBeNull(); expect(element.querySelector("dialog")?.open).toBe(false);
});
it.each([404, 403, 400, 503])("removes a stale card when fresh detail returns %s, without rendering old card text in the dialog", async status => {
  api.detail.mockReturnValue(failure(status));
  const { harness, component, element } = await create();
  element.querySelector<HTMLButtonElement>(".profile-link")!.click(); await settle(harness);
  expect(component.catalog()).toBeNull(); expect(element.querySelector("dialog .presentation")).toBeNull();
  expect(element.querySelector('dialog [role="alert"]')).not.toBeNull();
  expect(element.querySelectorAll(".catalog-card")).toHaveLength(0);
  component.dismiss(); await settle(harness);
  expect(document.activeElement?.textContent).toContain("Atualizar pesquisa");
});
it("discards closed and superseded detail responses, including after account changes", async () => {
  const { harness, component } = await create();
  const old = new Subject<DiscoveryProfile>(); api.detail.mockReturnValueOnce(old);
  const opening = component.open(profile); component.dismiss(); old.next(profile); old.complete(); await opening;
  expect(component.detail()).toBeNull();
  const late = new Subject<DiscoveryProfile>(); api.detail.mockReturnValueOnce(late);
  const pending = component.open(profile); state.setUser({ ...user, id: "other" });
  expect(component.detail()).toBeNull(); await settle(harness); late.error(new Error("stale")); await pending;
  expect(component.detail()).toBeNull();
  await component.open({ ...profile, id: "not-in-list" }); expect(api.detail).toHaveBeenCalledTimes(2);
});
it("keeps saved profiles unavailable in API mode instead of showing fictitious saved items", async () => {
  const { element } = await create("/salvos");
  expect(element.textContent).toContain("próxima etapa"); expect(api.list).not.toHaveBeenCalled(); expect(auth.me).not.toHaveBeenCalled();
});
it("the route entry constructs only the API view in API mode", async () => {
  const harness = await RouterTestingHarness.create();
  await harness.navigateByUrl("/other", ApiDiscoveryComponent); await settle(harness);
  expect(harness.routeNativeElement?.querySelector(".catalog-page")).not.toBeNull();
  expect(harness.routeNativeElement?.querySelector("app-demo-explore")).toBeNull();
});

it("keeps advanced filters out of the initial search and restores an applied filter from the address", async () => {
  const { component, element, harness } = await create();
  const filters = element.querySelector("details")!;
  expect(filters.open).toBe(false);
  expect(api.list).toHaveBeenCalledWith("MENTOR", expect.objectContaining({ pagina: 0, tamanho: 6 }));
  filters.open = true;
  component.form.controls.setor.setValue("TECH");
  await component.search(); await settle(harness);
  expect(filters.open).toBe(true);
  expect(TestBed.inject(Router).url).toContain("setor=TECH");
  await component.page(1); await settle(harness);
  expect(api.list).toHaveBeenLastCalledWith("MENTOR", expect.objectContaining({ pagina: 1, tamanho: 6, setor: "TECH" }));
  await component.clear(); await settle(harness);
  expect(filters.open).toBe(false);
  expect(component.form.controls.setor.value).toBe("");
});
