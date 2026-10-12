import { Injectable } from "@angular/core";
import { Observable, defer, delay, of, throwError } from "rxjs";
import { ProfileKind } from "./profiles.store";
export interface AccessRequest {
  name: string;
  email: string;
  kind: ProfileKind;
}
export interface AccessReceipt {
  protocol: string;
  status: "PENDENTE";
  name: string;
  kind: ProfileKind;
}
export class AccessRequestError extends Error {
  constructor(readonly code: "INVALID_INPUT" | "DUPLICATE_EMAIL") {
    super(code);
  }
}
// Fronteira para a futura implementação HTTP, após definição do contrato da API.
export abstract class AccessGateway {
  abstract submit(request: AccessRequest): Observable<AccessReceipt>;
}
@Injectable()
export class DemoAccessGateway extends AccessGateway {
  private readonly registeredEmails = new Set<string>();
  submit(request: AccessRequest): Observable<AccessReceipt> {
    return defer(() => {
      const name = request.name.trim();
      const email = request.email.trim().toLowerCase();
      if (
        name.length === 0 ||
        name.length > 120 ||
        email.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        !["STARTUP", "MENTOR", "INVESTIDOR"].includes(request.kind)
      ) {
        return throwError(() => new AccessRequestError("INVALID_INPUT"));
      }
      if (this.registeredEmails.has(email))
        return throwError(() => new AccessRequestError("DUPLICATE_EMAIL"));
      this.registeredEmails.add(email);
      return of<AccessReceipt>({
        protocol: `DEMO-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
        status: "PENDENTE",
        name,
        kind: request.kind,
      }).pipe(delay(450));
    });
  }
}
