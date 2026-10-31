import { Location } from "@angular/common";
import { provideLocationMocks } from "@angular/common/testing";
import { HttpErrorResponse, provideHttpClient } from "@angular/common/http";
import { TestBed } from "@angular/core/testing";
import { Router, provideRouter } from "@angular/router";
import { RouterTestingHarness } from "@angular/router/testing";
import { Subject, of } from "rxjs";
import { beforeEach, expect, it, vi } from "vitest";
import { AuthStateStore } from "../../core/auth-state.store";
import { emptyProfile } from "../../core/profile.models";
import { QuestionnaireService } from "../../core/questionnaire.service";
import { StartupService } from "../../core/startup.service";
import { StartupProfile } from "../../core/startup.models";
import { StartupPublication } from "../../core/startup-publication.models";
import { QuestionnaireComponent } from "./questionnaire.component";
import { StartupProfileComponent } from "./startup-profile.component";

const profiles: StartupProfile[] = ["a", "b"].map(id => ({ id, nomeProvisorio: `Projeto ${id}`, pitchCurto: "Resumo",
  problemaCentral: "Problema", solucaoProposta: "Solução", publicoAlvo: "Público", modeloDeNegocio: "Modelo",
  statusValidacao: "APENAS_IDEIA", status: "RASCUNHO", dataCriacao: "2026-10-31T12:00:00Z",
  membros: [{ id: "member-" + id, usuarioId: "owner", nomeUsuario: "Pessoa Fictícia",
    papelMembro: id === "a" ? "FUNDADOR" : "MEMBRO", dataEntrada: "2026-10-31" }] }));
const publication = (id: string): StartupPublication => ({ startupId: id, status: "RASCUNHO", aptoParaPublicacao: true,
  podeGerenciar: id === "a", pendencias: [] });
let service: { mine: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn>;
  publication: ReturnType<typeof vi.fn>; setStatus: ReturnType<typeof vi.fn> };

beforeEach(() => {
  service = { mine: vi.fn(() => of(profiles)), update: vi.fn(), publication: vi.fn((id: string) => of(publication(id))), setStatus: vi.fn() };
  TestBed.configureTestingModule({ providers: [provideHttpClient(), provideLocationMocks(), provideRouter([
    { path: "startup/perfil", component: StartupProfileComponent },
    { path: "startup/perfil/:startupId/questionario", component: QuestionnaireComponent, data: { kind: "STARTUP" } },
  ]), { provide: StartupService, useValue: service }, { provide: QuestionnaireService,
    useValue: { load: vi.fn(() => of(emptyProfile("STARTUP"))) } }] });
  TestBed.inject(AuthStateStore).setUser({ id: "owner", nome: "Pessoa Fictícia", email: "owner@example.test", tipoUsuario: "STARTUP" });
});

async function ready(component: StartupProfileComponent, id: string) {
  await vi.waitFor(() => {
    expect(component.loading()).toBe(false); expect(component.publicationLoading()).toBe(false);
    expect(component.profile()?.id).toBe(id);
  });
}

it("preserves the selected project in the URL, questionnaire return link and reload", async () => {
  const harness = await RouterTestingHarness.create();
  const first = await harness.navigateByUrl("/startup/perfil", StartupProfileComponent); await ready(first, "a");
  await first.select("b");
  expect(TestBed.inject(Router).url).toBe("/startup/perfil?projeto=b");
  await harness.navigateByUrl("/startup/perfil/b/questionario", QuestionnaireComponent);
  await vi.waitFor(() => expect(harness.routeNativeElement?.querySelector(".back-link")?.getAttribute("href"))
    .toBe("/startup/perfil?projeto=b"));
  const returned = await harness.navigateByUrl("/startup/perfil?projeto=b", StartupProfileComponent); await ready(returned, "b");
  harness.fixture.detectChanges();
  expect((harness.routeNativeElement?.querySelector("#startup-selection") as HTMLSelectElement).value).toBe("b");
  expect(returned.canEdit()).toBe(false);
  await returned.load(); expect(returned.profile()?.id).toBe("b");
  expect(service.publication).toHaveBeenLastCalledWith("b");
});

it("handles browser back/forward when query changes reuse the same component", async () => {
  const harness = await RouterTestingHarness.create();
  const router = TestBed.inject(Router); router.setUpLocationChangeListener();
  const component = await harness.navigateByUrl("/startup/perfil?projeto=a", StartupProfileComponent); await ready(component, "a");
  const same = await harness.navigateByUrl("/startup/perfil?projeto=b", StartupProfileComponent); expect(same).toBe(component);
  await ready(component, "b"); expect(component.canEdit()).toBe(false);
  TestBed.inject(Location).back(); await ready(component, "a"); expect(component.canEdit()).toBe(true);
  TestBed.inject(Location).forward(); await ready(component, "b"); expect(component.canEdit()).toBe(false);
});

it.each(["response", "error"] as const)("discards a pending write's old %s before loading the history target", async outcome => {
  const harness = await RouterTestingHarness.create();
  const component = await harness.navigateByUrl("/startup/perfil?projeto=a", StartupProfileComponent); await ready(component, "a");
  const pending = new Subject<StartupPublication>(); service.setStatus.mockReturnValueOnce(pending);
  const saving = component.changeStatus("PUBLICADO");
  await harness.navigateByUrl("/startup/perfil?projeto=b", StartupProfileComponent);
  expect(component.profile()).toBeNull(); expect(component.busy()).toBe(true);
  expect(service.publication).not.toHaveBeenCalledWith("b");
  if (outcome === "response") { pending.next({ ...publication("a"), status: "PUBLICADO" }); pending.complete(); }
  else pending.error(new HttpErrorResponse({ status: 500 }));
  await saving; await ready(component, "b");
  expect(component.message()).toBe(""); expect(component.error()).toBe("");
  expect(component.canEdit()).toBe(false); expect(service.setStatus).toHaveBeenCalledOnce();
});

it("reloads the latest URL after a pending read without accepting its old publication", async () => {
  const harness = await RouterTestingHarness.create();
  const component = await harness.navigateByUrl("/startup/perfil?projeto=a", StartupProfileComponent); await ready(component, "a");
  const pending = new Subject<StartupPublication>(); service.publication.mockReturnValueOnce(pending);
  const reading = component.load();
  await vi.waitFor(() => expect(service.publication).toHaveBeenCalledTimes(2));
  await harness.navigateByUrl("/startup/perfil?projeto=b", StartupProfileComponent);
  pending.next({ ...publication("a"), status: "PUBLICADO" }); pending.complete();
  await reading; await ready(component, "b");
  expect(component.publication()?.status).toBe("RASCUNHO");
});

it("never treats an unknown query identifier as authorization and allows a valid selection", async () => {
  const harness = await RouterTestingHarness.create();
  const component = await harness.navigateByUrl("/startup/perfil?projeto=foreign", StartupProfileComponent);
  await vi.waitFor(() => expect(component.loading()).toBe(false));
  expect(component.profile()).toBeNull(); expect(component.error()).toContain("não está disponível");
  expect(service.publication).not.toHaveBeenCalled();
  await component.changeStatus("PUBLICADO"); expect(service.setStatus).not.toHaveBeenCalled();
  await component.select("a"); await ready(component, "a");
});
