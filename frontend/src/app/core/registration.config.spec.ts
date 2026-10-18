import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting, HttpTestingController } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { expect, it } from "vitest";
import { HttpMentorRegistrationGateway } from "./http-mentor-registration.gateway";
import { RegistrationGateway } from "./registration.gateway";
import { REGISTRATION_MODE, registrationGatewayFactory } from "./registration.config";

it("abre em demonstração quando nenhum modo conectado foi configurado", () => {
  expect(TestBed.inject(REGISTRATION_MODE)).toBe("DEMO");
});

it.each(["DEMO", "API"] as const)("seleciona %s sem fazer chamadas antecipadas", (mode) => {
  TestBed.configureTestingModule({ providers: [
    provideHttpClient(), provideHttpClientTesting(),
    { provide: REGISTRATION_MODE, useValue: mode },
    { provide: RegistrationGateway, useFactory: registrationGatewayFactory },
  ] });
  expect(TestBed.inject(RegistrationGateway) instanceof HttpMentorRegistrationGateway).toBe(mode === "API");
  TestBed.inject(HttpTestingController).verify();
});
