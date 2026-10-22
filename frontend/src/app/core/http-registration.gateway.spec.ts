import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { firstValueFrom } from "rxjs";
import { HttpRegistrationGateway } from "./http-registration.gateway";
import { ProfileKind } from "./profile.models";
import { RegistrationRequest } from "./registration.gateway";
import { StartupRegistrationDetails } from "./startup.models";

const input: RegistrationRequest = {
  nome: " Maria Teste ", email: " MARIA@example.test ", senha: " senha-inventada ",
  mentor: { biografia: " Mentora em produtos digitais. ", linkedin: " https://www.linkedin.com/in/maria-teste ", instagram: " maria.teste ", disponibilidades: [{ diaSemana: 1, periodo: "MANHA" }] },
};
const response = {
  id: "c7566087-4531-40fc-8af6-c94b36b7f951", usuarioId: "533294b1-e49e-49d3-8943-37258f07cb88",
  nome: "Maria Teste", email: "maria@example.test", biografia: "Mentora em produtos digitais.",
  linkedin: "https://www.linkedin.com/in/maria-teste", instagram: "maria.teste", site: null,
  dataEntradaPlataforma: "2026-10-17",
  disponibilidades: [{ diaSemana: 1, periodo: "MANHA" }], status: "RASCUNHO",
};
let http: HttpTestingController;
let gateway: HttpRegistrationGateway;
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
  gateway = TestBed.inject(HttpRegistrationGateway);
});

describe("Contrato HTTP do onboarding de startup", () => {
  const details: StartupRegistrationDetails = {
    nomeProvisorio: " Ideia Fictícia ", pitchCurto: "Conectar ideias e experiência.",
    problemaCentral: "Poucas conexões.", solucaoProposta: "Uma rede de apoio.",
    publicoAlvo: "Projetos iniciantes", modeloDeNegocio: "Assinatura", statusValidacao: "PESQUISA_MERCADO",
  };
  const startup = { ...details, nomeProvisorio: "Ideia Fictícia", id: "startup-test", dataCriacao: "2026-10-22T12:00:00Z",
    membros: [{ id: "member-test", usuarioId: "user-test", nomeUsuario: "Maria Teste", papelMembro: "FUNDADOR", dataEntrada: "2026-10-22" }] };
  function startStartup(request: RegistrationRequest = { ...input, startup: details }) {
    return firstValueFrom(gateway.register("STARTUP", request)).then(value => ({ value, error: undefined }),
      (error: unknown) => ({ value: undefined, error }));
  }
  function startupPost() {
    http.expectOne("/csrf").flush({ headerName: "X-XSRF-TOKEN", token: "startup-csrf" });
    return http.expectOne({ method: "POST", url: "/api/v1/startups" });
  }

  it("posts a nested founder and sanitized project, requiring a confirmed founder relation", async () => {
    const result = startStartup();
    const post = startupPost();
    expect(post.request.headers.get("X-XSRF-TOKEN")).toBe("startup-csrf");
    expect(post.request.body).toEqual({ fundador: { nome: "Maria Teste", email: "maria@example.test", senha: input.senha },
      ...details, nomeProvisorio: "Ideia Fictícia" });
    expect(post.request.body).not.toHaveProperty("mentor");
    expect(post.request.body).not.toHaveProperty("tipoUsuario");
    expect(post.request.body.fundador).not.toHaveProperty("id");
    post.flush({ ...startup, senha: "never-copy", membros: [{ ...startup.membros[0], token: "never-copy" }] },
      { status: 201, statusText: "Created" });
    expect((await result).value).toEqual({ nome: "Maria Teste", email: "maria@example.test", tipoUsuario: "STARTUP", mode: "API", startup });
  });

  it.each([undefined, { ...details, pitchCurto: "x".repeat(256) }, { ...details, problemaCentral: " " }])("rejects missing/invalid project details before the network: %#", async startup => {
    expect((await startStartup({ ...input, startup })).error).toMatchObject({ code: "INVALID_INPUT" });
    http.expectNone(() => true);
  });

  it.each([null, {}, { ...startup, membros: [] },
    { ...startup, membros: [{ ...startup.membros[0], papelMembro: "MEMBRO" }] },
    { ...startup, membros: [startup.membros[0], { ...startup.membros[0], id: "other-member" }] },
  ])("does not confirm malformed or unexpected onboarding results: %#", async body => {
    const result = startStartup();
    startupPost().flush(body, { status: 201, statusText: "Created" });
    expect((await result).error).toMatchObject({ code: "UNCONFIRMED" });
  });

  it.each([[400, "INVALID_INPUT"], [403, "CSRF_ERROR"], [409, "DUPLICATE_EMAIL"], [500, "UNCONFIRMED"]])("handles startup HTTP %s without replay", async (status, code) => {
    const result = startStartup();
    startupPost().flush({ internal: "never-display" }, { status: Number(status), statusText: "Error" });
    expect((await result).error).toMatchObject({ code });
    http.expectNone("/api/v1/startups");
  });

  it("never posts startup data when CSRF is unavailable or malformed", async () => {
    const result = startStartup();
    http.expectOne("/csrf").flush({ headerName: "unexpected", token: "csrf" });
    expect((await result).error).toMatchObject({ code: "INVALID_RESPONSE" });
    http.expectNone("/api/v1/startups");
  });
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
      disponibilidades: [{ diaSemana: 1, periodo: "MANHA" }],
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
    const result = start({ ...input, mentor: { ...input.mentor, biografia: "a".repeat(1000), linkedin: " ", instagram: "", disponibilidades: [{ diaSemana: 1, periodo: "MANHA" }] } });
    const post = csrf();
    expect(JSON.parse(JSON.stringify(post.request.body))).toEqual({
      usuario: { nome: "Maria Teste", email: "maria@example.test", senha: input.senha }, biografia: "a".repeat(1000),
      disponibilidades: [{ diaSemana: 1, periodo: "MANHA" }],
    });
    post.flush({ ...response, linkedin: null, instagram: null }, { status: 201, statusText: "Created" });
    expect((await result).value?.mode).toBe("API");
  });

  it.each(["ADMIN"])("recusa %s antes de qualquer chamada de rede", async (kind) => {
    await expect(firstValueFrom(gateway.register(kind as ProfileKind, input))).rejects.toMatchObject({ code: "UNSUPPORTED_PROFILE" });
    http.expectNone(() => true);
  });

  it.each([{ ...input, senha: "curta" }, { ...input, mentor: undefined },
    { ...input, mentor: { biografia: "Mentora" } },
    { ...input, mentor: { biografia: "Mentora", disponibilidades: [] } },
    { ...input, mentor: { biografia: "Mentora", disponibilidades: [{ diaSemana: 8, periodo: "MANHA" as const }] } },
  ])("valida os dados antes de obter CSRF: caso %#", async (request) => {
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

