package br.senac.fullstack.startup.api.dto;

import br.senac.fullstack.startup.domain.PendenciaPublicacaoStartup;
import br.senac.fullstack.startup.domain.enums.StatusPerfilStartup;

import java.util.List;
import java.util.UUID;

public record PublicacaoStartupResponse(UUID startupId, StatusPerfilStartup status,
        boolean aptoParaPublicacao, boolean podeGerenciar, List<PendenciaPublicacaoStartup> pendencias) {
    public PublicacaoStartupResponse {
        pendencias = List.copyOf(pendencias);
    }
}
