export type StartupValidationStatus = "APENAS_IDEIA" | "PESQUISA_MERCADO";
export type StartupMemberRole = "FUNDADOR" | "REPRESENTANTE" | "MEMBRO";

export interface StartupRegistrationDetails {
  nomeProvisorio: string;
  pitchCurto: string;
  problemaCentral: string;
  solucaoProposta: string;
  publicoAlvo: string;
  modeloDeNegocio: string;
  statusValidacao: StartupValidationStatus;
}

export const STARTUP_FIELDS = [
  { key: "nomeProvisorio", label: "Nome da startup ou projeto", maxLength: 255, multiline: false, help: "Pode ser um nome provisório." },
  { key: "pitchCurto", label: "Resumo da ideia", maxLength: 255, multiline: true, help: "Explique sua ideia em uma ou duas frases." },
  { key: "problemaCentral", label: "Qual problema você quer resolver?", maxLength: 5000, multiline: true, help: "Descreva a dificuldade que motivou seu projeto." },
  { key: "solucaoProposta", label: "Qual é a solução proposta?", maxLength: 5000, multiline: true, help: "Conte como sua ideia pode ajudar a resolver esse problema." },
  { key: "publicoAlvo", label: "Quem você pretende ajudar?", maxLength: 255, multiline: true, help: "Descreva o público que pode se beneficiar." },
  { key: "modeloDeNegocio", label: "Como a ideia pode se sustentar?", maxLength: 255, multiline: true, help: "Se ainda não definiu o modelo de negócio, conte sua hipótese inicial." },
] as const;

export const STARTUP_STATUS_LABELS: Record<StartupValidationStatus, string> = {
  APENAS_IDEIA: "Tenho uma ideia inicial",
  PESQUISA_MERCADO: "Já estou pesquisando o mercado",
};

export interface StartupMember {
  id: string;
  usuarioId: string;
  nomeUsuario: string;
  papelMembro: StartupMemberRole;
  dataEntrada: string;
}

export interface StartupProfile extends StartupRegistrationDetails {
  id: string;
  dataCriacao: string;
  membros: StartupMember[];
}

export function validStartupDetails(value: unknown): value is StartupRegistrationDetails {
  if (!value || typeof value !== "object") return false;
  const data = value as Record<string, unknown>;
  return STARTUP_FIELDS.every(field => {
    const text = data[field.key];
    return typeof text === "string" && text.trim().length > 0 && text.length <= field.maxLength;
  }) && ["APENAS_IDEIA", "PESQUISA_MERCADO"].includes(String(data["statusValidacao"]));
}

// Pick known fields: roles, user IDs and any unexpected properties never enter the request.
export function normalizeStartupDetails(value: StartupRegistrationDetails): StartupRegistrationDetails {
  return {
    nomeProvisorio: value.nomeProvisorio.trim(), pitchCurto: value.pitchCurto.trim(),
    problemaCentral: value.problemaCentral.trim(), solucaoProposta: value.solucaoProposta.trim(),
    publicoAlvo: value.publicoAlvo.trim(), modeloDeNegocio: value.modeloDeNegocio.trim(),
    statusValidacao: value.statusValidacao,
  };
}

export function readStartupProfile(value: unknown): StartupProfile {
  if (!value || typeof value !== "object" || !validStartupDetails(value)) throw new Error("Resposta de startup inválida.");
  const data = value as unknown as Record<string, unknown>;
  if (typeof data["id"] !== "string" || !data["id"] || typeof data["dataCriacao"] !== "string" ||
      !Number.isFinite(Date.parse(data["dataCriacao"])) || !Array.isArray(data["membros"]) || !data["membros"].length) {
    throw new Error("Resposta de startup inválida.");
  }
  const membros: StartupMember[] = data["membros"].map((value: unknown) => {
    if (!value || typeof value !== "object") throw new Error("Integrante inválido.");
    const member = value as Record<string, unknown>;
    if (!["id", "usuarioId", "nomeUsuario", "dataEntrada"].every(key => typeof member[key] === "string" && member[key]) ||
        !["FUNDADOR", "REPRESENTANTE", "MEMBRO"].includes(String(member["papelMembro"]))) throw new Error("Integrante inválido.");
    return { id: member["id"] as string, usuarioId: member["usuarioId"] as string,
      nomeUsuario: member["nomeUsuario"] as string, papelMembro: member["papelMembro"] as StartupMemberRole,
      dataEntrada: member["dataEntrada"] as string };
  });
  return { ...normalizeStartupDetails(value), id: data["id"], dataCriacao: data["dataCriacao"], membros };
}
