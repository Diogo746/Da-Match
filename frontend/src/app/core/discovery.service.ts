import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable, defer, map, throwError, timeout } from "rxjs";
import { REGISTRATION_MODE } from "./registration.config";
import { ProfileKind } from "./profile.models";
import { DiscoveryPage, DiscoveryProfile, DiscoveryQuery, discoveryParams, isDiscoveryId,
  readDiscoveryPage, readDiscoveryProfile } from "./discovery.models";

@Injectable({ providedIn: "root" })
export class DiscoveryService {
  private readonly http = inject(HttpClient);
  private readonly mode = inject(REGISTRATION_MODE);
  list(kind: ProfileKind, query: DiscoveryQuery): Observable<DiscoveryPage> {
    return this.api(() => this.http.get<unknown>(this.path(kind), { params: new HttpParams({ fromObject: discoveryParams(query) }) })
      .pipe(map(value => readDiscoveryPage(value, kind, query))));
  }
  detail(kind: ProfileKind, id: string): Observable<DiscoveryProfile> {
    return this.api(() => isDiscoveryId(id)
      ? this.http.get<unknown>(`${this.path(kind)}/${encodeURIComponent(id)}`).pipe(map(value => readDiscoveryProfile(value, kind, id)))
      : throwError(() => new Error("Perfil inválido.")));
  }
  private path(kind: ProfileKind): string {
    if (kind !== "MENTOR" && kind !== "STARTUP") throw new Error("Tipo inválido.");
    return `/api/v1/descoberta/${kind === "MENTOR" ? "mentores" : "startups"}`;
  }
  private api<T>(work: () => Observable<T>): Observable<T> {
    return defer(() => this.mode === "API" ? work() : throwError(() => new Error("Catálogo real indisponível na demonstração.")))
      .pipe(timeout(15000));
  }
}
