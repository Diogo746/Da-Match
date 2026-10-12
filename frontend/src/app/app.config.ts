import {
  ApplicationConfig,
  provideZonelessChangeDetection,
} from "@angular/core";
import { provideHttpClient, withFetch } from "@angular/common/http";
import { provideRouter, withInMemoryScrolling } from "@angular/router";
import { routes } from "./app.routes";
import { AccessGateway, DemoAccessGateway } from "./core/access.gateway";
export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: "enabled" }),
    ),
    provideHttpClient(withFetch()),
    { provide: AccessGateway, useClass: DemoAccessGateway },
  ],
};
