import { DOCUMENT, Injectable, computed, inject, signal } from "@angular/core";

export type ThemeMode = "light" | "dark";
export type PaletteName = "azul" | "roxo" | "verde";
export const THEME_STORAGE_KEY = "damatch.theme";
export const PALETTE_STORAGE_KEY = "damatch.palette";
export const PALETTES: ReadonlyArray<{ id: PaletteName; label: string }> = [
  { id: "azul", label: "Azul" },
  { id: "roxo", label: "Roxo" },
  { id: "verde", label: "Verde" },
];

@Injectable({ providedIn: "root" })
export class ThemeStore {
  private readonly document = inject(DOCUMENT);
  private readonly current = signal<ThemeMode>(this.initialMode());
  readonly mode = this.current.asReadonly();
  private readonly currentPalette = signal<PaletteName>(this.initialPalette());
  readonly palette = this.currentPalette.asReadonly();
  readonly palettes = PALETTES;
  readonly isDark = computed(() => this.mode() === "dark");

  constructor() { this.apply(); }

  toggle(): void {
    this.current.set(this.isDark() ? "light" : "dark");
    this.apply();
    try {
      this.document.defaultView?.localStorage.setItem(THEME_STORAGE_KEY, this.mode());
    } catch {
      // A escolha continua funcionando na sessão se o navegador bloquear o armazenamento.
    }
  }

  setPalette(palette: PaletteName): void {
    if (!PALETTES.some((p) => p.id === palette)) return;
    this.currentPalette.set(palette);
    this.apply();
    try {
      this.document.defaultView?.localStorage.setItem(PALETTE_STORAGE_KEY, palette);
    } catch {
      // A escolha continua funcionando na sessão se o navegador bloquear o armazenamento.
    }
  }

  private initialPalette(): PaletteName {
    try {
      const saved = this.document.defaultView?.localStorage.getItem(PALETTE_STORAGE_KEY);
      if (PALETTES.some((p) => p.id === saved)) return saved as PaletteName;
    } catch {
      // Sem preferência legível, usamos a paleta padrão do site.
    }
    return "azul";
  }

  private initialMode(): ThemeMode {
    const browser = this.document.defaultView;
    try {
      const saved = browser?.localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === "light" || saved === "dark") return saved;
    } catch {
      // Sem preferência legível, usamos a preferência inicial do dispositivo.
    }
    return browser?.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  private apply(): void {
    this.document.documentElement.dataset["theme"] = this.mode();
    this.document.documentElement.dataset["palette"] = this.palette();
    this.document.documentElement.style.colorScheme = this.mode();
  }
}
