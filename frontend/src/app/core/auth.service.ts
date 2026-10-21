import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable, defer, map, switchMap, tap, throwError, timeout } from "rxjs";
import { AuthStateStore, CurrentUser } from "./auth-state.store";
import { CsrfService } from "./csrf.service";
import { REGISTRATION_MODE } from "./registration.config";

function readUser(value: unknown): CurrentUser {
  if (!value || typeof value !== "object") throw new Error("Resposta de autenticação inválida.");
  const data = value as Record<string, unknown>;
  if (!["id", "nome", "email"].every((key) => typeof data[key] === "string" && data[key]) ||
      !["MENTOR", "STARTUP", "ADMIN"].includes(String(data["tipoUsuario"]))) {
    throw new Error("Resposta de autenticação inválida.");
  }
  return { id: data["id"] as string, nome: data["nome"] as string, email: data["email"] as string,
    tipoUsuario: data["tipoUsuario"] as CurrentUser["tipoUsuario"] };
}

@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly csrf = inject(CsrfService);
  private readonly state = inject(AuthStateStore);
  private readonly mode = inject(REGISTRATION_MODE);

  login(email: string, senha: string): Observable<CurrentUser> {
    return this.api(() => {
      this.csrf.clear();
      return this.csrf.getToken().pipe(
        switchMap((token) => this.http.post<unknown>("/api/v1/auth/login", { email: email.trim(), senha },
          { headers: { "X-XSRF-TOKEN": token } })),
        map(readUser),
        tap((user) => this.state.setUser(user)),
        switchMap((user) => {
          this.csrf.clear();
          return this.csrf.getToken().pipe(map(() => user));
        }),
      );
    });
  }

  me(): Observable<CurrentUser> {
    return this.api(() => this.http.get<unknown>("/api/v1/auth/me").pipe(
      map(readUser), tap((user) => this.state.setUser(user)),
    ));
  }

  logout(): Observable<void> {
    return this.api(() => this.http.post<void>("/api/v1/auth/logout", null).pipe(
      tap(() => { this.state.setUser(null); this.csrf.clear(); }),
      switchMap(() => this.csrf.getToken()),
      map(() => undefined),
    ));
  }

  private api<T>(work: () => Observable<T>): Observable<T> {
    return defer(() => this.mode === "API" ? work() :
      throwError(() => new Error("A demonstração não autentica contas reais."))).pipe(timeout(15000));
  }
}
