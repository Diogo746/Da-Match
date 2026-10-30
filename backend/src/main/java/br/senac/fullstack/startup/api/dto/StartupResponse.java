package br.senac.fullstack.startup.api.dto;

import br.senac.fullstack.startup.domain.enums.StatusValidacao;
import br.senac.fullstack.startup.domain.enums.StatusPerfilStartup;

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
        StatusPerfilStartup status,
        Instant dataCriacao,
        List<MembroStartupResponse> membros
) {
}
