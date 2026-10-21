import { HttpBackend, HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable, defer, finalize, map, of, shareReplay, tap, timeout } from "rxjs";
import { API_BASE_URL } from "./auth.config";

@Injectable({ providedIn: "root" })
export class CsrfService {
  private readonly http = new HttpClient(inject(HttpBackend));
  private readonly baseUrl = inject(API_BASE_URL);
  private token: string | null = null;
  private pending?: Observable<string>;

  clear(): void {
    this.token = null;
    this.pending = undefined;
  }

  getToken(): Observable<string> {
    return defer(() => {
      if (this.token) return of(this.token);
      this.pending ??= this.http.get<unknown>(`${this.baseUrl}/csrf`, { withCredentials: true }).pipe(
        timeout(15000),
        map((value) => {
          if (!value || typeof value !== "object" || !("headerName" in value) || value.headerName !== "X-XSRF-TOKEN" ||
              !("token" in value) || typeof value.token !== "string" || !value.token.trim()) {
            throw new Error("Não foi possível obter a proteção do envio.");
          }
          return value.token;
        }),
        tap((token) => { this.token = token; }),
        finalize(() => { this.pending = undefined; }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
      return this.pending;
    });
  }
}
