import { Injectable } from "@angular/core";
import { FormControl, Validators } from "@angular/forms";
import { Observable, defer, delay, of, throwError } from "rxjs";
import { ProfileKind } from "./profiles.store";
import { MentorAvailability, MentorProfile, validAvailability } from "./mentor.models";

// Campos declarados em CadastrarUsuarioRequest no backend enviado pela equipe.
export interface RegistrationRequest {
  nome: string;
  email: string;
  senha: string;
  mentor?: MentorRegistrationDetails;
}

export interface MentorRegistrationDetails {
  disponibilidades?: MentorAvailability[];
  biografia: string;
  linkedin?: string;
  instagram?: string;
}

export type MentorAccount = MentorProfile;

interface DemoRegistrationReceipt {
  nome: string;
  email: string;
  tipoUsuario: ProfileKind;
  mode: "DEMO";
}

interface ApiRegistrationReceipt {
  nome: string;
  email: string;
  tipoUsuario: "MENTOR";
  mode: "API";
  mentor: MentorAccount;
}

export type RegistrationReceipt = DemoRegistrationReceipt | ApiRegistrationReceipt;

export type RegistrationErrorCode = "INVALID_INPUT" | "DUPLICATE_EMAIL" |
  "UNSUPPORTED_PROFILE" | "CONNECTION_ERROR" | "CSRF_ERROR" |
  "SERVER_ERROR" | "INVALID_RESPONSE" | "UNCONFIRMED";

export class RegistrationError extends Error {
  constructor(readonly code: RegistrationErrorCode) {
    super(code);
  }
}

// A implementação HTTP aceita somente os contratos já disponíveis no backend.
export abstract class RegistrationGateway {
  abstract register(
    tipoUsuario: ProfileKind,
    request: RegistrationRequest,
  ): Observable<RegistrationReceipt>;
}

function isValidEmail(email: string): boolean {
  return email.length <= 254 &&
    Validators.email(new FormControl(email)) === null &&
    email.slice(email.lastIndexOf("@") + 1).includes(".");
}

export function validMentorBiography(value: string): boolean {
  return value.trim().length > 0 && value.length <= 1000;
}

export function normalizeRegistration(kind: ProfileKind, request: RegistrationRequest): RegistrationRequest {
  const nome = request.nome.trim();
  const email = request.email.trim().toLowerCase();
  if (nome.length < 4 || nome.length > 255 || !isValidEmail(email) || request.senha.length < 6 || request.senha.length > 72 ||
      request.senha.trim().length === 0 || !["STARTUP", "MENTOR"].includes(kind)) {
    throw new RegistrationError("INVALID_INPUT");
  }
  const account = { nome, email, senha: request.senha };
  if (kind !== "MENTOR") return account;
  const details = request.mentor;
  if (!details || !validMentorBiography(details.biografia) ||
      (details.disponibilidades !== undefined && !validAvailability(details.disponibilidades)) ||
      [details.linkedin, details.instagram].some(value => value !== undefined && value.length > 255)) {
    throw new RegistrationError("INVALID_INPUT");
  }
  return { ...account, mentor: {
    biografia: details.biografia.trim(),
    linkedin: details.linkedin?.trim() || undefined,
    instagram: details.instagram?.trim() || undefined,
    ...(details.disponibilidades ? { disponibilidades: details.disponibilidades.map(item => ({ diaSemana: item.diaSemana, periodo: item.periodo })) } : {}),
  } };
}

@Injectable({ providedIn: "root" })
export class DemoRegistrationGateway extends RegistrationGateway {
  private readonly registeredEmails = new Set<string>();

  register(
    tipoUsuario: ProfileKind,
    request: RegistrationRequest,
  ): Observable<RegistrationReceipt> {
    return defer(() => {
      const { nome, email } = normalizeRegistration(tipoUsuario, request);
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
