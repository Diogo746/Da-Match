package br.senac.fullstack.startup.api.dto;

import br.senac.fullstack.startup.domain.enums.PapelMembroStartup;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AdicionarMembroStartupRequest(
        @NotNull UUID usuarioId,
        @NotNull PapelMembroStartup papelMembro
) {
}
