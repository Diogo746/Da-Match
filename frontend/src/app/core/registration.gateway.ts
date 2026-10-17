import { Injectable } from "@angular/core";
import { Observable, defer, delay, of, throwError } from "rxjs";
import { ProfileKind } from "./profiles.store";

// Campos declarados em CadastrarUsuarioRequest no backend enviado pela equipe.
export interface RegistrationRequest {
  nome: string;
  email: string;
  senha: string;
}

// Resultado da demonstração; não representa uma resposta HTTP da API.
export interface RegistrationReceipt {
  nome: string;
  email: string;
  tipoUsuario: ProfileKind;
  mode: "DEMO";
}

export class RegistrationError extends Error {
  constructor(readonly code: "INVALID_INPUT" | "DUPLICATE_EMAIL") {
    super(code);
  }
}

// O tipo é contexto do cadastro. O DTO contém apenas nome, email e senha.
// A implementação HTTP dependerá das rotas e respostas definidas pelo backend.
export abstract class RegistrationGateway {
  abstract register(
    tipoUsuario: ProfileKind,
    request: RegistrationRequest,
  ): Observable<RegistrationReceipt>;
}

@Injectable()
export class DemoRegistrationGateway extends RegistrationGateway {
  private readonly registeredEmails = new Set<string>();

  register(
    tipoUsuario: ProfileKind,
    request: RegistrationRequest,
  ): Observable<RegistrationReceipt> {
    return defer(() => {
      const nome = request.nome.trim();
      const email = request.email.trim().toLowerCase();
      if (
        nome.length < 4 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        request.senha.length < 6 ||
        request.senha.trim().length === 0 ||
        !["STARTUP", "MENTOR"].includes(tipoUsuario)
      ) {
        return throwError(() => new RegistrationError("INVALID_INPUT"));
      }
      if (this.registeredEmails.has(email)) {
        return throwError(() => new RegistrationError("DUPLICATE_EMAIL"));
      }
      // A senha é validada, mas não é armazenada nem incluída no resultado.
      this.registeredEmails.add(email);
      return of<RegistrationReceipt>({
        nome,
        email,
        tipoUsuario,
        mode: "DEMO",
      }).pipe(delay(450));
    });
  }
}
