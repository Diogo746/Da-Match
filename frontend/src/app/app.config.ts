import {
  ApplicationConfig,
  provideZonelessChangeDetection,
} from "@angular/core";
import { provideHttpClient } from "@angular/common/http";
import { provideRouter, withInMemoryScrolling } from "@angular/router";
import { routes } from "./app.routes";
import {
  RegistrationGateway,
} from "./core/registration.gateway";
import { registrationGatewayFactory } from "./core/registration.config";
export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: "enabled" }),
    ),
    provideHttpClient(),
    { provide: RegistrationGateway, useFactory: registrationGatewayFactory },
  ],
};
