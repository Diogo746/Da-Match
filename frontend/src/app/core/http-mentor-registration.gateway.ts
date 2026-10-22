import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable, TimeoutError, catchError, defer, map, switchMap, throwError, timeout } from "rxjs";
import { ProfileKind } from "./profile.models";
import { RegistrationError, RegistrationGateway, RegistrationReceipt, RegistrationRequest, normalizeRegistration } from "./registration.gateway";
import { readMentorProfile, validAvailability } from "./mentor.models";

const REQUEST_TIMEOUT_MS = 15000;

function csrfHeader(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || !("headerName" in value) ||
      !("token" in value) || value.headerName !== "X-XSRF-TOKEN" ||
      typeof value.token !== "string" || !value.token.trim()) {
    throw new RegistrationError("INVALID_RESPONSE");
  }
  return { [value.headerName]: value.token };
}

function translateError(error: unknown, sent: boolean): RegistrationError {
  if (error instanceof RegistrationError) return error;
  if (error instanceof TimeoutError) return new RegistrationError(sent ? "UNCONFIRMED" : "CONNECTION_ERROR");
  if (!(error instanceof HttpErrorResponse)) return new RegistrationError("SERVER_ERROR");
  if (error.status === 400) return new RegistrationError("INVALID_INPUT");
  if (error.status === 403) return new RegistrationError("CSRF_ERROR");
  if (sent && error.status === 409) return new RegistrationError("DUPLICATE_EMAIL");
  if (sent) return new RegistrationError("UNCONFIRMED");
  return new RegistrationError(error.status === 0 ? "CONNECTION_ERROR" : "SERVER_ERROR");
}

@Injectable({ providedIn: "root" })
export class HttpMentorRegistrationGateway extends RegistrationGateway {
  private readonly http = inject(HttpClient);

  register(kind: ProfileKind, input: RegistrationRequest): Observable<RegistrationReceipt> {
    return defer(() => {
      if (kind !== "MENTOR") throw new RegistrationError("UNSUPPORTED_PROFILE");
      const request = normalizeRegistration(kind, input);
      const { mentor, ...usuario } = request;
      if (!validAvailability(mentor?.disponibilidades)) throw new RegistrationError("INVALID_INPUT");
      // normalizeRegistration já validou a biografia para o tipo MENTOR.
      const payload = { usuario, ...mentor };
      let sent = false;
      return this.http.get<unknown>("/csrf").pipe(
        timeout(REQUEST_TIMEOUT_MS),
        map(csrfHeader),
        switchMap((headers) => {
          sent = true;
          return this.http.post<unknown>("/api/v1/mentores", payload, { headers, observe: "response" }).pipe(timeout(REQUEST_TIMEOUT_MS));
        }),
        map((response): RegistrationReceipt => {
          if (response.status !== 201) throw new RegistrationError("UNCONFIRMED");
          let mentor;
          try { mentor = readMentorProfile(response.body); }
          catch { throw new RegistrationError("UNCONFIRMED"); }
          return { nome: mentor.nome, email: mentor.email, tipoUsuario: "MENTOR", mode: "API", mentor };
        }),
        catchError((error: unknown) => throwError(() => translateError(error, sent))),
      );
    });
  }
}
