import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { firstValueFrom } from "rxjs";
import { HttpMentorRegistrationGateway } from "./http-mentor-registration.gateway";
import { ProfileKind } from "./profile.models";
import { RegistrationRequest } from "./registration.gateway";

const input: RegistrationRequest = {
  nome: " Maria Teste ", email: " MARIA@example.test ", senha: " senha-inventada ",
  mentor: { biografia: " Mentora em produtos digitais. ", linkedin: " https://www.linkedin.com/in/maria-teste ", instagram: " maria.teste " },
};
const response = {
  id: "c7566087-4531-40fc-8af6-c94b36b7f951", usuarioId: "533294b1-e49e-49d3-8943-37258f07cb88",
  nome: "Maria Teste", email: "maria@example.test", biografia: "Mentora em produtos digitais.",
  linkedin: "https://www.linkedin.com/in/maria-teste", instagram: "maria.teste", site: null,
  dataEntradaPlataforma: "2026-10-17",
};
let http: HttpTestingController;
let gateway: HttpMentorRegistrationGateway;
function start(request = input) {
  const promise = firstValueFrom(gateway.register("MENTOR", request));
  // Instala o handler imediatamente, inclusive nos cenários de erro síncrono.
  const settled = promise.then(value => ({ value, error: undefined }), (error: unknown) => ({ value: undefined, error }));
  return settled;
}
function csrf() {
  http.expectOne({ method: "GET", url: "/csrf" }).flush({ headerName: "X-XSRF-TOKEN", token: "token-ficticio" });
  return http.expectOne({ method: "POST", url: "/api/v1/mentores" });
}
beforeEach(() => {
  TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
  http = TestBed.inject(HttpTestingController);
  gateway = TestBed.inject(HttpMentorRegistrationGateway);
});
afterEach(() => { http.verify(); vi.useRealTimers(); });

describe("Contrato HTTP do cadastro de mentor", () => {
  it("busca CSRF, envia o JSON aninhado e usa apenas os dados confirmados em uma resposta 201", async () => {
    const result = start();
    http.expectNone("/api/v1/mentores");
    const post = csrf();
    expect(post.request.headers.get("X-XSRF-TOKEN")).toBe("token-ficticio");
    expect(post.request.body).toEqual({
      usuario: { nome: "Maria Teste", email: "maria@example.test", senha: " senha-inventada " },
      biografia: "Mentora em produtos digitais.", linkedin: "https://www.linkedin.com/in/maria-teste", instagram: "maria.teste",
    });
    expect(post.request.body).not.toHaveProperty("tipoUsuario");
    expect(post.request.body).not.toHaveProperty("site");
    post.flush({ ...response, senha: "nao-propagar", token: "nao-propagar" }, { status: 201, statusText: "Created" });
    const { value, error } = await result;
    expect(error).toBeUndefined();
    expect(value).toEqual({ nome: response.nome, email: response.email, tipoUsuario: "MENTOR", mode: "API", mentor: response });
    expect(JSON.stringify(value)).not.toContain("nao-propagar");
    expect(input.senha).toBe(" senha-inventada ");
  });

  it("aceita a biografia no limite e omite links vazios", async () => {
    const result = start({ ...input, mentor: { biografia: "a".repeat(1000), linkedin: " ", instagram: "" } });
    const post = csrf();
    expect(JSON.parse(JSON.stringify(post.request.body))).toEqual({
      usuario: { nome: "Maria Teste", email: "maria@example.test", senha: input.senha }, biografia: "a".repeat(1000),
    });
    post.flush({ ...response, linkedin: null, instagram: null }, { status: 201, statusText: "Created" });
    expect((await result).value?.mode).toBe("API");
  });

  it.each(["STARTUP", "ADMIN"])("recusa %s antes de qualquer chamada de rede", async (kind) => {
    await expect(firstValueFrom(gateway.register(kind as ProfileKind, input))).rejects.toMatchObject({ code: "UNSUPPORTED_PROFILE" });
    http.expectNone(() => true);
  });

  it.each([{ ...input, senha: "curta" }, { ...input, mentor: undefined }])("valida os dados antes de obter CSRF: caso %#", async (request) => {
    await expect(firstValueFrom(gateway.register("MENTOR", request))).rejects.toMatchObject({ code: "INVALID_INPUT" });
    http.expectNone(() => true);
  });

  it.each([null, {}, { headerName: "Outro-Header", token: "teste" }, { headerName: "X-XSRF-TOKEN", token: "" }])("não envia a conta com resposta CSRF inválida: caso %#", async (body) => {
    const result = start();
    http.expectOne("/csrf").flush(body);
    expect((await result).error).toMatchObject({ code: "INVALID_RESPONSE" });
    http.expectNone("/api/v1/mentores");
  });

  it.each([[400, "INVALID_INPUT"], [403, "CSRF_ERROR"], [409, "DUPLICATE_EMAIL"], [500, "UNCONFIRMED"], [404, "UNCONFIRMED"]])("trata HTTP %s no envio sem simular sucesso", async (status, code) => {
    const result = start(); const post = csrf();
    post.flush({ message: "detalhes internos nao devem ser mostrados" }, { status: Number(status), statusText: "Error" });
    expect((await result).error).toMatchObject({ code });
  });

  it.each([null, {}, { ...response, id: "" }])("não confirma uma resposta de cadastro incompleta: caso %#", async (body) => {
    const result = start(); csrf().flush(body, { status: 201, statusText: "Created" });
    expect((await result).error).toMatchObject({ code: "UNCONFIRMED" });
  });

  it("exige o status 201 do contrato, mesmo se uma resposta 200 contiver dados", async () => {
    const result = start(); csrf().flush(response);
    expect((await result).error).toMatchObject({ code: "UNCONFIRMED" });
  });

  it("não confunde falha de conexão anterior ao envio com falha após o POST", async () => {
    const before = start(); http.expectOne("/csrf").error(new ProgressEvent("error"));
    expect((await before).error).toMatchObject({ code: "CONNECTION_ERROR" });
    const after = start(); csrf().error(new ProgressEvent("error"));
    expect((await after).error).toMatchObject({ code: "UNCONFIRMED" });
  });

  it.each([[403, "CSRF_ERROR"], [500, "SERVER_ERROR"]])("interrompe antes de cadastrar quando GET /csrf responde %s", async (status, code) => {
    const result = start(); http.expectOne("/csrf").flush(null, { status: Number(status), statusText: "Error" });
    expect((await result).error).toMatchObject({ code });
    http.expectNone("/api/v1/mentores");
  });

  it("limita a espera de CSRF e não envia o cadastro depois do tempo limite", async () => {
    vi.useFakeTimers(); const result = start(); const request = http.expectOne("/csrf");
    await vi.advanceTimersByTimeAsync(15001);
    expect((await result).error).toMatchObject({ code: "CONNECTION_ERROR" });
    expect(request.cancelled).toBe(true);
    http.expectNone("/api/v1/mentores");
  });

  it("não repete um POST que excede o tempo limite", async () => {
    vi.useFakeTimers(); const result = start(); const request = csrf();
    await vi.advanceTimersByTimeAsync(15001);
    expect((await result).error).toMatchObject({ code: "UNCONFIRMED" });
    expect(request.cancelled).toBe(true);
    http.expectNone("/api/v1/mentores");
  });
});

