import { DOCUMENT, Injectable, computed, inject, signal } from "@angular/core";

export type ThemeMode = "light" | "dark";
export const THEME_STORAGE_KEY = "damatch.theme";

@Injectable({ providedIn: "root" })
export class ThemeStore {
  private readonly document = inject(DOCUMENT);
  private readonly current = signal<ThemeMode>(this.initialMode());
  readonly mode = this.current.asReadonly();
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
    this.document.documentElement.style.colorScheme = this.mode();
  }
}
