import { TestBed } from "@angular/core/testing";
import { expect, it } from "vitest";
import { AuthStateStore } from "./auth-state.store";
import { StartupTeamPendingStore } from "./startup-team-pending.store";

it("retains unresolved operations through same-session confirmations, and drops them for a new login", () => {
  const auth = TestBed.inject(AuthStateStore);
  const store = TestBed.inject(StartupTeamPendingStore);
  const user = { id: "user", nome: "Pessoa", email: "person@example.test", tipoUsuario: "STARTUP" as const };
  auth.setUser(user);
  const operation = { kind: "remove" as const, project: "p", userId: "m", name: "Membro" };
  store.set("p", operation); store.set("q", { ...operation, project: "q" });
  const revision = auth.revision(); auth.confirmUser({ ...user });
  expect(auth.revision()).toBe(revision); expect(store.get("p")).toEqual(operation);
  store.clear("q"); expect(store.get("q")).toBeNull(); expect(store.get("p")).toEqual(operation);
  auth.setUser(null); auth.setUser(user);
  expect(store.get("p")).toBeNull();
  store.set("p", operation); auth.confirmUser({ ...user, tipoUsuario: "MENTOR" });
  expect(store.get("p")).toBeNull();
});
