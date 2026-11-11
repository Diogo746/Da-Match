import { Injectable, InjectionToken, computed, inject, signal } from "@angular/core";
import { DEMO_PROFILES } from "./profiles.store";

export interface ChatMessage { id: string; sender: string; text: string; at: number }
type History = Record<string, ChatMessage[]>;
const HISTORY_KEY = "damatch:conversas:demo:v1";
const VIEW_KEY = "damatch:conversas:persona:v1";
export const STARTUP = "startup-1";
export const MENTOR = "mentor-1";
// Estes pares representam conexões aceitas, nunca uma indicação por compatibilidade.
const PAIRS = [[STARTUP, MENTOR], [STARTUP, "mentor-2"], ["startup-2", MENTOR]] as const;
function threadKey(a: string, b: string) { return [a, b].sort((left, right) => left.localeCompare(right, "en")).join("/"); }
function read(key: string): string | null { try { return localStorage.getItem(key); } catch { return null; } }
function validMessage(item: unknown, pair: readonly string[]): item is ChatMessage {
  if (!item || typeof item !== "object") return false;
  const m = item as Partial<ChatMessage>;
  return !!m.sender && pair.includes(m.sender) && typeof m.id === "string"
    && typeof m.text === "string" && !!m.text.trim() && m.text.length <= 2000 && Number.isFinite(m.at);
}
function loadHistory(): History {
  const result: History = {};
  try {
    const raw = JSON.parse(read(HISTORY_KEY) ?? "{}");
    for (const pair of PAIRS) {
      const key = threadKey(pair[0],pair[1]);
      if (Array.isArray(raw?.[key])) result[key] = raw[key].filter((m: unknown) => validMessage(m,pair));
    }
  } catch { /* Dados incompatíveis: ainda é possível abrir uma conversa vazia. */ }
  return result;
}
@Injectable({providedIn: "root"})
export class DemoConversationsGateway {
  readonly viewer = signal(read(VIEW_KEY) === MENTOR ? MENTOR : STARTUP);
  readonly storageWarning = signal(false);
  private readonly history = signal(loadHistory());
  readonly contacts = computed(() => DEMO_PROFILES.filter(p => this.connected(p.id)).sort((a,b) =>
    (this.messages(b.id).at(-1)?.at ?? 0) - (this.messages(a.id).at(-1)?.at ?? 0) || a.name.localeCompare(b.name,"pt-BR")));
  connected(peer: string): boolean {
    const me = this.viewer();
    return PAIRS.some(([a,b]) => (a === me && b === peer) || (a === peer && b === me));
  }
  switchViewer(id: string) {
    if (id !== MENTOR && id !== STARTUP) return;
    this.viewer.set(id);
    try { localStorage.setItem(VIEW_KEY,id); } catch { this.storageWarning.set(true); }
  }
  messages(peer: string): readonly ChatMessage[] {
    return this.connected(peer) ? this.history()[threadKey(this.viewer(),peer)] ?? [] : [];
  }
  send(peer: string, input: string): boolean {
    const text = input.trim();
    if (!this.connected(peer) || !text || text.length > 2000) return false;
    const sender = this.viewer(), key = threadKey(sender,peer);
    const message = {id: crypto.randomUUID(), sender, text, at: Date.now()};
    this.history.update(current => ({...current, [key]: [...(current[key] ?? []), message]}));
    try { localStorage.setItem(HISTORY_KEY,JSON.stringify(this.history())); this.storageWarning.set(false); }
    catch { this.storageWarning.set(true); }
    return true;
  }
}
export const CONVERSATIONS = new InjectionToken<Pick<DemoConversationsGateway,"viewer"|"contacts"|"messages"|"connected"|"send"|"switchViewer"|"storageWarning">>("Conversas de demonstração",{
  providedIn:"root", factory:() => inject(DemoConversationsGateway)
});
