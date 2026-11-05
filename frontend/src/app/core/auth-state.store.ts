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

  confirmUser(user: CurrentUser): void {
    const current = this.current();
    if (current?.id === user.id && current.nome === user.nome && current.email === user.email &&
        current.tipoUsuario === user.tipoUsuario) return;
    this.setUser(user);
  }

  setUser(user: CurrentUser | null): void {
    this.sessionRevision.update(value => value + 1);
    this.current.set(user);
    this.notice.set("");
  }
}
