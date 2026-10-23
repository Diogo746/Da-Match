import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable, map, timeout } from "rxjs";
import { StartupProfile, StartupRegistrationDetails, normalizeStartupDetails, readStartupProfile } from "./startup.models";

@Injectable({ providedIn: "root" })
export class StartupService {
  private readonly http = inject(HttpClient);

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
