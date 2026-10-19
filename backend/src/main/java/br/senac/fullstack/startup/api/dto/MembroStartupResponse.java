package br.senac.fullstack.startup.api.dto;

import br.senac.fullstack.startup.domain.enums.PapelMembroStartup;

import java.time.LocalDate;
import java.util.UUID;

public record MembroStartupResponse(
        UUID id,
        UUID usuarioId,
        String nomeUsuario,
        PapelMembroStartup papelMembro,
        LocalDate dataEntrada
) {
}
