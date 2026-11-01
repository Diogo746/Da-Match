import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TestBed } from "@angular/core/testing";
import { PALETTE_STORAGE_KEY, THEME_STORAGE_KEY, ThemeStore } from "./theme.store";

beforeEach(() => {
  TestBed.resetTestingModule();
  localStorage.clear();
  vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: false }));
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  TestBed.resetTestingModule();
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.removeAttribute("data-palette");
  document.documentElement.style.removeProperty("color-scheme");
});

describe("Preferência de tema", () => {
  it("começa no tema claro quando não há escolha nem preferência por escuro", () => {
    const theme = TestBed.inject(ThemeStore);
    expect(theme.mode()).toBe("light");
    expect(document.documentElement.dataset["theme"]).toBe("light");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it("acompanha a preferência inicial do dispositivo quando não há escolha salva", () => {
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: true }));
    const theme = TestBed.inject(ThemeStore);
    expect(theme.isDark()).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe("dark");
  });

  it.each(["light", "dark"] as const)("prioriza a escolha %s salva pelo participante", (mode) => {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: mode === "light" }));
    expect(TestBed.inject(ThemeStore).mode()).toBe(mode);
  });

  it("ignora uma preferência inválida e usa o dispositivo", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "invalid");
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: true }));
    expect(TestBed.inject(ThemeStore).mode()).toBe("dark");
  });

  it("continua alternando o tema quando o navegador bloqueia o armazenamento", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    const theme = TestBed.inject(ThemeStore);
    expect(() => theme.toggle()).not.toThrow();
    expect(theme.mode()).toBe("dark");
    expect(document.documentElement.dataset["theme"]).toBe("dark");
  });

  it("restaura a escolha em uma nova sessão do aplicativo e permite voltar ao claro", () => {
    TestBed.inject(ThemeStore).toggle();
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    TestBed.resetTestingModule();
    const restored = TestBed.inject(ThemeStore);
    expect(restored.mode()).toBe("dark");
    restored.toggle();
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    expect(document.documentElement.dataset["theme"]).toBe("light");
  });

  it("usa a paleta azul por padrão e aplica no documento", () => {
    const theme = TestBed.inject(ThemeStore);
    expect(theme.palette()).toBe("azul");
    expect(document.documentElement.dataset["palette"]).toBe("azul");
  });

  it("troca e persiste a paleta sem alterar claro/escuro", () => {
    const theme = TestBed.inject(ThemeStore);
    theme.toggle();
    theme.setPalette("verde");
    expect(document.documentElement.dataset["palette"]).toBe("verde");
    expect(theme.mode()).toBe("dark");
    expect(localStorage.getItem(PALETTE_STORAGE_KEY)).toBe("verde");
    TestBed.resetTestingModule();
    expect(TestBed.inject(ThemeStore).palette()).toBe("verde");
  });

  it("ignora paleta salva inválida", () => {
    localStorage.setItem(PALETTE_STORAGE_KEY, "laranja");
    expect(TestBed.inject(ThemeStore).palette()).toBe("azul");
  });
});
