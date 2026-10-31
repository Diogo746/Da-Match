import { expect, it } from "vitest";
import { readStartupPending, readStartupPublication, readStartupPublicationConflict } from "./startup-publication.models";

const pending = { codigo: "QUESTIONARIO_AUSENTE", campo: "perfilMatch", mensagem: "Preencha e salve o questionário desta startup." };
const publication = { startupId: "project", status: "RASCUNHO", aptoParaPublicacao: false, podeGerenciar: true, pendencias: [pending] };

it("reads only the publication contract, including legacy published profiles with pending answers", () => {
  expect(readStartupPublication({ ...publication, token: "never-copy",
    pendencias: [{ ...pending, answers: "never-copy" }] }, "project")).toEqual(publication);
  expect(readStartupPublication({ ...publication, status: "PUBLICADO" }, "project").aptoParaPublicacao).toBe(false);
  expect(readStartupPublication({ ...publication, aptoParaPublicacao: true, pendencias: [], podeGerenciar: false }, "project"))
    .toMatchObject({ aptoParaPublicacao: true, podeGerenciar: false, pendencias: [] });
});

it.each([null, {}, { ...publication, startupId: "another" }, { ...publication, status: undefined },
  { ...publication, status: "INVALID" }, { ...publication, aptoParaPublicacao: "false" },
  { ...publication, podeGerenciar: 1 }, { ...publication, pendencias: null },
  { ...publication, aptoParaPublicacao: true }, { ...publication, pendencias: [] },
])("rejects malformed or inconsistent publication: %#", value => {
  expect(() => readStartupPublication(value, "project")).toThrow();
});

it.each([null, [null], [{ ...pending, campo: "usuario" }], [{ ...pending, codigo: "UNKNOWN" }],
  [{ ...pending, mensagem: " " }], [{ ...pending, mensagem: 42 }], [pending, pending],
  [{ ...pending, codigo: "CAMPO_OBRIGATORIO" }], [{ ...pending, campo: "nomeProvisorio" }],
  [pending, { codigo: "CAMPO_INVALIDO", campo: "pitchCurto", mensagem: "Revise." }],
])("rejects unsafe codes, missing messages, repeated fields and invalid order: %#", value => {
  expect(() => readStartupPending(value)).toThrow();
});

it("accepts ordered field corrections and the specific publication conflict only", () => {
  const ordered = [{ codigo: "CAMPO_OBRIGATORIO", campo: "nomeProvisorio", mensagem: "Preencha." },
    { codigo: "CAMPO_INVALIDO", campo: "statusValidacao", mensagem: "Revise." }, pending];
  expect(readStartupPending(ordered)).toEqual(ordered);
  expect(readStartupPublicationConflict({ status: 409, codigo: "STARTUP_INCOMPLETA", pendencias: ordered })).toEqual(ordered);
});

it.each([null, {}, { status: 400, codigo: "STARTUP_INCOMPLETA", pendencias: [pending] },
  { status: 409, codigo: "OTHER", pendencias: [pending] }, { status: 409, codigo: "STARTUP_INCOMPLETA", pendencias: [] },
])("does not convert a malformed conflict into confirmed pending requirements: %#", value => {
  expect(() => readStartupPublicationConflict(value)).toThrow();
});
