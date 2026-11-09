import { ParamMap } from "@angular/router";
import { CITIES, FORMATS, MeetingFormat, ProfileKind, SECTORS, SECTOR_LIMIT, SectorId,
  TOPICS, TOPIC_LIMIT, TopicId } from "./profile.models";

export interface DiscoveryProfile {
  id: string; tipo: ProfileKind; nome: string; apresentacao: string;
  setores: SectorId[]; topicos: TopicId[]; formato: MeetingFormat; cidadeId: string;
}
export interface DiscoveryQuery {
  busca: string; setor: SectorId | ""; topico: TopicId | ""; formato: MeetingFormat | "";
  cidade: string; pagina: number; tamanho: number;
}
export interface DiscoveryPage {
  itens: DiscoveryProfile[]; pagina: number; tamanho: number; totalItens: number; totalPaginas: number;
}
export const EMPTY_DISCOVERY_QUERY: DiscoveryQuery = {
  busca: "", setor: "", topico: "", formato: "", cidade: "", pagina: 0, tamanho: 6,
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PROFILE_KEYS = ["id", "tipo", "nome", "apresentacao", "setores", "topicos", "formato", "cidadeId"];
const PAGE_KEYS = ["itens", "pagina", "tamanho", "totalItens", "totalPaginas"];
export function discoverySectors(kind: ProfileKind) {
  return [...SECTORS, { id: kind === "MENTOR" ? "GENERAL" : "DISCOVERING",
    label: kind === "MENTOR" ? "Atuação geral" : "Setor em descoberta" }];
}
function requireValid(valid: boolean): asserts valid {
  if (!valid) throw new Error("Dados de descoberta inválidos.");
}
function record(value: unknown, keys: string[]): Record<string, unknown> {
  requireValid(!!value && typeof value === "object" && !Array.isArray(value));
  const data = value as Record<string, unknown>;
  requireValid(Object.keys(data).length === keys.length && keys.every(key => Object.hasOwn(data, key)));
  return data;
}
function text(value: unknown, max: number, min = 1): string {
  requireValid(typeof value === "string" && value.length <= max && value.trim().length >= min);
  return value;
}
function codes<T extends string>(value: unknown, allowed: readonly T[], max: number): T[] {
  requireValid(Array.isArray(value) && value.length > 0 && value.length <= max &&
    new Set(value).size === value.length && value.every(code => allowed.includes(code)));
  return [...value] as T[];
}
export function readDiscoveryProfile(value: unknown, kind: ProfileKind, id?: string): DiscoveryProfile {
  const data = record(value, PROFILE_KEYS);
  const profileId = text(data["id"], 36);
  requireValid(UUID.test(profileId) && (!id || id === profileId) && data["tipo"] === kind);
  const sectors = codes(data["setores"], discoverySectors(kind).map(item => item.id), SECTOR_LIMIT[kind]) as SectorId[];
  requireValid(!sectors.some(code => code === "GENERAL" || code === "DISCOVERING") || sectors.length === 1);
  const format = text(data["formato"], 10) as MeetingFormat;
  const city = text(data["cidadeId"], 30, 0);
  requireValid(FORMATS.some(item => item.id === format) && (!city || CITIES.some(item => item.id === city)) &&
    (format !== "ONLINE" || !city) && (format !== "PRESENCIAL" || !!city));
  return { id: profileId, tipo: kind, nome: text(data["nome"], 255, kind === "MENTOR" ? 4 : 1),
    apresentacao: text(data["apresentacao"], kind === "MENTOR" ? 1000 : 255), setores: sectors,
    topicos: codes(data["topicos"], TOPICS.map(item => item.id), TOPIC_LIMIT[kind]), formato: format, cidadeId: city };
}
export function readDiscoveryPage(value: unknown, kind: ProfileKind, query: DiscoveryQuery): DiscoveryPage {
  const data = record(value, PAGE_KEYS);
  const total = data["totalItens"];
  requireValid(Number.isSafeInteger(total) && (total as number) >= 0 && data["pagina"] === query.pagina &&
    data["tamanho"] === query.tamanho && data["totalPaginas"] === Math.ceil((total as number) / query.tamanho) &&
    Array.isArray(data["itens"]));
  const profiles = (data["itens"] as unknown[]).map(item => readDiscoveryProfile(item, kind));
  requireValid(new Set(profiles.map(item => item.id)).size === profiles.length &&
    profiles.length === Math.min(query.tamanho, Math.max(0, (total as number) - query.pagina * query.tamanho)));
  return { itens: profiles, pagina: query.pagina, tamanho: query.tamanho,
    totalItens: total as number, totalPaginas: data["totalPaginas"] as number };
}
export function readDiscoveryQuery(params: ParamMap, kind: ProfileKind): DiscoveryQuery {
  requireValid(params.keys.every(key => Object.hasOwn(EMPTY_DISCOVERY_QUERY, key) && params.getAll(key).length === 1));
  const query = { ...EMPTY_DISCOVERY_QUERY, busca: (params.get("busca") ?? "").trim(),
    setor: params.get("setor") ?? "", topico: params.get("topico") ?? "", formato: params.get("formato") ?? "",
    cidade: params.get("cidade") ?? "" };
  requireValid(query.busca.length <= 100 && (!query.setor || discoverySectors(kind).some(item => item.id === query.setor)) &&
    (!query.topico || TOPICS.some(item => item.id === query.topico)) &&
    (!query.formato || FORMATS.some(item => item.id === query.formato)) &&
    (!query.cidade || CITIES.some(item => item.id === query.cidade)));
  return { ...query, setor: query.setor as SectorId | "", topico: query.topico as TopicId | "",
    formato: query.formato as MeetingFormat | "", pagina: integer(params.get("pagina"), 0, 2147483647),
    tamanho: integer(params.get("tamanho"), EMPTY_DISCOVERY_QUERY.tamanho, 20, 1) };
}
function integer(value: string | null, fallback: number, max: number, min = 0): number {
  if (value === null) return fallback;
  requireValid(/^\d+$/.test(value) && Number(value) >= min && Number(value) <= max);
  return Number(value);
}
export function discoveryParams(query: DiscoveryQuery): Record<string, string> {
  return Object.fromEntries(Object.entries(query).filter(([, value]) => value !== "")
    .map(([key, value]) => [key, String(value)]));
}
export function isDiscoveryId(value: string): boolean { return UUID.test(value); }
