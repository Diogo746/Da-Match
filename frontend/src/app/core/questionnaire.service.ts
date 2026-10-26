import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable, map, timeout } from "rxjs";
import { CITIES, ProfileDraft, ProfileKind, QUESTIONNAIRE_VERSION, questionnaireIsComplete } from "./profile.models";

export function readQuestionnaire(value: unknown, kind: ProfileKind): ProfileDraft {
  if (!value || typeof value !== "object") throw new Error("Respostas inválidas.");
  const data = value as Record<string, unknown>;
  const arrays = ["moments", "sectors", "topics", "audiences", "backgrounds"];
  if (data["questionnaireVersion"] !== QUESTIONNAIRE_VERSION || data["kind"] !== kind ||
      !arrays.every(key => Array.isArray(data[key]) && data[key].every(item => typeof item === "string") &&
        new Set(data[key]).size === data[key].length) ||
      typeof data["projectName"] !== "string" || data["projectName"].length > 60 ||
      typeof data["format"] !== "string" || typeof data["cadence"] !== "string" ||
      typeof data["cityId"] !== "string" || typeof data["accepting"] !== "boolean" ||
      !data["experience"] || typeof data["experience"] !== "object" || Array.isArray(data["experience"]) ||
      !Array.isArray(data["availability"]) || data["availability"].length > 21 ||
      !data["availability"].every(slot => slot && typeof slot === "object" &&
        typeof slot.day === "string" && typeof slot.period === "string") ||
      new Set(data["availability"].map(slot => slot.day + ":" + slot.period)).size !== data["availability"].length) {
    throw new Error("Respostas inválidas.");
  }
  const draft: ProfileDraft = {
    kind, projectName: data["projectName"], moments: [...data["moments"] as ProfileDraft["moments"]],
    sectors: [...data["sectors"] as ProfileDraft["sectors"]], topics: [...data["topics"] as ProfileDraft["topics"]],
    audiences: [...data["audiences"] as ProfileDraft["audiences"]], backgrounds: [...data["backgrounds"] as ProfileDraft["backgrounds"]],
    experience: { ...data["experience"] } as ProfileDraft["experience"],
    capacity: (data["capacity"] ?? "") as ProfileDraft["capacity"],
    format: data["format"] as ProfileDraft["format"], cadence: data["cadence"] as ProfileDraft["cadence"],
    cityId: data["cityId"], accepting: data["accepting"],
    availability: data["availability"].map(slot => ({ day: slot.day, period: slot.period })),
  };
  const keys = Object.keys(draft.experience);
  if (!questionnaireIsComplete(draft) ||
      (draft.cityId && !CITIES.some(city => city.id === draft.cityId)) ||
      (draft.format === "ONLINE" && draft.cityId) ||
      (kind === "STARTUP" ? keys.length > 0 || draft.capacity !== "" || !draft.accepting
        : draft.projectName !== "" || keys.length !== draft.topics.length || keys.some(key => !draft.topics.includes(key as ProfileDraft["topics"][number])))) {
    throw new Error("Respostas inválidas.");
  }
  return draft;
}

@Injectable({ providedIn: "root" })
export class QuestionnaireService {
  private readonly http = inject(HttpClient);

  load(kind: ProfileKind, id: string): Observable<ProfileDraft | null> {
    return this.http.get<unknown>(this.path(kind, id), { observe: "response" }).pipe(timeout(15000), map(response => {
      if (response.status === 204 && response.body === null) return null;
      if (response.status !== 200) throw new Error("Resposta inválida.");
      return readQuestionnaire(response.body, kind);
    }));
  }

  save(kind: ProfileKind, id: string, answers: ProfileDraft): Observable<ProfileDraft> {
    const validated = readQuestionnaire({ questionnaireVersion: QUESTIONNAIRE_VERSION, ...answers }, kind);
    return this.http.put<unknown>(this.path(kind, id), {
      questionnaireVersion: QUESTIONNAIRE_VERSION, ...validated, capacity: validated.capacity || null,
    }, { observe: "response" }).pipe(timeout(15000), map(response => {
      if (response.status !== 200) throw new Error("Resposta inválida.");
      return readQuestionnaire(response.body, kind);
    }));
  }

  private path(kind: ProfileKind, id: string): string {
    return `/api/v1/${kind === "MENTOR" ? "mentores" : "startups"}/${encodeURIComponent(id)}/perfil-match`;
  }
}
