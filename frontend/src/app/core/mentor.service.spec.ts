import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, expect, it } from "vitest";
import { firstValueFrom } from "rxjs";
import { authInterceptor } from "./auth.interceptor";
import { REGISTRATION_MODE } from "./registration.config";
import { MentorService } from "./mentor.service";
import { readMentorProfile, validAvailability } from "./mentor.models";

const profile = {
  id: "mentor-test", usuarioId: "user-test", nome: "Pessoa Fictícia", email: "mentor@example.test",
  biografia: "Experiência com produtos.", linkedin: null, instagram: null, site: null,
  status: "RASCUNHO", disponibilidades: [{ diaSemana: 1, periodo: "MANHA" }], dataEntradaPlataforma: "2026-10-21",
};
let http: HttpTestingController;
let service: MentorService;
beforeEach(() => {
  TestBed.configureTestingModule({ providers: [
    provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting(),
    { provide: REGISTRATION_MODE, useValue: "API" },
  ] });
  http = TestBed.inject(HttpTestingController);
  service = TestBed.inject(MentorService);
});
afterEach(() => http.verify());

it("loads the current mentor without sending an actor identifier and discards unexpected fields", async () => {
  const result = firstValueFrom(service.me());
  const request = http.expectOne("/api/v1/mentores/me");
  expect(request.request.withCredentials).toBe(true);
  request.flush({ ...profile, senha: "do-not-propagate", token: "do-not-propagate" });
  expect(await result).toEqual(profile);
});

it("updates the selected profile with session cookies and CSRF, then publishes without changing identity", async () => {
  const body = { biografia: "Atualizada", linkedin: "", instagram: "", site: "",
    disponibilidades: [{ diaSemana: 2, periodo: "TARDE" as const }] };
  const result = firstValueFrom(service.update(profile.id, body));
  http.expectOne("/csrf").flush({ headerName: "X-XSRF-TOKEN", token: "csrf-ficticio" });
  const request = http.expectOne("/api/v1/mentores/mentor-test");
  expect(request.request.method).toBe("PATCH");
  expect(request.request.body).toEqual(body);
  expect(request.request.withCredentials).toBe(true);
  expect(request.request.headers.get("X-XSRF-TOKEN")).toBe("csrf-ficticio");
  request.flush({ ...profile, ...body });
  expect((await result).biografia).toBe("Atualizada");
  const published = firstValueFrom(service.setStatus(profile.id, "PUBLICADO"));
  const status = http.expectOne("/api/v1/mentores/mentor-test/status");
  expect(status.request.body).toEqual({ status: "PUBLICADO" });
  status.flush({ ...profile, status: "PUBLICADO" });
  expect((await published).status).toBe("PUBLICADO");
});

it.each([null, {}, { ...profile, status: "ADMIN" }, { ...profile, disponibilidades: [] }])(
  "rejects an invalid profile response: case %#", value => {
    expect(() => readMentorProfile(value)).toThrow("Resposta de perfil inválida");
  });

it.each([undefined, [], [{ diaSemana: 0, periodo: "MANHA" }], [{ diaSemana: 8, periodo: "MANHA" }],
  [{ diaSemana: 1.5, periodo: "MANHA" }], [{ diaSemana: 1, periodo: "INVALIDO" }],
  Array.from({ length: 22 }, () => ({ diaSemana: 1, periodo: "MANHA" }))])(
  "rejects missing or malformed availability: case %#", value => expect(validAvailability(value)).toBe(false));

it("keeps only typed social fields and handles optional nulls", () => {
  expect(readMentorProfile({ ...profile, linkedin: "perfil", instagram: "conta", site: "site" }))
    .toMatchObject({ linkedin: "perfil", instagram: "conta", site: "site" });
});
