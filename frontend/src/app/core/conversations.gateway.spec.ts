import { afterEach, expect, it, vi } from "vitest";
import { DemoConversationsGateway, MENTOR, STARTUP } from "./conversations.gateway";
afterEach(()=>{localStorage.clear();vi.restoreAllMocks();});
it("mantém um único histórico nos dois sentidos e após reabrir a prévia",()=>{
  const first = new DemoConversationsGateway();
  expect(first.send(MENTOR,"  Podemos testar o MVP?  ")).toBe(true);
  first.switchViewer(MENTOR);
  expect(first.messages(STARTUP)[0].text).toBe("Podemos testar o MVP?");
  first.send(STARTUP,"Claro!");
  const next = new DemoConversationsGateway();
  expect(next.viewer()).toBe(MENTOR);
  expect(next.messages(STARTUP).map(m=>m.sender)).toEqual([STARTUP,MENTOR]);
  expect(next.messages("startup-2")).toHaveLength(0);
});
it("não abre conversa por compatibilidade, id arbitrário ou com a própria conta",()=>{
  const g = new DemoConversationsGateway();
  for(const id of ["mentor-3", STARTUP, "__proto__"]) {
    expect(g.send(id,"Teste")).toBe(false);
    expect(g.messages(id)).toEqual([]);
  }
  expect(g.send(MENTOR,"  ")).toBe(false);
  expect(g.send(MENTOR,"x".repeat(2001))).toBe(false);
  g.switchViewer("admin");
  expect(g.viewer()).toBe(STARTUP);
});
it("permite continuar em memória se a gravação falhar",()=>{
  const g = new DemoConversationsGateway();
  vi.spyOn(Storage.prototype,"setItem").mockImplementation(()=>{throw new Error("Sem espaço");});
  expect(g.send(MENTOR,"Olá")).toBe(true);
  expect(g.storageWarning()).toBe(true);
  expect(g.messages(MENTOR)).toHaveLength(1);
});
