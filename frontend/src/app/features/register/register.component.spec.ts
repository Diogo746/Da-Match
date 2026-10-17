import "@angular/compiler";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import {
  Injector,
  createEnvironmentInjector,
  runInInjectionContext,
  EnvironmentInjector,
} from "@angular/core";
import { of, Subject, throwError } from "rxjs";
import { RegisterComponent } from "./register.component";
import {
  RegistrationGateway,
  RegistrationReceipt,
  RegistrationError,
} from "../../core/registration.gateway";

import { ProfileSessionStore } from "../../core/profile-session.store";
import { emptyProfile } from "../../core/profile.models";
let injector: EnvironmentInjector;
const receipt: RegistrationReceipt = {
  nome: "Maria Teste",
  email: "maria@example.test",
  tipoUsuario: "STARTUP",
  mode: "DEMO",
};
function create(
  register: RegistrationGateway["register"] = vi.fn(() => of(receipt)),
) {
  injector = createEnvironmentInjector(
    [{ provide: RegistrationGateway, useValue: { register } }, ProfileSessionStore],
    Injector.NULL as EnvironmentInjector,
  );
  return {
    component: runInInjectionContext(injector, () => new RegisterComponent()),
    register: vi.mocked(register),
  };
}
function fill(component: RegisterComponent) {
  component.form.setValue({
    nome: "Maria Teste",
    email: "maria@example.test",
    senha: "senha-de-teste",
    tipoUsuario: "STARTUP",
    demoConsent: true,
  });
}
beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  injector?.destroy();
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe("Formulário de cadastro", () => {
  it("orienta os campos obrigatórios sem enviar um formulário vazio", async () => {
    const { component, register } = create();
    await component.submit();
    expect(register).not.toHaveBeenCalled();
    expect(component.invalid("nome")).toBe(true);
    expect(component.invalid("email")).toBe(true);
    expect(component.invalid("senha")).toBe(true);
    expect(component.error()).toContain("campos");
  });

  it.each([
    { nome: "Ana" },
    { nome: "      " },
    { email: "sem-email" },
    { senha: "12345" },
    { senha: "      " },
    { demoConsent: false },
  ])("bloqueia cadastro com entrada inválida: %o", async (invalidValue) => {
    const { component, register } = create();
    fill(component);
    component.form.patchValue(invalidValue);
    await component.submit();
    expect(register).not.toHaveBeenCalled();
    expect(component.receipt()).toBeNull();
  });

  it.each(["STARTUP", "MENTOR"] as const)(
    "separa o tipo %s dos três campos do DTO e remove a senha após o teste",
    async (tipoUsuario) => {
      const { component, register } = create();
      fill(component);
      component.form.patchValue({
        tipoUsuario,
        nome: "  Maria Teste  ",
        email: " MARIA@example.test ",
        senha: " senha de teste ",
      });
      await component.submit();
      expect(register).toHaveBeenCalledWith(tipoUsuario, {
        nome: "Maria Teste",
        email: "maria@example.test",
        senha: " senha de teste ",
      });
      expect(Object.keys(register.mock.calls[0][1]).sort()).toEqual([
        "email",
        "nome",
        "senha",
      ]);
      expect(component.form.controls.senha.value).toBe("");
      expect(component.receipt()?.mode).toBe("DEMO");
      expect(component.loading()).toBe(false);
    },
  );

  it("impede envios repetidos durante o teste e depois da confirmação", async () => {
    const stream = new Subject<RegistrationReceipt>();
    const register = vi.fn(() => stream.asObservable());
    const { component } = create(register);
    fill(component);
    const pending = component.submit();
    await component.submit();
    expect(component.loading()).toBe(true);
    expect(register).toHaveBeenCalledTimes(1);
    stream.next(receipt);
    stream.complete();
    await pending;
    await component.submit();
    expect(register).toHaveBeenCalledTimes(1);
    expect(component.loading()).toBe(false);
  });

  it("informa e-mail repetido e preserva os dados para correção", async () => {
    const register = vi.fn(() =>
      throwError(() => new RegistrationError("DUPLICATE_EMAIL")),
    );
    const { component } = create(register);
    fill(component);
    await component.submit();
    expect(component.error()).toContain("e-mail já foi usado");
    expect(component.form.controls.email.value).toBe("maria@example.test");
    expect(component.receipt()).toBeNull();
    expect(component.loading()).toBe(false);
  });

  it("permite reiniciar o cadastro com todos os campos limpos", async () => {
    const { component } = create();
    fill(component);
    component.togglePassword();
    expect(component.passwordVisible()).toBe(true);
    await component.submit();
    expect(component.passwordVisible()).toBe(false);
    component.restart();
    expect(component.receipt()).toBeNull();
    expect(component.form.getRawValue()).toEqual({
      nome: "",
      email: "",
      senha: "",
      tipoUsuario: "STARTUP",
      demoConsent: false,
    });
    expect(component.form.untouched).toBe(true);
  });

  it("permite tentar novamente depois de uma falha inesperada", async () => {
    const register = vi
      .fn()
      .mockReturnValueOnce(throwError(() => new Error("falha simulada")))
      .mockReturnValueOnce(of(receipt));
    const { component } = create(register);
    fill(component);
    await component.submit();
    expect(component.error()).toContain("Não foi possível");
    expect(component.form.controls.senha.value).toBe("senha-de-teste");
    await component.submit();
    expect(component.error()).toBe("");
    expect(component.receipt()).toEqual(receipt);
    expect(register).toHaveBeenCalledTimes(2);
  });
});

describe("Do cadastro ao perfil", () => {
  it("ativa o perfil somente após completar as etapas e não leva credenciais para ele", async () => {
    const { component } = create();
    fill(component); await component.submit();
    expect(component.session.profile()).toBeNull();
    component.completeProfile({ ...emptyProfile("STARTUP"), projectName: "Minha Ideia", sectors: ["TECH"], topics: ["VALIDATION"], format: "ONLINE", days: ["MON"], periods: ["EVENING"] });
    expect(component.profileReady()).toBe(true);
    expect(component.session.profile()!.displayName).toBe("Minha Ideia");
    expect(component.form.controls.senha.value).toBe("");
    expect(JSON.stringify(component.session.profile())).not.toContain("email");
    component.restart();
    expect(component.session.profile()).toBeNull();
    expect(component.profileReady()).toBe(false);
  });
  it("não permite concluir o perfil antes do cadastro", () => {
    const { component } = create();
    component.completeProfile(emptyProfile("STARTUP"));
    expect(component.session.profile()).toBeNull();
  });
});
