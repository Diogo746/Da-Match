export type MentorPeriod = "MANHA" | "TARDE" | "NOITE";
export type MentorStatus = "RASCUNHO" | "PUBLICADO" | "PAUSADO";
export interface MentorAvailability { diaSemana: number; periodo: MentorPeriod }

export interface MentorProfile {
  id: string;
  usuarioId: string;
  nome: string;
  email: string;
  biografia: string;
  linkedin: string | null;
  instagram: string | null;
  site: string | null;
  dataEntradaPlataforma: string;
  disponibilidades: MentorAvailability[];
  status: MentorStatus;
}

export function validAvailability(value: unknown): value is MentorAvailability[] {
  return Array.isArray(value) && value.length > 0 && value.length <= 21 && value.every(item =>
    item && Number.isInteger(item.diaSemana) && item.diaSemana >= 1 && item.diaSemana <= 7 &&
    ["MANHA", "TARDE", "NOITE"].includes(item.periodo));
}

export function readMentorProfile(value: unknown): MentorProfile {
  if (!value || typeof value !== "object") throw new Error("Resposta de perfil inválida.");
  const data = value as Record<string, unknown>;
  if (!["id", "usuarioId", "nome", "email", "biografia", "dataEntradaPlataforma"]
    .every(key => typeof data[key] === "string" && data[key]) ||
    !["RASCUNHO", "PUBLICADO", "PAUSADO"].includes(String(data["status"])) ||
    !validAvailability(data["disponibilidades"])) throw new Error("Resposta de perfil inválida.");
  return {
    id: data["id"] as string, usuarioId: data["usuarioId"] as string,
    nome: data["nome"] as string, email: data["email"] as string,
    biografia: data["biografia"] as string, dataEntradaPlataforma: data["dataEntradaPlataforma"] as string,
    linkedin: typeof data["linkedin"] === "string" ? data["linkedin"] : null,
    instagram: typeof data["instagram"] === "string" ? data["instagram"] : null,
    site: typeof data["site"] === "string" ? data["site"] : null,
    status: data["status"] as MentorStatus,
    disponibilidades: data["disponibilidades"].map(item => ({ diaSemana: item.diaSemana, periodo: item.periodo })),
  };
}
