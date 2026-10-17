import { describe, it, expect, vi, afterEach } from "vitest";
import { firstValueFrom } from "rxjs";
import {
  DemoRegistrationGateway,
  RegistrationRequest,
  RegistrationError,
} from "./registration.gateway";
import { ProfileKind } from "./profiles.store";

const request: RegistrationRequest = {
  nome: "Maria Teste",
  email: "maria@example.test",
  senha: "senha-de-teste",
};
afterEach(() => vi.useRealTimers());
async function register(
  gateway: DemoRegistrationGateway,
  input = request,
  kind: ProfileKind = "STARTUP",
) {
  const promise = firstValueFrom(gateway.register(kind, input));
  await vi.runAllTimersAsync();
  return promise;
}

describe("Cadastro demonstrativo baseado em CadastrarUsuarioRequest", () => {
  it.each(["STARTUP", "MENTOR"] as const)(
    "simula %s sem retornar senha ou autenticação",
    async (kind) => {
      vi.useFakeTimers();
      const result = await register(
        new DemoRegistrationGateway(),
        request,
        kind,
      );
      expect(result).toEqual({
        nome: "Maria Teste",
        email: "maria@example.test",
        tipoUsuario: kind,
        mode: "DEMO",
      });
      expect(result).not.toHaveProperty("senha");
      expect(result).not.toHaveProperty("token");
      expect(request.senha).toBe("senha-de-teste");
    },
  );

  it("aceita os limites mínimos declarados no DTO", async () => {
    vi.useFakeTimers();
    const result = await register(new DemoRegistrationGateway(), {
      ...request,
      nome: "João",
      senha: "123456",
    });
    expect(result.nome).toBe("João");
  });

  it.each([
    { ...request, nome: "Ana" },
    { ...request, nome: "      " },
    { ...request, email: "invalido" },
    { ...request, senha: "12345" },
    { ...request, senha: "      " },
  ])("recusa dados inválidos sem reservar o e-mail: %o", async (input) => {
    vi.useFakeTimers();
    const gateway = new DemoRegistrationGateway();
    await expect(
      firstValueFrom(gateway.register("MENTOR", input)),
    ).rejects.toMatchObject({ code: "INVALID_INPUT" });
    await expect(register(gateway)).resolves.toMatchObject({ mode: "DEMO" });
  });

  it("não admite cadastro público com tipo administrativo", async () => {
    const gateway = new DemoRegistrationGateway();
    await expect(
      firstValueFrom(gateway.register("ADMIN" as ProfileKind, request)),
    ).rejects.toBeInstanceOf(RegistrationError);
  });

  it.each([
    "",
    "maria@@example.test",
    "maria silva@example.test",
    "maria@localhost",
    "maria@.test",
    "maria@example.",
    "maria..silva@example.test",
    `${"a".repeat(65)}@example.test`,
    `${"a".repeat(10000)}@example.test`,
  ])("recusa e-mail malformado ou acima dos limites: caso %#", async (email) => {
    await expect(
      firstValueFrom(new DemoRegistrationGateway().register("MENTOR", { ...request, email })),
    ).rejects.toMatchObject({ code: "INVALID_INPUT" });
  });

  it("identifica o mesmo e-mail entre os dois tipos e normaliza espaços e caixa", async () => {
    vi.useFakeTimers();
    const gateway = new DemoRegistrationGateway();
    await register(gateway, {
      ...request,
      nome: "  Maria Teste  ",
      email: "  MARIA@example.test  ",
    });
    await expect(
      firstValueFrom(gateway.register("MENTOR", request)),
    ).rejects.toMatchObject({ code: "DUPLICATE_EMAIL" });
  });

  it("reinicia os cadastros temporários em uma nova sessão", async () => {
    vi.useFakeTimers();
    await register(new DemoRegistrationGateway());
    await expect(
      register(new DemoRegistrationGateway()),
    ).resolves.toMatchObject({ mode: "DEMO" });
  });
});
