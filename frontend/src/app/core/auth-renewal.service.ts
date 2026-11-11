import { API_REQUEST_TIMEOUT_MS } from "./api-timeout";
import { HttpBackend, HttpClient, HttpErrorResponse, HttpHeaders } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable, catchError, defer, finalize, map, of, shareReplay, switchMap, throwError, timeout } from "rxjs";
import { API_BASE_URL } from "./auth.config";
import { AuthStateStore } from "./auth-state.store";
import { CsrfService } from "./csrf.service";

@Injectable({ providedIn: "root" })
export class AuthRenewalService {
  private readonly http = new HttpClient(inject(HttpBackend));
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly state = inject(AuthStateStore);
  private readonly csrf = inject(CsrfService);
  private revision = -1;
  private expiresAt = 0;
  private jwt = false;
  private uncertain = false;
  private pending?: { revision: number; request: Observable<void> };

  accept(headers: HttpHeaders): void {
    const expiry = Date.parse(headers.get("X-Auth-Expires-At") ?? "");
    this.jwt = headers.get("X-Auth-Mode") === "JWT";
    this.expiresAt = Number.isFinite(expiry) ? expiry : 0;
    this.revision = this.state.revision();
    this.uncertain = false;
  }

  beforeRequest(path: string): Observable<void> {
    if (this.revision !== this.state.revision() || !this.jwt || !this.state.user() ||
        path === "/csrf" || path.startsWith("/csrf?") || path.startsWith("/api/v1/auth/") ||
        this.expiresAt - Date.now() > 60_000) return of(undefined);
    return this.refresh();
  }

  canRecover(method: string, headers: HttpHeaders): boolean {
    return method === "GET" && headers.get("X-Auth-Mode") === "JWT" &&
      !(this.revision === this.state.revision() && this.uncertain);
  }

  refresh(): Observable<void> {
    return defer(() => {
      const revision = this.state.revision();
      if (this.revision === revision && this.uncertain) {
        return throwError(() => new Error("A renovação não foi confirmada. Confira sua sessão ou entre novamente."));
      }
      if (this.pending?.revision === revision) return this.pending.request;
      const request = this.csrf.getToken().pipe(
        switchMap(token => {
          this.checkRevision(revision);
          return this.http.post<void>(`${this.baseUrl}/api/v1/auth/refresh`, null, {
            observe: "response", withCredentials: true, headers: { "X-XSRF-TOKEN": token },
          });
        }),
        timeout(API_REQUEST_TIMEOUT_MS),
        map(response => {
          this.checkRevision(revision);
          if (response.status !== 204 || response.headers.get("X-Auth-Mode") !== "JWT" ||
              !Number.isFinite(Date.parse(response.headers.get("X-Auth-Expires-At") ?? ""))) {
            throw new Error("Não foi possível confirmar a renovação da sessão.");
          }
          this.accept(response.headers);
        }),
        catchError((error: unknown) => {
          if (revision === this.state.revision()) {
            this.revision = revision;
            this.uncertain = !(error instanceof HttpErrorResponse && [401, 403].includes(error.status));
          }
          return throwError(() => error);
        }),
        finalize(() => { if (this.pending?.revision === revision) this.pending = undefined; }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
      this.pending = { revision, request };
      return request;
    });
  }

  private checkRevision(revision: number): void {
    if (revision !== this.state.revision()) throw new Error("A sessão mudou durante a renovação.");
  }
}
