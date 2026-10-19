package br.senac.fullstack.startup.api.dto;

import br.senac.fullstack.startup.domain.enums.StatusValidacao;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record StartupResponse(
        UUID id,
        String nomeProvisorio,
        String pitchCurto,
        String problemaCentral,
        String solucaoProposta,
        String publicoAlvo,
        String modeloDeNegocio,
        StatusValidacao statusValidacao,
        Instant dataCriacao,
        List<MembroStartupResponse> membros
) {
}
