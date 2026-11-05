import { StartupMemberRole } from "./startup.models";

export type InvitationRole = Exclude<StartupMemberRole, "FUNDADOR">;
export const INVITATION_STATUS_LABELS = {
  PENDENTE: "Pendente", ACEITO: "Aceito", RECUSADO: "Recusado", CANCELADO: "Cancelado", EXPIRADO: "Expirado",
} as const;
export const MEMBER_ROLE_LABELS: Record<StartupMemberRole, string> = {
  FUNDADOR: "Fundador(a)", REPRESENTANTE: "Representante", MEMBRO: "Membro",
};
export interface StartupInvitation {
  id: string;
  startupId: string;
  nomeStartup: string;
  nomeConvidante: string;
  nomeDestinatario: string;
  papelMembro: InvitationRole;
  status: keyof typeof INVITATION_STATUS_LABELS;
  criadoEm: string;
  expiraEm: string;
}
export interface InvitationPage {
  itens: StartupInvitation[];
  pagina: number;
  tamanho: number;
  totalItens: number;
  totalPaginas: number;
}
export interface CreateInvitation {
  solicitacaoId: string;
  email: string;
  papelMembro: InvitationRole;
}
export type TeamOperation =
  | { kind: "create"; project: string; request: CreateInvitation }
  | { kind: "remove"; project: string; userId: string; name: string }
  | { kind: "accept" | "refuse" | "cancel"; invitation: StartupInvitation };

export function readInvitation(value: unknown, project?: string, id?: string): StartupInvitation {
  if (!value || typeof value !== "object") throw new Error("Convite inválido.");
  const data = value as Record<string, unknown>;
  if (!["id", "startupId", "nomeStartup", "nomeConvidante", "nomeDestinatario", "criadoEm", "expiraEm"]
    .every(key => typeof data[key] === "string" && (data[key] as string).trim()) ||
    !["MEMBRO", "REPRESENTANTE"].includes(String(data["papelMembro"])) ||
    typeof data["status"] !== "string" || !Object.hasOwn(INVITATION_STATUS_LABELS, data["status"]) ||
    !Number.isFinite(Date.parse(String(data["criadoEm"]))) || !Number.isFinite(Date.parse(String(data["expiraEm"])))) {
    throw new Error("Convite inválido.");
  }
  if (Date.parse(String(data["expiraEm"])) <= Date.parse(String(data["criadoEm"])) ||
    project !== undefined && data["startupId"] !== project || id !== undefined && data["id"] !== id) {
    throw new Error("Convite diferente do solicitado.");
  }
  return {
    id: data["id"] as string, startupId: data["startupId"] as string,
    nomeStartup: data["nomeStartup"] as string, nomeConvidante: data["nomeConvidante"] as string,
    nomeDestinatario: data["nomeDestinatario"] as string, papelMembro: data["papelMembro"] as InvitationRole,
    status: data["status"] as StartupInvitation["status"], criadoEm: data["criadoEm"] as string,
    expiraEm: data["expiraEm"] as string,
  };
}

export function readInvitationPage(value: unknown, page: number, size: number, project?: string): InvitationPage {
  if (!value || typeof value !== "object") throw new Error("Lista de convites inválida.");
  const data = value as Record<string, unknown>;
  if (!Array.isArray(data["itens"]) || data["pagina"] !== page || data["tamanho"] !== size ||
    !Number.isSafeInteger(data["totalItens"]) || (data["totalItens"] as number) < 0 ||
    data["totalPaginas"] !== Math.ceil((data["totalItens"] as number) / size)) throw new Error("Página inválida.");
  const itens = data["itens"].map(item => readInvitation(item, project));
  if (itens.length !== Math.min(size, Math.max(0, (data["totalItens"] as number) - page * size)) ||
    new Set(itens.map(item => item.id)).size !== itens.length) throw new Error("Página incompleta ou duplicada.");
  return { itens, pagina: page, tamanho: size, totalItens: data["totalItens"] as number,
    totalPaginas: data["totalPaginas"] as number };
}
