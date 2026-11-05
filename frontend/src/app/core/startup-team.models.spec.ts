import { expect, it } from "vitest";
import { readInvitation, readInvitationPage } from "./startup-team.models";

const invitation = { id: "invitation", startupId: "project", nomeStartup: "Projeto", nomeConvidante: "Gestor",
  nomeDestinatario: "Pessoa", papelMembro: "MEMBRO", status: "PENDENTE", criadoEm: "2026-11-05T12:00:00Z", expiraEm: "2026-11-12T12:00:00Z" };

it("selects only the public invitation contract", () => {
  expect(readInvitation({ ...invitation, email: "private@example.test", senha: "secret" }, "project", "invitation")).toEqual(invitation);
});

it.each([null, 1, {}, { ...invitation, nomeDestinatario: " " }, { ...invitation, papelMembro: "FUNDADOR" },
  { ...invitation, status: "toString" }, { ...invitation, status: 1 }, { ...invitation, criadoEm: "bad" },
  { ...invitation, expiraEm: "bad" }, { ...invitation, expiraEm: invitation.criadoEm }])("rejects invalid invitation %#", value => {
  expect(() => readInvitation(value)).toThrow();
});

it("rejects another project or invitation", () => {
  expect(() => readInvitation(invitation, "other")).toThrow();
  expect(() => readInvitation(invitation, "project", "other")).toThrow();
});

const page = { itens: [invitation], pagina: 0, tamanho: 20, totalItens: 1, totalPaginas: 1 };
it("reads empty, first, last and out of range pages", () => {
  expect(readInvitationPage(page, 0, 20, "project")).toEqual(page);
  expect(readInvitationPage({ ...page, itens: [], totalItens: 0, totalPaginas: 0 }, 0, 20).itens).toEqual([]);
  expect(readInvitationPage({ ...page, pagina: 1, totalItens: 21, totalPaginas: 2 }, 1, 20).itens).toHaveLength(1);
  expect(readInvitationPage({ ...page, itens: [], pagina: 2 }, 2, 20).itens).toEqual([]);
});
it.each([null, "bad", {}, { ...page, pagina: 1 }, { ...page, tamanho: 50 }, { ...page, totalItens: -1 },
  { ...page, totalItens: 1.5 }, { ...page, totalPaginas: 2 }, { ...page, itens: [] },
  { ...page, itens: [invitation, invitation], totalItens: 2 }])("rejects invalid page %#", value => {
  expect(() => readInvitationPage(value, 0, 20)).toThrow();
});
