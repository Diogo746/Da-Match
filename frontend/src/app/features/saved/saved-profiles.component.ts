import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal, untracked } from "@angular/core";
import { RouterLink } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { AuthStateStore } from "../../core/auth-state.store";
import { cityLabel, sectorLabel, topicLabel } from "../../core/profile.models";
import { SavedPage, SavedProfilesService, savedTarget } from "../../core/saved-profiles.service";

interface ListView {
  account: number;
  page: number;
  busy: boolean;
  data: SavedPage | null;
  error?: string;
}

@Component({
  selector: "app-saved-profiles",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: "./saved-profiles.component.html",
  styleUrls: ["../explore/api-discovery.component.css", "./saved-profiles.component.css"],
})
export class SavedProfilesComponent {
  private readonly auth = inject(AuthStateStore);
  private readonly api = inject(SavedProfilesService);
  private readonly destroy = inject(DestroyRef);
  private readonly view = signal<ListView | null>(null);
  readonly target = computed(() => savedTarget(this.auth.user()?.tipoUsuario));
  readonly current = computed(() => this.view()?.account === this.auth.revision() ? this.view() : null);
  readonly cityLabel = cityLabel;
  readonly sectorLabel = sectorLabel;
  readonly topicLabel = topicLabel;
  private revision = 0;

  constructor() {
    effect(() => {
      this.auth.revision();
      if (this.target()) untracked(() => void this.load(0));
    });
  }

  async load(page: number): Promise<void> {
    const target = this.target();
    if (!target) return;
    const account = this.auth.revision();
    const revision = ++this.revision;
    this.view.set({ account, page, busy: true, data: null });
    try {
      const data = await firstValueFrom(this.api.list(target, page));
      if (!this.isCurrent(account, revision)) return;
      const last = Math.max(0, data.totalPaginas - 1);
      if (page > last) {
        await this.load(last);
        return;
      }
      this.view.set({ account, page, busy: false, data });
    } catch {
      if (this.isCurrent(account, revision)) this.failed(account, page, "Não foi possível consultar seus salvos.");
    }
  }

  async remove(id: string): Promise<void> {
    const view = this.current();
    if (!view || view.busy || !view.data?.itens.some(item => item.perfilId === id)) return;
    const { account, page } = view;
    const revision = ++this.revision;
    this.view.set({ ...view, busy: true });
    try {
      await firstValueFrom(this.api.set(id, false));
      if (this.isCurrent(account, revision)) await this.load(page);
    } catch {
      if (this.isCurrent(account, revision)) this.failed(account, page, "Não foi possível confirmar a remoção. Atualize a lista para conferir.");
    }
  }

  private isCurrent(account: number, revision: number): boolean {
    return !this.destroy.destroyed && account === this.auth.revision() && revision === this.revision;
  }

  private failed(account: number, page: number, error: string): void {
    this.view.set({ account, page, busy: false, data: null, error });
  }
}
