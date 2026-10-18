import { InjectionToken, inject } from "@angular/core";
import { environment } from "../../environments/environment";
import { DemoRegistrationGateway, RegistrationGateway } from "./registration.gateway";
import { HttpMentorRegistrationGateway } from "./http-mentor-registration.gateway";

export type RegistrationMode = "DEMO" | "API";
export const REGISTRATION_MODE = new InjectionToken<RegistrationMode>("registrationMode", {
  providedIn: "root",
  factory: () => environment.registrationMode,
});

export function registrationGatewayFactory(): RegistrationGateway {
  return inject(REGISTRATION_MODE) === "API"
    ? inject(HttpMentorRegistrationGateway)
    : inject(DemoRegistrationGateway);
}
