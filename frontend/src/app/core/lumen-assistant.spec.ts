import { describe, it, expect } from "vitest";
import { lumenReply } from "./lumen-assistant";
import { helpTopics } from "./lumen-topics";

describe("Lumen e as dúvidas do DaMatch", () => {
  for (const topic of helpTopics) {
    it("reconhece a sugestão: " + topic.prompt, () => {
      expect(lumenReply(topic.prompt, false)).toBe(topic.answer);
      expect(lumenReply(topic.prompt, true)).toBe(topic.demo ?? topic.answer);
    });
  }
  it("interpreta paráfrases e acentos e separa convites de equipe e match", () => {
    expect(lumenReply("Onde encontro os CONVITES da equipe?", false)).toContain("Convites recebidos");
    expect(lumenReply("consigo editar o questionario?", false)).toContain("revisar");
    expect(lumenReply("afinidade entre perfis?", true)).toContain("compatibilidade");
  });
  it("admite dúvidas fora do domínio e entradas vazias", () => {
    for (const unknown of ["", "quanto custa o dólar hoje?", "!?"]) expect(lumenReply(unknown, true)).toContain("Não reconheci");
  });
});
