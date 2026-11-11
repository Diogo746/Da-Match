import { API_REQUEST_TIMEOUT_MS } from "./api-timeout";
import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable, map, timeout } from "rxjs";
import { MentorAvailability, MentorProfile, MentorStatus, readMentorProfile } from "./mentor.models";

export interface UpdateMentorProfile {
  biografia: string;
  linkedin: string;
  instagram: string;
  site: string;
  disponibilidades: MentorAvailability[];
}

@Injectable({ providedIn: "root" })
export class MentorService {
  private readonly http = inject(HttpClient);

  me(): Observable<MentorProfile> {
    return this.http.get<unknown>("/api/v1/mentores/me").pipe(timeout(API_REQUEST_TIMEOUT_MS), map(readMentorProfile));
  }

  update(id: string, body: UpdateMentorProfile): Observable<MentorProfile> {
    return this.http.patch<unknown>(`/api/v1/mentores/${encodeURIComponent(id)}`, body)
      .pipe(timeout(API_REQUEST_TIMEOUT_MS), map(readMentorProfile));
  }

  setStatus(id: string, status: MentorStatus): Observable<MentorProfile> {
    return this.http.patch<unknown>(`/api/v1/mentores/${encodeURIComponent(id)}/status`, { status })
      .pipe(timeout(API_REQUEST_TIMEOUT_MS), map(readMentorProfile));
  }
}
