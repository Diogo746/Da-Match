import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { it, expect } from "vitest";
import { LumenChatComponent } from "./lumen-chat.component";
import { AuthStateStore } from "../../core/auth-state.store";
import { LumenChatTrigger } from "../../core/lumen-chat-trigger";

function setup() {
  const fixture = TestBed.createComponent(LumenChatComponent);
  fixture.detectChanges();
  const root: HTMLElement = fixture.nativeElement;
  const button = root.querySelector<HTMLButtonElement>(".launcher")!;
  const panel = root.querySelector("dialog")!;

  return { fixture, root, button, panel };
}
it("aceita teclado e texto livre, preserva a conversa ao fechar e permite limpar", () => {
  const { fixture, root, button, panel } = setup();
  button.click(); fixture.detectChanges();
  expect(panel.open).toBe(true);
  const input = root.querySelector("input")!;
  expect(document.activeElement).toBe(input);
  input.value = "Como faço meu cadastro?";
  input.dispatchEvent(new Event("input"));
  root.querySelector("form")!.dispatchEvent(new Event("submit", { cancelable: true }));
  fixture.detectChanges();
  expect(root.querySelector(".reply")?.textContent).toContain("dados fictícios");
  expect(input.value).toBe("");
  panel.dispatchEvent(new Event("cancel", { cancelable: true })); fixture.detectChanges();
  expect(panel.open).toBe(false);
  expect(document.activeElement).toBe(button);
  button.click(); fixture.detectChanges();
  expect(root.querySelector(".turn")).not.toBeNull();
  root.querySelector<HTMLButtonElement>(".note button")!.click(); fixture.detectChanges();
  expect(root.querySelector(".turn")).toBeNull();
});
it("abre também pelo mascote e descarta a conversa quando a conta muda", () => {
  const { fixture, root, panel, button } = setup();
  const trigger = TestBed.inject(LumenChatTrigger);
  const outside = document.createElement("button");
  outside.addEventListener("click", event => trigger.open(event));
  outside.click();
  expect(panel.open).toBe(true);
  root.querySelector<HTMLButtonElement>(".suggestions button")!.click();
  fixture.detectChanges();
  expect(root.querySelector(".turn")).not.toBeNull();
  TestBed.inject(AuthStateStore).setUser({ id: "mentor", nome: "Teste", email: "a@example.test", tipoUsuario: "MENTOR" });
  fixture.detectChanges();
  expect(root.querySelector(".turn")).toBeNull();
  root.querySelector<HTMLButtonElement>(".close")!.click();
  expect(panel.open).toBe(false);
  button.click();
  fixture.componentInstance.send("  ");
  expect(fixture.componentInstance.exchanges()).toHaveLength(0);
});

it("consulta o backend e exibe a justificativa e as evidências da indicação", () => {
  TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
  const { fixture, root } = setup();
  const trigger = TestBed.inject(LumenChatTrigger);
  const http = TestBed.inject(HttpTestingController);
  const card = document.createElement("button");
  card.addEventListener("click", event => trigger.open(event, {
    startupId: "startup", mentorId: "mentor", mentorName: "Aline",
  }));
  card.click();
  fixture.detectChanges();
  expect(root.querySelector(".question")?.textContent).toContain("Aline");
  expect(root.querySelector(".reply")?.textContent).toContain("Consultando as fichas");
  const request = http.expectOne("/api/v1/startups/startup/recomendacoes/mentor/explicacao");
  expect(request.request.method).toBe("POST");
  request.flush({ texto: "O perfil apoia a necessidade declarada.", referencias: ["AGENDA"] });
  fixture.detectChanges();
  expect(root.querySelector(".reply")?.textContent).toContain("O perfil apoia a necessidade declarada.");
  expect(root.querySelector(".reply li")?.textContent).toContain("Agenda declarada em comum");
  http.verify();
});
