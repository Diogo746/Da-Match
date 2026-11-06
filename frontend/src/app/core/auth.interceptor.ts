import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from "@angular/common/http";
import { inject } from "@angular/core";
import { Observable, catchError, of, switchMap, throwError } from "rxjs";
import { API_BASE_URL } from "./auth.config";
import { AuthStateStore } from "./auth-state.store";
import { CsrfService } from "./csrf.service";
import { REGISTRATION_MODE } from "./registration.config";
import { AuthRenewalService } from "./auth-renewal.service";

function sendWithReadRecovery(request: HttpRequest<unknown>, outgoing: HttpRequest<unknown>, next: HttpHandlerFn,
  renewal: AuthRenewalService, state: AuthStateStore, session: number) {
  return next(outgoing).pipe(catchError((error: unknown) => {
    if (!(error instanceof HttpErrorResponse) || error.status !== 401 || session !== state.revision() ||
        !renewal.canRecover(request.method, error.headers)) return throwError(() => error);
    return renewal.refresh().pipe(switchMap(() => {
      if (session !== state.revision()) return throwError(() => new Error("A sessão mudou durante a consulta."));
      // Only a failed GET is repeated. No mutation is replayed after an error.
      return next(outgoing);
    }));
  }));
}

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const mode = inject(REGISTRATION_MODE);
  const baseUrl = inject(API_BASE_URL);
  const state = inject(AuthStateStore);
  const csrf = inject(CsrfService);
  const localApi = request.url === "/csrf" || request.url.startsWith("/csrf?") || request.url.startsWith("/api/v1/");
  if (mode !== "API" || !localApi) return next(request);
  const renewal = inject(AuthRenewalService);
  const session = state.revision();

  const needsToken = !["GET", "HEAD", "OPTIONS"].includes(request.method) && !request.headers.has("X-XSRF-TOKEN");
  const token: Observable<string | null> = needsToken ? csrf.getToken() : of(null);
  return renewal.beforeRequest(request.url).pipe(
    switchMap(() => token),
    switchMap((value) => {
      if (session !== state.revision()) return throwError(() => new Error("A sessão mudou antes do envio."));
      const outgoing = request.clone({
        url: `${baseUrl}${request.url}`,
        withCredentials: true,
        ...(value ? { setHeaders: { "X-XSRF-TOKEN": value } } : {}),
      });
      return sendWithReadRecovery(request, outgoing, next, renewal, state, session);
    }),
    catchError((error: unknown) => {
      if (session !== state.revision()) return throwError(() => error);
      if (error instanceof HttpErrorResponse && error.status === 401) {
        state.setUser(null);
        state.notice.set("Entre na sua conta para continuar.");
        csrf.clear();
      }
      if (error instanceof HttpErrorResponse && error.status === 403) {
        state.notice.set("Você não tem permissão ou a proteção do envio expirou. Confira sua sessão e tente novamente.");
        csrf.clear();
      }
      // Never retry writes automatically: the caller decides whether to send a new request.
      return throwError(() => error);
    }),
  );
};
