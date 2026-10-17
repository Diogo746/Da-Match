import "@angular/compiler";
import { describe, it, expect, afterEach } from "vitest";
import {
  Injector,
  createEnvironmentInjector,
  runInInjectionContext,
  EnvironmentInjector,
} from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { ExploreComponent } from "./explore.component";
import { ProfilesStore } from "../../core/profiles.store";
let injector: EnvironmentInjector;
function create(savedOnly = false) {
  const store = new ProfilesStore();
  injector = createEnvironmentInjector(
    [
      { provide: ProfilesStore, useValue: store },
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { data: { savedOnly } } },
      },
    ],
    Injector.NULL as EnvironmentInjector,
  );
  return {
    store,
    component: runInInjectionContext(injector, () => new ExploreComponent()),
  };
}
afterEach(() => injector?.destroy());
describe("Descoberta de perfis fictícios", () => {
  it("combina tipo, setor e cidade", () => {
    const { component } = create();
    component.kind.set("MENTOR");
    component.sector.set("Tecnologia");
    component.city.set("Recife");
    expect(component.visibleProfiles().map((p) => p.id)).toEqual([
      "mentor-1",
      "mentor-2",
    ]);
  });
  it("busca sem diferença de acento ou caixa e admite resultado vazio", () => {
    const { component } = create();
    component.search.set(" ANDRE ");
    expect(component.visibleProfiles().some((p) => p.id === "mentor-4")).toBe(
      true,
    );
    component.search.set("texto sem nenhum resultado");
    expect(component.visibleProfiles()).toEqual([]);
  });
  it("mantém os salvos durante a navegação e remove da lista ao desfazer", () => {
    const { component, store } = create(true);
    expect(component.visibleProfiles()).toEqual([]);
    store.toggleSaved("startup-1");
    expect(component.visibleProfiles().map((p) => p.id)).toEqual(["startup-1"]);
    store.toggleSaved("startup-1");
    expect(component.visibleProfiles()).toEqual([]);
  });
  it("mostra somente startups em ideação na categoria de startups", () => {
    const { component } = create();
    component.setKind("STARTUP");
    expect(component.visibleProfiles()).toHaveLength(2);
    expect(
      component
        .visibleProfiles()
        .every(
          (profile) =>
            profile.kind === "STARTUP" && profile.stage === "Ideação",
        ),
    ).toBe(true);
    expect(component.count("TODOS")).toBe(6);
  });
  it("limpa filtros sem apagar perfis salvos", () => {
    const { component, store } = create();
    store.toggleSaved("mentor-1");
    component.city.set("Salvador");
    component.search.set("andre");
    component.clearFilters();
    expect(component.visibleProfiles()).toHaveLength(4);
    expect(store.isSaved("mentor-1")).toBe(true);
  });
});

describe("Interações de descoberta", () => {
  it("seleciona tipo, atualiza filtro e conta salvos", () => {
    const { component, store } = create(true);
    store.toggleSaved("mentor-1");
    store.toggleSaved("startup-1");
    component.setKind("STARTUP");
    component.updateFilter(
      { target: { value: "Recife" } } as unknown as Event,
      "city",
    );
    expect(component.count("TODOS")).toBe(2);
    expect(component.visibleProfiles().map((p) => p.id)).toEqual(["startup-1"]);
  });
  it("anuncia inclusão e remoção de um perfil e ignora IDs inexistentes", () => {
    const { component, store } = create();
    const profile = store.profiles[0];
    component.toggleSaved(profile);
    expect(component.announcement()).toContain("perfil salvo");
    component.toggleSaved(profile);
    expect(component.announcement()).toContain("removido");
    store.toggleSaved("nao-existe");
    expect(store.savedIds()).toEqual([]);
  });
  it("ordena os resultados por nome e identificador", () => {
    const { component } = create();
    expect(component.visibleProfiles().map((p) => p.name)).toEqual([
      "André Monteiro",
      "Camila Duarte",
      "Marina Albuquerque",
      "Rafael Nascimento",
    ]);
  });
});
