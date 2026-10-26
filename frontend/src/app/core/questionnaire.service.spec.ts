import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { firstValueFrom } from "rxjs";
import { afterEach, beforeEach, expect, it } from "vitest";
import { authInterceptor } from "./auth.interceptor";
import { ProfileDraft, QUESTIONNAIRE_VERSION, emptyProfile } from "./profile.models";
import { REGISTRATION_MODE } from "./registration.config";
import { QuestionnaireService, readQuestionnaire } from "./questionnaire.service";

const draft: ProfileDraft = { ...emptyProfile("STARTUP"), moments: ["PROBLEM"], sectors: ["TECH"],
  topics: ["VALIDATION", "PRICING"], audiences: ["B2C"], backgrounds: ["TECH"],
  format: "ONLINE", cadence: "FLEXIBLE", availability: [{ day: "THU", period: "EVENING" }], projectName: "Ideia" };
const body = { ...draft, questionnaireVersion: QUESTIONNAIRE_VERSION };
let http: HttpTestingController;
let service: QuestionnaireService;
beforeEach(() => {
  TestBed.configureTestingModule({ providers: [provideHttpClient(withInterceptors([authInterceptor])),
    provideHttpClientTesting(), { provide: REGISTRATION_MODE, useValue: "API" }] });
  http = TestBed.inject(HttpTestingController); service = TestBed.inject(QuestionnaireService);
});
afterEach(() => http.verify());

it("loads only the selected profile with credentials, retaining ordered priorities and stripping extra fields", async () => {
  const result = firstValueFrom(service.load("STARTUP", "project-test"));
  const request = http.expectOne("/api/v1/startups/project-test/perfil-match");
  expect(request.request.withCredentials).toBe(true);
  request.flush({ ...body, senha: "unexpected", score: 100, updatedAt: "2026-10-26T12:00:00Z" });
  expect(await result).toEqual(draft);
});

it("sends PUT with CSRF, only answer fields and no client actor", async () => {
  const result = firstValueFrom(service.save("STARTUP", "project-test", { ...draft, senha: "unexpected" } as ProfileDraft));
  http.expectOne("/csrf").flush({ headerName: "X-XSRF-TOKEN", token: "test-token" });
  const request = http.expectOne("/api/v1/startups/project-test/perfil-match");
  expect(request.request.method).toBe("PUT");
  expect(request.request.headers.get("X-XSRF-TOKEN")).toBe("test-token");
  expect(request.request.body).toEqual({ ...body, capacity: null });
  request.flush(body); expect(await result).toEqual(draft);
});

it("treats only 204 as a questionnaire not yet filled", async () => {
  const result = firstValueFrom(service.load("MENTOR", "mentor-test"));
  http.expectOne("/api/v1/mentores/mentor-test/perfil-match").flush(null, { status: 204, statusText: "No Content" });
  expect(await result).toBeNull();
});

it("accepts mentor capacity, experience and paused intake without publishing", () => {
  const mentor = { ...body, kind: "MENTOR", projectName: "", topics: ["VALIDATION"],
    capacity: "MANY", experience: { VALIDATION: "PRACTICAL" }, accepting: false };
  expect(readQuestionnaire(mentor, "MENTOR").accepting).toBe(false);
});

it.each([
  null, {}, { ...body, questionnaireVersion: "v2" }, { ...body, kind: "MENTOR" },
  { ...body, moments: null }, { ...body, sectors: ["TECH", "TECH"] }, { ...body, projectName: "x".repeat(61) },
  { ...body, topics: ["INVALID"] }, { ...body, availability: [null] }, { ...body, experience: [] },
  { ...body, availability: [{ day: "THU", period: "INVALID" }] },
  { ...body, availability: [...draft.availability, ...draft.availability] },
  { ...body, audiences: ["UNKNOWN", "B2C"] }, { ...body, cityId: "INVALID" },
  { ...body, cityId: "PE_RECIFE" }, { ...body, capacity: "ONE" }, { ...body, accepting: false },
  { ...body, experience: { VALIDATION: "PRACTICAL" } },
])("rejects incompatible or malformed answers, case %#", value => {
  expect(() => readQuestionnaire(value, "STARTUP")).toThrow();
});

it.each([200, 201])("rejects missing or unexpected load responses (%s)", async status => {
  const result = firstValueFrom(service.load("STARTUP", "id"));
  const rejected = expect(result).rejects.toThrow();
  http.expectOne("/api/v1/startups/id/perfil-match").flush(null, { status, statusText: "Unexpected" });
  await rejected;
});

it("rejects unexpected write status without replay", async () => {
  const result = firstValueFrom(service.save("STARTUP", "id", draft));
  const rejected = expect(result).rejects.toThrow();
  http.expectOne("/csrf").flush({ headerName: "X-XSRF-TOKEN", token: "test-token" });
  http.expectOne("/api/v1/startups/id/perfil-match").flush(body, { status: 201, statusText: "Unexpected" });
  await rejected;
  http.expectNone("/api/v1/startups/id/perfil-match");
});

it("rejects invalid answers before making a request", () => {
  expect(() => service.save("STARTUP", "id", emptyProfile("STARTUP"))).toThrow();
  http.expectNone("/csrf");
});
