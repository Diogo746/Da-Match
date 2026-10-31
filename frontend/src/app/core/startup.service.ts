import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable, map, timeout } from "rxjs";
import { StartupProfile, StartupRegistrationDetails, normalizeStartupDetails, readStartupProfile } from "./startup.models";
import { StartupPublication, StartupPublicationStatus, readStartupPublication } from "./startup-publication.models";

@Injectable({ providedIn: "root" })
export class StartupService {
  private readonly http = inject(HttpClient);

  publication(id: string): Observable<StartupPublication> {
    return this.http.get<unknown>(`/api/v1/startups/${encodeURIComponent(id)}/status`)
      .pipe(timeout(15000), map(value => readStartupPublication(value, id)));
  }

  setStatus(id: string, status: StartupPublicationStatus): Observable<StartupPublication> {
    return this.http.patch<unknown>(`/api/v1/startups/${encodeURIComponent(id)}/status`, { status })
      .pipe(timeout(15000), map(value => {
        const result = readStartupPublication(value, id);
        if (result.status !== status || !result.podeGerenciar || status === "PUBLICADO" && !result.aptoParaPublicacao) {
          throw new Error("Publicação não confirmada.");
        }
        return result;
      }));
  }

  mine(): Observable<StartupProfile[]> {
    return this.http.get<unknown>("/api/v1/startups/me").pipe(timeout(15000), map(value => {
      if (!Array.isArray(value)) throw new Error("Resposta de startups inválida.");
      return value.map(readStartupProfile);
    }));
  }

  update(id: string, details: StartupRegistrationDetails): Observable<StartupProfile> {
    return this.http.patch<unknown>(`/api/v1/startups/${encodeURIComponent(id)}`, normalizeStartupDetails(details))
      .pipe(timeout(15000), map(readStartupProfile));
  }
}
