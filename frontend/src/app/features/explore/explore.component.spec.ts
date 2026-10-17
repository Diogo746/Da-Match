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
import { ProfileSessionStore } from "../../core/profile-session.store";
import { ProfileDraft } from "../../core/profile.models";
let injector: EnvironmentInjector;
function create(savedOnly = false) {
  const store = new ProfilesStore();
  injector = createEnvironmentInjector(
    [
      { provide: ProfilesStore, useValue: store },
      ProfileSessionStore,
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
    expect(component.visibleProfiles()).toHaveLength(4);
    expect(
      component
        .visibleProfiles()
        .every(
          (profile) =>
            profile.kind === "STARTUP" && profile.stage === "Ideação",
        ),
    ).toBe(true);
    expect(component.count("TODOS")).toBe(10);
  });
  it("limpa filtros sem apagar perfis salvos", () => {
    const { component, store } = create();
    store.toggleSaved("mentor-1");
    component.city.set("Salvador");
    component.search.set("andre");
    component.clearFilters();
    expect(component.visibleProfiles()).toHaveLength(6);
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
      "Beatriz Lima",
      "Camila Duarte",
      "Lucas Azevedo",
      "Marina Albuquerque",
      "Rafael Nascimento",
    ]);
  });
});

const startupAnswers: ProfileDraft = { kind: "STARTUP", projectName: "Ideia Teste", sectors: ["TECH"], topics: ["VALIDATION", "PRICING"], format: "ONLINE", cityId: "", days: ["THU"], periods: ["EVENING"], accepting: true };
describe("Indicações personalizadas na home", () => {
  it("ordena mentores compatíveis por pontuação e explica o resultado", () => {
    const { component } = create();
    component.session.save("Maria Teste", startupAnswers);
    expect(component.personalized()).toBe(true);
    expect(component.visibleProfiles().every((profile) => profile.kind === "MENTOR")).toBe(true);
    const scores = component.visibleProfiles().map((profile) => component.matchFor(profile)!.score!);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
    expect(scores[0]).toBe(80);
  });
  it("permite explorar o catálogo e voltar às indicações", () => {
    const { component } = create();
    component.session.save("Maria Teste", startupAnswers);
    component.setKind("TODOS");
    expect(component.visibleProfiles()).toHaveLength(10);
    component.search.set("inexistente"); component.showRecommendations();
    expect(component.personalized()).toBe(true);
    expect(component.search()).toBe("");
  });
  it("recalcula quando o perfil é editado sem precisar de outro cadastro", () => {
    const { component } = create();
    component.session.save("Maria Teste", startupAnswers);
    const before = component.visibleProfiles().map((profile) => profile.id);
    component.session.save("Maria Teste", { ...startupAnswers, format: "PRESENCIAL", cityId: "PE_OLINDA" });
    expect(component.visibleProfiles()).toEqual([]);
    expect(before.length).toBeGreaterThan(0);
  });
  it("mostra startups para o mentor e respeita a pausa para novas mentorias", () => {
    const { component } = create();
    component.session.save("Maria Mentora", { ...startupAnswers, kind: "MENTOR" });
    expect(component.visibleProfiles().length).toBeGreaterThan(0);
    expect(component.visibleProfiles().every((profile) => profile.kind === "STARTUP")).toBe(true);
    component.session.save("Maria Mentora", { ...startupAnswers, kind: "MENTOR", accepting: false });
    expect(component.visibleProfiles()).toEqual([]);
  });
  it("mantém os salvos acessíveis mesmo quando as preferências mudam", () => {
    const { component, store } = create(true);
    store.toggleSaved("mentor-5");
    component.session.save("Maria Teste", startupAnswers);
    expect(component.visibleProfiles().map((profile) => profile.id)).toEqual(["mentor-5"]);
    expect(component.matchFor(store.profiles.find((profile) => profile.id === "mentor-5")!)!.eligible).toBe(false);
  });
  it("mostra uma indicação parcial sem inventar porcentagem e reinicia ao limpar o perfil", () => {
    const { component } = create();
    component.session.save("Maria Teste", { ...startupAnswers, sectors: ["DISCOVERING"] });
    expect(component.visibleProfiles().length).toBeGreaterThan(0);
    expect(component.visibleProfiles().every((profile) => component.matchFor(profile)!.score === null)).toBe(true);
    component.session.clear();
    expect(component.personalized()).toBe(false);
    expect(component.matches().size).toBe(0);
  });
});
