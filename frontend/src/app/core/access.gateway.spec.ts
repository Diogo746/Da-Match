import { describe, it, expect, vi, afterEach } from "vitest";
import { firstValueFrom } from "rxjs";
import {
  DemoAccessGateway,
  AccessRequest,
  AccessRequestError,
} from "./access.gateway";
const request: AccessRequest = {
  name: "Fundador Teste",
  email: "fundador@example.test",
  kind: "STARTUP",
};
afterEach(() => vi.useRealTimers());
async function send(gateway: DemoAccessGateway, input: AccessRequest) {
  const promise = firstValueFrom(gateway.submit(input));
  await vi.runAllTimersAsync();
  return promise;
}
describe("Solicitação demonstrativa — RF01 / CT01 e CT02", () => {
  it.each(["STARTUP", "MENTOR", "INVESTIDOR"] as const)(
    "registra %s como pendente sem conceder acesso",
    async (kind) => {
      vi.useFakeTimers();
      const result = await send(new DemoAccessGateway(), { ...request, kind });
      expect(result.status).toBe("PENDENTE");
      expect(result.protocol).toMatch(/^DEMO-/);
      expect(result).not.toHaveProperty("token");
      expect(result).not.toHaveProperty("senha");
    },
  );
  it("não duplica e-mail com espaços e caixa diferente", async () => {
    vi.useFakeTimers();
    const gateway = new DemoAccessGateway();
    await send(gateway, request);
    await expect(
      firstValueFrom(
        gateway.submit({ ...request, email: "  FUNDADOR@example.test  " }),
      ),
    ).rejects.toMatchObject({ code: "DUPLICATE_EMAIL" });
  });
  it.each([
    { ...request, name: "   " },
    { ...request, email: "invalido" },
    { ...request, kind: "ADMIN" as AccessRequest["kind"] },
  ])("recusa entrada inválida sem reservar o e-mail", async (input) => {
    vi.useFakeTimers();
    const gateway = new DemoAccessGateway();
    await expect(firstValueFrom(gateway.submit(input))).rejects.toBeInstanceOf(
      AccessRequestError,
    );
    const result = await send(gateway, request);
    expect(result.status).toBe("PENDENTE");
  });
  it("mantém dados somente na instância da sessão", async () => {
    vi.useFakeTimers();
    await send(new DemoAccessGateway(), request);
    await expect(send(new DemoAccessGateway(), request)).resolves.toMatchObject(
      { status: "PENDENTE" },
    );
  });
});

describe("Nomes da solicitação", () => {
  it("aceita nome curto válido sem inventar tamanho mínimo", async () => {
    vi.useFakeTimers();
    const result = await send(new DemoAccessGateway(), {
      ...request,
      name: "Ana",
    });
    expect(result.name).toBe("Ana");
  });
});
