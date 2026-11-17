import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable, defer, map, throwError, timeout } from "rxjs";
import { API_REQUEST_TIMEOUT_MS } from "./api-timeout";
import { DiscoveryProfile, isDiscoveryId, readDiscoveryProfile } from "./discovery.models";
import { ProfileKind } from "./profile.models";
import { REGISTRATION_MODE } from "./registration.config";

export interface Recommendation { perfil: DiscoveryProfile; superDamatch: boolean; agendaEmComum: boolean; }
export interface Recommendations {
  perfilOrigemId: string; tipoOrigem: ProfileKind; versaoRegra: "damatch-mentoria-v1";
  calculadoEm: string; perfilElegivel: boolean; pendencias: { campo: string; mensagem: string }[];
  itens: Recommendation[];
}
function valid(condition: boolean): asserts condition {
  if (!condition) throw new Error("Resposta de recomendações inválida.");
}
function object(value: unknown, keys: string[]): Record<string, unknown> {
  valid(!!value && typeof value === "object" && !Array.isArray(value));
  const result = value as Record<string, unknown>;
  valid(Object.keys(result).length === keys.length && keys.every(key => Object.hasOwn(result, key)));
  return result;
}
export function readRecommendations(value: unknown, kind: ProfileKind, origin: string): Recommendations {
  const data = object(value, ["perfilOrigemId", "tipoOrigem", "versaoRegra", "calculadoEm", "perfilElegivel", "pendencias", "itens"]);
  valid(isDiscoveryId(origin) && data["perfilOrigemId"] === origin && data["tipoOrigem"] === kind &&
    data["versaoRegra"] === "damatch-mentoria-v1" && typeof data["perfilElegivel"] === "boolean");
  const date = data["calculadoEm"];
  valid(typeof date === "string" && /^\d{4}-\d\d-\d\dT.+Z$/.test(date) && Number.isFinite(Date.parse(date)));
  valid(Array.isArray(data["itens"]) && data["itens"].length <= 20 && Array.isArray(data["pendencias"]));
  const target = kind === "STARTUP" ? "MENTOR" : "STARTUP";
  const itens = data["itens"].map(value => {
    const item = object(value, ["perfil", "superDamatch", "agendaEmComum"]);
    valid(typeof item["superDamatch"] === "boolean" && typeof item["agendaEmComum"] === "boolean" &&
      (!item["superDamatch"] || item["agendaEmComum"]));
    return { perfil: readDiscoveryProfile(item["perfil"], target),
      superDamatch: item["superDamatch"], agendaEmComum: item["agendaEmComum"] } as Recommendation;
  });
  const pendencias = data["pendencias"].map(value => {
    const item = object(value, ["campo", "mensagem"]);
    valid(typeof item["campo"] === "string" && item["campo"].length > 0 && item["campo"].length <= 60 &&
      typeof item["mensagem"] === "string" && item["mensagem"].length > 0 && item["mensagem"].length <= 255);
    return { campo: item["campo"], mensagem: item["mensagem"] } as { campo: string; mensagem: string };
  });
  valid(new Set(itens.map(item => item.perfil.id)).size === itens.length &&
    (data["perfilElegivel"] ? pendencias.length === 0 : itens.length === 0 && pendencias.length > 0));
  return { perfilOrigemId: origin, tipoOrigem: kind, versaoRegra: "damatch-mentoria-v1", calculadoEm: date,
    perfilElegivel: data["perfilElegivel"], pendencias, itens };
}

@Injectable({ providedIn: "root" })
export class RecommendationsService {
  private readonly http = inject(HttpClient);
  private readonly mode = inject(REGISTRATION_MODE);

  list(kind: ProfileKind, origin: string): Observable<Recommendations> {
    return defer(() => {
      if (this.mode !== "API" || !isDiscoveryId(origin) || !["STARTUP", "MENTOR"].includes(kind)) {
        return throwError(() => new Error("Contexto de recomendações inválido."));
      }
      const path = kind === "STARTUP" ? `/api/v1/startups/${encodeURIComponent(origin)}/recomendacoes`
        : "/api/v1/mentores/me/recomendacoes";
      return this.http.get<unknown>(path).pipe(map(value => readRecommendations(value, kind, origin)));
    }).pipe(timeout(API_REQUEST_TIMEOUT_MS));
  }
}
