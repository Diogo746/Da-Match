import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, signal, untracked } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { AuthStateStore } from "../../core/auth-state.store";
import { SavedProfilesService, savedTarget } from "../../core/saved-profiles.service";

interface ButtonState {
  key: string;
  saved: boolean | null;
  waiting: boolean;
  error?: string;
}

@Component({
  selector: "app-saved-profile-button",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (current(); as status) {
      @if (status.saved !== null) {
        <button class="button button-secondary" type="button" [disabled]="status.waiting" (click)="toggle()">
          {{ status.saved ? 'Remover dos salvos' : 'Salvar perfil' }}
        </button>
      }
      @if (status.waiting) { <output>Consultando seus salvos…</output> }
      @if (status.error) {
        <p role="alert">{{ status.error }}</p>
        <button class="text-button" type="button" (click)="refresh()">Conferir estado do favorito</button>
      }
    }
  `,
  styles: [`:host { display: block; margin-block: 16px; } output { display: block; margin-block: 8px; }`],
})
export class SavedProfileButtonComponent {
  readonly profileId = input.required<string>();
  private readonly auth = inject(AuthStateStore);
  private readonly api = inject(SavedProfilesService);
  private readonly destroy = inject(DestroyRef);
  private readonly key = computed(() => savedTarget(this.auth.user()?.tipoUsuario)
    ? `${this.auth.revision()}:${this.profileId()}` : null);
  private readonly status = signal<ButtonState | null>(null);
  readonly current = computed(() => this.status()?.key === this.key() ? this.status() : null);
  private revision = 0;

  constructor() {
    effect(() => {
      const key = this.key();
      if (key) untracked(() => void this.refresh());
    });
  }

  async refresh(): Promise<void> {
    const key = this.key();
    if (!key) return;
    const id = this.profileId();
    const revision = ++this.revision;
    this.status.set({ key, saved: null, waiting: true });
    try {
      const saved = await firstValueFrom(this.api.status(id));
      if (this.isCurrent(key, revision)) this.status.set({ key, saved, waiting: false });
    } catch {
      if (this.isCurrent(key, revision)) this.failed(key, "Não foi possível consultar seus salvos.");
    }
  }

  async toggle(): Promise<void> {
    const status = this.current();
    if (typeof status?.saved !== "boolean" || status.waiting) return;
    const id = this.profileId();
    const revision = ++this.revision;
    const saved = !status.saved;
    this.status.set({ ...status, waiting: true });
    try {
      await firstValueFrom(this.api.set(id, saved));
      if (this.isCurrent(status.key, revision)) this.status.set({ key: status.key, saved, waiting: false });
    } catch {
      if (this.isCurrent(status.key, revision)) this.failed(status.key, "Não foi possível confirmar a alteração. Confira o estado antes de tentar de novo.");
    }
  }

  private isCurrent(key: string, revision: number): boolean {
    return !this.destroy.destroyed && key === this.key() && revision === this.revision;
  }

  private failed(key: string, error: string): void {
    this.status.set({ key, saved: null, waiting: false, error });
  }
}
