import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { HttpErrorResponse } from "@angular/common/http";
import { catchError, map, of } from "rxjs";
import { AuthService } from "./auth.service";
import { REGISTRATION_MODE } from "./registration.config";

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  if (inject(REGISTRATION_MODE) !== "API") return router.createUrlTree(["/"]);
  return inject(AuthService).me().pipe(
    map(() => true),
    catchError((error: unknown) => of(router.createUrlTree(["/entrar"], {
      queryParams: error instanceof HttpErrorResponse && error.status === 401 ? {} : { unavailable: "1" },
    }))),
  );
};

// The existing profile editor is a demo; API mode has a separate authenticated account page.
export const demoProfileGuard: CanActivateFn = () =>
  inject(REGISTRATION_MODE) === "DEMO" ? true : inject(Router).createUrlTree(["/conta"]);
