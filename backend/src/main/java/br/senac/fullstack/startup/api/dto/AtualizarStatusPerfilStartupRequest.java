package br.senac.fullstack.startup.api.dto;

import br.senac.fullstack.startup.domain.enums.StatusPerfilStartup;
import jakarta.validation.constraints.NotNull;

public record AtualizarStatusPerfilStartupRequest(@NotNull StatusPerfilStartup status) {
}
