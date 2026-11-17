package br.senac.fullstack.matching.api.dto;

import br.senac.fullstack.matching.domain.DadosMatching;
import br.senac.fullstack.matching.domain.ResultadoMatching;

import java.time.Instant;
import java.util.UUID;

public record RelatorioMatchingResponse(String versaoRegra, Instant calculadoEm, Fonte startup, Fonte mentor,
        ResultadoMatching calculo, boolean elegivel, boolean indicado, boolean superDamatch) {
    public record Fonte(UUID id, Instant questionarioAtualizadoEm, String revisao, DadosMatching dados) { }
}
