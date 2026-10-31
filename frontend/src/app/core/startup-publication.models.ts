import { STARTUP_FIELDS, StartupPublicationStatus, isStartupPublicationStatus } from "./startup.models";
export { STARTUP_PUBLICATION_LABELS } from "./startup.models";
export type { StartupPublicationStatus } from "./startup.models";
export type StartupPendingCode = "CAMPO_OBRIGATORIO" | "CAMPO_INVALIDO" | "QUESTIONARIO_AUSENTE" |
  "QUESTIONARIO_INCOMPATIVEL" | "QUESTIONARIO_INVALIDO";
export interface StartupPublicationPending { codigo: StartupPendingCode; campo: string; mensagem: string; }
export interface StartupPublication {
  startupId: string;
  status: StartupPublicationStatus;
  aptoParaPublicacao: boolean;
  podeGerenciar: boolean;
  pendencias: StartupPublicationPending[];
}

export function readStartupPending(value: unknown): StartupPublicationPending[] {
  if (!Array.isArray(value)) throw new Error("Pendências inválidas.");
  const fields: string[] = [...STARTUP_FIELDS.map(field => field.key), "statusValidacao", "perfilMatch"];
  let previous = -1;
  return value.map(item => {
    if (!item || typeof item !== "object") throw new Error("Pendência inválida.");
    const { codigo, campo, mensagem } = item;
    const index = fields.indexOf(campo);
    const codes = campo === "perfilMatch"
      ? ["QUESTIONARIO_AUSENTE", "QUESTIONARIO_INCOMPATIVEL", "QUESTIONARIO_INVALIDO"]
      : ["CAMPO_OBRIGATORIO", "CAMPO_INVALIDO"];
    if (index <= previous || !codes.includes(codigo) || typeof mensagem !== "string" || !mensagem.trim()) {
      throw new Error("Pendência inválida.");
    }
    previous = index;
    return { codigo: codigo as StartupPendingCode, campo, mensagem };
  });
}

export function readStartupPublication(value: unknown, startupId: string): StartupPublication {
  if (!value || typeof value !== "object") throw new Error("Publicação inválida.");
  const data = value as Record<string, unknown>;
  if (data["startupId"] !== startupId || !isStartupPublicationStatus(data["status"]) ||
      typeof data["aptoParaPublicacao"] !== "boolean" || typeof data["podeGerenciar"] !== "boolean") {
    throw new Error("Publicação inválida.");
  }
  const pendencias = readStartupPending(data["pendencias"]);
  if (data["aptoParaPublicacao"] !== (pendencias.length === 0)) throw new Error("Aptidão inválida.");
  return { startupId, status: data["status"], aptoParaPublicacao: data["aptoParaPublicacao"],
    podeGerenciar: data["podeGerenciar"], pendencias };
}

export function readStartupPublicationConflict(value: unknown): StartupPublicationPending[] {
  if (!value || typeof value !== "object") throw new Error("Conflito inválido.");
  const data = value as Record<string, unknown>;
  if (data["status"] !== 409 || data["codigo"] !== "STARTUP_INCOMPLETA") throw new Error("Conflito inválido.");
  const pending = readStartupPending(data["pendencias"]);
  if (!pending.length) throw new Error("Conflito sem pendências.");
  return pending;
}
