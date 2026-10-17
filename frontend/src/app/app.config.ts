import {
  ApplicationConfig,
  provideZonelessChangeDetection,
} from "@angular/core";
import { provideHttpClient } from "@angular/common/http";
import { provideRouter, withInMemoryScrolling } from "@angular/router";
import { routes } from "./app.routes";
import {
  RegistrationGateway,
  DemoRegistrationGateway,
} from "./core/registration.gateway";
export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: "enabled" }),
    ),
    provideHttpClient(),
    { provide: RegistrationGateway, useClass: DemoRegistrationGateway },
  ],
};
