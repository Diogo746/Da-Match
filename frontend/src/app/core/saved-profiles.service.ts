import { HttpClient, HttpParams, HttpResponse } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { defer, map, Observable, timeout } from "rxjs";
import { API_REQUEST_TIMEOUT_MS } from "./api-timeout";
import { DiscoveryProfile, isDiscoveryId, readDiscoveryProfile } from "./discovery.models";
import { ProfileKind } from "./profile.models";
import { REGISTRATION_MODE } from "./registration.config";

const ROOT = "/api/v1/salvos";
export const SAVED_PAGE_SIZE = 20;

export interface SavedProfile {
  perfilId: string;
  salvoEm: string;
  perfil: DiscoveryProfile | null;
}

export interface SavedPage {
  itens: SavedProfile[];
  pagina: number;
  totalPaginas: number;
}

export function savedTarget(role: string | undefined): ProfileKind | null {
  if (role === "MENTOR") return "STARTUP";
  return role === "STARTUP" ? "MENTOR" : null;
}

function contract(condition: unknown): asserts condition {
  if (!condition) throw new Error("Resposta de perfis salvos inválida.");
}

function fields(value: unknown, keys: string[]): Record<string, unknown> {
  contract(value && typeof value === "object" && !Array.isArray(value));
  const entry = value as Record<string, unknown>;
  contract(Object.keys(entry).length === keys.length && keys.every(key => Object.hasOwn(entry, key)));
  return entry;
}

function savedItem(value: unknown, target: ProfileKind): SavedProfile {
  const { perfilId, salvoEm, perfil } = fields(value, ["perfilId", "salvoEm", "perfil"]);
  contract(typeof perfilId === "string" && isDiscoveryId(perfilId)
    && typeof salvoEm === "string" && Number.isFinite(Date.parse(salvoEm)));
  return { perfilId, salvoEm, perfil: perfil === null ? null : readDiscoveryProfile(perfil, target, perfilId) };
}

function savedPage(value: unknown, target: ProfileKind, requestedPage: number): SavedPage {
  const { itens, pagina, tamanho, totalItens, totalPaginas } = fields(value,
    ["itens", "pagina", "tamanho", "totalItens", "totalPaginas"]);
  contract(pagina === requestedPage && tamanho === SAVED_PAGE_SIZE && Array.isArray(itens));
  contract(typeof totalItens === "number" && Number.isSafeInteger(totalItens) && totalItens >= 0);
  contract(totalPaginas === Math.ceil(totalItens / SAVED_PAGE_SIZE));
  contract(itens.length === Math.max(0, Math.min(SAVED_PAGE_SIZE, totalItens - requestedPage * SAVED_PAGE_SIZE)));
  const entries = itens.map(item => savedItem(item, target));
  contract(new Set(entries.map(item => item.perfilId)).size === entries.length);
  return { itens: entries, pagina, totalPaginas };
}

@Injectable({ providedIn: "root" })
export class SavedProfilesService {
  private readonly http = inject(HttpClient);
  private readonly mode = inject(REGISTRATION_MODE);

  list(target: ProfileKind, page: number): Observable<SavedPage> {
    return this.api(() => {
      contract(Number.isInteger(page) && page >= 0);
      const params = new HttpParams({ fromObject: { pagina: page, tamanho: SAVED_PAGE_SIZE } });
      return this.http.get<unknown>(ROOT, { params }).pipe(map(value => savedPage(value, target, page)));
    });
  }

  status(id: string): Observable<boolean> {
    return this.api(() => this.http.get<unknown>(this.path(id)).pipe(map(value => {
      const { salvo } = fields(value, ["salvo"]);
      contract(typeof salvo === "boolean");
      return salvo;
    })));
  }

  set(id: string, saved: boolean): Observable<void> {
    return this.api(() => {
      const path = this.path(id);
      const response = saved ? this.http.put<unknown>(path, null, { observe: "response" })
        : this.http.delete<unknown>(path, { observe: "response" });
      return response.pipe(map((result: HttpResponse<unknown>) => { contract(result.status === 204); }));
    });
  }

  private path(id: string): string {
    contract(isDiscoveryId(id));
    return `${ROOT}/${encodeURIComponent(id)}`;
  }

  private api<T>(request: () => Observable<T>): Observable<T> {
    return defer(() => {
      contract(this.mode === "API");
      return request();
    }).pipe(timeout(API_REQUEST_TIMEOUT_MS));
  }
}
