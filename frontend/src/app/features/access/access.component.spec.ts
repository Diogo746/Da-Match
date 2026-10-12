import "@angular/compiler";
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  Injector,
  createEnvironmentInjector,
  runInInjectionContext,
  EnvironmentInjector,
} from "@angular/core";
import { of, Subject, throwError } from "rxjs";
import { AccessComponent } from "./access.component";
import {
  AccessGateway,
  AccessReceipt,
  AccessRequestError,
} from "../../core/access.gateway";
let injector: EnvironmentInjector;
const receipt: AccessReceipt = {
  protocol: "DEMO-TESTE",
  status: "PENDENTE",
  name: "Fundador Teste",
  kind: "STARTUP",
};
function create(submit = vi.fn(() => of(receipt))) {
  injector = createEnvironmentInjector(
    [{ provide: AccessGateway, useValue: { submit } }],
    Injector.NULL as EnvironmentInjector,
  );
  return {
    component: runInInjectionContext(injector, () => new AccessComponent()),
    submit,
  };
}
function fill(component: AccessComponent) {
  component.form.setValue({
    name: "Fundador Teste",
    email: "fundador@example.test",
    kind: "STARTUP",
    demoConsent: true,
  });
}
afterEach(() => injector?.destroy());
describe("Formulário de solicitação", () => {
  it("impede envio de campos vazios e de nome com espaços", async () => {
    const { component, submit } = create();
    await component.submit();
    expect(submit).not.toHaveBeenCalled();
    expect(component.invalid("email")).toBe(true);
    fill(component);
    component.form.controls.name.setValue("     ");
    await component.submit();
    expect(submit).not.toHaveBeenCalled();
  });
  it("exige ciência de que é uma demonstração", async () => {
    const { component, submit } = create();
    fill(component);
    component.form.controls.demoConsent.setValue(false);
    await component.submit();
    expect(submit).not.toHaveBeenCalled();
  });
  it("envia dados sem senha e apresenta recibo pendente", async () => {
    const { component, submit } = create();
    fill(component);
    await component.submit();
    expect(submit).toHaveBeenCalledWith({
      name: "Fundador Teste",
      email: "fundador@example.test",
      kind: "STARTUP",
    });
    expect(component.receipt()?.status).toBe("PENDENTE");
    expect(component.loading()).toBe(false);
  });
  it("impede cliques repetidos durante envio", async () => {
    const stream = new Subject<AccessReceipt>();
    const submit = vi.fn(() => stream.asObservable());
    const { component } = create(submit);
    fill(component);
    const pending = component.submit();
    await component.submit();
    expect(submit).toHaveBeenCalledTimes(1);
    stream.next(receipt);
    stream.complete();
    await pending;
    expect(component.loading()).toBe(false);
  });
  it("apresenta erro de duplicidade e permite nova tentativa", async () => {
    const submit = vi.fn(() =>
      throwError(() => new AccessRequestError("DUPLICATE_EMAIL")),
    );
    const { component } = create(submit);
    fill(component);
    await component.submit();
    expect(component.error()).toContain("Já existe");
    expect(component.receipt()).toBeNull();
    expect(component.loading()).toBe(false);
  });
});

describe("Recuperação do formulário", () => {
  it("permite recomeçar depois de uma solicitação concluída", async () => {
    const { component } = create();
    fill(component);
    await component.submit();
    component.restart();
    expect(component.receipt()).toBeNull();
    expect(component.form.controls.demoConsent.value).toBe(false);
    expect(component.form.controls.email.value).toBe("");
  });
  it("informa falha inesperada sem perder dados para nova tentativa", async () => {
    const { component } = create(
      vi.fn(() => throwError(() => new Error("falha simulada"))),
    );
    fill(component);
    await component.submit();
    expect(component.error()).toContain("Não foi possível");
    expect(component.form.controls.email.value).toBe("fundador@example.test");
    expect(component.loading()).toBe(false);
  });
});
