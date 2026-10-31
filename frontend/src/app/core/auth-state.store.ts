import { Injectable, signal } from "@angular/core";

export interface CurrentUser {
  id: string;
  nome: string;
  email: string;
  tipoUsuario: "MENTOR" | "STARTUP" | "ADMIN";
}

@Injectable({ providedIn: "root" })
export class AuthStateStore {
  private readonly current = signal<CurrentUser | null>(null);
  private readonly sessionRevision = signal(0);
  readonly revision = this.sessionRevision.asReadonly();
  readonly user = this.current.asReadonly();
  readonly notice = signal("");

  setUser(user: CurrentUser | null): void {
    this.sessionRevision.update(value => value + 1);
    this.current.set(user);
    this.notice.set("");
  }
}
