import { Injectable, computed, inject, signal } from "@angular/core";
import { AuthStateStore } from "./auth-state.store";
import { TeamOperation } from "./startup-team.models";

// Keep an unresolved operation across navigation in this session. Never persist emails in browser storage.
@Injectable({ providedIn: "root" })
export class StartupTeamPendingStore {
  private readonly auth = inject(AuthStateStore);
  private readonly record = signal<{ session: number; operations: Record<string, TeamOperation> }>({ session: -1, operations: {} });
  readonly operations = computed(() => this.record().session === this.auth.revision() ? this.record().operations : {});

  get(key: string): TeamOperation | null { return this.operations()[key] ?? null; }

  set(key: string, operation: TeamOperation): void {
    this.record.set({ session: this.auth.revision(), operations: { ...this.operations(), [key]: operation } });
  }

  clear(key: string): void {
    const operations = { ...this.operations() };
    delete operations[key];
    this.record.set({ session: this.auth.revision(), operations });
  }
}
